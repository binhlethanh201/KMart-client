import { useState } from 'react';
import { useI18n } from '../../../i18n/I18nProvider';
import { userService } from '../../hr/services/userService';
import { authService } from '../services/authService';
import { clearSessionStorage } from '../../../utils/session';
import { describeApiError } from '../../../utils/apiError';
import { useApproval } from '../../../context/useApproval';
import AuthBackground from './AuthBackground';
import BrandLogo from '../../../components/BrandLogo';
import LanguageSwitcher from '../../../components/LanguageSwitcher';

/**
 * AUTH-10: màn ĐỔI MẬT KHẨU BẮT BUỘC.
 *
 * Khi HR "Đặt lại mật khẩu", tài khoản nhận mật khẩu tạm và cờ `must_change_password` được bật.
 * Backend chặn mọi API nghiệp vụ cho tới khi đổi (mã lỗi PASSWORD_CHANGE_REQUIRED), nên giao diện
 * phải có một màn riêng, không thể bỏ qua: đổi mật khẩu hoặc đăng xuất.
 *
 * AUTH-12: nền lấy chung AuthBackground với màn đăng nhập cho đồng bộ thương hiệu.
 * AUTH-13: nút gửi KHÔNG còn bị vô hiệu hoá im lặng — trước đây nút chỉ bấm được khi mọi điều
 * kiện thoả, nên khi nhập lệch (VD ô nhập lại khác mật khẩu mới) người dùng thấy nút "chết" mà
 * không hiểu vì sao. Nay nút luôn bấm được và báo lỗi cụ thể ngay dưới ô liên quan.
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
  const { currentUser } = useApproval();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passed = passwordRules.filter((r) => r.test(newPassword));
  const confirmMismatch = confirmPassword !== '' && confirmPassword !== newPassword;
  const sameAsCurrent = newPassword !== '' && newPassword === currentPassword;

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
      try {
        await userService.changePassword(currentPassword, newPassword);
      } catch (err) {
        /*
         * AUTH-13: một số bản backend chặn cả endpoint đổi mật khẩu của phiên đang đăng nhập
         * khi cờ must_change_password còn bật (403 PASSWORD_CHANGE_REQUIRED) hoặc chưa có
         * endpoint này (404/405). Khi đó dùng đường công khai giống màn đăng nhập:
         * POST /auth/reset-password với mật khẩu tạm do HR cấp.
         */
        const status = err.response?.status;
        if (status === 403 || status === 404 || status === 405) {
          await authService.resetPasswordWithTemp(currentUser?.email || '', currentPassword, newPassword);
        } else {
          throw err;
        }
      }
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
    <AuthBackground>
      <div className="absolute top-6 right-6 z-20">
        <LanguageSwitcher variant="onDark" />
      </div>

      <div className="relative z-10 flex w-full flex-col items-center">
        <h1 className="mb-7 flex justify-center">
          <BrandLogo size="lg" tone="onDark" glow tagline={t('Hệ thống quản trị nội bộ')} />
        </h1>

        <div className="w-full max-w-[420px] rounded-2xl border border-white/10 bg-surface p-8 shadow-[0_28px_70px_-28px_rgba(0,0,0,0.65)]">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-primary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary-container">lock_reset</span>
          </div>
          <div>
            <h2 className="text-title-lg font-semibold text-on-surface">{t('Đổi mật khẩu bắt buộc')}</h2>
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
            {sameAsCurrent && (
              <p className="mt-1 text-[12px] text-error">{t('Mật khẩu mới phải khác mật khẩu hiện tại.')}</p>
            )}
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
            {confirmMismatch && (
              <p className="mt-1 text-[12px] text-error">{t('Mật khẩu xác nhận không khớp.')}</p>
            )}
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
            disabled={loading}
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

        <p className="mt-6 text-[12px] text-white/50">
          {t('Cần hỗ trợ? Liên hệ bộ phận Nhân sự để được cấp lại quyền truy cập.')}
        </p>
      </div>
    </AuthBackground>
  );
}
