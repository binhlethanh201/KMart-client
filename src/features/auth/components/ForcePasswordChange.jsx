import { useState } from 'react';
import { useI18n } from '../../../i18n/I18nProvider';
import { userService } from '../../hr/services/userService';
import { authService } from '../services/authService';
import { clearSessionStorage } from '../../../utils/session';
import { describeApiError } from '../../../utils/apiError';
import { useApproval } from '../../../context/useApproval';
import AuthBackground from './AuthBackground';
import { motion, useReducedMotion } from 'motion/react';

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
  'w-full rounded-lg border border-outline-variant bg-[#FFFEFA] px-3.5 py-2 text-body-md text-on-surface placeholder:text-muted outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary-container';
const labelCls = 'block text-label-md text-on-surface mb-1.5';

/**
 * AUTH-11: quy tắc mật khẩu mới — phải khớp validator ở backend.
 *
 * AUTH-18: ở đây chỉ giữ `id` + hàm kiểm tra. Nhãn hiển thị tách ra `RULE_LABEL_KEYS` và được dịch
 * bằng `t()` với CHUỖI HẰNG ngay trong thân component.
 *
 * Vì sao không để nhãn ở đây: trước đây mảng này có `label: 'Có chữ hoa'` rồi render bằng
 * `t(rule.label)`. `scripts/i18n-sync.mjs` chỉ quét được `t('chuỗi hằng')`, nên 5 nhãn này KHÔNG
 * bao giờ được đưa vào từ điển — kiểm tra thật ở EN/KO thì thấy nhãn vẫn nguyên tiếng Việt. Đây
 * đúng là lỗi BE-78 đã ghi trong LandingPage, lặp lại ở file này.
 */
const PASSWORD_RULES = [
  { id: 'length', test: (v) => v.length >= 8 },
  { id: 'upper', test: (v) => /[A-Z]/.test(v) },
  { id: 'lower', test: (v) => /[a-z]/.test(v) },
  { id: 'digit', test: (v) => /[0-9]/.test(v) },
  { id: 'special', test: (v) => /[^a-zA-Z0-9]/.test(v) },
];

export default function ForcePasswordChange() {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();
  const { currentUser } = useApproval();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  /*
   * AUTH-18: nhãn quy tắc dùng `t()` với CHUỖI HẰNG để scripts/i18n-sync.mjs quét được, và tra theo
   * `id` của quy tắc. Lý do phải viết dài dòng thế này thay vì đặt nhãn trong `PASSWORD_RULES`:
   * xem ghi chú ở định nghĩa `PASSWORD_RULES`.
   */
  const RULE_LABELS = {
    length: t('Tối thiểu 8 ký tự'),
    upper: t('Có chữ hoa'),
    lower: t('Có chữ thường'),
    digit: t('Có chữ số'),
    special: t('Có ký tự đặc biệt'),
  };

  const passed = PASSWORD_RULES.filter((r) => r.test(newPassword));
  const confirmMismatch = confirmPassword !== '' && confirmPassword !== newPassword;
  const sameAsCurrent = newPassword !== '' && newPassword === currentPassword;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (passed.length !== PASSWORD_RULES.length) {
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
      {/* AUTH-17: cùng khung "viền trên gradient" và cùng hiệu ứng trượt đẩy với trang đăng nhập,
          để hai màn xác thực vào trang giống hệt nhau. */}
      <motion.div
        initial={reduceMotion ? false : { x: 96, y: -12, rotate: -1.1, opacity: 0 }}
        animate={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 170, damping: 20, mass: 0.9 }}
        className="flex w-full justify-center"
      >
        <div className="w-full overflow-hidden rounded-xl">
          <div className="h-1 w-full bg-[linear-gradient(90deg,#1d4ed8_0%,#60a5fa_52%,#15803d_100%)]" />
          <div className="border-x border-b border-outline-variant bg-surface p-6 shadow-[0_30px_70px_-30px_rgba(0,0,0,0.6)] sm:p-7">
            <h1 className="text-headline-sm text-on-surface">{t('Đổi mật khẩu bắt buộc')}</h1>
            <p className="mt-1 text-body-md text-secondary">
              {t('Tài khoản của bạn đang dùng mật khẩu tạm do Nhân sự cấp.')}{' '}
              {t('Vì lý do an toàn, bạn phải đặt mật khẩu mới trước khi tiếp tục sử dụng hệ thống.')}
            </p>

            <form className="mt-5 space-y-3.5" onSubmit={handleSubmit}>
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

            {/*
             * AUTH-18: 2 cột từ `sm` trở lên. Thẻ này có 3 ô nhập + 5 quy tắc nên cao 651px; cùng với
             * logo và nút ngôn ngữ là vượt màn 768px của laptop phổ thông, buộc phải cuộn ở màn chặn
             * bắt buộc — rất khó chịu. Xếp 5 quy tắc thành 2 cột (3 hàng thay vì 5) tiết kiệm ~52px,
             * vừa đủ để không phải cuộn. Màn hẹp giữ 1 cột vì chữ sẽ phải ngắt dòng.
             */}
            <ul className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
              {PASSWORD_RULES.map((rule) => {
                const ok = rule.test(newPassword);
                /*
                 * AUTH-18: trước đây chưa đạt dùng `radio_button_unchecked` — vòng tròn rỗng đó trông
                 * y hệt một ô radio chưa tích nên người dùng tưởng phải bấm vào. Nay dùng `circle`
                 * (chấm đặc), đọc ra là gạch đầu dòng chứ không phải điều khiển.
                 *
                 * Trạng thái còn được đọc thành chữ (`sr-only`) chứ không chỉ khác màu: WCAG 1.4.1 cấm
                 * dùng riêng màu sắc để truyền thông tin, và trước đây trình đọc màn hình chỉ nghe được
                 * tên quy tắc mà không biết đã đạt hay chưa.
                 */
                return (
                  <li key={rule.id} className="flex items-center gap-2 text-body-md">
                    <span aria-hidden="true" className={`material-symbols-outlined shrink-0 text-[17px] ${ok ? 'text-emerald-600' : 'text-muted'}`}>
                      {ok ? 'check_circle' : 'circle'}
                    </span>
                    <span className={ok ? 'text-on-surface' : 'text-secondary'}>{RULE_LABELS[rule.id]}</span>
                    <span className="sr-only">{ok ? t('Đã đạt') : t('Chưa đạt')}</span>
                  </li>
                );
              })}
            </ul>

            <p className="text-[12px] text-muted">{t('Đủ cả 5 điều kiện trên là mật khẩu hợp lệ.')}</p>

          {error ? (
            <div className="rounded-lg bg-error-container px-3.5 py-2.5 text-body-md text-on-error-container">
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
        </div>
      </motion.div>
    </AuthBackground>
  );
}
