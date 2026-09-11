import { useMemo, useState } from 'react';
import EmployeeModal from '../components/EmployeeModal';
import EmployeeDetailModal from '../components/EmployeeDetailModal';
import useDocumentTitle from '../../../hooks/useDocumentTitle';
import {
  EMPLOYEES,
  DEPARTMENTS,
  SYSTEM_ROLES,
  ROLE_STYLES,
  STATUS_STYLES,
  EMPTY_EMPLOYEE,
} from '../data/mockData';

const selectCls =
  'bg-surface border border-outline-variant rounded-md px-3 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer';

function Badge({ cls, children }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap ${cls}`}>
      {children}
    </span>
  );
}

export default function HumanResources() {
  useDocumentTitle('Quản lý Nhân sự');

  const [employees, setEmployees] = useState(EMPLOYEES);
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('Tất cả');
  const [role, setRole] = useState('Tất cả');
  const [status, setStatus] = useState('Tất cả');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [popoverId, setPopoverId] = useState(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees.filter((e) => {
      const matchQ =
        !q ||
        e.name.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.phone.includes(q);
      const matchDept = dept === 'Tất cả' || e.department === dept;
      const matchRole = role === 'Tất cả' || e.role === role;
      const matchStatus = status === 'Tất cả' || e.status === status;
      return matchQ && matchDept && matchRole && matchStatus;
    });
  }, [employees, search, dept, role, status]);

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
    setViewing(emp);
    setPopoverId(null);
  };
  const handleSave = (form) => {
    if (editing) {
      setEmployees((list) => list.map((e) => (e.id === form.id ? { ...e, ...form } : e)));
    } else {
      setEmployees((list) => [{ ...EMPTY_EMPLOYEE, ...form, avatar: form.avatar || EMPLOYEES[0].avatar }, ...list]);
    }
    setModalOpen(false);
  };
  const toggleLock = (emp, e) => {
    if (e) e.stopPropagation();
    setEmployees((list) =>
      list.map((el) => (el.id === emp.id ? { ...el, status: el.status === 'active' ? 'inactive' : 'active' } : el))
    );
  };

  return (
    <section className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* Header & Action Bar */}
      <div className="bg-surface border-b border-outline-variant p-6 flex-shrink-0 z-10 shadow-sm">
        <div className="w-full flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-display-lg text-on-surface tracking-tight">Quản lý Nhân sự</h1>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button className="bg-surface text-on-surface border border-outline-variant hover:bg-surface-container transition-colors font-label-md px-4 py-2 rounded-md flex items-center gap-2 cursor-pointer">
              <span className="material-symbols-outlined text-[18px]">download</span>
              Xuất Báo Cáo
            </button>
            <button
              onClick={openAdd}
              className="bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-colors font-label-md px-4 py-2 rounded-md flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              Thêm nhân sự
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-surface border-b border-outline-variant p-4 flex-shrink-0 z-10">
        <div className="w-full flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1 lg:max-w-sm">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[18px]">search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-md focus:ring-1 focus:ring-primary focus:border-primary text-sm text-on-surface outline-none placeholder:text-secondary"
              placeholder="Tìm theo mã NV, họ tên, email, sđt..."
              type="text"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <select className={selectCls} value={dept} onChange={(e) => setDept(e.target.value)}>
              <option>Tất cả</option>
              {DEPARTMENTS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
            <select className={selectCls} value={role} onChange={(e) => setRole(e.target.value)}>
              <option>Tất cả</option>
              {SYSTEM_ROLES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
            <select className={selectCls} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option>Tất cả</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Ngừng hoạt động</option>
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
                    <th className="font-label-md text-on-surface-variant font-semibold uppercase tracking-wide px-4 py-3">Mã &amp; Họ tên</th>
                    <th className="font-label-md text-on-surface-variant font-semibold uppercase tracking-wide px-4 py-3">Liên hệ</th>
                    <th className="font-label-md text-on-surface-variant font-semibold uppercase tracking-wide px-4 py-3">Phòng ban &amp; Chức vụ</th>
                    <th className="font-label-md text-on-surface-variant font-semibold uppercase tracking-wide px-4 py-3">Kiêm nhiệm</th>
                    <th className="font-label-md text-on-surface-variant font-semibold uppercase tracking-wide px-4 py-3">Vai trò hệ thống</th>
                    <th className="font-label-md text-on-surface-variant font-semibold uppercase tracking-wide px-4 py-3">Trạng thái</th>
                    <th className="font-label-md text-on-surface-variant font-semibold uppercase tracking-wide px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e) => {
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
                              <div className="text-xs text-secondary">{e.id}</div>
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
                          <div className="text-on-surface">{e.department}</div>
                          <div className="text-xs text-secondary">{e.position}</div>
                        </td>
                        {/* Kiêm nhiệm */}
                        <td className="px-4 py-3">
                          <div className="relative">
                            {e.secondary.length === 0 ? (
                              <span className="text-xs text-on-surface-variant italic">Không</span>
                            ) : (
                              <button
                                onClick={(ev) => { ev.stopPropagation(); setPopoverId(popoverId === e.id ? null : e.id); }}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary-container/40 text-primary text-xs font-medium hover:bg-primary-container/70 transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[14px]">workspaces</span>
                                +{e.secondary.length} vị trí
                              </button>
                            )}
                            {popoverId === e.id && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={(ev) => { ev.stopPropagation(); setPopoverId(null); }} />
                                <div onClick={(ev) => ev.stopPropagation()} className="absolute z-50 left-0 top-full mt-1 w-72 bg-surface border border-outline-variant rounded-lg shadow-lg p-3">
                                  <div className="font-label-md text-on-surface-variant uppercase text-xs font-semibold mb-2">
                                    Vị trí kiêm nhiệm
                                  </div>
                                  <div className="flex flex-col gap-2">
                                    {e.secondary.map((s, i) => (
                                      <div key={i} className="flex items-start gap-2">
                                        <span className="material-symbols-outlined text-[16px] text-primary mt-0.5">badge</span>
                                        <div className="text-sm">
                                          <div className="text-on-surface font-medium">{s.department}</div>
                                          <div className="text-xs text-secondary">{s.position}</div>
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
                            {e.role}
                          </Badge>
                        </td>
                        {/* Trạng thái */}
                        <td className="px-4 py-3">
                          <Badge cls={st.cls}>
                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                            {st.label}
                          </Badge>
                        </td>
                        {/* Thao tác */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={(ev) => openEdit(e, ev)}
                              className="text-secondary hover:text-primary hover:bg-primary-container/30 p-1.5 rounded-md transition-colors cursor-pointer"
                              title="Chỉnh sửa"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button
                              onClick={(ev) => ev.stopPropagation()}
                              className="text-secondary hover:text-warning hover:bg-warning-container/40 p-1.5 rounded-md transition-colors cursor-pointer"
                              title="Reset mật khẩu"
                            >
                              <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                            </button>
                            <button
                              onClick={(ev) => toggleLock(e, ev)}
                              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                                e.status === 'active'
                                  ? 'text-secondary hover:text-error hover:bg-error-container/40'
                                  : 'text-secondary hover:text-success hover:bg-success-container/40'
                              }`}
                              title={e.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                {e.status === 'active' ? 'lock_open' : 'lock'}
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-secondary">
                        <span className="material-symbols-outlined text-[32px] block mb-2 text-outline">search_off</span>
                        Không tìm thấy nhân sự phù hợp bộ lọc.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Table footer */}
            <div className="flex items-center justify-between px-4 py-3 bg-surface-container-lowest border-t border-outline-variant">
              <span className="text-xs text-secondary">
                Hiển thị <b className="text-on-surface">{filtered.length}</b> / {employees.length} nhân sự
              </span>
              <div className="flex items-center gap-1">
                <button className="p-1.5 rounded-md text-secondary hover:bg-surface-container hover:text-on-surface cursor-pointer" disabled>
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <span className="px-3 py-1 rounded-md bg-primary text-on-primary text-xs font-medium cursor-pointer">1</span>
                <button className="p-1.5 rounded-md text-secondary hover:bg-surface-container hover:text-on-surface cursor-pointer">
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {modalOpen && <EmployeeModal employee={editing} onClose={() => setModalOpen(false)} onSave={handleSave} />}
      {viewing && <EmployeeDetailModal employee={viewing} onClose={() => setViewing(null)} />}
    </section>
  );
}
