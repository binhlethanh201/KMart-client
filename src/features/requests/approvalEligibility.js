/**
 * BE-75: quy tắc "đơn này có đang chờ CHÍNH người này duyệt không".
 *
 * Trước đây logic này được viết lặp lại ở 2 nơi (ApprovalSystemProvider.canApprove và
 * applicationService.getPendingApprovals) với hai cách kiểm tra KHÁC nhau, nên chỉ cần một
 * chỗ sai là sinh lỗi:
 *   * danh sách hiện nhãn "Cần bạn duyệt" cho đơn người đó đã duyệt xong (đơn chuỗi liên tiếp);
 *   * trang chi tiết vẫn hiện "Yêu cầu hành động" và bật nút Duyệt;
 *   * trang phòng ban hiện nút "Duyệt nhanh" cho đơn không phải của mình -> bấm vào báo lỗi.
 *
 * Gộp về MỘT hàm để mọi nơi cho ra cùng kết quả.
 */

const PENDING_STATUSES = ['pending', 'submitted', 'pendingapproval'];

/** Bước đang chờ của đơn (theo currentStep), hoặc null. */
export function findCurrentStep(request) {
  if (!request) return null;
  const currentOrder = Number(request.currentStep) || 0;
  if (currentOrder <= 0) return null;
  const steps = request.steps || [];
  return steps.find((s) => Number(s.stepOrder) === currentOrder) || null;
}

/** Danh sách người được giao duyệt ở bước đang chờ. */
export function currentStepApproverIds(request) {
  const step = findCurrentStep(request);
  if (!step) return [];
  if (Array.isArray(step.approverIds) && step.approverIds.length > 0) return step.approverIds;
  return step.approverId ? [step.approverId] : [];
}

/** Người này đã duyệt / từ chối ở đúng bước đang chờ chưa. */
export function hasActedOnCurrentStep(request, userId) {
  const currentOrder = Number(request?.currentStep) || 0;
  if (currentOrder <= 0 || !userId) return false;
  return (request?.histories || []).some(
    (h) =>
      Number(h.stepOrder) === currentOrder &&
      String(h.userId) === String(userId) &&
      ['approved', 'rejected'].includes(String(h.action || '').toLowerCase())
  );
}

/**
 * Người dùng có phải người duyệt của bước đang chờ không.
 * Chỉ tính khi biết chắc danh sách người duyệt — bước không xác định được người duyệt
 * thì KHÔNG cho ai duyệt (trước đây trả về true khiến ai cũng thấy nút Duyệt rồi bấm vào bị lỗi).
 */
export function isApproverOfCurrentStep(request, userId) {
  if (!userId) return false;
  const ids = currentStepApproverIds(request);
  if (ids.length === 0) return false;
  return ids.some((id) => String(id) === String(userId));
}

/**
 * Kết luận cuối cùng: đơn đang chờ chính người này xử lý.
 * Dùng cho cả nhãn "Cần bạn duyệt" và nút "Duyệt yêu cầu"/"Duyệt nhanh".
 */
export function canUserApprove(request, userId) {
  if (!request || !userId) return false;
  if (!PENDING_STATUSES.includes(String(request.status || '').toLowerCase())) return false;
  if (!isApproverOfCurrentStep(request, userId)) return false;
  if (hasActedOnCurrentStep(request, userId)) return false;
  return true;
}

/** Các hành động chứng tỏ luồng duyệt đã bị tác động — dùng để khoá nút "Hủy đơn". */
const ACTIVITY_BLOCKING_CANCEL = ['approved', 'rejected', 'supplement_requested', 'timeout'];

/**
 * BE-76: người tạo có được tự hủy đơn này không.
 *
 * Chỉ hủy được khi CHƯA AI DUYỆT:
 *   * đúng là chủ đơn;
 *   * đơn chưa kết thúc (đã duyệt / bị từ chối / đã hủy thì thôi);
 *   * chưa có ai duyệt, từ chối, yêu cầu bổ sung, và chưa bị trả về do quá hạn.
 *
 * Phải KHỚP với backend (ApplicationService.EnsureCancelableAsync) để nút không hiện
 * ở chỗ máy chủ sẽ từ chối.
 */
export function canUserCancel(request, userId) {
  if (!request || !userId) return false;
  if (String(request.creatorId) !== String(userId)) return false;

  const status = String(request.status || '').toLowerCase();
  if (['approved', 'rejected', 'canceled', 'returned_timeout'].includes(status)) return false;
  if (!['draft', 'pending', 'submitted', 'pendingapproval', 'needssupplement'].includes(status)) return false;

  // Đơn còn Nháp thì chưa ai thấy -> luôn hủy được.
  if (status === 'draft') return true;

  const acted = (request.histories || []).some((h) =>
    ACTIVITY_BLOCKING_CANCEL.includes(String(h.action || '').toLowerCase())
  );
  return !acted;
}

/** Lý do không hủy được — hiển thị cho người dùng hiểu vì sao nút bị ẩn/khoá. */
export function cancelBlockedReason(request, userId) {
  if (!request) return null;
  if (String(request.creatorId) !== String(userId)) return 'not-owner';
  const status = String(request.status || '').toLowerCase();
  if (['approved', 'rejected', 'canceled', 'returned_timeout'].includes(status)) return 'finished';
  const acted = (request.histories || []).some((h) =>
    ACTIVITY_BLOCKING_CANCEL.includes(String(h.action || '').toLowerCase())
  );
  return acted ? 'already-acted' : null;
}
