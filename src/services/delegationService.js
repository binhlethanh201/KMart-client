import apiClient from './apiClient';

/**
 * Delegation service — thin wrapper around the /api/delegations endpoints.
 *
 * Endpoints:
 *   GET  /api/delegations/my     — ủy quyền đã tạo (tôi là người ủy quyền)
 *   GET  /api/delegations/to-me  — ủy quyền nhận được (tôi là người được ủy quyền)
 *   POST /api/delegations       — tạo ủy quyền mới
 *   DELETE /api/delegations/{id} — thu hồi ủy quyền
 */
export const delegationService = {
  /** Danh sách ủy quyền do tôi tạo (tôi là delegator). */
  getMine: async () => {
    const response = await apiClient.get('/delegations/my');
    return response.data;
  },

  /** Danh sách ủy quyền dành cho tôi (tôi là delegate). */
  getToMe: async () => {
    const response = await apiClient.get('/delegations/to-me');
    return response.data;
  },

  /**
   * Tạo một ủy quyền mới.
   * @param {{ delegateId: string, startDate: string, endDate: string, reason?: string }} data
   */
  create: async (data) => {
    const response = await apiClient.post('/delegations', data);
    return response.data;
  },

  /**
   * Thu hồi (xóa) một ủy quyền.
   * @param {string} id — delegation id
   */
  revoke: async (id) => {
    const response = await apiClient.delete(`/delegations/${id}`);
    return response.data;
  },
};
