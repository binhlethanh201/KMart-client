import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useApproval } from '../../../context/useApproval';
import { useHr } from '../../hr/context/HrProvider';
import { documentTypeService } from '../../../services/documentTypeService';
import { workflowService } from '../../../services/workflowService';
import { delegationService } from '../../../services/delegationService';
import ApprovalFlowTree from './ApprovalFlowTree';
import DocumentTypeSelect from './DocumentTypeSelect';
import { buildDynamicFromRaw, fieldLabel, resolveFieldKey, sortFields } from '../formFieldMapping';
import { checkNumberValue, isNumberField } from '../formFieldValidation';
import { useI18n } from '../../../i18n/I18nProvider';
import { describeApiError } from '../../../utils/apiError';
import { getFullAvatarUrl } from '../../hr/services/userService';
import Select from '../../../components/Select';

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
  const { createRequest, updateRequest, submitDraft, retryDraftUploads, finalizePendingDraft, departments, currentUser, pushToast } = useApproval();
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
  
  // BE-115: API trả về ĐỦ mẫu đơn (mẫu thiếu người phê duyệt có canCreate=false để giao diện làm mờ).
  // Mặc định phải chọn mẫu TẠO ĐƯỢC đầu tiên, nếu không form sẽ mở sẵn ở mẫu bị chặn.
  const initialType = documentTypes.find((d) => d.canCreate !== false) || null;
  
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
  /** PROD-UP1: upload tệp đính kèm lỗi — { draftId, failed:[{file,message}], isNew }. */
  const [uploadIssue, setUploadIssue] = useState(null);
  /** PROD-UP1: draft đã tạo (khi upload lỗi ở luồng tạo mới) — gửi lại phải UPDATE, không tạo trùng. */
  const draftIdRef = useRef(null);
  /** PROD-UP1: các File đã upload thành công — không upload lặp lại lần gửi sau. */
  const uploadedFilesRef = useRef(new Set());

  /*
   * BE-146: ủy quyền ĐANG HIỆU LỰC của người tạo đơn (nếu có).
   * Khi đã ủy quyền cho ai rồi thì trường "Người duyệt thay" CHỈ được chọn đúng người đó —
   * không hiện bừa toàn bộ nhân viên. Chỉ khi chưa có ủy quyền mới được chọn tự do.
   */
  const [myActiveDelegation, setMyActiveDelegation] = useState(null);
  useEffect(() => {
    let cancelled = false;
    delegationService.getMine()
      .then((list) => {
        if (cancelled || !Array.isArray(list)) return;
        const now = new Date();
        const active = list.find((d) => d.isActive
          && new Date(d.startDate) <= now
          && new Date(d.endDate) >= now);
        setMyActiveDelegation(active || null);
      })
      .catch(() => { /* không xem được ủy quyền thì giữ lựa chọn tự do */ });
    return () => { cancelled = true; };
  }, []);

  /** Trường "Người duyệt thay" của mẫu đơn hiện tại (nếu có). */
  const isDelegatePickerField = useCallback((f) => (
    f.type === 'Người duyệt thay'
    || /duyệt thay/i.test(String(f.name || f.fieldName || f.label || ''))
  ), []);

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
      try { list = JSON.parse(list); } catch { list = []; }
    }
    return sortFields(Array.isArray(list) ? list : []);
  }, [selectedDocType]);

  /*
   * BE-146: khi đã có ủy quyền hiệu lực, GIÁ TRỊ gửi lên của trường "Người duyệt thay"
   * cũng phải đúng bằng người được ủy quyền (select bị khoá, người dùng không tự đổi được).
   */
  useEffect(() => {
    if (!myActiveDelegation) return;
    const delegateFields = currentFields.filter(isDelegatePickerField);
    if (delegateFields.length === 0) return;
    setForm((f) => {
      let changed = false;
      const dynamic = { ...f.dynamic };
      delegateFields.forEach((fld) => {
        const key = resolveFieldKey(fld);
        if (dynamic[key] !== myActiveDelegation.delegateId) {
          dynamic[key] = myActiveDelegation.delegateId;
          changed = true;
        }
      });
      return changed ? { ...f, dynamic } : f;
    });
  }, [myActiveDelegation, currentFields, isDelegatePickerField]);

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
  /**
   * BE-121: phần "Phòng ban liên quan" chỉ hiện khi quy tắc duyệt THỰC SỰ cho người tạo quyết định:
   *   * "Duyệt theo chức danh" chưa chỉ định người  -> cần biết phòng nào để tìm người duyệt;
   *   * "Đồng thời – cần tất cả / chỉ cần 1 người"  -> người tạo chọn phòng NHẬN đơn.
   * KHÔNG hiện với:
   *   * "Duyệt lần lượt"        -> đơn cứ đi đúng theo danh sách người đã đặt;
   *   * "Chỉ định cụ thể người" -> đơn đi theo đúng người được chỉ định;
   *   * cấp quản lý trực tiếp / chuỗi quản lý -> tự suy theo phòng của người tạo.
   */
  const isSimultaneousRule = firstStepMultiRule === 'and' || firstStepMultiRule === 'or';
  // BE-121: chọn phòng khi "theo chức danh chưa chỉ định người" HOẶC quy tắc "đồng thời".
  const showDepartmentPicker = firstStepAppType === 'role'
    && (!firstStepHasDesignatedApprovers || isSimultaneousRule);

  /**
   * BE-121: chỉ cho chọn trong các phòng ban mà người tạo ĐANG là thành viên (chính hoặc kiêm nhiệm)
   * — đơn phải được gửi vào nơi người đó thực sự thuộc về, không phải bất kỳ phòng nào trong công ty.
   */
  const myDepartmentIds = new Set(
    (currentUser?.allPositions || []).map((p) => p.departmentId).filter(Boolean)
  );
  const selectableDepartments = (departments || []).filter(
    (d) => (d.status === 'Active' || d.status === 'active')
      && (myDepartmentIds.size === 0 || myDepartmentIds.has(d.id))
  );
  // Luồng tự tìm người theo phòng/chức vụ của người tạo: quản lý trực tiếp / chuỗi quản lý
  const isHierarchyFlow = firstStepAppType === 'hierarchy';
  const isChainFlow = firstStepAppType === 'chain';
  const isSpecificFlow = firstStepAppType === 'specific_user' || firstStepAppType === 'specific';

  // BE-125: bước 1 theo luồng đã PHÂN GIẢI THẬT (flowPreview) — nguồn đúng để hiển thị người duyệt,
  // vì máy chủ còn xét chức vụ, cấp bậc và cả các phòng kiêm nhiệm của người tạo.
  const firstPreviewStep = useMemo(() => {
    const steps = flowPreview?.steps;
    if (!Array.isArray(steps) || steps.length === 0) return null;
    return [...steps].sort((a, b) => a.stepOrder - b.stepOrder)[0];
  }, [flowPreview]);

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
      /*
       * BE-125: ưu tiên người duyệt do MÁY CHỦ phân giải (flowPreview) — đây mới là người thật sự
       * duyệt đơn. Trước đây chỉ suy từ `managerId` của phòng ban nên với luồng theo chức vụ/cấp bậc
       * (ví dụ "Quản lý khu vực") khách hàng thấy báo sai "(chưa xác định được quản lý)" ngay cả khi
       * khối "Luồng phê duyệt dự kiến" bên dưới vẫn hiện đúng người duyệt.
       */
      const previewApprovers = Array.isArray(firstPreviewStep?.approvers) ? firstPreviewStep.approvers : [];
      if (previewApprovers.length > 0) {
        return previewApprovers.map((a) => ({
          id: a.id,
          name: a.fullName || a.name,
          position: a.positionName || a.position,
          avatar: getFullAvatarUrl(a.avatarUrl || a.avatar) || a.avatarUrl || a.avatar,
        }));
      }

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
  }, [firstStep, firstPreviewStep, employees, departments, currentUser]);

  // Bỏ lựa chọn cũ nếu nó không còn trong danh sách ứng viên
  useEffect(() => {
    if (selectedApproverId && !firstStepCandidates.some(c => c.id === selectedApproverId)) {
      setSelectedApproverId('');
    }
  }, [firstStepCandidates, selectedApproverId]);

  // WF-07: truyền thẳng object người duyệt đang chỉ định cho sơ đồ luồng để sơ đồ
  // hiện đúng tên người được chọn, không phụ thuộc danh sách nhân sự tải kịp hay không.
  // Luồng "chỉ định 1 người" (specific_user) KHÔNG có ô chọn nên selectedApproverId luôn
  // rỗng — khi đó lấy đúng ứng viên duy nhất mà form đang hiển thị dạng chip.
  const selectedApprover = useMemo(() => {
    if (selectedApproverId) {
      return firstStepCandidates.find((c) => c.id === selectedApproverId) || null;
    }
    if (isSpecificFlow && firstStepCandidates.length === 1) return firstStepCandidates[0];
    return null;
  }, [firstStepCandidates, selectedApproverId, isSpecificFlow]);

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
    // PROD-UP1: bỏ qua các file ĐÃ upload thành công ở lần thử trước (tránh đính kèm trùng).
    const pendingFiles = Object.values(files).filter((f) => !uploadedFilesRef.current.has(f));
    if (pendingFiles.length > 0) {
      payload.attachments = pendingFiles;
    }

    // Ghi nhận file upload thành công = số file đã thử trừ đi số file lỗi provider trả về.
    const trackUploaded = (attempted, failed) => {
      const failedSet = new Set((failed || []).map((x) => x.file));
      attempted.forEach((f) => { if (!failedSet.has(f)) uploadedFilesRef.current.add(f); });
    };

    if (isEdit) {
      // BE-15/BE-89: chỉ đóng form khi máy chủ đã nhận. Lỗi thì giữ nguyên nội dung đã nhập để sửa.
      setSaving(true);
      try {
        const result = await updateRequest(existingRequest.id, payload);
        // PROD-UP1: upload tệp lỗi -> hỏi người dùng, KHÔNG submit âm thầm thiếu tệp.
        if (result?.status === 'upload_failed') {
          trackUploaded(pendingFiles, result.failed);
          setUploadIssue({ draftId: result.draftId, failed: result.failed, isNew: false });
          return;
        }
        if (result?.status === 'submitted') {
          if (onSubmitted) onSubmitted();
          onClose();
        }
        // 'error': provider đã toast — giữ form để sửa tiếp (BE-15)
      } catch (err) {
        setFieldErrors({ __submit: describeApiError(err, t, 'Không gửi được đơn bổ sung') });
      } finally {
        setSaving(false);
      }
      return;
    }

    // PROD-UP1: luồng tạo mới — nếu lần gửi trước upload lỗi thì draft ĐÃ tồn tại,
    // lần này UPDATE lại draft đó thay vì tạo draft mới trùng lặp.
    setSaving(true);
    try {
      const result = draftIdRef.current
        ? await finalizePendingDraft(draftIdRef.current, payload, pendingFiles)
        : await createRequest(payload);
      if (result?.status === 'upload_failed') {
        trackUploaded(pendingFiles, result.failed);
        draftIdRef.current = result.draftId;
        setUploadIssue({ draftId: result.draftId, failed: result.failed, isNew: true });
        return;
      }
      if (result?.status === 'submitted') {
        if (onSubmitted) onSubmitted();
        onClose();
      }
      // 'error': provider đã toast — giữ form để sửa tiếp
    } finally {
      setSaving(false);
    }
  };

  // PROD-UP1: 3 lựa chọn trong dialog khi upload tệp đính kèm thất bại.
  const handleRetryUploads = async () => {
    if (!uploadIssue) return;
    setSaving(true);
    try {
      const result = await retryDraftUploads(uploadIssue.draftId, uploadIssue.failed);
      if (result.status === 'ok') {
        uploadIssue.failed.forEach((f) => uploadedFilesRef.current.add(f.file));
        const sub = await submitDraft(uploadIssue.draftId, {
          isNew: uploadIssue.isNew,
          successMessage: uploadIssue.isNew ? undefined : t('Đã bổ sung và gửi lại đơn'),
        });
        setUploadIssue(null);
        if (sub.status === 'submitted') {
          if (onSubmitted) onSubmitted();
          onClose();
        }
      } else {
        setUploadIssue(result); // vẫn lỗi -> cập nhật nội dung dialog
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSendWithoutFiles = async () => {
    if (!uploadIssue) return;
    setSaving(true);
    try {
      const names = uploadIssue.failed.map((f) => f.file?.name).filter(Boolean).join(', ');
      const sub = await submitDraft(uploadIssue.draftId, {
        isNew: uploadIssue.isNew,
        successMessage: uploadIssue.isNew ? undefined : t('Đã bổ sung và gửi lại đơn'),
      });
      setUploadIssue(null);
      if (sub.status === 'submitted') {
        // Cảnh báo RÕ RÀNG (không phải toast 3s mập mờ như trước) rằng đơn đi thiếu tệp.
        if (names) pushToast(t('Đã gửi đơn KHÔNG kèm các tệp: {v0}', { v0: names }), 'warning', { resolved: true });
        if (onSubmitted) onSubmitted();
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleStayAndEdit = () => {
    setUploadIssue(null); // giữ draftIdRef — lần bấm "Gửi yêu cầu" sau sẽ update draft đó
    pushToast(t('Đơn đang ở trạng thái Nháp — sửa xong bấm "Gửi yêu cầu" để tiếp tục.'), 'info', { resolved: true });
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
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

          {/* Department Checkboxes — chỉ hiện khi quy tắc duyệt cho người tạo quyết định phòng nhận đơn */}
          {showDepartmentPicker && selectableDepartments.length > 0 && (
            <div className="flex flex-col gap-2">
              <label className={labelCls}>{t('Phòng ban liên quan')}</label>
              <span className="text-xs text-secondary mt-[-4px]">
                {isSimultaneousRule
                  ? t('Chọn phòng ban nhận đơn trong số các phòng ban bạn là thành viên (chính hoặc kiêm nhiệm).')
                  : t('Nhấn chọn theo đúng thứ tự mà bạn muốn luồng duyệt diễn ra (Ví dụ: Số 1 sẽ duyệt trước, Số 2 duyệt sau)')}
              </span>
              <div className="flex gap-2.5 flex-wrap mt-1">
                {selectableDepartments.map((d) => {
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
              <Select
                className={fieldCls}
                value={selectedApproverId}
                onChange={setSelectedApproverId}
                placeholder={t('-- Chọn người duyệt --')}
                options={[
                  { value: '', label: t('-- Chọn người duyệt --') },
                  ...firstStepCandidates.map((c) => ({
                    value: c.id,
                    label: `${c.name}${c.position ? ` · ${c.position}` : ''}`,
                  })),
                ]}
              />
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
              const labelKey = fieldLabel(f);
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
              const labelKey = fieldLabel(f);
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
              const labelKey = fieldLabel(f);
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
              const labelKey = fieldLabel(f);
              const fieldId = resolveFieldKey(f);
              const options = f.options || [];
              return (
                <div key={fieldId} data-field-error={fieldId} className="flex flex-col gap-2">
                  <label className={labelCls}>{t(labelKey)} {f.required && <span className="text-error">*</span>}</label>
                  {renderFieldError(fieldId)}
                  <Select
                    className={fieldCls}
                    value={form.dynamic[fieldId] || ''}
                    onChange={(v) => setDynamic(fieldId, v)}
                    placeholder={t('-- Chọn --')}
                    options={[
                      { value: '', label: t('-- Chọn --') },
                      ...options.map((opt) => ({
                        value: typeof opt === 'string' ? opt : opt.value,
                        label: typeof opt === 'string' ? opt : opt.label,
                      })),
                    ]}
                  />
                </div>
              );
            }

            if (f.type === 'FILE' || f.type === 'Tải file') {
              const labelKey = fieldLabel(f);
              const fieldId = resolveFieldKey(f);

              // #5: file mẫu nằm trên BE — tên lấy thẳng từ API (templateFileName), tải qua
              // GET /document-types/{id}/fields/{name}/template. Máy nào / trình duyệt nào /
              // tài khoản nào cũng tải được, không còn phụ thuộc localStorage của người cấu hình
              // (fix UF-08, KB2/KB2b).
              const templateFileName = f.templateFileName;

              const downloadTemplate = async () => {
                try {
                  const blob = await documentTypeService.downloadTemplateFile(selectedDocType.id, f.name);
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = templateFileName || 'template';
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  URL.revokeObjectURL(url);
                } catch {
                  pushToast(t('File mẫu chưa sẵn sàng để tải xuống'), 'error');
                }
              };

              return (
                <div key={fieldId} data-field-error={fieldId} className="flex flex-col gap-2">
                  <div className="flex justify-between items-end gap-2">
                    <div className="min-w-0">
                      <label className={labelCls}>{t(labelKey)} {f.required && <span className="text-error">*</span>}</label>
                      {renderFieldError(fieldId)}
                    </div>
                    {templateFileName && (
                      <button
                        type="button"
                        onClick={downloadTemplate}
                        title={templateFileName}
                        className="flex items-center gap-1 text-xs text-primary font-medium hover:underline bg-primary/5 px-2 py-1 rounded shrink-0"
                      >
                        <span className="material-symbols-outlined text-[14px]">download</span>
                        {t('Tải biểu mẫu')}
                      </button>
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
              const labelKey = fieldLabel(f);
              const fieldId = resolveFieldKey(f);
              // BE-146: đã ủy quyền cho ai thì trường "Người duyệt thay" chỉ hiện đúng người đó
              const lockedDelegate = isDelegatePickerField(f) ? myActiveDelegation : null;
              return (
                <div key={fieldId} data-field-error={fieldId} className="flex flex-col gap-2">
                  <label className={labelCls}>{t(labelKey)} {f.required && <span className="text-error">*</span>}</label>
                  {renderFieldError(fieldId)}
                  <Select
                    className={fieldCls}
                    disabled={Boolean(lockedDelegate)}
                    value={lockedDelegate ? lockedDelegate.delegateId : (form.dynamic[fieldId] || '')}
                    onChange={(v) => setDynamic(fieldId, v)}
                    placeholder={t('-- Chọn người --')}
                    options={[
                      ...(!lockedDelegate ? [{ value: '', label: t('-- Chọn người --') }] : []),
                      ...(lockedDelegate
                        ? [{
                            value: lockedDelegate.delegateId,
                            label: `${lockedDelegate.delegateName || lockedDelegate.delegateId} (${t('được ủy quyền duyệt thay')})`,
                          }]
                        : (employees || []).map((emp) => ({
                            value: emp.id,
                            label: `${emp.name} (${t(emp.position) || t('Nhân viên')})`,
                          }))),
                    ]}
                  />
                  {lockedDelegate && (
                    <p className="text-[11px] text-secondary flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-primary">assignment_ind</span>
                      {t('Bạn đã ủy quyền cho {v0} — đơn này chỉ có thể chọn người được ủy quyền duyệt thay.', { v0: lockedDelegate.delegateName || '' })}
                    </p>
                  )}
                </div>
              );
            }

            // Default: render as text input
            const labelKey = fieldLabel(f);
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
                    selectedApprover={selectedApprover}
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
                    selectedApprover={selectedApprover}
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

        {/* PROD-UP1: upload tệp đính kèm thất bại — bắt buộc hỏi người dùng trước khi gửi,
            không còn cảnh đơn được submit âm thầm mà thiếu tài liệu. */}
        {uploadIssue && (
          <div
            className="fixed inset-0 z-[110] bg-black/40 flex items-center justify-center p-4"
            role="alertdialog"
            aria-modal="true"
          >
            <div className="bg-surface rounded-lg shadow-xl w-full max-w-md p-6 flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-error text-[24px]">upload_file</span>
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">
                    {t('Không tải lên được tệp đính kèm')}
                  </h3>
                  <p className="text-sm text-on-surface-variant mt-1">
                    {t('Đơn đã được lưu ở trạng thái Nháp. Bạn muốn xử lý thế nào?')}
                  </p>
                </div>
              </div>
              <ul className="flex flex-col gap-1.5 max-h-32 overflow-y-auto text-sm">
                {uploadIssue.failed.map((f, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-on-error-container">
                    <span className="material-symbols-outlined text-[16px] mt-0.5 shrink-0">error</span>
                    <span>{f.message}</span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleStayAndEdit}
                  disabled={saving}
                  className="px-4 py-2 rounded-md border border-outline-variant text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer disabled:opacity-50"
                >
                  {t('Ở lại chỉnh sửa')}
                </button>
                <button
                  type="button"
                  onClick={handleRetryUploads}
                  disabled={saving}
                  className="px-4 py-2 rounded-md border border-primary text-primary hover:bg-primary-container/20 transition-colors font-medium cursor-pointer disabled:opacity-50"
                >
                  {t('Thử tải lại')}
                </button>
                <button
                  type="button"
                  onClick={handleSendWithoutFiles}
                  disabled={saving}
                  className="px-4 py-2 rounded-md bg-primary text-on-primary hover:bg-primary/90 transition-colors font-medium cursor-pointer disabled:opacity-50"
                >
                  {saving ? t('Đang gửi...') : t('Gửi không kèm tệp')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
