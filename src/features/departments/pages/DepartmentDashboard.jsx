import React, { useState } from 'react';
import DepartmentCard from '../components/DepartmentCard';
import OrgTree from '../components/OrgTree';
import AddDepartmentModal from '../components/AddDepartmentModal';
import EditDepartmentModal from '../components/EditDepartmentModal';
import Pagination from '../../../components/Pagination';
import useDocumentTitle from '../../../hooks/useDocumentTitle';
import { useApproval } from '../../../context/useApproval';
import { useI18n } from '../../../i18n/I18nProvider';
import { FILTER_SELECT_CLS, FILTER_SEARCH_CLS, FILTER_SEARCH_ICON_CLS } from '../../../styles/filterControls';
import { PAGE_TITLE_CLS } from '../../../components/PageHeader';

export default function DepartmentDashboard() {
  const { t } = useI18n();
  useDocumentTitle(t('Cơ cấu tổ chức & Siêu thị'));
  const { departments, departmentsLoading, toggleDepartmentStatus, deleteDepartment, currentUser, hasPermission } = useApproval();

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
  // Số thẻ mỗi trang được tính lại theo số CỘT thực tế của lưới × 3 hàng, để mỗi trang luôn là
  // các hàng ĐẦY đủ — tránh hàng cuối lẻ thẻ gây khoảng trống lệch một bên.
  const ROWS_PER_PAGE = 3;
  const [gridColumns, setGridColumns] = useState(1);
  const gridRef = React.useRef(null);
  // BE-98: 'grid' = lưới thẻ (mặc định), 'tree' = sơ đồ tổ chức theo cấp trên – cấp dưới.
  const [viewMode, setViewMode] = useState('grid');

  // Computed filtered list
  // BE-113: tách 2 lớp để sơ đồ cây vẫn dựng đủ nhánh.
  //   * visibleDepartments: đơn vị người dùng ĐƯỢC PHÉP thấy (theo vai trò).
  //   * filteredDepartments: kết quả KHỚP điều kiện tìm kiếm/lọc.
  const visibleDepartments = departments.filter((dept) => {
    // 0. Role-based visibility
    if (currentUser?.role !== 'ADMIN' && currentUser?.role !== 'HR') {
      const userDeptIds = currentUser?.allPositions?.map(p => p.departmentId) || [];
      if (!userDeptIds.includes(dept.id)) {
        return false;
      }
    }
    return true;
  });

  const filteredDepartments = visibleDepartments.filter((dept) => {
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

  // BE-113: chỉ khi có điều kiện thu hẹp danh sách mới cần "làm mờ" phần còn lại.
  const isFilterActive = filteredDepartments.length !== visibleDepartments.length;
  const filterKey = `${searchQuery}|${filterType}|${filterStatus}`;

  /**
   * Danh sách đưa vào sơ đồ cây = kết quả khớp + CẤP TRÊN + CẤP DƯỚI của kết quả.
   *
   * Vì sao: trước đây truyền thẳng danh sách đã lọc vào cây, nên tìm "Phòng Marketing" thì cây chỉ
   * còn đúng 1 nút — mất Ban cơ sở hạ tầng (cấp trên) và mọi đơn vị trực thuộc, bộ đếm "đơn vị cấp
   * cao nhất" cũng sai. Nay giữ nguyên nhánh và LÀM MỜ những đơn vị không khớp.
   *
   * Phạm vi mở rộng chỉ trong `visibleDepartments` để không lộ đơn vị ngoài quyền của người dùng.
   */
  const treeDepartments = React.useMemo(() => {
    if (viewMode !== 'tree') return filteredDepartments;

    const byId = new Map(visibleDepartments.map((d) => [d.id, d]));
    const matchedIds = new Set(filteredDepartments.map((d) => d.id));
    const keep = new Set(matchedIds);

    // cấp trên (đi ngược lên tận gốc)
    filteredDepartments.forEach((dept) => {
      let current = dept.parentDepartmentId ? byId.get(dept.parentDepartmentId) : null;
      let guard = 0;
      while (current && guard < 50) {
        if (keep.has(current.id)) break;
        keep.add(current.id);
        current = current.parentDepartmentId ? byId.get(current.parentDepartmentId) : null;
        guard += 1;
      }
    });

    // cấp dưới (đi xuống hết nhánh)
    const childrenOf = new Map();
    visibleDepartments.forEach((d) => {
      if (!d.parentDepartmentId) return;
      if (!childrenOf.has(d.parentDepartmentId)) childrenOf.set(d.parentDepartmentId, []);
      childrenOf.get(d.parentDepartmentId).push(d);
    });
    const queue = [...matchedIds];
    let guard = 0;
    while (queue.length && guard < 5000) {
      const id = queue.pop();
      (childrenOf.get(id) || []).forEach((child) => {
        if (keep.has(child.id)) return;
        keep.add(child.id);
        queue.push(child.id);
      });
      guard += 1;
    }

    return visibleDepartments
      .filter((d) => keep.has(d.id))
      .map((d) => ({ ...d, isFilterMatch: matchedIds.has(d.id) }));
  }, [visibleDepartments, filteredDepartments, viewMode]);

  // Đo số cột thực tế của lưới (đếm số thẻ nằm trên hàng đầu tiên) để chọn số thẻ mỗi trang.
  React.useEffect(() => {
    const el = gridRef.current;
    if (!el) return undefined;
    const measure = () => {
      const kids = Array.from(el.children).map((c) => c.getBoundingClientRect());
      if (!kids.length) return;
      const firstTop = Math.round(kids[0].top);
      const cols = kids.filter((k) => Math.abs(Math.round(k.top) - firstTop) <= 2).length;
      setGridColumns((prev) => (prev === Math.max(1, cols) ? prev : Math.max(1, cols)));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [viewMode, departmentsLoading, filteredDepartments.length]);

  const ITEMS_PER_PAGE = Math.max(1, gridColumns * ROWS_PER_PAGE);

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
      <div className="p-3 md:p-4 flex-1 overflow-y-auto min-h-0 bg-background">
        <div className="w-full space-y-3">
          {/* Compact Action Header — BE-81: trước đây dùng `bg-surface-container-low` (#f8fafc, ngả
              xanh) nên thẻ tiêu đề lệch tông với nền ấm #f6f6f4 của trang; nay dùng đúng tông ấm. */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#f6f6f4] p-4 rounded-lg border border-outline-variant shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-[24px]">account_tree</span>
              </div>
              <h1 className={`${PAGE_TITLE_CLS} break-words min-w-0`}>{t('Cơ cấu tổ chức & Siêu thị')}</h1>
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

            {/* BE-98: chuyển giữa lưới thẻ và sơ đồ cây tổ chức */}
            <div className="flex items-center gap-1 p-1 bg-[#f6f6f4] border border-outline-variant rounded-lg">
              {[
                { id: 'grid', icon: 'grid_view', label: t('Lưới thẻ') },
                { id: 'tree', icon: 'account_tree', label: t('Sơ đồ cây') },
              ].map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setViewMode(v.id)}
                  className={`flex items-center gap-1.5 px-3 h-[36px] rounded-md text-sm transition-colors cursor-pointer ${
                    viewMode === v.id
                      ? 'bg-primary text-on-primary font-medium shadow-sm'
                      : 'text-secondary hover:text-on-surface hover:bg-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{v.icon}</span>
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Department Grid */}
          {departmentsLoading && filteredDepartments.length === 0 ? (
            /* BE-136: đang tải thì hiện spinner, tránh nhấp nháy "không có dữ liệu" khi mạng chậm */
            <div className="py-12 text-center text-secondary border border-dashed border-outline-variant rounded-lg bg-surface-container-lowest" role="status">
              <span className="material-symbols-outlined text-[48px] mb-3 animate-spin text-primary">progress_activity</span>
              <p className="text-sm">{t('Đang tải danh sách phòng ban...')}</p>
            </div>
          ) : filteredDepartments.length === 0 ? (
            <div className="py-12 text-center text-secondary border border-dashed border-outline-variant rounded-lg bg-surface-container-lowest">
              <span className="material-symbols-outlined text-[48px] opacity-20 mb-3">account_tree</span>
              <p className="text-sm">{t('Không tìm thấy đơn vị nào phù hợp với bộ lọc.')}</p>
            </div>
          ) : viewMode === 'tree' ? (
            <OrgTree
              departments={treeDepartments}
              matchCount={filteredDepartments.length}
              isFiltered={isFilterActive}
              autoExpandKey={filterKey}
              canEdit={canEdit}
              onEdit={(dept) => setEditDept(dept)}
              onToggleStatus={(dept) => toggleDepartmentStatus(dept.id)}
              onDelete={(dept) => {
                if (window.confirm(`Bạn có chắc muốn xóa đơn vị "${dept.name}" không? Thao tác này không thể hoàn tác.`)) {
                  deleteDepartment(dept.id);
                }
              }}
            />
          ) : (
            /* Lưới thẻ + phân trang nằm trong CÙNG một khối (nền + viền + phân cách) để trang
               không bị rời rạc thành nhiều mảnh và đỡ khoảng trắng thừa. */
            <div className="bg-surface border border-outline-variant rounded-lg overflow-hidden shadow-sm">
              <div className="p-3 md:p-4">
                {/* Thẻ tự giãn để LẤP KÍN hàng: hàng đầy giữ nguyên, hàng cuối (thiếu thẻ) sẽ
                    phóng to vừa đủ phủ hết bề ngang -> không còn khoảng trống lệch một bên. */}
                <div ref={gridRef} className="flex flex-wrap gap-3">
                  {paginatedDepartments.map((dept) => (
                    <div key={dept.id} className="flex flex-1 min-w-[min(240px,100%)]">
                      <DepartmentCard
                        id={dept.id}
                        className="w-full h-full"
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
                    </div>
                  ))}
                </div>
              </div>

              {/* Phân trang nằm TRONG khối nội dung (chỉ áp dụng cho lưới thẻ) */}
              {totalPages > 1 && (
                <div className="px-3 md:px-4 py-2.5 border-t border-outline-variant/60 bg-surface-container-lowest">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {modalOpen && <AddDepartmentModal onClose={() => setModalOpen(false)} />}
      {editDept && <EditDepartmentModal department={editDept} onClose={() => setEditDept(null)} />}
    </>
  );
}
