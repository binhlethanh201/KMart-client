/**
 * BE-92: ràng buộc giá trị cho các field kiểu SỐ ("Số" / "NUMBER") trên form Tạo đề xuất và
 * form Bổ sung đơn.
 *
 * Bối cảnh: ô "số ngày" của đơn nghỉ phép là `<input type="number">` nhưng trước đây không có
 * ràng buộc nào, nên người dùng gửi được "số ngày = -15". Đơn âm làm sai toàn bộ số liệu
 * (số ngày nghỉ, chấm công, báo cáo) mà vẫn được duyệt bình thường.
 */

/** Kiểu field được coi là số. So khớp không phân biệt hoa/thường và khoảng trắng thừa. */
const NUMBER_TYPES = new Set(['number', 'số']);

/** Field này có phải kiểu số không. */
export function isNumberField(field) {
  return NUMBER_TYPES.has(String(field?.type ?? '').trim().toLowerCase());
}

/**
 * Kiểm tra một giá trị nhập cho field kiểu số.
 *
 * @param {*} raw giá trị thô từ form
 * @returns {'invalid'|'negative'|null} `null` khi hợp lệ (hoặc bỏ trống — việc bắt buộc
 *          do `required` của field lo, không thuộc phạm vi hàm này).
 */
export function checkNumberValue(raw) {
  if (raw === undefined || raw === null || String(raw).trim() === '') return null;

  // Người dùng có thể gõ dấu phẩy thập phân theo thói quen ("1,5").
  const value = Number(String(raw).trim().replace(',', '.'));
  if (!Number.isFinite(value)) return 'invalid';
  if (value < 0) return 'negative';
  return null;
}

export default checkNumberValue;
