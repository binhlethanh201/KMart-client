/**
 * BE-77: bộ style dùng chung cho các ô lọc / ô nhập trên thanh công cụ.
 *
 * Trước đây mỗi trang tự khai báo một kiểu: trang Báo cáo dùng nền trắng ngà #FFFEFA với viền
 * mảnh, còn các trang khác dùng `bg-surface` (trắng tinh #ffffff) nên nhìn chênh tông — ô lọc
 * nổi thành từng khối trắng trên nền ấm của trang.
 *
 * Nay mọi thanh lọc lấy đúng style của trang Báo cáo & Thống kê. Sửa ở MỘT chỗ này là tất cả
 * các trang đổi theo, tránh lệch lại về sau.
 */

/** Ô nhập / ô chọn trên thanh lọc. */
export const FILTER_CONTROL_CLS =
  'h-[44px] border border-[#D9D5CC] rounded-[3px] px-[16px] text-[14px] text-[#111315] bg-[#FFFEFA] focus:border-[#111315] focus:outline-none transition-colors';

/** Nhãn nhỏ in hoa phía trên ô lọc. */
export const FILTER_LABEL_CLS =
  'text-[12px] font-bold uppercase tracking-[1.68px] text-[#66655F]';

/** Ô tìm kiếm có icon kính lúp bên trái (thêm padding trái cho icon). */
export const FILTER_SEARCH_CLS = `${FILTER_CONTROL_CLS} pl-[42px] w-full`;

/** Icon kính lúp đặt tuyệt đối trong ô tìm kiếm. */
export const FILTER_SEARCH_ICON_CLS =
  'material-symbols-outlined absolute left-[14px] top-1/2 -translate-y-1/2 text-[#66655F] text-[18px] pointer-events-none';

/** Nút hành động phụ trên thanh lọc (VD "Đặt lại"). */
export const FILTER_GHOST_BUTTON_CLS =
  'flex items-center justify-center px-[16px] h-[44px] text-[14px] font-semibold text-[#66655F] bg-transparent border border-transparent hover:border-[#D9D5CC] rounded-[8px] transition-colors';
