import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import RequestCard from '../components/RequestCard';
import CreateRequestModal from '../components/CreateRequestModal';
import { useApproval } from '../../../context/useApproval';
import useDocumentTitle from '../../../hooks/useDocumentTitle';
import { useI18n } from '../../../i18n/I18nProvider';
import PageHeader from '../../../components/PageHeader';
import { FILTER_SELECT_CLS, FILTER_SEARCH_CLS, FILTER_SEARCH_ICON_CLS } from '../../../styles/filterControls';
import { scopeDepartmentsForUser } from '../../../utils/departmentScope';
import { matchesSearchText, normalizeSearchText } from '../../../utils/searchText';
import { documentTypeService } from '../../../services/documentTypeService';

/* ─── Constants ──────────────────────────────────────────────── */

const STATUS_FILTERS = [
  { id: 'all',        label: 'Tất cả',       icon: 'inbox' },
  { id: 'pending',    label: 'Chờ duyệt',    dot: 'bg-amber-400' },
  { id: 'supplement', label: 'Cần bổ sung',  dot: 'bg-supplement' },
  { id: 'approved',   label: 'Đã phê duyệt', dot: 'bg-emerald-400' },
  { id: 'rejected',   label: 'Từ chối',      dot: 'bg-red-400' },
];

const TITLES = {
  sent: 'Đơn từ cá nhân',
  received: 'Đơn gửi đến tôi duyệt',
  /* BE-05: màn hình riêng cho đơn đang bị yêu cầu bổ sung */
  supplement: 'Đơn cần bổ sung'
};

/* ─── Helpers ────────────────────────────────────────────────── */

/* ─── Component ──────────────────────────────────────────────── */

export default function PersonalRequests({ mode = 'sent' }) {
  const { t } = useI18n();
  useDocumentTitle(t(TITLES[mode] || 'Danh sách Đơn từ'));

  const { requests, currentUserId, departments, currentUser } = useApproval();

  /*
   * BE-88: chỉ hiện những phòng ban người dùng thực sự thuộc về. Trước đây ô lọc đổ ra toàn bộ phòng
   * ban nên người chỉ ở 1 phòng ban vẫn thấy danh sách của cả tổ chức, chọn phòng khác thì trống trơn.
   */
  const scopedDepartments = useMemo(
    () => scopeDepartmentsForUser(departments, currentUser),
    [departments, currentUser]
  );

  const [isCreateOpen, setIsCreateOpen]        = useState(false);
  const [statusFilter, setStatusFilter]        = useState('all');
  const [search, setSearch]                    = useState('');
  const [departmentFilter, setDepartmentFilter] = useState(null);
  const [documentTypeFilter, setDocumentTypeFilter] = useState(null);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [editingRequest, setEditingRequest]   = useState(null);

  useEffect(() => {
    setStatusFilter('all');
    setSearch('');
    setDepartmentFilter(null);
    setDocumentTypeFilter(null);
  }, [mode]);
  
  // Load document types for filter
  useEffect(() => {
    documentTypeService.getAll().then(setDocumentTypes).catch(console.error);
  }, []);

  /* BE-05: đơn thuộc màn hình hiện tại */
  const matchesMode = useCallback((r) => {
    if (mode === 'sent') return r.creatorId === currentUserId;
    if (mode === 'supplement') return r.creatorId === currentUserId && r.status === 'needssupplement';
    return r._isPendingReq === true;
  }, [mode, currentUserId]);

  /* counts per filter tab */
  const counts = useMemo(() => {
    const c = { all: 0, pending: 0, supplement: 0, approved: 0, rejected: 0 };
    for (const r of requests) {
      if (!matchesMode(r)) continue;

      c.all += 1;
      if (r.status === 'pending' || r.status === 'submitted' || r.status === 'pendingapproval') c.pending += 1;
      if (r.status === 'approved') c.approved += 1;
      // BE-15: 'needssupplement' gộp vào "Đơn từ cá nhân" và có tab riêng, không tính vào "Từ chối"
      if (r.status === 'needssupplement') c.supplement += 1;
      if (r.status === 'rejected' || r.status === 'returned_timeout') c.rejected += 1;
    }
    return c;
  }, [requests, matchesMode]);

  /* filtered list */
  const filtered = useMemo(() => {
    const q = normalizeSearchText(search);

    /*
     * BE-92: ô tìm kiếm tra trên MỌI thứ người dùng nhìn thấy trên thẻ đơn — mã đơn, loại đơn,
     * tên người tạo, lý do/mô tả và nội dung các trường động — và KHÔNG phân biệt dấu.
     */
    const departmentNames = new Map();
    (departments || []).forEach((d) => {
      if (d?.id) departmentNames.set(d.id, d.name);
    });
    const departmentNameOf = (id) => (id ? departmentNames.get(id) : '');

    return requests.filter((r) => {
      if (!matchesMode(r)) return false;

      let matchF = true;
      if (statusFilter === 'pending')  matchF = r.status === 'pending' || r.status === 'submitted' || r.status === 'pendingapproval';
      else if (statusFilter === 'supplement') matchF = r.status === 'needssupplement';
      else if (statusFilter === 'approved') matchF = r.status === 'approved';
      else if (statusFilter === 'rejected') matchF = r.status === 'rejected' || r.status === 'returned_timeout';

      const matchQ = matchesSearchText([
        r.id,
        r.title,
        r.type,
        r.creatorName,
        r.reasonText,
        departmentNameOf(r.departmentId),
        ...Object.values(r.fields || {}).map((v) => (v === null || v === undefined ? '' : v)),
      ], q);

      const matchD = !departmentFilter || r.departmentId === departmentFilter;
      const matchT = !documentTypeFilter || r.documentTypeId === documentTypeFilter;
      return matchQ && matchF && matchD && matchT;
    });
  }, [requests, statusFilter, search, departmentFilter, documentTypeFilter, matchesMode, departments]);

  /* phân trang / cuộn vô hạn */
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [usePagination, setUsePagination] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    setPage(1);
  }, [mode, statusFilter, search, departmentFilter]);

  const visibleFiltered = useMemo(() => {
    if (usePagination) {
      const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
      const safePage = Math.min(Math.max(1, page), totalPages);
      return filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
    }
    return filtered.slice(0, page * itemsPerPage);
  }, [filtered, page, itemsPerPage, pageSize, usePagination]);

  const loaderRef = useRef(null);

  useEffect(() => {
    setPage(1);
  }, [mode, statusFilter, search, departmentFilter, documentTypeFilter]);

  // Infinite scroll observer
  useEffect(() => {
    if (usePagination) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setPage(prev => (prev * itemsPerPage < filtered.length ? prev + 1 : prev));
      }
    }, { threshold: 0.1 });
    
    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }
    
    return () => {
      if (loaderRef.current) observer.unobserve(loaderRef.current);
    };
  }, [filtered.length, itemsPerPage, usePagination]);

  return (
    <div className="flex flex-1 h-full overflow-hidden bg-background">
      <section className="flex-1 flex flex-col h-full overflow-hidden min-w-0">

        {/* ── Header ── */}
        <PageHeader
          icon="description"
          title={TITLES[mode] || 'Danh sách Đơn từ'}
          contentClassName="px-6 pt-5 pb-0"
          actions={mode === 'sent' && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="bg-primary w-full md:w-auto justify-center text-on-primary hover:bg-on-primary-fixed-variant transition-colors font-label-md px-5 py-2.5 rounded-md flex items-center gap-2 self-start flex-shrink-0 shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              {t('Tạo đề xuất mới')}
            </button>
          )}
        >
          {/* ── Toolbar: search + department filter ── */}
          {/*
            BE-92: gom ô tìm kiếm và ô lọc phòng ban vào MỘT khối có nhãn để nhìn rõ đây là khu vực
            lọc, kèm số đơn khớp và nút xoá nhanh toàn bộ điều kiện.
          */}
          <div className="rounded-lg border border-outline-variant/60 bg-surface-container-low px-3 py-2.5 mb-3">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Search */}
              <div className="relative flex-1 min-w-[220px]">
                <span className={FILTER_SEARCH_ICON_CLS}>
                  search
                </span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  type="text"
                  placeholder={t('Tìm theo mã đơn, loại đơn, người tạo, nội dung...')}
                  aria-label={t('Tìm kiếm đơn từ')}
                  className={FILTER_SEARCH_CLS}
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    title={t('Xoá từ khoá')}
                    aria-label={t('Xoá từ khoá')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                )}
              </div>

              {/* Department dropdown */}
              <div className="relative min-w-[200px]">
                <select
                  value={departmentFilter || ''}
                  onChange={(e) => setDepartmentFilter(e.target.value || null)}
                  aria-label={t('Phòng ban')}
                  className={`${FILTER_SELECT_CLS} w-full`}
                >
                  <option value="">{t('Tất cả phòng ban')}</option>
                  {scopedDepartments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.code} - {t(d.name)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Document type dropdown */}
              <div className="relative min-w-[180px]">
                <select
                  value={documentTypeFilter || ''}
                  onChange={(e) => setDocumentTypeFilter(e.target.value || null)}
                  aria-label={t('Loại đơn')}
                  className={`${FILTER_SELECT_CLS} w-full`}
                >
                  <option value="">{t('Tất cả loại đơn')}</option>
                  {documentTypes.map((dt) => (
                    <option key={dt.id} value={dt.id}>
                      {t(dt.name)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nút xoá nhanh bộ lọc */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => { setUsePagination(!usePagination); setPage(1); }}
                  className="text-xs font-medium text-primary hover:underline whitespace-nowrap cursor-pointer"
                  title={usePagination ? 'Chuyển sang cuộn vô hạn' : 'Chuyển sang phân trang'}
                >
                  {usePagination ? t('Cuộn vô hạn') : t('Phân trang')}
                </button>
                {(search || departmentFilter || documentTypeFilter) && (
                  <button
                    type="button"
                    onClick={() => { setSearch(''); setDepartmentFilter(null); setDocumentTypeFilter(null); }}
                    className="text-xs font-medium text-primary hover:underline whitespace-nowrap cursor-pointer"
                  >
                    {t('Xoá bộ lọc')}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── Status filter tabs ── (BE-05: ẩn ở màn "Đơn cần bổ sung" vì chỉ có 1 trạng thái) */}
          <div className={`items-center gap-0.5 overflow-x-auto scrollbar-hide ${mode === 'supplement' ? 'hidden' : 'flex'}`}>
            {STATUS_FILTERS.map((f) => {
              const active = statusFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors cursor-pointer border-b-2 flex-shrink-0 ${
                    active
                      ? 'border-primary text-primary'
                      : 'border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline'
                  }`}
                >
                  {f.dot ? (
                    <span className={`w-2 h-2 rounded-full ${f.dot}`} />
                  ) : (
                    <span className="material-symbols-outlined text-[16px]">{f.icon}</span>
                  )}
                  {t(f.label)}
                  {counts[f.id] > 0 && (
                    <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold leading-none ${
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'bg-surface-container text-on-surface-variant'
                    }`}>
                      {counts[f.id]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </PageHeader>

        {/* ── List ── */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* BE-05: hướng dẫn nhanh cho màn bổ sung */}
          {mode === 'supplement' && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-warning-container/40 border border-warning/30 flex items-start gap-2.5 text-sm text-on-surface">
              <span className="material-symbols-outlined text-[20px] text-warning flex-shrink-0">info</span>
              <span>
                {t('Đây là các đơn của bạn bị người duyệt trả lại để bổ sung thông tin.\n                Mở đơn để xem chi tiết, bổ sung rồi gửi lại cho người duyệt.')}
              </span>
            </div>
          )}
          <div className="w-full flex flex-col gap-3 pb-8">
            {filtered.length === 0 ? (
              <div className="bg-surface rounded-lg border border-outline-variant p-12 text-center text-secondary">
                <span className="material-symbols-outlined text-[40px] block mb-2 text-outline">
                  {mode === 'supplement' ? 'task_alt' : 'search_off'}
                </span>
                {mode === 'supplement'
                  ? t('Không có đơn nào cần bổ sung.')
                  : mode === 'received'
                    ? (requests.some(matchesMode)
                        ? t('Không có đơn từ phù hợp bộ lọc.')
                        : t('Hiện không có đơn nào đang chờ bạn duyệt.'))
                    : t('Không có đơn từ phù hợp bộ lọc.')}
                {/* BE-92: nói rõ đang bị lọc bởi từ khoá nào để người dùng biết đường sửa. */}
                {search && (
                  <p className="mt-2 text-sm">
                    {t('Không tìm thấy đơn nào khớp từ khoá "{v0}".', { v0: search.trim() })}
                  </p>
                )}
              </div>
            ) : (
              <>
                {visibleFiltered.map((r, index) => (
                  <div key={r.id} className="animate-slide-fade" style={{ animationDelay: `${(index % itemsPerPage) * 50}ms` }}>
                    {/* BE-27: bỏ nút "Bổ sung & gửi lại" trùng lặp ngoài danh sách;
                        chỉ còn hành động này trong trang chi tiết đơn. */}
                    <RequestCard request={r} />
                  </div>
                ))}
                
                {/* Loader element for intersection observer or pagination */}
                {usePagination ? (
                  <div className="flex items-center justify-between px-4 py-3 bg-surface-container-lowest border-t border-outline-variant">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-secondary">{t('Hiển thị')}</span>
                      <select
                        value={pageSize}
                        onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                        className="filter-control filter-select h-[34px] py-0 pl-2.5 pr-8 text-xs"
                      >
                        <option value={5}>{t('5 dòng')}</option>
                        <option value={10}>{t('10 dòng')}</option>
                        <option value={20}>{t('20 dòng')}</option>
                        <option value={50}>{t('50 dòng')}</option>
                      </select>
                      <span className="text-xs text-secondary">
                        {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1} - {Math.min(page * pageSize, filtered.length)} {t('trong tổng số')} {filtered.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="w-7 h-7 rounded bg-surface border border-outline-variant/50 text-secondary hover:bg-surface-container hover:text-on-surface disabled:opacity-40 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                      </button>
                      <span className="text-xs text-secondary px-2">
                        {t('Trang {v0} / {v1}', { v0: page, v1: Math.max(1, Math.ceil(filtered.length / pageSize)) })}
                      </span>
                      <button
                        onClick={() => setPage(p => Math.min(Math.ceil(filtered.length / pageSize), p + 1))}
                        disabled={page >= Math.ceil(filtered.length / pageSize)}
                        className="w-7 h-7 rounded bg-surface border border-outline-variant/50 text-secondary hover:bg-surface-container hover:text-on-surface disabled:opacity-40 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                      </button>
                    </div>
                  </div>
                ) : page * itemsPerPage < filtered.length && (
                  <div ref={loaderRef} className="w-full py-4 flex justify-center items-center text-secondary">
                    <span className="material-symbols-outlined animate-spin text-[24px]">progress_activity</span>
                    <span className="ml-2 text-sm font-medium">{t('Đang tải thêm...')}</span>
                  </div>
                )}
                </>
            )}
          </div>
        </div>
      </section>

      {isCreateOpen && <CreateRequestModal onClose={() => setIsCreateOpen(false)} />}
      {editingRequest && (
        <CreateRequestModal
          existingRequest={editingRequest}
          onClose={() => setEditingRequest(null)}
        />
      )}
    </div>
  );
}