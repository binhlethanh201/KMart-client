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
  }
};
