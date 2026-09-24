export const REQUEST_TYPES = [
  'Đi muộn, về sớm',
  'Nghỉ phép năm',
  'Mua sắm văn phòng phẩm',
  'Đăng ký công tác',
  'Xin nghỉ việc',
];

export const WORKFLOW_BY_TYPE = {
  'Đi muộn, về sớm': ['u_tvql', 'u_lhtl'],
  'Nghỉ phép năm': ['u_tvql', 'u_lhtl'],
  'Mua sắm văn phòng phẩm': ['u_tvql', 'u_lhtl'],
  'Đăng ký công tác': ['u_tvql', 'u_lhtl'],
  'Xin nghỉ việc': ['u_tvql', 'u_lhtl'],
};

export const STEP_ROLE = {
  u_tvql: 'Quản lý trực tiếp (Cấp 1)',
  u_lhtl: 'Nhân sự Hội sở (Cấp 2)',
};

export const STATUS_META = {
  draft: { label: 'Bản nháp', badge: 'text-gray-500', dot: 'bg-gray-400' },
  submitted: { label: 'Đã gửi (Chờ duyệt)', badge: 'text-warning', dot: 'bg-warning' },
  pendingapproval: { label: 'Đang chờ duyệt', badge: 'text-warning', dot: 'bg-warning' },
  canceled: { label: 'Đã hủy', badge: 'text-gray-500', dot: 'bg-gray-500' },
  pending: { label: 'Đang chờ duyệt', badge: 'text-warning', dot: 'bg-warning' },
  approved: { label: 'Đã phê duyệt', badge: 'text-success', dot: 'bg-success' },
  rejected: { label: 'Từ chối / Trả về', badge: 'text-error', dot: 'bg-error' },
  returned_timeout: { label: 'Trả về (quá hạn 12h)', badge: 'text-error', dot: 'bg-error' },
};
