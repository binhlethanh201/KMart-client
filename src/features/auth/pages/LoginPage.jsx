import React, { useState } from "react";
import { authService } from "../services/authService";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useI18n } from '../../../i18n/I18nProvider';
import LanguageSwitcher from '../../../components/LanguageSwitcher';

const LoginPage = ({ onLoginSuccess }) => {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          t('Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu.'),
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * BE-50: đặt lại mật khẩu bằng MẬT KHẨU TẠM do HR/Quản trị cấp (chức năng "Đặt lại mật khẩu"
   * ở màn Nhân sự). Trước đây màn này chỉ giả lập gửi email nên không đặt lại được thật.
   */
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

  return (
    <div className="min-h-screen flex items-center justify-center relative px-4 overflow-hidden">
      {/* Background Ảnh và Lớp phủ làm mờ */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('https://k-market.vn/wp-content/uploads/2025/09/pano-about-02.jpg')",
        }}
      >
        {/* Lớp phủ màu xanh đen đậm kết hợp làm mờ kính (glassmorphism) */}
        <div className="absolute inset-0 bg-on-primary-fixed/80 backdrop-blur-sm"></div>
      </div>

      {/* Chuyển ngôn ngữ VI | EN | KO */}
      <div className="absolute top-5 right-5 z-20">
        <LanguageSwitcher variant="light" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="bg-surface border border-outline-variant p-8 rounded-lg shadow-2xl w-full max-w-[400px] relative z-10"
      >
        <div className="text-center mb-8">
          <h1 className="text-display-lg text-primary font-bold tracking-tight">
            Kmart
          </h1>
          <p className="text-body-md text-on-surface-variant mt-1">
            {t('Hệ thống quản trị nội bộ')}
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 bg-error-container text-on-error-container rounded-md text-body-md border border-error/20">
            {t(error)}
          </div>
        )}

        {!isResetPassword ? (
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-label-md text-on-surface mb-1.5">
                {t('Email làm việc')}
              </label>
              <input
                type="email"
                required
                className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant rounded-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary-container transition-all"
                placeholder="nhanvien@kmart.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-label-md text-on-surface">
                  {t('Mật khẩu')}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsResetPassword(true);
                    setResetSuccess(false);
                    setResetEmail(email);
                    setResetTempPassword("");
                    setResetNewPassword("");
                    setResetConfirmPassword("");
                    setError("");
                  }}
                  className="text-label-sm text-primary hover:underline focus:outline-none"
                >
                  {t('Đặt lại mật khẩu')}
                </button>
              </div>
              <input
                type="password"
                required
                className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant rounded-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary-container transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-on-primary py-2.5 rounded-md text-label-md hover:bg-on-primary-fixed-variant transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-2 shadow-sm cursor-pointer"
            >
              {loading ? t('Đang xác thực...') : t('Đăng nhập')}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-5">
            {!resetSuccess ? (
              <>
                <div>
                  <p className="text-xs text-secondary mb-3">
                    {t('Nhập mật khẩu tạm do HR/Quản trị cấp (chức năng "Đặt lại mật khẩu" ở màn Nhân sự) để đổi sang mật khẩu mới của bạn.')}
                  </p>
                  <label className="block text-label-md text-on-surface mb-1.5">
                    {t('Email làm việc')}
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant rounded-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary-container transition-all"
                    placeholder="nhanvien@kmart.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-label-md text-on-surface mb-1.5">
                    {t('Mật khẩu tạm')}
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant rounded-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary-container transition-all"
                    placeholder={t('Mật khẩu tạm do HR cấp')}
                    value={resetTempPassword}
                    onChange={(e) => setResetTempPassword(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-label-md text-on-surface mb-1.5">
                    {t('Mật khẩu mới')}
                  </label>
                  <input
                    type="password"
                    required
                    className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant rounded-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary-container transition-all"
                    placeholder="••••••••"
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-label-md text-on-surface mb-1.5">
                    {t('Xác nhận mật khẩu mới')}
                  </label>
                  <input
                    type="password"
                    required
                    className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant rounded-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary-container transition-all"
                    placeholder="••••••••"
                    value={resetConfirmPassword}
                    onChange={(e) => setResetConfirmPassword(e.target.value)}
                  />
                  <p className="text-xs text-secondary mt-1.5">
                    {t('Tối thiểu 8 ký tự, gồm chữ hoa, chữ thường và chữ số.')}
                  </p>
                </div>
                <div className="flex flex-col gap-2 mt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary text-on-primary py-2.5 rounded-md text-label-md hover:bg-on-primary-fixed-variant transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm cursor-pointer"
                  >
                    {loading ? t('Đang xử lý...') : t('Đặt lại mật khẩu')}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsResetPassword(false); setError(""); }}
                    className="w-full bg-surface-container-low text-on-surface py-2.5 rounded-md text-label-md hover:bg-surface-container transition-colors cursor-pointer"
                  >
                    {t('Quay lại đăng nhập')}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto text-success">
                  <span className="material-symbols-outlined text-[32px]">check_circle</span>
                </div>
                <div>
                  <h3 className="text-title-md font-semibold text-on-surface mb-1">{t('Đã đặt lại mật khẩu')}</h3>
                  <p className="text-body-sm text-secondary">
                    {t('Vui lòng đăng nhập bằng mật khẩu mới của bạn.')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setIsResetPassword(false); setError(""); }}
                  className="w-full bg-primary text-on-primary py-2.5 rounded-md text-label-md hover:bg-on-primary-fixed-variant transition-colors mt-2 cursor-pointer"
                >
                  {t('Quay lại đăng nhập')}
                </button>
              </div>
            )}
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default LoginPage;
