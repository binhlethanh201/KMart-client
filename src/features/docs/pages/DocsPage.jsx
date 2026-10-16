import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../../../i18n/I18nProvider';
import { useApproval } from '../../../context/useApproval';
import PageHeader from '../../../components/PageHeader';
import { markdownToHtml, slug } from '../markdown';
import { filterSectionsByRole, VISIBILITY } from '../roleSections';
import { pickActiveId, createTocLock } from '../tocScroll';

/**
 * DOCS-01: trang HƯỚNG DẪN riêng trong ứng dụng.
 *
 * Nội dung KHÔNG nhúng cứng vào component mà đọc từ file Markdown `public/docs/HUONG-DAN.md`
 * (serve tĩnh bởi Rsbuild) — nhờ vậy đội ngũ sửa tài liệu bằng cách sửa file .md mà không phải
 * đụng code React; trang này chỉ lo render.
 *
 * Phần sinh HTML từ markdown nằm ở `src/features/docs/markdown.js` (có test riêng).
 */
export default function DocsPage() {
  const { t, language } = useI18n();
  const { currentUser, hasPermission } = useApproval();
  const [md, setMd] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeId, setActiveId] = useState('');
  const scrollRef = useRef(null);

  // DOCS-02: nội dung tài liệu dịch theo ngôn ngữ đang chọn (vi/en/ko).
  // File theo ngôn ngữ không tồn tại thì tự quay về bản tiếng Việt gốc.
  useEffect(() => {
    let cancelled = false;
    const file = language && language !== 'vi' ? `/docs/HUONG-DAN.${language}.md` : '/docs/HUONG-DAN.md';
    setLoading(true);
    setError('');
    fetch(file)
      .then((r) => (r.ok ? r : fetch('/docs/HUONG-DAN.md')))
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then((text) => { if (!cancelled) setMd(text); })
      .catch((e) => { if (!cancelled) setError(String(e)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [language]);

  // DOCS-07: chỉ giữ những mục mà vai trò đang đăng nhập được xem (xem roleSections.js).
  // Đặt trước phần render markdown nên mục lục, rail phải và nội dung luôn khớp nhau.
  const visibleMd = useMemo(
    () => filterSectionsByRole(md, (label) => {
      const rule = VISIBILITY[label];
      return rule ? rule(currentUser, hasPermission) : true;
    }),
    [md, currentUser, hasPermission],
  );

  const html = useMemo(() => (visibleMd ? markdownToHtml(visibleMd) : ''), [visibleMd]);

  const toc = useMemo(() => {
    if (!visibleMd) return [];
    return visibleMd
      .split('\n')
      .filter((l) => /^##\s+/.test(l))
      .map((l) => {
        const text = l.replace(/^##\s+/, '').trim();
        return { id: slug(text), text };
      });
  }, [visibleMd]);

  // Mục con (###) cho rail phải — giúp lấp khoảng trống màn rộng và nhảy nhanh tới tiểu mục.
  const sections = useMemo(() => {
    if (!visibleMd) return [];
    const out = [];
    visibleMd.split('\n').forEach((l) => {
      const h2 = l.match(/^##\s+(.*)$/);
      const h3 = l.match(/^###\s+(.*)$/);
      if (h2) out.push({ id: slug(h2[1].trim()), text: h2[1].trim(), subs: [] });
      else if (h3 && out.length) out[out.length - 1].subs.push({ id: slug(h3[1].trim()), text: h3[1].trim() });
    });
    return out;
  }, [visibleMd]);

  const activeSection = useMemo(
    () => sections.find((s) => s.id === activeId) || sections[0] || null,
    [sections, activeId]
  );

  /**
   * DOCS-09: xem createTocLock (tocScroll.js). `onCommit` được gọi gián tiếp nên lock giữ được
   * tham chiếu ổn định qua các lần render.
   */
  const [lock] = useState(() => createTocLock({ onCommit: setActiveId }));

  useEffect(() => {
    // Người dùng chủ động cuộn (chuột / chạm / bàn phím) thì trả quyền lại cho quy tắc theo vị trí.
    const release = () => lock.release();
    window.addEventListener('wheel', release, { passive: true });
    window.addEventListener('touchstart', release, { passive: true });
    window.addEventListener('keydown', release);
    return () => {
      window.removeEventListener('wheel', release);
      window.removeEventListener('touchstart', release);
      window.removeEventListener('keydown', release);
    };
  }, [lock]);

  // Tô sáng mục lục theo vị trí cuộn: xem pickActiveId (tocScroll.js) — có xử lý riêng cho
  // trường hợp đã cuộn tới đáy, nếu không thì các mục cuối tài liệu không bao giờ được tô sáng.
  const handleScroll = () => {
    const root = scrollRef.current;
    if (!root || toc.length === 0) return;
    const rootTop = root.getBoundingClientRect().top;
    const tops = toc.map((item) => {
      const el = root.querySelector(`#${CSS.escape(item.id)}`);
      return el ? el.getBoundingClientRect().top - rootTop : Number.POSITIVE_INFINITY;
    });
    lock.commit(pickActiveId(toc.map((i) => i.id), tops, root));
  };

  // Cuộn mượt tới một mục: trang cuộn trong khung riêng nên không dùng jump mặc định của anchor.
  const goTo = (event, id) => {
    event.preventDefault();
    lock.lock(id);
    const root = scrollRef.current;
    const el = root && root.querySelector(`#${CSS.escape(id)}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollTop = () => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <section className="flex-1 flex flex-col min-h-0 w-full">
      <PageHeader
        icon="menu_book"
        title={t('Hướng dẫn sử dụng hệ thống')}
        subtitle={t('Cẩm nang thao tác cho người dùng & quản trị viên: tạo đơn, duyệt đơn, cấu hình luồng, Telegram, ủy quyền, báo cáo.')}
      />
      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 min-h-0 overflow-y-auto">
        <div className="w-full px-4 py-6 md:px-8 xl:px-12">
          {/* Hero giới thiệu nhanh */}
          <div className="relative mb-6 overflow-hidden rounded-2xl border border-primary/20 bg-[linear-gradient(135deg,#eef4ff_0%,#f8fafc_55%,#eefbf4_100%)] px-6 py-6 md:px-8">
            <span aria-hidden="true" className="pointer-events-none absolute -right-8 -top-10 text-[150px] leading-none text-primary/10 select-none material-symbols-outlined">menu_book</span>
            <div className="relative flex flex-col gap-2">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">
                <span aria-hidden="true" className="material-symbols-outlined text-[14px]">verified</span>
                {t('Cẩm nang thao tác')}
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-on-surface">
                {t('Đọc 5 phút là dùng được KMart')}
              </h2>
              <p className="max-w-[640px] text-sm leading-relaxed text-on-surface-variant">
                {t('Trang này tổng hợp đúng các thao tác trên giao diện thật: tạo đơn, duyệt đơn, cấu hình luồng duyệt, kết nối Telegram, ủy quyền và báo cáo. Bấm mục lục bên trái để nhảy thẳng tới phần cần xem.')}
              </p>
              <div className="mt-1 flex flex-wrap gap-2">
                {toc.slice(0, 5).map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={(e) => goTo(e, item.id)}
                    className="inline-flex items-center gap-1 rounded-full border border-outline-variant bg-surface px-3 py-1.5 text-[12px] font-medium text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    <span aria-hidden="true" className="material-symbols-outlined text-[14px] text-primary">arrow_forward</span>
                    {item.text.replace(/^\d+\.\s*/, '')}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-secondary">
              <span aria-hidden="true" className="material-symbols-outlined animate-spin text-[22px]">progress_activity</span>
              {t('Đang tải tài liệu...')}
            </div>
          )}
          {error && (
            <div className="rounded-lg bg-error-container px-4 py-3 text-sm text-on-error-container">
              {t('Không tải được file tài liệu.')} <code className="font-mono text-[12px]">{error}</code>
            </div>
          )}
          {!loading && !error && (
            <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] 2xl:grid-cols-[240px_minmax(0,1fr)_300px]">
              {/* Mục lục cố định bên trái (ẩn trên mobile) */}
              <nav className="hidden lg:block">
                <div className="sticky top-4 rounded-xl border border-outline-variant bg-surface p-4 shadow-sm">
                  <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-secondary">
                    <span aria-hidden="true" className="material-symbols-outlined text-[14px] text-primary">list</span>
                    {t('Mục lục')}
                  </div>
                  <ul className="space-y-0.5">
                    {toc.map((item) => (
                      <li key={item.id}>
                        <a
                          href={`#${item.id}`}
                          onClick={(e) => goTo(e, item.id)}
                          className={`block rounded-md px-2 py-1.5 text-[13px] transition-colors ${
                            activeId === item.id
                              ? 'bg-primary/10 font-semibold text-primary'
                              : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                          }`}
                        >
                          {item.text.replace(/^\d+\.\s*/, '')}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </nav>
              {/* Nội dung tài liệu */}
              <div className="min-w-0">
                <article
                  className="rounded-2xl border border-outline-variant bg-surface px-5 py-6 shadow-sm md:px-8 md:py-8 text-[14px]"
                  // Nội dung sinh từ file Markdown nội bộ; mọi chuỗi đã escape HTML ở tầng render.
                  dangerouslySetInnerHTML={{ __html: html }}
                />
                <button
                  type="button"
                  onClick={scrollTop}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-outline-variant bg-surface px-4 py-2 text-[12px] font-semibold text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary cursor-pointer"
                >
                  <span aria-hidden="true" className="material-symbols-outlined text-[16px]">arrow_upward</span>
                  {t('Lên đầu trang')}
                </button>
              </div>

              {/* Rail phải (màn rất rộng): tiểu mục của mục đang đọc + mẹo nhanh, lấp khoảng trắng */}
              <aside className="hidden 2xl:block">
                <div className="sticky top-4 space-y-4">
                  {activeSection && activeSection.subs.length > 0 && (
                    <div className="rounded-xl border border-outline-variant bg-surface p-4 shadow-sm">
                      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-secondary">
                        <span aria-hidden="true" className="material-symbols-outlined text-[14px] text-primary">format_list_numbered</span>
                        {t('Trong mục này')}
                      </div>
                      <div className="mb-1 text-[13px] font-semibold text-on-surface">
                        {activeSection.text.replace(/^\d+\.\s*/, '')}
                      </div>
                      <ul className="mt-1 space-y-0.5">
                        {activeSection.subs.map((s) => (
                          <li key={s.id}>
                            <a
                              href={`#${s.id}`}
                              onClick={(e) => goTo(e, s.id)}
                              className="block rounded-md px-2 py-1 text-[12.5px] text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
                            >
                              {s.text}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-primary">
                      <span aria-hidden="true" className="material-symbols-outlined text-[14px]">lightbulb</span>
                      {t('Mẹo nhanh')}
                    </div>
                    <ul className="space-y-2 text-[12.5px] leading-relaxed text-on-surface-variant">
                      <li className="flex gap-1.5">
                        <span aria-hidden="true" className="material-symbols-outlined text-[14px] text-primary flex-shrink-0 mt-0.5">bolt</span>
                        {t('Mọi tin Telegram đều có link "Xem chi tiết" — bấm là mở đúng đơn, không phải đi tìm.')}
                      </li>
                      <li className="flex gap-1.5">
                        <span aria-hidden="true" className="material-symbols-outlined text-[14px] text-primary flex-shrink-0 mt-0.5">route</span>
                        {t('Trước khi gửi đơn, mở "Xem chi tiết luồng" để chắc chắn đơn đi đúng người duyệt.')}
                      </li>
                      <li className="flex gap-1.5">
                        <span aria-hidden="true" className="material-symbols-outlined text-[14px] text-primary flex-shrink-0 mt-0.5">filter_alt</span>
                        {t('Trên điện thoại, bấm hàng "Bộ lọc" để thu gọn khu lọc, dành chỗ cho dữ liệu.')}
                      </li>
                      <li className="flex gap-1.5">
                        <span aria-hidden="true" className="material-symbols-outlined text-[14px] text-primary flex-shrink-0 mt-0.5">lock_reset</span>
                        {t('Quên mật khẩu: HR đặt lại, mật khẩu tạm gửi qua Telegram, đăng nhập rồi đổi ngay.')}
                      </li>
                    </ul>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
