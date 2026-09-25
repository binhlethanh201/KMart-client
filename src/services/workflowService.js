import apiClient from './apiClient';

export const workflowService = {
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
};