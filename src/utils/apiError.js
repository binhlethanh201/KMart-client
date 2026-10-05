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
/**
 * BE-112: lỗi "không xoá được phòng ban vì đơn vị chưa rỗng".
 *
 * Máy chủ trả `errorCode = 'DEPARTMENT_NOT_EMPTY'` kèm `details` (số nhân sự / số đơn vị trực thuộc).
 * Ở đây dựng câu theo ngôn ngữ đang dùng rồi mới chèn tên đơn vị vào — nhờ vậy tên đơn vị do người
 * dùng đặt ("Siêu thị Kiểm thử"…) KHÔNG bao giờ bị gửi sang bộ dịch tự động.
 */
function describeDepartmentNotEmpty(data, translate) {
  const details = data?.details || {};
  const members = Number(details.memberCount) || 0;
  const children = Number(details.childCount) || 0;

  if (members === 0 && children === 0) return '';

  // Tên đơn vị CHÈN SAU khi t() đã dịch xong câu mẫu (xem resolve(): nội suy {name} chạy sau
  // bước dịch) nên tên riêng không bị gửi sang bộ dịch tự động.
  const name = String(details.departmentName ?? '').trim();

  const reasons = [];
  if (members > 0 && children > 0) {
    reasons.push(translate('còn {members} nhân sự và {children} đơn vị trực thuộc', { members, children }));
  } else if (members > 0) {
    reasons.push(translate('còn {members} nhân sự đang thuộc đơn vị', { members }));
  } else {
    reasons.push(translate('còn {children} đơn vị trực thuộc', { children }));
  }

  const fixes = [];
  if (members > 0) fixes.push(translate('chuyển nhân sự sang đơn vị khác'));
  if (children > 0) fixes.push(translate('chuyển các đơn vị trực thuộc sang đơn vị khác'));

  const head = name
    ? translate('Không thể xóa "{name}" vì {reason}.', { name, reason: reasons.join(' ') })
    : translate('Không thể xóa đơn vị vì {reason}.', { reason: reasons.join(' ') });
  const tail = translate('Vui lòng {fixes} rồi thử lại.', { fixes: fixes.join('; ') });
  const note = members > 0 ? translate('Đơn từ cũ của nhân sự không bị xóa.') : '';
  return [head, tail, note].filter(Boolean).join(' ');
}

export function describeApiError(err, t, fallbackKey, fallbackParams) {
  const translate = typeof t === 'function' ? t : (s) => s;
  const data = err?.response?.data;

  if (data?.errorCode === 'DEPARTMENT_NOT_EMPTY') {
    const described = describeDepartmentNotEmpty(data, translate);
    if (described) return described;
  }

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

  // BE-136: không để người dùng thấy mã trần trần — nếu máy chủ chỉ trả mã lỗi / mã trạng thái
  // thì dựng câu giải thích theo ngôn ngữ đang dùng.
  if (parts.length === 0 && err?.request && !err?.response) {
    return translate('Không kết nối được tới máy chủ. Kiểm tra lại kết nối mạng rồi thử lại.');
  }
  if (parts.length === 0 && err?.response?.status) {
    const status = err.response.status;
    const byStatus = {
      401: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
      403: 'Bạn không có quyền thực hiện thao tác này.',
      404: 'Dữ liệu không còn tồn tại trên máy chủ. Hãy tải lại trang rồi thử lại.',
      405: 'Thao tác không được máy chủ hỗ trợ. Vui lòng tải lại trang phiên bản mới nhất.',
      409: 'Dữ liệu vừa bị thay đổi bởi người khác. Hãy tải lại rồi thử lại.',
      429: 'Bạn thao tác quá nhanh. Vui lòng chờ một chút rồi thử lại.',
    };
    if (byStatus[status]) return translate(byStatus[status]);
    if (status >= 500) return translate('Máy chủ đang gặp sự cố ({v0}). Vui lòng thử lại sau ít phút.', { v0: status });
    return translate('Máy chủ trả về lỗi {v0}. Vui lòng thử lại.', { v0: status });
  }

  return parts.length > 0 ? parts.map(translate).join(' • ') : translate(fallbackKey, fallbackParams);
}

export default describeApiError;
