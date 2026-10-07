/**
 * Nền thương hiệu dùng chung cho các màn xác thực (đăng nhập, đổi mật khẩu bắt buộc).
 *
 * AUTH-12: trước đây chỉ màn đăng nhập có nền gradient nhiều lớp, còn màn "Đổi mật khẩu
 * bắt buộc" nền trắng nhạt trông lạc tông. Tách phần nền ra component dùng chung để hai
 * màn luôn đồng nhất (và sau này thêm màn xác thực nào nữa cũng chỉ dùng lại ở một nơi).
 */
export default function AuthBackground({ children }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0a1733] px-5 py-12">
      {/* Nền gradient thương hiệu nhiều lớp — nhìn chuyên nghiệp thay vì nền trắng nhạt trống trải */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(155deg,#0a1733_0%,#122a6b_42%,#1d4ed8_100%)]" />
      {/* Quầng sáng tạo chiều sâu */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-[#3b82f6]/25 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -left-24 h-[420px] w-[420px] rounded-full bg-[#1d4ed8]/30 blur-[110px]" />
      <div className="pointer-events-none absolute -right-32 top-1/3 h-[380px] w-[380px] rounded-full bg-[#60a5fa]/15 blur-[110px]" />
      {/* Lưới mảnh + vệt sáng chéo tạo cảm giác "bản thiết kế kỹ thuật" */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.055)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_78%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.07)_50%,transparent_65%)]" />
      {children}
    </div>
  );
}
