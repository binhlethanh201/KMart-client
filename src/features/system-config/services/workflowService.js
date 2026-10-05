import apiClient from '../../../services/apiClient';

export const workflowService = {
  getAll: async () => {
    const response = await apiClient.get('/workflows');
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/workflows/${id}`);
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
  
  clone: async (id, newName) => {
    const response = await apiClient.post(`/workflows/${id}/clone`, { newName });
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/workflows/${id}`);
    return response.data;
  },

  setDefault: async (id) => {
    const response = await apiClient.post(`/workflows/${id}/set-default`);
    return response.data;
  }
};
