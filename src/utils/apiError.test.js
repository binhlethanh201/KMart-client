import { describe, it, expect } from 'vitest';
import { describeApiError } from './apiError';

/*
 * Người dùng cuối KHÔNG được thấy chuỗi kỹ thuật của axios.
 *
 * Lỗi đã từng xảy ra: nhánh "không kết nối được tới máy chủ" nằm SAU bước đẩy `err.message`, mà
 * axios đặt `err.message = "Network Error"` nên nó lọt vào kết quả trước → người dùng Việt nhận
 * đúng hai chữ tiếng Anh "Network Error" khi mạng đứt. Bộ test này khoá lại.
 */
const t = (s) => (typeof s === 'string' ? s : s);

describe('describeApiError', () => {
  it('mất kết nối (không có response) -> câu tiếng Việt, KHÔNG phải "Network Error"', () => {
    const err = { message: 'Network Error', request: {}, response: undefined };
    const msg = describeApiError(err, t, 'Lỗi mặc định');

    expect(msg).not.toMatch(/network error/i);
    expect(msg).toContain('Không kết nối được tới máy chủ');
  });

  it('không rò rỉ "Network Error" dù nó viết hoa/thường khác nhau', () => {
    for (const raw of ['Network Error', 'network error', 'NETWORK ERROR']) {
      const msg = describeApiError({ message: raw, request: {}, response: undefined }, t, 'Lỗi mặc định');
      expect(msg.toLowerCase()).not.toContain('network error');
    }
  });

  it('lỗi có mã trạng thái -> câu giải thích theo mã, KHÔNG phải chuỗi axios', () => {
    const err = { message: 'Request failed with status code 403', response: { status: 403 } };
    const msg = describeApiError(err, t, 'Lỗi mặc định');

    expect(msg).toContain('không có quyền');
    expect(msg).not.toMatch(/status code/i);
  });

  it('dùng được thông báo chi tiết do máy chủ trả về', () => {
    const err = { response: { status: 400, data: { message: 'Validation failed', errors: ['Tên tối thiểu 2 ký tự'] } } };
    expect(describeApiError(err, t, 'Lỗi mặc định')).toContain('Tên tối thiểu 2 ký tự');
  });

  it('lỗi 500 -> câu thân thiện, không lộ chi tiết', () => {
    const msg = describeApiError({ response: { status: 500 } }, t, 'Lỗi mặc định');
    expect(msg).toContain('Máy chủ đang gặp sự cố');
  });

  it('không có gì để nói -> dùng câu mặc định', () => {
    expect(describeApiError({}, t, 'Lỗi mặc định')).toBe('Lỗi mặc định');
  });
});
