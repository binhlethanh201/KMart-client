import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApproval } from '../context/useApproval';
import { useI18n } from '../i18n/I18nProvider';
import { clearSessionStorage } from '../utils/session';
import NotificationBell from '../components/NotificationBell';
import LanguageSwitcher from '../components/LanguageSwitcher';

/* ─── Sub-panel: chỉ 2 link điều hướng ──────────────────────── */

function RequestsSubPanel({ pendingCount, supplementCount }) {
  const location = useLocation();
  const { t } = useI18n();

  // "Đơn cần bổ sung" không còn là mục riêng (bị trùng với Đơn từ cá nhân);
  // các đơn này hiển thị ngay trong Đơn từ cá nhân kèm badge nhắc bổ sung.
  // "Đơn chờ tôi duyệt" LUÔN hiển thị để người dùng thấy được mục này; nếu chưa có
  // quyền duyệt thì chỉ hiện danh sách trống thay vì ẩn cả menu.
  const links = [
    {
      to: '/my-requests',
      icon: 'folder_shared',
      label: t('Đơn từ cá nhân'),
      badge: supplementCount,
    },
    {
      to: '/my-requests/approvals',
      icon: 'pending_actions',
      label: t('Đơn chờ tôi duyệt'),
      badge: pendingCount,
    },
  ];

  return (
    <div className="flex flex-col h-full bg-[#162032] border-l border-white/10 w-[200px] flex-shrink-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10">
        <span className="text-slate-400 text-[11px] uppercase tracking-widest font-semibold">
          {t('Đơn từ')}
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
                  <span className="text-sm font-medium truncate">{t(item.label)}</span>
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
  const { t } = useI18n();

  const links = [
    {
      to: '/settings/forms',
      icon: 'description',
      label: t('Mẫu đơn & Form'),
    },
    {
      to: '/settings/workflow',
      icon: 'account_tree',
      label: t('Luồng duyệt'),
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
          {t('Cấu hình')}
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
                  <span className="text-sm font-medium truncate">{t(item.label)}</span>
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
  { name: 'Nhân sự',           icon: 'group',        path: '/personnel', permission: 'USER_VIEW' },
  {
    name: 'Đơn từ',
    icon: 'description',
    subPanel: 'requests',
    /* paths that should highlight this rail item */
    matchPaths: ['/my-requests', '/my-requests/approvals', '/my-requests/supplements'],
    badge: null, /* optionally set dynamically */
  },
  {
    name: 'Báo Cáo',
    icon: 'analytics',
    path: '/reports',
    permission: 'APPLICATION_VIEW',
  },
  {
    name: 'Cấu hình',
    icon: 'settings',
    subPanel: 'settings',
    matchPaths: ['/settings'],
    permission: 'ROLE_VIEW',
  },
];

/** BE-82: thời gian trễ trước khi bảng con bắt đầu thu, và thời gian chạy hiệu ứng thu. */
const SIDEBAR_PANEL_CLOSE_DELAY_MS = 420; // trước đây 180ms -> cảm giác bị đẩy về ngay
const SIDEBAR_PANEL_COLLAPSE_MS = 380; // phải khớp `duration-[380ms]` của khung bảng con

export default function UnifiedSidebar({
  isOpen,
  onClose,
  /** Current user object: { name, role, subtitle, avatar } */
  currentUser,
}) {
  const location = useLocation();
  const { t } = useI18n();
  const [openSubPanel, setOpenSubPanel] = useState(null); // 'requests' | 'settings' | null
  /** BE-82: bảng con vẫn được giữ trong DOM trong lúc thu để chạy hết hiệu ứng trượt ra. */
  const [renderedSubPanel, setRenderedSubPanel] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  /**
   * BE-61: bảng con (Đơn từ / Cấu hình) THÒI RA khi rê chuột vào, không cần bấm.
   * - Rê vào mục có bảng con -> mở ngay.
   * - Rê ra khỏi cả thanh điều hướng + bảng con -> đóng, nhưng trễ để không bị đóng oan khi chuột
   *   đang đi từ mục cha sang bảng con.
   * - Bấm vẫn mở/đóng được như trước (cần cho màn hình cảm ứng).
   *
   * BE-82: trước đây hễ hết thời gian trễ là `openSubPanel = null` làm nội dung bị gỡ khỏi DOM ngay,
   * nên bảng con biến mất tức thì dù khung còn đang thu bề rộng — cảm giác "vừa bỏ tay ra là bị đẩy
   * về". Nay tách làm hai bước: khung bắt đầu thu (chạy transition), nội dung vẫn nằm trong DOM cho
   * tới khi thu xong mới gỡ. Đồng thời nới thời gian trễ và giảm tốc độ thu cho có cảm giác trượt.
   */
  const closeTimer = useRef(null);
  const unmountTimer = useRef(null);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    if (unmountTimer.current) {
      clearTimeout(unmountTimer.current);
      unmountTimer.current = null;
    }
  }, []);

  const openPanel = useCallback((key) => {
    cancelClose();
    // Giữ nội dung trong DOM ngay khi mở, tránh 1 nhịp khung rỗng rồi mới có chữ.
    setRenderedSubPanel((prev) => (prev === key ? prev : key));
    setOpenSubPanel((prev) => (prev === key ? prev : key));
  }, [cancelClose]);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(() => {
      setOpenSubPanel(null); // khung bắt đầu thu
      unmountTimer.current = setTimeout(() => setRenderedSubPanel(null), SIDEBAR_PANEL_COLLAPSE_MS);
    }, SIDEBAR_PANEL_CLOSE_DELAY_MS);
  }, [cancelClose]);

  useEffect(() => cancelClose, [cancelClose]);

  const handleLogout = () => {
    // BE-14: xoa toan bo trang thai phien (token + formFields + requests cache)
    clearSessionStorage();
    window.location.href = '/login';
  };

  // Tính số đơn chờ tôi duyệt trực tiếp từ context — luôn đồng bộ với trang
  const { requests, currentUserId, hasPermission } = useApproval();
  const pendingCount = useMemo(
    () =>
      requests.filter(
        (r) =>
          r.status === 'pending' &&
          r.steps[r.currentStep]?.approverId === currentUserId
      ).length,
    [requests, currentUserId]
  );

  // BE-05: so don cua toi dang bi yeu cau bo sung
  const supplementCount = useMemo(
    () =>
      requests.filter(
        (r) => r.status === 'needssupplement' && r.creatorId === currentUserId
      ).length,
    [requests, currentUserId]
  );

  // Filter nav items by permission
  const visibleNavs = NAV_ITEMS.filter(
    (item) => !item.permission || hasPermission(item.permission)
  );

  const toggleSubPanel = (key) => {
    if (openSubPanel === key) {
      // Đóng: giữ nội dung lại cho tới khi khung thu xong rồi mới gỡ (BE-82)
      setOpenSubPanel(null);
      clearTimeout(unmountTimer.current);
      unmountTimer.current = setTimeout(() => setRenderedSubPanel(null), SIDEBAR_PANEL_COLLAPSE_MS);
      return;
    }
    cancelClose();
    setRenderedSubPanel(key); // mở: dựng nội dung ngay
    setOpenSubPanel(key);
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
        onMouseEnter={cancelClose}
        onMouseLeave={scheduleClose}
        className={`fixed md:static z-50 h-full flex flex-row transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 transition-transform duration-300 relative`}
      >
        {/* ── Rail ── */}
        <nav
          className={`relative bg-[#0F172A] ${isCollapsed ? 'w-[72px]' : 'w-[240px]'} h-full flex-shrink-0 flex flex-col justify-between shadow-sm transition-all duration-300`}
          id="sidebar"
        >
          {/* BE-85: nút thu gọn / mở rộng nằm TRONG rail.
              Trước đây nó là con của khung bao (rail + bảng con) và neo vào mép phải của khung đó, nên
              vừa rê chuột vào "Đơn từ"/"Cấu hình" cho bảng con thòi ra là nút nhảy sang phải 200px —
              bấm đúng chỗ cũ thì trúng bảng con, phải dò lại vị trí mới. Neo vào rail thì nút đứng yên. */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex absolute top-1/2 -right-4 -translate-y-1/2 w-8 h-8 bg-white text-slate-600 border border-slate-200 rounded-full items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.15)] z-[60] cursor-pointer hover:text-primary hover:bg-slate-50 hover:border-primary/20 transition-colors group"
            title={isCollapsed ? t('Mở rộng') : t('Thu gọn')}
            aria-label={isCollapsed ? t('Mở rộng') : t('Thu gọn')}
          >
            <span className="material-symbols-outlined text-[18px] transition-transform duration-300 group-hover:scale-110">
              {isCollapsed ? 'chevron_right' : 'chevron_left'}
            </span>
          </button>

          <div>
            {/* User profile — BE-22: chuông tách RIÊNG khỏi Link để không bị điều hướng sang profile */}
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-1'} px-4 py-3 border-b border-white/10`}>
              <Link
                to="/profile"
                className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 flex-1 min-w-0'} hover:opacity-90 transition-opacity`}
                title={isCollapsed ? (currentUser?.name || t('Nguyễn Văn A')) : undefined}
              >
                <div className="relative shrink-0">
                  <img
                    alt="User avatar"
                    className="w-9 h-9 rounded-full object-cover"
                    src={
                      currentUser?.avatar ||
                      'https://ui-avatars.com/api/?name=User&background=random&color=fff&size=128'
                    }
                  />
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#0F172A]" />
                </div>
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <h2 className="text-white text-sm font-semibold truncate leading-tight">
                      {currentUser?.name || t('Nguyễn Văn A')}
                    </h2>
                    <div className="flex flex-col gap-1 mt-1">
                      <span className="text-xs text-slate-400 font-medium tracking-wide">
                        {t(currentUser?.role === 'ADMIN' ? 'Quản trị viên' :
                           currentUser?.role === 'HR' ? 'Nhân sự' :
                           currentUser?.role === 'MANAGER' ? 'Quản lý' :
                           currentUser?.role === 'TEAM_LEADER' ? 'Trưởng nhóm' : 'Nhân viên')}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                        <span className="text-[11px] text-slate-500 font-medium">{t('Trực tuyến')}</span>
                      </div>
                    </div>
                  </div>
                )}
              </Link>
              {!isCollapsed && (
                <div className="shrink-0">
                  {/* BE-22: chuông thông báo thật (đếm chưa đọc, xem danh sách) */}
                  <NotificationBell />
                </div>
              )}
            </div>

            {/* Nav items */}
            <ul className="flex flex-col py-2">
              {visibleNavs.filter(item => {
                // item.name là hằng cấp module (chưa dịch) nên so sánh bằng chuỗi gốc,
                // KHÔNG bọc t() ở đây vì t() sẽ đổi theo ngôn ngữ và làm sai điều kiện.
                if (item.name === 'Nhân sự' && currentUser?.role !== 'ADMIN' && currentUser?.role !== 'HR') return false;
                if (item.name === 'Cấu hình' && currentUser?.role !== 'ADMIN' && currentUser?.role !== 'HR') return false;
                if (item.name === 'Báo Cáo' && currentUser?.role !== 'ADMIN' && currentUser?.role !== 'HR') return false;
                
                return true;
              }).map((item) => {
                /* Determine active state */
                const isActive = item.subPanel
                  ? item.matchPaths?.some((p) => location.pathname.startsWith(p))
                  : location.pathname === item.path;

                const isSubPanelOpen = openSubPanel === item.subPanel;

                const badge =
                  item.subPanel === 'requests' ? pendingCount : item.badge;

                if (item.subPanel) {
                  /* Sub-panel trigger: rê chuột vào là thòi ra, bấm vẫn được (cảm ứng) */
                  return (
                    <li key={item.name} onMouseEnter={() => openPanel(item.subPanel)}>
                      <button
                        onClick={() => toggleSubPanel(item.subPanel)}
                        title={isCollapsed ? t(item.name) : undefined}
                        className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-2.5 cursor-pointer active:opacity-80 transition-colors border-l-4 ${
                          isActive || isSubPanelOpen
                            ? 'border-primary bg-primary-container/10 text-white font-semibold'
                            : 'border-l-transparent text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 flex-1 min-w-0'}`}>
                          <span className="material-symbols-outlined text-[20px] relative">
                            {item.icon}
                            {isCollapsed && badge > 0 && (
                              <span className="absolute -top-1.5 -right-2 w-2 h-2 bg-error rounded-full"></span>
                            )}
                          </span>
                          {!isCollapsed && <span className="text-sm truncate">{t(item.name)}</span>}
                        </div>
                        {!isCollapsed && badge > 0 && (
                          <span className="bg-error text-on-error text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none mr-1">
                            {badge}
                          </span>
                        )}
                        {!isCollapsed && (
                          <span
                            className={`material-symbols-outlined text-[16px] flex-shrink-0 transition-transform duration-200 ${
                              isSubPanelOpen ? 'rotate-180' : ''
                            }`}
                          >
                            chevron_right
                          </span>
                        )}
                      </button>
                    </li>
                  );
                }

                return (
                  <li key={item.name} onMouseEnter={() => openPanel(null)}>
                    <Link
                      to={item.path}
                      onClick={() => setOpenSubPanel(null)}
                      title={isCollapsed ? t(item.name) : undefined}
                      className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-2.5 cursor-pointer active:opacity-80 transition-colors border-l-4 ${
                        isActive
                          ? 'border-primary bg-primary-container/10 text-white font-semibold'
                          : 'border-l-transparent text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 flex-1 min-w-0'}`}>
                        <span className="material-symbols-outlined text-[20px] relative">
                          {item.icon}
                          {isCollapsed && badge > 0 && (
                            <span className="absolute -top-1.5 -right-2 w-2 h-2 bg-error rounded-full"></span>
                          )}
                        </span>
                        {!isCollapsed && <span className="text-sm truncate">{t(item.name)}</span>}
                      </div>
                      {!isCollapsed && badge > 0 && (
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
          <div>
            {/* Chuyển ngôn ngữ VI | EN | KO */}
            <LanguageSwitcher isCollapsed={isCollapsed} />
            <div className="p-3 border-t border-white/10">
              <button
                onClick={handleLogout}
                title={isCollapsed ? t('Đăng xuất') : undefined}
                className={`w-full text-slate-400 hover:text-white flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-center px-4 gap-2'} py-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer`}
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
                {!isCollapsed && <span className="text-sm font-medium">{t('Đăng xuất')}</span>}
              </button>
            </div>
          </div>
        </nav>

        {/* Sub-panel side-by-side pushing content — mở ra khi rê chuột vào mục cha.
            BE-82: dùng `renderedSubPanel` (trễ hơn `openSubPanel`) để nội dung vẫn còn trong lúc
            khung thu, nhờ đó thấy được hiệu ứng trượt ra thay vì biến mất tức thì. */}
        <div
          onMouseEnter={cancelClose}
          className={`h-full overflow-hidden flex transition-[width,opacity] duration-[380ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
            openSubPanel ? 'w-[200px] opacity-100' : 'w-0 opacity-0'
          }`}
        >
          {renderedSubPanel === 'requests' && (
            <div className={`h-full flex-shrink-0 transition-transform duration-[380ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${openSubPanel === 'requests' ? 'translate-x-0' : '-translate-x-4'}`}>
              <RequestsSubPanel pendingCount={pendingCount} supplementCount={supplementCount} />
            </div>
          )}
          {renderedSubPanel === 'settings' && (
            <div className={`h-full flex-shrink-0 transition-transform duration-[380ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${openSubPanel === 'settings' ? 'translate-x-0' : '-translate-x-4'}`}>
              <SettingsSubPanel />
            </div>
          )}
        </div>
      </div>
    </>
  );
}