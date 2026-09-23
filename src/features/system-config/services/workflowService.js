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
  
  create: async (data) => {
    const response = await apiClient.post('/workflows', data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await apiClient.put(`/workflows/${id}`, data);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await apiClient.delete(`/workflows/${id}`);
    return response.data;
  },
  
  setDefault: async (id) => {
    const response = await apiClient.put(`/workflows/${id}/set-default`);
    return response.data;
  }
};
