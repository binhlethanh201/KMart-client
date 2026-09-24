import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ROLE_STYLES } from '../data/constants';
import { roleService } from '../services/roleService';

const EMPTY_EMPLOYEE = {
  name: '',
  email: '',
  phone: '',
  password: '',
  personalEmail: '',
  departmentId: '',
  positionId: '',
  roleId: '', // For now we allow selecting 1 role
  status: 'active',
  secondary: []
};

const fieldCls =
  'w-full rounded-md border border-outline-variant bg-surface-container-lowest text-on-surface text-sm h-10 px-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors';
const labelCls = 'block font-label-md text-label-md text-on-surface-variant mb-1.5';

export default function EmployeeModal({ employee, departments = [], positions = [], roles = [], onClose, onSave }) {
  const [form, setForm] = useState(() => {
    if (!employee) return EMPTY_EMPLOYEE;
    // Resolve the existing role to its id so the select is pre-selected on edit.
    const roleId = roles.find((r) => r.roleName === employee.role)?.id || '';
    return { ...EMPTY_EMPLOYEE, ...employee, roleId };
  });

  // Permission preview state
  const [rolePermissions, setRolePermissions] = useState([]);

  // Load permissions when role changes
  const handleRoleChange = async (e) => {
    const val = e.target.value;
    setForm((f) => ({ ...f, roleId: val }));
    if (val) {
      try {
        const role = await roleService.getById(val);
        setRolePermissions(role.permissions || []);
      } catch {
        setRolePermissions([]);
      }
    } else {
      setRolePermissions([]);
    }
  };

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
      secondary: [...f.secondary, { departmentId: departments[0]?.id, positionId: positions[0]?.id }],
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
    onSave({
      ...form,
      roleIds: form.roleId ? [form.roleId] : []
    });
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
        className="bg-surface rounded-lg shadow-xl w-full max-w-3xl flex flex-col max-h-[92vh] overflow-hidden"
      >
        <div className="flex justify-between items-start p-6 border-b border-outline-variant/30">
          <div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">
              {isEdit ? 'Chỉnh sửa thông tin nhân sự' : 'Thêm mới nhân sự'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface transition-colors rounded-full p-1 hover:bg-surface-variant cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="flex flex-col gap-4">
              <div className="font-label-md text-label-md text-primary font-semibold uppercase tracking-wide">
                Tài khoản &amp; Cá nhân
              </div>
              <div>
                <label className={labelCls}>Họ và tên</label>
                <input required className={fieldCls} value={form.name} onChange={set('name')} placeholder="Nguyễn Văn A" />
              </div>
              <div>
                <label className={labelCls}>Mã nhân viên</label>
                <div className="bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-2 text-sm text-secondary font-mono h-[38px] flex items-center">
                  {isEdit && form.id ? form.id.substring(0, 8).toUpperCase() : '(Tự động tạo)'}
                </div>
              </div>
              <div>
                <label className={labelCls}>Email công ty</label>
                <input required className={fieldCls} type="email" value={form.email} onChange={set('email')} placeholder="a.nguyenvan@ktm.vn" disabled={isEdit} />
              </div>
              <div>
                <label className={labelCls}>Email cá nhân</label>
                <input className={fieldCls} type="email" value={form.personalEmail} onChange={set('personalEmail')} placeholder="nguyenvana@gmail.com" />
              </div>
              <div>
                <label className={labelCls}>Số điện thoại</label>
                <input className={fieldCls} value={form.phone || ''} onChange={set('phone')} placeholder="0901 234 567" />
              </div>
              {!isEdit && (
                <div>
                  <label className={labelCls}>Mật khẩu</label>
                  <input required className={fieldCls} type="password" value={form.password} onChange={set('password')} placeholder="••••••••" />
                  <p className="text-xs text-secondary mt-1 leading-relaxed">
                    Tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4">
              <div className="font-label-md text-label-md text-primary font-semibold uppercase tracking-wide">
                Tổ chức &amp; Phân quyền
              </div>
              <div>
                <label className={labelCls}>Phòng ban chính</label>
                <select className={fieldCls} value={form.departmentId} onChange={set('departmentId')}>
                  <option value="">-- Chọn phòng ban --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Chức vụ chính</label>
                <select className={fieldCls} value={form.positionId} onChange={set('positionId')}>
                  <option value="">-- Chọn chức vụ --</option>
                  {positions.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Vai trò hệ thống</label>
                <select className={fieldCls} value={form.roleId} onChange={handleRoleChange}>
                  <option value="">-- Chọn vai trò --</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>{ROLE_STYLES[r.roleName]?.label || r.roleName}</option>
                  ))}
                </select>
                {/* Permission preview */}
                {form.roleId && rolePermissions.length > 0 && (
                  <div className="mt-2 bg-primary/5 border border-primary/20 rounded-md p-3">
                    <div className="text-xs font-semibold text-primary mb-2 uppercase tracking-wide">
                      Quyền được gán tự động từ vai trò
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {rolePermissions.map((p, i) => {
                        const code = typeof p === 'string' ? p : p.permissionName || p.name || '';
                        return (
                          <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                            {code}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className={labelCls}>Trạng thái</label>
                <select className={fieldCls} value={form.status} onChange={set('status')} disabled={isEdit}>
                  <option value="active">Đang hoạt động</option>
                  <option value="inactive">Ngừng hoạt động</option>
                </select>
              </div>

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
                        value={s.departmentId}
                        onChange={(e) => updateSecondary(idx, 'departmentId', e.target.value)}
                      >
                        <option value="">- Chọn -</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                      <select
                        className={fieldCls + ' flex-1'}
                        value={s.positionId}
                        onChange={(e) => updateSecondary(idx, 'positionId', e.target.value)}
                      >
                        <option value="">- Chọn -</option>
                        {positions.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => removeSecondary(idx)}
                        className="text-error hover:bg-error-container/40 p-2 rounded-md transition-colors cursor-pointer flex-shrink-0"
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
