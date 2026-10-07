import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../../../i18n/I18nProvider';
import PageHeader from '../../../components/PageHeader';

/**
 * DOCS-01: trang HƯỚNG DẪN riêng trong ứng dụng.
 *
 * Nội dung KHÔNG nhúng cứng vào component mà đọc từ file Markdown `public/docs/HUONG-DAN.md`
 * (serve tĩnh bởi Rsbuild) — nhờ vậy đội ngũ sửa tài liệu bằng cách sửa file .md mà không phải
 * đụng code React; trang này chỉ lo render.
 *
 * Renderer Markdown cố tình tối giản (đủ heading / bold / italic / list / bảng / code block /
 * link / quote / hr) để không phải thêm dependency mới vào project. Mọi nội dung đều được
 * escape HTML trước khi chèn thẻ nên an toàn với nội dung tài liệu.
 */

const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const inline = (s) =>
  escapeHtml(s)
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1" loading="lazy" class="my-4 w-full max-w-full rounded-xl border border-outline-variant bg-surface shadow-sm" />')
    .replace(/`([^`]+)`/g, '<code class="rounded bg-surface-container-high px-1 py-0.5 text-[12px] font-mono">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-on-surface">$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a class="text-primary underline underline-offset-2" href="$2" target="_blank" rel="noreferrer">$1</a>');

// DOCS-04: slug phải giữ chữ cái của MỌI ngôn ngữ (kể cả Hangul) — bản cũ chỉ giữ \w + dải
// tiếng Việt nên heading tiếng Hàn bị xoá sạch chữ, sinh id rỗng/trùng làm mục lục hỏng bấm.
const slug = (text) =>
  text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '');

function renderTable(rows) {
  const cells = (line) => line.split('|').slice(1, -1).map((c) => c.trim());
  const head = cells(rows[0]);
  const body = rows.slice(1).map(cells);
  return `
    <div class="overflow-x-auto my-4 rounded-lg border border-outline-variant">
      <table class="w-full text-left text-sm">
        <thead class="bg-surface-container-low text-secondary">
          <tr>${head.map((h) => `<th class="px-3 py-2 font-semibold whitespace-nowrap">${inline(h)}</th>`).join('')}</tr>
        </thead>
        <tbody class="divide-y divide-outline-variant/60">
          ${body.map((r) => `<tr>${r.map((c) => `<td class="px-3 py-2 align-top">${inline(c)}</td>`).join('')}</tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

function markdownToHtml(md) {
  const lines = md.replace(/\r/g, '').split('\n');
  const out = [];
  let i = 0;
  let inCode = false;
  let codeBuf = [];
  let codeLang = '';
  let listType = null;
  let para = [];

  const flushPara = () => {
    if (para.length) {
      // Các dòng liên tiếp trong cùng đoạn nối bằng khoảng trắng (chuẩn Markdown),
      // tránh cảnh mỗi dòng xuống một hàng như bản cũ.
      out.push(`<p class="my-3 leading-relaxed text-on-surface-variant">${para.map(inline).join(' ')}</p>`);
      para = [];
    }
  };
  const flushList = () => {
    if (listType) {
      out.push(`</${listType}>`);
      listType = null;
    }
  };

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim().startsWith('```')) {
      if (!inCode) {
        flushPara(); flushList();
        inCode = true;
        codeLang = line.trim().slice(3).trim();
        codeBuf = [];
      } else {
        inCode = false;
        out.push(`
          <div class="my-4 rounded-lg border border-outline-variant overflow-hidden">
            ${codeLang ? `<div class="px-3 py-1.5 bg-surface-container-low text-[11px] font-semibold uppercase tracking-wide text-secondary">${escapeHtml(codeLang)}</div>` : ''}
            <pre class="px-4 py-3 bg-surface-container-lowest overflow-x-auto text-[12.5px] leading-relaxed font-mono text-on-surface"><code>${escapeHtml(codeBuf.join('\n'))}</code></pre>
          </div>`);
      }
      i += 1;
      continue;
    }
    if (inCode) { codeBuf.push(line); i += 1; continue; }

    // Bảng: dòng hiện tại bắt đầu bằng | và dòng kế là hàng phân cách |---|
    if (line.trim().startsWith('|') && lines[i + 1] && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
      flushPara(); flushList();
      const rows = [line];
      i += 2;
      while (i < lines.length && lines[i].trim().startsWith('|')) { rows.push(lines[i]); i += 1; }
      out.push(renderTable(rows));
      continue;
    }

    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      flushPara(); flushList();
      const level = h[1].length;
      const text = h[2].trim();
      const id = slug(text);
      const cls = {
        1: 'mt-8 mb-4 text-2xl font-bold text-on-surface',
        2: 'mt-8 mb-3 text-xl font-bold text-on-surface border-b border-outline-variant pb-2',
        3: 'mt-6 mb-2 text-base font-semibold text-on-surface',
        4: 'mt-4 mb-2 text-sm font-semibold text-on-surface',
      }[level];
      out.push(`<h${level} id="${id}" class="${cls} scroll-mt-24">${inline(text)}</h${level}>`);
      i += 1;
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      flushPara();
      if (listType !== 'ul') { flushList(); out.push('<ul class="my-3 ml-5 list-disc space-y-1.5 text-on-surface-variant marker:text-primary">'); listType = 'ul'; }
      out.push(`<li>${inline(line.replace(/^\s*[-*]\s+/, ''))}</li>`);
      i += 1;
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      flushPara();
      if (listType !== 'ol') { flushList(); out.push('<ol class="my-3 ml-5 list-decimal space-y-1.5 text-on-surface-variant marker:font-semibold marker:text-primary">'); listType = 'ol'; }
      out.push(`<li>${inline(line.replace(/^\s*\d+\.\s+/, ''))}</li>`);
      i += 1;
      continue;
    }

    if (line.trim().startsWith('>')) {
      flushPara(); flushList();
      // Gộp các dòng `>` liên tiếp thành MỘT khối trích dẫn (trước đây mỗi dòng thành một hộp).
      const buf = [line.trim().replace(/^>\s?/, '')];
      i += 1;
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        buf.push(lines[i].trim().replace(/^>\s?/, ''));
        i += 1;
      }
      out.push(`<blockquote class="my-4 border-l-4 border-primary/40 bg-primary/5 px-4 py-3 rounded-r-lg text-sm leading-relaxed text-on-surface-variant">${buf.map(inline).join(' ')}</blockquote>`);
      continue;
    }

    if (/^\s*(---|\*\*\*)\s*$/.test(line)) {
      flushPara(); flushList();
      out.push('<hr class="my-6 border-outline-variant"/>');
      i += 1;
      continue;
    }

    if (line.trim() === '') { flushPara(); flushList(); i += 1; continue; }

    flushList();
    para.push(line.trim());
    i += 1;
  }
  flushPara(); flushList();
  return out.join('\n');
}

export default function DocsPage() {
  const { t, language } = useI18n();
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

  const html = useMemo(() => (md ? markdownToHtml(md) : ''), [md]);

  const toc = useMemo(() => {
    if (!md) return [];
    return md
      .split('\n')
      .filter((l) => /^##\s+/.test(l))
      .map((l) => {
        const text = l.replace(/^##\s+/, '').trim();
        return { id: slug(text), text };
      });
  }, [md]);

  // Mục con (###) cho rail phải — giúp lấp khoảng trống màn rộng và nhảy nhanh tới tiểu mục.
  const sections = useMemo(() => {
    if (!md) return [];
    const out = [];
    md.split('\n').forEach((l) => {
      const h2 = l.match(/^##\s+(.*)$/);
      const h3 = l.match(/^###\s+(.*)$/);
      if (h2) out.push({ id: slug(h2[1].trim()), text: h2[1].trim(), subs: [] });
      else if (h3 && out.length) out[out.length - 1].subs.push({ id: slug(h3[1].trim()), text: h3[1].trim() });
    });
    return out;
  }, [md]);

  const activeSection = useMemo(
    () => sections.find((s) => s.id === activeId) || sections[0] || null,
    [sections, activeId]
  );

  // Tô sáng mục lục theo vị trí cuộn: lấy mục cuối cùng có heading đã lướt qua.
  const handleScroll = () => {
    const root = scrollRef.current;
    if (!root || toc.length === 0) return;
    const rootTop = root.getBoundingClientRect().top;
    let current = toc[0].id;
    for (const item of toc) {
      const el = root.querySelector(`#${CSS.escape(item.id)}`);
      if (!el) continue;
      if (el.getBoundingClientRect().top - rootTop <= 120) current = item.id;
    }
    setActiveId((prev) => (prev === current ? prev : current));
  };

  // Cuộn mượt tới một mục: trang cuộn trong khung riêng nên không dùng jump mặc định của anchor.
  const goTo = (event, id) => {
    event.preventDefault();
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
            <span className="pointer-events-none absolute -right-8 -top-10 text-[150px] leading-none text-primary/10 select-none material-symbols-outlined">menu_book</span>
            <div className="relative flex flex-col gap-2">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">
                <span className="material-symbols-outlined text-[14px]">verified</span>
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
                    <span className="material-symbols-outlined text-[14px] text-primary">arrow_forward</span>
                    {item.text.replace(/^\d+\.\s*/, '')}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-secondary">
              <span className="material-symbols-outlined animate-spin text-[22px]">progress_activity</span>
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
                    <span className="material-symbols-outlined text-[14px] text-primary">list</span>
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
                  <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                  {t('Lên đầu trang')}
                </button>
              </div>

              {/* Rail phải (màn rất rộng): tiểu mục của mục đang đọc + mẹo nhanh, lấp khoảng trắng */}
              <aside className="hidden 2xl:block">
                <div className="sticky top-4 space-y-4">
                  {activeSection && activeSection.subs.length > 0 && (
                    <div className="rounded-xl border border-outline-variant bg-surface p-4 shadow-sm">
                      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-secondary">
                        <span className="material-symbols-outlined text-[14px] text-primary">format_list_numbered</span>
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
                      <span className="material-symbols-outlined text-[14px]">lightbulb</span>
                      {t('Mẹo nhanh')}
                    </div>
                    <ul className="space-y-2 text-[12.5px] leading-relaxed text-on-surface-variant">
                      <li className="flex gap-1.5">
                        <span className="material-symbols-outlined text-[14px] text-primary flex-shrink-0 mt-0.5">bolt</span>
                        {t('Mọi tin Telegram đều có link "Xem chi tiết" — bấm là mở đúng đơn, không phải đi tìm.')}
                      </li>
                      <li className="flex gap-1.5">
                        <span className="material-symbols-outlined text-[14px] text-primary flex-shrink-0 mt-0.5">route</span>
                        {t('Trước khi gửi đơn, mở "Xem chi tiết luồng" để chắc chắn đơn đi đúng người duyệt.')}
                      </li>
                      <li className="flex gap-1.5">
                        <span className="material-symbols-outlined text-[14px] text-primary flex-shrink-0 mt-0.5">filter_alt</span>
                        {t('Trên điện thoại, bấm hàng "Bộ lọc" để thu gọn khu lọc, dành chỗ cho dữ liệu.')}
                      </li>
                      <li className="flex gap-1.5">
                        <span className="material-symbols-outlined text-[14px] text-primary flex-shrink-0 mt-0.5">lock_reset</span>
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
