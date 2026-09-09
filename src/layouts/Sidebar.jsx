import { Link, useLocation } from 'react-router-dom';

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();

  const navItems = [
    { name: 'Phòng ban & Nhóm', icon: 'account_tree', path: '/' },
    { name: 'Nhân sự', icon: 'group', path: '/personnel' },
    { name: 'Đơn từ cá nhân', icon: 'description', path: '/my-requests' },
    { name: 'Đơn chờ duyệt', icon: 'pending_actions', path: '/pending-requests', badge: 3 },
    { name: 'Cấu hình hệ thống', icon: 'settings', path: '/settings' },
  ];

  return (
    <>
      {/* Mobile Nav Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 md:hidden ${isOpen ? 'block' : 'hidden'}`}
        onClick={onClose}
      ></div>

      {/* Sidebar - dark navy rail, 240px, enterprise density */}
      <nav
        className={`bg-[#0F172A] w-[240px] h-full flex-shrink-0 flex flex-col justify-between shadow-sm z-50 fixed md:static transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300`}
        id="sidebar"
      >
        <div>
          {/* User Profile Header */}
          <Link to="/profile" className="block px-4 py-3 border-b border-white/10 hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <img
                  alt="Executive User Avatar"
                  className="w-9 h-9 rounded-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCJ6rf1wZ7pfErOiSFy34dN8pdPp_NfG1jg3EERXkZuWBj9jrdw_3FRbyyJ73mEm4Nvyazc3xQc3JDAt41BL-9Mus5LHkhAdeO_OtLnfV1OQC9FFOwjfI0BI7i18QHdLZSYCSlyGBA4TA0lk-HyBc2PEoLNPzXBW1qeDj7-R3zUvYsiwOSpU5-ccS53k4vPH9cS35WjkK1XgRDJ6dXYwmT-B92NiH5k4lr9iGXjmWIb9kiB9ejOdGB4DQ"
                />
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#0F172A]"></div>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-white text-sm font-semibold truncate leading-tight">Nguyễn Văn A</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="px-1.5 py-0.5 bg-primary/20 text-inverse-primary rounded text-[10px] font-bold tracking-wider leading-none">Admin</span>
                  <span className="text-slate-400 text-xs leading-none">Online</span>
                </div>
              </div>
              <div
                className="relative cursor-pointer group shrink-0"
                onClick={(e) => {
                  e.preventDefault();
                  // handle notification click separately if needed
                }}
              >
                <span className="material-symbols-outlined text-[20px] text-slate-400 group-hover:text-white transition-colors">notifications</span>
                <div className="absolute top-0 right-0 w-2 h-2 bg-error rounded-full border border-[#0F172A]"></div>
              </div>
            </div>
          </Link>

          {/* Navigation Links */}
          <ul className="flex flex-col py-2">
            {navItems.map((item, index) => {
              const isActive = location.pathname === item.path;

              return (
                <li key={index}>
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
                    {item.badge && (
                      <span className="bg-error text-on-error text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="p-3 border-t border-white/10">
          <button className="w-full text-slate-400 hover:text-white flex items-center justify-center gap-2 px-4 py-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span className="text-sm font-medium">Đăng xuất</span>
          </button>
        </div>
      </nav>
    </>
  );
}
