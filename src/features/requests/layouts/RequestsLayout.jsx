import { Outlet } from 'react-router-dom';

// Minimal shell for the approval-system pages.
// The dark status-filter rail is rendered by the list page itself,
// not here, so it can share filter state with the list.
export default function RequestsLayout() {
  return (
    <div className="flex h-screen bg-background text-on-surface font-body-md overflow-hidden">
      <main className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        <Outlet />
      </main>
    </div>
  );
}
