import React, { useLayoutEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import NotificationBell from '../components/NotificationBell';
import BrandLogo from '../components/BrandLogo';
import { useApproval } from '../context/useApproval';
 
export default function MainLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const contentRef = useRef(null);
 
  // currentUser comes from your existing ApprovalSystemProvider
  const { currentUser } = useApproval();

  /**
   * BE-60: chuyển trang thì đưa mọi vùng cuộn về đầu trang NGAY (chạy trước khi trình duyệt vẽ),
   * nên không thấy cảnh nội dung bị "nhảy". Cần thiết vì có nhiều route dùng chung một component
   * (ví dụ "/" và "/departments" cùng là DepartmentDashboard) — React giữ nguyên DOM nên vị trí
   * cuộn của trang trước bị mang sang trang sau.
   */
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    const root = contentRef.current;
    if (!root) return;
    root.querySelectorAll('*').forEach((el) => {
      if (el.scrollTop > 0) el.scrollTop = 0;
    });
  }, [location.pathname]);
 
  return (
    <div className="flex h-screen bg-background text-on-background font-body-md overflow-hidden">
      <Sidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        currentUser={currentUser}
      />
 
      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile top bar */}
        <header className="md:hidden sticky top-0 w-full z-30 bg-surface-container-lowest border-b border-outline-variant flex justify-between items-center px-4 h-16 shadow-sm">
          <button
            className="text-on-surface-variant p-2 -ml-2 rounded-full hover:bg-surface-container-high transition-colors"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <BrandLogo size="sm" />
          <NotificationBell variant="header" />
        </header>
 
        <div ref={contentRef} className="flex-1 flex flex-col min-h-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
}