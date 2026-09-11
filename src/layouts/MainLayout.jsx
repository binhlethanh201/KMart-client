import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useApproval } from '../context/useApproval';
 
export default function MainLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
 
  // currentUser comes from your existing ApprovalSystemProvider
  const { currentUser } = useApproval();
 
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
          <h1 className="font-headline-sm text-headline-sm text-primary font-bold">KMart</h1>
          <div className="relative cursor-pointer p-2 rounded-full hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
            <div className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border border-surface-container-lowest" />
          </div>
        </header>
 
        <div className="flex-1 flex flex-col min-h-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
}