import React from 'react';
import { Outlet } from 'react-router-dom';
import RequestsSidebar from '../components/RequestsSidebar';

export default function RequestsLayout() {
  return (
    <div className="flex h-screen bg-background text-on-surface font-body-md overflow-hidden">
      <RequestsSidebar />
      
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-surface-bright relative z-10">
        <Outlet />
      </main>
    </div>
  );
}
