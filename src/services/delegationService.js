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

/**
 * BE-147: khi tạo/thu hồi ủy quyền ở MỘT màn hình thì mọi chỗ khác đang hiển thị trạng thái
 * ủy quyền (thẻ "Ủy quyền tạm thời" trên sidebar trái, danh sách trong trang Ủy quyền) phải
 * cập nhật theo — trước đây sidebar chỉ tải dữ liệu một lần lúc mở trang nên vẫn ghi
 * "Chưa có ủy quyền" dù đã ủy quyền cho ai đó.
 */
const DELEGATIONS_CHANGED_EVENT = 'kmart:delegations-changed';

export const notifyDelegationsChanged = () => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(DELEGATIONS_CHANGED_EVENT));
};

/** Đăng ký nhận thông báo mỗi khi ủy quyền được tạo/thu hồi. Trả về hàm huỷ đăng ký. */
export const onDelegationsChanged = (handler) => {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(DELEGATIONS_CHANGED_EVENT, handler);
  return () => window.removeEventListener(DELEGATIONS_CHANGED_EVENT, handler);
};

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
    notifyDelegationsChanged();
    return response.data;
  },

  /**
   * Thu hồi (xóa) một ủy quyền.
   * @param {string} id — delegation id
   */
  revoke: async (id) => {
    const response = await apiClient.delete(`/delegations/${id}`);
    notifyDelegationsChanged();
    return response.data;
  },

  /**
   * BE-164: người duyệt thay MẶC ĐỊNH của tôi khi đơn tôi duyệt bị quá hạn.
   * Trả về { delegateId, delegateName } (delegateId = null nếu chưa cài).
   */
  getTimeoutDelegate: async () => {
    const response = await apiClient.get('/delegations/timeout-delegate');
    return response.data;
  },

  /**
   * BE-164: cài (hoặc xoá khi delegateId = null) người duyệt thay mặc định khi quá hạn.
   */
  setTimeoutDelegate: async (delegateId) => {
    const response = await apiClient.put('/delegations/timeout-delegate', { delegateId: delegateId || null });
    return response.data;
  },
};
