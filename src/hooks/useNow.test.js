import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useNow from './useNow';

describe('useNow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('trả về thời điểm hiện tại ngay lần render đầu', () => {
    vi.setSystemTime(new Date('2026-10-15T12:00:00Z'));
    const { result } = renderHook(() => useNow());

    expect(result.current).toBe(Date.now());
  });

  it('tự cập nhật mỗi phút theo mặc định', () => {
    vi.setSystemTime(new Date('2026-10-15T12:00:00Z'));
    const start = Date.now();
    const { result } = renderHook(() => useNow());

    // advanceTimersByTime cũng dịch đồng hồ giả, nên giá trị mới là start + 60s.
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(result.current).toBe(start + 60_000);
  });

  it('không cập nhật khi chưa tới kỳ', () => {
    vi.setSystemTime(new Date('2026-10-15T12:00:00Z'));
    const start = Date.now();
    const { result } = renderHook(() => useNow());

    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(result.current).toBe(start);
  });

  it('tôn trọng khoảng thời gian truyền vào', () => {
    vi.setSystemTime(new Date('2026-10-15T12:00:00Z'));
    const start = Date.now();
    const { result } = renderHook(() => useNow(1_000));

    act(() => {
      vi.advanceTimersByTime(1_000);
    });
    expect(result.current).toBe(start + 1_000);
  });

  it('dọn interval khi unmount (không setState sau khi tháo)', () => {
    const clearSpy = vi.spyOn(globalThis, 'clearInterval');
    const { unmount } = renderHook(() => useNow());

    unmount();
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });
});

describe('nhãn hạn xử lý tính từ now', () => {
  /**
   * Khoá lại lỗi gốc: badge hết hạn phải đổi màu dựa trên giá trị `now` mới, không phải ảnh chụp
   * lúc mở trang. Công thức dưới đây là bản sao của RequestDetail.deadlineInfo.
   */
  const deadlineInfo = (deadlineAt, now) => {
    const deadline = new Date(deadlineAt);
    const hoursLeft = (deadline.getTime() - now) / 36e5;
    return { hoursLeft, overdue: hoursLeft <= 0, warning: hoursLeft > 0 && hoursLeft <= 6 };
  };

  it('còn 12 giờ thì chưa quá hạn và chưa cảnh báo', () => {
    const now = new Date('2026-10-15T12:00:00Z').getTime();
    const info = deadlineInfo(new Date('2026-10-16T00:00:00Z').toISOString(), now);

    expect(info.overdue).toBe(false);
    expect(info.warning).toBe(false);
  });

  it('còn 3 giờ thì bật cảnh báo', () => {
    const now = new Date('2026-10-15T12:00:00Z').getTime();
    expect(deadlineInfo(new Date('2026-10-15T15:00:00Z').toISOString(), now).warning).toBe(true);
  });

  it('cùng một hạn, khi now vượt qua thì chuyển sang quá hạn (đây là lỗi đã sửa)', () => {
    const deadlineAt = new Date('2026-10-15T14:00:00Z').toISOString();

    expect(deadlineInfo(deadlineAt, new Date('2026-10-15T13:00:00Z').getTime()).overdue).toBe(false);
    expect(deadlineInfo(deadlineAt, new Date('2026-10-15T14:01:00Z').getTime()).overdue).toBe(true);
  });
});
