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

const TABS = [
  { id: 'requests', label: 'Danh sách Đơn từ', icon: 'description' },
  { id: 'staff', label: 'Danh sách Nhân sự', icon: 'group' },
  { id: 'report', label: 'Thống kê Đơn từ', icon: 'analytics' },
];

const selectCls =
  'bg-surface border border-outline-variant rounded-md px-3 py-1.5 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary';

const getSystemRoleInfo = (roles) => {
  const style = roleStyle(roles?.[0]);
  return { label: style.label, color: style.dot, textColor: style.cls };
};

export default function DepartmentDetail() {
  const { id } = useParams();
  const { requests, currentUser, canApprove, approveRequest, pushToast, departments } = useApproval();
  const { employees } = useHr();
  const dept = departments.find((d) => String(d.id) === String(id));
  useDocumentTitle(dept ? dept.name : 'Phòng ban');

  const [tab, setTab] = useState('requests');
  const [q, setQ] = useState('');
  const [typeF, setTypeF] = useState('all');
  const [statusF, setStatusF] = useState('all');
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
  const deptRequests = useMemo(
    () => requests.filter((r) => {
      if (String(r.departmentId) === String(id)) return true;
      const targets = r._rawData?.departments;
      return Array.isArray(targets) && targets.some((d) => String(d) === String(id));
    }),
    [requests, id]
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

  if (!dept) {
    return (
      <div className="flex-1 flex items-center justify-center h-full bg-background p-6">
        <div className="text-center">
          <span className="material-symbols-outlined text-[48px] text-outline block mb-2">search_off</span>
          <p className="text-on-surface font-medium">Không tìm thấy phòng ban.</p>
          <Link to="/" className="text-primary text-sm hover:underline mt-2 inline-block">
            Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  const quickApprove = (r) => {
    approveRequest(r.id);
  };



  return (
    <div className="flex-1 overflow-y-auto min-h-0 bg-surface">
      <div className="w-full">
        {/* Header */}
        <header className="bg-surface border-b border-outline-variant sticky top-0 z-20">
          <div className="px-6 pt-4">
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-sm text-secondary hover:text-primary transition-colors mb-3"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Quay lại
            </Link>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-primary/10 text-primary rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {dept.iconImage ? (
                    <img src={dept.iconImage} alt={dept.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-3xl">{dept.icon}</span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-3 flex-wrap mb-1">
                    <h1 className="font-display-lg text-on-surface">{dept.name}</h1>
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
                      {dept.status === 'Active' ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                    </span>
                  </div>
                  <p className="text-sm text-secondary">
                    Mã phòng: <strong className="text-on-surface">{dept.code}</strong>
                    <span className="mx-2 text-outline">•</span>
                    {dept.leaders.map((l, i) => (
                      <span key={i} className="inline-flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-primary">badge</span>
                        {l.title}: <strong className="text-on-surface">{l.name}</strong>
                        {i < dept.leaders.length - 1 && <span className="mx-1 text-outline">,</span>}
                      </span>
                    ))}
                    <span className="mx-2 text-outline">•</span>
                    <span className="inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-secondary">group</span>
                      <strong className="text-on-surface">{members.length}</strong> thành viên
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-6 flex gap-1 -mb-px">
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer ${active
                    ? 'border-primary text-primary'
                    : 'border-transparent text-secondary hover:text-on-surface hover:bg-surface-container-low'
                    }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
                  {t.label}
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
                  <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-secondary text-[18px]">
                    search
                  </span>
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-surface border border-outline-variant rounded-md focus:ring-1 focus:ring-primary focus:border-primary text-sm outline-none placeholder:text-secondary"
                    placeholder="Tìm theo mã đơn, tên nhân viên..."
                    type="text"
                  />
                </div>
                <select value={typeF} onChange={(e) => setTypeF(e.target.value)} className={`${selectCls} w-full sm:w-auto`}>
                  <option value="all">Loại: Tất cả</option>
                  {documentTypes.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <select value={statusF} onChange={(e) => setStatusF(e.target.value)} className={`${selectCls} w-full sm:w-auto`}>
                  <option value="all">Trạng thái: Tất cả</option>
                  <option value="pending">Đang chờ duyệt</option>
                  <option value="approved">Đã phê duyệt</option>
                  <option value="rejected">Từ chối / Trả về</option>
                </select>
                <span className="ml-auto text-xs text-secondary">
                  {filtered.length} / {deptRequests.length} đơn từ
                </span>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-container-lowest text-secondary border-b border-outline-variant uppercase text-xs">
                    <tr>
                      <th className="py-3 px-4 font-medium whitespace-nowrap">Mã đơn</th>
                      <th className="py-3 px-4 font-medium whitespace-nowrap">Tiêu đề</th>
                      <th className="py-3 px-4 font-medium whitespace-nowrap">Người tạo</th>
                      <th className="py-3 px-4 font-medium whitespace-nowrap">Ngày nộp</th>
                      <th className="py-3 px-4 font-medium whitespace-nowrap">Bước hiện tại</th>
                      <th className="py-3 px-4 font-medium whitespace-nowrap">Trạng thái</th>
                      <th className="py-3 px-4 font-medium whitespace-nowrap text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-10 px-4 text-center text-secondary">
                          <span className="material-symbols-outlined text-[36px] block mb-2 text-outline">
                            inbox
                          </span>
                          Phòng ban chưa có đơn từ phù hợp bộ lọc.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((r) => {
                        const creatorName = r.creatorName || employees.find((u) => u.id === r.creatorId)?.name;
                        const creatorAvatar = employees.find((u) => u.id === r.creatorId)?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(creatorName || 'User')}&background=random&color=fff&size=128`;
                        const meta = STATUS_META[r.status];
                        const stepLabel =
                          r.status === 'pending'
                            ? (r.steps[r.currentStep]?.name || `Cấp ${r.currentStep + 1}`)
                            : r.status === 'approved'
                              ? 'Hoàn tất'
                              : 'Đã dừng';
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
                                {meta?.label}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              {canQuick ? (
                                <button
                                  onClick={() => quickApprove(r)}
                                  className="bg-primary text-on-primary hover:bg-on-primary-fixed-variant px-3 py-1.5 rounded-md text-xs font-medium transition-colors inline-flex items-center gap-1 cursor-pointer"
                                  title={`Duyệt nhanh (bước hiện tại: ${currentUser.name})`}
                                >
                                  <span className="material-symbols-outlined text-[14px]">bolt</span>
                                  Duyệt nhanh
                                </button>
                              ) : (
                                <Link
                                  to={`/requests/${r.id}`}
                                  className="text-secondary hover:text-primary text-xs inline-flex items-center gap-1 transition-colors"
                                >
                                  <span className="material-symbols-outlined text-[14px]">visibility</span>
                                  Xem chi tiết
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
              <div className="p-3 border-t border-outline-variant bg-surface-container-lowest text-xs text-secondary flex items-center justify-between">
                <div>
                  Hiển thị 
                  <select className="mx-2 bg-surface border border-outline-variant rounded px-1 py-0.5 outline-none">
                    <option>10 dòng</option>
                  </select>
                  1 - {filtered.length} trong tổng số {deptRequests.length} đơn từ
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-outline cursor-not-allowed">chevron_left</span>
                  <span>Trang 1 / 1</span>
                  <span className="material-symbols-outlined text-[16px] text-outline cursor-not-allowed">chevron_right</span>
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
                      <th className="py-3 px-4 font-medium whitespace-nowrap">Mã & Họ tên</th>
                      <th className="py-3 px-4 font-medium whitespace-nowrap">Liên hệ</th>
                      <th className="py-3 px-4 font-medium whitespace-nowrap">Phòng ban & Chức vụ</th>
                      <th className="py-3 px-4 font-medium whitespace-nowrap">Kiêm nhiệm</th>
                      <th className="py-3 px-4 font-medium whitespace-nowrap">Vai trò hệ thống</th>
                      <th className="py-3 px-4 font-medium whitespace-nowrap">Trạng thái</th>
                      <th className="py-3 px-4 font-medium whitespace-nowrap text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {members.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-10 px-4 text-center text-secondary">
                          <span className="material-symbols-outlined text-[36px] block mb-2 text-outline">
                            group_off
                          </span>
                          Phòng ban chưa có nhân sự trực thuộc.
                        </td>
                      </tr>
                    ) : (
                      members.map((s) => {
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
                                  {s.phone || 'Chưa cập nhật'}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-on-surface font-medium text-[13px]">{s.departmentName || dept.name}</span>
                                <span className="text-secondary text-[13px]">{s.role}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <div className="relative">
                                {extraPositions === 0 ? (
                                  <span className="text-secondary text-[13px]">Không</span>
                                ) : (
                                  <button
                                    onClick={(ev) => { ev.stopPropagation(); setPopoverId(popoverId === s.id ? null : s.id); }}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary-container/40 text-primary text-xs font-medium hover:bg-primary-container/70 transition-colors cursor-pointer"
                                  >
                                    <span className="material-symbols-outlined text-[14px]">workspaces</span>
                                    +{extraPositions} vị trí
                                  </button>
                                )}
                                {popoverId === s.id && (
                                  <>
                                    <div className="fixed inset-0 z-40" onClick={(ev) => { ev.stopPropagation(); setPopoverId(null); }} />
                                    <div onClick={(ev) => ev.stopPropagation()} className="absolute z-50 left-0 top-full mt-1 w-72 bg-surface border border-outline-variant rounded-lg shadow-lg p-3">
                                      <div className="font-label-md text-on-surface-variant uppercase text-xs font-semibold mb-2">
                                        Vị trí kiêm nhiệm
                                      </div>
                                      <div className="flex flex-col gap-2 whitespace-normal">
                                        {(s.positions || []).filter(p => String(p.departmentId) !== String(dept.id)).map((p, i) => (
                                          <div key={i} className="flex items-start gap-2">
                                            <span className="material-symbols-outlined text-[16px] text-primary mt-0.5">badge</span>
                                            <div className="text-sm">
                                              <div className="text-on-surface font-medium">{p.departmentName || `Phòng ban ${p.departmentId}`}</div>
                                              <div className="text-xs text-secondary">{p.positionName || 'Nhân sự'}</div>
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
                                {s.status === 'active' ? 'Đang hoạt động' : 'Nghỉ'}
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
                                title="Xem thông tin chi tiết"
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
              <div className="p-3 border-t border-outline-variant bg-surface-container-lowest text-xs text-secondary flex items-center justify-between">
                <div>
                  Hiển thị 
                  <select className="mx-2 bg-surface border border-outline-variant rounded px-1 py-0.5 outline-none">
                    <option>10 dòng</option>
                  </select>
                  1 - {members.length} trong tổng số {members.length} nhân sự
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-outline cursor-not-allowed">chevron_left</span>
                  <span>Trang 1 / 1</span>
                  <span className="material-symbols-outlined text-[16px] text-outline cursor-not-allowed">chevron_right</span>
                </div>
              </div>
            </section>
          )}


          {/* TAB 3: Report */}
          {tab === 'report' && (
            <DepartmentReport deptRequests={deptRequests} members={members} employees={employees} />
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
