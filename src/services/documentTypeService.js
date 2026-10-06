import apiClient from './apiClient';

export const documentTypeService = {
  getAll: async () => {
    const response = await apiClient.get('/document-types');
    return response.data;
  },

  // BE-07: chỉ các loại đơn đang bật VÀ đã có workflow active.
  // Màn tạo đơn phải dùng hàm này thay vì getAll(), nếu không user sẽ tạo được
  // loại đơn chưa cấu hình luồng duyệt rồi kẹt ở bước submit.
  getAvailable: async () => {
    const response = await apiClient.get('/document-types/available');
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/document-types/${id}`);
    return response.data;
  },
  
  getByCode: async (code) => {
    const response = await apiClient.get(`/document-types/code/${code}`);
    return response.data;
  },

  create: async (data) => {
    const response = await apiClient.post('/document-types', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await apiClient.put(`/document-types/${id}`, data);
    return response.data;
  },

  updateFields: async (id, fields) => {
    try {
      const response = await apiClient.put(`/document-types/${id}/fields`, { 
        fields: fields.map(f => ({
          ...f,
          isPersisted: f.isPersisted !== undefined ? f.isPersisted : true,
        }))
      });
      return response.data;
    } catch (err) {
      if (err.response) {
        console.error('API Error Response:', err.response.data);
      }
      throw err;
    }
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/document-types/${id}`);
    return response.data;
  },

  // ===== File mẫu của trường "Tải file" — lưu server-side (bỏ localStorage) =====

  uploadTemplateFile: async (id, fieldName, file) => {
    const form = new FormData();
    form.append('file', file);
    const response = await apiClient.post(
      `/document-types/${id}/fields/${encodeURIComponent(fieldName)}/template`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  downloadTemplateFile: async (id, fieldName) => {
    const response = await apiClient.get(
      `/document-types/${id}/fields/${encodeURIComponent(fieldName)}/template`,
      { responseType: 'blob' }
    );
    return response.data;
  },

  deleteTemplateFile: async (id, fieldName) => {
    await apiClient.delete(`/document-types/${id}/fields/${encodeURIComponent(fieldName)}/template`);
  }
};
