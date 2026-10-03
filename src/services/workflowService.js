import apiClient from './apiClient';

export const workflowService = {
  getActiveForDocumentType: async (documentTypeId) => {
    const response = await apiClient.get(`/workflows/document-type/${documentTypeId}/active`);
    return response.data;
  },

  getByDocumentType: async (documentTypeId) => {
    const response = await apiClient.get(`/workflows/document-type/${documentTypeId}`);
    return response.data;
  },

  /**
   * BE-50: luồng duyệt ĐÃ PHÂN GIẢI người duyệt thật cho người đang đăng nhập.
   * Dùng cho "Luồng phê duyệt dự kiến" ở màn tạo đơn — trước đây màn này tự đoán
   * người duyệt ở client nên cây luồng hiển thị sai.
   */
  preview: async (documentTypeId, departmentIds = []) => {
    const params = {};
    if (Array.isArray(departmentIds) && departmentIds.length > 0) {
      params.departmentIds = departmentIds.join(',');
    }
    const response = await apiClient.get(`/workflows/document-type/${documentTypeId}/preview`, { params });
    return response.data;
  },
  create: async (data) => {
    const response = await apiClient.post('/workflows', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await apiClient.put(`/workflows/${id}`, data);
    return response.data;
  },
};