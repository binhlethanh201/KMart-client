#!/usr/bin/env node
/**
 * BE-140: TÌM & XOÁ KHOÁ TRÙNG trong file từ điển (en.js / ko.js).
 *
 * Vì sao: trong JS, key trùng thì cái SAU ghi đè cái TRƯỚC — bản dịch đứng trước trở thành
 * code chết và hành vi dịch phụ thuộc thứ tự dòng, rất dễ "đổi nghĩa" ngoài ý muốn.
 * (eslint `no-dupe-keys` phát hiện 72 chỗ.)
 *
 * Cách dùng:
 *   node scripts/fix-dupe-keys.mjs           # báo cáo (dry-run), không sửa
 *   node scripts/fix-dupe-keys.mjs --apply   # xoá các dòng trùng AN TOÀN
 *
 * Quy tắc an toàn:
 *   - Trùng y hệt giá trị  -> xoá dòng xuất hiện SAU (không đổi hành vi).
 *   - Trùng KHÁC giá trị   -> giữ dòng xuất hiện SAU (đó mới là bản đang thực sự hiển thị,
 *     vì JS lấy giá trị của key sau) và xoá dòng TRƯỚC đó — nhờ vậy loại bỏ code chết mà
 *     KHÔNG làm đổi bất kỳ nhãn nào trên giao diện. Mọi trường hợp này đều được in ra
 *     để rà lại nếu muốn chọn bản dịch khác.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const APPLY = process.argv.includes('--apply');
const FILES = ['src/i18n/translations/en.js', 'src/i18n/translations/ko.js'];

/** Bắt 1 dòng định nghĩa: <chỉ số dòng>|<key>|<raw value> */
const ENTRY_RE = /^[ \t]*(?:'((?:\\.|[^'\\])*)'|"((?:\\.|[^"\\])*)")\s*:\s*(.+?),?\s*$/;

function parseLine(line) {
  if (!line.trim().startsWith("'") && !line.trim().startsWith('"')) return null;
  const m = ENTRY_RE.exec(line);
  if (!m) return null;
  const key = m[1] !== undefined ? m[1] : m[2];
  return { key, raw: m[3] };
}

let totalRemoved = 0;
let totalConflicts = 0;

for (const rel of FILES) {
  const file = path.join(ROOT, rel);
  const text = fs.readFileSync(file, 'utf8');
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const lines = text.split(/\r?\n/);

  /** key -> [{ index, raw }] */
  const seen = new Map();
  const dropIndexes = new Set();
  const conflicts = [];

  lines.forEach((line, index) => {
    const entry = parseLine(line);
    if (!entry) return;
    if (!seen.has(entry.key)) {
      seen.set(entry.key, { index, raw: entry.raw });
      return;
    }
    const first = seen.get(entry.key);
    if (first.raw === entry.raw) {
      dropIndexes.add(index); // trùng y hệt -> xoá dòng sau
    } else {
      // Khác giá trị: dòng SAU mới là bản đang hiển thị (JS lấy key sau) -> xoá dòng TRƯỚC
      // để không làm đổi nhãn nào, chỉ bỏ code chết.
      conflicts.push({ key: entry.key, firstLine: first.index + 1, firstValue: first.raw, dupLine: index + 1, dupValue: entry.raw });
      dropIndexes.add(first.index);
      seen.set(entry.key, { index, raw: entry.raw });
    }
  });

  const kept = lines.filter((_, index) => !dropIndexes.has(index));

  console.log('');
  console.log(`=== ${rel} ===`);
  console.log(`  dòng: ${lines.length} -> ${kept.length}  (xoá ${dropIndexes.size} dòng trùng y hệt)`);
  if (conflicts.length > 0) {
    console.log(`  ĐÃ CHỌN bản hiển thị (giữ dòng sau, xoá dòng trước) cho ${conflicts.length} khoá khác giá trị:`);
    for (const c of conflicts.slice(0, 20)) {
      console.log(`    • "${c.key}"`);
      console.log(`        bỏ  dòng ${c.firstLine}: ${c.firstValue}`);
      console.log(`        giữ dòng ${c.dupLine}: ${c.dupValue}`);
    }
    if (conflicts.length > 20) console.log(`    ... và ${conflicts.length - 20} khoá nữa`);
  }

  totalRemoved += dropIndexes.size;
  totalConflicts += conflicts.length;

  if (APPLY && dropIndexes.size > 0) {
    fs.writeFileSync(file, kept.join(eol), 'utf8');
    console.log('  -> ĐÃ GHI FILE');
  }
}

console.log('');
console.log(`TỔNG: xoá ${totalRemoved} dòng trùng (giữ nguyên mọi nhãn đang hiển thị), đã chọn bản hiển thị cho ${totalConflicts} khoá khác giá trị.`);
if (!APPLY && totalRemoved > 0) console.log('Chạy lại với --apply để ghi thay đổi.');
