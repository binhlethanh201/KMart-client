import { useState } from 'react';
import { useI18n } from '../../../i18n/I18nProvider';
import { userService } from '../../hr/services/userService';
import { authService } from '../services/authService';
import { clearSessionStorage } from '../../../utils/session';
import { describeApiError } from '../../../utils/apiError';

/**
 * AUTH-10: màn ĐỔI MẬT KHẨU BẮT BUỘC.
 *
 * Khi HR "Đặt lại mật khẩu", tài khoản nhận mật khẩu tạm và cờ `must_change_password` được bật.
 * Backend chặn mọi API nghiệp vụ cho tới khi đổi (mã lỗi PASSWORD_CHANGE_REQUIRED), nên giao diện
 * phải có một màn riêng, không thể bỏ qua: đổi mật khẩu hoặc đăng xuất.
 */

const inputCls =
  'w-full rounded-lg border border-outline-variant bg-[#FFFEFA] px-3.5 py-2.5 text-body-md text-on-surface placeholder:text-outline outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary-container';
const labelCls = 'block text-label-md text-on-surface mb-1.5';

/** AUTH-11: quy tắc mật khẩu mới — phải khớp validator ở backend. */
const passwordRules = [
  { id: 'length', label: 'Tối thiểu 8 ký tự', test: (v) => v.length >= 8 },
  { id: 'upper', label: 'Có chữ hoa', test: (v) => /[A-Z]/.test(v) },
  { id: 'lower', label: 'Có chữ thường', test: (v) => /[a-z]/.test(v) },
  { id: 'digit', label: 'Có chữ số', test: (v) => /[0-9]/.test(v) },
  { id: 'special', label: 'Có ký tự đặc biệt', test: (v) => /[^a-zA-Z0-9]/.test(v) },
];

export default function ForcePasswordChange() {
  const { t } = useI18n();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passed = passwordRules.filter((r) => r.test(newPassword));
  const ready = passed.length === passwordRules.length
    && newPassword === confirmPassword
    && newPassword !== currentPassword;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (passed.length !== passwordRules.length) {
      setError(t('Mật khẩu mới chưa đủ mạnh. Vui lòng kiểm tra các yêu cầu bên dưới.'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('Mật khẩu xác nhận không khớp.'));
      return;
    }
    if (newPassword === currentPassword) {
      setError(t('Mật khẩu mới phải khác mật khẩu hiện tại.'));
      return;
    }

    setLoading(true);
    try {
      await userService.changePassword(currentPassword, newPassword);
      // Cờ must_change_password đã được backend tắt -> tải lại để vào hệ thống bình thường.
      window.location.reload();
    } catch (err) {
      setError(describeApiError(err, t, 'Không đổi được mật khẩu. Vui lòng thử lại.'));
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      /* mất kết nối cũng vẫn phải thoát được phiên trên trình duyệt */
    }
    clearSessionStorage();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-2xl border border-outline-variant bg-surface p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-primary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary-container">lock_reset</span>
          </div>
          <div>
            <h1 className="text-title-lg font-semibold text-on-surface">{t('Đổi mật khẩu bắt buộc')}</h1>
            <p className="text-body-sm text-secondary">
              {t('Tài khoản của bạn đang dùng mật khẩu tạm do Nhân sự cấp.')}
            </p>
          </div>
        </div>

        <p className="mt-4 text-body-sm text-secondary">
          {t('Vì lý do an toàn, bạn phải đặt mật khẩu mới trước khi tiếp tục sử dụng hệ thống.')}
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className={labelCls} htmlFor="force-current">{t('Mật khẩu tạm hiện tại')}</label>
            <input
              id="force-current"
              type="password"
              autoComplete="current-password"
              className={inputCls}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label className={labelCls} htmlFor="force-new">{t('Mật khẩu mới')}</label>
            <input
              id="force-new"
              type="password"
              autoComplete="new-password"
              className={inputCls}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label className={labelCls} htmlFor="force-confirm">{t('Nhập lại mật khẩu mới')}</label>
            <input
              id="force-confirm"
              type="password"
              autoComplete="new-password"
              className={inputCls}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <ul className="space-y-1">
            {passwordRules.map((rule) => {
              const ok = rule.test(newPassword);
              return (
                <li key={rule.id} className="flex items-center gap-2 text-body-sm">
                  <span className={`material-symbols-outlined text-[18px] ${ok ? 'text-emerald-600' : 'text-outline'}`}>
                    {ok ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                  <span className={ok ? 'text-on-surface' : 'text-secondary'}>{t(rule.label)}</span>
                </li>
              );
            })}
          </ul>

          {error ? (
            <div className="rounded-lg bg-error-container px-3.5 py-2.5 text-body-sm text-on-error-container">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading || !ready}
            className="w-full rounded-lg bg-primary py-2.5 text-label-md text-on-primary shadow-sm transition-colors hover:bg-on-primary-fixed-variant disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? t('Đang xử lý...') : t('Đổi mật khẩu và tiếp tục')}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-lg border border-outline-variant py-2.5 text-label-md text-on-surface transition-colors hover:bg-surface-variant cursor-pointer"
          >
            {t('Đăng xuất')}
          </button>
        </form>
      </div>
    </div>
  );
}
