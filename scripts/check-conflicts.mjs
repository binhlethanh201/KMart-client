#!/usr/bin/env node
/**
 * BE-139: CHẶN commit/build khi còn dấu merge conflict.
 *
 * Vì sao cần: một commit trước đây đã lọt lên với nguyên dấu `<<<<<<< HEAD` trong 3 file,
 * làm `npm run build` thất bại hoàn toàn (swc báo "Merge conflict marker encountered")
 * nhưng chỉ phát hiện được khi mở trang. Script này quét sớm để báo ngay.
 *
 * Cách dùng:
 *   node scripts/check-conflicts.mjs           # quét và báo lỗi nếu có
 *   node scripts/check-conflicts.mjs --quiet   # chỉ in khi có lỗi (dùng cho prebuild/precommit)
 *
 * Mã thoát: 0 = sạch, 1 = có dấu conflict.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const QUIET = process.argv.includes('--quiet');

/** Thư mục cần quét (bỏ qua thư mục sinh tự động). */
const SCAN_DIRS = ['src', 'scripts', 'public'];
const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', '.git', 'coverage']);
const EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.css', '.scss', '.json', '.html']);

/** Dấu đánh dấu xung đột ở ĐẦU dòng (đúng như git sinh ra). */
const MARKERS = [
  { re: /^<{7}(?: |$)/, label: '<<<<<<< (bắt đầu xung đột)' },
  { re: /^={7}$/, label: '======= (phân cách)' },
  { re: /^>{7}(?: |$)/, label: '>>>>>>> (kết thúc xung đột)' },
  { re: /^\|{7}(?: |$)/, label: '||||||| (bản gốc)' },
];

const hits = [];

function scanDir(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(full);
      continue;
    }
    if (!EXTENSIONS.has(path.extname(entry.name))) continue;

    let content;
    try {
      content = fs.readFileSync(full, 'utf8');
    } catch {
      continue;
    }
    // Quét nhanh: chỉ tách dòng khi thật sự có ký tự nghi vấn.
    if (!/^[<>=|]{7}/m.test(content)) continue;

    content.split(/\r?\n/).forEach((line, index) => {
      for (const marker of MARKERS) {
        if (marker.re.test(line)) {
          hits.push({ file: path.relative(ROOT, full), line: index + 1, label: marker.label, text: line.trim().slice(0, 80) });
          break;
        }
      }
    });
  }
}

for (const dir of SCAN_DIRS) scanDir(path.join(ROOT, dir));

if (hits.length === 0) {
  if (!QUIET) console.log('✓ Không có dấu merge conflict trong mã nguồn.');
  process.exit(0);
}

console.error('');
console.error('✗ Phát hiện DẤU MERGE CONFLICT còn sót — build sẽ thất bại nếu không xử lý:');
console.error('');
for (const hit of hits) {
  console.error(`  ${hit.file}:${hit.line}  ${hit.label}`);
  console.error(`      ${hit.text}`);
}
console.error('');
console.error(`Tổng: ${hits.length} dòng ở ${new Set(hits.map((h) => h.file)).size} file.`);
console.error('Hãy mở từng file, gộp nội dung hai nhánh rồi xoá các dòng <<<<<<<, =======, >>>>>>>.');
console.error('');
process.exit(1);
