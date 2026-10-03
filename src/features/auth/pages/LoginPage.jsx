import React, { useState } from "react";
import { authService } from "../services/authService";
import { motion } from "motion/react";
import { useI18n } from '../../../i18n/I18nProvider';
import LanguageSwitcher from '../../../components/LanguageSwitcher';
import BrandLogo from '../../../components/BrandLogo';
import { createLoginErrorTranslator } from '../loginErrors';

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
  'w-full bg-transparent px-3.5 py-2.5 text-body-md text-on-surface placeholder:text-outline outline-none';
const labelCls = 'block text-label-md text-on-surface mb-1.5';
const primaryBtnCls =
  'w-full rounded-lg bg-primary py-2.5 text-label-md text-on-primary shadow-sm transition-colors hover:bg-on-primary-fixed-variant disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer';

/** Ô nhập có icon bên trái, tuỳ chọn nút hiện/ẩn mật khẩu bên phải. */
function Field({ icon, label, type = 'text', value, onChange, placeholder, autoComplete, revealToggle = false }) {
  const [revealed, setRevealed] = useState(false);
  const { t } = useI18n();
  const actualType = revealToggle ? (revealed ? 'text' : 'password') : type;

  return (
    <div>
      {label ? <label className={labelCls}>{label}</label> : null}
      <div className={inputWrapCls}>
        <span className="material-symbols-outlined pl-3.5 text-[19px] text-outline pointer-events-none">
          {icon}
        </span>
        <input
          type={actualType}
          required
          autoComplete={autoComplete}
          className={`${inputCls} ${revealToggle ? 'pr-11' : ''}`}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
        />
        {revealToggle && (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            className="absolute right-2.5 text-outline hover:text-on-surface transition-colors cursor-pointer"
            aria-label={revealed ? t('Ẩn mật khẩu') : t('Hiện mật khẩu')}
            tabIndex={-1}
          >
            <span className="material-symbols-outlined text-[19px]">
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
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0a1733] px-5 py-12">
      {/* BE-77c: nền gradient thương hiệu nhiều lớp — nhìn chuyên nghiệp thay vì nền trắng nhạt trống trải */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(155deg,#0a1733_0%,#122a6b_42%,#1d4ed8_100%)]" />
      {/* Quầng sáng tạo chiều sâu */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-[#3b82f6]/25 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -left-24 h-[420px] w-[420px] rounded-full bg-[#1d4ed8]/30 blur-[110px]" />
      <div className="pointer-events-none absolute -right-32 top-1/3 h-[380px] w-[380px] rounded-full bg-[#60a5fa]/15 blur-[110px]" />
      {/* Lưới mảnh + vệt sáng chéo tạo cảm giác "bản thiết kế kỹ thuật" */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.055)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_78%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.07)_50%,transparent_65%)]" />

      <div className="absolute top-6 right-6 z-20">
        <LanguageSwitcher variant="onDark" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="relative z-10 flex w-full flex-col items-center"
      >
        {/* Thương hiệu — dùng chung component BrandLogo với header/footer landing.
            BE-78: logo phải NỔI BẬT; ô logo là dải chuyển sắc xanh + chữ K trắng, kèm quầng sáng
            nên đọc rõ trên nền navy mà vẫn đồng nhất với logo ở trang landing. */}
        <h1 className="mb-7 flex justify-center">
          <BrandLogo size="lg" tone="onDark" glow tagline={t('Hệ thống quản trị nội bộ')} />
        </h1>

        <div
          className={`w-full rounded-2xl border border-white/10 bg-surface shadow-[0_28px_70px_-28px_rgba(0,0,0,0.65)] ${
            isResetPassword ? 'max-w-[360px] p-6' : 'max-w-[420px] p-8'
          }`}
        >
          <div className={isResetPassword ? 'mb-5' : 'mb-7'}>
            <h2 className={isResetPassword ? 'text-headline-sm text-on-surface' : 'text-headline-md text-on-surface'}>
              {isResetPassword ? t('Đặt lại mật khẩu') : t('Đăng nhập')}
            </h2>
            <p className={`mt-1 text-secondary ${isResetPassword ? 'text-[13px]' : 'text-body-md'}`}>
              {isResetPassword
                ? t('Dùng mật khẩu tạm do HR cấp để đổi sang mật khẩu mới.')
                : t('Nhập thông tin tài khoản để tiếp tục.')}
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-error/20 bg-error-container p-3 text-body-md text-on-error-container">
              <span className="material-symbols-outlined text-[18px] leading-none">error</span>
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
                  <label className="block text-label-md text-on-surface">{t('Mật khẩu')}</label>
                  <button
                    type="button"
                    onClick={startReset}
                    className="text-label-sm text-primary hover:underline focus:outline-none cursor-pointer"
                  >
                    {t('Đặt lại mật khẩu')}
                  </button>
                </div>
                <Field
                  icon="lock"
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
                    <span className="material-symbols-outlined text-[28px]">check_circle</span>
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

        <p
          className={`mt-6 text-center text-[12px] text-white/55 ${isResetPassword ? 'max-w-[360px]' : 'max-w-[420px]'}`}
        >
          {t('Cần hỗ trợ? Liên hệ bộ phận Nhân sự để được cấp lại quyền truy cập.')}
        </p>
      </motion.div>

      <div className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap text-[11px] uppercase tracking-[2px] text-white/40">
        {t('© 2026 Kmart Internal Systems. Bảo lưu mọi quyền lợi.')}
      </div>
    </div>
  );
};

export default LoginPage;