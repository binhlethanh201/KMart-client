import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import RequestCard from '../components/RequestCard';
import CreateRequestModal from '../components/CreateRequestModal';
import { useApproval } from '../../../context/useApproval';
import useDocumentTitle from '../../../hooks/useDocumentTitle';

/* ─── Constants ──────────────────────────────────────────────── */

const STATUS_FILTERS = [
  { id: 'all',      label: 'Tất cả',       icon: 'inbox' },
  { id: 'pending',  label: 'Chờ duyệt',    dot: 'bg-amber-400' },
  { id: 'approved', label: 'Đã phê duyệt', dot: 'bg-emerald-400' },
  { id: 'rejected', label: 'Từ chối',      dot: 'bg-red-400' },
];

const TITLES = {
  sent: 'Đơn từ cá nhân',
  received: 'Đơn gửi đến tôi duyệt',
  /* BE-05: màn hình riêng cho đơn đang bị yêu cầu bổ sung */
  supplement: 'Đơn cần bổ sung'
};

/* ─── Helpers ────────────────────────────────────────────────── */

// BE-05: lấy lý do yêu cầu bổ sung gần nhất.
// Backend ghi comment dạng "[Yêu cầu bổ sung] <lý do>" khi người duyệt bấm nút này.
const supplementReason = (r) => {
  const hits = (r.comments || []).filter((c) => (c.text || '').startsWith('[Yêu cầu bổ sung]'));
  const last = hits[hits.length - 1];
  return last ? last.text.replace('[Yêu cầu bổ sung]', '').trim() : null;
};

/* ─── Component ──────────────────────────────────────────────── */

export default function PersonalRequests({ mode = 'sent' }) {
  useDocumentTitle(TITLES[mode] || 'Danh sách Đơn từ');

  const { requests, currentUserId, departments } = useApproval();

  const [isCreateOpen, setIsCreateOpen]        = useState(false);
  const [statusFilter, setStatusFilter]        = useState('all');
  const [search, setSearch]                    = useState('');
  const [departmentFilter, setDepartmentFilter] = useState(null);
  const [editingRequest, setEditingRequest]   = useState(null);

  useEffect(() => {
    setStatusFilter('all');
    setSearch('');
    setDepartmentFilter(null);
  }, [mode]);

  /* BE-05: đơn thuộc màn hình hiện tại */
  const matchesMode = useCallback((r) => {
    if (mode === 'sent') return r.creatorId === currentUserId;
    if (mode === 'supplement') return r.creatorId === currentUserId && r.status === 'needssupplement';
    return r._isPendingReq === true && r.creatorId !== currentUserId;
  }, [mode, currentUserId]);

  /* counts per filter tab */
  const counts = useMemo(() => {
    const c = { all: 0, pending: 0, approved: 0, rejected: 0 };
    for (const r of requests) {
      if (!matchesMode(r)) continue;

      c.all += 1;
      if (r.status === 'pending' || r.status === 'submitted' || r.status === 'pendingapproval') c.pending += 1;
      if (r.status === 'approved') c.approved += 1;
      // BE-05: 'needssupplement' có màn hình riêng, không tính vào tab "Từ chối" nữa
      if (r.status === 'rejected' || r.status === 'returned_timeout') c.rejected += 1;
    }
    return c;
  }, [requests, matchesMode]);

  /* filtered list */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter((r) => {
      if (!matchesMode(r)) return false;

      let matchF = true;
      if (statusFilter === 'pending')  matchF = r.status === 'pending' || r.status === 'submitted' || r.status === 'pendingapproval';
      else if (statusFilter === 'approved') matchF = r.status === 'approved';
      else if (statusFilter === 'rejected') matchF = r.status === 'rejected' || r.status === 'returned_timeout';

      const matchQ = !q || String(r.id).toLowerCase().includes(q) || (r.title || '').toLowerCase().includes(q);
      const matchD = !departmentFilter || r.departmentId === departmentFilter;
      return matchQ && matchF && matchD;
    });
  }, [requests, statusFilter, search, departmentFilter, matchesMode]);

  /* pagination for infinite scroll */
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setPage(1);
  }, [mode, statusFilter, search, departmentFilter]);

  const visibleFiltered = useMemo(() => {
    return filtered.slice(0, page * itemsPerPage);
  }, [filtered, page, itemsPerPage]);

  const loaderRef = useRef(null);
  
  useEffect(() => {
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
  }, [filtered.length, itemsPerPage]);

  return (
    <div className="flex flex-1 h-full overflow-hidden bg-surface">
      <section className="flex-1 flex flex-col h-full overflow-hidden min-w-0">

        {/* ── Header ── */}
        <div className="bg-surface border-b border-outline-variant px-6 pt-6 pb-0 flex-shrink-0 shadow-sm z-10">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-[24px]">description</span>
              </div>
              <h1 className="text-2xl font-bold text-on-surface tracking-tight">
                {TITLES[mode] || 'Danh sách Đơn từ'}
              </h1>
            </div>
            {mode === 'sent' && (
              <button
                onClick={() => setIsCreateOpen(true)}
                className="bg-primary w-full md:w-auto justify-center text-on-primary hover:bg-on-primary-fixed-variant transition-colors font-label-md px-5 py-2.5 rounded-md flex items-center gap-2 self-start flex-shrink-0 shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Tạo đề xuất mới
              </button>
            )}
          </div>

          {/* ── Toolbar: search + department filter ── */}
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant pointer-events-none">
                search
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                type="text"
                placeholder="Tìm theo mã, tiêu đề..."
                className="w-full pl-9 pr-3 py-2 bg-surface border border-outline-variant rounded-lg text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
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
                className="w-full pl-3 pr-8 py-2 bg-surface border border-outline-variant rounded-lg text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none transition-colors cursor-pointer"
              >
                <option value="">Tất cả phòng ban</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code} - {d.name}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant pointer-events-none">
                expand_more
              </span>
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
                  {f.label}
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
        </div>

        {/* ── List ── */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* BE-05: hướng dẫn nhanh cho màn bổ sung */}
          {mode === 'supplement' && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-warning-container/40 border border-warning/30 flex items-start gap-2.5 text-sm text-on-surface">
              <span className="material-symbols-outlined text-[20px] text-warning flex-shrink-0">info</span>
              <span>
                Đây là các đơn của bạn bị người duyệt trả lại để bổ sung thông tin.
                Mở đơn để xem chi tiết, bổ sung rồi gửi lại cho người duyệt.
              </span>
            </div>
          )}
          <div className="w-full flex flex-col gap-3 pb-8">
            {filtered.length === 0 ? (
              <div className="bg-surface rounded-lg border border-outline-variant p-12 text-center text-secondary">
                <span className="material-symbols-outlined text-[40px] block mb-2 text-outline">
                  {mode === 'supplement' ? 'task_alt' : 'search_off'}
                </span>
                {mode === 'supplement' ? 'Không có đơn nào cần bổ sung.' : 'Không có đơn từ phù hợp bộ lọc.'}
              </div>
            ) : (
              <>
                {visibleFiltered.map((r, index) => (
                  <div key={r.id} className="animate-slide-fade flex flex-col gap-2" style={{ animationDelay: `${(index % itemsPerPage) * 50}ms` }}>
                    <RequestCard request={r} />
                    {/* BE-05: hiện lý do cần bổ sung + lối vào bổ sung ngay, không phải mở từng đơn */}
                    {mode === 'supplement' && (
                      <div className="px-4 py-2.5 rounded-lg bg-surface border border-outline-variant flex items-center gap-3 flex-wrap">
                        {supplementReason(r) && (
                          <span className="flex items-start gap-2 text-sm text-on-surface flex-1 min-w-[220px]">
                            <span className="material-symbols-outlined text-[18px] text-warning flex-shrink-0">edit_note</span>
                            <span><strong className="font-semibold">Lý do cần bổ sung:</strong> {supplementReason(r)}</span>
                          </span>
                        )}
                        <button
                          onClick={() => setEditingRequest(r)}
                          className="ml-auto px-3.5 py-1.5 rounded-md bg-primary text-on-primary hover:bg-primary/90 transition-colors text-sm font-medium flex items-center gap-1.5 cursor-pointer flex-shrink-0"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit_note</span>
                          Bổ sung &amp; gửi lại
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Loader element for intersection observer */}
                {page * itemsPerPage < filtered.length && (
                  <div ref={loaderRef} className="w-full py-4 flex justify-center items-center text-secondary">
                    <span className="material-symbols-outlined animate-spin text-[24px]">progress_activity</span>
                    <span className="ml-2 text-sm font-medium">Đang tải thêm...</span>
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