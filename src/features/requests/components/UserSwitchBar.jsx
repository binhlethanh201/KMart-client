import { useState } from 'react';
import { useApproval } from '../../../context/useApproval';

// Fixed bottom-right floating toolbar to switch the active user.
// Drives all permission-gated buttons across the approval system.
export default function UserSwitchBar() {
  const { users, currentUser, currentUserId, setCurrentUserId } = useApproval();
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-[120] flex flex-col items-end gap-2">
      {open && (
        <div className="bg-surface rounded-lg shadow-xl border border-outline-variant overflow-hidden w-72">
          <div className="px-4 py-2.5 bg-surface-container-low border-b border-outline-variant">
            <p className="font-label-md text-on-surface-variant uppercase text-xs font-semibold">Đổi người dùng (giả lập)</p>
          </div>
          <ul className="flex flex-col p-1.5">
            {users.filter((u) => u.switchable !== false).map((u) => {
              const active = u.id === currentUserId;
              return (
                <li key={u.id}>
                  <button
                    onClick={() => {
                      setCurrentUserId(u.id);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-md text-left cursor-pointer transition-colors ${
                      active ? 'bg-primary-container/40' : 'hover:bg-surface-container-low'
                    }`}
                  >
                    <img className="w-8 h-8 rounded-full object-cover" src={u.avatar} alt={u.name} />
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium truncate ${active ? 'text-primary' : 'text-on-surface'}`}>{u.name}</p>
                      <p className="text-xs text-secondary truncate">{u.role} - {u.subtitle}</p>
                    </div>
                    {active && <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        className="bg-primary text-on-primary hover:bg-on-primary-fixed-variant shadow-lg rounded-full pl-3 pr-4 py-2.5 flex items-center gap-2 transition-colors cursor-pointer border border-white/10"
      >
        <img className="w-6 h-6 rounded-full object-cover border border-white/30" src={currentUser.avatar} alt={currentUser.name} />
        <span className="text-sm font-medium">{currentUser.name}</span>
        <span className="material-symbols-outlined text-[18px]">{open ? 'expand_more' : 'swap_horiz'}</span>
      </button>
    </div>
  );
}
