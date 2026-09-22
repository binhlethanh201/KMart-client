import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleSmoothNavigate = (targetPath) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      navigate(targetPath);
    }, 800);
  };

  // NỘI DUNG ĐƯỢC CHỌN LỌC TỪ BẢNG KHẢO SÁT (Đã ẩn danh và viết lại thành tính năng phần mềm)
  const HR_SOLUTIONS = [
    {
      title: "Quy trình duyệt đơn linh hoạt",
      description:
        "Tự động hóa luân chuyển đơn từ theo cấp bậc (Nhân viên - Quản lý - Ban Giám đốc). Tùy biến luồng duyệt tuần tự theo từng loại đơn.",
      icon: "account_tree",
    },
    {
      title: "Kiểm soát thời gian xử lý (SLA)",
      description:
        "Thiết lập thời hạn xử lý đơn (ví dụ: tự động hoàn trả sau 12h nếu không duyệt). Yêu cầu nhập lý do chi tiết khi từ chối đơn.",
      icon: "pending_actions",
    },
    {
      title: "Biểu mẫu động thông minh",
      description:
        "Các trường dữ liệu thay đổi linh hoạt theo loại đơn (Nghỉ phép, Làm thêm, Thai sản...). Dễ dàng đính kèm hình ảnh và tài liệu chứng minh.",
      icon: "dynamic_form",
    },
    {
      title: "Phân quyền & Báo cáo tập trung",
      description:
        "Bảo mật thông tin tuyệt đối giữa các phòng ban. Cung cấp báo cáo tổng hợp đa chiều giúp bộ phận Nhân sự dễ dàng theo dõi và xuất dữ liệu.",
      icon: "admin_panel_settings",
    },
  ];

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background">
      <div
        className="flex h-full w-[200vw] transition-transform ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          transitionDuration: "800ms",
          transform: isTransitioning ? "translateX(-100vw)" : "translateX(0)",
        }}
      >
        {/* ========== TRANG 1: NỘI DUNG CHÍNH (LANDING PAGE) ========== */}
        <div className="flex h-full w-screen shrink-0 flex-col overflow-y-auto overflow-x-hidden">
          {/* HEADER */}
          <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between border-b border-outline-variant bg-surface/90 px-6 shadow-sm backdrop-blur-md md:px-12">
            <div
              className="cursor-pointer transition-transform active:scale-95 flex items-center gap-2"
              onClick={() => handleSmoothNavigate("/")}
            >
              <div className="w-8 h-8 rounded bg-primary text-on-primary flex items-center justify-center font-bold text-headline-sm">
                K
              </div>
              <span className="text-headline-md text-primary font-bold tracking-tight">
                Kmart
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleSmoothNavigate("/login")}
                className="rounded-md bg-primary px-5 py-2 text-label-md text-on-primary shadow-sm transition-all hover:bg-on-primary-fixed-variant active:scale-95 hidden sm:block"
              >
                Đăng nhập ngay
              </button>
            </div>
          </header>

          {/* HERO SECTION */}
          <section className="relative shrink-0 overflow-hidden border-b border-outline-variant bg-surface px-6 py-16 md:px-12 lg:py-24">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 h-96 w-96 rounded-full bg-primary-container blur-3xl opacity-50 mix-blend-multiply" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-72 w-72 rounded-full bg-success-container blur-3xl opacity-30 mix-blend-multiply" />

            <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-12">
              <div className="space-y-6 text-left lg:col-span-6">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-primary-fixed-dim bg-primary-container px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-on-primary-container shadow-sm">
                  <span className="material-symbols-outlined text-[14px] text-primary">
                    verified
                  </span>
                  Nền tảng duyệt đơn nội bộ
                </div>

                <h1 className="text-display-lg text-on-surface md:text-[2.9rem] md:leading-[1.15]">
                  Số hóa quy trình duyệt đơn
                  <br />
                  <span className="text-primary">
                    Quản trị nhân sự thông minh
                  </span>
                </h1>

                <p className="max-w-xl text-body-lg text-on-surface-variant">
                  Giải quyết triệt để sự cồng kềnh của giấy tờ.{" "}
                  <strong className="text-on-surface font-semibold">
                    Kmart
                  </strong>{" "}
                  tự động hóa luồng phê duyệt từ nhân viên đến ban giám đốc,
                  tích hợp biểu mẫu động và hệ thống thông báo tức thì.
                </p>

                <div className="flex w-full flex-col gap-3 pt-4 text-label-md sm:w-auto sm:flex-row">
                  <button
                    type="button"
                    onClick={() => handleSmoothNavigate("/login")}
                    className="group flex items-center justify-center gap-2 rounded-md bg-primary px-8 py-3 text-on-primary shadow-sm transition-all hover:bg-on-primary-fixed-variant active:scale-95"
                  >
                    <span>Truy cập hệ thống</span>
                    <span className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-1">
                      arrow_forward
                    </span>
                  </button>
                </div>
              </div>

              {/* HERO VISUAL (Mockup Dashboard Đơn từ) */}
              <div className="hidden w-full lg:col-span-6 lg:block">
                <div className="group relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg border border-outline-variant bg-surface-container p-8 shadow-xl">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:32px_32px] opacity-50" />
                  <div className="relative z-10 flex h-full w-full flex-col overflow-hidden rounded-md border border-outline-variant bg-surface shadow-md">
                    <div className="flex items-center justify-between border-b border-outline-variant px-4 py-3 bg-surface-container-low">
                      <div className="flex gap-2">
                        <span className="h-3 w-3 rounded-full bg-error/70" />
                        <span className="h-3 w-3 rounded-full bg-warning/70" />
                        <span className="h-3 w-3 rounded-full bg-success/70" />
                      </div>
                      <div className="h-2 w-24 rounded bg-outline-variant" />
                    </div>
                    <div className="flex flex-1 p-4 gap-4">
                      <div className="w-1/4 space-y-3">
                        <div className="h-2 w-3/4 rounded bg-outline-variant" />
                        <div className="h-2 w-full rounded bg-surface-container-high" />
                        <div className="h-2 w-5/6 rounded bg-surface-container-high" />
                        <div className="h-2 w-full rounded bg-surface-container-high" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="flex justify-between items-center mb-4">
                          <div className="h-4 w-32 rounded bg-outline-variant" />
                          <div className="h-6 w-20 rounded bg-primary-container" />
                        </div>
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between rounded border border-outline-variant p-3 transition-colors group-hover:border-primary-fixed-dim bg-surface"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-primary-container flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined text-[16px]">
                                  draft
                                </span>
                              </div>
                              <div className="space-y-1">
                                <div className="h-2 w-24 rounded bg-on-surface-variant" />
                                <div className="h-1.5 w-16 rounded bg-outline" />
                              </div>
                            </div>
                            <div className="h-2 w-12 rounded bg-warning-container" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* GIẢI PHÁP NGHIỆP VỤ (MODULES) */}
          <section className="shrink-0 bg-background px-6 py-20 md:px-12">
            <div className="mx-auto max-w-7xl">
              <div className="mb-12 text-left md:text-center">
                <h2 className="text-headline-md text-on-surface">
                  Giải pháp toàn diện cho nghiệp vụ Đơn từ
                </h2>
                <div className="mt-3 h-1 w-12 bg-primary md:mx-auto rounded-full" />
                <p className="mt-4 text-body-md text-on-surface-variant max-w-2xl mx-auto">
                  Thiết kế chuyên sâu dựa trên nhu cầu vận hành thực tế, đáp ứng
                  mọi quy chuẩn luân chuyển hồ sơ phức tạp nhất.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {HR_SOLUTIONS.map((feature, idx) => (
                  <div
                    key={idx}
                    className="group rounded-lg border border-outline-variant bg-surface p-6 shadow-sm transition-all duration-200 hover:border-primary hover:shadow-md"
                  >
                    <div className="mb-5 inline-flex rounded-lg bg-primary-container p-3 text-primary transition-colors duration-200 group-hover:bg-primary group-hover:text-on-primary">
                      <span className="material-symbols-outlined text-[24px]">
                        {feature.icon}
                      </span>
                    </div>
                    <h3 className="mb-2 text-label-md text-on-surface">
                      {feature.title}
                    </h3>
                    <p className="text-body-md text-on-surface-variant">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* FOOTER */}
          <footer className="shrink-0 border-t border-outline-variant bg-surface py-8">
            <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-4 md:flex-row md:justify-between md:px-12">
              <div className="flex items-center gap-2 opacity-80">
                <div className="w-6 h-6 rounded bg-on-surface-variant text-surface flex items-center justify-center text-xs font-bold">
                  K
                </div>
                <span className="text-label-md text-on-surface-variant font-bold">
                  Kmart
                </span>
              </div>
              <span className="text-[11px] uppercase tracking-widest text-outline">
                &copy; 2026 Kmart Internal Systems. Bảo lưu mọi quyền lợi.
              </span>
            </div>
          </footer>
        </div>

        {/* ========== TRANG 2: MÀN HÌNH CHUYỂN CẢNH MÀU PRIMARY NHẠT DẦN ========== */}
        <div
          className="relative flex h-full w-screen shrink-0 flex-col items-center justify-center text-white overflow-hidden"
          style={{
            // Sử dụng dải màu từ Primary (#1d4ed8) nhạt dần sang xanh sáng hơn (#60a5fa)
            background: "linear-gradient(135deg, #174ad6 0%, #135eba 100%)",
          }}
        >
          {/* Lớp Overlay chấm bi/sáng nhẹ để màn hình bớt trống trải */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#ffffff,transparent_60%)] opacity-[0.15] mix-blend-overlay" />

          <div className="relative z-10 flex flex-col items-center gap-4 text-center">
            {/* Spinner màu trắng trong suốt */}
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white" />
            <span className="text-label-md uppercase tracking-widest text-white/90">
              Đang kết nối hệ thống...
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
