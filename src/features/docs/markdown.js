/**
 * DOCS-01: renderer Markdown tối giản cho trang HƯỚNG DẪN.
 *
 * Đủ heading / bold / italic / list / bảng / code block / link / ảnh / quote / hr nên không phải
 * thêm dependency mới. Tách khỏi DocsPage để test được phần sinh HTML — đây là chỗ duy nhất trong
 * dự án dùng dangerouslySetInnerHTML, nên nó phải có test khoá lại (xem markdown.test.jsx).
 */
// DOCS-05: escapeHtml phải escape CẢ dấu nháy, không chỉ < > &. Renderer chèn giá trị bắt được
// vào trong thuộc tính (`src="..."`, `href="..."`), nên một dấu `"` trong nội dung markdown đóng
// sớm thuộc tính và mở thuộc tính mới — markdown `![x"onerror="alert(1)](y)` sinh ra
// `<img src="y" alt="x"onerror="alert(1)">` và trình duyệt chạy alert(1).
export const escapeHtml = (s) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// DOCS-05: chặn URL có thể thực thi mã. Dấu nháy bị escape rồi nhưng `[x](javascript:confirm\`1\`)`
// vẫn hợp lệ vì payload không cần `)` — phải chặn theo scheme. `data:image/*` được giữ lại.
export const safeUrl = (url) => {
  const schemeStripped = String(url).replace(/[\s\u0000-\u001f]/g, ''); // oxlint-disable-line no-control-regex
  if (/^(?:javascript|vbscript|file):/i.test(schemeStripped)) return '';
  if (/^data:/i.test(schemeStripped) && !/^data:image\//i.test(schemeStripped)) return '';
  return url;
};

const inline = (s) =>
  escapeHtml(s)
    .replace(
      /!\[([^\]]*)\]\(([^)\s]+)\)/g,
      (_, alt, src) =>
        `<img src="${safeUrl(src)}" alt="${alt}" loading="lazy" class="my-4 w-full max-w-full rounded-xl border border-outline-variant bg-surface shadow-sm" />`,
    )
    .replace(/`([^`]+)`/g, '<code class="rounded bg-surface-container-high px-1 py-0.5 text-[12px] font-mono">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-on-surface">$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(
      /\[([^\]]+)\]\(([^)\s]+)\)/g,
      (_, text, href) =>
        `<a class="text-primary underline underline-offset-2" href="${safeUrl(href)}" target="_blank" rel="noreferrer">${text}</a>`,
    );

// DOCS-04: slug phải giữ chữ cái của MỌI ngôn ngữ (kể cả Hangul) — bản cũ chỉ giữ \w + dải
// tiếng Việt nên heading tiếng Hàn bị xoá sạch chữ, sinh id rỗng/trùng làm mục lục hỏng bấm.
export const slug = (text) =>
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

export function markdownToHtml(md) {
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
      /*
       * DOCS-06: dịch cấp heading lên 1 khi xuất ra HTML.
       *
       * Trang đã có <h1> riêng (PageHeader), mà file tài liệu lại bắt đầu bằng `#` — nếu giữ nguyên
       * cấp thì trang /docs có HAI thẻ <h1> cùng nội dung, sai cấu trúc heading (mỗi trang chỉ nên
       * có một h1 và không được nhảy cấp). Nay `#` -> h2, `##` -> h3, ...
       * Cấp dùng cho CLASS vẫn là cấp gốc nên giao diện không đổi; `id` cũng giữ nguyên nên mục lục
       * và các liên kết neo vẫn trỏ đúng.
       */
      const tag = Math.min(level + 1, 6);
      out.push(`<h${tag} id="${id}" class="${cls} scroll-mt-24">${inline(text)}</h${tag}>`);
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
