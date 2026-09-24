import { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApproval } from '../../../context/useApproval';
import { useHr } from '../../hr/context/HrProvider';
import { documentTypeService } from '../../../services/documentTypeService';
import { FORM_FIELDS } from '../../system-config/data/mockData';

const fieldCls =
  'w-full rounded-md border border-outline-variant bg-surface-container-lowest text-on-surface text-sm h-10 px-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors';
const labelCls = 'block font-label-md text-label-md text-on-surface-variant mb-1.5';

export default function CreateRequestModal({ onClose }) {
  const { createRequest, departments } = useApproval();
  const { employees } = useHr();
  
  // Load document types từ BE
  const [documentTypes, setDocumentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    documentTypeService.getAll()
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
  if (currentFields.length === 0 && selectedDocType) {
    currentFields = FORM_FIELDS[selectedDocType.name] || [];
  }
  currentFields = currentFields.map(field => {
    if ((field.type === 'SELECT' || field.type === 'Lựa chọn') && (!field.options || field.options.length === 0)) {
       const fallback = FORM_FIELDS[selectedDocType.name]?.find(x => x.name === field.name || x.id === field.id || x.label === field.label);
       if (fallback && fallback.options) {
         return { ...field, options: fallback.options };
       }
    }
    return field;
  });

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Reset dynamic fields when document type changes
  useEffect(() => {
    setForm(f => ({ ...f, dynamic: {} }));
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

  const submit = (e) => {
    e.preventDefault();
    if (!form.reason.trim() || !form.documentTypeId) return;
    
    // Build payload theo BE DTO
    const payload = {
      documentTypeId: form.documentTypeId,
      reason: form.reason.trim(),
      data: form.dynamic,
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
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="bg-surface rounded-lg shadow-xl w-full max-w-[680px] flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-outline-variant/30">
          <div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Tạo Đề Xuất Mới</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">Điền đầy đủ thông tin để gửi yêu cầu phê duyệt</p>
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
              className={fieldCls} 
              value={form.documentTypeId} 
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
            type="submit"
            disabled={!form.documentTypeId || !form.reason.trim()}
            className="px-5 py-2.5 rounded-md bg-primary text-on-primary hover:bg-primary/90 transition-colors font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Gửi yêu cầu
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}
