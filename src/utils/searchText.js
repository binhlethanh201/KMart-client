/**
 * BE-92: tìm kiếm trong danh sách Đơn từ.
 *
 * Ô tìm kiếm trước đây so khớp thô `String(value).includes(query)` nên:
 *   * gõ không dấu ("don xin nghi phep") không ra kết quả dù tiêu đề có dấu;
 *   * chỉ tra được mã đơn và tiêu đề nên tìm theo tên người tạo / nội dung / phòng ban đều trượt.
 */

/**
 * Chuẩn hoá chuỗi để so khớp: bỏ dấu tiếng Việt, gộp khoảng trắng, viết thường.
 *
 * @param {*} value giá trị bất kỳ (sẽ được chuyển thành chuỗi)
 * @returns {string}
 */
export function normalizeSearchText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Kiểm tra một chuỗi/đối tượng khoá có khớp từ khoá không (đã chuẩn hoá ở cả hai phía).
 *
 * @param {*} haystack chuỗi hoặc mảng chuỗi cần tra
 * @param {string} normalizedQuery từ khoá đã qua {@link normalizeSearchText}
 */
export function matchesSearchText(haystack, normalizedQuery) {
  if (!normalizedQuery) return true;
  const values = Array.isArray(haystack) ? haystack : [haystack];
  return values.some((v) => normalizeSearchText(v).includes(normalizedQuery));
}

export default normalizeSearchText;
