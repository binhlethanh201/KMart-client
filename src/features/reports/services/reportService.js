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

  // ===== BE-51: các báo cáo mở rộng cho màn "Báo cáo & Thống kê" =====

  /**
   * BE-52: số liệu tổng quan chính xác (MỌI trạng thái).
   * KHÔNG dùng /reports/dashboard cho thẻ KPI vì endpoint đó lọc cứng "chỉ đơn đã duyệt"
   * nên "Chờ duyệt"/"Từ chối" luôn bằng 0.
   */
  getOverview: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '' &&
          ['from', 'to', 'departmentId', 'documentTypeId', 'status'].includes(key)) {
        params.append(key, value);
      }
    });
    return apiClient.get(`/reports/overview?${params.toString()}`);
  },

  /**
   * Xu hướng theo tháng (biểu đồ đường) + tỷ lệ tăng/giảm so với tháng trước.
   * Trả về { points: [{ year, month, label, total, approved, rejected, pending,
   *                     totalChangePercent, approvedChangePercent, averageApprovalHours }] }
   */
  getTrend: (filters = {}, months = 12) => {
    const params = new URLSearchParams();
    params.append('months', months);
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '' && ['from', 'to', 'departmentId', 'documentTypeId', 'status', 'positionId'].includes(key)) {
        params.append(key, value);
      }
    });
    return apiClient.get(`/reports/trend?${params.toString()}`);
  },

  /** Bảng điều hành: tình trạng xử lý / đơn được duyệt của từng người.
   *  scope = 'managers' (chỉ quản lý) | 'all' (tất cả nhân sự — phục vụ tính lương). */
  getManagers: (filters = {}, scope = 'managers') => {
    const params = new URLSearchParams();
    params.append('scope', scope);
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '' && ['from', 'to', 'departmentId'].includes(key)) {
        params.append(key, value);
      }
    });
    return apiClient.get(`/reports/managers?${params.toString()}`);
  },

  /** So sánh theo chức vụ (position) của người tạo đơn. */
  getByPosition: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '' && ['from', 'to', 'departmentId', 'documentTypeId', 'positionId'].includes(key)) {
        params.append(key, value);
      }
    });
    return apiClient.get(`/reports/by-position?${params.toString()}`);
  },

  /** Danh sách đơn chi tiết (soi kĩ từng đơn), có phân trang. */
  getApplications: (filters = {}, page = 1, pageSize = 20) => {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('pageSize', pageSize);
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '' && ['from', 'to', 'departmentId', 'documentTypeId', 'status', 'positionId'].includes(key)) {
        params.append(key, value);
      }
    });
    return apiClient.get(`/reports/applications?${params.toString()}`);
  },

  // Xuất Excel
  exportToExcel: async (request) => {    const response = await apiClient.post('/reports/export', request, {
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
