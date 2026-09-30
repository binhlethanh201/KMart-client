// Hằng số cấu hình cho màn "Cấu hình Hệ thống".
//
// LƯU Ý: KHÔNG đặt dữ liệu giả (danh sách mẫu đơn, tên nhân sự, workflow mẫu...) ở đây.
// Mọi dữ liệu nghiệp vụ phải lấy từ API:
//   - mẫu đơn / nhóm mẫu đơn    -> documentTypeService.getAll()  (cột `category`)
//   - chức danh duyệt           -> roleService.getAll()
//   - nhân sự                   -> useHr().employees
//   - cấu hình Zalo / thời gian -> /settings, /settings/zalo
// File này chỉ chứa các TỪ ĐIỂN LỰA CHỌN (enum) của giao diện.

// Hình thức duyệt
export const APPROVAL_TYPES = [
  { id: 'hierarchy', label: 'Cấp quản lý trực tiếp', desc: 'Quản lý trực tiếp của người tạo đơn (TP/Phó phòng/CHT)' },
  { id: 'chain', label: 'Chuỗi quản lý liên tiếp', desc: 'Duyệt lần lượt từ cấp thấp ➔ cấp cao' },
  { id: 'role', label: 'Theo chức danh / Bộ phận', desc: 'Chọn bộ phận xử lý (VD: HR Admin, Kế toán)' },
  { id: 'specific', label: 'Chọn 1 người cụ thể', desc: 'Chọn chính xác tên nhân sự' },
];

// Quy tắc nhiều người duyệt
export const MULTI_RULES = [
  { id: 'sequential', label: 'Duyệt lần lượt', desc: 'Người A duyệt xong mới chuyển sang Người B', badge: 'A ➔ B ➔ C' },
  { id: 'and', label: 'Đồng thời — cần tất cả đồng ý', desc: 'Gửi tất cả, bắt buộc 100% bấm Duyệt', badge: 'A + B + C' },
  { id: 'or', label: 'Đồng thời — chỉ cần 1 người', desc: 'Ai bấm Duyệt trước thì đơn hoàn tất', badge: 'A ⚡ B' },
];

// Trường dùng để rẽ nhánh bước duyệt — id khớp field_name của mẫu đơn
export const CONDITION_FIELDS = [
  { id: 'num_days', label: 'Số ngày nghỉ' },
  { id: 'leave_type', label: 'Hình thức nghỉ' },
  { id: 'ot_hours', label: 'Số giờ OT' },
];

export const CONDITION_OPS = [
  { id: '>', label: '>' },
  { id: '>=', label: '≥' },
  { id: '==', label: '=' },
  { id: '<=', label: '≤' },
  { id: '<', label: '<' },
];

// Cách tính thời hạn xử lý
export const TIME_RULES = [
  { id: 'business', label: 'Chỉ tính trong giờ hành chính' },
  { id: 'continuous', label: 'Tính 12 giờ liên tục' },
];