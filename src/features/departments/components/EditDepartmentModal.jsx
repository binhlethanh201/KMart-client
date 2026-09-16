import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApproval } from '../../../context/useApproval';
import DepartmentIconPicker from './DepartmentIconPicker';

const TYPES = ['Phòng ban', 'Khối chuyên môn', 'Siêu thị / Chi nhánh'];

const labelCls = 'block font-label-md text-label-md text-on-surface-variant mb-1.5';
const inputCls =
  'w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary';

export default function EditDepartmentModal({ department, onClose }) {
  const { updateDepartment } = useApproval();
  
  const [code, setCode] = useState(department.code || '');
  const [name, setName] = useState(department.name || '');
  const [type, setType] = useState(department.type || TYPES[0]);
  const [icon, setIcon] = useState(department.icon || 'campaign');
  const [iconImage, setIconImage] = useState(department.iconImage || null);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const valid = code.trim() && name.trim();

  const submit = (e) => {
    e.preventDefault();
    if (!valid) return;
    updateDepartment(department.id, {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      type,
      icon,
      iconImage,
    });
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[110] bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="bg-surface rounded-lg shadow-xl w-full max-w-md flex flex-col overflow-hidden"
      >
        <div className="flex justify-between items-center p-5 border-b border-outline-variant">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined">edit_document</span>
            </div>
            <div>
              <h2 className="font-headline-md text-on-surface">Chỉnh sửa thông tin</h2>
              <p className="text-xs text-secondary mt-0.5">Cập nhật tên và mã phòng ban</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-1.5 rounded-full hover:bg-surface-variant cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className={labelCls}>Mã đơn vị <span className="text-error">*</span></label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className={inputCls}
              placeholder="VD: HR-01"
            />
          </div>

          <div>
            <label className={labelCls}>Tên đơn vị / Phòng ban <span className="text-error">*</span></label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
              placeholder="VD: Phòng Hành chính Nhân sự"
            />
          </div>

          <div>
            <label className={labelCls}>Loại đơn vị</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
              {TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <DepartmentIconPicker
              icon={icon}
              iconImage={iconImage}
              onChange={({ icon: newIcon, iconImage: newImg }) => {
                if (newIcon !== undefined) setIcon(newIcon);
                if (newImg !== undefined) setIconImage(newImg);
              }}
            />
          </div>
        </div>

        <div className="p-5 pt-0 mt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="font-label-md text-on-surface-variant px-4 py-2 rounded-md hover:bg-surface-variant transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={!valid}
            className="font-label-md text-on-primary bg-primary hover:bg-on-primary-fixed-variant px-5 py-2 rounded-md transition-colors shadow-sm cursor-pointer disabled:opacity-40 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            Lưu thay đổi
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}
