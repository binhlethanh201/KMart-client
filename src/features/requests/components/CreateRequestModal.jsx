import { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApproval } from '../../../context/useApproval';
import { REQUEST_TYPES, WORKFLOW_BY_TYPE, USERS } from '../data/seed';
import { DEPARTMENTS } from '../../departments/data/departments';

const fieldCls =
  'w-full rounded-md border border-outline-variant bg-surface-container-lowest text-on-surface text-sm h-10 px-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors';
const labelCls = 'block font-label-md text-label-md text-on-surface-variant mb-1.5';

// Create Request modal. Submits to the global context (createRequest).
// The approval preview is derived from the selected request type.
export default function CreateRequestModal({ onClose }) {
  const { createRequest, formFields } = useApproval();
  
  const availableTypes = Object.keys(formFields);
  const initialType = availableTypes[0] || 'Khác';
  
  const [form, setForm] = useState({
    type: initialType,
    title: '',
    departments: [],
    dynamic: {}
  });

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setDynamic = (label, val) => setForm((f) => ({
    ...f,
    dynamic: { ...f.dynamic, [label]: val }
  }));

  const currentFields = formFields[form.type] || [];

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Reset dynamic fields when type changes
  useEffect(() => {
    setForm(f => ({ ...f, dynamic: {} }));
  }, [form.type]);

  const chain = useMemo(() => WORKFLOW_BY_TYPE[form.type] || ['u_tvql', 'u_lhtl'], [form.type]);

  const submit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    createRequest({ 
      title: form.title.trim(), 
      type: form.type,
      departments: form.departments,
      ...form.dynamic 
    });
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Tạo đề xuất mới"
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="bg-surface rounded-lg shadow-xl w-full max-w-[680px] flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-outline-variant/30">
          <div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Tạo Đề Xuất Mới</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">Điền đầy đủ thông tin để gửi yêu cầu phê duyệt đến quản lý</p>
          </div>
          <button type="button" onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors rounded-full p-1 hover:bg-surface-variant cursor-pointer" aria-label="Đóng">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className={labelCls}>Loại Đề Xuất</label>
            <select className={fieldCls} value={form.type} onChange={set('type')}>
              {availableTypes.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelCls}>Phòng ban liên quan</label>
            <div className="flex gap-2.5 flex-wrap mt-0.5">
              {DEPARTMENTS.map((d) => {
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
          <div className="flex flex-col gap-2">
            <label className={labelCls}>Tiêu đề đề xuất</label>
            <input className={fieldCls} value={form.title} onChange={set('title')} placeholder="Nhập tiêu đề..." type="text" required />
          </div>

          {/* Dynamic Fields */}
          {currentFields.map((f) => {
            if (f.type === 'Ngày') {
              const inputType = f.displayStyle === 'date' ? 'date' : f.displayStyle === 'time' ? 'time' : 'datetime-local';
              return (
                <div key={f.id} className="flex flex-col gap-2">
                  <label className={labelCls}>{f.label} {f.required && <span className="text-error">*</span>}</label>
                  <input className={fieldCls} type={inputType} required={f.required} value={form.dynamic[f.label] || ''} onChange={(e) => setDynamic(f.label, e.target.value)} />
                </div>
              );
            }
            if (f.type === 'Văn bản') {
              return (
                <div key={f.id} className="flex flex-col gap-2">
                  <label className={labelCls}>{f.label} {f.required && <span className="text-error">*</span>}</label>
                  <textarea
                    className="w-full rounded-md border border-outline-variant bg-surface-container-lowest p-3 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none min-h-[80px]"
                    required={f.required}
                    value={form.dynamic[f.label] || ''}
                    onChange={(e) => setDynamic(f.label, e.target.value)}
                    placeholder="Nhập thông tin..."
                  />
                </div>
              );
            }
            if (f.type === 'Lựa chọn') {
              if (f.displayStyle === 'radio') {
                return (
                  <div key={f.id} className="flex flex-col gap-2">
                    <label className={labelCls}>{f.label} {f.required && <span className="text-error">*</span>}</label>
                    <div className="flex gap-6 flex-wrap mt-1">
                      {f.options?.map((opt) => (
                        <label key={opt} className="flex items-center gap-2 cursor-pointer">
                          <input className="text-primary focus:ring-primary border-outline-variant h-4 w-4" name={f.id} type="radio" required={f.required} checked={form.dynamic[f.label] === opt} onChange={() => setDynamic(f.label, opt)} />
                          <span className="text-sm text-on-surface">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              } else if (f.displayStyle === 'checkbox') {
                return (
                  <div key={f.id} className="flex flex-col gap-2">
                    <label className={labelCls}>{f.label}</label>
                    <div className="flex gap-6 flex-wrap mt-1">
                      {f.options?.map((opt) => {
                        const arr = form.dynamic[f.label] || [];
                        const isChecked = arr.includes(opt);
                        return (
                          <label key={opt} className="flex items-center gap-2 cursor-pointer">
                            <input
                              className="text-primary focus:ring-primary rounded border-outline-variant h-4 w-4"
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                const newArr = e.target.checked ? [...arr, opt] : arr.filter(x => x !== opt);
                                setDynamic(f.label, newArr);
                              }}
                            />
                            <span className="text-sm text-on-surface">{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              } else {
                return (
                  <div key={f.id} className="flex flex-col gap-2">
                    <label className={labelCls}>{f.label} {f.required && <span className="text-error">*</span>}</label>
                    <select className={fieldCls} required={f.required} value={form.dynamic[f.label] || ''} onChange={(e) => setDynamic(f.label, e.target.value)}>
                      <option value="">-- Chọn --</option>
                      {f.options?.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                );
              }
            }
            if (f.type === 'Tải file') {
              return (
                <div key={f.id} className="flex flex-col gap-2">
                  <label className={labelCls}>{f.label}</label>
                  <div className="border-2 border-dashed border-outline-variant rounded-lg p-5 flex flex-col items-center justify-center bg-surface-container-lowest hover:bg-surface-container-low transition-colors cursor-pointer group">
                    <span className="material-symbols-outlined text-outline text-3xl group-hover:text-primary transition-colors mb-1">cloud_upload</span>
                    <p className="text-sm text-on-surface mb-1">
                      Kéo thả file vào đây hoặc <span className="text-primary font-medium">Chọn file</span>
                    </p>
                    <p className="text-xs text-secondary">Hỗ trợ: PDF, DOCX, JPG, PNG (Max 10MB)</p>
                  </div>
                </div>
              );
            }
            return null;
          })}

          {/* Dynamic approval preview */}
          <div className="bg-surface-container-low rounded-lg p-4 border border-outline-variant/30">
            <div className="flex items-center justify-between mb-3">
              <label className={labelCls + ' mb-0'}>Luồng Xét Duyệt Tự Động</label>
              <span className="bg-surface-variant text-on-surface-variant text-[10px] px-2 py-1 rounded-full uppercase tracking-wider font-semibold">Duyệt lần lượt</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {chain.map((uid, i) => {
                const u = USERS.find((x) => x.id === uid);
                return (
                  <div key={i} className="flex items-center">
                    {i > 0 && <span className="material-symbols-outlined text-outline text-sm mx-1">arrow_forward</span>}
                    <div className="flex items-center gap-2 bg-surface-container-lowest rounded-md p-2 border border-outline-variant/50 min-w-fit">
                      <img className="w-7 h-7 rounded-full object-cover" src={u?.avatar} alt={u?.name} />
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-on-surface">{u?.name}</span>
                        <span className="text-[10px] text-secondary">{u?.role}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-outline-variant/30 bg-surface flex justify-between items-center rounded-b-lg">
          <button type="button" onClick={onClose} className="font-label-md text-on-surface-variant px-4 py-2 rounded-md hover:bg-surface-variant transition-colors cursor-pointer">
            Hủy bỏ
          </button>
          <button type="submit" className="flex items-center gap-2 font-label-md text-on-primary bg-primary px-6 py-2 rounded-md hover:bg-on-primary-fixed-variant transition-colors shadow-sm cursor-pointer">
            <span>Gửi đề xuất mới</span>
            <span className="material-symbols-outlined text-[18px]">send</span>
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}
