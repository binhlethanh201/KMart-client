import React from 'react';
import DepartmentCard from '../components/DepartmentCard';
import Pagination from '../../../components/Pagination';
import useDocumentTitle from '../../../hooks/useDocumentTitle';

export default function DepartmentDashboard() {
  useDocumentTitle('Cơ cấu tổ chức & Siêu thị');

  const departments = [
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
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBukvk0NSRlgg3be13SCIjI3cNKDYeFuDtpiJHXTCvl5FM9aSuPbL5_CgyUot5IcHbrMvsE4-Y8_GLl5DQwIGgwp-ms8r8u-6w15DDzcGY4Hl3tnIn-uQ1OOUCcQPV8U98wrlUpDIwb6vSVltVjuKtzz4ZyTYC7QapEcg2efHf3Pu9BQb_tgAwgHLkbpgLHrw_7uw5TwSrFBrXan2P-qpQcBcQAmOemArNZ9P5xdcPZtdqmryoFE_9e4w',
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAFWUrI411w84QXFclsMELsbeh6MeGccGRBxQx7ZNcvdgEr6dhS1B_MeAGsw6q-wOZrjMcMbmTKzl2xYYYtXvMJI_nqwoaxdioReCgS61a4H2TXk8h7XLifGhaHuQBSoQVarKmsOxOziQH4BnpX_6puUFBeQkBa4zhlx2RJaPmfn6SwpZjJ7nfVRBnZso_uYbdRZkorxaA86cx-c1dHuLqTqJ02QYkbKU-vRnSLCkqagHglZkrdEU6CTQ'
      ],
      extraCount: 12,
      memberCount: 14
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
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAha1YGiNKhOscyZewseJ8AnusUAwWiIwyKUkfF_vU9Si83tJSeZjxoR3DWDZnpffsgplV1idKCx5xJPZS60N8CP7J7E_UemigSV_vTk0SrTRrioZFb0lPRK5KaW8sPGLR9tYevYHUJ88ZcFjf4eoZma86sIpinwKheBruAQnEdkIOMg1nEfuOrHgcc1LyouW1U1OagBFinPePqYSem1lcQKtLWCAQc7jy99l7qUV_v3Zgx31vmkqw2Uw',
        'https://lh3.googleusercontent.com/aida-public/AB6AXuD6laJ8DW-ACj3XuK6bAZ8IiUd6DmDAmPLJdEoaERpyRA6k2FzRxIPELtIzolOlm1-bf3HDR6KZrX7clIuRHeZzZ8ddbj5BN6zboWKjK2i7xQR2akP08vUUZoTNJFktrcPMeHtR5kwl31Utfqpc63wflIIQlp-UMVcpUu7gX5p_vgWG0hbNIryPQWloho3_-qPi-46JxEVlqOfUNpIp9u5s19Tl3eJ18kAEvwacJNZGWG8rYok9eVHH3Q'
      ],
      extraCount: 45,
      memberCount: 47
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
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDiKaDAUy9EYSw2nYSHI5UR_6Tw5ftwQ8e5TVkymR6DtnfPgxmWhxO0IF3cLI6Y9epBcQ0zClNNn0qn8VYnxDXUvLjgGh8cVo1RgkSCSRSbPH4dtBPOfrKo4EfXpXvM-fURCwce6ej-XiCHFWieg19oXMgGoEEXuo8ZRtTYMkBggQZLpTgfQdJGBeKWQMcnevFISNt6dkKZh1F9YeDO56CSmOV1sw82KUq38EC3WkW1JNoB_8md4-OzdA'
      ],
      extraCount: 22,
      memberCount: 23
    },
    {
      id: 4,
      icon: 'storefront',
      status: 'Active',
      name: 'Kmart Siêu thị Trung tâm',
      code: 'ST-001',
      leaders: [
        { title: 'Cửa hàng trưởng', name: 'Trần Văn Q' },
      ],
      members: [
        'https://lh3.googleusercontent.com/aida-public/AB6AXuC2yQM8EpgFrvByN-zTiJc7v45eW9LhVKoZ5z2znX-o6xWhfYuS3MF_Zp4oFspgbI_pYqPk5WesV09r6yLEZSSHgNS2xBoGADpZcGo7uOeq8R1XtrgnxNJMcMWoZDKBKazM7wMm9AZ5YS5wtjen2z6WtkIK4E41Fwf0-XFh9ylLZ-zgkkmscJhuskVFro1orhogKwqEsGvtsWGAQJRu57LyYBOCfGU9kEUWQyOlQx6A9h-5k5yZaN4vGw'
      ],
      extraCount: 120,
      memberCount: 121
    }
  ];

  return (
    <div className="p-4 md:p-6 flex-1 overflow-y-auto min-h-0 bg-surface">
      <div className="mx-auto space-y-4 max-w-[1600px]">
        {/* Compact Action Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-container-low p-4 rounded-lg border border-outline-variant shadow-sm">
          <div>
            <h1 className="font-headline-md text-on-surface">Cơ cấu tổ chức &amp; Siêu thị</h1>
            <p className="font-body-md text-secondary text-sm">
              Quản lý danh sách các chi nhánh siêu thị và phòng ban trực thuộc hệ thống.
            </p>
          </div>
          <div className="flex gap-2">
            <button className="bg-surface text-on-surface border border-outline-variant hover:bg-surface-container px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">download</span>
              Xuất báo cáo
            </button>
            <button className="bg-primary text-on-primary hover:bg-primary-fixed-variant px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">add</span>
              Thêm đơn vị
            </button>
          </div>
        </div>

        {/* Action Bar (Filters & Search) - Tighter spacing */}
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative w-full sm:w-80">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-secondary text-[18px]">search</span>
              <input 
                className="w-full pl-9 pr-3 py-1.5 bg-surface border border-outline-variant rounded-md focus:ring-1 focus:ring-primary focus:border-primary text-sm outline-none placeholder:text-secondary" 
                placeholder="Tìm kiếm mã, tên đơn vị..." 
                type="text" 
              />
            </div>
            <select className="bg-surface border border-outline-variant rounded-md px-3 py-1.5 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary">
              <option>Loại đơn vị: Tất cả</option>
              <option>Siêu thị (Store)</option>
              <option>Phòng ban (Department)</option>
            </select>
            <select className="bg-surface border border-outline-variant rounded-md px-3 py-1.5 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary">
              <option>Trạng thái: Đang hoạt động</option>
              <option>Tất cả trạng thái</option>
            </select>
          </div>
        </div>

        {/* Department Grid - Original structure requested by user */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {departments.map((dept) => (
            <DepartmentCard 
              key={dept.id}
              icon={dept.icon}
              status={dept.status}
              name={dept.name}
              code={dept.code}
              leaders={dept.leaders}
              members={dept.members}
              extraCount={dept.extraCount}
              memberCount={dept.memberCount}
            />
          ))}
        </div>

        {/* Footer Pagination */}
        <div className="pt-4 mt-4 border-t border-outline-variant">
          <Pagination />
        </div>
      </div>
    </div>
  );
}
