/**
 * BE-77 / BE-79: bộ class dùng chung cho các ô lọc trên thanh công cụ.
 *
 * BE-77 giữ mọi thanh lọc cùng tông trắng ngà #FFFEFA của trang Báo cáo & Thống kê (trước đây mỗi
 * trang một kiểu, có trang dùng `bg-surface` trắng tinh nên ô lọc nổi thành từng khối lệch tông).
 *
 * BE-79 dồn toàn bộ phần "nhìn cho ra dáng" vào `src/index.css` (`@layer components`) để sửa một
 * chỗ là mọi trang đổi theo:
 *   * `.filter-control` — ô nhập/ô chọn: bo 8px cho khớp phần còn lại của app, có hover + focus ring;
 *   * `.filter-select`  — ô chọn: tự vẽ mũi tên, chừa chỗ bên phải (mũi tên gốc của trình duyệt bị
 *     dính sát mép và mỗi trình duyệt một kiểu);
 *   * `.filter-search` / `.filter-search-icon` — ô tìm kiếm có icon kính lúp.
 *
 * Ở đây chỉ còn việc ghép class, để trang nào cũng gọi cùng một tên.
 */

/** Ô nhập thường (kể cả `type="date"`), KHÔNG dùng cho `<select>`. */
export const FILTER_CONTROL_CLS = 'filter-control';

/** Ô chọn `<select>` — đã bao gồm style của ô nhập và mũi tên tự vẽ. */
export const FILTER_SELECT_CLS = 'filter-control filter-select';

/** Nhãn nhỏ in hoa phía trên ô lọc. */
export const FILTER_LABEL_CLS =
  'text-[12px] font-bold uppercase tracking-[1.68px] text-[#66655F]';

/** Ô tìm kiếm có icon kính lúp bên trái. */
export const FILTER_SEARCH_CLS = 'filter-control filter-search w-full';

/** Icon kính lúp đặt tuyệt đối trong ô tìm kiếm (ô cha cần `relative`). */
export const FILTER_SEARCH_ICON_CLS = 'material-symbols-outlined filter-search-icon';

/** Nút hành động phụ trên thanh lọc (VD "Đặt lại"). */
export const FILTER_GHOST_BUTTON_CLS = 'filter-ghost-btn';
