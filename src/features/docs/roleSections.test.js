import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { filterSectionsByRole, VISIBILITY, SEEN_BY_RE } from './roleSections';

/**
 * DOCS-07: tài liệu chia theo vai trò. Sai ở đây thì nhân viên đọc được cả phần cấu hình
 * hệ thống (hoặc ngược lại, mất phần mình cần) — nên khoá lại bằng test.
 */
describe('filterSectionsByRole', () => {
  const sample = [
    '# Tài liệu',
    '',
    '## Dùng chung',
    '<!-- seen-by: all -->',
    'Nội dung chung.',
    '',
    '## Riêng người duyệt',
    '<!-- seen-by: approver -->',
    'Nội dung duyệt.',
    '',
    '## Riêng kế toán',
    '<!-- seen-by: hr-admin -->',
    'Nội dung kế toán.',
  ].join('\n');

  const filter = (md, allowed) => filterSectionsByRole(md, (label) => allowed.includes(label));

  it('giữ mục dùng chung và mục được phép, bỏ mục còn lại', () => {
    const out = filter(sample, ['all']);
    expect(out).toContain('Nội dung chung.');
    expect(out).not.toContain('Nội dung duyệt.');
    expect(out).not.toContain('Nội dung kế toán.');
  });

  it('bỏ dòng đánh dấu khỏi nội dung render', () => {
    expect(filter(sample, ['all', 'approver', 'hr-admin'])).not.toContain('seen-by');
    expect(filter(sample, ['all'])).not.toContain('seen-by');
  });

  it('giữ tiêu đề tài liệu và phần mở đầu trước mục cấp 2', () => {
    const out = filter(sample, []);
    expect(out).toContain('# Tài liệu');
  });

  it('tiêu đề của mục bị ẩn cũng bị bỏ', () => {
    const out = filter(sample, ['all']);
    expect(out).toContain('## Dùng chung');
    expect(out).not.toContain('## Riêng người duyệt');
    expect(out).not.toContain('## Riêng kế toán');
  });

  it('mục không có đánh dấu được coi là dùng chung', () => {
    const md = ['## Có đánh dấu', '<!-- seen-by: approver -->', 'Ẩn.', '', '## Không đánh dấu', 'Hiện.'].join('\n');
    const out = filter(md, []);
    expect(out).not.toContain('Ẩn.');
    expect(out).toContain('Hiện.');
  });

  it('nhãn lạ thì hiện (không âm thầm giấu tài liệu)', () => {
    const md = ['## Mục', '<!-- seen-by: khong-ton-tai -->', 'Vẫn hiện.'].join('\n');
    // Đúng cách DocsPage nối dây: nhãn không có trong VISIBILITY thì coi như dùng chung.
    const out = filterSectionsByRole(md, (label) => (VISIBILITY[label] ? VISIBILITY[label]({ role: 'STAFF' }, () => false) : true));
    expect(out).toContain('Vẫn hiện.');
  });

  it('nhãn hợp lệ nằm trong danh sách cho phép', () => {
    for (const label of ['all', 'approver', 'hr-admin']) expect(SEEN_BY_RE.test(`<!-- seen-by: ${label} -->`)).toBe(true);
    expect(SEEN_BY_RE.test('<!-- seen-by: Approver -->')).toBe(false);
  });
});

describe('tài liệu thật HUONG-DAN.md theo vai trò', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const md = readFileSync(resolve(here, '../../../public/docs/HUONG-DAN.md'), 'utf8');
  const headings = (text) => text.split('\n').filter((l) => l.startsWith('## '));

  const asRole = (currentUser) => filterSectionsByRole(md, (label) => {
    const rule = VISIBILITY[label];
    return rule ? rule(currentUser, () => false) : true;
  });

  it('nhân viên thấy mục đơn từ và Telegram nhưng không thấy mục 3 / 4 / 5', () => {
    const hs = headings(asRole({ role: 'STAFF' }));
    expect(hs.some((h) => h.includes('NHÂN VIÊN'))).toBe(true);
    expect(hs.some((h) => h.includes('Telegram'))).toBe(true);
    expect(hs.some((h) => h.includes('NGƯỜI DUYỆT'))).toBe(false);
    expect(hs.some((h) => h.includes('NHÂN SỰ'))).toBe(false);
    expect(hs.some((h) => h.includes('QUẢN TRỊ'))).toBe(false);
  });

  it('quản lý thấy thêm mục 3 nhưng vẫn không thấy mục cấu hình', () => {
    const hs = headings(asRole({ role: 'MANAGER' }));
    expect(hs.some((h) => h.includes('NGƯỜI DUYỆT'))).toBe(true);
    expect(hs.some((h) => h.includes('NHÂN SỰ'))).toBe(false);
    expect(hs.some((h) => h.includes('QUẢN TRỊ'))).toBe(false);
  });

  it('HR thấy đủ mục 3, 4, 5', () => {
    const hs = headings(asRole({ role: 'HR' }));
    expect(hs.some((h) => h.includes('NGƯỜI DUYỆT'))).toBe(true);
    expect(hs.some((h) => h.includes('NHÂN SỰ'))).toBe(true);
    expect(hs.some((h) => h.includes('QUẢN TRỊ'))).toBe(true);
  });

  it('quản trị viên thấy tất cả các mục', () => {
    expect(headings(asRole({ role: 'ADMIN' }))).toHaveLength(headings(md).length);
  });

  it('mọi mục cấp 2 đều có đánh dấu và nhãn đều hợp lệ', () => {
    const labels = md.split('\n').filter((l) => SEEN_BY_RE.test(l)).map((l) => l.match(SEEN_BY_RE)[1]);
    expect(labels).toHaveLength(headings(md).length);
    for (const l of labels) expect(Object.keys(VISIBILITY)).toContain(l);
  });
});

describe('ba bản ngôn ngữ của tài liệu', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const docsDir = resolve(here, '../../../public/docs');
  const publicDir = resolve(here, '../../../public');
  const files = ['HUONG-DAN.md', 'HUONG-DAN.en.md', 'HUONG-DAN.ko.md'];

  it.each(files)('%s: mỗi mục cấp 2 có đúng một đánh dấu hợp lệ', (name) => {
    const md = readFileSync(resolve(docsDir, name), 'utf8');
    const h2 = md.split('\n').filter((l) => l.startsWith('## '));
    const labels = md.split('\n').filter((l) => SEEN_BY_RE.test(l)).map((l) => l.match(SEEN_BY_RE)[1]);
    expect(labels).toHaveLength(h2.length);
    for (const l of labels) expect(Object.keys(VISIBILITY)).toContain(l);
  });

  it.each(files)('%s: mọi ảnh minh hoạ đều tồn tại', (name) => {
    const md = readFileSync(resolve(docsDir, name), 'utf8');
    const refs = [...md.matchAll(/!\[[^\]]*\]\((\/docs\/img\/[^)]+)\)/g)].map((m) => m[1]);
    expect(refs.length).toBeGreaterThan(20);
    for (const ref of refs) expect(existsSync(resolve(publicDir, `.${ref}`)), ref).toBe(true);
  });

  it('bản en/ko dùng đúng thư mục ảnh của mình', () => {
    for (const [name, dir] of [['HUONG-DAN.en.md', 'en'], ['HUONG-DAN.ko.md', 'ko']]) {
      const md = readFileSync(resolve(docsDir, name), 'utf8');
      for (const m of md.matchAll(/!\[[^\]]*\]\((\/docs\/img\/[^)]+)\)/g)) {
        expect(m[1]).toContain(`/docs/img/${dir}/`);
      }
    }
  });
});
