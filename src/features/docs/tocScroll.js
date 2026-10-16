/**
 * Mục lục trang Hướng dẫn: quyết định mục nào được tô sáng.
 *
 * Tách khỏi DocsPage thành hàm thuần để test được, gồm 2 phần:
 *  - pickActiveId: mục đang đọc theo vị trí cuộn (có xử lý riêng cho đoạn đáy tài liệu).
 *  - createTocLock: sau khi người dùng BẤM một mục, giữ nguyên mục đó cho tới khi họ cuộn tiếp.
 */
export const ACTIVE_OFFSET_PX = 120;

/** Sai số cho phép khi xét "đã chạm đáy" (sub-pixel + thanh cuộn động). */
const BOTTOM_EPSILON_PX = 4;

/**
 * Mục đang đọc theo vị trí cuộn.
 *
 * @param {string[]} ids    id các mục cấp 2, theo đúng thứ tự trong tài liệu
 * @param {number[]} tops   khoảng cách từ đỉnh khung cuộn tới từng tiêu đề (px)
 * @param {{scrollTop:number, scrollHeight:number, clientHeight:number}} metrics số đo khung cuộn
 * @returns {string} id của mục đang đọc
 */
export function pickActiveId(ids, tops, metrics) {
  if (!ids.length) return '';

  const { scrollTop = 0, scrollHeight = 0, clientHeight = 0 } = metrics || {};
  const atBottom = scrollHeight - scrollTop - clientHeight <= BOTTOM_EPSILON_PX;
  if (atBottom) return ids[ids.length - 1];

  let current = ids[0];
  for (let i = 0; i < ids.length; i += 1) {
    if (tops[i] <= ACTIVE_OFFSET_PX) current = ids[i];
  }
  return current;
}

/**
 * DOCS-09: sau khi người dùng BẤM một mục ở mục lục, mục đó phải giữ nguyên tô sáng.
 *
 * Lý do: ở đáy tài liệu, Phụ lục B và Phụ lục C cùng nằm trong tầm nhìn — không đủ nội dung để
 * mục cuối lên sát đỉnh — nên mọi quy tắc "theo vị trí cuộn" đều chỉ ra một trong hai. Bấm B là
 * ý định rõ ràng của người dùng, nên nó phải thắng cho tới khi họ thật sự cuộn tiếp.
 *
 * Tách khỏi React (nhận onCommit + hàm hẹn giờ) để test được mà không cần DOM.
 */
/**
 * Thời gian khoá tối đa, chỉ là van an toàn: quyền được trả lại NGAY khi người dùng lăn chuột,
 * chạm hoặc bấm phím cuộn. Phải dài hơn thời gian cuộn mượt + quán tính, nếu không sự kiện scroll
 * cuối cùng sẽ rơi vào sau lúc mở khoá và kéo mục lục về mục cuối tài liệu (đúng lỗi bấm B ra C).
 */
export const TOC_LOCK_MS = 4000;

export function createTocLock({ onCommit, timeoutMs = TOC_LOCK_MS, schedule = setTimeout, cancel = clearTimeout } = {}) {
  let locked = false;
  let timer = 0;

  return {
    /** Cập nhật theo vị trí cuộn — bị bỏ qua khi đang khoá. */
    commit(next) {
      if (!locked) onCommit(next);
    },
    /** Người dùng vừa bấm một mục: tô sáng ngay và khoá lại. */
    lock(id) {
      locked = true;
      onCommit(id);
      cancel(timer);
      timer = schedule(() => { locked = false; }, timeoutMs);
    },
    /** Người dùng chủ động cuộn: trả quyền cho quy tắc theo vị trí. */
    release() {
      locked = false;
      cancel(timer);
    },
    isLocked: () => locked,
  };
}
