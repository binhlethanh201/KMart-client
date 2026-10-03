/**
 * BE-70: Lấy thông báo lỗi CÓ NGHĨA từ phản hồi của máy chủ.
 *
 * Lỗi kiểm tra dữ liệu (FluentValidation) trả về dạng:
 *   { message: 'Validation failed', errors: ['Tên phòng ban tối thiểu 2 ký tự'] }
 * Trước đây giao diện chỉ đọc `message` nên người dùng chỉ thấy "Validation failed",
 * không biết sai ở đâu (từng bị hiểu nhầm là do trùng mã phòng ban đã xoá).
 *
 * Hàm này lấy đúng câu giải thích chi tiết và dịch theo ngôn ngữ đang dùng;
 * chuỗi chưa có trong bảng dịch sẽ do bộ dịch tự động xử lý.
 */
export function describeApiError(err, t, fallbackKey) {
  const translate = typeof t === 'function' ? t : (s) => s;
  const data = err?.response?.data;

  const parts = [];
  const push = (value) => {
    const text = String(value ?? '').trim();
    if (text && !parts.includes(text)) parts.push(text);
  };

  // FluentValidation: mảng câu giải thích, hoặc object { field: [câu...] } của ASP.NET.
  if (Array.isArray(data?.errors)) {
    data.errors.forEach(push);
  } else if (data?.errors && typeof data.errors === 'object') {
    Object.values(data.errors).forEach((value) => (Array.isArray(value) ? value.forEach(push) : push(value)));
  }

  if (parts.length === 0) push(data?.error);
  // "Validation failed" không nói lên điều gì -> chỉ dùng khi không còn thông tin nào khác.
  if (parts.length === 0 && !/^validation failed$/i.test(String(data?.message ?? '').trim())) push(data?.message);
  // Axios báo "Request failed with status code 400" — vô nghĩa với người dùng cuối.
  if (parts.length === 0 && err?.message && !/status code/i.test(err.message)) push(err.message);

  return parts.length > 0 ? parts.map(translate).join(' • ') : translate(fallbackKey);
}

export default describeApiError;
