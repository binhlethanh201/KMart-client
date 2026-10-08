import { useState, useEffect, useRef } from 'react';
import { useApproval } from '../../../context/useApproval';
import { documentTypeService } from '../../../services/documentTypeService';
import { useI18n } from '../../../i18n/I18nProvider';
import describeApiError from '../../../utils/apiError';
import Select from '../../../components/Select';

function Toggle({ checked, onChange, label, disabled }) {
  return (
    <button
      type="button"
      onClick={() => { if (!disabled) onChange(!checked); }}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${
        checked ? 'bg-primary' : 'bg-surface-container-highest'
      }`}
      aria-pressed={checked}
      aria-label={label}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

export default function FormTemplatesTab() {
  const { t, language } = useI18n();
  const { formFields: fields, setFormFields: setFields, pushToast } = useApproval();

  const [categories, setCategories] = useState([]);

  const [documentTypes, setDocumentTypes] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  /** BE-134: mẫu đơn đang chờ xác nhận xóa trong hộp thoại (thay window.confirm). */
  const [deleteTarget, setDeleteTarget] = useState(null);

  /**
   * BE-84: bản sao mới nhất của `documentTypes` để dùng trong callback bất đồng bộ (sau khi tạo mẫu
   * đơn) mà không phụ thuộc vào giá trị đã đóng gói lúc gọi API.
   */
  const documentTypesRef = useRef(documentTypes);
  useEffect(() => { documentTypesRef.current = documentTypes; }, [documentTypes]);

  useEffect(() => {
    documentTypeService.getAll().then(data => {
      setDocumentTypes(data || []);
      setCategories(buildCategories(data || []));
      /*
       * BE-86: chỉ giữ field cho những mẫu đơn CÒN tồn tại trên server.
       * Trước đây hàm này bắt đầu từ `{ ...fields }` (bản lưu trong phiên) rồi chỉ THÊM dữ liệu mới,
       * nên khoá của mẫu đơn đã xoá vẫn nằm lại trong cache. Khi tạo mẫu đơn mới TRÙNG TÊN với mẫu đơn
       * đã xoá, khoá cũ đó được dùng lại -> mẫu đơn mới hiện luôn field của mẫu đơn cũ (nhìn như tự
       * nhảy sang mẫu đơn khác). Nay dựng lại từ danh sách server, khoá mồ côi bị loại.
       */
      const liveNames = new Set((data || []).map(dt => dt.name));
      const newFields = {};
      Object.keys(fields).forEach((key) => {
        if (liveNames.has(key)) newFields[key] = fields[key];
      });
      data.forEach(dt => {
        if (dt.fields && dt.fields.length > 0) {
          // transform from backend format (id, name, type, label, etc) to local format
          newFields[dt.name] = dt.fields.map(f => ({
            id: f.name, // The backend fieldName maps to id in frontend
            label: f.label || f.name,
            type: f.type,
            required: f.required,
            sortOrder: f.sortOrder,
            options: f.options || [],
            dynamic: '', // Not fully mapped to backend yet
            isPersisted: f.isPersisted !== undefined ? f.isPersisted : true,
            // File mẫu đã lưu trên BE — tên lấy thẳng từ API, không cần giữ bản trong phiên.
            templateFile: f.templateFileName ? { name: f.templateFileName } : null
          }));
        } else if (!newFields[dt.name]) {
          newFields[dt.name] = [];
        }
      });
      setFields(newFields);
      if (!selectedForm && data.length > 0) {
        setSelectedForm(data[0].name);
      }
    }).catch(console.error);
  }, []);

  // Gom nhóm mẫu đơn theo cột `category` thật từ API (không dùng danh mục cứng)
  const buildCategories = (list) => {
    const byCat = new Map();
    list.forEach(dt => {
      const cat = (dt.category && String(dt.category).trim()) || t('Khác');
      if (!byCat.has(cat)) byCat.set(cat, []);
      byCat.get(cat).push(dt.name);
    });
    return [...byCat.entries()].map(([name, items]) => ({ id: `cat_${name}`, name, items }));
  };

  /**
   * BE-84: gộp danh mục dựng từ server với các danh mục người dùng vừa thêm tay trong phiên
   * (những danh mục còn rỗng, chưa có mẫu đơn nào nên server không trả về).
   * Nếu không gộp, danh mục vừa tạo sẽ biến mất ngay sau khi tạo mẫu đơn.
   */
  const mergeServerCategories = (serverCats, prevCats) => {
    const manual = (prevCats || []).filter(
      (c) => c.items.length === 0 && !serverCats.some((s) => s.name.toLowerCase() === c.name.toLowerCase())
    );
    return [...serverCats, ...manual];
  };

  /**
   * Ghi cấu hình trường lên server: lưu danh sách trường, sau đó xử lý file mẫu đang chờ
   * (upload file mới chọn / gỡ file mẫu HR đã xoá trong modal cấu hình).
   *
   * Nhận `fieldList` TƯỜNG MINH vì hàm này còn được gọi ngay sau khi modal "Lưu cấu hình" cập nhật
   * state — lúc đó `fields[selectedForm]` trong closure vẫn là bản cũ (chưa có file mẫu vừa chọn).
   */
  const saveFieldsToServer = async (fieldList) => {
    const localFields = Array.isArray(fieldList) ? fieldList : [];

    let currentDocType = documentTypes.find(d => d.name === selectedForm);
    if (!currentDocType) {
      try {
        currentDocType = await documentTypeService.create({ name: selectedForm, code: 'AUTO_' + Date.now() });
        setDocumentTypes(prev => [...prev, currentDocType]);
      } catch {
        pushToast(t('Lỗi khi tạo mẫu đơn "{v0}" trên hệ thống', { v0: selectedForm }), 'error');
        return false;
      }
    }

    const payload = localFields.map((f, i) => ({
      name: f.id || `field_${i}`, // Ensure a name is set
      label: f.label,
      type: f.type,
      required: f.required,
      sortOrder: i,
      options: f.options || [],
      isPersisted: f.isPersisted !== undefined ? f.isPersisted : true
    }));

    setIsSaving(true);
    try {
      await documentTypeService.updateFields(currentDocType.id, payload);

      // Field đã tồn tại trên BE — thực hiện các thao tác file mẫu đang chờ:
      // upload file mới chọn / gỡ file mẫu mà HR đã xoá trong modal cấu hình.
      let hasFailedField = false;
      for (const f of localFields) {
        if (f.type !== 'Tải file' || (!f.pendingTemplateFile && !f.pendingTemplateDelete)) continue;
        try {
          if (f.pendingTemplateFile) {
            const savedField = await documentTypeService.uploadTemplateFile(currentDocType.id, f.id, f.pendingTemplateFile);
            // Hiển thị đúng tên file theo dữ liệu server trả về (nguồn sự thật duy nhất).
            if (savedField?.templateFileName) {
              const fileName = savedField.templateFileName;
              setFields((prev) => ({
                ...prev,
                [selectedForm]: (Array.isArray(prev[selectedForm]) ? prev[selectedForm] : []).map((item) => (
                  item.id === f.id ? { ...item, templateFile: { name: fileName } } : item
                )),
              }));
            }
          } else {
            await documentTypeService.deleteTemplateFile(currentDocType.id, f.id);
          }
        } catch (err) {
          hasFailedField = true;
          pushToast(describeApiError(err, t, 'Lỗi khi lưu file mẫu của trường "{v0}"', { v0: f.label || f.id }), 'error');
          break; // giữ cờ pending để HR bấm lưu lần nữa là thử lại
        }
      }

      if (hasFailedField) return false;

      // File mẫu đã chốt trên BE — gỡ cờ pending khỏi state cục bộ.
      setFields((prev) => ({
        ...prev,
        [selectedForm]: (Array.isArray(prev[selectedForm]) ? prev[selectedForm] : []).map(f => ({
          ...f,
          pendingTemplateFile: null,
          pendingTemplateDelete: false,
        })),
      }));

      pushToast(t('Đã lưu cấu hình lên Server thành công!'), 'success');
      return true;
    } catch (err) {
      console.error(err);
      pushToast(t('Lỗi khi lưu cấu hình lên Server'), 'error');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  /** Nút "Lưu đồng bộ DB": lưu đúng danh sách trường đang hiển thị. */
  const handleSaveToServer = () => saveFieldsToServer(fields[selectedForm] || []);

  const [selectedForm, setSelectedForm] = useState(() => Object.keys(fields)[0] || '');

  const [isAddingType, setIsAddingType] = useState(false);
  const [editingDocType, setEditingDocType] = useState(null);
  const [newTypeName, setNewTypeName] = useState('');
  const [selectedCatIdForNewType, setSelectedCatIdForNewType] = useState('cat1');

  const [isAddingCat, setIsAddingCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const [editingCatId, setEditingCatId] = useState(null);
  const [editCatName, setEditCatName] = useState('');

  const [editingTypeIdx, setEditingTypeIdx] = useState(null);
  const [tempLabel, setTempLabel] = useState('');
  const [tempType, setTempType] = useState(t('Văn bản'));
  const [tempOptions, setTempOptions] = useState([]);
  const [tempDisplayStyle, setTempDisplayStyle] = useState('dropdown');
  const [tempTemplateFile, setTempTemplateFile] = useState(null); // { name, dataUrl } | null

  const current = fields[selectedForm] || [];

  /**
   * BE-84: danh mục đang chọn trong popup "Thêm mẫu đơn mới".
   * `selectedCatIdForNewType` khởi tạo là 'cat1' — một id cứng không khớp danh mục thật nào (id thật là
   * `cat_<tên>`). Vì thẻ <select> không có option nào mang giá trị đó nên trình duyệt hiển thị option
   * đầu tiên, còn giá trị gửi lên BE lại là 'cat1' -> không tìm thấy danh mục và mẫu đơn rơi vào "Khác"
   * dù màn hình đang hiện danh mục khác. Đây chính là lỗi "tạo xong nó tự nhảy sang danh mục khác".
   * Nay luôn suy ra một id danh mục HỢP LỆ để vừa hiển thị vừa gửi lên.
   */
  const newTypeCatId = categories.some((c) => c.id === selectedCatIdForNewType)
    ? selectedCatIdForNewType
    : (categories[0]?.id ?? '');

  const handleAddFormType = () => {
    const name = newTypeName.trim();
    if (!name) return;

    // BE-84: chặn trùng tên trên TOÀN BỘ danh mục (trừ khi đang sửa chính nó).
    const existedCat = categories.find((c) => c.items.some((it) => it.trim().toLowerCase() === name.toLowerCase() && (!editingDocType || it !== editingDocType.name)));
    if (existedCat) {
      pushToast(t('Mẫu đơn "{v0}" đã tồn tại trong danh mục "{v1}". Vui lòng dùng tên khác.', {
        v0: name,
        v1: existedCat.name,
      }), 'error');
      return;
    }

    const cat = categories.find((c) => c.id === newTypeCatId);

    /*
     * Hợp nhất 2 nhánh: giữ tính năng SỬA mẫu đơn (nhánh mới) và giữ cải tiến
     * thông báo lỗi theo ngôn ngữ đang dùng / tra từ điển (BE-136).
     */
    const showCreateUpdateError = (err, fallbackKey) => {
      console.error(err);
      const serverMessage = err?.response?.data?.message || err?.response?.data?.error || '';
      if (/đã tồn tại/i.test(serverMessage)) {
        pushToast(t('Mẫu đơn "{v0}" đã tồn tại. Vui lòng dùng tên khác.', { v0: name }), 'error');
      } else {
        pushToast(describeApiError(err, t, fallbackKey, { v0: name }), 'error');
      }
    };

    if (editingDocType) {
      documentTypeService.update(editingDocType.id, {
        name,
        category: cat?.name || t('Khác'),
      }).then(updated => {
        const nextTypes = documentTypesRef.current.map(d => d.id === updated.id ? updated : d);
        documentTypesRef.current = nextTypes;
        setDocumentTypes(nextTypes);
        setCategories((prev) => mergeServerCategories(buildCategories(nextTypes), prev));
        // Nếu tên bị đổi, cập nhật fields key và selectedForm
        if (name !== editingDocType.name) {
          setFields(prev => {
            const next = { ...prev };
            next[name] = next[editingDocType.name] || [];
            delete next[editingDocType.name];
            return next;
          });
          if (selectedForm === editingDocType.name) setSelectedForm(name);
        }
        setIsAddingType(false);
        setEditingDocType(null);
        setNewTypeName('');
        pushToast(t('Đã cập nhật mẫu đơn "{v0}".', { v0: name }), 'success');
      }).catch(err => showCreateUpdateError(err, 'Lỗi khi cập nhật mẫu đơn "{v0}"'));
    } else {
      documentTypeService.create({
        name,
        code: 'AUTO_' + Date.now(),
        category: cat?.name || t('Khác'),
      }).then(created => {
        // Nhóm lại theo dữ liệu server trả về thay vì tự chèn tay vào một nhóm — tự chèn tay là nguồn gốc
        // của việc mẫu đơn hiện sai/nhảy sang danh mục khác.
        const nextTypes = [...documentTypesRef.current, created];
        documentTypesRef.current = nextTypes;
        setDocumentTypes(nextTypes);
        setCategories((prev) => mergeServerCategories(buildCategories(nextTypes), prev));
        setFields(prev => ({ ...prev, [name]: [] }));
        setSelectedForm(name);
        setIsAddingType(false);
        setNewTypeName('');
        pushToast(t('Đã thêm mẫu đơn "{v0}".', { v0: name }), 'success');
      }).catch(err => showCreateUpdateError(err, 'Lỗi khi tạo mẫu đơn "{v0}"'));
    }
  };

  const handleAddCategory = () => {
    const name = newCatName.trim();
    if (!name) return;
    // BE-84: chặn danh mục trùng tên — trước đây thêm được nhiều danh mục cùng tên.
    if (categories.some((c) => c.name.trim().toLowerCase() === name.toLowerCase())) {
      pushToast(t('Danh mục "{v0}" đã tồn tại.', { v0: name }), 'error');
      return;
    }
    setCategories(prev => [...prev, { id: `cat_${name}`, name, items: [] }]);
    setSelectedCatIdForNewType(`cat_${name}`);
    setIsAddingCat(false);
    setNewCatName('');
    pushToast(t('Đã thêm danh mục "{v0}".', { v0: name }), 'success');
  };

  const handleEditCategory = (id) => {
    const name = editCatName.trim();
    if (!name) return;
    // BE-84: đổi tên danh mục cũng không được trùng với danh mục khác.
    if (categories.some((c) => c.id !== id && c.name.trim().toLowerCase() === name.toLowerCase())) {
      pushToast(t('Danh mục "{v0}" đã tồn tại.', { v0: name }), 'error');
      return;
    }
    setCategories(prev => prev.map(c => c.id === id ? { ...c, name } : c));
    setEditingCatId(null);
  };

  const handleDeleteCategory = (id) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const handleDeleteForm = async (catId, formName) => {
    // BE-134: thay `window.confirm` bằng hộp thoại của ứng dụng cho đồng bộ với các màn khác.
    setDeleteTarget({ catId, formName });
  };

  const confirmDeleteForm = async () => {
    if (!deleteTarget) return false;
    const { formName } = deleteTarget;
    try {
      const target = documentTypes.find(d => d.name === formName);
      if (target) {
        await documentTypeService.delete(target.id);
      }
      /*
       * BE-86: xoá mẫu đơn phải cập nhật CẢ danh sách gốc `documentTypes`, không chỉ `categories`.
       * Trước đây chỉ lọc `categories`, nên `documentTypes` còn giữ bản ghi đã xoá; tạo lại mẫu đơn
       * cùng tên sẽ thành 2 bản trùng tên (React báo trùng key, sidebar hiện 2 dòng giống nhau).
       * Nhóm lại từ danh sách gốc để `categories` luôn khớp với dữ liệu thật.
       */
      const nextTypes = documentTypesRef.current.filter(d => d.name !== formName);
      documentTypesRef.current = nextTypes;
      setDocumentTypes(nextTypes);
      setCategories(prev => mergeServerCategories(buildCategories(nextTypes), prev));
      // BE-86: xoá luôn field đã lưu trong phiên của mẫu đơn vừa xoá. Nếu để lại, lần sau tạo mẫu đơn
      // trùng tên sẽ dùng lại field cũ và trông như mẫu đơn mới bị "nhảy" sang mẫu đơn khác.
      setFields(prev => {
        if (!(formName in prev)) return prev;
        const next = { ...prev };
        delete next[formName];
        return next;
      });
      if (selectedForm === formName) {
        setSelectedForm('');
      }
      pushToast(t('Đã xóa mẫu đơn thành công!'), 'success');
      return true;
    } catch (err) {
      console.error(err);
      pushToast(t('Lỗi khi xóa mẫu đơn'), 'error');
      return false;
    }
  };

  const updateField = (idx, patch) =>
    setFields((prev) => ({
      ...prev,
      [selectedForm]: (Array.isArray(prev[selectedForm]) ? prev[selectedForm] : []).map((f, i) => (i === idx ? { ...f, ...patch } : f)),
    }));

  const removeField = (idx) =>
    setFields((prev) => ({
      ...prev,
      [selectedForm]: (Array.isArray(prev[selectedForm]) ? prev[selectedForm] : []).filter((_, i) => i !== idx),
    }));

  const addField = () =>
    setFields((prev) => ({
      ...prev,
      [selectedForm]: [
        ...(Array.isArray(prev[selectedForm]) ? prev[selectedForm] : []),
        { id: `field_${Date.now()}`, label: t('Trường mới'), type: 'Văn bản', required: false, dynamic: '', options: [], isPersisted: true },
      ],
    }));

  const openTypeModal = (idx) => {
    const f = current[idx];
    setEditingTypeIdx(idx);
    setTempLabel(f.label || t('Trường mới'));
    // type là giá trị DỮ LIỆU (lưu vào backend) nên giữ nguyên tiếng Việt gốc.
    setTempType(f.type || 'Văn bản');
    setTempOptions(f.options ? [...f.options] : []);

    let defaultStyle = 'dropdown';
    if (f.type === 'Ngày') defaultStyle = 'datetime';

    setTempDisplayStyle(f.displayStyle || defaultStyle);

    // File mẫu (chỉ áp dụng cho kiểu "Tải file"). file=null: bản gốc đang nằm trên BE,
    // chỉ file MỚI chọn (có object File) mới cần upload khi bấm "Lưu lên Server".
    if (f.type === 'Tải file' && f.templateFile?.name) {
      setTempTemplateFile({ name: f.templateFile.name, file: f.pendingTemplateFile || null });
    } else {
      setTempTemplateFile(null);
    }
  };

  const handleSaveTypeModal = async () => {
    if (editingTypeIdx === null) return;
    const f = current[editingTypeIdx];
    // Chỉ giữ file mẫu khi kiểu dữ liệu còn là "Tải file".
    const keepTemplate = tempType === 'Tải file' ? tempTemplateFile : null;
    const patched = {
      label: tempLabel,
      type: tempType,
      options: tempOptions,
      displayStyle: tempDisplayStyle,
      templateFile: keepTemplate ? { name: keepTemplate.name } : null,
      pendingTemplateFile: keepTemplate?.file || null,
      pendingTemplateDelete: !keepTemplate && !!f.templateFile?.name,
      isPersisted: tempType === 'Tải file' ? false : (f.isPersisted !== undefined ? f.isPersisted : true),
    };
    const nextFields = current.map((item, i) => (i === editingTypeIdx ? { ...item, ...patched } : item));
    setFields((prev) => ({ ...prev, [selectedForm]: nextFields }));
    setEditingTypeIdx(null);

    /*
     * FIX (file mẫu mất sau khi tải lại trang): trước đây "Lưu cấu hình" chỉ sửa state cục bộ,
     * file mẫu vừa chọn chỉ được upload khi HR bấm thêm nút "Lưu đồng bộ DB". Nếu HR tải lại trang
     * (hoặc hiểu là đã lưu xong) thì file mẫu biến mất: server không có file, nên người tạo đơn cũng
     * không thấy nút "Tải biểu mẫu". Nay lưu cấu hình trường là ghi thẳng lên server (trường + file mẫu)
     * — thông báo thành công/lỗi do saveFieldsToServer hiển thị.
     */
    await saveFieldsToServer(nextFields);
  };

  const addTempOption = () => setTempOptions([...tempOptions, t('Lựa chọn {v0}', { v0: tempOptions.length + 1 })]);
  const updateTempOption = (idx, val) => {
    const newOpts = [...tempOptions];
    newOpts[idx] = val;
    setTempOptions(newOpts);
  };
  const removeTempOption = (idx) => {
    setTempOptions(tempOptions.filter((_, i) => i !== idx));
  };

  // #4/#7: không đọc data URL nhét localStorage nữa — giữ object File, validate
  // (rỗng / kích thước / đuôi) ngay khi chọn, rồi upload thẳng lên BE lúc "Lưu lên Server".
  // BE còn một lớp chặn nữa: magic bytes + whitelist (chặn .exe đổi đuôi).
  const TEMPLATE_ALLOWED_EXT = ['pdf', 'doc', 'docx', 'xls', 'xlsx'];
  const TEMPLATE_MAX_SIZE = 10 * 1024 * 1024; // khớp trần 10MB phía BE

  const handleTemplateFileChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size === 0) {
      pushToast(t('File rỗng không được chấp nhận'), 'error');
      return;
    }
    if (file.size > TEMPLATE_MAX_SIZE) {
      pushToast(t('File mẫu vượt quá giới hạn 10MB'), 'error');
      return;
    }
    const ext = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : '';
    if (!TEMPLATE_ALLOWED_EXT.includes(ext)) {
      pushToast(t('File mẫu chỉ chấp nhận: .pdf, .doc, .docx, .xls, .xlsx'), 'error');
      return;
    }
    setTempTemplateFile({ name: file.name, file });
  };
  const removeTemplateFile = () => setTempTemplateFile(null);

  const [expandedCats, setExpandedCats] = useState(
    categories.reduce((acc, cat) => ({...acc, [cat.id]: true}), {})
  );

  const toggleCat = (id) => setExpandedCats(prev => ({...prev, [id]: !prev[id]}));

  // BE-103: xem trước bản dịch của tên trường ở ngôn ngữ hiện tại (rỗng nếu trùng bản gốc).
  const translateFieldLabelPreview = (label) => {
    const raw = String(label ?? '').trim();
    if (!raw) return '';
    const translated = t(raw);
    return translated && translated !== raw ? translated : '';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(220px,280px)_minmax(0,1fr)] gap-4">
      {/* Form templates list */}
      <div className="bg-surface rounded-lg border border-outline-variant shadow-sm overflow-hidden flex flex-col max-h-[800px]">
        <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-lowest flex-shrink-0 flex items-center justify-between">
          <h3 className="font-label-md text-on-surface font-semibold uppercase tracking-wide">{t('Mẫu đơn')}</h3>
          <button 
            onClick={() => setIsAddingCat(true)}
            className="text-primary hover:bg-primary-container/30 p-1 rounded-md transition-colors cursor-pointer"
            title={t('Thêm danh mục')}
          >
            <span className="material-symbols-outlined text-[18px]">create_new_folder</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ul className="flex flex-col p-2 gap-3">
            {categories.map((cat) => {
              const isExpanded = expandedCats[cat.id] !== false; // Default true
              const isEditing = editingCatId === cat.id;
              
              return (
                <li key={cat.id} className="flex flex-col gap-1">
                  <div className="flex items-center group pr-2">
                    <button 
                      onClick={() => toggleCat(cat.id)}
                      /* BE-86: KHÔNG dùng `uppercase` cho tên danh mục.
                         Trước đây CSS viết hoa toàn bộ nên sidebar hiện "DDD"/"KHÁC" trong khi dữ
                         liệu là "ddd"/"Khác" — cùng một danh mục mà chỗ này một kiểu, ô "Lưu vào danh
                         mục" lại một kiểu, nhìn như hai danh mục khác nhau. Nay hiện đúng tên đã lưu. */
                      className="flex-1 flex items-center gap-2 px-2 py-1 text-xs font-semibold text-secondary hover:text-primary transition-colors cursor-pointer text-left tracking-wider"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {isExpanded ? 'keyboard_arrow_down' : 'keyboard_arrow_right'}
                      </span>
                      {isEditing ? (
                        <input 
                          autoFocus
                          type="text"
                          value={editCatName}
                          onChange={e => setEditCatName(e.target.value)}
                          onBlur={() => handleEditCategory(cat.id)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleEditCategory(cat.id);
                            if (e.key === 'Escape') setEditingCatId(null);
                          }}
                          className="bg-surface border border-primary/50 rounded px-1 py-0.5 text-on-surface outline-none focus:ring-1 focus:ring-primary w-full max-w-[140px] lowercase normal-case"
                          onClick={e => e.stopPropagation()}
                        />
                      ) : (
                        t(cat.name)
                      )}
                    </button>
                    {!isEditing && (
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 flex-shrink-0 transition-opacity">
                        <button 
                          onClick={() => {
                            setEditCatName(cat.name);
                            setEditingCatId(cat.id);
                          }}
                          className="text-secondary hover:text-primary p-1 rounded hover:bg-surface-container-low cursor-pointer"
                          title={t('Đổi tên danh mục')}
                        >
                          <span className="material-symbols-outlined text-[14px]">edit</span>
                        </button>
                        <button 
                          onClick={() => {
                            if (cat.items.length === 0) {
                              handleDeleteCategory(cat.id);
                            }
                          }}
                          disabled={cat.items.length > 0}
                          className={`p-1 rounded transition-colors flex-shrink-0 ${
                            cat.items.length > 0 
                              ? 'text-outline opacity-50 cursor-not-allowed' 
                              : 'text-secondary hover:text-error hover:bg-error-container/30 cursor-pointer'
                          }`}
                          title={cat.items.length > 0 ? t('Phải xóa hết đơn bên trong để xóa danh mục') : t('Xóa danh mục')}
                        >
                          <span className="material-symbols-outlined text-[14px]">delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                  {isExpanded && (
                    <ul className="flex flex-col gap-0.5">
                      {cat.items.length === 0 && (
                        <li className="text-xs text-secondary italic pl-8 pr-3 py-1">{t('Chưa có mẫu đơn')}</li>
                      )}
                      {cat.items.map(f => {
                        const active = f === selectedForm;
                        return (
                          <li key={f} className="group/item flex items-center relative pr-2">
                            <button
                              onClick={() => setSelectedForm(f)}
                              className={`flex-1 text-left pl-8 pr-6 py-2 rounded-md text-sm flex items-center gap-2 transition-colors cursor-pointer ${
                                active ? 'bg-primary-container/40 text-primary font-semibold' : 'text-on-surface hover:bg-surface-container-low'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[16px]">{active ? 'description' : 'draft'}</span>
                              <span className="truncate">{t(f)}</span>
                            </button>
                            <div className="absolute right-1 opacity-0 group-hover/item:opacity-100 flex items-center transition-all bg-surface">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const docType = documentTypes.find(d => d.name === f);
                                  if (docType) {
                                    setEditingDocType(docType);
                                    setNewTypeName(docType.name);
                                    const cat = categories.find(c => c.name === docType.category);
                                    if (cat) setSelectedCatIdForNewType(cat.id);
                                    setIsAddingType(true);
                                  }
                                }}
                                className="text-secondary hover:text-primary transition-all p-1.5 rounded hover:bg-primary-container/30 cursor-pointer flex-shrink-0"
                                title={t('Sửa mẫu đơn')}
                              >
                                <span className="material-symbols-outlined text-[14px]">edit</span>
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteForm(cat.id, f);
                                }}
                                className="text-secondary hover:text-error transition-all p-1.5 rounded hover:bg-error-container/30 cursor-pointer flex-shrink-0"
                                title={t('Xóa mẫu đơn')}
                              >
                                <span className="material-symbols-outlined text-[14px]">delete</span>
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
        <div className="p-2 border-t border-outline-variant/50">
          <button
            onClick={() => {
              setEditingDocType(null);
              setNewTypeName('');
              setIsAddingType(true);
            }}
            className="w-full text-center px-3 py-2 rounded-md text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-primary hover:bg-primary-container/30 border border-dashed border-primary/50"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            {t('Thêm loại đơn')}
          </button>
        </div>
      </div>

      {/* Field management table */}
      <div className="bg-surface rounded-lg border border-outline-variant shadow-sm overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-outline-variant flex items-center justify-between">
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">{t('Quản lý trường:')} {t(selectedForm)}</h3>
            <p className="text-xs text-secondary mt-0.5">{t('Cấu hình trường dữ liệu và điều kiện hiển thị động')}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSaveToServer}
              disabled={isSaving}
              className="bg-surface border border-outline-variant text-on-surface hover:bg-surface-container-low transition-colors text-sm font-medium px-3 py-2 rounded-md flex items-center gap-1.5 cursor-pointer flex-shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isSaving ? 'sync' : 'save'}
              </span>
              {isSaving ? t('Đang lưu...') : t('Lưu đồng bộ DB')}
            </button>
            <button
              onClick={addField}
              className="bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-colors text-sm font-medium px-3 py-2 rounded-md flex items-center gap-1.5 cursor-pointer flex-shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              {t('Thêm trường mới')}
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="bg-surface-container-low text-left border-b border-outline-variant">
                <th className="px-4 py-3 font-label-md text-on-surface-variant font-semibold uppercase tracking-wide">{t('Tên trường')}</th>
                <th className="px-4 py-3 font-label-md text-on-surface-variant font-semibold uppercase tracking-wide">{t('Kiểu dữ liệu')}</th>
                <th className="px-4 py-3 font-label-md text-on-surface-variant font-semibold uppercase tracking-wide">{t('Bắt buộc')}</th>
                <th className="px-4 py-3 font-label-md text-on-surface-variant font-semibold uppercase tracking-wide">{t('Thiết lập nâng cao')}</th>
                <th className="px-4 py-3 font-label-md text-on-surface-variant font-semibold uppercase tracking-wide w-24 whitespace-nowrap text-center">{t('Thao tác')}</th>
              </tr>
            </thead>
            <tbody>
              {current.map((f, idx) => (
                <tr key={f.id} className="border-b border-outline-variant/50 last:border-0 hover:bg-surface-container-low/60 transition-colors">
                  <td className="px-4 py-3">
                    <input 
                      type="text" 
                      value={f.label} 
                      onChange={(e) => updateField(idx, { label: e.target.value })}
                      className="text-sm font-medium text-on-surface bg-transparent border-b border-transparent hover:border-outline-variant focus:border-primary outline-none px-1 py-0.5 w-full max-w-[200px] transition-colors"
                    />
                    {/*
                      BE-103: giá trị ô này là dữ liệu người dùng nhập (không dịch tại chỗ để tránh ghi
                      bản dịch ngược vào DB). Hiện thêm dòng xem trước bản dịch của tên trường ở
                      ngôn ngữ đang chọn để biết trường mới có được dịch đúng hay không.
                    */}
                    {language !== 'vi' && translateFieldLabelPreview(f.label) && (
                      <span className="block text-[11px] text-on-surface-variant px-1 mt-0.5 truncate max-w-[200px]">
                        {translateFieldLabelPreview(f.label)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button 
                      onClick={() => openTypeModal(idx)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-surface-container text-secondary border border-outline-variant hover:border-primary hover:text-primary transition-colors cursor-pointer w-full justify-between"
                    >
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">
                          {f.type === 'Tải file' ? 'attach_file' : f.type === 'Ngày' ? 'calendar_month' : f.type === 'Số' ? 'numbers' : f.type === 'Lựa chọn' ? 'list_alt' : f.type === 'Người duyệt thay' ? 'manage_accounts' : 'text_fields'}
                        </span>
                        {t(f.type)}
                      </div>
                      <span className="material-symbols-outlined text-[14px] text-outline">edit</span>
                    </button>
                    {f.type === 'Lựa chọn' && f.options && f.options.length > 0 && (
                      <div className="text-[10px] text-secondary mt-1 ml-1">
                        {f.options.length} {t('phương án')}
                      </div>
                    )}
                    {f.type === 'Ngày' && f.displayStyle && (
                      <div className="text-[10px] text-secondary mt-1 ml-1">
                        {f.displayStyle === 'date' ? t('Chỉ ngày') : f.displayStyle === 'time' ? t('Chỉ giờ') : t('Ngày & giờ')}
                      </div>
                    )}
                    {f.type === 'Tải file' && f.templateFile?.name && (
                      <div className="text-[10px] text-secondary mt-1 ml-1 truncate max-w-[180px]">
                        {t('File mẫu:')} {f.templateFile.name}
                      </div>
                    )}
                    {/* File mẫu chỉ nằm trong phiên (upload lên server thất bại / chưa ghi được) —
                        cảnh báo rõ để HR không tưởng là đã lưu rồi tải lại trang. */}
                    {f.type === 'Tải file' && f.pendingTemplateFile && (
                      <div className="text-[10px] text-error mt-0.5 ml-1 truncate max-w-[180px]">
                        {t('Chưa lưu lên máy chủ')}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Toggle checked={f.required} onChange={(v) => updateField(idx, { required: v })} label={t('Bắt buộc')} />
                  </td>
                  <td className="px-4 py-3 max-w-[320px] flex flex-col gap-3">
                    <div>
                      {f.type === 'Tải file' ? (
                        <div className="flex items-center gap-2 text-xs text-secondary">
                          <span className="material-symbols-outlined text-[16px] text-outline">attach_file</span>
                          <span className="italic">{t('File đính kèm — tách riêng, không xuất Excel')}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Toggle
                            checked={f.isPersisted !== false}
                            onChange={(v) => updateField(idx, { isPersisted: v })}
                            label={t('Sao lưu & Xuất báo cáo')}
                          />
                          <div className="flex flex-col">
                            <span className="text-xs text-secondary whitespace-nowrap">
                              {f.isPersisted !== false ? t('Sao lưu & Xuất') : t('Không xuất')}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => removeField(idx)}
                      className="text-secondary hover:text-error hover:bg-error-container/30 p-1.5 rounded-md transition-colors cursor-pointer inline-flex items-center justify-center"
                      title={t('Xóa trường')}
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Popup Modal for adding new form type */}
      {isAddingType && (
        <div 
          className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
        >
          <div 
            className="bg-surface rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-outline-variant/30">
              <h3 className="font-headline-sm text-on-surface">{editingDocType ? t('Sửa mẫu đơn') : t('Thêm mẫu đơn mới')}</h3>
              <button 
                onClick={() => { setIsAddingType(false); setEditingDocType(null); }}
                className="text-on-surface-variant hover:text-on-surface transition-colors p-1 rounded-full hover:bg-surface-variant cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <div className="p-4 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1.5">
                  {t('Tên loại đơn')} <span className="text-error">*</span>
                </label>
                <input 
                  type="text" 
                  autoFocus
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary" 
                  placeholder={t('VD: Đơn xin cấp trang thiết bị...')}
                  value={newTypeName}
                  onChange={e => setNewTypeName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleAddFormType();
                    if (e.key === 'Escape') setIsAddingType(false);
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1.5">
                  {t('Lưu vào danh mục')}
                </label>
                <Select
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-2 text-sm text-on-surface focus:border-primary"
                  value={newTypeCatId}
                  onChange={setSelectedCatIdForNewType}
                  options={categories.map((c) => ({ value: c.id, label: c.name }))}
                />
              </div>
            </div>
            
            <div className="p-4 bg-surface-container-lowest border-t border-outline-variant/30 flex justify-end gap-3 rounded-b-lg">
              <button 
                onClick={() => { setIsAddingType(false); setEditingDocType(null); }}
                className="text-on-surface-variant text-sm font-medium px-4 py-2 rounded-md hover:bg-surface-variant transition-colors cursor-pointer"
              >
                {t('Hủy')}
              </button>
              <button 
                onClick={handleAddFormType}
                className="bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-colors text-sm font-medium px-4 py-2 rounded-md flex items-center shadow-sm cursor-pointer"
              >
                {editingDocType ? t('Cập nhật') : t('Thêm mẫu đơn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup Modal for adding new category */}
      {isAddingCat && (
        <div 
          className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
        >
          <div 
            className="bg-surface rounded-lg shadow-xl w-full max-w-sm overflow-hidden animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-outline-variant/30">
              <h3 className="font-headline-sm text-on-surface">{t('Thêm danh mục mới')}</h3>
              <button 
                onClick={() => setIsAddingCat(false)}
                className="text-on-surface-variant hover:text-on-surface transition-colors p-1 rounded-full hover:bg-surface-variant cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <div className="p-4">
              <label className="block text-sm font-medium text-on-surface mb-1.5">
                {t('Tên danh mục')} <span className="text-error">*</span>
              </label>
              <input 
                type="text" 
                autoFocus
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary" 
                placeholder={t('VD: Tài chính - Kế toán')}
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddCategory();
                  if (e.key === 'Escape') setIsAddingCat(false);
                }}
              />
            </div>
            
            <div className="p-4 bg-surface-container-lowest border-t border-outline-variant/30 flex justify-end gap-3 rounded-b-lg">
              <button 
                onClick={() => setIsAddingCat(false)}
                className="text-on-surface-variant text-sm font-medium px-4 py-2 rounded-md hover:bg-surface-variant transition-colors cursor-pointer"
              >
                {t('Hủy')}
              </button>
              <button 
                onClick={handleAddCategory}
                className="bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-colors text-sm font-medium px-4 py-2 rounded-md flex items-center shadow-sm cursor-pointer"
              >
                {t('Lưu danh mục')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup Modal for configuring field type */}
      {editingTypeIdx !== null && (
        <div 
          className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
        >
          <div 
            className="bg-surface rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-fade-in flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-outline-variant/30 flex-shrink-0">
              <h3 className="font-headline-sm text-on-surface">{t('Cấu hình Trường dữ liệu')}</h3>
              <button 
                onClick={() => setEditingTypeIdx(null)}
                className="text-on-surface-variant hover:text-on-surface transition-colors p-1 rounded-full hover:bg-surface-variant cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-6">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-2 block">
                  {t('Tên trường / Tiêu đề câu hỏi')} <span className="text-error">*</span>
                </label>
                <input 
                  type="text"
                  value={tempLabel}
                  onChange={(e) => setTempLabel(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder={t('VD: Có ảnh hưởng đến công việc không?')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface mb-3">
                  {t('Chọn kiểu dữ liệu')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Văn bản', icon: 'text_fields' },
                    { id: 'Số', icon: 'numbers' },
                    { id: 'Lựa chọn', icon: 'list_alt' },
                    { id: 'Ngày', icon: 'calendar_month' },
                    { id: 'Tải file', icon: 'attach_file' },
                    { id: 'Người duyệt thay', icon: 'manage_accounts' }
                  ].map((ft) => (
                    <button
                      key={ft.id}
                      onClick={() => {
                        setTempType(ft.id);
                        if (ft.id === 'Ngày') setTempDisplayStyle('datetime');
                        else if (ft.id === 'Lựa chọn') setTempDisplayStyle('dropdown');
                      }}
                      className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border transition-all cursor-pointer ${
                        tempType === ft.id
                          ? 'border-primary bg-primary-container/20 text-primary'
                          : 'border-outline-variant bg-surface-container-lowest text-secondary hover:border-primary/50'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[24px]">{ft.icon}</span>
                      <span className="text-xs font-medium">{t(ft.id)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {tempType === 'Lựa chọn' && (
                <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 animate-fade-in flex flex-col gap-4">
                  
                  {/* Display Style Selection */}
                  <div>
                    <label className="text-sm font-medium text-on-surface mb-2 block">
                      {t('Kiểu hiển thị')} <span className="text-error">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'dropdown', label: 'Dropdown', icon: 'arrow_drop_down_circle' },
                        { id: 'radio', label: t('Radio (Chọn 1)'), icon: 'radio_button_checked' },
                        { id: 'checkbox', label: t('Checkbox (Chọn nhiều)'), icon: 'check_box' }
                      ].map(style => (
                        <button
                          key={style.id}
                          onClick={() => setTempDisplayStyle(style.id)}
                          className={`flex items-center gap-2 p-2 rounded-md border text-sm transition-all cursor-pointer ${
                            tempDisplayStyle === style.id
                              ? 'border-primary bg-primary-container/20 text-primary font-medium'
                              : 'border-outline-variant bg-surface text-secondary hover:border-primary/50'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">{style.icon}</span>
                          {style.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-outline-variant/30 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-on-surface">
                        {t('Danh sách phương án')}
                      </label>
                      <span className="text-xs text-secondary bg-surface-variant px-2 py-0.5 rounded-full">
                        {tempOptions.length} {t('phương án')}
                      </span>
                    </div>
                    
                    <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-1">
                      {tempOptions.length === 0 ? (
                        <p className="text-sm text-secondary italic text-center py-4 bg-surface-container-low rounded-md border border-dashed border-outline-variant">
                          {t('Chưa có phương án nào. Hãy thêm phương án mới.')}
                        </p>
                      ) : (
                        tempOptions.map((opt, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-outline text-[16px] cursor-grab">drag_indicator</span>
                            <input 
                              type="text"
                              value={opt}
                              onChange={(e) => updateTempOption(i, e.target.value)}
                              className="flex-1 bg-surface border border-outline-variant rounded-md px-3 py-1.5 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                              placeholder={t('Nhập tên phương án...')}
                            />
                            <button 
                              onClick={() => removeTempOption(i)}
                              className="text-secondary hover:text-error hover:bg-error-container/30 p-1.5 rounded-md transition-colors cursor-pointer flex-shrink-0"
                              title={t('Xóa phương án')}
                            >
                              <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                    
                    <button
                      onClick={addTempOption}
                      className="mt-3 w-full text-center px-3 py-2 rounded-md text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-primary hover:bg-primary-container/30 border border-dashed border-primary/50"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                      {t('Thêm phương án')}
                    </button>
                  </div>
                </div>
              )}

              {tempType === 'Ngày' && (
                <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 animate-fade-in flex flex-col gap-4">
                  <div>
                    <label className="text-sm font-medium text-on-surface mb-2 block">
                      {t('Định dạng thời gian')} <span className="text-error">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'date', label: t('Chỉ ngày'), subtext: 'DD/MM/YYYY', icon: 'calendar_today' },
                        { id: 'time', label: t('Chỉ giờ'), subtext: 'HH:MM', icon: 'schedule' },
                        { id: 'datetime', label: t('Ngày & Giờ'), subtext: 'DD/MM HH:MM', icon: 'event' }
                      ].map(style => (
                        <button
                          key={style.id}
                          onClick={() => setTempDisplayStyle(style.id)}
                          className={`flex flex-col items-center justify-center gap-1 p-2 rounded-md border text-sm transition-all cursor-pointer ${
                            tempDisplayStyle === style.id
                              ? 'border-primary bg-primary-container/20 text-primary font-medium'
                              : 'border-outline-variant bg-surface text-secondary hover:border-primary/50'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">{style.icon}</span>
                          <span>{style.label}</span>
                          <span className="text-[10px] font-normal opacity-70">{style.subtext}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {tempType === 'Tải file' && (
                <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 animate-fade-in flex flex-col gap-1">
                  <label className="text-sm font-medium text-on-surface mb-1 block">
                    {t('File mẫu đính kèm')}
                  </label>
                  <p className="text-xs text-secondary mb-3">
                    {t('Tải lên file mẫu để người tạo đơn tải về trước khi điền. Để trống nếu không cần.')}
                  </p>
                  {tempTemplateFile ? (
                    <div className="flex items-center gap-2 bg-surface border border-outline-variant rounded-md px-3 py-2">
                      <span className="material-symbols-outlined text-[18px] text-primary">description</span>
                      <span className="text-sm text-on-surface flex-1 truncate">{tempTemplateFile.name}</span>
                      <button
                        type="button"
                        onClick={removeTemplateFile}
                        className="text-secondary hover:text-error p-1 rounded hover:bg-error-container/30 transition-colors cursor-pointer"
                        title={t('Xóa file mẫu')}
                      >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-2 px-3 py-3 rounded-md border border-dashed border-primary/50 text-primary hover:bg-primary-container/20 transition-colors cursor-pointer text-sm font-medium">
                      <span className="material-symbols-outlined text-[18px]">upload_file</span>
                      {t('Tải lên file mẫu')}
                      <input type="file" className="sr-only" accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={handleTemplateFileChange} />
                    </label>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 bg-surface-container-lowest border-t border-outline-variant/30 flex justify-end gap-3 rounded-b-lg flex-shrink-0">
              <button 
                onClick={() => setEditingTypeIdx(null)}
                className="text-on-surface-variant text-sm font-medium px-4 py-2 rounded-md hover:bg-surface-variant transition-colors cursor-pointer"
              >
                {t('Hủy')}
              </button>
              <button 
                onClick={handleSaveTypeModal}
                className="bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-colors text-sm font-medium px-4 py-2 rounded-md flex items-center shadow-sm cursor-pointer"
              >
                {t('Lưu cấu hình')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BE-134: hộp thoại xác nhận xóa mẫu đơn (thay window.confirm cho đồng bộ toàn app) */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-[110] bg-black/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={t('Xóa mẫu đơn')}
        >
          <div
            className="bg-surface rounded-lg shadow-xl w-full max-w-sm overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-error-container text-error flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined">delete</span>
              </div>
              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">{t('Xóa mẫu đơn này?')}</h2>
                <p className="text-xs text-secondary mt-0.5">{deleteTarget.formName}</p>
                <p className="text-sm text-on-surface mt-2">
                  {t('Mẫu đơn sẽ bị xóa khỏi danh mục. Thao tác này không thể hoàn tác.')}
                </p>
              </div>
            </div>
            <div className="p-5 pt-0 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="font-label-md text-on-surface-variant px-4 py-2 rounded-md hover:bg-surface-variant transition-colors cursor-pointer"
              >
                {t('Hủy')}
              </button>
              <button
                type="button"
                onClick={async () => {
                  const ok = await confirmDeleteForm();
                  if (ok) setDeleteTarget(null);
                }}
                className="font-label-md text-on-error bg-error px-5 py-2 rounded-md hover:bg-error/90 transition-colors shadow-sm cursor-pointer flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
                {t('Xóa mẫu đơn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
