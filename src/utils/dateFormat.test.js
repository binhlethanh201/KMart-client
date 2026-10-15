import { describe, it, expect } from 'vitest';
import { formatDateOfBirth } from './dateFormat';

describe('formatDateOfBirth', () => {
  it('đổi YYYY-MM-DD sang dd/MM/yyyy', () => {
    expect(formatDateOfBirth('1990-05-17')).toBe('17/05/1990');
  });

  it('bỏ phần giờ khi giá trị là ISO datetime', () => {
    expect(formatDateOfBirth('1990-05-17T00:00:00Z')).toBe('17/05/1990');
  });

  it('trả chuỗi rỗng khi không có giá trị (tránh hiện Invalid Date)', () => {
    expect(formatDateOfBirth('')).toBe('');
    expect(formatDateOfBirth(null)).toBe('');
    expect(formatDateOfBirth(undefined)).toBe('');
  });

  it('giữ nguyên giá trị khi không tách được năm/tháng/ngày', () => {
    expect(formatDateOfBirth('1990')).toBe('1990');
  });
});
