import React, { useState } from 'react';
import DepartmentCard from '../components/DepartmentCard';
import AddDepartmentModal from '../components/AddDepartmentModal';
import Pagination from '../../../components/Pagination';
import useDocumentTitle from '../../../hooks/useDocumentTitle';
import { useApproval } from '../../../context/useApproval';

export default function DepartmentDashboard() {
  useDocumentTitle('Cơ cấu tổ chức & Siêu thị');
  const { departments } = useApproval();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
    <div className="p-4 md:p-6 flex-1 overflow-y-auto min-h-0 bg-surface">
      <div className="w-full space-y-4">
        {/* Compact Action Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-container-low p-4 rounded-lg border border-outline-variant shadow-sm">
          <div>
            <h1 className="font-headline-md text-on-surface">Cơ cấu tổ chức &amp; Siêu thị</h1>

          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setModalOpen(true)}
              className="bg-primary text-on-primary hover:bg-primary-fixed-variant px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              Thêm phòng ban
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
              id={dept.id}
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

      {modalOpen && <AddDepartmentModal onClose={() => setModalOpen(false)} />}
    </>
  );
}
