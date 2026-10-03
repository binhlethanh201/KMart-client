import apiClient from '../../../services/apiClient';

export const authService = {
  login: async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  /**
   * BE-50: đặt lại mật khẩu bằng mật khẩu tạm do HR/Quản trị cấp.
   * Dùng chung cơ chế với "Đặt lại mật khẩu" ở màn Nhân sự.
   */
  resetPasswordWithTemp: async (email, tempPassword, newPassword) => {
    const response = await apiClient.post('/auth/reset-password', {
      email,
      tempPassword,
      newPassword,
    });
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  }
};
