import apiClient from './apiClient';

export const documentTypeService = {
  getAll: async () => {
    const response = await apiClient.get('/document-types');
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

  updateFields: async (id, fields) => {
    try {
      const response = await apiClient.put(`/document-types/${id}/fields`, { fields });
      return response.data;
    } catch (err) {
      if (err.response) {
        console.error('API Error Response:', err.response.data);
      }
      throw err;
    }
  }
};
