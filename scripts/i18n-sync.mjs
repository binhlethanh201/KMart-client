#!/usr/bin/env node
/**
 * BE-58: TOOL TỰ DỊCH ĐA NGÔN NGỮ (Việt → Anh/Hàn)
 *
 * Vì sao cần: bảng dịch dùng KHOÁ = chuỗi tiếng Việt trong code. Trước đây mỗi lần thêm
 * chữ mới (nhãn, tiêu đề, thông báo...) đều phải tự tay bổ sung bản dịch vào en.js/ko.js,
 * quên là trang đó đứng im một ngôn ngữ.
 *
 * Tool này tự làm việc đó:
 *   1. Quét mọi lời gọi t('...') / translate('...') trong src/.
 *   2. So với en.js / ko.js, tìm khoá còn thiếu.
 *   3. Gọi dịch vụ dịch (Google Translate) sinh bản dịch, có che các placeholder {v0}.
 *   4. Ghi phần mới vào MỘT khối riêng ở cuối mỗi file từ điển (giữa hai mốc
 *      i18n:auto:start / i18n:auto:end) — KHÔNG bao giờ sửa bản dịch tay.
 *
 * Không mạng / dịch vụ lỗi => chỉ cảnh báo và bỏ qua (không làm gãy dev/build).
 *
 * Cách dùng:
 *   node scripts/i18n-sync.mjs            # tự dịch và ghi vào từ điển
 *   node scripts/i18n-sync.mjs --check    # chỉ báo cáo khoá thiếu (mã thoát 1 nếu còn thiếu)
 *   node scripts/i18n-sync.mjs --quiet    # im lặng trừ khi có thay đổi/lỗi (dùng cho predev/prebuild)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = path.join(ROOT, 'src');
const DICT_DIR = path.join(SRC_DIR, 'i18n', 'translations');

const AUTO_START = '// ── i18n:auto:start ── (do scripts/i18n-sync.mjs sinh ra, đừng sửa tay)';
const AUTO_END = '// ── i18n:auto:end ──';

const TARGETS = [
  { lang: 'en', file: path.join(DICT_DIR, 'en.js') },
  { lang: 'ko', file: path.join(DICT_DIR, 'ko.js') },
];

const args = new Set(process.argv.slice(2));
const CHECK_ONLY = args.has('--check');
const QUIET = args.has('--quiet');

const VI_DIACRITICS = /[ăâđêôơưàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]/i;
/** Khoá chỉ gồm số/ký hiệu thì không cần dịch (ví dụ "·", "%", "2026"). */
const NO_LETTERS = /^[^\p{L}]*$/u;
const MAX_LENGTH = 400;

const log = (...a) => {
  if (!QUIET) console.log(...a);
};

// ───────────────────────────── Đọc/ghi chuỗi JS ─────────────────────────────

const CALL_RE = /\b(?:t|translate)\(\s*(['"])((?:\\.|(?!\1)[^\\])*)\1/gs;
const ENTRY_RE = /^[ \t]*(?:'((?:\\.|[^'\\])*)'|"((?:\\.|[^"\\])*)")\s*:\s*(?:'((?:\\.|[^'\\])*)'|"((?:\\.|[^"\\])*)")\s*,?[ \t]*$/gm;

function unescapeJs(s) {
  return s.replace(/\\(u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|[\s\S])/g, (m, g) => {
    switch (g) {
      case 'n': return '\n';
      case 'r': return '\r';
      case 't': return '\t';
      case 'b': return '\b';
      case 'f': return '\f';
      case 'v': return '\v';
      case '0': return '\0';
      case "'": return "'";
      case '"': return '"';
      case '`': return '`';
      case '\\': return '\\';
      default:
        return g[0] === 'u' || g[0] === 'x' ? String.fromCharCode(parseInt(g.slice(1), 16)) : g;
    }
  });
}

function quoteJs(s) {
  return "'" + s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r/g, '\\r').replace(/\n/g, '\\n') + "'";
}

/** Các cặp khoá/giá trị trong một đoạn văn bản từ điển. */
function parseEntries(text) {
  const entries = [];
  for (const m of text.matchAll(ENTRY_RE)) {
    entries.push({ key: unescapeJs(m[1] ?? m[2]), value: unescapeJs(m[3] ?? m[4]) });
  }
  return entries;
}

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (name === 'node_modules' || name === 'dist') continue;
      walk(full, out);
    } else if (/\.(jsx?|tsx?)$/.test(name)) {
      out.push(full);
    }
  }
  return out;
}

/** Tìm mọi khoá t('...') trong source, kèm file xuất hiện. */
function collectSourceKeys() {
  const keys = new Map();
  for (const file of walk(SRC_DIR)) {
    if (file.startsWith(DICT_DIR)) continue;
    const text = fs.readFileSync(file, 'utf8');
    for (const m of text.matchAll(CALL_RE)) {
      const key = unescapeJs(m[2]);
      if (!key.trim()) continue;
      if (!keys.has(key)) keys.set(key, new Set());
      keys.get(key).add(path.relative(ROOT, file));
    }
  }
  return keys;
}

// ───────────────────────────── Dịch qua Google ─────────────────────────────

const PH_RE = /\{\s*\w+\s*\}/g;

function maskPlaceholders(text) {
  const saved = [];
  const masked = text.replace(PH_RE, (m) => {
    saved.push(m);
    return `__PH${saved.length - 1}__`;
  });
  return { masked, saved };
}

function restorePlaceholders(text, saved) {
  return text.replace(/__PH\s?(\d+)\s?__/g, (m, i) => saved[Number(i)] ?? m);
}

async function translateOnce(text, lang) {
  const { masked, saved } = maskPlaceholders(text);
  const url = 'https://translate.googleapis.com/translate_a/single?client=gtx'
    + `&sl=vi&tl=${lang}&dt=t&q=${encodeURIComponent(masked)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const raw = (data?.[0] || []).map((part) => part?.[0] || '').join('');
  if (!raw.trim()) throw new Error('bản dịch rỗng');
  const out = restorePlaceholders(raw, saved);
  const missing = saved.filter((ph) => !out.includes(ph));
  if (missing.length) throw new Error(`mất placeholder ${missing.join(', ')}`);
  return out.trim();
}

/** Dịch một chuỗi, thử lại vài lần; trả null nếu không dịch được. */
async function translateText(text, lang) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const out = await translateOnce(text, lang);
      // Dịch vụ đôi khi trả nguyên văn; nếu câu gốc có dấu tiếng Việt thì coi như lỗi.
      if (out === text && VI_DIACRITICS.test(text)) throw new Error('trả nguyên văn');
      return out;
    } catch (err) {
      if (attempt === 3) {
        log(`    ! không dịch được: "${text.slice(0, 60)}" (${err.message})`);
        return null;
      }
      await new Promise((r) => setTimeout(r, 400 * attempt));
    }
  }
  return null;
}

/** Dịch song song có giới hạn để không dồn dập vào dịch vụ ngoài. */
async function translateAll(texts, lang, concurrency = 4) {
  const results = new Map();
  const queue = [...texts];
  const workers = Array.from({ length: Math.min(concurrency, Math.max(queue.length, 1)) }, async () => {
    while (queue.length) {
      const text = queue.shift();
      const out = await translateText(text, lang);
      if (out != null) results.set(text, out);
    }
  });
  await Promise.all(workers);
  return results;
}

// ───────────────────────────── Ghi vào từ điển ─────────────────────────────

/** Đọc file từ điển: tách phần viết tay và khối tự động. */
function readDictionary({ file }) {
  const text = fs.readFileSync(file, 'utf8');
  const startIdx = text.indexOf(AUTO_START);
  const endIdx = text.indexOf(AUTO_END);
  let manualText = text;
  let autoEntries = [];
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    autoEntries = parseEntries(text.slice(startIdx, endIdx));
    manualText = text.slice(0, startIdx) + text.slice(endIdx + AUTO_END.length);
  }
  const manualEntries = parseEntries(manualText);
  if (!manualEntries.length && !autoEntries.length) {
    throw new Error(`Không đọc được từ điển ${path.relative(ROOT, file)}`);
  }
  return { text, manualText, manualEntries, autoEntries };
}

function writeDictionary({ file }, manualText, entries) {
  let body = manualText.replace(/\s+$/, '');
  if (!body.endsWith('};')) throw new Error(`Cấu trúc file lạ: ${path.relative(ROOT, file)}`);
  body = body.slice(0, -2).replace(/\s+$/, '');
  const out = entries.length
    ? `${body}\n\n  ${AUTO_START}\n${entries.map((e) => `  ${quoteJs(e.key)}: ${quoteJs(e.value)},`).join('\n')}\n  ${AUTO_END}\n};\n`
    : `${body}\n};\n`;
  fs.writeFileSync(file, out, 'utf8');
}

// ───────────────────────────── Luồng chính ─────────────────────────────

async function main() {
  const sourceKeys = collectSourceKeys();
  log(`Quét ${sourceKeys.size} khoá t('...') trong src/.`);

  const dicts = TARGETS.map((t) => ({ ...t, ...readDictionary(t) }));
  const missingPerLang = new Map();
  for (const dict of dicts) {
    const known = new Set([...dict.manualEntries, ...dict.autoEntries].map((e) => e.key));
    const missing = [...sourceKeys.keys()].filter(
      (k) => !known.has(k) && k.length <= MAX_LENGTH && !NO_LETTERS.test(k)
    );
    missingPerLang.set(dict.lang, missing);
  }

  const totalMissing = [...missingPerLang.values()].reduce((n, m) => n + m.length, 0);
  log(`Thiếu bản dịch: ${TARGETS.map((t) => `${t.lang}=${missingPerLang.get(t.lang).length}`).join('  ')}`);

  if (CHECK_ONLY) {
    if (!totalMissing) {
      log('Từ điển đã đủ — không cần làm gì.');
      return 0;
    }
    for (const dict of dicts) {
      const missing = missingPerLang.get(dict.lang);
      if (!missing.length) continue;
      console.error(`\n[${dict.lang}] còn thiếu ${missing.length} khoá:`);
      for (const key of missing) {
        const where = [...(sourceKeys.get(key) || [])][0] || '?';
        console.error(`  - ${key}   (${where})`);
      }
    }
    console.error('\nChạy: npm run i18n:sync   để tự dịch và bổ sung.');
    return 1;
  }

  let failed = 0;
  let changed = 0;
  for (const dict of dicts) {
    const missing = missingPerLang.get(dict.lang);
    const manualKeys = new Set(dict.manualEntries.map((e) => e.key));
    // Khoá đã có bản dịch tay thì phải rút khỏi khối tự động (trùng khoá trong object
    // literal thì bản sau thắng, nên để lại là bản tự động đè mất bản chỉnh tay).
    const duplicates = dict.autoEntries.filter((e) => manualKeys.has(e.key));

    if (!missing.length && !duplicates.length) continue;

    let translated = new Map();
    if (missing.length) {
      log(`\n[${dict.lang}] đang dịch ${missing.length} khoá...`);
      translated = await translateAll(missing, dict.lang);
      failed += missing.length - translated.size;
    }

    const merged = new Map();
    // Bản dịch viết tay luôn thắng; bản tự động cũ được giữ lại để không phải dịch lại.
    for (const entry of dict.autoEntries) {
      if (!manualKeys.has(entry.key)) merged.set(entry.key, entry.value);
    }
    for (const [key, value] of translated) merged.set(key, value);

    const entries = [...merged.entries()]
      .map(([key, value]) => ({ key, value }))
      .sort((a, b) => a.key.localeCompare(b.key, 'vi'));

    writeDictionary(dict, dict.manualText, entries);
    changed += translated.size + duplicates.length;
    log(`[${dict.lang}] khối tự động: ${dict.autoEntries.length} → ${entries.length}`
      + ` (thêm ${translated.size}, bỏ ${duplicates.length} khoá đã có bản chỉnh tay).`);
  }

  if (failed) {
    console.error(`\nCòn ${failed} chuỗi chưa dịch được (mạng/dịch vụ lỗi). Chạy lại sau, hoặc tự thêm tay.`);
    return QUIET ? 0 : 1;
  }
  log(changed ? '\nXong: bảng dịch đã đầy đủ 3 ngôn ngữ.' : '\nTừ điển đã đủ — không cần làm gì.');
  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    // Không được làm gãy dev/build chỉ vì lỗi dịch thuật.
    console.error(`[i18n-sync] bỏ qua do lỗi: ${err.message}`);
    process.exit(QUIET ? 0 : 1);
  });
