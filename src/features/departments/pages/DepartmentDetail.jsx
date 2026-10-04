import { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApproval } from '../../../context/useApproval';
import { useHr } from '../../hr/context/HrProvider';
import { departmentService } from '../services/departmentService';
import { STATUS_META } from '../../requests/data/constants';
import { documentTypeService } from '../../../services/documentTypeService';
import UserInfoModal from '../../requests/components/UserInfoModal';
import DepartmentReport from '../components/DepartmentReport';
import useDocumentTitle from '../../../hooks/useDocumentTitle';
import { roleStyle } from '../../../utils/roleLabels';
import { useI18n } from '../../../i18n/I18nProvider';
import { PAGE_TITLE_CLS } from '../../../components/PageHeader';
import { FILTER_SELECT_CLS, FILTER_SEARCH_CLS, FILTER_SEARCH_ICON_CLS } from '../../../styles/filterControls';

const TABS = [
  { id: 'requests', label: 'Danh sách Đơn từ', icon: 'description' },
  { id: 'staff', label: 'Danh sách Nhân sự', icon: 'group' },
  { id: 'report', label: 'Thống kê Đơn từ', icon: 'analytics' },
];

const selectCls = FILTER_SELECT_CLS;

const getSystemRoleInfo = (roles) => {
  const style = roleStyle(roles?.[0]);
  return { label: style.label, color: style.dot, textColor: style.cls };
};

export default function DepartmentDetail() {
  const { t } = useI18n();
  const { id } = useParams();
  const { requests, currentUser, canApprove, approveRequest, pushToast, departments } = useApproval();
  const { employees } = useHr();
  const dept = departments.find((d) => String(d.id) === String(id));
  useDocumentTitle(dept ? dept.name : t('Phòng ban'));

  // BE-43: chỉ TRƯỞNG PHÒNG / PHÓ PHÒNG (hoặc ADMIN/HR) mới được xem đơn của
  // MỌI NGƯỜI trong phòng. Nhân viên chỉ xem được đơn của chính mình.
  const isDeptManager = useMemo(() => {
    if (!dept || !currentUser) return false;
    const role = String(currentUser.role || '').toUpperCase();
    if (role === 'ADMIN' || role === 'HR') return true;
    return String(dept.managerId) === String(currentUser.id)
      || String(dept.deputyManagerId) === String(currentUser.id);
  }, [dept, currentUser]);

  const [tab, setTab] = useState('requests');
  // BE-75: khoá nút "Duyệt nhanh" trong lúc gửi để không bấm trùng.
  const [quickApprovingId, setQuickApprovingId] = useState(null);
  const [q, setQ] = useState('');
  const [typeF, setTypeF] = useState('all');
  const [statusF, setStatusF] = useState('all');
  // Phân trang bảng đơn từ + bảng nhân sự (trước đây hardcode nên "10 dòng" vô tác dụng)
  const [reqPage, setReqPage] = useState(1);
  const [reqPageSize, setReqPageSize] = useState(10);
  const [memPage, setMemPage] = useState(1);
  const [memPageSize, setMemPageSize] = useState(10);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [members, setMembers] = useState([]);
  const [showUserInfo, setShowUserInfo] = useState(null);
  const [popoverId, setPopoverId] = useState(null);

  // Nạp danh sách nhân sự thực của phòng ban khi vào trang.
  useEffect(() => {
    if (!dept) return;
    departmentService.getMembers(dept.id)
      .then(setMembers)
      .catch((err) => {
        console.error('Failed to load department members', err);
        setMembers([]);
      });
  }, [dept?.id]);

  // Bộ lọc "Loại đơn" lấy từ mẫu đơn THẬT của hệ thống (không dùng danh sách cứng).
  useEffect(() => {
    documentTypeService.getAll()
      .then((data) => setDocumentTypes(Array.isArray(data) ? data : []))
      .catch(() => setDocumentTypes([]));
  }, []);

  // BE-19: đơn thuộc phòng ban nếu phòng ban là ĐÍCH trong đơn (Data.departments)
// HOẶC là phòng ban chính của người tạo. Trước đây chỉ lọc theo phòng người tạo
// nên phòng ban được gửi tới (đơn theo chức danh/bộ phận) không nhận được đơn.
  // BE-43: nhân viên (không phải trưởng/phó phòng) CHỈ thấy đơn của chính mình.
  const deptRequests = useMemo(
    () => requests.filter((r) => {
      if (!isDeptManager && String(r.creatorId) !== String(currentUser?.id)) return false;
      if (String(r.departmentId) === String(id)) return true;
      const targets = r._rawData?.departments;
      return Array.isArray(targets) && targets.some((d) => String(d) === String(id));
    }),
    [requests, id, isDeptManager, currentUser?.id]
  );

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return deptRequests.filter((r) => {
      const creatorName = r.creatorName || employees.find((u) => u.id === r.creatorId)?.name;
      const matchQ =
        !query ||
        r.id.toLowerCase().includes(query) ||
        r.title.toLowerCase().includes(query) ||
        (creatorName && creatorName.toLowerCase().includes(query));
      const matchT = typeF === 'all' || r.type === typeF;
      const matchS =
        statusF === 'all' ||
        (statusF === 'pending' && r.status === 'pending') ||
        (statusF === 'approved' && r.status === 'approved') ||
        ((statusF === 'rejected' && (r.status === 'rejected' || r.status === 'returned_timeout')));
      return matchQ && matchT && matchS;
    });
  }, [deptRequests, q, typeF, statusF]);

  // Phân trang: đổi bộ lọc thì quay về trang 1 (tránh đứng ở trang không còn dữ liệu)
  useEffect(() => { setReqPage(1); }, [q, typeF, statusF]);

  const reqTotalPages = Math.max(1, Math.ceil(filtered.length / reqPageSize));
  const reqSafePage = Math.min(Math.max(1, reqPage), reqTotalPages);
  const pagedRequests = filtered.slice((reqSafePage - 1) * reqPageSize, reqSafePage * reqPageSize);

  const memTotalPages = Math.max(1, Math.ceil(members.length / memPageSize));
  const memSafePage = Math.min(Math.max(1, memPage), memTotalPages);
  const pagedMembers = members.slice((memSafePage - 1) * memPageSize, memSafePage * memPageSize);

  if (!dept) {
    return (
      <div className="flex-1 flex items-center justify-center h-full bg-background p-6">
        <div className="text-center">
          <span className="material-symbols-outlined text-[48px] text-outline block mb-2">search_off</span>
          <p className="text-on-surface font-medium">{t('Không tìm thấy phòng ban.')}</p>
          <Link to="/" className="text-primary text-sm hover:underline mt-2 inline-block">
            {t('Quay lại danh sách')}
          </Link>
        </div>
      </div>
    );
  }

  // BE-75: duyệt nhanh trước đây gọi thẳng API, không hỏi lại và không khoá nút. Nếu đơn đã bị
  // người khác duyệt / quá hạn thì người dùng chỉ thấy "Lỗi khi phê duyệt" mà không hiểu vì sao.
  // Nay: hỏi xác nhận, khoá nút trong lúc gửi, và provider tự tải lại danh sách sau đó.
  const quickApprove = async (r) => {
    const code = r.id.substring(0, 8).toUpperCase();
    if (!window.confirm(t('Phê duyệt đơn {v0} ở bước hiện tại?', { v0: code }))) return;
    setQuickApprovingId(r.id);
    try {
      await approveRequest(r.id);
    } finally {
      setQuickApprovingId(null);
    }
  };



  return (
    <div className="flex-1 overflow-y-auto min-h-0 bg-background">
      <div className="w-full">
        {/* Header */}
        <header className="bg-[#f6f6f4] border-b border-outline-variant sticky top-0 z-20">
          <div className="px-6 pt-4">
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-sm text-secondary hover:text-primary transition-colors mb-3"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              {t('Quay lại')}
            </Link>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-primary/10 text-primary rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {dept.iconImage ? (
                    <img src={dept.iconImage} alt={t(dept.name)} className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-3xl">{dept.icon}</span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-3 flex-wrap mb-1">
                    <h1 className={PAGE_TITLE_CLS}>{t(dept.name)}</h1>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-medium ${dept.status === 'Active'
                        ? 'bg-[#E8F8EE] text-[#037847]'
                        : 'bg-[#F1F5F9] text-[#475569]'
                        }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${dept.status === 'Active' ? 'bg-[#037847]' : 'bg-[#64748B]'
                          }`}
                      ></span>
                      {dept.status === 'Active' ? t('Đang hoạt động') : t('Ngừng hoạt động')}
                    </span>
                  </div>
                  <p className="text-sm text-secondary">
                    {t('Mã phòng:')} <strong className="text-on-surface">{dept.code}</strong>
                    <span className="mx-2 text-outline">•</span>
                    {dept.leaders.map((l, i) => (
                      <span key={i} className="inline-flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-primary">badge</span>
                        {t(l.title)}: <strong className="text-on-surface">{l.name}</strong>
                        {i < dept.leaders.length - 1 && <span className="mx-1 text-outline">,</span>}
                      </span>
                    ))}
                    <span className="mx-2 text-outline">•</span>
                    <span className="inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-secondary">group</span>
                      <strong className="text-on-surface">{members.length}</strong> {t('thành viên')}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-6 flex gap-1 -mb-px">
            {TABS.map((tabItem) => {
              const active = tab === tabItem.id;
              return (
                <button
                  key={tabItem.id}
                  onClick={() => setTab(tabItem.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer ${active
                    ? 'border-primary text-primary'
                    : 'border-transparent text-secondary hover:text-on-surface hover:bg-surface-container-low'
                    }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{tabItem.icon}</span>
                  {t(tabItem.label)}
                </button>
              );
            })}
          </div>
        </header>

        <div className="p-6">
          {/* TAB 1: Requests */}
          {tab === 'requests' && (
            <section className="bg-surface border border-outline-variant rounded-lg shadow-sm overflow-hidden">
              {/* Filter bar */}
              <div className="p-4 border-b border-outline-variant flex flex-wrap items-center gap-3 bg-surface-container-low">
                <div className="relative flex-1 min-w-[220px] max-w-md">
                  <span className={FILTER_SEARCH_ICON_CLS}>
                    search
                  </span>
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className={FILTER_SEARCH_CLS}
                    placeholder={t('Tìm theo mã đơn, tên nhân viên...')}
                    type="text"
                  />
                </div>
                <select value={typeF} onChange={(e) => setTypeF(e.target.value)} className={`${selectCls} w-full sm:w-auto`}>
                  <option value="all">{t('Loại: Tất cả')}</option>
                  {documentTypes.map((d) => (
                    <option key={d.id} value={d.name}>
                      {t(d.name)}
                    </option>
                  ))}
                </select>
                <select value={statusF} onChange={(e) => setStatusF(e.target.value)} className={`${selectCls} w-full sm:w-auto`}>
                  <option value="all">{t('Trạng thái: Tất cả')}</option>
                  <option value="pending">{t('Đang chờ duyệt')}</option>
                  <option value="approved">{t('Đã phê duyệt')}</option>
                  <option value="rejected">{t('Từ chối / Trả về')}</option>
                </select>
                <span className="ml-auto text-xs text-secondary">
                  {filtered.length} / {deptRequests.length} {t('đơn từ')}
                </span>
              </div>

              {/* BE-43: nhân viên chỉ thấy đơn của chính mình trong phòng này */}
              {!isDeptManager && (
                <div className="px-4 py-2.5 bg-primary/5 border-b border-outline-variant text-xs text-secondary flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-primary">visibility</span>
                  {t('Bạn đang xem')} <strong className="text-on-surface">{t('đơn từ của chính mình')}</strong> {t('trong phòng ban này.\n                  Chỉ trưởng phòng / phó phòng mới xem được đơn của toàn bộ nhân sự.')}
                </div>
              )}

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-container-lowest text-secondary border-b border-outline-variant uppercase text-xs">
                    <tr>
                      <th className="py-3 px-4 font-medium whitespace-nowrap">{t('Mã đơn')}</th>
                      <th className="py-3 px-4 font-medium whitespace-nowrap">{t('Tiêu đề')}</th>
                      <th className="py-3 px-4 font-medium whitespace-nowrap">{t('Người tạo')}</th>
                      <th className="py-3 px-4 font-medium whitespace-nowrap">{t('Ngày nộp')}</th>
                      <th className="py-3 px-4 font-medium whitespace-nowrap">{t('Bước hiện tại')}</th>
                      <th className="py-3 px-4 font-medium whitespace-nowrap">{t('Trạng thái')}</th>
                      <th className="py-3 px-4 font-medium whitespace-nowrap text-right">{t('Hành động')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-10 px-4 text-center text-secondary">
                          <span className="material-symbols-outlined text-[36px] block mb-2 text-outline">
                            inbox
                          </span>
                          {t('Phòng ban chưa có đơn từ phù hợp bộ lọc.')}
                        </td>
                      </tr>
                    ) : (
                      pagedRequests.map((r) => {
                        const creatorName = r.creatorName || employees.find((u) => u.id === r.creatorId)?.name;
                        const creatorAvatar = employees.find((u) => u.id === r.creatorId)?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(creatorName || 'User')}&background=random&color=fff&size=128`;
                        const meta = STATUS_META[r.status];
                        // BE-75: trạng thái đơn từ máy chủ là 'pendingapproval' (không phải 'pending'),
                        // trước đây chỉ so 'pending' nên mọi đơn đang chờ đều hiện nhầm "Đã dừng".
                        const isWaiting = ['pending', 'submitted', 'pendingapproval'].includes(r.status);
                        const stepLabel =
                          isWaiting
                            ? (r.steps[r.currentStep]?.name || t('Cấp {v0}', { v0: r.currentStep + 1 }))
                            : r.status === 'approved'
                              ? t('Hoàn tất')
                              : t('Đã dừng');
                        const canQuick = canApprove(r);
                        return (
                          <tr key={r.id} className="hover:bg-surface-container-low transition-colors">
                            <td className="py-3 px-4">
                              <Link
                                to={`/requests/${r.id}`}
                                className="text-primary font-medium hover:underline"
                                title={r.id}
                              >
                                {r.id.substring(0, 8).toUpperCase()}
                              </Link>
                            </td>
                            <td className="py-3 px-4 text-on-surface max-w-[260px] truncate">{r.title}</td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <img
                                  className="w-6 h-6 rounded-full border border-outline-variant object-cover"
                                  src={creatorAvatar}
                                  alt={creatorName}
                                />
                                <span className="text-on-surface-variant">{creatorName}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-secondary whitespace-nowrap">{r.createdAt}</td>
                            <td className="py-3 px-4 text-secondary whitespace-nowrap">{stepLabel}</td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-medium ${r.status === 'pending'
                                  ? 'bg-[#FEF3C7] text-[#B45309]'
                                  : r.status === 'approved'
                                    ? 'bg-[#E8F8EE] text-[#037847]'
                                    : 'bg-[#FEE2E2] text-[#B91C1C]'
                                  }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${r.status === 'pending'
                                  ? 'bg-[#D97706]'
                                  : r.status === 'approved'
                                    ? 'bg-[#037847]'
                                    : 'bg-[#DC2626]'
                                  }`}></span>
                                {t(meta?.label)}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              {canQuick ? (
                                <button
                                  onClick={() => quickApprove(r)}
                                  disabled={quickApprovingId === r.id}
                                  className="bg-primary text-on-primary hover:bg-on-primary-fixed-variant px-3 py-1.5 rounded-md text-xs font-medium transition-colors inline-flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                  title={t('Duyệt nhanh (bước hiện tại: {v0})', { v0: currentUser.name })}
                                >
                                  <span className="material-symbols-outlined text-[14px]">
                                    {quickApprovingId === r.id ? 'hourglass_top' : 'bolt'}
                                  </span>
                                  {quickApprovingId === r.id ? t('Đang duyệt...') : t('Duyệt nhanh')}
                                </button>
                              ) : (
                                <Link
                                  to={`/requests/${r.id}`}
                                  className="text-secondary hover:text-primary text-xs inline-flex items-center gap-1 transition-colors"
                                >
                                  <span className="material-symbols-outlined text-[14px]">visibility</span>
                                  {t('Xem chi tiết')}
                                </Link>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <div className="p-3 border-t border-outline-variant bg-surface-container-lowest text-xs text-secondary flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {t('Hiển thị')}
                  <select
                    value={reqPageSize}
                    onChange={(e) => { setReqPageSize(Number(e.target.value)); setReqPage(1); }}
                    className="filter-control filter-select h-[34px] py-0 pl-2.5 pr-8 text-xs"
                  >
                    <option value={5}>{t('5 dòng')}</option>
                    <option value={10}>{t('10 dòng')}</option>
                    <option value={20}>{t('20 dòng')}</option>
                    <option value={50}>{t('50 dòng')}</option>
                  </select>
                  <span>
                    {filtered.length === 0 ? 0 : (reqSafePage - 1) * reqPageSize + 1} - {Math.min(reqSafePage * reqPageSize, filtered.length)} {t('trong tổng số')} {filtered.length} {t('đơn từ')}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setReqPage((p) => Math.max(1, p - 1))}
                    disabled={reqSafePage <= 1}
                    className="w-7 h-7 rounded bg-surface border border-outline-variant/50 text-secondary hover:bg-surface-container hover:text-on-surface cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                  </button>
                  <div className="px-2 flex items-center justify-center min-w-[4rem]">
                    <span className="text-xs text-secondary">{t('Trang {v0} / {v1}', { v0: reqSafePage, v1: reqTotalPages })}</span>
                  </div>
                  <button
                    onClick={() => setReqPage((p) => Math.min(reqTotalPages, p + 1))}
                    disabled={reqSafePage >= reqTotalPages}
                    className="w-7 h-7 rounded bg-surface border border-outline-variant/50 text-secondary hover:bg-surface-container hover:text-on-surface cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* TAB 2: Staff */}
          {tab === 'staff' && (
            <section className="bg-surface border border-outline-variant rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-container-lowest text-secondary border-b border-outline-variant uppercase text-xs">
                    <tr>
                      <th className="py-3 px-4 font-medium whitespace-nowrap">{t('Mã & Họ tên')}</th>
                      <th className="py-3 px-4 font-medium whitespace-nowrap">{t('Liên hệ')}</th>
                      <th className="py-3 px-4 font-medium whitespace-nowrap">{t('Phòng ban & Chức vụ')}</th>
                      <th className="py-3 px-4 font-medium whitespace-nowrap">{t('Kiêm nhiệm')}</th>
                      <th className="py-3 px-4 font-medium whitespace-nowrap">{t('Vai trò hệ thống')}</th>
                      <th className="py-3 px-4 font-medium whitespace-nowrap">{t('Trạng thái')}</th>
                      <th className="py-3 px-4 font-medium whitespace-nowrap text-right">{t('Thao tác')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {members.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-10 px-4 text-center text-secondary">
                          <span className="material-symbols-outlined text-[36px] block mb-2 text-outline">
                            group_off
                          </span>
                          {t('Phòng ban chưa có nhân sự trực thuộc.')}
                        </td>
                      </tr>
                    ) : (
                      pagedMembers.map((s) => {
                        const extraPositions = (s.positions || []).length > 1 ? s.positions.length - 1 : 0;
                        const roleInfo = getSystemRoleInfo(s.systemRoles);
                        
                        return (
                          <tr key={s.id} className="hover:bg-surface-container-low transition-colors">
                            <td className="py-3 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <img
                                  className="w-10 h-10 rounded-full border border-outline-variant object-cover"
                                  src={s.avatar}
                                  alt={s.name}
                                />
                                <div className="flex flex-col">
                                  <span className="text-on-surface font-medium">{s.name}</span>
                                  <span className="text-xs text-secondary">{s.shortId}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <div className="flex flex-col gap-1 text-secondary text-[13px]">
                                <div className="flex items-center gap-1.5">
                                  <span className="material-symbols-outlined text-[14px]">mail</span>
                                  {s.email}
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="material-symbols-outlined text-[14px]">call</span>
                                  {s.phone || t('Chưa cập nhật')}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-on-surface font-medium text-[13px]">{t(s.departmentName || dept.name)}</span>
                                <span className="text-secondary text-[13px]">{t(s.role)}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <div className="relative">
                                {extraPositions === 0 ? (
                                  <span className="text-secondary text-[13px]">{t('Không')}</span>
                                ) : (
                                  <button
                                    onClick={(ev) => { ev.stopPropagation(); setPopoverId(popoverId === s.id ? null : s.id); }}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary-container/40 text-primary text-xs font-medium hover:bg-primary-container/70 transition-colors cursor-pointer"
                                  >
                                    <span className="material-symbols-outlined text-[14px]">workspaces</span>
                                    +{extraPositions} {t('vị trí')}
                                  </button>
                                )}
                                {popoverId === s.id && (
                                  <>
                                    <div className="fixed inset-0 z-40" onClick={(ev) => { ev.stopPropagation(); setPopoverId(null); }} />
                                    <div onClick={(ev) => ev.stopPropagation()} className="absolute z-50 left-0 top-full mt-1 w-72 bg-surface border border-outline-variant rounded-lg shadow-lg p-3">
                                      <div className="font-label-md text-on-surface-variant uppercase text-xs font-semibold mb-2">
                                        {t('Vị trí kiêm nhiệm')}
                                      </div>
                                      <div className="flex flex-col gap-2 whitespace-normal">
                                        {(s.positions || []).filter(p => String(p.departmentId) !== String(dept.id)).map((p, i) => (
                                          <div key={i} className="flex items-start gap-2">
                                            <span className="material-symbols-outlined text-[16px] text-primary mt-0.5">badge</span>
                                            <div className="text-sm">
                                              <div className="text-on-surface font-medium">{p.departmentName || t('Phòng ban {v0}', { v0: p.departmentId })}</div>
                                              <div className="text-xs text-secondary">{p.positionName || t('Nhân sự')}</div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <div className={`flex items-center gap-1.5 ${roleInfo.textColor} text-[13px] font-medium`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${roleInfo.color}`}></span>
                                {roleInfo.label}
                              </div>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-medium ${s.status === 'active'
                                  ? 'bg-[#E8F8EE] text-[#037847]'
                                  : 'bg-[#F1F5F9] text-[#475569]'
                                  }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${s.status === 'active' ? 'bg-[#037847]' : 'bg-[#64748B]'}`}
                                ></span>
                                {s.status === 'active' ? t('Đang hoạt động') : t('Nghỉ')}
                              </span>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap text-right">
                              <button
                                onClick={() => setShowUserInfo({
                                  id: s.id,
                                  name: s.name,
                                  role: s.role,
                                  avatar: s.avatar,
                                  employeeId: s.shortId,
                                  departmentId: dept.id,
                                  subtitle: s.subtitle,
                                  email: s.email,
                                  personalEmail: s.personalEmail,
                                  phone: s.phone,
                                  status: s.status,
                                  systemRole: s.systemRoles?.[0]
                                })}
                                className="p-1.5 text-secondary hover:text-primary hover:bg-primary-container/30 rounded-full transition-colors cursor-pointer inline-flex"
                                title={t('Xem thông tin chi tiết')}
                              >
                                <span className="material-symbols-outlined text-[18px]">visibility</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <div className="p-3 border-t border-outline-variant bg-surface-container-lowest text-xs text-secondary flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {t('Hiển thị')}
                  <select
                    value={memPageSize}
                    onChange={(e) => { setMemPageSize(Number(e.target.value)); setMemPage(1); }}
                    className="filter-control filter-select h-[34px] py-0 pl-2.5 pr-8 text-xs"
                  >
                    <option value={5}>{t('5 dòng')}</option>
                    <option value={10}>{t('10 dòng')}</option>
                    <option value={20}>{t('20 dòng')}</option>
                    <option value={50}>{t('50 dòng')}</option>
                  </select>
                  <span>
                    {members.length === 0 ? 0 : (memSafePage - 1) * memPageSize + 1} - {Math.min(memSafePage * memPageSize, members.length)} {t('trong tổng số')} {members.length} {t('nhân sự')}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setMemPage((p) => Math.max(1, p - 1))}
                    disabled={memSafePage <= 1}
                    className="w-7 h-7 rounded bg-surface border border-outline-variant/50 text-secondary hover:bg-surface-container hover:text-on-surface cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                  </button>
                  <div className="px-2 flex items-center justify-center min-w-[4rem]">
                    <span className="text-xs text-secondary">{t('Trang {v0} / {v1}', { v0: memSafePage, v1: memTotalPages })}</span>
                  </div>
                  <button
                    onClick={() => setMemPage((p) => Math.min(memTotalPages, p + 1))}
                    disabled={memSafePage >= memTotalPages}
                    className="w-7 h-7 rounded bg-surface border border-outline-variant/50 text-secondary hover:bg-surface-container hover:text-on-surface cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </button>
                </div>
              </div>
            </section>
          )}


          {/* TAB 3: Report */}
          {tab === 'report' && (
            <DepartmentReport
              deptRequests={deptRequests}
              members={members}
              employees={employees}
              isDeptManager={isDeptManager}
              currentUserId={currentUser?.id}
            />
          )}
        </div>
      </div>

      {showUserInfo && (
        <UserInfoModal
          user={showUserInfo}
          onClose={() => setShowUserInfo(null)}
        />
      )}
    </div>
  );
}
