import { useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApproval } from '../context/useApproval';

/* ─── Sub-panel: chỉ 2 link điều hướng ──────────────────────── */

function RequestsSubPanel({ pendingCount }) {
  const location = useLocation();

  const links = [
    {
      to: '/my-requests',
      icon: 'folder_shared',
      label: 'Đơn từ cá nhân',
    },
    {
      to: '/my-requests/approvals',
      icon: 'pending_actions',
      label: 'Đơn chờ tôi duyệt',
      badge: pendingCount,
    },
  ];

  return (
    <div className="flex flex-col h-full bg-[#162032] border-l border-white/10 w-[200px] flex-shrink-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10">
        <span className="text-slate-400 text-[11px] uppercase tracking-widest font-semibold">
          Đơn từ
        </span>
      </div>

      {/* 2 nav links */}
      <ul className="flex flex-col py-2 px-2">
        {links.map((item) => {
          const active = location.pathname === item.to;
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors border-l-2 ${
                  active
                    ? 'border-primary bg-primary/10 text-white'
                    : 'border-transparent text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <span className="material-symbols-outlined text-[18px] flex-shrink-0">
                    {item.icon}
                  </span>
                  <span className="text-sm font-medium truncate">{item.label}</span>
                </span>
                {item.badge > 0 && (
                  <span className="bg-error text-on-error text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none flex-shrink-0 ml-2">
                    {item.badge}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ─── Sub-panel: Cấu hình ────────────────────────────────────── */

function SettingsSubPanel() {
  const location = useLocation();

  const links = [
    {
      to: '/settings/forms',
      icon: 'description',
      label: 'Mẫu đơn & Form',
    },
    {
      to: '/settings/workflow',
      icon: 'account_tree',
      label: 'Luồng duyệt',
    },
    {
      to: '/settings/general',
      icon: 'settings',
      label: 'Chung & Zalo',
    },
  ];

  return (
    <div className="flex flex-col h-full bg-[#162032] border-l border-white/10 w-[200px] flex-shrink-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10">
        <span className="text-slate-400 text-[11px] uppercase tracking-widest font-semibold">
          Cấu hình
        </span>
      </div>

      {/* nav links */}
      <ul className="flex flex-col py-2 px-2">
        {links.map((item) => {
          const active = location.pathname === item.to;
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors border-l-2 ${
                  active
                    ? 'border-primary bg-primary/10 text-white'
                    : 'border-transparent text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <span className="material-symbols-outlined text-[18px] flex-shrink-0">
                    {item.icon}
                  </span>
                  <span className="text-sm font-medium truncate">{item.label}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ─── Main sidebar rail ──────────────────────────────────────── */

/**
 * navItems driving the rail.
 * Items with `subPanel: 'requests'` trigger the flyout instead of navigating.
 */
const NAV_ITEMS = [
  { name: 'Phòng ban & Nhóm', icon: 'account_tree', path: '/' },
  { name: 'Nhân sự',           icon: 'group',        path: '/personnel' },
  {
    name: 'Đơn từ',
    icon: 'description',
    subPanel: 'requests',
    /* paths that should highlight this rail item */
    matchPaths: ['/my-requests', '/my-requests/approvals'],
    badge: null, /* optionally set dynamically */
  },
  {
    name: 'Cấu hình',
    icon: 'settings',
    subPanel: 'settings',
    matchPaths: ['/settings'],
  },
];

export default function UnifiedSidebar({
  isOpen,
  onClose,
  /** Current user object: { name, role, subtitle, avatar } */
  currentUser,
}) {
  const location = useLocation();
  const [openSubPanel, setOpenSubPanel] = useState(null); // 'requests' | null

  // Tính số đơn chờ tôi duyệt trực tiếp từ context — luôn đồng bộ với trang
  const { requests, currentUserId } = useApproval();
  const pendingCount = useMemo(
    () =>
      requests.filter(
        (r) =>
          r.status === 'pending' &&
          r.steps[r.currentStep]?.approverId === currentUserId
      ).length,
    [requests, currentUserId]
  );

  const toggleSubPanel = (key) => {
    setOpenSubPanel((prev) => (prev === key ? null : key));
  };

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 md:hidden ${isOpen ? 'block' : 'hidden'}`}
        onClick={onClose}
      />

      {/* Sidebar shell: rail + optional flyout side-by-side */}
      <div
        className={`fixed md:static z-50 h-full flex flex-row transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 transition-transform duration-300`}
      >
        {/* ── Rail (240 px) ── */}
        <nav
          className="bg-[#0F172A] w-[240px] h-full flex-shrink-0 flex flex-col justify-between shadow-sm"
          id="sidebar"
        >
          <div>
            {/* User profile */}
            <Link
              to="/profile"
              className="block px-4 py-3 border-b border-white/10 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <img
                    alt="User avatar"
                    className="w-9 h-9 rounded-full object-cover"
                    src={
                      currentUser?.avatar ||
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuCJ6rf1wZ7pfErOiSFy34dN8pdPp_NfG1jg3EERXkZuWBj9jrdw_3FRbyyJ73mEm4Nvyazc3xQc3JDAt41BL-9Mus5LHkhAdeO_OtLnfV1OQC9FFOwjfI0BI7i18QHdLZSYCSlyGBA4TA0lk-HyBc2PEoLNPzXBW1qeDj7-R3zUvYsiwOSpU5-ccS53k4vPH9cS35WjkK1XgRDJ6dXYwmT-B92NiH5k4lr9iGXjmWIb9kiB9ejOdGB4DQ'
                    }
                  />
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#0F172A]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-white text-sm font-semibold truncate leading-tight">
                    {currentUser?.name || 'Nguyễn Văn A'}
                  </h2>
                  <div className="flex flex-col gap-1 mt-1">
                    <span className="text-xs text-slate-400 font-medium tracking-wide">Quản trị viên</span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                      <span className="text-[11px] text-slate-500 font-medium">Trực tuyến</span>
                    </div>
                  </div>
                </div>
                <div className="relative cursor-pointer group shrink-0" onClick={(e) => e.preventDefault()}>
                  <span className="material-symbols-outlined text-[20px] text-slate-400 group-hover:text-white transition-colors">
                    notifications
                  </span>
                  <div className="absolute top-0 right-0 w-2 h-2 bg-error rounded-full border border-[#0F172A]" />
                </div>
              </div>
            </Link>

            {/* Nav items */}
            <ul className="flex flex-col py-2">
              {NAV_ITEMS.map((item) => {
                /* Determine active state */
                const isActive = item.subPanel
                  ? item.matchPaths?.some((p) => location.pathname.startsWith(p))
                  : location.pathname === item.path;

                const isSubPanelOpen = openSubPanel === item.subPanel;

                const badge =
                  item.subPanel === 'requests' ? pendingCount : item.badge;

                if (item.subPanel) {
                  /* Sub-panel trigger button */
                  return (
                    <li key={item.name}>
                      <button
                        onClick={() => toggleSubPanel(item.subPanel)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 cursor-pointer active:opacity-80 transition-colors border-l-4 ${
                          isActive || isSubPanelOpen
                            ? 'border-primary bg-primary-container/10 text-white font-semibold'
                            : 'border-l-transparent text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                          <span className="text-sm truncate">{item.name}</span>
                        </div>
                        {badge > 0 && (
                          <span className="bg-error text-on-error text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none mr-1">
                            {badge}
                          </span>
                        )}
                        <span
                          className={`material-symbols-outlined text-[16px] flex-shrink-0 transition-transform duration-200 ${
                            isSubPanelOpen ? 'rotate-180' : ''
                          }`}
                        >
                          chevron_right
                        </span>
                      </button>
                    </li>
                  );
                }

                return (
                  <li key={item.name}>
                    <Link
                      to={item.path}
                      className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer active:opacity-80 transition-colors border-l-4 ${
                        isActive
                          ? 'border-primary bg-primary-container/10 text-white font-semibold'
                          : 'border-l-transparent text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                        <span className="text-sm truncate">{item.name}</span>
                      </div>
                      {badge > 0 && (
                        <span className="bg-error text-on-error text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                          {badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-white/10">
            <button className="w-full text-slate-400 hover:text-white flex items-center justify-center gap-2 px-4 py-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-[20px]">logout</span>
              <span className="text-sm font-medium">Đăng xuất</span>
            </button>
          </div>
        </nav>

        <div
          className={`h-full overflow-hidden transition-all duration-300 ease-in-out flex flex-shrink-0 ${
            openSubPanel ? 'w-[200px] opacity-100' : 'w-0 opacity-0'
          }`}
        >
          {openSubPanel === 'requests' && <RequestsSubPanel pendingCount={pendingCount} />}
          {openSubPanel === 'settings' && <SettingsSubPanel />}
        </div>
      </div>
    </>
  );
}