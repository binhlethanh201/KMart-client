// Nhãn/màu trạng thái đơn.
// KHÔNG khai báo danh sách "loại đơn" hay "workflow mẫu" ở đây nữa — dữ liệu đó
// phải lấy từ API (documentTypeService.getAll(), workflowService...).
export const STATUS_META = {
  draft: { label: 'Bản nháp', badge: 'text-gray-500', dot: 'bg-gray-400' },
  submitted: { label: 'Đã gửi (Chờ duyệt)', badge: 'text-warning', dot: 'bg-warning' },
  pendingapproval: { label: 'Đang chờ duyệt', badge: 'text-warning', dot: 'bg-warning' },
  canceled: { label: 'Đã hủy', badge: 'text-gray-500', dot: 'bg-gray-500' },
  pending: { label: 'Đang chờ duyệt', badge: 'text-warning', dot: 'bg-warning' },
  approved: { label: 'Đã phê duyệt', badge: 'text-success', dot: 'bg-success' },
  rejected: { label: 'Từ chối / Trả về', badge: 'text-error', dot: 'bg-error' },
  // BE-26: "yêu cầu bổ sung" dùng màu tím riêng, trước đây trùng màu vàng với "chờ duyệt"
  needssupplement: { label: 'Yêu cầu bổ sung', badge: 'text-supplement', dot: 'bg-supplement' },
  returned_timeout: { label: 'Trả về (quá hạn 12h)', badge: 'text-error', dot: 'bg-error' },
};
