// Mock data for Quản lý Nhân sự. Vietnamese records, varied roles/depts/status.

export const DEPARTMENTS = [
  'Phòng Marketing',
  'Khối Công nghệ',
  'Phòng CSKH',
  'Kmart Siêu thị Trung tâm',
  'Phòng Nhân sự',
];

export const POSITIONS = [
  'Trưởng phòng',
  'Phó phòng',
  'Giám đốc',
  'Phó Giám đốc',
  'Cửa hàng trưởng',
  'Trưởng nhóm',
  'Nhân viên',
  'Cố vấn',
];

// Vai trò hệ thống - categorical badge colors.
// Project tokens where they map; Tailwind palette for the rest, kept uniform
// as "pastel container bg + 700-weight text" so sibling badges read consistently.
export const SYSTEM_ROLES = ['Admin', 'HR Admin', 'Trưởng phòng', 'Tổng Giám đốc', 'Nhân viên'];

export const ROLE_STYLES = {
  Admin: { dot: 'bg-purple-600', cls: 'bg-purple-50 text-purple-700' },
  'HR Admin': { dot: 'bg-blue-600', cls: 'bg-blue-50 text-blue-700' },
  'Trưởng phòng': { dot: 'bg-[#037847]', cls: 'bg-[#E8F8EE] text-[#037847]' },
  'Tổng Giám đốc': { dot: 'bg-[#D97706]', cls: 'bg-[#FEF3C7] text-[#B45309]' },
  'Nhân viên': { dot: 'bg-[#64748B]', cls: 'bg-[#F1F5F9] text-[#475569]' },
};

export const STATUS_STYLES = {
  active: { label: 'Đang hoạt động', dot: 'bg-[#037847]', cls: 'bg-[#E8F8EE] text-[#037847]' },
  inactive: { label: 'Ngừng hoạt động', dot: 'bg-[#64748B]', cls: 'bg-[#F1F5F9] text-[#475569]' },
};

const A = (name) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=128`;

export const EMPLOYEES = [
  {
    id: 'NV-0101',
    name: 'Nguyễn Văn An',
    avatar: A('Nguyễn Văn An'),
    email: 'an.nguyenvan@kmart.vn',
    phone: '0901 234 567',
    department: 'Phòng Nhân sự',
    position: 'Trưởng phòng',
    role: 'Admin',
    status: 'active',
    secondary: [
      { department: 'Khối Công nghệ', position: 'Cố vấn' },
      { department: 'Ban Dự án X', position: 'Trưởng nhóm' },
    ],
  },
  {
    id: 'NV-0102',
    name: 'Trần Thị Bình',
    avatar: A('Trần Thị Bình'),
    email: 'binh.tranthi@kmart.vn',
    phone: '0902 345 678',
    department: 'Phòng Nhân sự',
    position: 'Nhân viên',
    role: 'HR Admin',
    status: 'active',
    secondary: [],
  },
  {
    id: 'NV-0103',
    name: 'Lê Hải Dương',
    avatar: A('Lê Hải Dương'),
    email: 'duong.lehai@kmart.vn',
    phone: '0903 456 789',
    department: 'Phòng Marketing',
    position: 'Trưởng phòng',
    role: 'Trưởng phòng',
    status: 'active',
    secondary: [
      { department: 'Khối Công nghệ', position: 'Cố vấn' },
    ],
  },
  {
    id: 'NV-0104',
    name: 'Phạm Văn E',
    avatar: A('Phạm Văn E'),
    email: 'e.phamvan@kmart.vn',
    phone: '0904 567 890',
    department: 'Khối Công nghệ',
    position: 'Giám đốc',
    role: 'Tổng Giám đốc',
    status: 'active',
    secondary: [
      { department: 'Ban Dự án X', position: 'Trưởng ban' },
    ],
  },
  {
    id: 'NV-0105',
    name: 'Hoàng Thị Phương',
    avatar: A('Hoàng Thị Phương'),
    email: 'phuong.hoangthi@kmart.vn',
    phone: '0905 678 901',
    department: 'Phòng CSKH',
    position: 'Trưởng phòng',
    role: 'Trưởng phòng',
    status: 'active',
    secondary: [],
  },
  {
    id: 'NV-0106',
    name: 'Trần Văn Quyền',
    avatar: A('Trần Văn Quyền'),
    email: 'quyen.tranvan@kmart.vn',
    phone: '0906 789 012',
    department: 'Kmart Siêu thị Trung tâm',
    position: 'Cửa hàng trưởng',
    role: 'Nhân viên',
    status: 'active',
    secondary: [],
  },
  {
    id: 'NV-0107',
    name: 'Đặng Thị Giang',
    avatar: A('Đặng Thị Giang'),
    email: 'giang.dangthi@kmart.vn',
    phone: '0907 890 123',
    department: 'Phòng Marketing',
    position: 'Nhân viên',
    role: 'Nhân viên',
    status: 'inactive',
    secondary: [],
  },
  {
    id: 'NV-0108',
    name: 'Vũ Văn Hải',
    avatar: A('Vũ Văn Hải'),
    email: 'hai.vuvan@kmart.vn',
    phone: '0908 901 234',
    department: 'Khối Công nghệ',
    position: 'Trưởng nhóm',
    role: 'Nhân viên',
    status: 'active',
    secondary: [
      { department: 'Phòng Nhân sự', position: 'Cố vấn' },
    ],
  },
  {
    id: 'NV-0109',
    name: 'Bùi Thị Kim',
    avatar: A('Bùi Thị Kim'),
    email: 'kim.buithi@kmart.vn',
    phone: '0909 012 345',
    department: 'Phòng Nhân sự',
    position: 'Nhân viên',
    role: 'HR Admin',
    status: 'active',
    secondary: [],
  },
  {
    id: 'NV-0110',
    name: 'Ngô Văn Long',
    avatar: A('Ngô Văn Long'),
    email: 'long.ngovan@kmart.vn',
    phone: '0910 123 456',
    department: 'Kmart Siêu thị Trung tâm',
    position: 'Nhân viên',
    role: 'Nhân viên',
    status: 'inactive',
    secondary: [],
  },
];

export const EMPTY_EMPLOYEE = {
  id: '',
  name: '',
  avatar: '',
  email: '',
  phone: '',
  department: DEPARTMENTS[0],
  position: POSITIONS[6],
  role: 'Nhân viên',
  status: 'active',
  username: '',
  password: '',
  secondary: [],
};
