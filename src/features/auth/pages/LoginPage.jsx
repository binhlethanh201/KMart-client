import React, { useState } from "react";
import { authService } from "../services/authService";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";

const LoginPage = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
        setError("Đăng nhập thành công nhưng không nhận được token.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu.",
      );
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
            Hệ thống quản trị nội bộ
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 bg-error-container text-on-error-container rounded-md text-body-md border border-error/20">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-label-md text-on-surface mb-1.5">
              Email làm việc
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
            <label className="block text-label-md text-on-surface mb-1.5">
              Mật khẩu
            </label>
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
            className="w-full bg-primary text-on-primary py-2.5 rounded-md text-label-md hover:bg-on-primary-fixed-variant transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-2 shadow-sm"
          >
            {loading ? "Đang xác thực..." : "Đăng nhập"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default LoginPage;
