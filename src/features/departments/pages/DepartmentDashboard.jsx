import React, { useState } from 'react';
import DepartmentCard from '../components/DepartmentCard';
import AddDepartmentModal from '../components/AddDepartmentModal';
import EditDepartmentModal from '../components/EditDepartmentModal';
import Pagination from '../../../components/Pagination';
import useDocumentTitle from '../../../hooks/useDocumentTitle';
import { useApproval } from '../../../context/useApproval';
import { useI18n } from '../../../i18n/I18nProvider';
import { FILTER_SELECT_CLS, FILTER_SEARCH_CLS, FILTER_SEARCH_ICON_CLS } from '../../../styles/filterControls';

export default function DepartmentDashboard() {
  const { t } = useI18n();
  useDocumentTitle(t('Cơ cấu tổ chức & Siêu thị'));
  const { departments, toggleDepartmentStatus, deleteDepartment, currentUser, hasPermission } = useApproval();

  // Use hasPermission if available, fallback to role check
  const canManageDepts = hasPermission ? hasPermission('DEPARTMENT_MANAGE') : currentUser?.role === 'ADMIN';

  const [modalOpen, setModalOpen] = useState(false);
  const [editDept, setEditDept] = useState(null);

  const canEdit = canManageDepts;


  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('active');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  // Computed filtered list
  const filteredDepartments = departments.filter((dept) => {
    // 0. Role-based visibility
    if (currentUser?.role !== 'ADMIN' && currentUser?.role !== 'HR') {
      const userDeptIds = currentUser?.allPositions?.map(p => p.departmentId) || [];
      if (!userDeptIds.includes(dept.id)) {
        return false;
      }
    }

    // 1. Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!dept.name.toLowerCase().includes(q) && !dept.code.toLowerCase().includes(q)) {
        return false;
      }
    }
    // 2. Type filter
    if (filterType !== 'all') {
      if (dept.type !== filterType) return false;
    }
    // 3. Status filter
    if (filterStatus !== 'all') {
      const isActive = dept.status.toLowerCase() === 'active';
      if (filterStatus === 'active' && !isActive) return false;
      if (filterStatus === 'inactive' && isActive) return false;
    }
    return true;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredDepartments.length / ITEMS_PER_PAGE) || 1;

  // Ensure current page is valid after filtering
  React.useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const paginatedDepartments = filteredDepartments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <>
      <div className="p-4 md:p-6 flex-1 overflow-y-auto min-h-0 bg-background">
        <div className="w-full space-y-4">
          {/* Compact Action Header — BE-81: trước đây dùng `bg-surface-container-low` (#f8fafc, ngả
              xanh) nên thẻ tiêu đề lệch tông với nền ấm #f6f6f4 của trang; nay dùng đúng tông ấm. */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#f6f6f4] p-4 rounded-lg border border-outline-variant shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-[24px]">account_tree</span>
              </div>
              <h1 className="text-2xl font-bold text-on-surface tracking-tight">{t('Cơ cấu tổ chức & Siêu thị')}</h1>
            </div>
            <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
              {canEdit && (
                <button
                  onClick={() => setModalOpen(true)}
                  className="w-full sm:w-auto justify-center bg-primary text-on-primary hover:bg-primary-fixed-variant px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  {t('Thêm phòng ban')}
                </button>
              )}
            </div>
          </div>

          {/* Action Bar (Filters & Search) - Tighter spacing */}
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative w-full sm:w-80">
                <span className={FILTER_SEARCH_ICON_CLS}>search</span>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={FILTER_SEARCH_CLS}
                  placeholder={t('Tìm kiếm mã, tên đơn vị...')}
                  type="text"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className={FILTER_SELECT_CLS}
              >
                <option value="all">{t('Loại đơn vị: Tất cả')}</option>
                <option value="Phòng ban">{t('Phòng ban')}</option>
                <option value="Khối chuyên môn">{t('Khối chuyên môn')}</option>
                <option value="Siêu thị / Chi nhánh">{t('Siêu thị / Chi nhánh')}</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={FILTER_SELECT_CLS}
              >
                <option value="all">{t('Trạng thái: Tất cả')}</option>
                <option value="active">{t('Đang hoạt động')}</option>
                <option value="inactive">{t('Ngừng hoạt động')}</option>
              </select>
            </div>
          </div>

          {/* Department Grid */}
          {filteredDepartments.length === 0 ? (
            <div className="py-12 text-center text-secondary border border-dashed border-outline-variant rounded-lg bg-surface-container-lowest">
              <span className="material-symbols-outlined text-[48px] opacity-20 mb-3">account_tree</span>
              <p className="text-sm">{t('Không tìm thấy đơn vị nào phù hợp với bộ lọc.')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedDepartments.map((dept) => (
                <DepartmentCard
                  key={dept.id}
                  id={dept.id}
                  icon={dept.icon}
                  iconImage={dept.iconImage}
                  status={dept.status}
                  name={dept.name}
                  code={dept.code}
                  leaders={dept.leaders}
                  members={dept.members}
                  memberNames={dept.memberNames}
                  extraCount={dept.extraCount}
                  memberCount={dept.memberCount}
                  canEdit={canEdit}
                  onEdit={() => setEditDept(dept)}
                  onToggleStatus={() => toggleDepartmentStatus(dept.id)}
                  onDelete={() => {
                    if (window.confirm(`Bạn có chắc muốn xóa đơn vị "${dept.name}" không? Thao tác này không thể hoàn tác.`)) {
                      deleteDepartment(dept.id);
                    }
                  }}
                />
              ))}
            </div>
          )}

          {/* Footer Pagination */}
          {totalPages > 1 && (
            <div className="pt-4 mt-4 border-t border-outline-variant">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      </div>

      {modalOpen && <AddDepartmentModal onClose={() => setModalOpen(false)} />}
      {editDept && <EditDepartmentModal department={editDept} onClose={() => setEditDept(null)} />}
    </>
  );
}
