import apiClient from '../../../services/apiClient';

export const reportService = {
  // Dashboard stats với bộ lọc
  getDashboardStats: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params.append(key, value);
      }
    });
    return apiClient.get(`/reports/dashboard?${params.toString()}`);
  },

  // Theo trạng thái
  getByStatus: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.from) params.append('from', filters.from);
    if (filters.to) params.append('to', filters.to);
    return apiClient.get(`/reports/by-status?${params.toString()}`);
  },

  // Theo loại đơn
  getByType: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.from) params.append('from', filters.from);
    if (filters.to) params.append('to', filters.to);
    return apiClient.get(`/reports/by-type?${params.toString()}`);
  },

  // Theo phòng ban
  getByDepartment: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.from) params.append('from', filters.from);
    if (filters.to) params.append('to', filters.to);
    if (filters.departmentId) params.append('departmentId', filters.departmentId);
    return apiClient.get(`/reports/by-department?${params.toString()}`);
  },

  // Thời gian phê duyệt
  getApprovalTimes: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.from) params.append('from', filters.from);
    if (filters.to) params.append('to', filters.to);
    return apiClient.get(`/reports/approval-time?${params.toString()}`);
  },

  // Xuất Excel
  exportToExcel: async (request) => {
    const response = await apiClient.post('/reports/export', request, {
      responseType: 'blob',
    });
    return response.data;
  },

  downloadExcel: (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },
};
