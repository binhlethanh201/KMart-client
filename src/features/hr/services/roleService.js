import apiClient from '../../../services/apiClient';

export const roleService = {
  /** Lấy tất cả roles */
  getAll: async () => {
    const response = await apiClient.get('/admin/roles');
    return response.data;
  },
  /** Lấy role + permissions (để preview khi chọn role) */
  getById: async (id) => {
    const response = await apiClient.get(`/admin/roles/${id}`);
    return response.data;
  },
  /** Lấy tất cả permissions */
  getPermissions: async () => {
    const response = await apiClient.get('/admin/permissions');
    return response.data;
  },
};
