import { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import EmployeeModal from '../components/EmployeeModal';
import UserProfile from '../../profile/pages/UserProfile';
import { useHr } from '../context/HrProvider';
import { useApproval } from '../../../context/useApproval';
import useDocumentTitle from '../../../hooks/useDocumentTitle';
import { STATUS_STYLES } from '../data/constants';
import { userService } from '../services/userService';
import { PERMISSIONS } from '../../../constants/permissions';
import { useI18n } from '../../../i18n/I18nProvider';
import { PAGE_TITLE_CLS } from '../../../components/PageHeader';
import Select from '../../../components/Select';

const pad = (n) => String(n).padStart(2, '0');

const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

// BE-141: hai component InfoCell / ActionButton trước đây không còn nơi dùng (UI đã đổi sang
// khối thông tin dạng lưới + menu "Thao tác") nên đã loại bỏ để tránh code chết.

export default function EmployeeDetail() {
  const { t } = useI18n();
  useDocumentTitle(t('Chi tiết Nhân sự'));
  const { id } = useParams();
  const navigate = useNavigate();
  const { getEmployee, saveEmployee, toggleLock, resetPassword, deleteEmployee, departments, positions, roles } = useHr();
  const { pushToast, currentUser, hasPermission } = useApproval();
  const canEditEmployee = hasPermission ? hasPermission(PERMISSIONS.PERSONNEL_UPDATE) : true;
  const canDeleteEmployee = hasPermission ? hasPermission(PERMISSIONS.PERSONNEL_DELETE) : true;
  const canResetPassword = hasPermission ? hasPermission(PERMISSIONS.PERSONNEL_RESET_PASSWORD) : true;
  const canLockEmployee = hasPermission ? hasPermission(PERMISSIONS.PERSONNEL_LOCK) : true;
  /** BE-141: chỉ hiện nút "Thao tác" khi có ÍT NHẤT một quyền — tránh menu rỗng. */
  const canPerformAnyAction = canEditEmployee || canResetPassword || canLockEmployee || canDeleteEmployee;

  const employee = useMemo(() => getEmployee(id), [getEmployee, id]);
  const [log, setLog] = useState([]);
  const [logLoading, setLogLoading] = useState(false);
  // BE-114: lịch sử chức vụ / phòng ban công tác (khác "Lịch sử hoạt động" — đây là dấu vết
  // nhân sự từng thuộc phòng nào, đọc được cả khi phòng ban đã bị xoá).
  const [positionHistory, setPositionHistory] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const HISTORY_PAGE_SIZE = 5;

  useEffect(() => {
    if (!employee?.id) return;
    userService.getPositionHistory(employee.id, 1, 100)
      .then((res) => setPositionHistory(Array.isArray(res) ? res : (res.items || [])))
      .catch((err) => {
        console.error(err);
        setPositionHistory([]);
      });
  }, [employee?.id]);

  useEffect(() => {
    if (!employee?.id) return;
    setLogLoading(true);
    userService.getActivityLog(employee.id, 1, 100) // fetch up to 100 recent logs
      .then(res => {
        const rawLogs = Array.isArray(res) ? res : (res.items || []);
        const formatted = rawLogs.map(l => {
          const date = new Date(l.createdAt);
          let title = l.action;
          let detail = l.description || l.entityType;

          if (l.entityType === 'Application') {
            if (l.action === 'CREATE') title = t('Tạo đơn từ mới');
            else if (l.action === 'UPDATE') title = t('Cập nhật đơn từ');
            else if (l.action === 'DELETE') title = t('Xóa đơn từ');
            else title = t('Thao tác đơn từ ({v0})', { v0: l.action });
            
            if (l.description) detail = t('Chi tiết: {v0}', { v0: l.description });
          } else if (l.entityType === 'User' || l.entityType === 'Profile') {
            if (l.action === 'UPDATE') title = t('Cập nhật hồ sơ cá nhân');
            else title = t('Thao tác hồ sơ ({v0})', { v0: l.action });
          } else if (l.entityType === 'UserPosition') {
            // BE-114: thay đổi phòng ban / chức vụ — mô tả đã ghi rõ "từ [...] -> [...]".
            title = t('Thay đổi phòng ban / chức vụ');
            detail = l.description || '';
          } else if (l.entityType === 'Department') {
            title = t('{v0} phòng ban', { v0: l.action === 'CREATE' ? 'Tạo' : 'Cập nhật' });
          } else if (l.action === 'LOGIN') {
            title = t('Đăng nhập hệ thống');
            detail = `IP: ${l.ipAddress || 'Unknown'}`;
          }

          return { title, detail, date };
        });
        // Sort newest first
        formatted.sort((a, b) => b.date - a.date);
        setLog(formatted);
      })
      .catch(console.error)
      .finally(() => setLogLoading(false));
  }, [employee?.id]);

  const [editOpen, setEditOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const totalPages = Math.max(1, Math.ceil(log.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const pagedLog = log.slice((safePage - 1) * pageSize, safePage * pageSize);

  if (!employee) {
    return (
      <section className="flex-1 overflow-y-auto bg-background p-6">
        <div className="max-w-3xl mx-auto text-center py-16">
          <span className="material-symbols-outlined text-[48px] text-outline block mb-3">person_off</span>
          <p className="text-on-surface font-medium">{t('Không tìm thấy nhân sự với mã')} {id}.</p>
          <Link to="/personnel" className="inline-flex items-center gap-2 mt-4 text-primary hover:underline font-medium">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            {t('Quay lại danh sách')}
          </Link>
        </div>
      </section>
    );
  }

  const status = STATUS_STYLES[employee.status];
  const isActive = employee.status === 'active';

  const handleResetPassword = async () => {
    if (!window.confirm(t('Đặt lại mật khẩu cho "{v0}"? Một mật khẩu tạm sẽ được tạo.', { v0: employee.name }))) return;
    const pwd = await resetPassword(employee.id);
    if (pwd) {
      pushToast(t('Đã đặt lại mật khẩu tạm cho {v0}: {v1}', { v0: employee.name, v1: pwd }), 'success');
    } else {
      pushToast(t('Không thể đặt lại mật khẩu cho {v0}.', { v0: employee.name }), 'error');
    }
  };

  const handleToggleLock = () => {
    toggleLock(employee.id);
    pushToast(isActive ? t('Đã khóa tài khoản {v0}', { v0: employee.name }) : t('Đã mở khóa tài khoản {v0}', { v0: employee.name }), isActive ? 'warning' : 'success');
  };

  /** BE-87: xoá nhân sự rồi quay về danh sách. */
  const handleDelete = async () => {
    if (!window.confirm(t('Bạn có chắc muốn xóa nhân sự "{v0}"? Thao tác này không thể hoàn tác.', { v0: employee.name }))) return;
    const result = await deleteEmployee(employee.id);
    if (result?.ok) {
      pushToast(t('Đã xóa nhân sự "{v0}".', { v0: employee.name }), 'success');
      navigate('/personnel');
    } else {
      pushToast(t(result?.message) || t('Không xóa được nhân sự'), 'error');
    }
  };

  return (
    <section className="flex-1 overflow-y-auto bg-background h-full relative">
      <div className="w-full px-4 md:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-secondary hover:text-primary transition-colors font-medium text-sm cursor-pointer mb-2"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          {t('Quay lại danh sách')}
        </button>

        {/* Profile Header Card */}
        <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-6 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-5">
            {/* Avatar — BE-97: hiện ẢNH ĐẠI DIỆN thật (trước đây chỉ hiện chữ cái đầu nên ảnh vừa
                tải lên ở danh sách/ hồ sơ không thấy ở đây); lỗi ảnh thì mới rơi về chữ cái đầu. */}
            <div className="relative w-16 h-16 rounded-full bg-[#003B73] text-white flex items-center justify-center font-bold text-2xl flex-shrink-0 shadow-inner overflow-hidden">
              <span>{employee.name.charAt(0)}</span>
              {employee.avatar && (
                <img
                  src={employee.avatar}
                  alt={employee.name}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              )}
            </div>
            {/* Info */}
            <div className="flex flex-col gap-1.5">
               <div className="flex items-center gap-2">
                 <h1 className={PAGE_TITLE_CLS}>{employee.name}</h1>
                 <button onClick={() => setProfileModalOpen(true)} title={t('Xem hồ sơ chi tiết')} className="w-6 h-6 rounded-full border border-outline-variant text-secondary hover:text-primary hover:border-primary hover:bg-primary/5 flex items-center justify-center transition-colors cursor-pointer">
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
                 {/* BE-114: không có chức vụ CHÍNH => tài khoản chưa xác định được phòng ban công tác.
                     Nhân sự thường bị chặn đăng nhập; ADMIN được miễn trừ nên phải cảnh báo rõ. */}
                 {employee.hasPrimaryPosition === false && (
                   <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-warning-container text-on-warning-container border border-warning/30">
                     <span className="material-symbols-outlined text-[14px]">warning</span>
                     {t('Chưa có phòng ban công tác chính')}
                   </span>
                 )}
               </div>
            </div>
          </div>
          
          {/* Action Button Dropdown wrapper — BE-141: ẩn cả nút khi không có quyền nào
              (trước đây vẫn hiện nút "Thao tác" nhưng menu rỗng). */}
          {canPerformAnyAction && (
          <div className="flex-shrink-0 relative w-full md:w-auto mt-4 md:mt-0">
             <button 
               onClick={() => setDropdownOpen(!dropdownOpen)}
               className="w-full md:w-auto justify-center bg-[#004B8D] text-white px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 hover:bg-[#003B73] transition-colors shadow-sm cursor-pointer relative z-50"
             >
               <span className="material-symbols-outlined text-[18px]">settings</span>
               {t('Thao tác')}
               <span className="material-symbols-outlined text-[18px]">expand_more</span>
             </button>
             
             {/* Dropdown overlay */}
             {dropdownOpen && (
               <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)}></div>
             )}

             {/* Dropdown Menu */}
             <div className={`absolute right-0 top-full mt-1 w-48 bg-white border border-outline-variant shadow-lg rounded-md py-1 transition-all z-50 transform origin-top-right ${dropdownOpen ? 'opacity-100 pointer-events-auto scale-100' : 'opacity-0 pointer-events-none scale-95'}`}>
                {/* BE-141: ẩn theo QUYỀN như mục "Xóa nhân sự" — trước đây 3 nút này luôn hiện
                    dù đã khai báo canEditEmployee/canResetPassword/canLockEmployee, nên người
                    không có quyền vẫn thấy nút rồi bấm vào chỉ nhận lỗi 403 từ máy chủ. */}
                {canEditEmployee && (
                  <button onClick={() => { setEditOpen(true); setDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-surface-container-low flex items-center gap-2 cursor-pointer">
                     <span className="material-symbols-outlined text-[18px]">edit</span>
                     {t('Chỉnh sửa thông tin')}
                  </button>
                )}
                {canResetPassword && (
                  <button onClick={() => { handleResetPassword(); setDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-warning hover:bg-warning-container/30 flex items-center gap-2 cursor-pointer">
                     <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                     {t('Đặt lại mật khẩu')}
                  </button>
                )}
                {canLockEmployee && (
                  <>
                    <div className="h-px bg-outline-variant/50 my-1 w-full" />
                    <button onClick={() => { handleToggleLock(); setDropdownOpen(false); }} className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 cursor-pointer ${isActive ? 'text-error hover:bg-error-container/30' : 'text-success hover:bg-success-container/30'}`}>
                       <span className="material-symbols-outlined text-[18px]">{isActive ? 'lock' : 'lock_open'}</span>
                       {isActive ? t('Khóa tài khoản') : t('Mở khóa')}
                    </button>
                  </>
                )}
                {/* BE-87: xoá nhân sự — chỉ hiện khi có quyền. */}
                {canDeleteEmployee && (
                  <>
                    <div className="h-px bg-outline-variant/50 my-1 w-full" />
                    <button onClick={() => { handleDelete(); setDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-error hover:bg-error-container/30 flex items-center gap-2 cursor-pointer">
                       <span className="material-symbols-outlined text-[18px]">delete</span>
                       {t('Xóa nhân sự')}
                    </button>
                  </>
                )}
             </div>
          </div>
          )}
        </div>

        {/* Info Grid (4 columns) */}
        <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(min(100%,160px),1fr))]">
           <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-4 flex flex-col gap-2 relative overflow-hidden">
              <div className="flex items-center gap-1.5 text-secondary">
                 <span className="material-symbols-outlined text-[16px]">badge</span>
                 <span className="text-[10px] font-bold uppercase tracking-wider">{t('Mã nhân sự')}</span>
              </div>
              <div className="font-bold text-on-surface text-sm truncate" title={employee.id}>{employee.id.substring(0, 8).toUpperCase()}</div>
           </div>
           
           <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-4 flex flex-col gap-2 relative overflow-hidden">
              <div className="flex items-center gap-1.5 text-secondary">
                 <span className="material-symbols-outlined text-[16px]">mail</span>
                 <span className="text-[10px] font-bold uppercase tracking-wider">{t('Email công ty')}</span>
              </div>
              <div className="font-bold text-on-surface text-sm truncate" title={employee.email}>{employee.email}</div>
           </div>

           <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-4 flex flex-col gap-2 relative overflow-hidden">
              <div className="flex items-center gap-1.5 text-secondary">
                 <span className="material-symbols-outlined text-[16px]">mail</span>
                 <span className="text-[10px] font-bold uppercase tracking-wider">{t('Email cá nhân')}</span>
              </div>
              <div className="font-bold text-on-surface text-sm truncate" title={employee.personalEmail || t('Không có')}>{employee.personalEmail || t('Không có')}</div>
           </div>

           <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-4 flex flex-col gap-2 relative overflow-hidden">
              <div className="flex items-center gap-1.5 text-secondary">
                 <span className="material-symbols-outlined text-[16px]">call</span>
                 <span className="text-[10px] font-bold uppercase tracking-wider">{t('Số điện thoại')}</span>
              </div>
              <div className="font-bold text-on-surface text-sm">{employee.phone}</div>
           </div>

           {/* BE-163: ngày sinh chỉ hiển thị ở trang chi tiết (đã bỏ khỏi danh sách nhân sự). */}
           <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-4 flex flex-col gap-2 relative overflow-hidden">
              <div className="flex items-center gap-1.5 text-secondary">
                 <span className="material-symbols-outlined text-[16px]">cake</span>
                 <span className="text-[10px] font-bold uppercase tracking-wider">{t('Ngày sinh')}</span>
              </div>
              <div className="font-bold text-on-surface text-sm">{formatDate(employee.dateOfBirth)}</div>
           </div>

           <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-4 flex flex-col gap-2 relative overflow-hidden">
              <div className="flex items-center gap-1.5 text-secondary">
                 <span className="material-symbols-outlined text-[16px]">event</span>
                 <span className="text-[10px] font-bold uppercase tracking-wider">{t('Ngày tạo')}</span>
              </div>
              <div className="font-bold text-on-surface text-sm">{formatDate(employee.createdAt)}</div>
           </div>
        </div>

        {/* Activity Log */}
        <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
           <div className="flex items-center gap-2 px-6 py-4 border-b border-outline-variant/50">
             <span className="material-symbols-outlined text-primary text-[20px]">history</span>
             <h2 className="text-base font-bold text-on-surface tracking-tight">{t('Lịch sử hoạt động')}</h2>
           </div>
           
            <div className="p-6">
              <div className="flex flex-col">
                {logLoading ? (
                  <div className="flex justify-center items-center py-10">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : pagedLog.length === 0 ? (
                  <div className="text-center py-10 text-secondary italic">
                    {t('Chưa có hoạt động nào được ghi nhận.')}
                  </div>
                ) : (
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
                )}
              </div>
           </div>
           
           {/* Pagination Footer */}
           <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-surface-container-lowest border-t border-outline-variant gap-4">
             <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 w-full sm:w-auto">
               <span className="text-xs text-secondary flex items-center gap-2">
                 {t('Hiển thị')}
                 <Select
                   value={pageSize}
                   onChange={(v) => {
                     setPageSize(Number(v));
                     setPage(1); // Reset page on page size change
                   }}
                   className="bg-surface border border-outline-variant/50 rounded-md px-2 py-1 text-xs text-on-surface hover:bg-surface-container-low transition-colors"
                   options={[
                     { value: 5, label: t('5 dòng') },
                     { value: 10, label: t('10 dòng') },
                     { value: 20, label: t('20 dòng') },
                     { value: 50, label: t('50 dòng') },
                   ]}
                 />
                 <span>
                   {log.length === 0 ? 0 : (safePage - 1) * pageSize + 1} - {Math.min(safePage * pageSize, log.length)} {t('trong tổng số')} {log.length} {t('hoạt động')}
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
                 <span className="text-xs text-secondary">{t('Trang {v0} / {v1}', { v0: safePage, v1: totalPages })}</span>
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
      {/* BE-114: Lịch sử công tác (phòng ban & chức vụ) — đơn từ đi theo NGƯỜI nên khi nhân sự
          chuyển phòng, cần tra được đã từng thuộc phòng nào. */}
      <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-outline-variant/50">
          <span className="material-symbols-outlined text-primary text-[20px]">swap_horiz</span>
          <h2 className="text-base font-bold text-on-surface tracking-tight">{t('Lịch sử công tác (phòng ban & chức vụ)')}</h2>
        </div>

        <div className="p-6">
          {positionHistory.length === 0 ? (
            <div className="text-center py-8 text-secondary italic text-sm">
              {t('Chưa ghi nhận thay đổi phòng ban / chức vụ nào.')}
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-outline-variant/40">
              {positionHistory
                .slice((historyPage - 1) * HISTORY_PAGE_SIZE, historyPage * HISTORY_PAGE_SIZE)
                .map((h) => {
                  const kind = {
                    ADDED: { label: t('Thêm vào phòng ban'), icon: 'add_circle', cls: 'text-success' },
                    REMOVED: { label: t('Gỡ khỏi phòng ban'), icon: 'remove_circle', cls: 'text-error' },
                    POSITION_CHANGED: { label: t('Đổi chức danh'), icon: 'badge', cls: 'text-warning' },
                    PRIMARY_CHANGED: { label: t('Chuyển phòng ban công tác chính'), icon: 'swap_horiz', cls: 'text-primary' },
                    PRIMARY_UNSET: { label: t('Chuyển thành chức vụ kiêm nhiệm'), icon: 'remove_circle', cls: 'text-secondary' },
                  }[h.changeType] || { label: h.changeType, icon: 'history', cls: 'text-secondary' };

                  return (
                    <div key={h.id} className="flex items-start gap-3 py-3">
                      <span className={`material-symbols-outlined text-[20px] mt-0.5 ${kind.cls}`}>{kind.icon}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-on-surface">{kind.label}</p>
                        <p className="text-sm text-on-surface-variant mt-0.5">
                          {h.fromDepartmentName
                            ? t('{v0} → {v1}', { v0: h.fromDepartmentName, v1: h.departmentName || t('(không có)') })
                            : (h.departmentName || t('(không có)'))}
                          {h.positionName ? ` · ${h.positionName}` : ''}
                          {h.fromPositionName && h.fromPositionName !== h.positionName ? ` (${t('trước đây')}: ${h.fromPositionName})` : ''}
                        </p>
                        <p className="text-[11px] text-secondary mt-1">
                          {h.isPrimary ? `${t('Chức vụ chính')} · ` : ''}
                          {h.changedByEmail ? t('Thực hiện: {v0}', { v0: h.changedByEmail }) : t('Hệ thống tự ghi nhận')}
                          {h.note ? ` · ${h.note}` : ''}
                          {' · '}
                          {new Date(h.createdAt).toLocaleString('vi-VN')}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {positionHistory.length > HISTORY_PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-3 bg-surface-container-lowest border-t border-outline-variant">
            <span className="text-xs text-secondary">
              {t('Tổng {v0} thay đổi', { v0: positionHistory.length })}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                disabled={historyPage <= 1}
                className="w-7 h-7 rounded bg-surface border border-outline-variant/50 text-secondary hover:bg-surface-container cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              </button>
              <span className="text-xs text-secondary">
                {t('Trang {v0} / {v1}', { v0: historyPage, v1: Math.ceil(positionHistory.length / HISTORY_PAGE_SIZE) })}
              </span>
              <button
                onClick={() => setHistoryPage((p) => Math.min(Math.ceil(positionHistory.length / HISTORY_PAGE_SIZE), p + 1))}
                disabled={historyPage >= Math.ceil(positionHistory.length / HISTORY_PAGE_SIZE)}
                className="w-7 h-7 rounded bg-surface border border-outline-variant/50 text-secondary hover:bg-surface-container cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>


      </div>

      {editOpen && (
        <EmployeeModal
          employee={employee}
          departments={departments}
          positions={positions}
          roles={roles}
          currentUser={currentUser}
          onClose={() => setEditOpen(false)}
          onSave={async (form) => {
            // BE-70: saveEmployee trả { ok, message } — chỉ đóng form khi lưu THÀNH CÔNG,
            // nếu không thì đóng form là mất luôn dòng báo lỗi bên trong.
            const result = await saveEmployee(form);
            if (result?.ok) setEditOpen(false);
            return result;
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
