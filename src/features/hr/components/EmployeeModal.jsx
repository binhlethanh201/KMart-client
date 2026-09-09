import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { DEPARTMENTS, POSITIONS, SYSTEM_ROLES, EMPTY_EMPLOYEE } from '../data/mockData';

const fieldCls =
  'w-full rounded-md border border-outline-variant bg-surface-container-lowest text-on-surface text-sm h-10 px-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors';
const labelCls = 'block font-label-md text-label-md text-on-surface-variant mb-1.5';

export default function EmployeeModal({ employee, onClose, onSave }) {
  const [form, setForm] = useState(() => (employee ? { ...EMPTY_EMPLOYEE, ...employee } : EMPTY_EMPLOYEE));

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const isEdit = Boolean(employee?.id);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const addSecondary = () =>
    setForm((f) => ({
      ...f,
      secondary: [...f.secondary, { department: DEPARTMENTS[0], position: POSITIONS[6] }],
    }));
  const updateSecondary = (idx, key, value) =>
    setForm((f) => ({
      ...f,
      secondary: f.secondary.map((s, i) => (i === idx ? { ...s, [key]: value } : s)),
    }));
  const removeSecondary = (idx) =>
    setForm((f) => ({ ...f, secondary: f.secondary.filter((_, i) => i !== idx) }));

  const submit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? 'Chỉnh sửa thông tin nhân sự' : 'Thêm mới nhân sự'}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="bg-surface rounded-lg shadow-xl w-full max-w-3xl flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-outline-variant/30">
          <div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">
              {isEdit ? 'Chỉnh sửa thông tin nhân sự' : 'Thêm mới nhân sự'}
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
              {isEdit ? `Cập nhật hồ sơ ${form.id}` : 'Tạo tài khoản và phân quyền cho nhân viên mới'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface transition-colors rounded-full p-1 hover:bg-surface-variant cursor-pointer"
            aria-label="Đóng"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {/* Column 1 - Tài khoản & Cá nhân */}
            <div className="flex flex-col gap-4">
              <div className="font-label-md text-label-md text-primary font-semibold uppercase tracking-wide">
                Tài khoản &amp; Cá nhân
              </div>
              <div>
                <label className={labelCls}>Họ và tên</label>
                <input className={fieldCls} value={form.name} onChange={set('name')} placeholder="Nguyễn Văn A" />
              </div>
              <div>
                <label className={labelCls}>Mã nhân viên</label>
                <input className={fieldCls} value={form.id} onChange={set('id')} placeholder="NV-0102" disabled={isEdit} />
              </div>
              <div>
                <label className={labelCls}>Email công ty</label>
                <input className={fieldCls} type="email" value={form.email} onChange={set('email')} placeholder="a.nguyenvan@kmart.vn" />
              </div>
              <div>
                <label className={labelCls}>Số điện thoại</label>
                <input className={fieldCls} value={form.phone} onChange={set('phone')} placeholder="0901 234 567" />
              </div>
              <div>
                <label className={labelCls}>Tên đăng nhập</label>
                <input className={fieldCls} value={form.username} onChange={set('username')} placeholder="nguyenvana" disabled={isEdit} />
              </div>
              <div>
                <label className={labelCls}>{isEdit ? 'Mật khẩu mới' : 'Mật khẩu'}</label>
                <input className={fieldCls} type="password" value={form.password} onChange={set('password')} placeholder="••••••••" />
              </div>
            </div>

            {/* Column 2 - Tổ chức & Phân quyền */}
            <div className="flex flex-col gap-4">
              <div className="font-label-md text-label-md text-primary font-semibold uppercase tracking-wide">
                Tổ chức &amp; Phân quyền
              </div>
              <div>
                <label className={labelCls}>Phòng ban chính</label>
                <select className={fieldCls} value={form.department} onChange={set('department')}>
                  {DEPARTMENTS.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Chức vụ chính</label>
                <select className={fieldCls} value={form.position} onChange={set('position')}>
                  {POSITIONS.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Vai trò hệ thống</label>
                <select className={fieldCls} value={form.role} onChange={set('role')}>
                  {SYSTEM_ROLES.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Trạng thái</label>
                <select className={fieldCls} value={form.status} onChange={set('status')}>
                  <option value="active">Đang hoạt động</option>
                  <option value="inactive">Ngừng hoạt động</option>
                </select>
              </div>

              {/* Vị trí kiêm nhiệm */}
              <div className="border-t border-outline-variant pt-4 mt-1">
                <div className="flex items-center justify-between mb-2">
                  <span className={labelCls + ' mb-0'}>Vị trí kiêm nhiệm</span>
                  <button
                    type="button"
                    onClick={addSecondary}
                    className="text-primary hover:bg-primary-container/40 text-xs font-medium px-2 py-1 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    Thêm vị trí
                  </button>
                </div>
                {form.secondary.length === 0 && (
                  <p className="text-xs text-on-surface-variant italic">Chưa có vị trí kiêm nhiệm nào.</p>
                )}
                <div className="flex flex-col gap-2">
                  {form.secondary.map((s, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        className={fieldCls + ' flex-1'}
                        value={s.department}
                        onChange={(e) => updateSecondary(idx, 'department', e.target.value)}
                      >
                        {DEPARTMENTS.map((d) => (
                          <option key={d}>{d}</option>
                        ))}
                      </select>
                      <select
                        className={fieldCls + ' flex-1'}
                        value={s.position}
                        onChange={(e) => updateSecondary(idx, 'position', e.target.value)}
                      >
                        {POSITIONS.map((p) => (
                          <option key={p}>{p}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => removeSecondary(idx)}
                        className="text-error hover:bg-error-container/40 p-2 rounded-md transition-colors cursor-pointer flex-shrink-0"
                        aria-label="Xoá vị trí"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-outline-variant/30 bg-surface flex justify-end items-center gap-3 rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            className="font-label-md text-label-md text-on-surface-variant px-4 py-2 rounded-md hover:bg-surface-variant transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 font-label-md text-label-md text-on-primary bg-primary px-5 py-2 rounded-md hover:bg-on-primary-fixed-variant transition-colors shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            Lưu thông tin
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}
