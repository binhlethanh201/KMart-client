import apiClient from '../../../services/apiClient';

export const roleService = {
  getAll: async () => {
    const response = await apiClient.get('/admin/roles');
    return response.data;
  }
};
