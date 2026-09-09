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
  Admin: 'bg-purple-100 text-purple-700',
  'HR Admin': 'bg-primary-container text-on-primary-container',
  'Trưởng phòng': 'bg-success-container text-on-success-container',
  'Tổng Giám đốc': 'bg-warning-container text-on-warning-container',
  'Nhân viên': 'bg-surface-container-high text-secondary',
};

export const STATUS_STYLES = {
  active: { label: 'Đang hoạt động', dot: 'bg-success', cls: 'bg-success-container text-on-success-container' },
  inactive: { label: 'Ngừng hoạt động', dot: 'bg-outline', cls: 'bg-surface-container-high text-secondary' },
};

const A = (s) => `https://lh3.googleusercontent.com/aida-public/${s}`;

export const EMPLOYEES = [
  {
    id: 'NV-0101',
    name: 'Nguyễn Văn An',
    avatar: A('AB6AXuCJ6rf1wZ7pfErOiSFy34dN8pdPp_NfG1jg3EERXkZuWBj9jrdw_3FRbyyJ73mEm4Nvyazc3xQc3JDAt41BL-9Mus5LHkhAdeO_OvTLnfV1OQC9FFOwjfI0BI7i18QHdLZSYCSlyGBA4TA0lk-HyBc2PEoLNPzXBW1qeDj7-R3zUvYsiwOSpU5-ccS53k4vPH9cS35WjkK1XgRDJ6dXYwmT-B92NiH5k4lr9iGXjmWIb9kiB9ejOdGB4DQ'),
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
    avatar: A('AB6AXuAaC1M1nYSCTyFw5krUnP7nktVXkbFReo_PG6Q0QT4Jp0Jl1D3FS71J0sfunslk17aZkVcF8l87RQq-jzvWkoDmJbteULjW66v6zkDYU0x-o6OOygLcngVFtrymWwSNOLiJHh2sJSJBf9hWwNWOck3AX-sQbDUc7itUHPFXD5U1hzKw3lSCnIYzwiyMXGm2FN40789AG07ZxKfhJPP-v__InKvHPc-44ZvGUAIcXcC2xAJraBb9y5wjMg'),
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
    avatar: A('AB6AXuBukvk0NSRlgg3be13SCIjI3cNKDYeFuDtpiJHXTCvl5FM9aSuPbL5_CgyUot5IcHbrMvsE4-Y8_GLl5DQwIGgwp-ms8r8u-6w15DDzcGY4Hl3tnIn-uQ1OOUCcQPV8U98wrlUpDIwb6vSVltVjuKtzz4ZyTYC7QapEcg2efHf3Pu9BQb_tgAwgHLkbpgLHrw_7uw5TwSrFBrXan2P-qpQcBcQAmOemArNZ9P5xdcPZtdqmryoFE_9e4w'),
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
    avatar: A('AB6AXuAha1YGiNKhOscyZewseJ8AnusUAwWiIwyKUkfV_vU9Si83tJSeZjxoR3DWDZnpffsgplV1idKCx5xJPZS60N8CP7J7E_UemigSV_vTk0SrTRrioZFb0lPRK5KaW8sPGLR9tYevYHUJ88ZcJjf4eoZma86sIpinwKheBruAQnEdkIOMg1nEfuOrHgcc1LyouW1U1OagBFinPePqYSem1lcQKtLWCAQc7jy99l7qUV_v3Zgx31vmkqw2Uw'),
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
    avatar: A('AB6AXuDiKaDAUyEYSw2nYSHI5UR_6Tw5ftwQ8e5TVkymR6DtnfPgxmWhxO0IF3cLI6Y9epBcQ0zClNNn0qn8VYnxDXUvLjgGh8cVo1RgkSCSRSbPH4dtBPOfrKo4EfXpXvM-fURCwce6ej-XiCHFWieg19oXMgGoEEXuo8ZRtTYMkBggQZLpTgfQdJGBeKWQMcnevFISNt6dkZZh1F9YeDO56CSmOV1sw82KUq38EC3WkW1JNo_8md4-OzdA'),
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
    avatar: A('AB6AXuC2yQM8EpgFrvByN-zTiJc7v45eW9LhVKoZ5z2znX-o6xWhfYuS3MF_Zp4oFspgbJ_pYqPk5WesV09r6yLEZSSHgNS2xBoGADpZcGo7uOeq8R1XtrgnxNJMcMWoZDKBKazM7wWm9AZ5YS5wtjen2z6WtkIK4E41Fwf0-XFh9ylLZ-zgkkmscJhuskVFro1orhogKwqEsGvtsWGAQJRu57LyYBOCfGU9kEUWQyOlQx6A9h-5k5yZaN4vGw'),
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
    avatar: A('AB6AXuD6laJ8DW-ACj3XuK6bAZ8IiUd6DmDAmPLJdEoaERpyRA6k2FzRxIPELtIzolOlm1-bf3HDR6KZrX7clIuRHeZzZ8ddbj5BN6zboWKjK2i7xQR2akP08vUUZoTNJFktrcPMeHtR5kwl31Utfqpc63wflIIQlp-UMVcpUu7gX5p_vgWG0hbNIryPQWloho3_-qPi4-46JxEVlqOfUNpIp9u5s19Tl3eJ18kAEvwacJNZGWG8rYok9eVHH3Q'),
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
    avatar: A('AB6AXuDzwBtZniefNoZtxuHEt9-phXzliOGPKvosGgnaIkpiuS6GBKz_YJc2h9k2IOoTJMyB61kVcupzuiXZgPnic_qGuRrD7MwzbBAe419QBwgzDKFbVhX2WWYKzTCAY4X7lZ584Hh8sSF9YfZwuXPTV7dbTbOSFif4xgcqd-NA4Lz3sYJkLgqJrMLcJaRxfUa2BuEOZkLhkve509W7HNTS2mrnW-EfZ5wYwNXDompk24z4VbRgaUPfwFAqiw'),
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
    avatar: A('AB6AXuCxcOUvOanXvFrCu-cB92LQ9fREu3GippoasyPNIsVecqvmQS2_vf-sQ6jUtVd7rdRkXNv7Vd4mnDpcDK5WO3mlYJEjWUH1DXJovI1IsQmsAryczHTpoRD82cz_ePf6xKTclD0p4DUVcvFbmXEksRJeIvxske_4zM73b1MRYtmNSQ1RdnBVYx5HelSx5Hc_wfiQhn6mjDqtczkWhtu9Tr4XwncuSWP6A5yE34BrivlpPRoXh0zngrS9PQ'),
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
    avatar: A('AB6AXuCpd-a7S68cC6pmJdeau9eKmaKEjspeDNfx0D1d7B908ssyvKGCK3MS3nsjdwZST1C20qiZb0jeJfAU2ZKMtIL29DECuc-yAOdReutZ8H2P3kUUuA0g6ZT3wafKdSa9jGsPlfHqFUmyciDPEPTXx57vD1qXcL9rNijsxfSMYFaoA8XUyeBfY6wrI-qzVadb2xtRnYMe3_zNRRQM2WyUZttfpyEUKifR6Qs6Ou4Ke53cIwnYQfrSyEpV3A'),
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
