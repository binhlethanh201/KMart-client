import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { markdownToHtml } from './markdown';

/**
 * DOCS-05: renderer markdown chèn nội dung vào chuỗi HTML rồi đưa qua dangerouslySetInnerHTML.
 * Trước đây escapeHtml chỉ escape < > & (không escape dấu nháy), nên markdown
 * `![x"onerror="alert(1)](y)` sinh thẻ <img> có thêm thuộc tính onerror và trình duyệt chạy nó.
 *
 * Test kiểm trên DOM thật (jsdom) thay vì so khớp chuỗi: điều nguy hiểm là sự tồn tại của một
 * thuộc tính `on*`, còn chuỗi "onerror" nằm trong giá trị alt đã escape thì vô hại.
 */
const mount = (md) => render(<div dangerouslySetInnerHTML={{ __html: markdownToHtml(md) }} />);

/** Mọi thuộc tính bắt sự kiện đang có trong DOM — phải luôn rỗng. */
const handlerAttrs = (container) =>
  [...container.querySelectorAll('*')].flatMap((el) =>
    [...el.attributes].filter((a) => /^on/i.test(a.name)).map((a) => `${el.tagName}[${a.name}]`),
  );

describe('markdownToHtml — an toàn trước nội dung markdown', () => {
  it('escape dấu nháy nên không chèn được thuộc tính qua alt của ảnh', () => {
    const { container } = mount('![x"onerror="alert(1)](y)');

    expect(handlerAttrs(container)).toEqual([]);
    expect(container.querySelector('img')?.getAttribute('alt')).toBe('x"onerror="alert(1)');
  });

  it('escape dấu nháy nên không chèn được thuộc tính qua href của liên kết', () => {
    const { container } = mount('[x](a"onmouseover="alert(1))');

    expect(handlerAttrs(container)).toEqual([]);
  });

  it('escape thẻ HTML thô trong đoạn văn', () => {
    const { container } = mount('<img src=x onerror=alert(1)>');

    expect(handlerAttrs(container)).toEqual([]);
    expect(container.querySelector('img')).toBeNull();
  });

  it('chặn href javascript: (không phân biệt hoa thường)', () => {
    expect(mount('[x](javascript:alert%281%29)').container.querySelector('a')?.getAttribute('href')).toBe('');
    expect(mount('[x](JaVaScRiPt:alert%281%29)').container.querySelector('a')?.getAttribute('href')).toBe('');
  });

  it('chặn data: không phải ảnh nhưng vẫn cho data:image', () => {
    expect(mount('[x](data:text/html,%3Cb%3E)').container.querySelector('a')?.getAttribute('href')).toBe('');
    expect(
      mount('![ok](data:image/png;base64,AAA)').container.querySelector('img')?.getAttribute('src'),
    ).toBe('data:image/png;base64,AAA');
  });

  it('vẫn render bình thường với liên kết hợp lệ và mở tab mới an toàn', () => {
    const a = mount('[tài liệu](https://example.com)').container.querySelector('a');

    expect(a?.getAttribute('href')).toBe('https://example.com');
    expect(a?.getAttribute('rel')).toBe('noreferrer');
  });

  it('escape nội dung trong code block', () => {
    const { container } = mount('```\n<script>bad()</script>\n```');

    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('code')?.textContent).toContain('<script>bad()</script>');
  });
});

describe('markdownToHtml — cấu trúc', () => {
  it('dịch cấp heading lên 1 để không đụng <h1> của trang (DOCS-06)', () => {
    // Trang đã có <h1> riêng (PageHeader). Nếu tài liệu cũng sinh <h1> thì trang có 2 h1 cùng nội
    // dung, sai cấu trúc heading. Nay `#` -> h2, `##` -> h3, `###` -> h4.
    const { container } = mount('# Tiêu đề tài liệu\n\n## Mục lớn\n\n### Mục nhỏ\n\n#### Mục nhỏ hơn');
    expect(container.querySelector('h1')).toBeNull();
    expect(container.querySelector('h2')?.textContent).toBe('Tiêu đề tài liệu');
    expect(container.querySelector('h3')?.textContent).toBe('Mục lớn');
    expect(container.querySelector('h4')?.textContent).toBe('Mục nhỏ');
    expect(container.querySelector('h5')?.textContent).toBe('Mục nhỏ hơn');
  });

  it('sinh heading có id để mục lục bấm được, kể cả tiếng Hàn', () => {
    expect(mount('## 안녕 하세요').container.querySelector('h3')?.id).toBe('안녕-하세요');
  });

  it('gộp các dòng liên tiếp thành một đoạn văn', () => {
    expect(mount('dòng một\ndòng hai').container.querySelectorAll('p')).toHaveLength(1);
  });

  it('render bảng markdown', () => {
    const { container } = mount('| a | b |\n| --- | --- |\n| 1 | 2 |');

    expect(container.querySelector('table')).not.toBeNull();
    expect(container.querySelectorAll('th')).toHaveLength(2);
  });

  it('render danh sách có thứ tự và không thứ tự', () => {
    expect(mount('- một\n- hai').container.querySelectorAll('ul li')).toHaveLength(2);
    expect(mount('1. một\n2. hai').container.querySelectorAll('ol li')).toHaveLength(2);
  });
});
