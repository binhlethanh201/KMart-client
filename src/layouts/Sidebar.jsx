import React from 'react';
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

      {/* Sidebar */}
      <nav 
        className={`bg-[#0F172A] w-[280px] h-full flex-shrink-0 flex flex-col justify-between shadow-sm z-50 fixed md:static transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300`}
        id="sidebar"
      >
        <div>
          {/* User Profile Header */}
          <Link to="/profile" className="block p-6 border-b border-white/10 hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img 
                  alt="Executive User Avatar" 
                  className="w-12 h-12 rounded-full object-cover" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCJ6rf1wZ7pfErOiSFy34dN8pdPp_NfG1jg3EERXkZuWBj9jrdw_3FRbyyJ73mEm4Nvyazc3xQc3JDAt41BL-9Mus5LHkhAdeO_OtLnfV1OQC9FFOwjfI0BI7i18QHdLZSYCSlyGBA4TA0lk-HyBc2PEoLNPzXBW1qeDj7-R3zUvYsiwOSpU5-ccS53k4vPH9cS35WjkK1XgRDJ6dXYwmT-B92NiH5k4lr9iGXjmWIb9kiB9ejOdGB4DQ" 
                />
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0F172A]"></div>
              </div>
              <div className="flex-1">
                <h2 className="text-white font-headline-sm text-headline-sm">Nguyễn Văn A</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-primary/20 text-inverse-primary rounded text-[10px] font-bold tracking-wider">Admin</span>
                  <span className="text-slate-400 text-xs">Online</span>
                </div>
              </div>
              <div 
                className="relative cursor-pointer group" 
                onClick={(e) => {
                  e.preventDefault();
                  // handle notification click separately if needed
                }}
              >
                <span className="material-symbols-outlined text-slate-400 group-hover:text-white transition-colors">notifications</span>
                <div className="absolute top-0 right-0 w-2 h-2 bg-error rounded-full border border-[#0F172A]"></div>
              </div>
            </div>
          </Link>

          {/* Navigation Links */}
          <ul className="flex flex-col py-4">
            {navItems.map((item, index) => {
              const isActive = location.pathname === item.path;
              
              return (
                <li key={index}>
                  <Link 
                    to={item.path}
                    className={`flex items-center gap-3 px-6 py-4 cursor-pointer active:opacity-80 transition-colors ${
                      isActive 
                        ? 'border-l-4 border-primary bg-primary-container/10 text-white font-bold' 
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <span className="material-symbols-outlined">{item.icon}</span>
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="bg-error text-on-error text-xs font-bold px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
        
        <div className="p-4 border-t border-white/10">
          <button className="w-full text-slate-400 hover:text-white flex items-center justify-center gap-2 px-6 py-3 hover:bg-white/5 rounded-lg transition-colors cursor-pointer">
            <span className="material-symbols-outlined">logout</span>
            <span className="font-medium">Đăng xuất</span>
          </button>
        </div>
      </nav>
    </>
  );
}
