import apiClient from '../../../services/apiClient';

export const positionService = {
  getAll: async () => {
    const response = await apiClient.get('/positions');
    return response.data;
  },

  /**
   * BE-99: màn "Chức vụ & cấp bậc" cần thêm/sửa/xoá chức vụ.
   * Máy chủ yêu cầu quyền HR cho 3 thao tác này (PositionsController).
   */
  create: async (data) => {
    const response = await apiClient.post('/positions', {
      name: data.name,
      code: data.code,
      level: data.level,
    });
    return response.data;
  },

  update: async (id, data) => {
    const response = await apiClient.put(`/positions/${id}`, {
      name: data.name,
      code: data.code,
      level: data.level,
    });
    return response.data;
  },

  remove: async (id) => {
    const response = await apiClient.delete(`/positions/${id}`);
    return response.data;
  },
};
