import { useMemo, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useApproval } from '../../../context/useApproval';
import { useHr } from '../../hr/context/HrProvider';
import { documentTypeService } from '../../../services/documentTypeService';
import { workflowService } from '../../../services/workflowService';
import { departmentService } from '../../departments/services/departmentService';

const fieldCls =
  'w-full rounded-md border border-outline-variant bg-surface-container-lowest text-on-surface text-sm h-10 px-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors';
const labelCls = 'block font-label-md text-label-md text-on-surface-variant mb-1.5';

export default function CreateRequestModal({ onClose, existingRequest = null }) {
  const { createRequest, updateRequest, departments, currentUser } = useApproval();
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

  // BE-03: quản lý của các phòng ban đang được tick chọn
  const [deptManagers, setDeptManagers] = useState([]);

  // BE-04: người duyệt do người tạo chọn (chỉ cần khi bước 1 có nhiều ứng viên)
  const [selectedApproverId, setSelectedApproverId] = useState('');

  // BE-09: File thật của các trường "Tải file", khoá theo nhãn trường.
  // Trước đây chỉ lưu file.name vào form.dynamic nên file CHƯA BAO GIỜ được upload.
  const [files, setFiles] = useState({});

  useEffect(() => {
    if (!form.departments.length) {
      setDeptManagers([]);
      return;
    }
    let cancelled = false;
    departmentService.getManagers(form.departments)
      .then((data) => { if (!cancelled) setDeptManagers(data || []); })
      .catch((err) => {
        console.error('Failed to load department managers:', err);
        if (!cancelled) setDeptManagers([]);
      });
    return () => { cancelled = true; };
  }, [form.departments]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setDynamic = (name, val) => setForm((f) => ({
    ...f,
    dynamic: { ...f.dynamic, [name]: val }
  }));

  // Current selected document type
  const selectedDocType = documentTypes.find(d => d.id === form.documentTypeId);
  let currentFields = selectedDocType?.fields || [];
  if (typeof currentFields === 'string') {
    try { currentFields = JSON.parse(currentFields); } catch (e) { currentFields = []; }
  }

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Chế độ bổ sung: nạp lại dữ liệu đơn cũ vào form.
  // skipDynamicResetRef chặn effect "reset dynamic khi đổi loại đơn" xoá mất dữ liệu vừa nạp.
  const skipDynamicResetRef = useRef(false);
  useEffect(() => {
    if (!existingRequest || loading) return;
    const raw = existingRequest._rawData || {};
    const { departments: deptIds, ...dynamic } = raw;
    skipDynamicResetRef.current = true;
    setForm({
      documentTypeId: existingRequest.documentTypeId || '',
      reason: existingRequest.fields?.reason || '',
      departments: Array.isArray(deptIds) ? deptIds : [],
      dynamic
    });
    setSelectedApproverId(existingRequest.selectedApproverId || '');
    setFiles({});
  }, [existingRequest, loading]);

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

  // Auto-calculate days when dates change
  useEffect(() => {
    const from = form.dynamic['Từ ngày'];
    const to = form.dynamic['Đến ngày'];
    if (from && to) {
      const d1 = new Date(from);
      const d2 = new Date(to);
      if (!isNaN(d1) && !isNaN(d2) && d2 >= d1) {
        const diffDays = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
        setForm(f => {
          if (f.dynamic['Tổng số ngày'] == diffDays) return f;
          return { ...f, dynamic: { ...f.dynamic, 'Tổng số ngày': diffDays } };
        });
      }
    }
  }, [form.dynamic['Từ ngày'], form.dynamic['Đến ngày']]);

  // BE-04: bước đầu tiên của luồng duyệt
  const firstStep = useMemo(() => {
    const steps = activeWorkflow?.steps;
    if (!Array.isArray(steps) || steps.length === 0) return null;
    return [...steps].sort((a, b) => a.stepOrder - b.stepOrder)[0];
  }, [activeWorkflow]);

  // BE-04: danh sách người CÓ THỂ duyệt bước 1. Nhiều hơn 1 thì bắt người tạo chọn 1.
  const firstStepCandidates = useMemo(() => {
    if (!firstStep) return [];
    const appType = (firstStep.approvalType || '').toLowerCase();

    if (appType === 'specific_user' || appType === 'specific') {
      const emp = employees?.find(e => e.id === (firstStep.specificUserId || firstStep.specificUser));
      return emp ? [emp] : [];
    }

    if (appType === 'role' && firstStep.role) {
      const role = String(firstStep.role).toUpperCase();
      const matched = (employees || []).filter((e) => {
        if (String(e.role || '').toUpperCase() === role) return true;
        if (Array.isArray(e.roles) && e.roles.includes(firstStep.role)) return true;
        return Array.isArray(e.systemRoles)
          && e.systemRoles.some(r => String(r?.roleName || r || '').toUpperCase() === role);
      });
      return matched.map(e => ({ id: e.id, name: e.name, position: e.position || e.role }));
    }

    if (appType === 'hierarchy' || appType === 'chain') {
      // Quản lý của TẤT CẢ phòng ban đã chọn (BE-03), không chỉ phòng ban đầu tiên
      const deptIds = form.departments.length
        ? form.departments
        : (currentUser?.departmentId ? [currentUser.departmentId] : []);
      return deptIds
        .map(deptId => deptManagers.find(m => m.departmentId === deptId))
        .filter(m => m && m.managerId)
        .map(m => ({ id: m.managerId, name: m.managerName || 'Quản lý' }));
    }

    return [];
  }, [firstStep, employees, form.departments, deptManagers, currentUser]);

  // Bỏ lựa chọn cũ nếu nó không còn trong danh sách ứng viên
  useEffect(() => {
    if (selectedApproverId && !firstStepCandidates.some(c => c.id === selectedApproverId)) {
      setSelectedApproverId('');
    }
  }, [firstStepCandidates, selectedApproverId]);

  const mustPickApprover = firstStepCandidates.length > 1;

  const submit = (e) => {
    e.preventDefault();
    if (!form.reason.trim() || !form.documentTypeId) return;
    if (mustPickApprover && !selectedApproverId) return;
    
    // Build payload theo BE DTO
    const payload = {
      documentTypeId: form.documentTypeId,
      reason: form.reason.trim(),
      data: {
        ...form.dynamic,
        departments: form.departments
      },
    };
    
    // Auto extract dates if present
    if (form.dynamic['Từ ngày']) {
      payload.startDate = form.dynamic['Từ ngày'];
    }
    if (form.dynamic['Đến ngày']) {
      payload.endDate = form.dynamic['Đến ngày'];
    }
    if (form.dynamic['Tổng số ngày']) {
      payload.totalDays = parseInt(form.dynamic['Tổng số ngày']);
    }

    // BE-04: chỉ gửi khi bước 1 thật sự có nhiều ứng viên
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
      updateRequest(existingRequest.id, payload);
    } else {
      createRequest(payload);
    }
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
              {isEdit ? 'Bổ Sung Đơn Từ' : 'Tạo Đề Xuất Mới'}
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
              {isEdit
                ? 'Cập nhật thông tin theo yêu cầu của người duyệt rồi gửi lại'
                : 'Điền đầy đủ thông tin để gửi yêu cầu phê duyệt'}
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
            <label className={labelCls}>Loại Đề Xuất</label>
            <select 
              className={`${fieldCls} disabled:opacity-60 disabled:cursor-not-allowed`}
              value={form.documentTypeId} 
              disabled={isEdit}
              onChange={(e) => setForm(f => ({ ...f, documentTypeId: e.target.value }))}
            >
              <option value="">-- Chọn loại đề xuất --</option>
              {!loading && documentTypes.map((dt) => (
                <option key={dt.id} value={dt.id}>{dt.name}</option>
              ))}
            </select>
          </div>

          {/* Department Checkboxes */}
          {departments.length > 0 && (
            <div className="flex flex-col gap-2">
              <label className={labelCls}>Phòng ban liên quan</label>
              <div className="flex gap-2.5 flex-wrap mt-0.5">
                {departments.map((d) => {
                  const isChecked = form.departments.includes(d.id);
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
                      {isChecked && <span className="material-symbols-outlined text-[16px] leading-none">check</span>}
                      <span>{d.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* BE-04: bước 1 có nhiều người có thể duyệt -> bắt buộc chọn 1 */}
          {mustPickApprover && (
            <div className="flex flex-col gap-2">
              <label className={labelCls}>
                Chọn người duyệt <span className="text-error">*</span>
                <span className="ml-1.5 text-xs normal-case font-normal text-secondary">
                  (bước 1 có {firstStepCandidates.length} người có thể duyệt)
                </span>
              </label>
              <select
                className={fieldCls}
                value={selectedApproverId}
                onChange={(e) => setSelectedApproverId(e.target.value)}
              >
                <option value="">-- Chọn người duyệt --</option>
                {firstStepCandidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.position ? ` · ${c.position}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Lý do/Yêu cầu */}
          <div className="flex flex-col gap-2">
            <label className={labelCls}>Lý do / Mô tả <span className="text-error">*</span></label>
            <textarea
              className="w-full rounded-md border border-outline-variant bg-surface-container-lowest p-3 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none min-h-[80px]"
              value={form.reason}
              onChange={set('reason')}
              placeholder="Nhập lý do hoặc mô tả yêu cầu..."
              required
            />
          </div>

          {/* Dynamic Fields từ BE */}
          {currentFields.length > 0 && currentFields.map((f) => {
            // Skip fields that are just labels/descriptions
            if (f.type === 'LABEL' || f.type === 'INFO') return null;

            if (f.type === 'NUMBER' || f.type === 'Số') {
              const labelKey = f.label || f.id;
              const isAuto = f.options?.includes('auto') || f.options?.includes('tự động');
              return (
                <div key={labelKey} className="flex flex-col gap-2">
                  <label className={labelCls}>{labelKey} {f.required && <span className="text-error">*</span>}</label>
                  <input
                    className={fieldCls}
                    type="number"
                    required={f.required}
                    value={form.dynamic[labelKey] || ''}
                    onChange={(e) => setDynamic(labelKey, e.target.value)}
                    placeholder={f.placeholder || ''}
                    readOnly={isAuto}
                    disabled={isAuto}
                  />
                </div>
              );
            }

            if (f.type === 'DATE' || f.type === 'Ngày') {
              const labelKey = f.label || f.id;
              let inputType = 'date';
              const l = (labelKey || '').toLowerCase();
              if (l.includes('giờ') || l.includes('time')) inputType = 'time';
              if (l.includes('ngày và giờ') || l.includes('datetime')) inputType = 'datetime-local';

              return (
                <div key={labelKey} className="flex flex-col gap-2">
                  <label className={labelCls}>{labelKey} {f.required && <span className="text-error">*</span>}</label>
                  <input 
                    className={fieldCls} 
                    type={inputType} 
                    required={f.required} 
                    value={form.dynamic[labelKey] || ''} 
                    onChange={(e) => setDynamic(labelKey, e.target.value)} 
                  />
                </div>
              );
            }

            if (f.type === 'TEXTAREA' || f.type === 'Văn bản') {
              const labelKey = f.label || f.id;
              return (
                <div key={labelKey} className="flex flex-col gap-2">
                  <label className={labelCls}>{labelKey} {f.required && <span className="text-error">*</span>}</label>
                  <textarea
                    className="w-full rounded-md border border-outline-variant bg-surface-container-lowest p-3 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none min-h-[80px]"
                    required={f.required}
                    value={form.dynamic[labelKey] || ''}
                    onChange={(e) => setDynamic(labelKey, e.target.value)}
                    placeholder={f.placeholder || 'Nhập thông tin...'}
                  />
                </div>
              );
            }

            if (f.type === 'SELECT' || f.type === 'Lựa chọn') {
              const labelKey = f.label || f.id;
              const options = f.options || [];
              return (
                <div key={labelKey} className="flex flex-col gap-2">
                  <label className={labelCls}>{labelKey} {f.required && <span className="text-error">*</span>}</label>
                  <select
                    className={fieldCls}
                    required={f.required}
                    value={form.dynamic[labelKey] || ''}
                    onChange={(e) => setDynamic(labelKey, e.target.value)}
                  >
                    <option value="">-- Chọn --</option>
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
                <div key={labelKey} className="flex flex-col gap-2">
                  <div className="flex justify-between items-end">
                    <label className={labelCls}>{labelKey} {f.required && <span className="text-error">*</span>}</label>
                    {templateFile && templateFile.name && (
                      <a href="#" className="flex items-center gap-1 text-xs text-primary font-medium hover:underline bg-primary/5 px-2 py-1 rounded">
                        <span className="material-symbols-outlined text-[14px]">download</span>
                        Tải biểu mẫu
                      </a>
                    )}
                  </div>
                  <label className="flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-outline-variant rounded-lg bg-surface hover:bg-surface-container-lowest hover:border-primary/50 transition-colors cursor-pointer group">
                    <span className="material-symbols-outlined text-[24px] text-outline group-hover:text-primary transition-colors">cloud_upload</span>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-on-surface group-hover:text-primary transition-colors">
                        {(files[labelKey]?.name || form.dynamic[labelKey])
                          ? (files[labelKey]?.name || form.dynamic[labelKey])
                          : 'Nhấn để chọn file tải lên'}
                      </span>
                      <span className="text-xs text-secondary">Hỗ trợ PDF, DOCX, XLSX (Tối đa 10MB)</span>
                    </div>
                    <input
                      className="sr-only"
                      type="file"
                      required={f.required}
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setDynamic(labelKey, file.name);
                          // BE-09: giữ File thật để upload sau khi đơn được tạo
                          setFiles((prev) => ({ ...prev, [labelKey]: file }));
                        }
                      }}
                    />
                  </label>
                </div>
              );
            }

            if (f.type === 'USER' || f.type === 'Người duyệt thay') {
              const labelKey = f.label || f.id;
              return (
                <div key={labelKey} className="flex flex-col gap-2">
                  <label className={labelCls}>{labelKey} {f.required && <span className="text-error">*</span>}</label>
                  <select
                    className={fieldCls}
                    required={f.required}
                    value={form.dynamic[labelKey] || ''}
                    onChange={(e) => setDynamic(labelKey, e.target.value)}
                  >
                    <option value="">-- Chọn người --</option>
                    {employees?.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.position || 'Nhân viên'})</option>
                    ))}
                  </select>
                </div>
              );
            }

            // Default: render as text input
            const labelKey = f.label || f.id;
            return (
              <div key={labelKey} className="flex flex-col gap-2">
                <label className={labelCls}>{labelKey} {f.required && <span className="text-error">*</span>}</label>
                <input
                  className={fieldCls}
                  type="text"
                  required={f.required}
                  value={form.dynamic[labelKey] || ''}
                  onChange={(e) => setDynamic(labelKey, e.target.value)}
                  placeholder={f.placeholder || ''}
                />
              </div>
            );
          })}

          {/* No fields available message */}
          {selectedDocType && currentFields.length === 0 && (
            <p className="text-sm text-on-surface-variant italic">Loại đề xuất này không có trường bổ sung.</p>
          )}

          {/* Loading state */}
          {loading && (
            <p className="text-sm text-on-surface-variant">Đang tải loại đề xuất...</p>
          )}
        </div>

        {/* BE-03: Quản lý của TẤT CẢ phòng ban đã chọn (không chỉ phòng ban đầu tiên) */}
        {form.departments.length > 0 && (
          <div className="px-6 py-4 bg-surface-container-lowest border-t border-outline-variant/30">
            <label className="block font-label-md text-label-md text-on-surface-variant mb-3">
              Người duyệt theo phòng ban đã chọn
            </label>
            <div className="flex flex-col gap-2">
              {form.departments.map((deptId) => {
                const dept = departments.find((d) => d.id === deptId);
                const info = deptManagers.find((m) => m.departmentId === deptId);
                return (
                  <div key={deptId} className="flex items-center gap-2 text-sm min-w-0">
                    <span className="material-symbols-outlined text-[18px] text-secondary flex-shrink-0">apartment</span>
                    <span className="font-medium text-on-surface truncate">{dept?.name || info?.departmentName || 'Phòng ban'}</span>
                    <span className="material-symbols-outlined text-[16px] text-outline-variant flex-shrink-0">arrow_forward</span>
                    {info?.managerId ? (
                      <span className="text-on-surface-variant truncate">
                        {info.managerName || 'Quản lý'}
                        {info.managerEmail && <span className="text-secondary"> · {info.managerEmail}</span>}
                      </span>
                    ) : (
                      <span className="text-warning font-medium flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">warning</span>
                        Chưa có quản lý
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Luồng phê duyệt (Approval Flow) Visualization */}
        {activeWorkflow && activeWorkflow.steps && activeWorkflow.steps.length > 0 && (
          <div className="px-6 py-4 bg-surface-container-lowest border-t border-outline-variant/30">
            <label className="block font-label-md text-label-md text-on-surface-variant mb-4">Luồng phê duyệt dự kiến</label>
            <div className="flex items-center gap-3 overflow-x-auto pb-4 px-1 [&::-webkit-scrollbar]:hidden">
              
              {/* SENDER NODE */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex flex-col items-center gap-1.5 min-w-[80px] max-w-[100px]">
                  {currentUser?.avatar ? (
                    <img src={currentUser.avatar} alt="Sender" className="w-10 h-10 rounded-full object-cover shadow-sm border border-outline-variant" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-amber-400 text-amber-950 font-semibold text-sm flex items-center justify-center shadow-sm border border-amber-500/20">
                      {(() => {
                        const name = currentUser?.name || 'Tôi';
                        const parts = name.trim().split(' ');
                        return parts.length === 1 
                          ? parts[0].substring(0, 2).toUpperCase() 
                          : (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
                      })()}
                    </div>
                  )}
                  <span className="text-[12px] font-semibold text-on-surface text-center w-full truncate leading-tight" title={currentUser?.name || 'Tôi'}>
                    {currentUser?.name || 'Tôi'}
                  </span>
                  <span className="text-[10px] text-secondary text-center w-full truncate uppercase tracking-wider font-semibold">
                    Người gửi
                  </span>
                </div>
                <span className="material-symbols-outlined text-outline-variant text-[18px]">
                  arrow_forward
                </span>
              </div>

              {/* WORKFLOW STEPS */}
              {activeWorkflow.steps.sort((a,b) => a.stepOrder - b.stepOrder).map((step, idx) => {
                const appType = (step.approvalType || '').toLowerCase();
                let emp = null;

                // BE-04: bước 1 hiển thị đúng người mà người tạo đã chọn
                if (idx === 0 && selectedApproverId) {
                  emp = employees?.find(e => e.id === selectedApproverId)
                    || deptManagers.find(m => m.managerId === selectedApproverId)
                    || null;
                }

                if (appType === 'specific_user' || appType === 'specific') {
                  emp = employees?.find(e => e.id === (step.specificUserId || step.specificUser));
                } else if (appType === 'hierarchy' || appType === 'chain') {
                  if (form.departments && form.departments.length > 0) {
                    const targetDept = departments.find(d => d.id === form.departments[0]);
                    if (targetDept && targetDept.managerId) {
                      emp = employees?.find(e => e.id === targetDept.managerId);
                    }
                  } else if (currentUser?.departmentId) {
                    const primaryDept = departments.find(d => d.id === currentUser.departmentId);
                    if (primaryDept && primaryDept.managerId) {
                      emp = employees?.find(e => e.id === primaryDept.managerId);
                    }
                  }
                } else if (appType === 'role' && step.role) {
                  emp = employees?.find(e => {
                    if (e.role === step.role) return true;
                    if (e.roles && Array.isArray(e.roles)) return e.roles.includes(step.role);
                    return false;
                  });
                }

                const displayName = emp ? emp.name : (step.name || 'Người duyệt');
                let displayRole = step.roleName || step.role || 'Người duyệt';
                
                if (emp) {
                  const r = emp.role || (emp.roles && emp.roles[0]) || '';
                  if (r.toUpperCase() === 'ADMIN') displayRole = 'Quản trị viên';
                  else if (r.toUpperCase() === 'MANAGER') displayRole = 'Quản lý';
                  else if (r.toUpperCase() === 'HR') displayRole = 'Nhân sự';
                  else if (r.toUpperCase() === 'TEAM_LEADER') displayRole = 'Trưởng nhóm';
                  else displayRole = r || 'Nhân viên';
                }

                return (
                  <div key={step.id || idx} className="flex items-center gap-3 shrink-0">
                    <div className="flex flex-col items-center gap-1.5 min-w-[80px] max-w-[100px]">
                      <div className="relative">
                        {emp ? (
                          emp.avatar ? (
                            <img src={emp.avatar} alt="Approver" className="w-10 h-10 rounded-full object-cover shadow-sm border border-outline-variant" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm flex items-center justify-center shadow-sm border border-blue-200">
                              {(() => {
                                const parts = emp.name.trim().split(' ');
                                return parts.length === 1 
                                  ? parts[0].substring(0, 2).toUpperCase() 
                                  : (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
                              })()}
                            </div>
                          )
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary-container text-primary flex items-center justify-center shadow-sm border border-primary/20">
                            <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-center w-full">
                        <span className="text-[12px] font-semibold text-on-surface text-center w-full truncate leading-tight" title={displayName}>
                          {displayName}
                        </span>
                        <span className="text-[10px] text-primary text-center w-full truncate uppercase tracking-wider font-semibold">
                          {displayRole}
                        </span>
                        {activeWorkflow.steps.length > 1 && (
                          <span className="text-[10px] text-secondary font-medium mt-0.5">
                            Bước {step.stepOrder}
                          </span>
                        )}
                      </div>
                    </div>
                    {idx < activeWorkflow.steps.length - 1 && (
                      <span className="material-symbols-outlined text-outline-variant text-[18px]">
                        arrow_forward
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-outline-variant/30 bg-surface-container-low">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-md border border-outline-variant text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!form.documentTypeId || !form.reason.trim() || (mustPickApprover && !selectedApproverId)}
            className="px-5 py-2.5 rounded-md bg-primary text-on-primary hover:bg-primary/90 transition-colors font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEdit ? 'Bổ sung & gửi lại' : 'Gửi yêu cầu'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
