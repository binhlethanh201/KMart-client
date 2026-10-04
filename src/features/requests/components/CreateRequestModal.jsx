import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useApproval } from '../../../context/useApproval';
import { useHr } from '../../hr/context/HrProvider';
import { documentTypeService } from '../../../services/documentTypeService';
import { workflowService } from '../../../services/workflowService';
import ApprovalFlowTree from './ApprovalFlowTree';
import DocumentTypeSelect from './DocumentTypeSelect';
import { buildDynamicFromRaw, fieldLabel, resolveFieldKey, sortFields } from '../formFieldMapping';
import { checkNumberValue, isNumberField } from '../formFieldValidation';
import { useI18n } from '../../../i18n/I18nProvider';
import { describeApiError } from '../../../utils/apiError';

const fieldCls =
  'w-full rounded-md border border-outline-variant bg-surface-container-lowest text-on-surface text-sm h-10 px-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors';
const labelCls = 'block font-label-md text-label-md text-on-surface-variant mb-1.5';

/**
 * BE-75: danh sách định dạng tệp đính kèm được phép — PHẢI KHỚP backend
 * (Services/Implementations/FileService.cs) để lỗi hiện ngay trên form.
 */
const ALLOWED_ATTACHMENT_EXT = ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv'];
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

/** Trả về câu lỗi nếu tệp không hợp lệ, ngược lại null. */
function validateAttachment(file, t) {
  const name = String(file.name || '');
  const dot = name.lastIndexOf('.');
  const ext = dot >= 0 ? name.slice(dot).toLowerCase() : '';
  if (!ext) {
    return t('Tệp không có phần mở rộng. Cho phép: {v0}', { v0: ALLOWED_ATTACHMENT_EXT.join(', ') });
  }
  if (!ALLOWED_ATTACHMENT_EXT.includes(ext)) {
    return t('Định dạng "{v0}" không được phép. Cho phép: {v1}', { v0: ext, v1: ALLOWED_ATTACHMENT_EXT.join(', ') });
  }
  if (file.size > MAX_ATTACHMENT_BYTES) {
    return t('Kích thước tệp vượt quá giới hạn {v0}MB', { v0: MAX_ATTACHMENT_BYTES / (1024 * 1024) });
  }
  return null;
}

export default function CreateRequestModal({ onClose, existingRequest = null, onSubmitted }) {
  const { t } = useI18n();
  const { createRequest, updateRequest, departments, currentUser, pushToast } = useApproval();
  const { employees } = useHr();

  // Chế độ bổ sung: mở lại đơn đang ở trạng thái "Yêu cầu bổ sung" để sửa rồi gửi lại
  const isEdit = Boolean(existingRequest);
  
  // Load document types từ BE
  const [documentTypes, setDocumentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeWorkflow, setActiveWorkflow] = useState(null);
  
  useEffect(() => {
    // BE-07: chỉ lấy loại đơn đã có luồng duyệt active
    documentTypeService.getAvailable()
      .then(data => {
        setDocumentTypes(data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load document types:", err);
        setLoading(false);
      });
  }, []);
  
  const initialType = documentTypes[0] || null;
  
  const [form, setForm] = useState({
    documentTypeId: initialType?.id || '',
    reason: '',  // BE dùng 'reason' thay vì 'title'
    departments: [],
    dynamic: {}
  });

  // BE-04: người duyệt do người tạo chọn (chỉ cần khi bước 1 có nhiều ứng viên)
  const [selectedApproverId, setSelectedApproverId] = useState('');

  // BE-50: luồng duyệt ĐÃ PHÂN GIẢI (người duyệt thật theo sơ đồ tổ chức) — nguồn duy nhất
  // cho cây "Luồng phê duyệt dự kiến". Trước đây client tự đoán nên cây vẽ sai.
  const [flowPreview, setFlowPreview] = useState(null);

  // BE-20: popup xem full luồng phê duyệt
  const [flowOpen, setFlowOpen] = useState(false);

  // BE-96: việc gom nhóm theo danh mục + tìm kiếm loại đề xuất nay nằm trong
  // <DocumentTypeSelect /> (ô tìm kiếm ở ngay trong dropdown).

  // BE-09: File thật của các trường "Tải file", khoá theo nhãn trường.
  // Trước đây chỉ lưu file.name vào form.dynamic nên file CHƯA BAO GIỜ được upload.
  const [files, setFiles] = useState({});
  /** BE-89: đang gửi đơn bổ sung — dùng để chặn bấm gửi hai lần. */
  const [saving, setSaving] = useState(false);

  /*
   * BE-89: lỗi hiển thị ngay dưới từng ô nhập. BE-92: xoá lỗi của một ô ngay khi người dùng sửa
   * ô đó, không bắt họ bấm Gửi lần nữa mới thấy lỗi cũ biến mất.
   */
  const [fieldErrors, setFieldErrors] = useState({});

  const clearFieldError = useCallback((key) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  /** Danh sách field của một mẫu đơn (BE có thể trả `fields` dạng chuỗi JSON). */
  const fieldsOfDocumentType = useCallback((docTypeId) => {
    const dt = documentTypes.find((d) => d.id === docTypeId);
    let list = dt?.fields || [];
    if (typeof list === 'string') {
      try { list = JSON.parse(list); } catch { list = []; }
    }
    return Array.isArray(list) ? list : [];
  }, [documentTypes]);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    clearFieldError(`__${key}`);
  };
  const setDynamic = (name, val) => {
    setForm((f) => ({
      ...f,
      dynamic: { ...f.dynamic, [name]: val }
    }));
    clearFieldError(name);
  };

  // Current selected document type
  const selectedDocType = documentTypes.find(d => d.id === form.documentTypeId);
  // BE-89: field theo đúng thứ tự cấu hình; memo hoá để danh sách không đổi tham chiếu mỗi lần render
  // (nhiều effect phụ thuộc vào nó).
  const currentFields = useMemo(() => {
    let list = selectedDocType?.fields || [];
    if (typeof list === 'string') {
      try { list = JSON.parse(list); } catch (e) { list = []; }
    }
    return sortFields(Array.isArray(list) ? list : []);
  }, [selectedDocType]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Chế độ bổ sung: nạp lại dữ liệu đơn cũ vào form.
  // skipDynamicResetRef chặn effect "reset dynamic khi đổi loại đơn" xoá mất dữ liệu vừa nạp.
  const skipDynamicResetRef = useRef(false);
  /*
   * BE-89: chỉ nạp MỘT LẦN cho mỗi đơn.
   * Trước đây effect phụ thuộc vào `existingRequest` (đối tượng được tạo mới mỗi lần danh sách tải lại)
   * nên mỗi lần nền cập nhật là form bị nạp lại từ đầu — người dùng đang điền dở bị mất nội dung, và
   * các ô vừa sửa bị trả về giá trị cũ.
   */
  const prefilledForRef = useRef(null);
  useEffect(() => {
    if (!existingRequest || loading) return;
    if (prefilledForRef.current === existingRequest.id) return;
    prefilledForRef.current = existingRequest.id;

    const raw = existingRequest._rawData || {};
    const { departments: deptIds } = raw;
    // BE-89: dữ liệu đơn cũ có thể lưu dưới tên field CŨ; quy về tên field của cấu hình hiện tại
    // để các ô Từ ngày / Đến ngày / Lý do / Mô tả công việc hiện đúng giá trị đã nhập.
    // Tra field theo `existingRequest.documentTypeId` (không phải form.documentTypeId, vì lúc này
    // form còn trống nên sẽ tra ra danh sách rỗng).
    const { dynamic } = buildDynamicFromRaw(fieldsOfDocumentType(existingRequest.documentTypeId), raw);
    skipDynamicResetRef.current = true;
    setForm({
      documentTypeId: existingRequest.documentTypeId || '',
      reason: existingRequest.reasonText || '',
      departments: Array.isArray(deptIds) ? deptIds : [],
      dynamic
    });
    setSelectedApproverId(existingRequest.selectedApproverId || '');
    setFiles({});
  }, [existingRequest, loading, fieldsOfDocumentType]);

  // Reset dynamic fields when document type changes
  useEffect(() => {
    if (skipDynamicResetRef.current) {
      skipDynamicResetRef.current = false;
    } else {
      setForm(f => ({ ...f, dynamic: {} }));
    }
    
    if (form.documentTypeId) {
      workflowService.getActiveForDocumentType(form.documentTypeId)
        .then(workflows => {
          if (workflows && !Array.isArray(workflows)) { setActiveWorkflow(workflows); } else if (workflows && workflows.length > 0) {
            setActiveWorkflow(workflows[0]);
          } else {
            setActiveWorkflow(null);
          }
        })
        .catch(err => {
          console.error("Failed to load workflow:", err);
          setActiveWorkflow(null);
        });
    } else {
      setActiveWorkflow(null);
    }
  }, [form.documentTypeId]);

  // BE-50: nạp luồng duyệt đã phân giải (đúng người thật). Gọi lại khi đổi loại đơn hoặc
  // đổi phòng ban đích — vì người duyệt phụ thuộc cả hai.
  useEffect(() => {
    if (!form.documentTypeId) {
      setFlowPreview(null);
      return;
    }
    let cancelled = false;
    workflowService.preview(form.documentTypeId, form.departments || [])
      .then((data) => { if (!cancelled) setFlowPreview(data); })
      .catch(() => { if (!cancelled) setFlowPreview(null); });
    return () => { cancelled = true; };
  }, [form.documentTypeId, form.departments]);

  // Auto-calculate days when dates change
  useEffect(() => {
    const fromField = currentFields.find(f => f.label === 'Từ ngày' || (resolveFieldKey(f)) === 'Từ ngày');
    const toField = currentFields.find(f => f.label === 'Đến ngày' || (resolveFieldKey(f)) === 'Đến ngày');
    const totalField = currentFields.find(f => f.label === 'Tổng số ngày' || (resolveFieldKey(f)) === 'Tổng số ngày');
    
    if (fromField && toField && totalField) {
      const from = form.dynamic[fromField.name || fromField.fieldName || fromField.id];
      const to = form.dynamic[toField.name || toField.fieldName || toField.id];
      if (from && to) {
        const d1 = new Date(from);
        const d2 = new Date(to);
        if (!isNaN(d1) && !isNaN(d2) && d2 >= d1) {
          const diffDays = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
          setForm(f => {
            if (f.dynamic[totalField.name || totalField.fieldName || totalField.id] == diffDays) return f;
            return { ...f, dynamic: { ...f.dynamic, [totalField.name || totalField.fieldName || totalField.id]: diffDays } };
          });
        }
      }
    }
  }, [form.dynamic, currentFields]);

  // BE-04: bước đầu tiên của luồng duyệt
  const firstStep = useMemo(() => {
    const steps = activeWorkflow?.steps;
    if (!Array.isArray(steps) || steps.length === 0) return null;
    return [...steps].sort((a, b) => a.stepOrder - b.stepOrder)[0];
  }, [activeWorkflow]);

  // Loại hình duyệt của bước 1 — quyết định phần "Phòng ban liên quan" hiện hay ẩn
  const firstStepAppType = (firstStep?.approvalType || '').toLowerCase();
  const firstStepDesignatedIds = Array.isArray(firstStep?.approverIds) && firstStep.approverIds.length > 0
    ? firstStep.approverIds
    : (Array.isArray(firstStep?.sequentialOrder) ? firstStep.sequentialOrder : []);
  const firstStepHasDesignatedApprovers = firstStepAppType === 'role'
    && firstStepDesignatedIds.length > 0;
  const firstStepMultiRule = (firstStep?.multiRule || '').toLowerCase();
  // BE-17: chỉ luồng theo chức danh chưa chỉ định người mới cần chọn phòng ban liên quan.
  const showDepartmentPicker = firstStepAppType === 'role' && !firstStepHasDesignatedApprovers;
  // Luồng tự tìm người theo phòng/chức vụ của người tạo: quản lý trực tiếp / chuỗi quản lý
  const isHierarchyFlow = firstStepAppType === 'hierarchy';
  const isChainFlow = firstStepAppType === 'chain';
  const isSpecificFlow = firstStepAppType === 'specific_user' || firstStepAppType === 'specific';

  // BE-04: danh sách người CÓ THỂ duyệt bước 1.
  const firstStepCandidates = useMemo(() => {
    if (!firstStep) return [];
    const appType = (firstStep.approvalType || '').toLowerCase();

    if (appType === 'specific_user' || appType === 'specific') {
      const emp = employees?.find(e => e.id === (firstStep.specificUserId || firstStep.specificUser));
      return emp ? [emp] : [];
    }

    const designatedIds = Array.isArray(firstStep.approverIds) && firstStep.approverIds.length > 0
      ? firstStep.approverIds
      : (Array.isArray(firstStep.sequentialOrder) ? firstStep.sequentialOrder : []);
    if (appType === 'role' && designatedIds.length > 0) {
      return designatedIds
        .map((id) => employees?.find(e => e.id === id))
        .filter(Boolean)
        .map(e => ({ id: e.id, name: e.name, position: e.position || e.role }));
    }

    if (appType === 'role' && firstStep.role) {
      const role = String(firstStep.role).toUpperCase();
      const matched = (employees || []).filter((e) => {
        if (String(e.role || '').toUpperCase() === role) return true;
        if (String(e.position || '').toUpperCase() === role) return true;
        if (Array.isArray(e.roles) && e.roles.some(r => String(r).toUpperCase() === role)) return true;
        if (Array.isArray(e.secondary) && e.secondary.some(s => String(s.position || '').toUpperCase() === role)) return true;
        if (Array.isArray(e.allPositions) && e.allPositions.some(p => String(p.position || p.name || '').toUpperCase() === role)) return true;
        return Array.isArray(e.systemRoles)
          && e.systemRoles.some(r => String(r?.roleName || r || '').toUpperCase() === role);
      });
      return matched.map(e => ({ id: e.id, name: e.name, position: e.position || e.role }));
    }

    if (appType === 'hierarchy' || appType === 'chain') {
      // BE-17: người quản lý trực tiếp của CHÍNH người tạo đơn (theo phòng ban & chức vụ
      // mà người tạo được phân bổ), KHÔNG phải theo phòng ban liên quan.
      const ownDeptId = currentUser?.departmentId;
      const ownManager = ownDeptId ? departments.find(d => d.id === ownDeptId)?.managerId : null;
      if (ownManager) {
        const emp = employees?.find(e => e.id === ownManager);
        return emp ? [{ id: emp.id, name: emp.name, position: emp.position }] : [];
      }
      return [];
    }

    return [];
  }, [firstStep, employees, departments, currentUser]);

  // Bỏ lựa chọn cũ nếu nó không còn trong danh sách ứng viên
  useEffect(() => {
    if (selectedApproverId && !firstStepCandidates.some(c => c.id === selectedApproverId)) {
      setSelectedApproverId('');
    }
  }, [firstStepCandidates, selectedApproverId]);

  // BE-17: không bắt chọn người riêng lẻ với luồng sắp xếp; backend chốt theo phòng ban hoặc danh sách cấu hình.
  const mustPickApprover = false;

  /**
   * BE-85: khi mở popup luồng duyệt, đặt thanh cuộn ngang vào CHÍNH GIỮA nội dung.
   * Hàng người duyệt cùng cấp được giữ trên một dòng nên có lúc rộng hơn khung; căn giữa lúc mở giúp
   * nhìn thấy ngay phần giữa (thường là tên các bước), người dùng tự kéo sang hai bên để xem nốt.
   */
  const flowScrollRef = useRef(null);
  useEffect(() => {
    if (!flowOpen) return;
    const el = flowScrollRef.current;
    if (!el) return;
    const centre = () => { el.scrollLeft = Math.max(0, (el.scrollWidth - el.clientWidth) / 2); };
    // Chờ nội dung (chip nhân sự, tên bước) dựng xong mới biết bề rộng thật.
    const raf = requestAnimationFrame(centre);
    return () => cancelAnimationFrame(raf);
  }, [flowOpen]);

  /*
   * BE-89: kiểm tra dữ liệu NGAY TRÊN FORM, không đóng form rồi mới báo lỗi bên ngoài.
   * Trước đây bấm "Bổ sung & gửi lại" là modal đóng ngay; máy chủ từ chối thì người dùng chỉ thấy
   * badge ở danh sách và mất hết nội dung vừa nhập, phải mở lại từ đầu.
   * (state `fieldErrors` khai báo ở đầu component — xem `clearFieldError`.)
   */

  /** BE-89: câu lỗi ngay dưới ô nhập tương ứng, không đóng form rồi mới báo bên ngoài. */
  const renderFieldError = (key) => (
    fieldErrors[key] ? (
      <span className="text-xs text-error">{fieldErrors[key]}</span>
    ) : null
  );

  /** Trả về object lỗi theo khoá field; rỗng nghĩa là hợp lệ. */
  const validateForm = () => {
    const errs = {};
    if (!form.documentTypeId) errs.__documentType = t('Vui lòng chọn loại đề xuất');
    if (!form.reason.trim()) errs.__reason = t('Vui lòng nhập lý do / mô tả');

    currentFields.forEach((f) => {
      if (f.type === 'LABEL' || f.type === 'INFO') return;
      const key = resolveFieldKey(f);
      if (!key) return;
      const value = form.dynamic[key];
      const empty = value === undefined || value === null || String(value).trim() === '';

      if (f.required && empty) {
        errs[key] = t('Trường "{v0}" là bắt buộc', { v0: t(fieldLabel(f)) });
        return;
      }

      // BE-92: field kiểu số phải là số hợp lệ và KHÔNG được âm (VD "số ngày" = -15).
      if (!empty && isNumberField(f)) {
        const problem = checkNumberValue(value);
        if (problem === 'invalid') {
          errs[key] = t('Trường "{v0}" phải là một số', { v0: t(fieldLabel(f)) });
        } else if (problem === 'negative') {
          errs[key] = t('Trường "{v0}" không được là số âm', { v0: t(fieldLabel(f)) });
        }
      }
    });

    return errs;
  };

  const submit = async (e) => {
    e.preventDefault();

    const errs = validateForm();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      // Giữ nguyên form để người dùng sửa; cuộn tới ô lỗi đầu tiên.
      const firstKey = Object.keys(errs)[0];
      const el = document.querySelector(`[data-field-error="${CSS.escape(firstKey)}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      pushToast(t('Vui lòng điền đủ các trường bắt buộc còn thiếu.'), 'error');
      return;
    }

    // Build payload theo BE DTO
    const payload = {
      documentTypeId: form.documentTypeId,
      reason: form.reason.trim(),
      data: {
        ...form.dynamic,
        // BE-17: chỉ luồng "theo chức danh / bộ phận" mới lưu phòng ban liên quan;
        // các luồng khác tự resolve theo phòng/chức vụ người tạo nên không gửi.
        departments: showDepartmentPicker ? form.departments : []
      },
    };

    /*
     * BE-89: giữ lại các khoá cũ mà cấu hình field hiện tại không còn nhận diện.
     * Máy chủ chỉ ghi những khoá khớp field trong mẫu đơn, nên nếu không gửi kèm thì nội dung cũ bị
     * XOÁ sau khi bổ sung — đơn bị mất trường / đổi giá trị.
     */
    if (isEdit) {
      const { unmatched } = buildDynamicFromRaw(currentFields, existingRequest?._rawData || {});
      payload.data = { ...unmatched, ...payload.data };
    }

    // Auto extract dates if present
    const fromField = currentFields.find(f => f.label === 'Từ ngày' || (resolveFieldKey(f)) === 'Từ ngày');
    const toField = currentFields.find(f => f.label === 'Đến ngày' || (resolveFieldKey(f)) === 'Đến ngày');
    const totalField = currentFields.find(f => f.label === 'Tổng số ngày' || (resolveFieldKey(f)) === 'Tổng số ngày');

    if (fromField && form.dynamic[resolveFieldKey(fromField)]) {
      payload.startDate = form.dynamic[resolveFieldKey(fromField)];
    }
    if (toField && form.dynamic[resolveFieldKey(toField)]) {
      payload.endDate = form.dynamic[resolveFieldKey(toField)];
    }
    if (totalField && form.dynamic[resolveFieldKey(totalField)]) {
      payload.totalDays = parseInt(form.dynamic[resolveFieldKey(totalField)], 10);
    }

    // BE-04: chỉ gửi khi bước 1 (theo chức danh) có nhiều người và đã chọn 1
    if (mustPickApprover && selectedApproverId) {
      payload.selectedApproverId = selectedApproverId;
    }

    // BE-09: File thật để provider upload sau khi có applicationId
    // (applicationService.create chỉ đọc các field nó cần nên key này không lọt ra BE)
    const pendingFiles = Object.values(files);
    if (pendingFiles.length > 0) {
      payload.attachments = pendingFiles;
    }

    if (isEdit) {
      // BE-15/BE-89: chỉ đóng form khi máy chủ đã nhận. Lỗi thì giữ nguyên nội dung đã nhập để sửa.
      setSaving(true);
      try {
        await updateRequest(existingRequest.id, payload);
        if (onSubmitted) onSubmitted();
        onClose();
      } catch (err) {
        setFieldErrors({ __submit: describeApiError(err, t, 'Không gửi được đơn bổ sung') });
      } finally {
        setSaving(false);
      }
      return;
    }

    createRequest(payload);
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface rounded-lg shadow-xl w-full max-w-[680px] flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-outline-variant/30">
          <div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">
              {isEdit ? t('Bổ Sung Đơn Từ') : t('Tạo Đề Xuất Mới')}
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
              {isEdit
                ? t('Cập nhật thông tin theo yêu cầu của người duyệt rồi gửi lại')
                : t('Điền đầy đủ thông tin để gửi yêu cầu phê duyệt')}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors rounded-full p-1 hover:bg-surface-variant cursor-pointer">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          {/* Document Type Select */}
          <div className="flex flex-col gap-2">
            <label className={labelCls}>{t('Loại Đề Xuất')}</label>
            {/*
              BE-96: dropdown gom theo danh mục (giống màn Cấu hình luồng duyệt) và có ô tìm kiếm
              NGAY BÊN TRONG dropdown; không hiển thị chú thích "đã cấu hình ở khối nào".
            */}
            <DocumentTypeSelect
              documentTypes={documentTypes}
              value={form.documentTypeId}
              loading={loading}
              disabled={isEdit}
              onChange={(id) => {
                setForm(f => ({ ...f, documentTypeId: id }));
                // BE-92: đổi mẫu đơn thì lỗi của mẫu cũ không còn nghĩa — bỏ hết để form sạch.
                setFieldErrors({});
              }}
            />
          </div>

          {/* Department Checkboxes — chỉ hiện với luồng duyệt theo chức danh */}
          {showDepartmentPicker && departments.length > 0 && (
            <div className="flex flex-col gap-2">
              <label className={labelCls}>{t('Phòng ban liên quan')}</label>
              <span className="text-xs text-secondary mt-[-4px]">
                {t('Nhấn chọn theo đúng thứ tự mà bạn muốn luồng duyệt diễn ra (Ví dụ: Số 1 sẽ duyệt trước, Số 2 duyệt sau)')}
              </span>
              <div className="flex gap-2.5 flex-wrap mt-1">
                {departments.filter(d => d.status === 'Active' || d.status === 'active').map((d) => {
                  const idx = form.departments.indexOf(d.id);
                  const isChecked = idx > -1;
                  return (
                    <label 
                      key={d.id} 
                      className={`flex items-center gap-1.5 cursor-pointer border rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-200 select-none ${
                        isChecked 
                          ? 'bg-primary text-on-primary border-primary shadow-sm shadow-primary/20' 
                          : 'bg-surface border-outline-variant text-on-surface-variant hover:border-outline hover:bg-surface-container-low hover:text-on-surface'
                      }`}
                    >
                      <input
                        className="sr-only"
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const newArr = e.target.checked 
                            ? [...form.departments, d.id] 
                            : form.departments.filter(x => x !== d.id);
                          setForm(f => ({ ...f, departments: newArr }));
                        }}
                      />
                      {isChecked && (
                        <span className="flex items-center justify-center w-4 h-4 rounded-full bg-white text-primary text-[10px] font-bold shadow-sm">
                          {idx + 1}
                        </span>
                      )}
                      <span>{t(d.name)}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}



          {/* BE-17: quản lý trực tiếp / chuỗi quản lý -> người duyệt tự suy ra từ phòng & chức vụ của người tạo */}
          {(isHierarchyFlow || isChainFlow) && (
            <div className="flex items-start gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-2.5 text-sm text-on-surface">
              <span className="material-symbols-outlined text-[18px] text-primary flex-shrink-0">
                {isHierarchyFlow ? 'supervisor_account' : 'account_tree'}
              </span>
              <span>
                {isHierarchyFlow ? (
                  <>{t('Người duyệt là')} <strong>{t('quản lý trực tiếp')}</strong> {t('theo phòng ban & chức vụ của bạn')}{firstStepCandidates[0] ? <>: <strong>{firstStepCandidates[0].name}</strong></> : t(' (chưa xác định được quản lý)')}.</>
                ) : (
                  <>{t('Đơn đi theo')} <strong>{t('chuỗi quản lý liên tiếp')}</strong> {t('(tăng dần theo chức danh/bộ phận) của phòng ban bạn thuộc.')}</>
                )}
              </span>
            </div>
          )}

          {/* BE-17: chỉ định người -> hiện đúng 1 người duy nhất được chỉ định */}
          {isSpecificFlow && firstStepCandidates[0] && (
            <div className="flex flex-col gap-2">
              <label className={labelCls}>{t('Người duyệt (chỉ định)')}</label>
              <div className="flex items-center gap-2.5 rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2.5">
                {firstStepCandidates[0].avatar ? (
                  <img src={firstStepCandidates[0].avatar} alt={firstStepCandidates[0].name} className="w-8 h-8 rounded-full object-cover border border-outline-variant" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#29b6f6] text-white text-[12px] flex items-center justify-center">
                    {(firstStepCandidates[0].name || '?').trim().split(' ').slice(-1)[0].substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-on-surface">{firstStepCandidates[0].name}</span>
                  <span className="text-xs text-secondary">{firstStepCandidates[0].position || t('Người duyệt')}</span>
                </div>
              </div>
            </div>
          )}

          {/* BE-17: luồng theo chức danh/bộ phận, nhiều người -> bắt buộc chọn 1 */}
          {mustPickApprover && (
            <div className="flex flex-col gap-2">
              <label className={labelCls}>
                {t('Chọn người duyệt')} <span className="text-error">*</span>
                <span className="ml-1.5 text-xs normal-case font-normal text-secondary">
                  {t('(bước 1 có')} {firstStepCandidates.length} {t('người có thể duyệt)')}
                </span>
              </label>
              <select
                className={fieldCls}
                value={selectedApproverId}
                onChange={(e) => setSelectedApproverId(e.target.value)}
              >
                <option value="">{t('-- Chọn người duyệt --')}</option>
                {firstStepCandidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.position ? ` · ${c.position}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Lý do/Yêu cầu */}
          <div className="flex flex-col gap-2" data-field-error="__reason">
            <label className={labelCls}>{t('Lý do / Mô tả')} <span className="text-error">*</span></label>
            <textarea
              className="w-full rounded-md border border-outline-variant bg-surface-container-lowest p-3 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none min-h-[80px]"
              value={form.reason}
              onChange={set('reason')}
              placeholder={t('Nhập lý do hoặc mô tả yêu cầu...')}
              required
            />
            {renderFieldError('__reason')}
          </div>

          {/* Dynamic Fields từ BE */}
          {currentFields.length > 0 && currentFields.map((f) => {
            // Skip fields that are just labels/descriptions
            if (f.type === 'LABEL' || f.type === 'INFO') return null;

            if (f.type === 'NUMBER' || f.type === 'Số') {
              const labelKey = f.label || f.id;
              // 'tự động' là giá trị dữ liệu của field (BE trả về), KHÔNG dịch.
              const fieldId = resolveFieldKey(f);
              const isAuto = f.options?.includes('auto') || f.options?.includes('tự động');
              return (
                <div key={fieldId} data-field-error={fieldId} className="flex flex-col gap-2">
                  <label className={labelCls}>{t(labelKey)} {f.required && <span className="text-error">*</span>}</label>
                  {renderFieldError(fieldId)}
                  <input
                    className={fieldCls}
                    type="number"
                    required={f.required}
                    min="0"
                    step="any"
                    value={form.dynamic[fieldId] || ''}
                    onChange={(e) => setDynamic(fieldId, e.target.value)}
                    placeholder={f.placeholder || ''}
                    readOnly={isAuto}
                    disabled={isAuto}
                  />
                </div>
              );
            }

            if (f.type === 'DATE' || f.type === 'Ngày') {
              const labelKey = f.label || f.id;
              const fieldId = resolveFieldKey(f);
              let inputType = 'date';
              const l = (labelKey || '').toLowerCase();
              if (l.includes('giờ') || l.includes('time')) inputType = 'time';
              if (l.includes('ngày và giờ') || l.includes('datetime')) inputType = 'datetime-local';

              return (
                <div key={fieldId} data-field-error={fieldId} className="flex flex-col gap-2">
                  <label className={labelCls}>{t(labelKey)} {f.required && <span className="text-error">*</span>}</label>
                  {renderFieldError(fieldId)}
                  <input 
                    className={fieldCls} 
                    type={inputType} 
                    required={f.required} 
                    value={form.dynamic[fieldId] || ''} 
                    onChange={(e) => setDynamic(fieldId, e.target.value)} 
                  />
                </div>
              );
            }

            if (f.type === 'TEXTAREA' || f.type === 'Văn bản') {
              const labelKey = f.label || f.id;
              const fieldId = resolveFieldKey(f);
              return (
                <div key={fieldId} data-field-error={fieldId} className="flex flex-col gap-2">
                  <label className={labelCls}>{t(labelKey)} {f.required && <span className="text-error">*</span>}</label>
                  {renderFieldError(fieldId)}
                  <textarea
                    className="w-full rounded-md border border-outline-variant bg-surface-container-lowest p-3 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none min-h-[80px]"
                    required={f.required}
                    value={form.dynamic[fieldId] || ''}
                    onChange={(e) => setDynamic(fieldId, e.target.value)}
                    placeholder={f.placeholder || t('Nhập thông tin...')}
                  />
                </div>
              );
            }

            if (f.type === 'SELECT' || f.type === 'Lựa chọn') {
              const labelKey = f.label || f.id;
              const fieldId = resolveFieldKey(f);
              const options = f.options || [];
              return (
                <div key={fieldId} data-field-error={fieldId} className="flex flex-col gap-2">
                  <label className={labelCls}>{t(labelKey)} {f.required && <span className="text-error">*</span>}</label>
                  {renderFieldError(fieldId)}
                  <select
                    className={fieldCls}
                    required={f.required}
                    value={form.dynamic[fieldId] || ''}
                    onChange={(e) => setDynamic(fieldId, e.target.value)}
                  >
                    <option value="">{t('-- Chọn --')}</option>
                    {options.map((opt) => {
                      const optValue = typeof opt === 'string' ? opt : opt.value;
                      const optLabel = typeof opt === 'string' ? opt : opt.label;
                      return <option key={optValue} value={optValue}>{optLabel}</option>;
                    })}
                  </select>
                </div>
              );
            }

            if (f.type === 'FILE' || f.type === 'Tải file') {
              const labelKey = f.label || f.id;
              const fieldId = resolveFieldKey(f);
              
              // Recover templateFile from localStorage since backend doesn't save it
              let templateFile = f.templateFile;
              if (!templateFile && selectedDocType) {
                try {
                  const stored = JSON.parse(localStorage.getItem('kmart.form.fields') || '{}');
                  const localFields = stored[selectedDocType.name] || [];
                  const localF = localFields.find(x => x.id === f.name || x.label === f.label || x.id === labelKey);
                  if (localF && localF.templateFile) templateFile = localF.templateFile;
                } catch {}
              }

              return (
                <div key={fieldId} data-field-error={fieldId} className="flex flex-col gap-2">
                  <div className="flex justify-between items-end">
                    <label className={labelCls}>{t(labelKey)} {f.required && <span className="text-error">*</span>}</label>
                  {renderFieldError(fieldId)}
                    {templateFile && templateFile.name && (
                      <a href="#" className="flex items-center gap-1 text-xs text-primary font-medium hover:underline bg-primary/5 px-2 py-1 rounded">
                        <span className="material-symbols-outlined text-[14px]">download</span>
                        {t('Tải biểu mẫu')}
                      </a>
                    )}
                  </div>
                  <label className="flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-outline-variant rounded-lg bg-surface hover:bg-surface-container-lowest hover:border-primary/50 transition-colors cursor-pointer group">
                    <span className="material-symbols-outlined text-[24px] text-outline group-hover:text-primary transition-colors">cloud_upload</span>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-on-surface group-hover:text-primary transition-colors">
                        {(files[fieldId]?.name || form.dynamic[fieldId])
                          ? (files[fieldId]?.name || form.dynamic[fieldId])
                          : t('Nhấn để chọn file tải lên')}
                      </span>
                      <span className="text-xs text-secondary">{t('Hỗ trợ PDF, DOCX, XLSX (Tối đa 10MB)')}</span>
                    </div>
                    <input
                      className="sr-only"
                      type="file"
                      required={f.required}
                      accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.csv"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        // BE-75: báo ngay trên form thay vì để máy chủ từ chối rồi hiện lỗi khó hiểu.
                        const problem = validateAttachment(file, t);
                        if (problem) {
                          pushToast(problem, 'error');
                          e.target.value = '';
                          return;
                        }
                        setDynamic(fieldId, file.name);
                        // BE-09: giữ File thật để upload sau khi đơn được tạo
                        setFiles((prev) => ({ ...prev, [fieldId]: file }));
                      }}
                    />
                  </label>
                </div>
              );
            }

            if (f.type === 'USER' || f.type === 'Người duyệt thay') {
              const labelKey = f.label || f.id;
              const fieldId = resolveFieldKey(f);
              return (
                <div key={fieldId} data-field-error={fieldId} className="flex flex-col gap-2">
                  <label className={labelCls}>{t(labelKey)} {f.required && <span className="text-error">*</span>}</label>
                  {renderFieldError(fieldId)}
                  <select
                    className={fieldCls}
                    required={f.required}
                    value={form.dynamic[fieldId] || ''}
                    onChange={(e) => setDynamic(fieldId, e.target.value)}
                  >
                    <option value="">{t('-- Chọn người --')}</option>
                    {employees?.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({t(emp.position) || t('Nhân viên')})</option>
                    ))}
                  </select>
                </div>
              );
            }

            // Default: render as text input
            const labelKey = f.label || f.id;
            const fieldId = resolveFieldKey(f);
            return (
              <div key={fieldId} data-field-error={fieldId} className="flex flex-col gap-2">
                <label className={labelCls}>{t(labelKey)} {f.required && <span className="text-error">*</span>}</label>
                  {renderFieldError(fieldId)}
                <input
                  className={fieldCls}
                  type="text"
                  required={f.required}
                  value={form.dynamic[fieldId] || ''}
                  onChange={(e) => setDynamic(fieldId, e.target.value)}
                  placeholder={f.placeholder || ''}
                />
              </div>
            );
          })}

          {/* No fields available message */}
          {selectedDocType && currentFields.length === 0 && (
            <p className="text-sm text-on-surface-variant italic">{t('Loại đề xuất này không có trường bổ sung.')}</p>
          )}

          {/* Loading state */}
          {loading && (
            <p className="text-sm text-on-surface-variant">{t('Đang tải loại đề xuất...')}</p>
          )}
        </div>

        {/* Luồng phê duyệt dự kiến — bản thu gọn (mờ) + nút xem full luồng.
            BE-20: modal linh động, cây to quá thì thu nhỏ/mờ và có popup xem đầy đủ. */}
        {activeWorkflow && activeWorkflow.steps && activeWorkflow.steps.length > 0 && (
          <div className="px-6 py-4 bg-surface-container-lowest border-t border-outline-variant/30">
            <div className="flex items-center justify-between mb-3">
              <label className="block font-label-md text-label-md text-on-surface-variant">{t('Luồng phê duyệt dự kiến')}</label>
              <button
                type="button"
                onClick={() => setFlowOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">open_in_full</span>
                {t('Xem chi tiết luồng')}
              </button>
            </div>
            <div className="relative">
              {/* Bản xem trước: thu nhỏ + mờ để bao quát toàn bộ sơ đồ */}
              <div className="overflow-hidden max-h-[220px] rounded-lg border border-outline-variant/50 bg-surface-container-low/40">
                <div className="scale-[0.82] origin-top pointer-events-none opacity-70 overflow-x-auto">
                  <ApprovalFlowTree
                    steps={activeWorkflow.steps}
                    resolvedSteps={flowPreview?.steps}
                    departments={departments}
                    employees={employees}
                    currentUser={currentUser}
                    selectedApproverId={selectedApproverId}
                    departmentsSelected={form.departments}
                    variant="inline"
                  />
                </div>
              </div>
              {/* Lớp phủ mời bấm xem full */}
              <button
                type="button"
                onClick={() => setFlowOpen(true)}
                className="absolute inset-0 flex items-end justify-center pb-2 bg-gradient-to-t from-surface/90 to-transparent cursor-pointer group"
              >
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-on-primary text-xs font-semibold shadow-sm group-hover:bg-primary/90 transition-colors">
                  <span className="material-symbols-outlined text-[16px]">open_in_full</span>
                  {t('Bấm vào đây để xem chi tiết luồng')}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* BE-20: popup xem FULL luồng phê duyệt */}
        {flowOpen && (
          <div
            className="fixed inset-0 z-[120] bg-black/60 flex items-center justify-center p-4"
            onClick={() => setFlowOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-surface rounded-xl shadow-2xl w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/40">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-primary text-[22px]">account_tree</span>
                  <div>
                    <h3 className="text-base font-bold text-on-surface">{t('Chi tiết luồng phê duyệt')}</h3>
                    <p className="text-xs text-secondary">{selectedDocType?.name || t('Đề xuất')} · {activeWorkflow?.name || ''}</p>
                  </div>
                </div>
                <button type="button" onClick={() => setFlowOpen(false)} className="p-1.5 rounded-full text-on-surface-variant hover:bg-surface-variant cursor-pointer">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div ref={flowScrollRef} className="flex-1 overflow-auto p-6 bg-surface-container-lowest">
                {/* BE-85: khi hàng người duyệt cùng cấp rộng hơn khung, người dùng kéo ngang để xem
                    nốt; `min-w-max` giữ cho nội dung luôn được căn giữa cả khi phải cuộn. */}
                <div className="min-w-max flex justify-center">
                  <ApprovalFlowTree
                    steps={activeWorkflow.steps}
                    resolvedSteps={flowPreview?.steps}
                    departments={departments}
                    employees={employees}
                    currentUser={currentUser}
                    selectedApproverId={selectedApproverId}
                    departmentsSelected={form.departments}
                    variant="full"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex flex-col gap-3 p-6 border-t border-outline-variant/30 bg-surface-container-low">
          {/* BE-89: lỗi từ máy chủ hiện NGAY TRONG form, không đóng form rồi báo badge bên ngoài. */}
          {fieldErrors.__submit && (
            <div className="flex items-start gap-2 rounded-md border border-error/20 bg-error-container p-3 text-sm text-on-error-container">
              <span className="material-symbols-outlined text-[18px] leading-none">error</span>
              <span>{fieldErrors.__submit}</span>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-md border border-outline-variant text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
            >
              {t('Hủy')}
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={saving}
              className="px-5 py-2.5 rounded-md bg-primary text-on-primary hover:bg-primary/90 transition-colors font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? t('Đang gửi...') : (isEdit ? t('Bổ sung & gửi lại') : t('Gửi yêu cầu'))}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
