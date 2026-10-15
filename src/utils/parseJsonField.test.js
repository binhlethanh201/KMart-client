import { describe, it, expect } from 'vitest';
import { parseJsonField } from './parseJsonField';

/*
 * SEC-03 (audit): hai nơi trong ứng dụng đọc cột `profile_data` và trước đây gọi thẳng
 * `JSON.parse`. Vì cột này là chuỗi tự do trong CSDL, một giá trị rác làm hỏng cả trang Nhân sự
 * của mọi người dùng, và khoá chủ tài khoản khỏi mọi trang có kiểm tra quyền.
 * Bộ test này khoá lại hành vi "không bao giờ ném lỗi".
 */
describe('parseJsonField', () => {
  it('parse được JSON hợp lệ', () => {
    expect(parseJsonField('{"address":"Hà Nội"}')).toEqual({ address: 'Hà Nội' });
    expect(parseJsonField('[1,2,3]')).toEqual([1, 2, 3]);
  });

  it('KHÔNG ném lỗi với chuỗi rác — đây là lỗi đã từng xảy ra', () => {
    expect(() => parseJsonField('không phải json')).not.toThrow();
    expect(parseJsonField('không phải json')).toBeNull();
    expect(parseJsonField('{')).toBeNull();
    expect(parseJsonField('{address:}')).toBeNull();
  });

  it('trả về giá trị dự phòng khi rỗng hoặc null', () => {
    expect(parseJsonField(null)).toBeNull();
    expect(parseJsonField(undefined)).toBeNull();
    expect(parseJsonField('')).toBeNull();
    expect(parseJsonField('', {})).toEqual({});
    expect(parseJsonField(null, {})).toEqual({});
  });

  it('dùng nguyên giá trị nếu API đã trả sẵn object', () => {
    const obj = { a: 1 };
    expect(parseJsonField(obj)).toBe(obj);
    expect(parseJsonField([1])).toEqual([1]);
  });

  it('giữ nguyên giá trị JSON hợp lệ dạng số và boolean', () => {
    expect(parseJsonField('0')).toBe(0);
    expect(parseJsonField('false')).toBe(false);
  });
});
