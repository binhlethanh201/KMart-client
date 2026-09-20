import apiClient from '../../../services/apiClient';

export const positionService = {
  getAll: async () => {
    const response = await apiClient.get('/positions');
    return response.data;
  }
};
