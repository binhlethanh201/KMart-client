import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { useI18n } from '../../../i18n/I18nProvider';
import LanguageSwitcher from '../../../components/LanguageSwitcher';
import BrandLogo from '../../../components/BrandLogo';
import TiltCard from '../../../components/TiltCard';

const LandingPage = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
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
      title: t('Quy trình duyệt đơn linh hoạt'),
      description:
        t('Tự động hóa luân chuyển đơn từ theo ba cấp duyệt. Tùy biến thứ tự duyệt tuần tự theo từng loại đơn.'),
      icon: "account_tree",
    },
    {
      title: t('Kiểm soát thời gian xử lý (SLA)'),
      description:
        t('Thiết lập thời hạn xử lý đơn (ví dụ: tự động hoàn trả sau 12h nếu không duyệt). Yêu cầu nhập lý do chi tiết khi từ chối đơn.'),
      icon: "pending_actions",
    },
    {
      title: t('Biểu mẫu động thông minh'),
      description:
        t('Các trường dữ liệu thay đổi linh hoạt theo loại đơn (Nghỉ phép, Làm thêm, Thai sản...). Dễ dàng đính kèm hình ảnh và tài liệu chứng minh.'),
      icon: "dynamic_form",
    },
    {
      title: t('Phân quyền & Báo cáo tập trung'),
      description:
        t('Bảo mật thông tin tuyệt đối giữa các phòng ban. Cung cấp báo cáo tổng hợp đa chiều giúp bộ phận Nhân sự dễ dàng theo dõi và xuất dữ liệu.'),
      icon: "admin_panel_settings",
    },
  ];

  /*
   * Ba cấp duyệt lấy ĐÚNG tên nhóm trong `HIERARCHY_OPTIONS` (WorkflowTab) — Cấp trực tiếp /
   * Trong đơn vị / Cấp trên. Khớp luôn với con số "3 cấp" ở khối thống kê phía trên; bản trước
   * của khối này ghi "Nhân viên - Trưởng nhóm - Trưởng phòng - Ban giám đốc" là nhãn tự đặt,
   * có chức danh không hề tồn tại trong hệ thống.
   *
   * BE-78: mỗi nhãn PHẢI là t('...') với chuỗi hằng — scripts/i18n-sync.mjs chỉ quét được chuỗi
   * hằng, nên đừng gom thành biến rồi gọi t(biến).
   */
  const APPROVAL_STEPS = [
    { label: t('Cấp trực tiếp'), note: t('Quản lý trực tiếp') },
    { label: t('Trong đơn vị'), note: t('Trưởng phòng, Cửa hàng trưởng') },
    { label: t('Cấp trên'), note: t('Giám đốc khối / Ban giám đốc') },
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
            {/* Logo là điều hướng về trang chủ: dùng <button> để Tab tới và Enter được.
                Trước đây là <div cursor-pointer onClick> nên người dùng bàn phím không tới được.
                Không đặt aria-label riêng: tên của nút lấy từ chính chữ "Kmart" trong logo. */}
            <button
              type="button"
              onClick={() => handleSmoothNavigate("/")}
              className="cursor-pointer transition-transform active:scale-95"
            >
              <BrandLogo size="sm" />
            </button>

            <div className="flex items-center gap-3">
              <LanguageSwitcher variant="light" />
              <button
                type="button"
                onClick={() => handleSmoothNavigate("/login")}
                className="hidden rounded-lg bg-primary px-5 py-2 text-label-md text-on-primary shadow-sm transition-all hover:bg-on-primary-fixed-variant active:scale-95 sm:block"
              >
                {t('Đăng nhập ngay')}
              </button>
            </div>
          </header>

          {/* HERO SECTION
              AUTH-14: dựng lại chiều sâu. Bản trước bị phẳng vì bỏ hết lớp nền mà không thay bằng gì.
              Nay: nền gradient nhẹ + hai quầng sáng màu thương hiệu (xanh dương = văn phòng,
              xanh lá = siêu thị) + lưới mờ dần ở rìa. Khác bản AI cũ ở chỗ lưới bị mask mạnh nên
              không thấy mối nối, và quầng sáng nằm SAU nội dung theo trục z thật. */}
          <section className="relative shrink-0 overflow-hidden border-b border-outline-variant px-6 py-16 md:px-12 lg:py-20">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(165deg,#ffffff_0%,#f4f7ff_48%,#eefbf3_100%)]" />
            <div className="pointer-events-none absolute -right-24 -top-24 h-[520px] w-[520px] rounded-full bg-[#1d4ed8]/[0.16] blur-[100px]" />
            <div className="pointer-events-none absolute -bottom-32 left-[8%] h-[420px] w-[420px] rounded-full bg-[#15803d]/[0.12] blur-[100px]" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.045)_1px,transparent_1px)] bg-[size:52px_52px] [mask-image:radial-gradient(ellipse_at_50%_0%,black,transparent_70%)]" />

            <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-12">
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-6 text-left lg:col-span-6"
              >
                <div className="inline-flex items-center gap-1.5 rounded-full border border-success/25 bg-success-container px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-on-success-container">
                  <span aria-hidden="true" className="material-symbols-outlined text-[14px]">
                    storefront
                  </span>
                  {t('Nền tảng duyệt đơn nội bộ')}
                </div>

                <h1 className="text-display-lg text-on-surface md:text-[2.9rem] md:leading-[1.15]">
                  {t('Số hóa quy trình duyệt đơn')}
                  <br />
                  <span className="text-primary">
                    {t('Quản trị nhân sự thông minh')}
                  </span>
                </h1>

                <p className="max-w-xl text-body-lg text-on-surface-variant">
                  {t('Giải quyết triệt để sự cồng kềnh của giấy tờ.')}{" "}
                  <strong className="text-on-surface font-semibold">
                    Kmart
                  </strong>{" "}
                  {t('tự động hóa luồng phê duyệt từ nhân viên đến ban giám đốc, tích hợp biểu mẫu động và hệ thống thông báo tức thì.')}
                </p>

                <div className="flex w-full flex-col gap-3 pt-4 text-label-md sm:w-auto sm:flex-row">
                  <button
                    type="button"
                    onClick={() => handleSmoothNavigate("/login")}
                    className="group flex items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3 text-on-primary shadow-[0_14px_30px_-10px_rgba(29,78,216,0.65)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-12px_rgba(29,78,216,0.75)] active:translate-y-0 active:scale-[0.98]"
                  >
                    <span>{t('Truy cập hệ thống')}</span>
                    <span aria-hidden="true" className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-1">
                      arrow_forward
                    </span>
                  </button>
                </div>

                {/* BE-77: vài con số tạo điểm neo thị giác cho khối hero.
                    BE-78: mỗi nhãn phải là một lời gọi t('...') với CHUỖI HẰNG để
                    scripts/i18n-sync.mjs quét được và tự sinh bản dịch. */}
                <dl className="grid gap-4 border-t border-outline-variant pt-6 grid-cols-[repeat(auto-fit,minmax(min(100%,110px),1fr))]">
                  <div>
                    <dt className="text-[22px] font-bold leading-tight text-primary">100%</dt>
                    <dd className="mt-0.5 text-[12px] uppercase tracking-wide text-secondary">
                      {t('Số hóa hồ sơ')}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[22px] font-bold leading-tight text-primary">{t('3 cấp')}</dt>
                    <dd className="mt-0.5 text-[12px] uppercase tracking-wide text-secondary">
                      {t('Luồng duyệt')}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[22px] font-bold leading-tight text-primary">{t('12 giờ')}</dt>
                    <dd className="mt-0.5 text-[12px] uppercase tracking-wide text-secondary">
                      {t('Hạn xử lý')}
                    </dd>
                  </div>
                </dl>
              </motion.div>

              {/*
                AUTH-14: sơ đồ luồng duyệt THẬT (3 cấp lấy từ WorkflowTab HIERARCHY_OPTIONS), nay đặt
                trên một thẻ nghiêng 3D theo con trỏ và có các bước trôi vào lần lượt. Nội dung là
                thật nên vừa đẹp vừa đọc được, khác hẳn khung dashboard giả trước đây.

                Chỉ hiện từ `lg`: dưới ngưỡng đó sơ đồ sẽ đẩy biểu mẫu xuống quá sâu.
              */}
              <div className="hidden lg:col-span-6 lg:block">
                <TiltCard
                  glare
                  intensity={8}
                  className="rounded-2xl border border-outline-variant bg-surface/95 p-7 shadow-[0_30px_70px_-30px_rgba(13,31,77,0.38),0_2px_10px_-4px_rgba(13,31,77,0.12)] backdrop-blur-sm"
                >
                  <p className="mb-6 text-label-md font-semibold uppercase tracking-wide text-secondary">
                    {t('Luồng duyệt theo cấp bậc')}
                  </p>
                  <ol className="space-y-0">
                    {APPROVAL_STEPS.map((step, i) => (
                      <motion.li
                        key={step.label}
                        initial={reduceMotion ? false : { opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.45, delay: 0.25 + i * 0.14, ease: [0.16, 1, 0.3, 1] }}
                        className="flex gap-4"
                      >
                        <div className="flex flex-col items-center">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(140deg,#2563eb,#1d4ed8)] text-label-md font-bold text-white shadow-[0_6px_14px_-6px_rgba(29,78,216,0.8)]">
                            {i + 1}
                          </span>
                          {i < APPROVAL_STEPS.length - 1 && (
                            <span aria-hidden="true" className="w-px flex-1 bg-outline-variant" />
                          )}
                        </div>
                        <div className={i < APPROVAL_STEPS.length - 1 ? 'pb-6' : ''}>
                          <p className="text-label-md text-on-surface">{step.label}</p>
                          <p className="mt-0.5 text-[12px] text-muted">{step.note}</p>
                        </div>
                      </motion.li>
                    ))}
                  </ol>
                </TiltCard>
              </div>
            </div>
          </section>

          {/* GIẢI PHÁP NGHIỆP VỤ (MODULES) */}
          <section className="shrink-0 bg-background px-6 py-20 md:px-12">
            <div className="mx-auto max-w-7xl">
              <div className="mb-12 text-left md:text-center">
                <h2 className="text-headline-md text-on-surface">
                  {t('Giải pháp toàn diện cho nghiệp vụ Đơn từ')}
                </h2>
                <div className="mt-3 h-1 w-12 bg-primary md:mx-auto rounded-full" />
                <p className="mt-4 text-body-md text-on-surface-variant max-w-2xl mx-auto">
                  {t('Thiết kế chuyên sâu dựa trên nhu cầu vận hành thực tế, đáp ứng mọi quy chuẩn luân chuyển hồ sơ phức tạp nhất.')}
                </p>
              </div>

              <div className="grid gap-5 grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))]">
                {HR_SOLUTIONS.map((feature, idx) => (
                  <motion.div
                    key={idx}
                    initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.5, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {/* AUTH-14: thẻ nghiêng 3D nhẹ. Cường độ thấp (6) vì đây là lưới 4 thẻ —
                        nghiêng mạnh ở nhiều thẻ cạnh nhau sẽ gây rối mắt. */}
                    <TiltCard
                      glare
                      intensity={6}
                      className="group h-full overflow-hidden rounded-xl border border-outline-variant bg-surface p-6 shadow-[0_16px_40px_-20px_rgba(13,31,77,0.28)] transition-shadow duration-200 hover:shadow-[0_28px_60px_-24px_rgba(13,31,77,0.42)]"
                    >
                      <div className="mb-5 inline-flex rounded-xl bg-primary-container p-3 text-primary transition-colors duration-200 group-hover:bg-primary group-hover:text-on-primary">
                        <span aria-hidden="true" className="material-symbols-outlined text-[24px]">
                          {feature.icon}
                        </span>
                      </div>
                      <h3 className="mb-2 text-label-md text-on-surface">
                        {feature.title}
                      </h3>
                      <p className="text-body-md text-on-surface-variant">
                        {feature.description}
                      </p>
                    </TiltCard>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* BE-77: KHỐI KÊU GỌI HÀNH ĐỘNG trước chân trang.
              AUTH-14: navy đặc + hai quầng sáng màu để có chiều sâu, nhưng vẫn là nền ĐẶC nên
              tương phản chữ trắng cố định và đo được (bản gradient cũ để chữ trắng rơi vào đoạn
              sáng tuỳ vị trí). */}
          <section className="shrink-0 px-6 pb-20 md:px-12">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="relative mx-auto max-w-7xl overflow-hidden rounded-2xl bg-[#0d1f4d] px-8 py-12 text-white shadow-[0_30px_70px_-30px_rgba(13,31,77,0.6)] md:px-14"
            >
              <div className="pointer-events-none absolute -right-20 -top-24 h-[360px] w-[360px] rounded-full bg-[#1d4ed8]/50 blur-[90px]" />
              <div className="pointer-events-none absolute -bottom-28 left-[22%] h-[300px] w-[300px] rounded-full bg-[#15803d]/30 blur-[90px]" />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_at_70%_40%,black,transparent_72%)]" />

              <div className="relative z-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
                <div className="max-w-xl">
                  <h2 className="text-headline-md">{t('Sẵn sàng số hóa quy trình duyệt đơn?')}</h2>
                  <p className="mt-2 text-body-md text-white/85">
                    {t('Đăng nhập để theo dõi đơn từ, phê duyệt theo cấp bậc và xuất báo cáo nhân sự ngay hôm nay.')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleSmoothNavigate("/login")}
                  className="group flex flex-shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-7 py-3 text-label-md font-semibold text-primary shadow-[0_14px_32px_-12px_rgba(0,0,0,0.55)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_42px_-14px_rgba(0,0,0,0.65)] active:translate-y-0 active:scale-[0.98]"
                >
                  <span>{t('Đăng nhập ngay')}</span>
                  <span aria-hidden="true" className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-1">
                    arrow_forward
                  </span>
                </button>
              </div>
            </motion.div>
          </section>

          {/* FOOTER */}
          <footer className="shrink-0 border-t border-outline-variant bg-surface py-8">
            <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-4 md:flex-row md:justify-between md:px-12">
              <div className="flex items-center gap-2">
                <BrandLogo size="sm" />
              </div>
              <span className="text-[11px] uppercase tracking-widest text-muted">
                {t('© 2026 Kmart Internal Systems. Bảo lưu mọi quyền lợi.')}
              </span>
              <LanguageSwitcher variant="light" />
            </div>
          </footer>
        </div>

        {/* ========== TRANG 2: MÀN HÌNH CHUYỂN CẢNH ==========
            AUTH-14: navy đặc #0d1f4d khớp cột thương hiệu của AuthBackground, thêm hai quầng sáng
            để không phẳng. Đây là màn chờ nên chuyển động phải rất nhẹ. */}
        <div className="relative flex h-full w-screen shrink-0 flex-col items-center justify-center overflow-hidden bg-[#0d1f4d] text-white">
          <div className="pointer-events-none absolute -top-24 right-[12%] h-[420px] w-[420px] rounded-full bg-[#1d4ed8]/40 blur-[100px]" />
          <div className="pointer-events-none absolute -bottom-28 left-[8%] h-[380px] w-[380px] rounded-full bg-[#15803d]/25 blur-[100px]" />

          <div className="relative z-10 flex flex-col items-center gap-4 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/25 border-t-white" />
            <span className="text-label-md uppercase tracking-widest text-white/90">
              {t('Đang kết nối hệ thống...')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
