// Shared department data for the list view, detail page, and request filtering.
// Moved out of DepartmentDashboard.jsx so list + detail + filtering share one source.

const A = (s) => `https://lh3.googleusercontent.com/aida-public/${s}`;

export const DEPARTMENTS = [
  {
    id: 1,
    icon: 'campaign',
    status: 'Active',
    name: 'Phòng Marketing',
    code: 'MKT-01',
    leaders: [
      { title: 'Trưởng phòng', name: 'Nguyễn Văn B' },
      { title: 'Phó phòng', name: 'Trần Thị C' },
    ],
    members: [
      A('AB6AXuBukvk0NSRlgg3be13SCIjI3cNKDYeFuDtpiJHXTCvl5FM9aSuPbL5_CgyUot5IcHbrMvsE4-Y8_GLl5DQwIGgwp-ms8r8u-6w15DDzcGY4Hl3tnIn-uQ1OOUCcQPV8U98wrlUpDIwb6vSVltVjuKtzz4ZyTYC7QapEcg2efHf3Pu9BQb_tgAwgHLkbpgLHrw_7uw5TwSrFBrXan2P-qpQcBcQAmOemArNZ9P5xdcPZtdqmryoFE_9e4w'),
      A('AB6AXuAFWUrI411w84QXFclsMELsbeh6MeGccGRBxQx7ZNcvdgEr6dhS1B_MeAGsw6q-wOZrjMcMbmTKzl2xYYYtXvMJI_nqwoaxdioReCgS61a4H2TXk8h7XLifGhaHuQBSoQVarKmsOxOziQH4BnpX_6puUFBeQkBa4zhlx2RJaPmfn6SwpZjJ7nfVRBnZso_uYbdRZkorxaA86cx-c1dHuLqTqJ02QYkbKU-vRnSLCkqagHglZkrdEU6CTQ'),
    ],
    extraCount: 12,
    memberCount: 14,
  },
  {
    id: 2,
    icon: 'code',
    status: 'Active',
    name: 'Khối Công Nghệ',
    code: 'TECH-02',
    leaders: [
      { title: 'Giám đốc', name: 'Lê Hải D' },
      { title: 'Phó GĐ', name: 'Phạm Văn E' },
    ],
    members: [
      A('AB6AXuAha1YGiNKhOscyZewseJ8AnusUAwWiIwyKUkfF_vU9Si83tJSeZjxoR3DWDZnpffsgplV1idKCx5xJPZS60N8CP7J7E_UemigSV_vTk0SrTRrioZFb0lPRK5KaW8sPGLR9tYevYHUJ88ZcFjf4eoZma86sIpinwKheBruAQnEdkIOMg1nEfuOrHgcc1LyouW1U1OagBFinPePqYSem1lcQKtLWCAQc7jy99l7qUV_v3Zgx31vmkqw2Uw'),
      A('AB6AXuD6laJ8DW-ACj3XuK6bAZ8iIuT6DmDAmPLJdEoaERpyRA6k2FzRxIPELtIzolOlm1-bf3HDR6KZrX7clIuRHeZzZ8ddbj5BN6zboWKjK2i7xQR2akP08vUUZoTNJFktrcPMeHtR5kwl31Utfqpc63wflIIQlp-UMVcpUu7gX5p_vgWG0hbNIryPQWloho3_-qPi-46JxEVlqOfUNpIp9u5s19Tl3eJ18kAEvwacJNZGWG8rYok9eVHH3Q'),
    ],
    extraCount: 45,
    memberCount: 47,
  },
  {
    id: 3,
    icon: 'support_agent',
    status: 'Active',
    name: 'Phòng CSKH',
    code: 'CS-03',
    leaders: [
      { title: 'Trưởng phòng', name: 'Hoàng Thị F' },
    ],
    members: [
      A('AB6AXuDiKaDAUyEYSw2nYSHI5UR_6Tw5ftwQ8e5TVTymR6DtnfPgxmWhxO0IF3cLI6Y9epBcQ0zClNNn0qn8VYnxDXUvLjgGh8cVo1RgkSCSRSbPH4dtBPOfrKo4EfXpXvM-fURCwce6ej-XiCHFWieg19oXMgGoEEXuo8ZRtTYMkBggQZLpTgfQdJGBeKWQMcnevFISNt6dkKZh1F9YeDO56CSmOV1sw82KUq38EC3WkW1JNoB_8md4-OzdA'),
    ],
    extraCount: 22,
    memberCount: 23,
  },
  {
    id: 4,
    icon: 'storefront',
    status: 'Inactive',
    name: 'Kmart Siêu thị Trung tâm',
    code: 'ST-001',
    leaders: [
      { title: 'Cửa hàng trưởng', name: 'Trần Văn Q' },
    ],
    members: [
      A('AB6AXuC2yQM8EpgFrvByN-zTiJc7v45eW9LhVKoZ5z2znX-o6xWhfYuS3MF_Zp4oFspgbJ_pYqPk5WesV09r6yLEZSSHgNS2xBoGADpZcGo7uOeq8R1XtrgnxNJMcMWoZDKBKazM7wMm9AZ5YS5wtjen2z6WtkIK4E41Fwf0-XFh9ylLZ-zgkkmscJhuskVFro1orhogKwqEsGvtsWGAQJRu57LyYBOCfGU9kEUWQyOlQx6A9h-5k5yZaN4vGw'),
    ],
    extraCount: 120,
    memberCount: 121,
  },
];

// Staff roster per department (Tab 2 of the detail page). ST-001 includes the
// 3 switchable approval-system users so the staff list lines up with the role switcher.
export const DEPT_STAFF = {
  1: [
    { id: 'MKT-0201', name: 'Nguyễn Văn B', role: 'Trưởng phòng', avatar: DEPARTMENTS[0].members[0], email: 'bvn@kmart.vn', status: 'active' },
    { id: 'MKT-0202', name: 'Trần Thị C', role: 'Phó phòng', avatar: DEPARTMENTS[0].members[1], email: 'ctt@kmart.vn', status: 'active' },
    { id: 'MKT-0203', name: 'Phạm Thu Hà', role: 'NV Marketing', avatar: DEPARTMENTS[0].members[0], email: 'hatp@kmart.vn', status: 'active' },
    { id: 'MKT-0204', name: 'Đỗ Minh Quân', role: 'NV Marketing', avatar: DEPARTMENTS[0].members[1], email: 'quandm@kmart.vn', status: 'inactive' },
  ],
  2: [
    { id: 'TEC-0301', name: 'Lê Hải D', role: 'Giám đốc', avatar: DEPARTMENTS[1].members[0], email: 'dhl@kmart.vn', status: 'active' },
    { id: 'TEC-0302', name: 'Phạm Văn E', role: 'Phó GĐ', avatar: DEPARTMENTS[1].members[1], email: 'evp@kmart.vn', status: 'active' },
    { id: 'TEC-0303', name: 'Vũ Thị Lan', role: 'Tech Lead', avatar: DEPARTMENTS[1].members[0], email: 'lanvt@kmart.vn', status: 'active' },
    { id: 'TEC-0304', name: 'Bùi Công Minh', role: 'Senior Dev', avatar: DEPARTMENTS[1].members[1], email: 'minhbc@kmart.vn', status: 'active' },
  ],
  3: [
    { id: 'CS-0401', name: 'Hoàng Thị F', role: 'Trưởng phòng', avatar: DEPARTMENTS[2].members[0], email: 'fth@kmart.vn', status: 'active' },
    { id: 'CS-0402', name: 'Ngô Bảo Anh', role: 'NV CSKH', avatar: DEPARTMENTS[2].members[0], email: 'anhnb@kmart.vn', status: 'active' },
    { id: 'CS-0403', name: 'Dương Thị Mai', role: 'NV CSKH', avatar: DEPARTMENTS[2].members[0], email: 'maidt@kmart.vn', status: 'inactive' },
  ],
  4: [
    { id: 'ST-0101', name: 'Trần Văn Quản Lý', role: 'Cửa hàng trưởng', avatar: A('AB6AXuBh1ygQwSXp0icdwi3YxjWlf6PNhOL5c6_DUIGrOwKCqGGv9euYAWS8npuuOUcznxljdT30qToRyWKe-jMxNGnuEn5YyjjKw8dCaRvtMVExX1Kijwoz-PqZsTAGEfROqeYrJKSIbayRFhPbPnBwZPlFcuP7yCajAy_l6dEP3P2FyquAzHTLzoKiZv-xf761zz6Q7HCsJtus3quTJAMu4OV8OUdRjJtPtP9COPlmT2UFf-HmmYud3Aq9Sw'), email: 'qltv@kmart.vn', status: 'active' },
    { id: 'ST-0102', name: 'Hoàng Lâm Anh', role: 'Nhân viên bán hàng', avatar: A('AB6AXuC2yQM8EpgFrvByN-zTiJc7v45eW9LhVKoZ5z2znX-o6xWhfYuS3MF_Zp4oFspgbJ_pYqPk5WesV09r6yLEZSSHgNS2xBoGADpZcGo7uOeq8R1XtrgnxNJMcMWoZDKBKazM7wMm9AZ5YS5wtjen2z6WtkIK4E41Fwf0-XFh9ylLZ-zgkkmscJhuskVFro1orhogKwqEsGvtsWGAQJRu57LyYBOCfGU9kEUWQyOlQx6A9h-5k5yZaN4vGw'), email: 'ahl@kmart.vn', status: 'active' },
    { id: 'ST-0103', name: 'Lê Hàn Tuệ Lâm', role: 'TGĐ / HR', avatar: A('AB6AXuAuwcOpyOzeDtjK_I-Oc3j5j842ijEco2eH44sraa_pBrT1xXCOB2tSYWC_8lmHflqEFTil2VsvzrmAdhbiBCOjLyaBLZySDFauQFNMn7PHNRUCR2DNSMBlbvk0bVzo4rXWQDCp4aU4wtgFuJme3ujDij7sBxLChoLqZdrvVKEReYy0n0Y17aiHkjGoG1xvdcDT_nvxWammJqw0pct2Y7tbpEXUzZA4pbctA2gv6r6Q24W58T07KqPMeQ'), email: 'lhtl@kmart.vn', status: 'active' },
    { id: 'ST-0104', name: 'Phan Quốc Việt', role: 'Thu ngân', avatar: DEPARTMENTS[3].members[0], email: 'vietpq@kmart.vn', status: 'active' },
    { id: 'ST-0105', name: 'Chu Thị Hồng', role: 'Nhân viên kho', avatar: DEPARTMENTS[3].members[0], email: 'hongct@kmart.vn', status: 'active' },
    { id: 'ST-0106', name: 'Mai Văn Tú', role: 'Bảo vệ', avatar: DEPARTMENTS[3].members[0], email: 'tumv@kmart.vn', status: 'inactive' },
  ],
};
