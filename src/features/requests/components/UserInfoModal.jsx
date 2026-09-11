import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DEPARTMENTS } from '../../departments/data/departments';

export default function UserInfoModal({ user, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!user) return null;

  const department = DEPARTMENTS.find(d => d.id === user.departmentId);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Thông tin chi tiết nhân sự"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface rounded-lg shadow-xl w-full max-w-md flex flex-col overflow-hidden animate-fade-in"
      >
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-outline-variant/30 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 left-0 right-0 h-24 bg-primary/10 -z-10"></div>
          
          <div className="flex flex-col gap-4 w-full">
            <div className="flex justify-between items-start w-full">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-20 h-20 rounded-full border-4 border-surface object-cover shadow-sm"
              />
              <button
                type="button"
                onClick={onClose}
                className="text-on-surface-variant hover:text-on-surface transition-colors rounded-full p-1 hover:bg-surface-variant cursor-pointer z-10 bg-surface/50 backdrop-blur"
                aria-label="Đóng"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div>
              <h2 className="font-display-sm text-on-surface">{user.name}</h2>
              <p className="font-body-md text-primary font-medium mt-0.5">{user.role}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-5">
          <div>
            <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1">Mã nhân sự</label>
            <p className="text-sm text-on-surface bg-surface-container-low px-3 py-2 rounded border border-outline-variant/50">
              {user.employeeId || 'EMP-0000'}
            </p>
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1">Phòng ban</label>
            <p className="text-sm text-on-surface bg-surface-container-low px-3 py-2 rounded border border-outline-variant/50 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-secondary">{department?.icon || 'corporate_fare'}</span>
              {department?.name || 'Không có dữ liệu'}
            </p>
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1">Vai trò hệ thống</label>
            <p className="text-sm text-on-surface bg-surface-container-low px-3 py-2 rounded border border-outline-variant/50">
              {user.subtitle || 'Nhân viên'}
            </p>
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1">Trạng thái</label>
            <p className="text-sm text-on-surface bg-surface-container-low px-3 py-2 rounded border border-outline-variant/50 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success"></span>
              Đang hoạt động
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-outline-variant/30 bg-surface-container-lowest flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="font-label-md text-on-surface-variant px-4 py-2 rounded-md hover:bg-surface-variant transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
