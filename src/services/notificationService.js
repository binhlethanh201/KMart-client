import apiClient from './apiClient';

// BE-22: thông báo trong ứng dụng (chuông). Backend đã có sẵn nhóm endpoint
// /api/notifications (list, unread-count, mark read) nhưng FE chưa từng gọi.
export const notificationService = {
  getAll: async (page = 1, pageSize = 20) => {
    const response = await apiClient.get(`/notifications?page=${page}&pageSize=${pageSize}`);
    return response.data || [];
  },

  getUnreadCount: async () => {
    const response = await apiClient.get('/notifications/unread-count');
    return response.data?.unreadCount ?? 0;
  },

  markAsRead: async (id) => {
    const response = await apiClient.put(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await apiClient.put('/notifications/read-all');
    return response.data;
  },
};