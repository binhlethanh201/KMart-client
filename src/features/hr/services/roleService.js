import apiClient from '../../../services/apiClient';

/**
 * BE-128: nhớ lại việc tài khoản hiện tại KHÔNG có quyền xem danh sách vai trò để không gọi lại
 * mỗi lần đổi trang (mỗi lần vào trang đều gọi 1 lượt -> 403). Đăng nhập/đăng xuất đều nạp lại
 * cả trang (`window.location.href`) nên cờ này tự đặt lại ở phiên làm việc mới.
 */
let rolesForbidden = false;

export const roleService = {
  /**
   * Lấy tất cả roles.
   *
   * BE-128: máy chủ đã siết quyền — chỉ tài khoản quản lý vai trò (HR/ADMIN) gọi được. Nhân viên
   * thường sẽ nhận 403 nên trả về mảng rỗng thay vì ném lỗi, tránh làm hỏng cả `Promise.all` của
   * trang Nhân sự (rất nhiều trang không cần tới danh sách vai trò).
   */
  getAll: async () => {
    if (rolesForbidden) return [];
    try {
      const response = await apiClient.get('/admin/roles');
      return response.data;
    } catch (err) {
      if (err.response?.status === 403 || err.response?.status === 401) {
        rolesForbidden = true;
        return [];
      }
      throw err;
    }
  },
  /** Lấy role + permissions (để preview khi chọn role) */
  getById: async (id) => {
    const response = await apiClient.get(`/admin/roles/${id}`);
    return response.data;
  },
  /** Lấy tất cả permissions (route của BE có version: /api/v1/admin/permissions) */
  getPermissions: async () => {
    const response = await apiClient.get('/v1/admin/permissions');
    return response.data;
  },
};
