// Seed data for the in-memory approval system.
// 3 switchable users + a small set of requests with full workflow state.

const A = (s) => `https://lh3.googleusercontent.com/aida-public/${s}`;

export const USERS = [
  {
    id: 'u_hla',
    name: 'Hoàng Lâm Anh',
    role: 'Nhân viên',
    subtitle: 'Người tạo đơn',
    departmentId: 4,
    avatar: A('AB6AXuC2yQM8EpgFrvByN-zTiJc7v45eW9LhVKoZ5z2znX-o6xWhfYuS3MF_Zp4oFspgbJ_pYqPk5WesV09r6yLEZSSHgNS2xBoGADpZcGo7uOeq8R1XtrgnxNJMcMWoZDKBKazM7wMm9AZ5YS5wtjen2z6WtkIK4E41Fwf0-XFh9ylLZ-zgkkmscJhuskVFro1orhogKwqEsGvtsWGAQJRu57LyYBOCfGU9kEUWQyOlQx6A9h-5k5yZaN4vGw'),
  },
  {
    id: 'u_tvql',
    name: 'Trần Văn Quản Lý',
    role: 'Trưởng phòng',
    subtitle: 'Người duyệt Cấp 1',
    departmentId: 4,
    avatar: A('AB6AXuBh1ygQwSXp0icdwi3YxjWlf6PNhOL5c6_DUIGrOwKCqGGv9euYAWS8npuuOUcznxljdT30qToRyYKe-jMxNGnuEn5YyjjKw8dCaRvtMVExX1Kijwoz-PqZsTAGEfROqeYrJKSIbayRFhPbPnBwZPlFcuP7yCajAy_l6dEP3P2FyquAzHTLzoKiZv-xf761zz6Q7HCsJtus3quTJAMu4OV8OUdRjJtPtP9COPlmT2UFf-HmmYud3Aq9Sw'),
  },
  {
    id: 'u_lhtl',
    name: 'Lê Hàn Tuệ Lâm',
    role: 'TGĐ / HR',
    subtitle: 'Người duyệt Cấp 2',
    departmentId: 4,
    avatar: A('AB6AXuAuwcOpyOzeDtjK_I-Oc3j5j842ijEco2eH44sraa_pBrT1xXCOB2tSYWC_8lmHflqEFTil2VsvzrmAdhbiBCOjLyaBLZySDFauQFNMn7PHNRUCR2DNSMBlbvk0bVzo4rXWQDCp4aU4wtgFuJme3ujDij7sBxLChoLqZdrvVKEReYy0n0Y17aiHkjGoG1xvdcDT_nvxWammJqw0pct2Y7tbpEXUzZA4pbctA2gv6r6Q24W58T07KqPMeQ'),
  },
  // Display-only staff (not in the role switcher) used as request creators
  // so other departments have realistic sample requests on their detail pages.
  {
    id: 'u_mkt',
    name: 'Phạm Thu Hà',
    role: 'NV Marketing',
    subtitle: 'Phòng Marketing',
    departmentId: 1,
    switchable: false,
    avatar: A('AB6AXuBukvk0NSRlgg3be13SCIjI3cNKDYeFuDtpiJHXTCvl5FM9aSuPbL5_CgyUot5IcHbrMvsE4-Y8_GLl5DQwIGgwp-ms8r8u-6w15DDzcGY4Hl3tnIn-uQ1OOUCcQPV8U98wrlUpDIwb6vSVltVjuKtzz4ZyTYC7QapEcg2efHf3Pu9BQb_tgAwgHLkbpgLHrw_7uw5TwSrFBrXan2P-qpQcBcQAmOemArNZ9P5xdcPZtdqmryoFE_9e4w'),
  },
  {
    id: 'u_tech',
    name: 'Vũ Thị Lan',
    role: 'Tech Lead',
    subtitle: 'Khối Công Nghệ',
    departmentId: 2,
    switchable: false,
    avatar: A('AB6AXuAha1YGiNKhOscyZewseJ8AnusUAwWiIwyKUkfF_vU9Si83tJSeZjxoR3DWDZnpffsgplV1idKCx5xJPZS60N8CP7J7E_UemigSV_vTk0SrTRrioZFb0lPRK5KaW8sPGLR9tYevYHUJ88ZcFjf4eoZma86sIpinwKheBruAQnEdkIOMg1nEfuOrHgcc1LyouW1U1OagBFinPePqYSem1lcQKtLWCAQc7jy99l7qUV_v3Zgx31vmkqw2Uw'),
  },
  {
    id: 'u_cs',
    name: 'Ngô Bảo Anh',
    role: 'NV CSKH',
    subtitle: 'Phòng CSKH',
    departmentId: 3,
    switchable: false,
    avatar: A('AB6AXuDiKaDAUyEYSw2nYSHI5UR_6Tw5ftwQ8e5TVTymR6DtnfPgxmWhxO0IF3cLI6Y9epBcQ0zClNNn0qn8VYnxDXUvLjgGh8cVo1RgkSCSRSbPH4dtBPOfrKo4EfXpXvM-fURCwce6ej-XiCHFWieg19oXMgGoEEXuo8ZRtTYMkBggQZLpTgfQdJGBeKWQMcnevFISNt6dkKZh1F9YeDO56CSmOV1sw82KUq38EC3WkW1JNoB_8md4-OzdA'),
  },
];

export const REQUEST_TYPES = [
  'Đi muộn, về sớm',
  'Nghỉ phép năm',
  'Mua sắm văn phòng phẩm',
  'Đăng ký công tác',
  'Xin nghỉ việc',
];

// Approval chain per request type (user ids). Realistic hierarchy.
export const WORKFLOW_BY_TYPE = {
  'Đi muộn, về sớm': ['u_tvql', 'u_lhtl'],
  'Nghỉ phép năm': ['u_tvql', 'u_lhtl'],
  'Mua sắm văn phòng phẩm': ['u_tvql', 'u_lhtl'],
  'Đăng ký công tác': ['u_tvql', 'u_lhtl'],
  'Xin nghỉ việc': ['u_tvql', 'u_lhtl'],
};

// Role label shown for a step (derived from the approver).
export const STEP_ROLE = {
  u_tvql: 'Quản lý trực tiếp (Cấp 1)',
  u_lhtl: 'Nhân sự Hội sở (Cấp 2)',
};

const baseFields = (reason) => ({ reason, attachment: null, startTime: '', endTime: '', impact: 'Không ảnh hưởng' });

export const SEED_REQUESTS = [
  {
    id: 'REQ-1042',
    title: 'Đơn xin về sớm',
    type: 'Đi muộn, về sớm',
    creatorId: 'u_hla',
    departmentId: 4,
    createdAt: '26/08/2026 09:00',
    status: 'pending',
    currentStep: 1,
    fields: {
      ...baseFields('Việc gia đình cần giải quyết gấp vào buổi chiều (nhà trường gọi đón con do ốm đột xuất). Đã bàn giao ca làm việc cho Nguyễn Văn Phụ Tá.'),
      startTime: '26/08/2026 14:00',
      endTime: '26/08/2026 17:30',
      attachment: 'giay_xac_nhan.pdf (1.2 MB)',
    },
    steps: [
      { approverId: 'u_tvql', status: 'approved', actedAt: '26/08/2026 10:15' },
      { approverId: 'u_lhtl', status: 'pending', actedAt: null },
    ],
    comments: [
      { userId: 'u_tvql', text: 'Đã nhận được thông tin bàn giao ca. Anh duyệt bước 1. Khối HR check lại định mức phép năm của bạn này nhé.', at: '26/08/2026 10:45' },
    ],
    history: [
      { at: '26/08/2026 10:45', text: 'Trần Văn Quản Lý đã thêm bình luận.', type: 'comment' },
      { at: '26/08/2026 10:15', text: 'Trần Văn Quản Lý đã thay đổi trạng thái thành Đã duyệt (Cấp 1).', type: 'approve' },
      { at: '26/08/2026 09:00', text: 'Hoàng Lâm Anh đã tạo yêu cầu REQ-1042. Gửi email thông báo cho cấp quản lý.', type: 'create' },
    ],
  },
  {
    id: 'REQ-1043',
    title: 'Đơn xin nghỉ phép năm',
    type: 'Nghỉ phép năm',
    creatorId: 'u_hla',
    departmentId: 4,
    createdAt: '27/08/2026 08:30',
    status: 'pending',
    currentStep: 0,
    fields: {
      ...baseFields('Nghỉ phép năm để về quê thăm gia đình 3 ngày. Đã bàn giao công việc đầy đủ.'),
      startTime: '02/09/2026 00:00',
      endTime: '04/09/2026 23:59',
    },
    steps: [
      { approverId: 'u_tvql', status: 'pending', actedAt: null },
      { approverId: 'u_lhtl', status: 'pending', actedAt: null },
    ],
    comments: [],
    history: [
      { at: '27/08/2026 08:30', text: 'Hoàng Lâm Anh đã tạo yêu cầu REQ-1043.', type: 'create' },
    ],
  },
  {
    id: 'REQ-1044',
    title: 'Đơn làm thêm giờ (OT)',
    type: 'Đăng ký công tác',
    creatorId: 'u_tvql',
    departmentId: 4,
    createdAt: '25/08/2026 16:00',
    status: 'approved',
    currentStep: 1,
    fields: {
      ...baseFields('Làm thêm giờ triển khai chương trình khuyến mãi cuối tuần.'),
      startTime: '25/08/2026 18:00',
      endTime: '25/08/2026 22:00',
    },
    steps: [
      { approverId: 'u_lhtl', status: 'approved', actedAt: '25/08/2026 17:30' },
    ],
    comments: [
      { userId: 'u_lhtl', text: 'Đã duyệt. Lưu ý bảo hiểm lao động cho nhân sự làm đêm.', at: '25/08/2026 17:30' },
    ],
    history: [
      { at: '25/08/2026 17:30', text: 'Lê Hàn Tuệ Lâm đã thay đổi trạng thái thành Đã duyệt.', type: 'approve' },
      { at: '25/08/2026 16:00', text: 'Trần Văn Quản Lý đã tạo yêu cầu REQ-1044.', type: 'create' },
    ],
  },
  {
    id: 'REQ-1045',
    title: 'Đơn xin nghỉ việc',
    type: 'Xin nghỉ việc',
    creatorId: 'u_hla',
    departmentId: 4,
    createdAt: '20/08/2026 14:00',
    status: 'rejected',
    currentStep: 0,
    rejectReason: 'Vui lòng làm việc với HR để hoàn tất phỏng vấn nghỉ việc trước khi nộp đơn chính thức.',
    fields: {
      ...baseFields('Xin nghỉ việc vì lý do cá nhân, đã tìm được công việc mới phù hợp định hướng phát triển.'),
      startTime: '15/09/2026 00:00',
      endTime: '',
    },
    steps: [
      { approverId: 'u_tvql', status: 'rejected', actedAt: '20/08/2026 15:00' },
      { approverId: 'u_lhtl', status: 'pending', actedAt: null },
    ],
    comments: [],
    history: [
      { at: '20/08/2026 15:00', text: 'Trần Văn Quản Lý đã từ chối. Lý do: Vui lòng làm việc với HR để hoàn tất phỏng vấn nghỉ việc.', type: 'reject' },
      { at: '20/08/2026 14:00', text: 'Hoàng Lâm Anh đã tạo yêu cầu REQ-1045.', type: 'create' },
    ],
  },
  // --- Sample requests for other departments (Phòng Marketing / Khối Công Nghệ / Phòng CSKH) ---
  {
    id: 'REQ-1046',
    title: 'Đề xuất nghỉ phép năm Q4',
    type: 'Nghỉ phép năm',
    creatorId: 'u_mkt',
    departmentId: 1,
    createdAt: '08/09/2026 14:20',
    status: 'pending',
    currentStep: 1,
    fields: {
      ...baseFields('Nghỉ phép năm 2 ngày để đón gia đình dịp lễ.'),
      startTime: '10/09/2026 00:00',
      endTime: '11/09/2026 23:59',
    },
    steps: [
      { approverId: 'u_tvql', status: 'approved', actedAt: '08/09/2026 15:00' },
      { approverId: 'u_lhtl', status: 'pending', actedAt: null },
    ],
    comments: [
      { userId: 'u_tvql', text: 'Đã duyệt cấp 1. HR kiểm tra lại định mức phép năm còn của bạn này nhé.', at: '08/09/2026 15:00' },
    ],
    history: [
      { at: '08/09/2026 15:00', text: 'Trần Văn Quản Lý đã thêm bình luận.', type: 'comment' },
      { at: '08/09/2026 15:00', text: 'Trần Văn Quản Lý đã thay đổi trạng thái thành Đã duyệt (Cấp 1).', type: 'approve' },
      { at: '08/09/2026 14:20', text: 'Phạm Thu Hà đã tạo yêu cầu REQ-1046.', type: 'create' },
    ],
  },
  {
    id: 'REQ-1047',
    title: 'Đề xuất mua sắm văn phòng phẩm',
    type: 'Mua sắm văn phòng phẩm',
    creatorId: 'u_mkt',
    departmentId: 1,
    createdAt: '05/09/2026 09:00',
    status: 'approved',
    currentStep: 1,
    fields: {
      ...baseFields('Hết vật tư sticker, bút, giấy note cho chiến dịch lễ.'),
      startTime: '05/09/2026 09:00',
      endTime: '05/09/2026 18:00',
      attachment: 'bao_gia_vpp.pdf (480 KB)',
    },
    steps: [
      { approverId: 'u_tvql', status: 'approved', actedAt: '05/09/2026 10:00' },
      { approverId: 'u_lhtl', status: 'approved', actedAt: '05/09/2026 14:30' },
    ],
    comments: [
      { userId: 'u_lhtl', text: 'Đã duyệt. Lưu ý không vượt ngân sách phòng quý này.', at: '05/09/2026 14:30' },
    ],
    history: [
      { at: '05/09/2026 14:30', text: 'Lê Hàn Tuệ Lâm đã thay đổi trạng thái thành Đã duyệt.', type: 'approve' },
      { at: '05/09/2026 10:00', text: 'Trần Văn Quản Lý đã thay đổi trạng thái thành Đã duyệt (Cấp 1).', type: 'approve' },
      { at: '05/09/2026 09:00', text: 'Phạm Thu Hà đã tạo yêu cầu REQ-1047.', type: 'create' },
    ],
  },
  {
    id: 'REQ-1048',
    title: 'Đơn đi muộn về sớm (họp remote tối)',
    type: 'Đi muộn, về sớm',
    creatorId: 'u_tech',
    departmentId: 2,
    createdAt: '07/09/2026 20:00',
    status: 'pending',
    currentStep: 1,
    fields: {
      ...baseFields('Họp đồng bộ với team onsite qua đêm, sáng sau vào muộn 1 tiếng.'),
      startTime: '08/09/2026 09:00',
      endTime: '08/09/2026 17:30',
    },
    steps: [
      { approverId: 'u_tvql', status: 'approved', actedAt: '07/09/2026 21:00' },
      { approverId: 'u_lhtl', status: 'pending', actedAt: null },
    ],
    comments: [],
    history: [
      { at: '07/09/2026 21:00', text: 'Trần Văn Quản Lý đã thay đổi trạng thái thành Đã duyệt (Cấp 1).', type: 'approve' },
      { at: '07/09/2026 20:00', text: 'Vũ Thị Lan đã tạo yêu cầu REQ-1048.', type: 'create' },
    ],
  },
  {
    id: 'REQ-1049',
    title: 'Đăng ký công tác triển khai máy POS',
    type: 'Đăng ký công tác',
    creatorId: 'u_tech',
    departmentId: 2,
    createdAt: '01/09/2026 08:00',
    status: 'approved',
    currentStep: 1,
    fields: {
      ...baseFields('Đi siêu thị Cầu Giấy nâng cấp phần mềm POS cuối tuần.'),
      startTime: '06/09/2026 08:00',
      endTime: '06/09/2026 18:00',
    },
    steps: [
      { approverId: 'u_tvql', status: 'approved', actedAt: '01/09/2026 09:30' },
      { approverId: 'u_lhtl', status: 'approved', actedAt: '01/09/2026 10:00' },
    ],
    comments: [
      { userId: 'u_lhtl', text: 'Lưu ý bảo hiểm lao động khi ra cửa hàng.', at: '01/09/2026 10:00' },
    ],
    history: [
      { at: '01/09/2026 10:00', text: 'Lê Hàn Tuệ Lâm đã thay đổi trạng thái thành Đã duyệt.', type: 'approve' },
      { at: '01/09/2026 09:30', text: 'Trần Văn Quản Lý đã thay đổi trạng thái thành Đã duyệt (Cấp 1).', type: 'approve' },
      { at: '01/09/2026 08:00', text: 'Vũ Thị Lan đã tạo yêu cầu REQ-1049.', type: 'create' },
    ],
  },
  {
    id: 'REQ-1050',
    title: 'Đơn xin nghỉ việc',
    type: 'Xin nghỉ việc',
    creatorId: 'u_cs',
    departmentId: 3,
    createdAt: '28/08/2026 11:00',
    status: 'rejected',
    currentStep: 0,
    rejectReason: 'Chưa hoàn tất phỏng vấn nghỉ việc với HR. Vui lòng liên hệ bộ phận nhân sự trước khi nộp lại.',
    fields: {
      ...baseFields('Chuyển công tác sang công ty khác gần nhà hơn.'),
      startTime: '30/09/2026 00:00',
      endTime: '',
    },
    steps: [
      { approverId: 'u_tvql', status: 'rejected', actedAt: '28/08/2026 14:00' },
      { approverId: 'u_lhtl', status: 'pending', actedAt: null },
    ],
    comments: [],
    history: [
      { at: '28/08/2026 14:00', text: 'Trần Văn Quản Lý đã từ chối. Lý do: Chưa hoàn tất phỏng vấn nghỉ việc với HR.', type: 'reject' },
      { at: '28/08/2026 11:00', text: 'Ngô Bảo Anh đã tạo yêu cầu REQ-1050.', type: 'create' },
    ],
  },
  {
    id: 'REQ-1051',
    title: 'Đơn xin nghỉ phép năm',
    type: 'Nghỉ phép năm',
    creatorId: 'u_cs',
    departmentId: 3,
    createdAt: '09/09/2026 07:30',
    status: 'pending',
    currentStep: 0,
    fields: {
      ...baseFields('Nghỉ phép 2 ngày chăm sóc con ốm đột xuất.'),
      startTime: '11/09/2026 00:00',
      endTime: '12/09/2026 23:59',
    },
    steps: [
      { approverId: 'u_tvql', status: 'pending', actedAt: null },
      { approverId: 'u_lhtl', status: 'pending', actedAt: null },
    ],
    comments: [],
    history: [
      { at: '09/09/2026 07:30', text: 'Ngô Bảo Anh đã tạo yêu cầu REQ-1051.', type: 'create' },
    ],
  },
];

export const STATUS_META = {
  pending: { label: 'Đang chờ duyệt', badge: 'bg-warning-container text-on-warning-container border-warning/20', dot: 'bg-warning' },
  approved: { label: 'Đã phê duyệt', badge: 'bg-success-container text-on-success-container border-success/20', dot: 'bg-success' },
  rejected: { label: 'Từ chối / Trả về', badge: 'bg-error-container text-on-error-container border-error/20', dot: 'bg-error' },
  returned_timeout: { label: 'Trả về (quá hạn 12h)', badge: 'bg-error-container text-on-error-container border-error/20', dot: 'bg-error' },
};
