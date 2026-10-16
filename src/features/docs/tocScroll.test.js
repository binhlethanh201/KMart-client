import { describe, it, expect } from 'vitest';
import { pickActiveId, createTocLock, ACTIVE_OFFSET_PX, TOC_LOCK_MS } from './tocScroll';

const ids = ['a', 'b', 'c'];
const frame = { scrollTop: 0, scrollHeight: 2000, clientHeight: 600 };

/**
 * DOCS-08: mục lục từng đứng yên ở mục gần cuối khi cuộn hết trang — tiêu đề các mục cuối
 * không vượt được vạch 120px vì bên dưới không còn nội dung để cuộn.
 */
describe('pickActiveId — tô sáng theo vị trí cuộn', () => {
  it('chọn mục cuối cùng đã lướt qua vạch', () => {
    expect(pickActiveId(ids, [0, 300, 900], frame)).toBe('a');
    expect(pickActiveId(ids, [-200, 100, 700], frame)).toBe('b');
    expect(pickActiveId(ids, [-500, -200, 50], frame)).toBe('c');
  });

  it('chạm đáy thì luôn là mục cuối, dù tiêu đề chưa lên tới vạch', () => {
    const bottom = { scrollTop: 1400, scrollHeight: 2000, clientHeight: 600 };
    expect(pickActiveId(ids, [-1200, -800, 300], bottom)).toBe('c');
  });

  it('sai số khi chạm đáy được bỏ qua (sub-pixel)', () => {
    const nearBottom = { scrollTop: 1398, scrollHeight: 2000, clientHeight: 600 };
    expect(pickActiveId(ids, [-1200, -900, 320], nearBottom)).toBe('c');
  });

  it(`giữ đúng vạch ${ACTIVE_OFFSET_PX}px`, () => {
    expect(pickActiveId(ids, [0, ACTIVE_OFFSET_PX, 900], frame)).toBe('b');
    expect(pickActiveId(ids, [0, ACTIVE_OFFSET_PX + 1, 900], frame)).toBe('a');
  });

  it('không có mục nào thì trả về chuỗi rỗng', () => {
    expect(pickActiveId([], [], { scrollTop: 0, scrollHeight: 0, clientHeight: 0 })).toBe('');
  });

  it('mục không tìm thấy trong DOM (khoảng cách vô cực) không được chọn', () => {
    expect(
      pickActiveId(ids, [-100, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY], frame),
    ).toBe('a');
  });
});

/**
 * DOCS-09: ở đáy tài liệu, Phụ lục B và Phụ lục C cùng nằm trong tầm nhìn nên mọi quy tắc theo
 * vị trí cuộn đều chỉ ra một trong hai. Bấm B là ý định rõ ràng của người dùng → phải thắng.
 */
describe('createTocLock — bấm mục lục thì mục đó phải thắng', () => {
  const make = () => {
    const committed = [];
    const timers = [];
    const lock = createTocLock({
      onCommit: (id) => committed.push(id),
      schedule: (fn) => {
        timers.push(fn);
        return timers.length;
      },
      cancel: () => {},
    });
    return { lock, committed, fireTimers: () => timers.splice(0).forEach((fn) => fn()) };
  };

  it('tô sáng ngay mục vừa bấm', () => {
    const { lock, committed } = make();
    lock.lock('phu-luc-b');
    expect(committed).toEqual(['phu-luc-b']);
  });

  it('sự kiện cuộn trong lúc cuộn mượt KHÔNG ghi đè mục vừa bấm', () => {
    const { lock, committed } = make();
    lock.lock('phu-luc-b');
    // Lỗi người dùng gặp: cuộn mượt xong, sự kiện scroll kéo về Phụ lục A hoặc C.
    lock.commit('phu-luc-a');
    lock.commit('phu-luc-c');
    expect(committed).toEqual(['phu-luc-b']);
    expect(lock.isLocked()).toBe(true);
  });

  it('hết thời gian chờ thì trả quyền cho quy tắc theo vị trí', () => {
    const { lock, committed, fireTimers } = make();
    lock.lock('phu-luc-b');
    fireTimers();
    lock.commit('phu-luc-c');
    expect(committed).toEqual(['phu-luc-b', 'phu-luc-c']);
    expect(lock.isLocked()).toBe(false);
  });

  it('người dùng cuộn tay thì mở khoá ngay', () => {
    const { lock, committed } = make();
    lock.lock('phu-luc-b');
    lock.release();
    lock.commit('faq');
    expect(committed).toEqual(['phu-luc-b', 'faq']);
  });

  it('bấm liên tiếp hai mục thì mục sau thắng', () => {
    const { lock, committed } = make();
    lock.lock('phu-luc-b');
    lock.lock('phu-luc-c');
    expect(committed).toEqual(['phu-luc-b', 'phu-luc-c']);
  });

  it('thời gian khoá đủ dài để cuộn mượt và quán tính kết thúc', () => {
    expect(TOC_LOCK_MS).toBeGreaterThanOrEqual(2000);
    expect(TOC_LOCK_MS).toBeLessThanOrEqual(8000);
  });
});
