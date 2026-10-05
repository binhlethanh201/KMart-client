import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EmployeeModal from '../components/EmployeeModal';
import { useHr } from '../context/HrProvider';
import { useApproval } from '../../../context/useApproval';
import useDocumentTitle from '../../../hooks/useDocumentTitle';
import { ROLE_STYLES, STATUS_STYLES } from '../data/constants';
import { roleStyle } from '../../../utils/roleLabels';
import { formatDateOfBirth } from '../../../utils/dateFormat';
import { PERMISSIONS } from '../../../constants/permissions';
import { useI18n } from '../../../i18n/I18nProvider';
import PageHeader from '../../../components/PageHeader';
import { FILTER_SELECT_CLS, FILTER_SEARCH_CLS, FILTER_SEARCH_ICON_CLS } from '../../../styles/filterControls';

// BE-77/79: dùng đúng style ô lọc của trang Báo cáo để các trang nhìn đồng bộ.
const selectCls = FILTER_SELECT_CLS;

function Badge({ cls, children }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-medium whitespace-nowrap ${cls}`}>
      {children}
    </span>
  );
}

export default function HumanResources() {
  const { t } = useI18n();
  useDocumentTitle(t('Quản lý Nhân sự'));
  const navigate = useNavigate();
  const { employees, departments, positions, roles, loading, error, saveEmployee } = useHr();
  const { currentUser, hasPermission } = useApproval();

  const isStaff = currentUser?.role === 'STAFF';

  useEffect(() => {
    if (isStaff) {
      navigate('/', { replace: true });
    }
  }, [isStaff, navigate]);

  // BE dùng mã USER_* cho nghiệp vụ nhân sự -> dùng hằng số có alias (không hardcode
  // 'PERSONNEL_*' vì các mã đó không tồn tại ở backend nên nút luôn bị ẩn).
  // BE-96: danh sách chỉ còn "Xem chi tiết" + "Chỉnh sửa" nên chỉ cần 2 quyền này.
  const canAddEmployee = hasPermission ? hasPermission(PERMISSIONS.PERSONNEL_CREATE) : (currentUser?.role === 'ADMIN' || currentUser?.role === 'HR');
  const canEditEmployee = hasPermission ? hasPermission(PERMISSIONS.PERSONNEL_UPDATE) : (currentUser?.role === 'ADMIN' || currentUser?.role === 'HR');

  const canEdit = canEditEmployee || canAddEmployee;

  const [search, setSearch] = useState('');
  // Gia tri loc dung hang so trung tinh 'all' (KHONG dung chuoi da dich) de doi ngon ngu khong lam sai bo loc.
  const [dept, setDept] = useState('all');
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [popoverId, setPopoverId] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees.filter((e) => {
      // 0. Role-based visibility
      if (currentUser?.role !== 'ADMIN' && currentUser?.role !== 'HR') {
        const userDeptIds = currentUser?.allPositions?.map(p => p.departmentId).filter(Boolean) || [];
        const userDeptNames = currentUser?.allPositions?.map(p => p.departmentName).filter(Boolean) || [];
        // BE-141: khớp theo ID phòng ban TRƯỚC (ổn định, không phụ thuộc tên), tên chỉ là
        // phương án dự phòng cho hồ sơ cũ chưa có departmentId — đúng như chú thích ở đây.
        const empDeptIds = [e.departmentId, ...(e.secondary?.map(s => s.departmentId) || [])].filter(Boolean);
        const byId = empDeptIds.some(id => userDeptIds.includes(id));
        const empDeptNames = [e.department, ...(e.secondary?.map(s => s.department) || [])].filter(Boolean);
        const byName = empDeptNames.some(name => userDeptNames.includes(name));
        if (!byId && !byName) return false;
      }

      const matchQ =
        !q ||
        e.name.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.phone.includes(q) ||
        // BE-74: tìm được theo ngày sinh (gõ "1990" hoặc "1990-05-20").
        (e.dateOfBirth || '').includes(q);
      const matchDept = dept === 'all' || e.department === dept || (e.secondary && e.secondary.some(s => s.department === dept));
      const matchRole = role === 'all' || e.role === role;
      const matchStatus = status === 'all' || e.status === status;
      return matchQ && matchDept && matchRole && matchStatus;
    });
  }, [employees, search, dept, role, status]);

  // Reset to first page whenever any filter changes.
  useEffect(() => { setPage(1); }, [search, dept, role, status, employees]);

  // rules-of-hooks: MỌI hook phải được gọi trước early-return này.
  // Trước đây `if (isStaff) return null;` nằm phía trên 12 hook (10 useState + useMemo + useEffect)
  // nên số lượng/thứ tự hook thay đổi theo quyền của user -> React có thể loạn state hoặc crash.
  if (isStaff) return null;

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (emp, e) => {
    if (e) e.stopPropagation();
    setEditing(emp);
    setModalOpen(true);
    setPopoverId(null);
  };
  const openView = (emp) => {
    navigate(`/personnel/${emp.id}`);
    setPopoverId(null);
  };
  const handleSave = async (form) => {
    const result = await saveEmployee(form);
    // BE-68: saveEmployee trả { ok, message } để form hiển thị lỗi dịch được theo ngôn ngữ.
    if (result?.ok) {
      setModalOpen(false);
      return { ok: true };
    }
    return { ok: false, message: result?.message };
  };

  return (
    <section className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* Header & Action Bar — BE-97: dùng khung tiêu đề chung (nền ấm, chữ đồng nhất) */}
      <PageHeader
        icon="group"
        title="Quản lý Nhân sự"
        actions={canAddEmployee && (
          <button
            onClick={openAdd}
            className="w-full justify-center bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-colors font-label-md px-4 py-2 rounded-md flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            {t('Tạo tài khoản nhân viên')}
          </button>
        )}
      />

      {/* Filter Bar */}
      <div className="bg-[#f6f6f4] border-b border-outline-variant p-4 flex-shrink-0 z-10">
        <div className="w-full flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1 lg:max-w-sm">
            <span className={FILTER_SEARCH_ICON_CLS}>search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={FILTER_SEARCH_CLS}
              placeholder={t('Tìm theo mã NV, họ tên, email, sđt...')}
              type="text"
            />
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            <select className={`${selectCls} w-full sm:w-auto`} value={dept} onChange={(e) => setDept(e.target.value)}>
              <option value="all">{t('Tất cả phòng ban')}</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name}>{t(d.name)}</option>
              ))}
            </select>
            <select className={`${selectCls} w-full sm:w-auto`} value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="all">{t('Tất cả vai trò')}</option>
              {roles.map((r) => (
                <option key={r.id} value={r.roleName}>{roleStyle(r.roleName).label}</option>
              ))}
            </select>
            <select className={`${selectCls} w-full sm:w-auto`} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">{t('Tất cả trạng thái')}</option>
              <option value="active">{t('Đang hoạt động')}</option>
              <option value="inactive">{t('Ngừng hoạt động')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="flex-1 overflow-auto min-h-0">
        <div className="w-full p-4 md:p-6">
          <div className="bg-surface rounded-lg border border-outline-variant shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-sm">
                <thead>
                  <tr className="bg-surface-container-low text-left border-b border-outline-variant">
                    <th className="font-label-md text-on-surface-variant font-semibold uppercase tracking-wide px-4 py-3">{t('Mã & Họ tên')}</th>
                    <th className="font-label-md text-on-surface-variant font-semibold uppercase tracking-wide px-4 py-3">{t('Liên hệ')}</th>
                    <th className="font-label-md text-on-surface-variant font-semibold uppercase tracking-wide px-4 py-3">{t('Phòng ban & Chức vụ')}</th>
                    <th className="font-label-md text-on-surface-variant font-semibold uppercase tracking-wide px-4 py-3">{t('Kiêm nhiệm')}</th>
                    <th className="font-label-md text-on-surface-variant font-semibold uppercase tracking-wide px-4 py-3">{t('Vai trò hệ thống')}</th>
                    <th className="font-label-md text-on-surface-variant font-semibold uppercase tracking-wide px-4 py-3">{t('Trạng thái')}</th>
                    <th className="font-label-md text-on-surface-variant font-semibold uppercase tracking-wide px-4 py-3 text-right">{t('Thao tác')}</th>
                  </tr>
                </thead>
                <tbody>
                  {/* BE-60: đang nạp lại thì GIỮ danh sách cũ và làm mờ, không thay bằng 1 dòng
                      "Đang tải" để chiều cao trang không tụt (tránh bị nhảy lên đầu bảng). */}
                  {loading && employees.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-secondary">
                        <span className="material-symbols-outlined text-[32px] block mb-2 animate-spin">progress_activity</span>
                        {t('Đang tải danh sách nhân sự...')}
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-error">
                        <span className="material-symbols-outlined text-[32px] block mb-2">error</span>
                        {t(error)}
                      </td>
                    </tr>
                  ) : paged.map((e) => {
                    const st = STATUS_STYLES[e.status];
                    return (
                      <tr
                        key={e.id}
                        className="border-b border-outline-variant/50 last:border-0 hover:bg-surface-container-low/60 transition-colors cursor-pointer"
                        onClick={() => openView(e)}
                      >
                        {/* Mã & Họ tên */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img className="w-9 h-9 rounded-full object-cover flex-shrink-0" src={e.avatar} alt={e.name} />
                            <div className="min-w-0">
                              <div className="font-semibold text-on-surface truncate">{e.name}</div>
                              <div className="text-xs text-secondary" title={e.id}>
                                {e.id.substring(0, 8).toUpperCase()}
                                {/* BE-74: hiện ngày sinh để phân biệt hai nhân sự trùng họ tên. */}
                                {e.dateOfBirth && ` · ${t('Sinh')} ${formatDateOfBirth(e.dateOfBirth)}`}
                              </div>
                            </div>
                          </div>
                        </td>
                        {/* Liên hệ */}
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-on-surface flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[14px] text-secondary">mail</span>
                              {e.email}
                            </span>
                            <span className="text-secondary flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[14px] text-secondary">call</span>
                              {e.phone}
                            </span>
                          </div>
                        </td>
                        {/* Phòng ban & Chức vụ */}
                        <td className="px-4 py-3">
                          <div className="text-on-surface">{t(e.department)}</div>
                          <div className="text-xs text-secondary">{t(e.position)}</div>
                        </td>
                        {/* Kiêm nhiệm */}
                        <td className="px-4 py-3">
                          <div className="relative">
                            {e.secondary.length === 0 ? (
                              <span className="text-xs text-on-surface-variant italic">{t('Không')}</span>
                            ) : (
                              <button
                                onClick={(ev) => { ev.stopPropagation(); setPopoverId(popoverId === e.id ? null : e.id); }}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary-container/40 text-primary text-xs font-medium hover:bg-primary-container/70 transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[14px]">workspaces</span>
                                +{e.secondary.length} {t('vị trí')}
                              </button>
                            )}
                            {popoverId === e.id && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={(ev) => { ev.stopPropagation(); setPopoverId(null); }} />
                                <div onClick={(ev) => ev.stopPropagation()} className="absolute z-50 left-0 top-full mt-1 w-72 bg-surface border border-outline-variant rounded-lg shadow-lg p-3">
                                  <div className="font-label-md text-on-surface-variant uppercase text-xs font-semibold mb-2">
                                    {t('Vị trí kiêm nhiệm')}
                                  </div>
                                  <div className="flex flex-col gap-2">
                                    {e.secondary.map((s, i) => (
                                      <div key={i} className="flex items-start gap-2">
                                        <span className="material-symbols-outlined text-[16px] text-primary mt-0.5">badge</span>
                                        <div className="text-sm">
                                          <div className="text-on-surface font-medium">{t(s.department)}</div>
                                          <div className="text-xs text-secondary">{t(s.position)}</div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                        {/* Vai trò hệ thống */}
                        <td className="px-4 py-3">
                          <Badge cls={ROLE_STYLES[e.role]?.cls || 'text-secondary'}>
                            <span className={`w-1.5 h-1.5 rounded-full ${ROLE_STYLES[e.role]?.dot || 'bg-outline'}`} />
                            {roleStyle(e.role).label}
                          </Badge>
                        </td>
                        {/* Trạng thái */}
                        <td className="px-4 py-3">
                          {/* BE-119: tài khoản thiếu phòng ban công tác chính hiển thị là "Ngừng hoạt động"
                              (không đăng nhập được) — kèm chú thích để người quản lý biết lý do thật. */}
                          <span title={e.blockedByNoPrimary ? t('Chưa có phòng ban công tác chính') : undefined}>
                            <Badge cls={st.cls}>
                              <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                              {t(st.label)}
                            </Badge>
                          </span>
                          {e.blockedByNoPrimary && (
                            <div className="text-[11px] text-warning mt-1 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]">warning</span>
                              {t('Chưa có phòng ban công tác chính')}
                            </div>
                          )}
                        </td>
                        {/* Thao tác */}
                        <td className="px-4 py-3">
                          {/* BE-96: danh sách chỉ giữ "Xem chi tiết" và "Chỉnh sửa" cho gọn.
                              Các thao tác còn lại (đặt lại mật khẩu / khoá tài khoản / xoá nhân sự)
                              nằm trong menu "Thao tác" ở trang chi tiết nhân sự. */}
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={(ev) => { ev.stopPropagation(); openView(e); }}
                              className="text-secondary hover:text-primary hover:bg-primary-container/30 p-1.5 rounded-md transition-colors cursor-pointer"
                              title={t('Xem chi tiết')}
                            >
                              <span className="material-symbols-outlined text-[18px]">visibility</span>
                            </button>
                            {canEdit && (
                              <button
                                onClick={(ev) => openEdit(e, ev)}
                                className="text-secondary hover:text-primary hover:bg-primary-container/30 p-1.5 rounded-md transition-colors cursor-pointer"
                                title={t('Chỉnh sửa')}
                              >
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && !loading && !error && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-secondary">
                        <span className="material-symbols-outlined text-[32px] block mb-2 text-outline">search_off</span>
                        {t('Không tìm thấy nhân sự phù hợp bộ lọc.')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Table footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-surface-container-lowest border-t border-outline-variant gap-4">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 w-full sm:w-auto">
                <span className="text-xs text-secondary flex items-center gap-2">
                  {t('Hiển thị')}
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1); // Reset page on page size change
                    }}
                    className="filter-control filter-select h-[34px] py-0 pl-2.5 pr-8 text-xs"
                  >
                    <option value={5}>{t('5 dòng')}</option>
                    <option value={10}>{t('10 dòng')}</option>
                    <option value={20}>{t('20 dòng')}</option>
                    <option value={50}>{t('50 dòng')}</option>
                  </select>
                  <span>
                    {filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1} - {Math.min(safePage * pageSize, filtered.length)} {t('trong tổng số')} {filtered.length} {t('nhân sự')}
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
        </div>
      </div>

      {modalOpen && <EmployeeModal 
        employee={editing} 
        departments={departments}
        positions={positions}
        roles={roles}
        currentUser={currentUser}
        onClose={() => setModalOpen(false)} 
        onSave={handleSave} 
      />}
    </section>
  );
}
