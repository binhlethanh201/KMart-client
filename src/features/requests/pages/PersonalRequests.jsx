import { useState, useMemo } from 'react';
import RequestsSidebar from '../components/RequestsSidebar';
import RequestCard from '../components/RequestCard';
import CreateRequestModal from '../components/CreateRequestModal';
import { useApproval } from '../../../context/useApproval';
import { DEPARTMENTS } from '../../departments/data/departments';
import useDocumentTitle from '../../../hooks/useDocumentTitle';

export default function PersonalRequests({ defaultFilter = 'all' }) {
  useDocumentTitle('Danh sách Đơn từ');
  const { requests, currentUserId } = useApproval();
  const [filter, setFilter] = useState(defaultFilter);
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState(null);

  // Counts per filter for the sidebar.
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter((r) => {
      const matchQ = !q || r.id.toLowerCase().includes(q) || r.title.toLowerCase().includes(q);
      let matchF = true;
      if (filter === 'received') matchF = r.status === 'pending' && r.steps[r.currentStep]?.approverId === currentUserId;
      else if (filter === 'sent') matchF = r.creatorId === currentUserId;
      else if (filter === 'pending') matchF = r.status === 'pending';
      else if (filter === 'approved') matchF = r.status === 'approved';
      else if (filter === 'rejected') matchF = r.status === 'rejected' || r.status === 'returned_timeout';
      const matchD = !departmentFilter || r.departmentId === departmentFilter;
      return matchQ && matchF && matchD;
    });
  }, [requests, filter, search, currentUserId, departmentFilter]);

  const titles = {
    all: 'Tất cả đơn từ',
    received: 'Đơn gửi đến tôi duyệt',
    sent: 'Đơn tôi gửi đi',
    pending: 'Đơn đang chờ duyệt',
    approved: 'Đơn đã phê duyệt',
    rejected: 'Đơn bị từ chối',
  };

  return (
    <div className="flex flex-1 h-full overflow-hidden bg-background">
      <RequestsSidebar
        filter={filter}
        onFilter={setFilter}
        counts={counts}
        search={search}
        onSearch={setSearch}
        departmentFilter={departmentFilter}
        onDepartmentFilter={setDepartmentFilter}
        departments={DEPARTMENTS}
      />

      <section className="flex-1 flex flex-col h-full overflow-hidden bg-surface-container-low min-w-0">
        {/* Header & action bar */}
        <div className="bg-surface border-b border-outline-variant p-6 flex-shrink-0 z-10 shadow-sm">
          <div className="w-full flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="font-display-lg text-on-surface tracking-tight">{titles[filter] || 'Danh sách Đơn từ'}</h1>
              <p className="font-body-md text-secondary mt-1">
                Quản lý, theo dõi và phê duyệt các yêu cầu nhân sự trong toàn hệ thống siêu thị.
              </p>
            </div>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-colors font-label-md px-5 py-2.5 rounded-md flex items-center gap-2 self-start md:self-auto shadow-sm cursor-pointer flex-shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Tạo đề xuất mới
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="w-full flex flex-col gap-3 pb-8">
            {filtered.length === 0 ? (
              <div className="bg-surface rounded-lg border border-outline-variant p-12 text-center text-secondary">
                <span className="material-symbols-outlined text-[40px] block mb-2 text-outline">search_off</span>
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
