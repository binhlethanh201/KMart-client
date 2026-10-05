import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { roleStyle } from '../../../utils/roleLabels';
import { useI18n } from '../../../i18n/I18nProvider';
import SearchableSelect from '../../../components/SearchableSelect';

const EMPTY_EMPLOYEE = {
  name: '',
  email: '',
  phone: '',
  password: '',
  personalEmail: '',
  dateOfBirth: '',
  departmentId: '',
  positionId: '',
  roleId: '', // For now we allow selecting 1 role
  status: 'active',
  secondary: []
};

/** BE-74: ngày hôm nay theo giờ máy — dùng làm giới hạn trên cho ô ngày sinh. */
const TODAY_ISO = new Date().toISOString().slice(0, 10);

const fieldCls =
  'w-full rounded-md border border-outline-variant bg-surface-container-lowest text-on-surface text-sm h-10 px-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors';
const fieldErrCls =
  'w-full rounded-md border border-error bg-surface-container-lowest text-on-surface text-sm h-10 px-3 outline-none focus:border-error focus:ring-1 focus:ring-error transition-colors';
const labelCls = 'block font-label-md text-label-md text-on-surface-variant mb-1.5';

/** BE-68: quy tắc mật khẩu phải KHỚP với backend (Services/Validators/UserValidators.cs). */
const PASSWORD_RULES = [
  { test: (v) => v.length >= 8, message: 'Mật khẩu tối thiểu 8 ký tự' },
  { test: (v) => /[A-Z]/.test(v), message: 'Mật khẩu phải chứa ít nhất 1 chữ hoa' },
  { test: (v) => /[a-z]/.test(v), message: 'Mật khẩu phải chứa ít nhất 1 chữ thường' },
  { test: (v) => /[0-9]/.test(v), message: 'Mật khẩu phải chứa ít nhất 1 số' },
  { test: (v) => /[^a-zA-Z0-9]/.test(v), message: 'Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt' },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** Số điện thoại Việt Nam: 10 số bắt đầu bằng 0, cho phép khoảng trắng/gạch nối. */
const PHONE_RE = /^0\d{9}$/;
/** Ngày dạng YYYY-MM-DD (giá trị của <input type="date">). */
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * BE-68: kiểm tra dữ liệu nhân sự NGAY TRÊN FORM (trước đây chỉ dựa vào `required` của HTML,
 * nhập sai định dạng vẫn gửi lên máy chủ rồi báo lỗi khó hiểu).
 * Trả về object { field: thông báo } — rỗng nghĩa là hợp lệ.
 */
function validateEmployee(form, isEdit, t) {
  const errors = {};

  if (!form.name || !form.name.trim()) {
    errors.name = t('Vui lòng nhập họ tên');
  } else if (form.name.trim().length > 100) {
    errors.name = t('Họ tên tối đa 100 ký tự');
  }

  if (!isEdit) {
    if (!form.email || !form.email.trim()) {
      errors.email = t('Vui lòng nhập email làm việc');
    } else if (!EMAIL_RE.test(form.email.trim())) {
      errors.email = t('Email không hợp lệ');
    }

    if (!form.password) {
      errors.password = t('Vui lòng nhập mật khẩu');
    } else {
      const failed = PASSWORD_RULES.find((r) => !r.test(form.password));
      if (failed) errors.password = t(failed.message);
    }
  }

  if (form.personalEmail && !EMAIL_RE.test(form.personalEmail.trim())) {
    errors.personalEmail = t('Email cá nhân không hợp lệ');
  }

  if (form.phone && !PHONE_RE.test(form.phone.replace(/[\s.-]/g, ''))) {
    errors.phone = t('Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0)');
  }

  // BE-74: ngày sinh tuỳ chọn, nhưng nếu nhập thì phải là ngày có thật và không ở tương lai.
  // Quy tắc phải KHỚP backend (Services/Validators/UserValidators.cs).
  if (form.dateOfBirth) {
    if (!DATE_RE.test(form.dateOfBirth) || Number.isNaN(Date.parse(form.dateOfBirth))) {
      errors.dateOfBirth = t('Ngày sinh không hợp lệ');
    } else if (form.dateOfBirth > TODAY_ISO) {
      errors.dateOfBirth = t('Ngày sinh không được ở tương lai');
    } else if (form.dateOfBirth < '1900-01-01') {
      errors.dateOfBirth = t('Ngày sinh không hợp lệ (phải từ năm 1900 trở đi)');
    }
  }

  // Nhân sự phải thuộc một phòng ban + chức vụ, nếu không luồng duyệt sẽ không tìm được người duyệt.
  if (!form.departmentId || !form.positionId) {
    errors.positions = t('Vui lòng chọn phòng ban và chức vụ công tác chính');
  }

  if (!form.roleId) {
    errors.roleId = t('Vui lòng chọn vai trò hệ thống');
  }

  return errors;
}

export default function EmployeeModal({ employee, departments = [], positions = [], roles = [], currentUser, onClose, onSave }) {
  const { t } = useI18n();
  const [form, setForm] = useState(() => {
    if (!employee) return EMPTY_EMPLOYEE;
    // Resolve the existing role to its id so the select is pre-selected on edit.
    const roleId = roles.find((r) => r.roleName === employee.role)?.id || '';
    return { ...EMPTY_EMPLOYEE, ...employee, roleId };
  });

  // BE-68: lỗi kiểm tra dữ liệu + lỗi từ máy chủ, hiển thị ngay trong form.
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  // BE-86: chỉ cập nhật vai trò đã chọn. Trước đây còn gọi thêm API lấy quyền của vai trò chỉ để
  // hiển thị khối "Quyền được gán tự động" — khối đó đã bỏ nên không cần gọi mạng nữa.
  const handleRoleChange = (e) => {
    const val = e.target.value;
    setForm((f) => ({ ...f, roleId: val }));
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

  const submit = async (e) => {
    e.preventDefault();
    const errors = validateEmployee(form, isEdit, t);
    setErrors(errors);
    setServerError('');
    if (Object.keys(errors).length > 0) {
      // Đưa người dùng tới ô lỗi đầu tiên cho dễ sửa (dùng optional-call để an toàn ở mọi môi trường).
      const firstField = Object.keys(errors)[0];
      const el = document.querySelector(`[data-field="${firstField}"]`);
      el?.focus?.();
      el?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
      return;
    }

    setSaving(true);
    const result = await onSave({
      ...form,
      roleIds: form.roleId ? [form.roleId] : []
    });
    setSaving(false);
    // BE-68: lỗi từ máy chủ hiển thị ngay trong form (dịch theo ngôn ngữ đang dùng), không dùng alert().
    // BE-70: HrProvider đã dịch sẵn câu giải thích chi tiết nên ở đây chỉ hiển thị.
    if (result && result.ok === false) {
      setServerError(result.message || t('Không lưu được nhân sự'));
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
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
              {isEdit ? t('Chỉnh sửa thông tin nhân sự') : t('Tạo tài khoản nhân viên')}
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
                {t('Tài khoản & Cá nhân')}
              </div>
              <div>
                <label className={labelCls}>{t('Họ và tên')}</label>
                <input
                  required
                  data-field="name"
                  className={errors.name ? fieldErrCls : fieldCls}
                  value={form.name}
                  onChange={set('name')}
                  placeholder={t('Nguyễn Văn A')}
                />
                {errors.name && <p className="text-xs text-error mt-1">{errors.name}</p>}
              </div>
              {/* BE-118: khi TẠO MỚI không hiện "Mã nhân viên" — mã do hệ thống tự sinh nên đưa ra
                  ô "(Tự động tạo)" chỉ làm rối form; chỉ hiển thị khi đang sửa hồ sơ. */}
              {isEdit && form.id && (
                <div>
                  <label className={labelCls}>{t('Mã nhân viên')}</label>
                  <div className="bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-2 text-sm text-secondary font-mono h-[38px] flex items-center">
                    {form.id.substring(0, 8).toUpperCase()}
                  </div>
                </div>
              )}
              <div>
                <label className={labelCls}>{t('Email công ty')}</label>
                <input
                  required
                  data-field="email"
                  className={errors.email ? fieldErrCls : fieldCls}
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  placeholder="a.nguyenvan@ktm.vn"
                  disabled={isEdit}
                />
                {errors.email && <p className="text-xs text-error mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className={labelCls}>{t('Email cá nhân')}</label>
                <input
                  data-field="personalEmail"
                  className={errors.personalEmail ? fieldErrCls : fieldCls}
                  type="email"
                  value={form.personalEmail}
                  onChange={set('personalEmail')}
                  placeholder="nguyenvana@gmail.com"
                />
                {errors.personalEmail && <p className="text-xs text-error mt-1">{errors.personalEmail}</p>}
              </div>
              <div>
                <label className={labelCls}>{t('Số điện thoại')}</label>
                <input
                  data-field="phone"
                  className={errors.phone ? fieldErrCls : fieldCls}
                  value={form.phone || ''}
                  onChange={set('phone')}
                  placeholder="0901 234 567"
                />
                {errors.phone && <p className="text-xs text-error mt-1">{errors.phone}</p>}
              </div>
              <div>
                <label className={labelCls}>{t('Ngày sinh')}</label>
                <input
                  data-field="dateOfBirth"
                  className={errors.dateOfBirth ? fieldErrCls : fieldCls}
                  type="date"
                  min="1900-01-01"
                  max={TODAY_ISO}
                  value={form.dateOfBirth || ''}
                  onChange={set('dateOfBirth')}
                />
                {errors.dateOfBirth
                  ? <p className="text-xs text-error mt-1">{errors.dateOfBirth}</p>
                  : <p className="text-xs text-secondary mt-1">{t('Dùng để phân biệt nhân sự trùng họ tên.')}</p>}
              </div>
              {!isEdit && (
                <div>
                  <label className={labelCls}>{t('Mật khẩu')}</label>
                  <input
                    required
                    data-field="password"
                    className={errors.password ? fieldErrCls : fieldCls}
                    type="password"
                    value={form.password}
                    onChange={set('password')}
                    placeholder="••••••••"
                  />
                  {errors.password
                    ? <p className="text-xs text-error mt-1">{errors.password}</p>
                    : (
                      <p className="text-xs text-secondary mt-1 leading-relaxed">
                        {t('Tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.')}
                      </p>
                    )}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4">
              <div className="font-label-md text-label-md text-primary font-semibold uppercase tracking-wide">
                {t('Tổ chức & Phân quyền')}
              </div>
              <div>
                <label className={labelCls}>{t('Phòng ban chính')}</label>
                {/* BE-118: danh sách phòng ban dài -> dùng ô chọn có TÌM KIẾM */}
                <SearchableSelect
                  testId="department-select"
                  data-field="positions"
                  className={errors.positions ? fieldErrCls : fieldCls}
                  value={form.departmentId}
                  onChange={(v) => set('departmentId')({ target: { value: v } })}
                  placeholder="-- Chọn phòng ban --"
                  options={departments.map((d) => ({ value: d.id, label: d.name }))}
                  renderLabel={(o) => t(o.label)}
                />
              </div>
              <div>
                <label className={labelCls}>{t('Chức vụ chính')}</label>
                <SearchableSelect
                  testId="position-select"
                  data-field="positions"
                  className={errors.positions ? fieldErrCls : fieldCls}
                  value={form.positionId}
                  onChange={(v) => set('positionId')({ target: { value: v } })}
                  placeholder="-- Chọn chức vụ --"
                  options={positions.map((p) => ({ value: p.id, label: p.name }))}
                  renderLabel={(o) => o.label}
                />
                {errors.positions && <p className="text-xs text-error mt-1">{errors.positions}</p>}
              </div>
              <div>
                <label className={labelCls}>{t('Vai trò hệ thống')}</label>
                <SearchableSelect
                  testId="role-select"
                  data-field="roleId"
                  className={errors.roleId ? fieldErrCls : fieldCls}
                  value={form.roleId}
                  onChange={(v) => handleRoleChange({ target: { value: v } })}
                  placeholder="-- Chọn vai trò --"
                  disabled={currentUser?.role !== 'ADMIN' && currentUser?.role !== 'HR'}
                  options={roles.map((r) => ({ value: r.id, label: roleStyle(r.roleName).label }))}
                  renderLabel={(o) => o.label}
                />
                {/* BE-86: bỏ khối "Quyền được gán tự động từ vai trò" — chỉ liệt kê lại mã quyền,
                    không thao tác được gì, làm form tạo nhân sự thừa và rối. */}
              </div>
              <div>
                <label className={labelCls}>{t('Trạng thái')}</label>
                <select className={fieldCls} value={form.status} onChange={set('status')} disabled={isEdit}>
                  <option value="active">{t('Đang hoạt động')}</option>
                  <option value="inactive">{t('Ngừng hoạt động')}</option>
                </select>
              </div>

              <div className="border-t border-outline-variant pt-4 mt-1">
                <div className="flex items-center justify-between mb-2">
                  <span className={labelCls + ' mb-0'}>{t('Vị trí kiêm nhiệm')}</span>
                  <button
                    type="button"
                    onClick={addSecondary}
                    className="text-primary hover:bg-primary-container/40 text-xs font-medium px-2 py-1 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    {t('Thêm vị trí')}
                  </button>
                </div>
                {form.secondary.length === 0 && (
                  <p className="text-xs text-on-surface-variant italic">{t('Chưa có vị trí kiêm nhiệm nào.')}</p>
                )}
                <div className="flex flex-col gap-2">
                  {form.secondary.map((s, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <SearchableSelect
                        className={fieldCls + ' flex-1'}
                        value={s.departmentId}
                        onChange={(v) => updateSecondary(idx, 'departmentId', v)}
                        placeholder="- Chọn -"
                        options={departments.map((d) => ({ value: d.id, label: d.name }))}
                        renderLabel={(o) => t(o.label)}
                      />
                      <SearchableSelect
                        className={fieldCls + ' flex-1'}
                        value={s.positionId}
                        onChange={(v) => updateSecondary(idx, 'positionId', v)}
                        placeholder="- Chọn -"
                        options={positions.map((p) => ({ value: p.id, label: p.name }))}
                        renderLabel={(o) => o.label}
                      />
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

        <div className="p-6 border-t border-outline-variant/30 bg-surface flex justify-between items-center gap-3 rounded-b-lg">
          {/* BE-68: lỗi từ máy chủ hiển thị ngay trong form, dịch theo ngôn ngữ đang dùng */}
          <div className="flex-1 min-w-0">
            {serverError && (
              <p className="text-xs text-error flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">error</span>
                {t(serverError)}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="font-label-md text-label-md text-on-surface-variant px-4 py-2 rounded-md hover:bg-surface-variant transition-colors cursor-pointer"
          >
            {t('Hủy')}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 font-label-md text-label-md text-on-primary bg-primary px-5 py-2 rounded-md hover:bg-on-primary-fixed-variant transition-colors shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[18px]">{saving ? 'progress_activity' : 'save'}</span>
            {saving ? t('Đang lưu...') : t('Lưu thông tin')}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}
