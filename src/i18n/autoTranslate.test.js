import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isUntranslatable } from './I18nProvider';
import { HANGUL_RE } from './autoTranslate';

// Nạp lại module cho mỗi test vì autoTranslate giữ trạng thái (queue/requested/cache) ở cấp module.
const loadAutoTranslate = async () => {
  vi.resetModules();
  return import('./autoTranslate');
};

/** fetch giả: trả về `items` rỗng trừ khi được cấu hình riêng. */
const mockFetch = (handler) => {
  const fn = vi.fn(async (url, options) => handler(url, options));
  vi.stubGlobal('fetch', fn);
  return fn;
};

const okResponse = (items) => ({
  ok: true,
  json: async () => ({ items }),
});

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  localStorage.setItem('kmart_token', 'token-gia');
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('HANGUL_RE', () => {
  it('phát hiện chữ Hàn, bỏ qua tiếng Việt/Latin', () => {
    expect(HANGUL_RE.test('안녕하세요')).toBe(true);
    expect(HANGUL_RE.test('Xin chào')).toBe(false);
  });
});

describe('requestAutoTranslation — cổng ngôn ngữ', () => {
  it("lang 'vi' chỉ được gửi đi khi nội dung chứa chữ Hàn", async () => {
    const fetchMock = mockFetch(() => okResponse({}));
    const { requestAutoTranslation } = await loadAutoTranslate();

    requestAutoTranslation('vi', 'Xin chào mọi người');
    await vi.advanceTimersByTimeAsync(200);
    expect(fetchMock).not.toHaveBeenCalled();

    requestAutoTranslation('vi', '안녕하세요 mọi người');
    await vi.advanceTimersByTimeAsync(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toEqual({ language: 'vi', texts: ['안녕하세요 mọi người'] });
  });

  it("lang khác (ngoài vi/en/ko) không bao giờ được gửi đi", async () => {
    const fetchMock = mockFetch(() => okResponse({}));
    const { requestAutoTranslation } = await loadAutoTranslate();

    requestAutoTranslation('fr', 'Bonjour tout le monde');
    await vi.advanceTimersByTimeAsync(200);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('văn bản dài hơn 2000 ký tự bị bỏ qua', async () => {
    const fetchMock = mockFetch(() => okResponse({}));
    const { requestAutoTranslation } = await loadAutoTranslate();

    requestAutoTranslation('ko', 'a'.repeat(2001));
    await vi.advanceTimersByTimeAsync(200);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('flush — chia lô tối đa 150 nhãn/request', () => {
  it('250 nhãn ko được tách thành 2 request 150 + 100', async () => {
    const fetchMock = mockFetch(() => okResponse({}));
    const { requestAutoTranslation } = await loadAutoTranslate();

    const texts = Array.from({ length: 250 }, (_, i) => `nhãn số ${i}`);
    texts.forEach((text) => requestAutoTranslation('ko', text));
    await vi.advanceTimersByTimeAsync(200);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const sizes = fetchMock.mock.calls.map(([, options]) => JSON.parse(options.body).texts.length);
    expect(sizes).toEqual([150, 100]);
    sizes.forEach((size) => expect(size).toBeLessThanOrEqual(150));
  });

  it('lô bị lỗi (không ok) được gỡ khỏi requested để thử lại, lô khác không ảnh hưởng', async () => {
    // Request 1 lỗi, request 2 thành công.
    const fetchMock = mockFetch((url, options) => {
      const { texts } = JSON.parse(options.body);
      return okResponse(texts.includes('nhãn lô hai') ? { 'nhãn lô hai': 'chunk two' } : null);
    });
    fetchMock.mockRejectedValueOnce(new Error('server lỗi'));

    const texts = Array.from({ length: 150 }, (_, i) => `lô một nhãn ${i}`);
    texts.push('nhãn lô hai');
    const { requestAutoTranslation, getAutoTranslation } = await loadAutoTranslate();
    texts.forEach((text) => requestAutoTranslation('ko', text));
    await vi.advanceTimersByTimeAsync(200);

    // 151 nhãn -> lô 1 (150 nhãn "lô một") bị reject, lô 2 (1 nhãn) thành công.
    expect(getAutoTranslation('ko', 'nhãn lô hai')).toBe('chunk two');

    // Nhãn của lô lỗi được phép gửi lại ở lần sau.
    fetchMock.mockClear();
    requestAutoTranslation('ko', 'lô một nhãn 0');
    await vi.advanceTimersByTimeAsync(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).texts).toEqual(['lô một nhãn 0']);
  });
});

describe('isUntranslatable', () => {
  it('bỏ qua rỗng/quá ngắn/chỉ số và ký hiệu', () => {
    expect(isUntranslatable(null)).toBe(true);
    expect(isUntranslatable('')).toBe(true);
    expect(isUntranslatable('   ')).toBe(true);
    expect(isUntranslatable('a')).toBe(true);
    expect(isUntranslatable('2026')).toBe(true);
    expect(isUntranslatable('%-#12')).toBe(true);
  });

  it('bỏ qua ngày/giờ', () => {
    expect(isUntranslatable('2026-11-10')).toBe(true);
    expect(isUntranslatable('10/11/2026')).toBe(true);
    expect(isUntranslatable('08:30')).toBe(true);
    expect(isUntranslatable('2026-11-10T08:30:00Z')).toBe(true);
  });

  it('bỏ qua email/số điện thoại', () => {
    expect(isUntranslatable('an.nguyen@kmart.vn')).toBe(true);
    expect(isUntranslatable('0912345678')).toBe(true);
    expect(isUntranslatable('+84912345678')).toBe(true);
  });

  it('bỏ qua mã hệ thống (UUID, hex 8 ký tự, mã nhân viên, mã trong ngoặc)', () => {
    expect(isUntranslatable('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(isUntranslatable('AB12CD34')).toBe(true);
    expect(isUntranslatable('K250627')).toBe(true);
    expect(isUntranslatable('SK130002')).toBe(true);
    expect(isUntranslatable('[REQ-001]')).toBe(true);
  });

  it('KHÔNG bỏ qua câu tiếng Việt và chữ Hàn', () => {
    expect(isUntranslatable('Tôi muốn nghỉ phép ngày mai')).toBe(false);
    expect(isUntranslatable('안녕하세요')).toBe(false);
  });
});
