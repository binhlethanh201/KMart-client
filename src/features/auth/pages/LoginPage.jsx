import React, { useId, useState } from "react";
import { authService } from "../services/authService";
import { useI18n } from '../../../i18n/I18nProvider';
import { motion, useReducedMotion } from 'motion/react';
import { createLoginErrorTranslator } from '../loginErrors';
import AuthBackground from '../components/AuthBackground';

/**
 * BE-77: bố cục 2 cột — cột trái giới thiệu thương hiệu, cột phải là biểu mẫu.
 *
 * Trước đây toàn bộ trang là MỘT tấm ảnh nền bị làm mờ phủ màu xanh, chữ trên nền ảnh khó đọc
 * và trông giống trang quảng cáo hơn là cổng đăng nhập nội bộ. Nay:
 *   * cột trái dùng dải màu thương hiệu + danh sách điểm mạnh (ẩn trên màn hình nhỏ);
 *   * cột phải nền sáng, biểu mẫu rõ ràng, có icon và nút hiện/ẩn mật khẩu.
 * Toàn bộ luồng đăng nhập và đặt lại mật khẩu giữ nguyên.
 */

const inputWrapCls =
  'relative flex items-center rounded-lg border border-outline-variant bg-[#FFFEFA] transition-colors focus-within:border-primary focus-within:ring-4 focus-within:ring-primary-container';
const inputCls =
  'w-full bg-transparent px-3.5 py-2.5 text-body-md text-on-surface placeholder:text-muted outline-none';
const labelCls = 'block text-label-md text-on-surface mb-1.5';
const primaryBtnCls =
  'w-full rounded-lg bg-primary py-2.5 text-label-md text-on-primary shadow-sm transition-colors hover:bg-on-primary-fixed-variant disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer';

/** Ô nhập có icon bên trái, tuỳ chọn nút hiện/ẩn mật khẩu bên phải. */
function Field({ icon, label, id, type = 'text', value, onChange, placeholder, autoComplete, revealToggle = false }) {
  const [revealed, setRevealed] = useState(false);
  const { t } = useI18n();
  const actualType = revealToggle ? (revealed ? 'text' : 'password') : type;

  /*
   * UX-01: nối <label> với <input> bằng id/htmlFor.
   *
   * Trước đây label chỉ là thẻ chữ trơ (không htmlFor, input không id) nên trình đọc màn hình đọc
   * ô nhập là "edit text, blank" — người khiếm thị không biết đang điền ô nào, dù nhìn thì có nhãn.
   * Ô "Mật khẩu" còn không truyền `label` nên còn tệ hơn: nhãn nằm ngoài component.
   * useId() của React 19 sinh id ổn định, không đụng vào id nghiệp vụ nào; `id` truyền vào sẽ đè
   * khi nhãn nằm NGOÀI component và cần htmlFor trỏ tới.
   * `placeholder` vẫn giữ vì hữu ích cho người nhìn, nhưng KHÔNG thay thế được nhãn.
   */
  const generatedId = useId();
  const inputId = id || generatedId;
  const revealLabel = revealed ? t('Ẩn mật khẩu') : t('Hiện mật khẩu');

  return (
    <div>
      {label ? (
        <label className={labelCls} htmlFor={inputId}>
          {label}
        </label>
      ) : null}
      <div className={inputWrapCls}>
        <span aria-hidden="true" className="material-symbols-outlined pl-3.5 text-[19px] text-muted pointer-events-none">
          {icon}
        </span>
        <input
          id={inputId}
          type={actualType}
          required
          autoComplete={autoComplete}
          className={`${inputCls} ${revealToggle ? 'pr-11' : ''}`}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
        />
        {revealToggle && (
          /* tap-target: nút con mắt chỉ 19px rộng. WCAG 2.2 SC 2.5.8 yêu cầu vùng chạm tối thiểu
             24x24; lớp phủ ::after nới vùng bấm lên mà không đổi kích thước nhìn thấy. */
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            className="tap-target absolute right-2.5 grid h-6 w-6 place-items-center text-muted hover:text-on-surface transition-colors cursor-pointer"
            aria-label={revealLabel}
            aria-pressed={revealed}
            title={revealLabel}
            tabIndex={-1}
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[19px]">
              {revealed ? 'visibility_off' : 'visibility'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

const LoginPage = ({ onLoginSuccess }) => {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // State cho phần đặt lại mật khẩu
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetTempPassword, setResetTempPassword] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await authService.login(email, password);
      const token = data.accessToken || data.token;

      if (token) {
        localStorage.setItem("kmart_token", token);
        if (onLoginSuccess) {
          onLoginSuccess(data);
        } else {
          window.location.href = "/";
        }
      } else {
        setError(t('Đăng nhập thành công nhưng không nhận được token.'));
      }
    } catch (err) {
      // BE-87: quy câu lỗi của máy chủ về khoá dịch để EN/KO cũng hiện đúng ngôn ngữ
      // (trước đây máy chủ trả tiếng Anh nên giao diện tiếng Việt vẫn thấy câu tiếng Anh).
      const translateLoginError = createLoginErrorTranslator(t);
      setError(
        translateLoginError(err.response?.data?.message || err.response?.data?.error) ||
          t('Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu.'),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (resetNewPassword !== resetConfirmPassword) {
      setError(t('Mật khẩu xác nhận không khớp.'));
      return;
    }

    setLoading(true);
    try {
      await authService.resetPasswordWithTemp(resetEmail, resetTempPassword, resetNewPassword);
      setResetSuccess(true);
      setResetTempPassword("");
      setResetNewPassword("");
      setResetConfirmPassword("");
    } catch (err) {
      const data = err.response?.data;
      const detail = Array.isArray(data?.errors)
        ? data.errors.join(' • ')
        : (data?.message || data?.error);
      setError(detail || t('Không đặt lại được mật khẩu. Vui lòng kiểm tra lại thông tin.'));
    } finally {
      setLoading(false);
    }
  };

  const startReset = () => {
    setIsResetPassword(true);
    setResetSuccess(false);
    setResetEmail(email);
    setResetTempPassword("");
    setResetNewPassword("");
    setResetConfirmPassword("");
    setError("");
  };

  const backToLogin = () => {
    setIsResetPassword(false);
    setError("");
  };

  return (
    <AuthBackground>
        {/* AUTH-17: thẻ trượt vào theo kiểu "đẩy" — trượt sang trái để về chỗ, hơi nghiêng rồi
            tự thẳng lại, lò xo có quán tính nhẹ. Toàn bộ hiệu ứng tắt khi bật giảm chuyển động
            (xem TiltCard: cùng lý do — người rối loạn tiền đình). */}
        <motion.div
          initial={reduceMotion ? false : { x: 96, y: -12, rotate: -1.1, opacity: 0 }}
          animate={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 170, damping: 20, mass: 0.9, delay: 0.08 }}
          className="flex w-full justify-center"
        >
          <div className="w-full overflow-hidden rounded-xl">
            <div className="h-1 w-full bg-[linear-gradient(90deg,#1d4ed8_0%,#60a5fa_52%,#15803d_100%)]" />
            <div className="border-x border-b border-outline-variant bg-surface p-8 shadow-[0_30px_70px_-30px_rgba(0,0,0,0.6)] sm:p-10">
              <h1 className={`text-on-surface ${isResetPassword ? 'text-headline-sm' : 'text-headline-md'}`}>
                {isResetPassword ? t('Đặt lại mật khẩu') : t('Đăng nhập')}
              </h1>
              <p className="mt-1 text-body-md text-secondary">
                {isResetPassword
                  ? t('Dùng mật khẩu tạm do HR cấp để đổi sang mật khẩu mới.')
                  : t('Nhập thông tin tài khoản để tiếp tục.')}
              </p>

              <div className="mt-7">
          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-error/20 bg-error-container p-3 text-body-md text-on-error-container">
              <span aria-hidden="true" className="material-symbols-outlined text-[18px] leading-none">error</span>
              <span>{t(error)}</span>
            </div>
          )}

          {!isResetPassword ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <Field
                icon="mail"
                label={t('Email làm việc')}
                type="email"
                autoComplete="username"
                placeholder="nhanvien@kmart.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  {/* UX-01: nhãn "Mật khẩu" nằm ngoài Field nên phải nối tay bằng htmlFor —
                      trước đây nó là thẻ chữ trơ, không gắn với ô nhập nào. */}
                  <label className="block text-label-md text-on-surface" htmlFor="login-password">
                    {t('Mật khẩu')}
                  </label>
                  {/* tap-target: nút chỉ cao 20px, dưới ngưỡng chạm 24px của WCAG 2.2 SC 2.5.8. */}
                  <button
                    type="button"
                    onClick={startReset}
                    title={t('Đặt lại mật khẩu')}
                    className="tap-target inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium leading-4 text-primary/75 transition-colors hover:bg-primary/5 hover:text-primary cursor-pointer"
                  >
                    <span aria-hidden="true" className="material-symbols-outlined text-[13px] leading-none">lock_reset</span>
                    {t('Đặt lại mật khẩu')}
                  </button>
                </div>
                <Field
                  icon="lock"
                  id="login-password"
                  revealToggle
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button type="submit" disabled={loading} className={`${primaryBtnCls} mt-1`}>
                {loading ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    {t('Đang xác thực...')}
                  </span>
                ) : (
                  t('Đăng nhập')
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {!resetSuccess ? (
                <>
                  <p className="rounded-lg bg-surface-container-low p-2.5 text-[12px] leading-relaxed text-secondary">
                    {t('Nhập mật khẩu tạm do HR/Quản trị cấp (chức năng "Đặt lại mật khẩu" ở màn Nhân sự) để đổi sang mật khẩu mới của bạn.')}
                  </p>

                  <Field
                    icon="mail"
                    label={t('Email làm việc')}
                    type="email"
                    autoComplete="username"
                    placeholder="nhanvien@kmart.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                  />

                  <Field
                    icon="key"
                    label={t('Mật khẩu tạm')}
                    type="text"
                    placeholder={t('Mật khẩu tạm do HR cấp')}
                    value={resetTempPassword}
                    onChange={(e) => setResetTempPassword(e.target.value)}
                  />

                  <Field
                    icon="lock_reset"
                    label={t('Mật khẩu mới')}
                    revealToggle
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                  />

                  <div>
                    <Field
                      icon="lock_reset"
                      label={t('Xác nhận mật khẩu mới')}
                      revealToggle
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={resetConfirmPassword}
                      onChange={(e) => setResetConfirmPassword(e.target.value)}
                    />
                    {/* BE-68: khớp đúng quy tắc mật khẩu của máy chủ */}
                    <p className="mt-1.5 text-[12px] text-secondary">
                      {t('Tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt.')}
                    </p>
                  </div>

                  <div className="mt-1 flex flex-col gap-2">
                    <button type="submit" disabled={loading} className={primaryBtnCls}>
                      {loading ? t('Đang xử lý...') : t('Đặt lại mật khẩu')}
                    </button>
                    <button
                      type="button"
                      onClick={backToLogin}
                      className="w-full rounded-lg bg-surface-container-low py-2.5 text-label-md text-on-surface transition-colors hover:bg-surface-container cursor-pointer"
                    >
                      {t('Quay lại đăng nhập')}
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-4 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success-container text-success">
                    <span aria-hidden="true" className="material-symbols-outlined text-[28px]">check_circle</span>
                  </div>
                  <div>
                    <h3 className="mb-1 text-[17px] font-semibold text-on-surface">{t('Đã đặt lại mật khẩu')}</h3>
                    <p className="text-[13px] text-secondary">
                      {t('Vui lòng đăng nhập bằng mật khẩu mới của bạn.')}
                    </p>
                  </div>
                  <button type="button" onClick={backToLogin} className={primaryBtnCls}>
                    {t('Quay lại đăng nhập')}
                  </button>
                </div>
              )}
            </form>
          )}
            </div>
          </div>
        </div>
      </motion.div>
    </AuthBackground>
  );
};

export default LoginPage;