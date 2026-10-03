/**
 * BE-74: định dạng ngày sinh (YYYY-MM-DD) sang dd/MM/yyyy để hiển thị.
 * Trả về chuỗi rỗng khi không có giá trị để tránh hiện "Invalid Date".
 */
export function formatDateOfBirth(value) {
  if (!value) return '';
  const [year, month, day] = String(value).slice(0, 10).split('-');
  if (!year || !month || !day) return String(value);
  return `${day}/${month}/${year}`;
}
