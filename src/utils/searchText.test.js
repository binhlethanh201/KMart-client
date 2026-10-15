import { describe, it, expect } from 'vitest';
import { normalizeSearchText, matchesSearchText } from './searchText';

describe('normalizeSearchText', () => {
  it('bỏ dấu tiếng Việt để gõ không dấu vẫn khớp', () => {
    expect(normalizeSearchText('Đơn xin nghỉ phép')).toBe('don xin nghi phep');
  });

  it('gộp khoảng trắng và cắt hai đầu', () => {
    expect(normalizeSearchText('  Đơn   từ   xa  ')).toBe('don tu xa');
  });

  it('chịu được giá trị rỗng và không phải chuỗi', () => {
    expect(normalizeSearchText(null)).toBe('');
    expect(normalizeSearchText(undefined)).toBe('');
    expect(normalizeSearchText(12345)).toBe('12345');
  });
});

describe('matchesSearchText', () => {
  it('khớp không dấu trên chuỗi có dấu', () => {
    expect(matchesSearchText('Đơn xin nghỉ phép', 'don xin')).toBe(true);
  });

  it('khớp trên mảng khoá (mã đơn, tiêu đề, người tạo)', () => {
    expect(matchesSearchText(['REQ-001', 'Nghỉ phép', 'Nguyễn Văn A'], 'nguyen van a')).toBe(true);
  });

  it('từ khoá rỗng thì mọi bản ghi đều khớp', () => {
    expect(matchesSearchText('bất kỳ', '')).toBe(true);
  });

  it('trả false khi không có khoá nào chứa từ khoá', () => {
    expect(matchesSearchText(['REQ-001', 'Nghỉ phép'], 'cong tac')).toBe(false);
  });
});
