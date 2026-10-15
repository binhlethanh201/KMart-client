/**
 * SEC-03 (audit): đọc một cột JSON do máy chủ trả về mà KHÔNG làm sập giao diện.
 *
 * Vì sao cần: cột `profile_data` là chuỗi tự do trong CSDL (đã có dữ liệu cũ trước khi máy chủ
 * kiểm tra định dạng). Trước đây hai nơi gọi thẳng `JSON.parse(u.profileData)`:
 *   * trong `userService.mapToFrontendModel` — nằm trong `.map()` dựng danh sách nhân sự, nên một
 *     hồ sơ hỏng làm hỏng CẢ trang Nhân sự của mọi người dùng;
 *   * trong `ApprovalSystemProvider` — nằm trong luồng nạp `/auth/me`, nên hồ sơ hỏng còn khoá
 *     chính chủ tài khoản đó khỏi mọi trang có kiểm tra quyền.
 *
 * @param {string|null|undefined} value chuỗi JSON thô từ API
 * @param {*} [fallback=null] giá trị trả về khi chuỗi rỗng hoặc không parse được
 * @returns {*} đối tượng đã parse, hoặc `fallback`
 */
export function parseJsonField(value, fallback = null) {
  if (value === null || value === undefined || value === '') return fallback;
  // Đã là object/array (một số API trả sẵn) thì dùng luôn.
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export default parseJsonField;
