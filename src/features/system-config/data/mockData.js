// Mock data for Cấu hình Hệ thống (form templates, workflow, zalo, time rules)

export const FORM_TYPES = [
  'Đơn xin nghỉ phép',
  'Đơn làm thêm (OT)',
  'Đơn xin nghỉ thai sản',
  'Đơn xin nghỉ việc',
  'Đơn xin ra ngoài',
];

export const FIELD_TYPES = ['Văn bản', 'Ngày', 'Số', 'Lựa chọn', 'Tải file'];

// Field templates per form type. `dynamic` holds a human-readable condition.
export const FORM_FIELDS = {
  'Đơn xin nghỉ phép': [
    { id: 'leave_type', label: 'Hình thức nghỉ', type: 'Lựa chọn', required: true, dynamic: '' },
    { id: 'from_date', label: 'Từ ngày', type: 'Ngày', required: true, dynamic: '' },
    { id: 'to_date', label: 'Đến ngày', type: 'Ngày', required: true, dynamic: '' },
    { id: 'num_days', label: 'Số ngày nghỉ', type: 'Số', required: false, dynamic: 'Tính tự động từ Từ ngày - Đến ngày' },
    { id: 'reason', label: 'Lý do nghỉ phép', type: 'Văn bản', required: true, dynamic: '' },
    { id: 'maternity_type', label: 'Loại thai sản', type: 'Lựa chọn', required: false, dynamic: 'Hiển thị khi Hình thức nghỉ = Thai sản' },
    { id: 'attachment', label: 'Tài liệu đính kèm', type: 'Tải file', required: false, dynamic: '' },
  ],
  'Đơn làm thêm (OT)': [
    { id: 'ot_date', label: 'Ngày làm thêm', type: 'Ngày', required: true, dynamic: '' },
    { id: 'ot_start', label: 'Giờ bắt đầu', type: 'Ngày', required: true, dynamic: '' },
    { id: 'ot_end', label: 'Giờ kết thúc', type: 'Ngày', required: true, dynamic: '' },
    { id: 'ot_hours', label: 'Số giờ OT', type: 'Số', required: false, dynamic: 'Tính tự động từ giờ bắt đầu - kết thúc' },
    { id: 'ot_reason', label: 'Lý do làm thêm', type: 'Văn bản', required: true, dynamic: '' },
    { id: 'attachment', label: 'Tài liệu đính kèm', type: 'Tải file', required: false, dynamic: '' },
  ],
  'Đơn xin nghỉ thai sản': [
    { id: 'from_date', label: 'Từ ngày', type: 'Ngày', required: true, dynamic: '' },
    { id: 'to_date', label: 'Đến ngày', type: 'Ngày', required: true, dynamic: '' },
    { id: 'maternity_type', label: 'Loại thai sản', type: 'Lựa chọn', required: true, dynamic: '' },
    { id: 'child_count', label: 'Số con', type: 'Số', required: true, dynamic: '' },
    { id: 'reason', label: 'Ghi chú', type: 'Văn bản', required: false, dynamic: '' },
    { id: 'attachment', label: 'Tài liệu đính kèm', type: 'Tải file', required: true, dynamic: '' },
  ],
  'Đơn xin nghỉ việc': [
    { id: 'leave_date', label: 'Ngày nghỉ việc', type: 'Ngày', required: true, dynamic: '' },
    { id: 'reason', label: 'Lý do nghỉ việc', type: 'Văn bản', required: true, dynamic: '' },
    { id: 'handover', label: 'Người bàn giao', type: 'Văn bản', required: true, dynamic: '' },
    { id: 'attachment', label: 'Tài liệu đính kèm', type: 'Tải file', required: false, dynamic: '' },
  ],
  'Đơn xin ra ngoài': [
    { id: 'out_date', label: 'Ngày ra ngoài', type: 'Ngày', required: true, dynamic: '' },
    { id: 'out_start', label: 'Giờ ra', type: 'Ngày', required: true, dynamic: '' },
    { id: 'out_end', label: 'Giờ về', type: 'Ngày', required: true, dynamic: '' },
    { id: 'destination', label: 'Địa điểm', type: 'Văn bản', required: true, dynamic: '' },
    { id: 'reason', label: 'Lý do', type: 'Văn bản', required: true, dynamic: '' },
  ],
};

// Approval types (Section A)
export const APPROVAL_TYPES = [
  { id: 'hierarchy', label: 'Duyệt Phân cấp' },
  { id: 'chain', label: 'Duyệt theo Chuỗi quản lý (Động)' },
  { id: 'role', label: 'Duyệt theo Vai trò' },
  { id: 'specific', label: 'Chỉ định Đích danh' },
];

// Multi-approver rules (Section B)
export const MULTI_RULES = [
  { id: 'sequential', label: 'Duyệt tuần tự', desc: 'Duyệt lần lượt từng người' },
  { id: 'and', label: 'Duyệt song song - Đồng ý tất cả', desc: 'Yêu cầu tất cả phê duyệt' },
  { id: 'or', label: 'Duyệt song song - Chỉ cần 1 người', desc: 'Chỉ cần 1 người phê duyệt' },
];

// Initial workflow steps for "Đơn xin nghỉ phép"
export const INITIAL_WORKFLOW = [
  {
    id: 's1',
    name: 'Trưởng phòng duyệt',
    approvalType: 'hierarchy',
    hierarchyOption: 'manager',
    role: 'HR Admin',
    specificUser: 'Nguyễn Văn An',
    multiRule: 'sequential',
    timeoutEnabled: true,
    timeoutAction: 'return',
  },
  {
    id: 's2',
    name: 'HR Admin duyệt',
    approvalType: 'role',
    hierarchyOption: 'direct',
    role: 'HR Admin',
    specificUser: 'Trần Thị Bình',
    multiRule: 'and',
    timeoutEnabled: true,
    timeoutAction: 'escalate',
  },
  {
    id: 's3',
    name: 'Tổng Giám đốc phê duyệt',
    approvalType: 'specific',
    hierarchyOption: 'higher',
    role: 'Tổng Giám đốc',
    specificUser: 'Phạm Văn E',
    multiRule: 'or',
    timeoutEnabled: false,
    timeoutAction: 'return',
  },
];

// Zalo OA integration
export const ZALO_CONFIG = {
  status: 'connected',
  appId: '2948123456789',
  secretKey: '••••••••••••••••aB3x',
  oaId: '44971234567890',
  templates: [
    { id: 'new_request', name: 'Thông báo đơn mới', enabled: true },
    { id: 'approved', name: 'Đơn được phê duyệt', enabled: true },
    { id: 'returned', name: 'Đơn bị trả lại / từ chối', enabled: false },
  ],
};

// Timeout working-hours options
export const TIME_RULES = [
  { id: 'business', label: 'Chỉ tính trong giờ hành chính (8:00 - 17:30)' },
  { id: 'continuous', label: 'Tính 12 giờ liên tục (24/7)' },
];

export const SPECIFIC_USERS = ['Nguyễn Văn An', 'Trần Thị Bình', 'Lê Hải Dương', 'Phạm Văn E', 'Hoàng Thị Phương'];
export const APPROVAL_ROLES = ['HR Admin', 'Kế toán trưởng', 'Kế toán thanh toán', 'Hành chính văn phòng', 'Pháp chế (Legal)', 'Trưởng phòng CSKH', 'Giám đốc khối', 'Ban Giám đốc'];
