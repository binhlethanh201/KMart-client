import { useMemo, useState, useEffect } from 'react';
import RequestCard from '../components/RequestCard';
import CreateRequestModal from '../components/CreateRequestModal';
import { useApproval } from '../../../context/useApproval';
import useDocumentTitle from '../../../hooks/useDocumentTitle';
import { DEPARTMENTS } from '../../departments/data/departments';

/* ─── Constants ──────────────────────────────────────────────── */

const STATUS_FILTERS = [
  { id: 'all',      label: 'Tất cả',       icon: 'inbox' },
  { id: 'pending',  label: 'Chờ duyệt',    dot: 'bg-amber-400' },
  { id: 'approved', label: 'Đã phê duyệt', dot: 'bg-emerald-400' },
  { id: 'rejected', label: 'Từ chối',      dot: 'bg-red-400' },
];

const TITLES = {
  all:      'Tất cả đơn từ',
  received: 'Đơn gửi đến tôi duyệt',
  sent:     'Đơn tôi gửi đi',
  pending:  'Đơn đang chờ duyệt',
  approved: 'Đơn đã phê duyệt',
  rejected: 'Đơn bị từ chối',
};

/* ─── Component ──────────────────────────────────────────────── */

export default function PersonalRequests({ defaultFilter = 'all' }) {
  useDocumentTitle('Danh sách Đơn từ');

  const { requests, currentUserId } = useApproval();

  const [isCreateOpen, setIsCreateOpen]        = useState(false);
  const [filter, setFilter]                    = useState(defaultFilter);
  const [search, setSearch]                    = useState('');
  const [departmentFilter, setDepartmentFilter] = useState(null);

  // Khi chuyển route /my-requests ↔ /my-requests/approvals, defaultFilter thay đổi
  // nhưng React tái dùng component cũ → cần sync lại state
  useEffect(() => {
    setFilter(defaultFilter);
    setSearch('');
    setDepartmentFilter(null);
  }, [defaultFilter]);

  /* counts per filter tab */
  const counts = useMemo(() => {
    const c = { all: requests.length, received: 0, sent: 0, pending: 0, approved: 0, rejected: 0 };
    for (const r of requests) {
      if (r.creatorId === currentUserId) c.sent += 1;
      if (r.status === 'pending' && r.steps[r.currentStep]?.approverId === currentUserId) c.received += 1;
      if (r.status === 'pending') c.pending += 1;
      if (r.status === 'approved') c.approved += 1;
      if (r.status === 'rejected' || r.status === 'returned_timeout') c.rejected += 1;
    }
    return c;
  }, [requests, currentUserId]);

  /* filtered list */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter((r) => {
      const matchQ = !q || r.id.toLowerCase().includes(q) || r.title.toLowerCase().includes(q);
      let matchF = true;
      if (filter === 'received')
        matchF = r.status === 'pending' && r.steps[r.currentStep]?.approverId === currentUserId;
      else if (filter === 'sent')     matchF = r.creatorId === currentUserId;
      else if (filter === 'pending')  matchF = r.status === 'pending';
      else if (filter === 'approved') matchF = r.status === 'approved';
      else if (filter === 'rejected')
        matchF = r.status === 'rejected' || r.status === 'returned_timeout';
      const matchD = !departmentFilter || r.departmentId === departmentFilter;
      return matchQ && matchF && matchD;
    });
  }, [requests, filter, search, currentUserId, departmentFilter]);

  return (
    <div className="flex flex-1 h-full overflow-hidden bg-surface-container-low">
      <section className="flex-1 flex flex-col h-full overflow-hidden min-w-0">

        {/* ── Header ── */}
        <div className="bg-surface border-b border-outline-variant px-6 pt-6 pb-0 flex-shrink-0 shadow-sm z-10">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="font-display-lg text-on-surface tracking-tight">
                {TITLES[filter] || 'Danh sách Đơn từ'}
              </h1>

            </div>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-colors font-label-md px-5 py-2.5 rounded-md flex items-center gap-2 self-start flex-shrink-0 shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Tạo đề xuất mới
            </button>
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
                className="w-full pl-9 pr-3 py-2 bg-surface-container border border-outline-variant rounded-lg text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant transition-colors"
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

            {/* Department pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setDepartmentFilter(null)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer border ${
                  departmentFilter === null
                    ? 'bg-primary text-on-primary border-primary'
                    : 'bg-surface border-outline-variant text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
              >
                Tất cả phòng ban
              </button>
              {DEPARTMENTS.map((d) => {
                const active = departmentFilter === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => setDepartmentFilter(active ? null : d.id)}
                    title={d.name}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer border ${
                      active
                        ? 'bg-primary text-on-primary border-primary'
                        : 'bg-surface border-outline-variant text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                    }`}
                  >
                    {d.code}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Status filter tabs ── */}
          <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide">
            {STATUS_FILTERS.map((f) => {
              const active = filter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
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
          <div className="w-full flex flex-col gap-3 pb-8">
            {filtered.length === 0 ? (
              <div className="bg-surface rounded-lg border border-outline-variant p-12 text-center text-secondary">
                <span className="material-symbols-outlined text-[40px] block mb-2 text-outline">
                  search_off
                </span>
                Không có đơn từ phù hợp bộ lọc.
              </div>
            ) : (
              filtered.map((r) => <RequestCard key={r.id} request={r} />)
            )}
          </div>
        </div>
      </section>

      {isCreateOpen && <CreateRequestModal onClose={() => setIsCreateOpen(false)} />}
    </div>
  );
}