import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApproval } from '../../../context/useApproval';
import { DEPT_STAFF } from '../data/departments';
import { USERS, STATUS_META, STEP_ROLE, REQUEST_TYPES } from '../../requests/data/seed';
import useDocumentTitle from '../../../hooks/useDocumentTitle';

const TABS = [
  { id: 'requests', label: 'Danh sách Đơn từ', icon: 'description' },
  { id: 'staff', label: 'Danh sách Nhân sự', icon: 'group' },
];

const selectCls =
  'bg-surface border border-outline-variant rounded-md px-3 py-1.5 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary';

// Staff status pill
const staffStatus = (s) =>
  s === 'active'
    ? 'bg-success-container text-on-success-container'
    : 'bg-surface-container-high text-secondary';

export default function DepartmentDetail() {
  const { id } = useParams();
  const { requests, currentUser, canApprove, approveRequest, pushToast, departments } = useApproval();
  const dept = departments.find((d) => String(d.id) === String(id));
  useDocumentTitle(dept ? dept.name : 'Phòng ban');

  const [tab, setTab] = useState('requests');
  const [q, setQ] = useState('');
  const [typeF, setTypeF] = useState('all');
  const [statusF, setStatusF] = useState('all');

  // All requests belonging to this department.
  const deptRequests = useMemo(
    () => requests.filter((r) => r.departmentId === Number(id)),
    [requests, id]
  );

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return deptRequests.filter((r) => {
      const creator = USERS.find((u) => u.id === r.creatorId);
      const matchQ =
        !query ||
        r.id.toLowerCase().includes(query) ||
        r.title.toLowerCase().includes(query) ||
        (creator && creator.name.toLowerCase().includes(query));
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
    pushToast(`Đã duyệt nhanh ${r.id}`, 'success');
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
                <div className="w-14 h-14 bg-primary/10 text-primary rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-3xl">{dept.icon}</span>
                </div>
                <div>
                  <div className="flex items-center gap-3 flex-wrap mb-1">
                    <h1 className="font-display-lg text-on-surface">{dept.name}</h1>
                    <span className="bg-success-container text-on-success-container text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                      {dept.status}
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
                      <strong className="text-on-surface">{dept.memberCount}</strong> thành viên
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
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                    active
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
                <select value={typeF} onChange={(e) => setTypeF(e.target.value)} className={selectCls}>
                  <option value="all">Loại: Tất cả</option>
                  {REQUEST_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <select value={statusF} onChange={(e) => setStatusF(e.target.value)} className={selectCls}>
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
                  <thead className="bg-surface-container-lowest text-secondary border-b border-outline-variant">
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
                        const creator = USERS.find((u) => u.id === r.creatorId);
                        const meta = STATUS_META[r.status];
                        const stepLabel =
                          r.status === 'pending'
                            ? STEP_ROLE[r.steps[r.currentStep]?.approverId] || `Cấp ${r.currentStep + 1}`
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
                              >
                                {r.id}
                              </Link>
                            </td>
                            <td className="py-3 px-4 text-on-surface max-w-[260px] truncate">{r.title}</td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <img
                                  className="w-6 h-6 rounded-full border border-outline-variant object-cover"
                                  src={creator?.avatar}
                                  alt={creator?.name}
                                />
                                <span className="text-on-surface-variant">{creator?.name}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-secondary whitespace-nowrap">{r.createdAt}</td>
                            <td className="py-3 px-4 text-secondary whitespace-nowrap">{stepLabel}</td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] uppercase tracking-wide font-bold border ${meta?.badge}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${meta?.dot}`}></span>
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
            </section>
          )}

          {/* TAB 2: Staff */}
          {tab === 'staff' && (
            <section className="bg-surface border border-outline-variant rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-container-lowest text-secondary border-b border-outline-variant">
                    <tr>
                      <th className="py-3 px-4 font-medium whitespace-nowrap">Mã NV</th>
                      <th className="py-3 px-4 font-medium whitespace-nowrap">Họ tên</th>
                      <th className="py-3 px-4 font-medium whitespace-nowrap">Chức vụ</th>
                      <th className="py-3 px-4 font-medium whitespace-nowrap">Email</th>
                      <th className="py-3 px-4 font-medium whitespace-nowrap">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {(dept.staff && dept.staff.length ? dept.staff : DEPT_STAFF[dept.id] || []).map((s) => (
                      <tr key={s.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="py-3 px-4 text-secondary whitespace-nowrap">{s.id}</td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <img
                              className="w-7 h-7 rounded-full border border-outline-variant object-cover"
                              src={s.avatar}
                              alt={s.name}
                            />
                            <span className="text-on-surface font-medium">{s.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-on-surface-variant whitespace-nowrap">{s.role}</td>
                        <td className="py-3 px-4 text-secondary whitespace-nowrap">{s.email}</td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] uppercase tracking-wide font-bold ${staffStatus(
                              s.status
                            )}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${s.status === 'active' ? 'bg-success' : 'bg-outline'}`}
                            ></span>
                            {s.status === 'active' ? 'Đang làm' : 'Nghỉ'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-3 border-t border-outline-variant bg-surface-container-lowest text-xs text-secondary text-right">
                Tổng cộng {(dept.staff && dept.staff.length ? dept.staff : DEPT_STAFF[dept.id] || []).length} nhân sự được hiển thị
              </div>
            </section>
          )}


        </div>
      </div>
    </div>
  );
}
