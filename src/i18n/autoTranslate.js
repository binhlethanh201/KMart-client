/**
 * BE-59: TỰ ĐỘNG DỊCH các nhãn CHƯA có trong bảng dịch tĩnh.
 *
 * Bảng dịch tĩnh (translations/en.js, ko.js) phủ mọi chuỗi viết trong code —
 * `npm run i18n:sync` tự sinh bản dịch cho chúng.
 *
 * Nhưng nhãn do NGƯỜI DÙNG nhập ở màn Cấu hình (tên trường động mới thêm, tên loại đơn,
 * tên phòng ban...) thì không thể có sẵn trong file. Module này xử lý phần đó:
 *   1. Gặp nhãn chưa có bản dịch -> gom lại rồi hỏi máy chủ (POST /api/translations/lookup).
 *   2. Máy chủ gọi dịch vụ dịch và cache lại, nên mỗi nhãn chỉ dịch MỘT LẦN cho toàn hệ thống.
 *   3. Kết quả được lưu ở localStorage để lần sau hiện ngay, không phải chờ.
 *   4. Khi bản dịch về, các component đang dùng useI18n() được vẽ lại.
 *
 * Nguyên tắc: chỉ nhãn nào ĐƯỢC GỌI QUA t('...') mới bị gửi đi dịch — tên người, mã đơn...
 * không nằm trong t() nên không bao giờ bị gửi.
 */

import { API_URL } from '../services/apiClient';

const STORAGE_PREFIX = 'kmart.i18n.auto.';
/**
 * BE-100: phiên bản bộ nhớ đệm bản dịch động trên trình duyệt.
 *
 * Bộ nhớ đệm cũ chỉ ghi thêm, không bao giờ hỏi lại, nên một bản dịch sai đã lỡ lưu sẽ
 * "sống" mãi trên máy người dùng dù máy chủ đã sửa (xem từ điển chuyên ngành ở BE).
 * Khi từ điển/bản dịch phía máy chủ thay đổi đáng kể thì TĂNG số này để mọi trình duyệt
 * tự bỏ bộ nhớ đệm cũ và lấy bản dịch đúng.
 */
const CACHE_VERSION = 2;
const FLUSH_DELAY_MS = 150;
const MAX_TEXT_LENGTH = 400;
const MAX_PENDING = 400;

/** lang -> Map(nhãn tiếng Việt -> bản dịch) */
const cache = new Map();
/** lang -> Set(nhãn) đang chờ gửi */
const queue = new Map();
/** `${lang}:${text}` đã gửi hoặc đang gửi (tránh gửi lặp) */
const requested = new Set();
/** `${lang}:${text}` -> số lần đã thử (chặn vòng lặp thử lại vô hạn khi dịch vụ lỗi) */
const attempts = new Map();
const MAX_ATTEMPTS = 2;
const listeners = new Set();
let flushTimer = null;

function getCache(lang) {
  let bucket = cache.get(lang);
  if (!bucket) {
    bucket = new Map();
    cache.set(lang, bucket);
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + lang + '.v' + CACHE_VERSION);
      if (raw) {
        const parsed = JSON.parse(raw);
        Object.entries(parsed).forEach(([key, value]) => {
          if (typeof value === 'string') bucket.set(key, value);
        });
      }
    } catch {
      /* chế độ riêng tư hoặc dữ liệu hỏng - bỏ qua */
    }
  }
  return bucket;
}

function persist(lang) {
  try {
    const bucket = getCache(lang);
    const obj = {};
    bucket.forEach((value, key) => { obj[key] = value; });
    localStorage.setItem(STORAGE_PREFIX + lang + '.v' + CACHE_VERSION, JSON.stringify(obj));
  } catch {
    /* hết dung lượng - vẫn dùng được trong phiên hiện tại */
  }
}

function notify() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* một listener lỗi không được làm hỏng những listener khác */
    }
  });
}

/** Bản dịch đã có sẵn (đồng bộ) - dùng ngay trong lúc render. */
export function getAutoTranslation(lang, text) {
  return getCache(lang).get(text);
}

/** Đăng ký nhận thông báo khi có bản dịch mới. */
export function subscribeAutoTranslate(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Xếp một nhãn vào hàng đợi dịch (chỉ gửi đi khi thật sự cần). */
export function requestAutoTranslation(lang, text) {
  if (lang !== 'en' && lang !== 'ko') return;
  if (!text || text.length > MAX_TEXT_LENGTH) return;

  const key = `${lang}:${text}`;
  if (requested.has(key) || getCache(lang).has(text)) return;
  if ((attempts.get(key) || 0) >= MAX_ATTEMPTS) return;

  // Chưa đăng nhập thì không gọi (tránh 401) — nhãn sẽ được dịch ở lần đăng nhập sau.
  try {
    if (!localStorage.getItem('kmart_token')) return;
  } catch {
    return;
  }

  attempts.set(key, (attempts.get(key) || 0) + 1);
  requested.add(key);
  if (requested.size > MAX_PENDING) return;

  if (!queue.has(lang)) queue.set(lang, new Set());
  queue.get(lang).add(text);

  if (flushTimer === null) {
    flushTimer = setTimeout(flush, FLUSH_DELAY_MS);
  }
}

async function flush() {
  flushTimer = null;
  const batches = [...queue.entries()].map(([lang, texts]) => [lang, [...texts]]);
  queue.clear();

  for (const [lang, texts] of batches) {
    if (!texts.length) continue;
    try {
      const response = await fetch(`${API_URL}/api/translations/lookup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('kmart_token') || ''}`,
        },
        body: JSON.stringify({ language: lang, texts }),
      });
      if (!response.ok) continue;

      const body = await response.json();
      const items = body?.items || {};
      const bucket = getCache(lang);
      let changed = false;
      Object.entries(items).forEach(([key, value]) => {
        if (typeof value === 'string' && !bucket.has(key)) {
          bucket.set(key, value);
          changed = true;
        }
      });

      if (changed) {
        persist(lang);
        notify();
      }

      // Nhãn KHÔNG dịch được (máy chủ không gọi được dịch vụ) phải được thử lại ở lần render sau —
      // kể cả khi những nhãn khác trong cùng lô đã dịch xong.
      texts.forEach((text) => {
        if (!Object.prototype.hasOwnProperty.call(items, text)) requested.delete(`${lang}:${text}`);
      });
    } catch {
      // Không có mạng: thử lại ở lần render sau.
      texts.forEach((text) => requested.delete(`${lang}:${text}`));
    }
  }
}
