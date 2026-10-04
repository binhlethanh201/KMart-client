/**
 * BE-99: sự kiện "dữ liệu nền tảng (nhân sự / phòng ban / chức vụ / vai trò) đã thay đổi".
 *
 * `HrProvider` nạp 4 danh sách này MỘT LẦN khi mở app. Khi người dùng sửa phòng ban hoặc chức vụ ở
 * màn khác (Cấu hình, Phòng ban & Nhóm), các dropdown ở màn Nhân sự / Cấu hình luồng duyệt vẫn giữ
 * dữ liệu CŨ (không thấy phòng ban/chức vụ vừa thêm, hoặc vẫn thấy cái vừa xoá) cho tới khi tải lại
 * cả trang. Phát sự kiện này để các nơi đó nạp lại ngay.
 */
export const HR_DATA_CHANGED = 'hr:data-changed';

export const notifyHrDataChanged = () => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(HR_DATA_CHANGED));
};
