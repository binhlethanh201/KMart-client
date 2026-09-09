import { Link } from 'react-router-dom';
import { useApproval } from '../../../context/useApproval';

// Dark contextual filter rail for the request list pages.
// Controlled by the parent list page (filter + search live there).
const FILTERS = [
  { id: 'all', label: 'Tất cả', icon: 'inbox' },
  { id: 'received', label: 'Gửi đến tôi', icon: 'inbox' },
  { id: 'sent', label: 'Tôi gửi đi', icon: 'send' },
  { id: 'pending', label: 'Chờ duyệt', icon: 'schedule', dot: 'bg-warning' },
  { id: 'approved', label: 'Đã phê duyệt', icon: 'check_circle', dot: 'bg-success' },
  { id: 'rejected', label: 'Từ chối', icon: 'cancel', dot: 'bg-error' },
];

export default function RequestsSidebar({ filter, onFilter, counts = {}, search, onSearch, departmentFilter, onDepartmentFilter, departments = [] }) {
  const { currentUser } = useApproval();

  return (
    <aside className="w-[260px] bg-[#0F172A] text-slate-300 flex-shrink-0 flex flex-col h-full shadow-sm z-40 hidden md:flex">
      {/* User Profile Stack */}
      <div className="p-5 border-b border-white/10">
        <Link to="/" className="flex items-center gap-1 text-slate-400 hover:text-white text-xs mb-3 transition-colors">
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Về trang chủ
        </Link>
        <div className="flex items-center gap-3">
          <div className="relative">
            <img className="w-11 h-11 rounded-full object-cover border-2 border-slate-600" src={currentUser.avatar} alt={currentUser.name} />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#0F172A] rounded-full"></div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-body-md text-body-md font-bold text-white truncate">{currentUser.name}</p>
            <p className="text-xs text-slate-400 truncate">{currentUser.role} - {currentUser.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Quick nav */}
      <div className="py-3 px-3 border-b border-white/10">
        <Link to="/my-requests" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${filter === 'sent' ? 'bg-primary/10 text-white border-l-4 border-primary' : 'text-slate-400 hover:bg-white/5 hover:text-white border-l-4 border-transparent'}`}>
          <span className="material-symbols-outlined text-[20px]">folder_shared</span>
          <span className="text-sm font-medium">Đơn từ cá nhân</span>
        </Link>
        <button onClick={() => onFilter('received')} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${filter === 'received' ? 'bg-primary/10 text-white border-l-4 border-primary' : 'text-slate-400 hover:bg-white/5 hover:text-white border-l-4 border-transparent'}`}>
          <span className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[20px]">inbox</span>
            <span className="text-sm font-medium">Đơn chờ tôi duyệt</span>
          </span>
          {counts.received > 0 && <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">{counts.received}</span>}
        </button>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-white/10">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-[18px]">search</span>
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-800/60 border border-slate-700 rounded-md text-sm text-white outline-none focus:border-primary placeholder:text-slate-500"
            placeholder="Tìm theo mã, tiêu đề..."
            type="text"
          />
        </div>
      </div>

      {/* Status filters */}
      <div className="flex-1 overflow-y-auto py-3 px-3">
        <div className="text-slate-500 uppercase tracking-widest text-[11px] px-3 mb-2 font-label-md">Bộ lọc Trạng thái</div>
        <ul className="flex flex-col gap-0.5">
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <li key={f.id}>
                <button
                  onClick={() => onFilter(f.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all cursor-pointer ${active ? 'bg-primary/15 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <span className="flex items-center gap-3">
                    {f.dot ? (
                      <span className={`w-2 h-2 rounded-full ${f.dot}`}></span>
                    ) : (
                      <span className="material-symbols-outlined text-[20px]">{f.icon}</span>
                    )}
                    <span className="text-sm font-medium">{f.label}</span>
                  </span>
                  {counts[f.id] > 0 && <span className="text-xs text-slate-500">{counts[f.id]}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Department tags */}
      {departments.length > 0 && (
        <div className="py-3 px-3 border-t border-white/10 flex-shrink-0">
          <div className="flex items-center gap-1 text-slate-500 uppercase tracking-widest text-[11px] px-3 mb-2 font-label-md">
            <span className="material-symbols-outlined text-[14px]">apartment</span>
            Phòng ban
          </div>
          <div className="flex flex-wrap gap-1.5 px-1">
            <button
              onClick={() => onDepartmentFilter(null)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                departmentFilter === null
                  ? 'bg-primary text-on-primary'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              Tất cả
            </button>
            {departments.map((d) => {
              const active = departmentFilter === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => onDepartmentFilter(active ? null : d.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    active
                      ? 'bg-primary text-on-primary'
                      : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-700/60'
                  }`}
                  title={d.name}
                >
                  {d.code}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}
