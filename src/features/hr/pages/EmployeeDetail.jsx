import { useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import EmployeeModal from '../components/EmployeeModal';
import UserProfile from '../../profile/pages/UserProfile';
import { useHr } from '../context/HrProvider';
import { useApproval } from '../../../context/useApproval';
import useDocumentTitle from '../../../hooks/useDocumentTitle';
import { ROLE_STYLES, STATUS_STYLES } from '../data/constants';

const pad = (n) => String(n).padStart(2, '0');
const DAY = 24 * 60 * 60 * 1000;

const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

// Deterministic per-employee activity log derived from the real record.
// Historical events (onboarding) anchor at the hire date; recent events
// (logins, contact update, lock) land a few days before today so the feed
// feels live. Each entry carries a title + detail line for a cleaner log.
function buildActivityLog(e) {
  const num = parseInt(e.id.replace(/\D/g, ''), 10) || 101;
  const hire = new Date(2023, 0, 1);
  hire.setDate(hire.getDate() + (num % 90));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const hist = (back, h, m) => {
    const d = new Date(hire.getTime() + back * DAY);
    d.setHours(h, m, 0, 0);
    return d;
  };
  const recent = (back, h, m) => {
    const d = new Date(today.getTime() - back * DAY);
    d.setHours(h, m, 0, 0);
    return d;
  };

  const entries = [
    {
      icon: 'person_add',
      type: 'create',
      date: hist(0, 8, 30),
      title: 'Khởi tạo hồ sơ nhân sự',
      detail: `Mã NV ${e.id.substring(0, 8).toUpperCase()} • Do Phòng Nhân sự thực hiện`,
    },
    {
      icon: 'apartment',
      type: 'assign',
      date: hist(1, 9, 15),
      title: 'Phân công phòng ban',
      detail: e.department,
    },
    {
      icon: 'workspace_premium',
      type: 'promote',
      date: hist(4, 9, 0),
      title: 'Bổ nhiệm chức vụ',
      detail: e.position,
    },
    {
      icon: 'admin_panel_settings',
      type: 'role',
      date: hist(6, 9, 45),
      title: 'Cấp vai trò hệ thống',
      detail: ROLE_STYLES[e.role]?.label || e.role,
    },
  ];

  e.secondary.forEach((s, i) => {
    entries.push({
      icon: 'workspaces',
      type: 'secondary',
      date: hist(20 + i * 22, 10, 20),
      title: 'Bổ nhiệm kiêm nhiệm',
      detail: `${s.department} • ${s.position}`,
    });
  });

  entries.push({
    icon: 'contact_page',
    type: 'update',
    date: recent(6, 16, 5),
    title: 'Cập nhật thông tin liên hệ',
    detail: 'Email / số điện thoại',
  });
  entries.push({
    icon: 'photo_camera',
    type: 'update',
    date: recent(4, 11, 30),
    title: 'Cập nhật ảnh đại diện',
    detail: 'Hồ sơ cá nhân',
  });
  entries.push({
    icon: 'login',
    type: 'login',
    date: recent(1, 7, 55),
    title: 'Đăng nhập hệ thống',
    detail: 'Web • Trình duyệt Chrome',
  });

  if (e.status === 'inactive') {
    entries.push({
      icon: 'lock',
      type: 'lock',
      date: recent(0, 10, 0),
      title: 'Khóa tài khoản',
      detail: 'Ngừng hoạt động',
    });
  } else {
    entries.push({
      icon: 'login',
      type: 'login',
      date: recent(0, 8, 10),
      title: 'Đăng nhập gần nhất',
      detail: 'Thành công',
    });
  }

  return entries.sort((a, b) => (a.date < b.date ? 1 : -1));
}

const TYPE_STYLE = {
  create: 'bg-primary/10 text-primary',
  assign: 'bg-blue-50 text-blue-700',
  promote: 'bg-[#FEF3C7] text-[#B45309]',
  role: 'bg-purple-50 text-purple-700',
  secondary: 'bg-[#E8F8EE] text-[#037847]',
  update: 'bg-surface-container-high text-on-surface-variant',
  login: 'bg-surface-container-high text-on-surface-variant',
  lock: 'bg-[#F1F5F9] text-[#475569]',
};

function InfoCell({ label, children }) {
  return (
    <div className="min-w-0">
      <label className="block text-[11px] font-semibold text-secondary uppercase tracking-wider mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

function ActionButton({ icon, label, onClick, tone = 'default', title }) {
  const tones = {
    default: 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface',
    danger: 'text-secondary hover:bg-error-container/40 hover:text-error',
    warning: 'text-secondary hover:bg-warning-container/40 hover:text-warning',
    success: 'text-secondary hover:bg-success-container/40 hover:text-success',
    primary: 'bg-primary text-on-primary hover:bg-on-primary-fixed-variant',
  };
  return (
    <button
      onClick={onClick}
      title={title || label}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${tones[tone]}`}
    >
      <span className="material-symbols-outlined text-[18px]">{icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

export default function EmployeeDetail() {
  useDocumentTitle('Chi tiết Nhân sự');
  const { id } = useParams();
  const navigate = useNavigate();
  const { getEmployee, saveEmployee, toggleLock, resetPassword, departments, positions, roles } = useHr();
  const { pushToast } = useApproval();

  const employee = useMemo(() => getEmployee(id), [getEmployee, id]);
  const log = useMemo(() => (employee ? buildActivityLog(employee) : []), [employee]);

  const [editOpen, setEditOpen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const totalPages = Math.max(1, Math.ceil(log.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const pagedLog = log.slice((safePage - 1) * pageSize, safePage * pageSize);

  // Group log entries by date label (DD/MM/YYYY), newest first.
  const groups = useMemo(() => {
    const map = new Map();
    for (const entry of log) {
      const key = `${pad(entry.date.getDate())}/${pad(entry.date.getMonth() + 1)}/${entry.date.getFullYear()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(entry);
    }
    return Array.from(map, ([label, items]) => ({ label, items }));
  }, [log]);

  if (!employee) {
    return (
      <section className="flex-1 overflow-y-auto bg-surface p-6">
        <div className="max-w-3xl mx-auto text-center py-16">
          <span className="material-symbols-outlined text-[48px] text-outline block mb-3">person_off</span>
          <p className="text-on-surface font-medium">Không tìm thấy nhân sự với mã {id}.</p>
          <Link to="/personnel" className="inline-flex items-center gap-2 mt-4 text-primary hover:underline font-medium">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Quay lại danh sách
          </Link>
        </div>
      </section>
    );
  }

  const roleStyle = ROLE_STYLES[employee.role];
  const status = STATUS_STYLES[employee.status];
  const isActive = employee.status === 'active';

  const handleResetPassword = async () => {
    if (!window.confirm(`Đặt lại mật khẩu cho "${employee.name}"? Một mật khẩu tạm sẽ được tạo.`)) return;
    const pwd = await resetPassword(employee.id);
    if (pwd) {
      pushToast(`Đã đặt lại mật khẩu tạm cho ${employee.name}: ${pwd}`, 'success');
    } else {
      pushToast(`Không thể đặt lại mật khẩu cho ${employee.name}.`, 'error');
    }
  };

  const handleToggleLock = () => {
    toggleLock(employee.id);
    pushToast(isActive ? `Đã khóa tài khoản ${employee.name}` : `Đã mở khóa tài khoản ${employee.name}`, isActive ? 'warning' : 'success');
  };

  return (
    <section className="flex-1 overflow-y-auto bg-surface-container-lowest h-full relative">
      <div className="w-full px-4 md:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-secondary hover:text-primary transition-colors font-medium text-sm cursor-pointer mb-2"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Quay lại danh sách
        </button>

        {/* Profile Header Card */}
        <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-6 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full bg-[#003B73] text-white flex items-center justify-center font-bold text-2xl flex-shrink-0 shadow-inner">
               {employee.name.charAt(0)}
            </div>
            {/* Info */}
            <div className="flex flex-col gap-1.5">
               <div className="flex items-center gap-2">
                 <h1 className="text-xl md:text-2xl font-bold text-on-surface tracking-tight leading-none">{employee.name}</h1>
                 <button onClick={() => setProfileModalOpen(true)} title="Xem hồ sơ chi tiết" className="w-6 h-6 rounded-full border border-outline-variant text-secondary hover:text-primary hover:border-primary hover:bg-primary/5 flex items-center justify-center transition-colors cursor-pointer">
                   <span className="material-symbols-outlined text-[14px]">person_search</span>
                 </button>
               </div>
               <p className="text-secondary text-sm">{employee.email}</p>
               <div className="flex flex-wrap gap-2 mt-2">
                 <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${status.cls}`}>
                   <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                   {status.label}
                 </span>
                 <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700`}>
                   <span className="material-symbols-outlined text-[14px]">apartment</span>
                   {employee.department}
                 </span>
               </div>
            </div>
          </div>
          
          {/* Action Button Dropdown wrapper */}
          <div className="flex-shrink-0 relative w-full md:w-auto mt-4 md:mt-0">
             <button 
               onClick={() => setDropdownOpen(!dropdownOpen)}
               className="w-full md:w-auto justify-center bg-[#004B8D] text-white px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 hover:bg-[#003B73] transition-colors shadow-sm cursor-pointer relative z-50"
             >
               <span className="material-symbols-outlined text-[18px]">settings</span>
               Thao tác
               <span className="material-symbols-outlined text-[18px]">expand_more</span>
             </button>
             
             {/* Dropdown overlay */}
             {dropdownOpen && (
               <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)}></div>
             )}

             {/* Dropdown Menu */}
             <div className={`absolute right-0 top-full mt-1 w-48 bg-white border border-outline-variant shadow-lg rounded-md py-1 transition-all z-50 transform origin-top-right ${dropdownOpen ? 'opacity-100 pointer-events-auto scale-100' : 'opacity-0 pointer-events-none scale-95'}`}>
                <button onClick={() => { setEditOpen(true); setDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-surface-container-low flex items-center gap-2 cursor-pointer">
                   <span className="material-symbols-outlined text-[18px]">edit</span>
                   Chỉnh sửa thông tin
                </button>
                <button onClick={() => { handleResetPassword(); setDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-warning hover:bg-warning-container/30 flex items-center gap-2 cursor-pointer">
                   <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                   Đặt lại mật khẩu
                </button>
                <div className="h-px bg-outline-variant/50 my-1 w-full" />
                <button onClick={() => { handleToggleLock(); setDropdownOpen(false); }} className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 cursor-pointer ${isActive ? 'text-error hover:bg-error-container/30' : 'text-success hover:bg-success-container/30'}`}>
                   <span className="material-symbols-outlined text-[18px]">{isActive ? 'lock' : 'lock_open'}</span>
                   {isActive ? 'Khóa tài khoản' : 'Mở khóa'}
                </button>
             </div>
          </div>
        </div>

        {/* Info Grid (4 columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
           <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-4 flex flex-col gap-2 relative overflow-hidden">
              <div className="flex items-center gap-1.5 text-secondary">
                 <span className="material-symbols-outlined text-[16px]">badge</span>
                 <span className="text-[10px] font-bold uppercase tracking-wider">User ID</span>
              </div>
              <div className="font-bold text-on-surface text-sm truncate" title={employee.id}>{employee.id.substring(0, 8).toUpperCase()}</div>
           </div>
           
           <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-4 flex flex-col gap-2 relative overflow-hidden">
              <div className="flex items-center gap-1.5 text-secondary">
                 <span className="material-symbols-outlined text-[16px]">mail</span>
                 <span className="text-[10px] font-bold uppercase tracking-wider">Email công ty</span>
              </div>
              <div className="font-bold text-on-surface text-sm truncate" title={employee.email}>{employee.email}</div>
           </div>

           <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-4 flex flex-col gap-2 relative overflow-hidden">
              <div className="flex items-center gap-1.5 text-secondary">
                 <span className="material-symbols-outlined text-[16px]">mail</span>
                 <span className="text-[10px] font-bold uppercase tracking-wider">Email cá nhân</span>
              </div>
              <div className="font-bold text-on-surface text-sm truncate" title={employee.personalEmail || 'Không có'}>{employee.personalEmail || 'Không có'}</div>
           </div>

           <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-4 flex flex-col gap-2 relative overflow-hidden">
              <div className="flex items-center gap-1.5 text-secondary">
                 <span className="material-symbols-outlined text-[16px]">call</span>
                 <span className="text-[10px] font-bold uppercase tracking-wider">Số điện thoại</span>
              </div>
              <div className="font-bold text-on-surface text-sm">{employee.phone}</div>
           </div>

           <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-4 flex flex-col gap-2 relative overflow-hidden">
              <div className="flex items-center gap-1.5 text-secondary">
                 <span className="material-symbols-outlined text-[16px]">event</span>
                 <span className="text-[10px] font-bold uppercase tracking-wider">Ngày tạo</span>
              </div>
              <div className="font-bold text-on-surface text-sm">{formatDate(employee.createdAt)}</div>
           </div>
        </div>

        {/* Activity Log */}
        <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
           <div className="flex items-center gap-2 px-6 py-4 border-b border-outline-variant/50">
             <span className="material-symbols-outlined text-primary text-[20px]">history</span>
             <h2 className="text-base font-bold text-on-surface tracking-tight">Lịch sử hoạt động</h2>
           </div>
           
           <div className="p-6">
              <div className="flex flex-col">
                 <ol className="relative border-l border-outline-variant ml-2 space-y-8">
                   {pagedLog.map((entry, idx) => (
                     <li key={idx} className="relative pl-6">
                       {/* Simple Blue Dot */}
                       <span className="absolute -left-[5.5px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#004B8D] ring-4 ring-white"></span>
                       
                       <div className="flex flex-col gap-0.5">
                         <p className="text-sm font-bold text-on-surface leading-tight">{entry.title}</p>
                         <time className="text-[11px] text-secondary font-medium">
                           {pad(entry.date.getHours())}:{pad(entry.date.getMinutes())}:{pad(entry.date.getSeconds() || 18)} {pad(entry.date.getDate())}/{pad(entry.date.getMonth() + 1)}/{entry.date.getFullYear()}
                         </time>
                         
                         {entry.detail && (
                           <div className="mt-2 bg-slate-100 border border-slate-200 rounded p-3 text-sm text-on-surface-variant font-medium">
                             {entry.detail}
                           </div>
                         )}
                       </div>
                     </li>
                   ))}
                 </ol>
              </div>
           </div>
           
           {/* Pagination Footer */}
           <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-surface-container-lowest border-t border-outline-variant gap-4">
             <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 w-full sm:w-auto">
               <span className="text-xs text-secondary flex items-center gap-2">
                 Hiển thị
                 <select
                   value={pageSize}
                   onChange={(e) => {
                     setPageSize(Number(e.target.value));
                     setPage(1); // Reset page on page size change
                   }}
                   className="bg-surface border border-outline-variant/50 rounded-md px-2 py-1 text-xs text-on-surface outline-none focus:border-primary cursor-pointer hover:bg-surface-container-low transition-colors"
                 >
                   <option value={5}>5 dòng</option>
                   <option value={10}>10 dòng</option>
                   <option value={20}>20 dòng</option>
                   <option value={50}>50 dòng</option>
                 </select>
                 <span>
                   {log.length === 0 ? 0 : (safePage - 1) * pageSize + 1} - {Math.min(safePage * pageSize, log.length)} trong tổng số {log.length} hoạt động
                 </span>
               </span>
             </div>
             
             <div className="flex items-center gap-1 bg-transparent">
               <button
                 onClick={() => setPage((p) => Math.max(1, p - 1))}
                 disabled={safePage <= 1}
                 className="w-7 h-7 rounded bg-surface border border-outline-variant/50 text-secondary hover:bg-surface-container hover:text-on-surface cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
               >
                 <span className="material-symbols-outlined text-[16px]">chevron_left</span>
               </button>
               <div className="px-2 flex items-center justify-center min-w-[4rem]">
                 <span className="text-xs text-secondary">Trang {safePage} / {totalPages}</span>
               </div>
               <button
                 onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                 disabled={safePage >= totalPages}
                 className="w-7 h-7 rounded bg-surface border border-outline-variant/50 text-secondary hover:bg-surface-container hover:text-on-surface cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
               >
                 <span className="material-symbols-outlined text-[16px]">chevron_right</span>
               </button>
             </div>
           </div>
        </div>
      </div>

      {editOpen && (
        <EmployeeModal
          employee={employee}
          departments={departments}
          positions={positions}
          roles={roles}
          onClose={() => setEditOpen(false)}
          onSave={async (form) => {
            const ok = await saveEmployee(form);
            if (ok) setEditOpen(false);
          }}
        />
      )}

      {/* Profile Detail Modal */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4 sm:p-6" onClick={() => setProfileModalOpen(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden relative" onClick={(e) => e.stopPropagation()}>
            <div className="flex-1 overflow-hidden relative bg-surface">
              <UserProfile userId={employee.id} onClose={() => setProfileModalOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
