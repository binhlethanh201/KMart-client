import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function EmployeeDetailModal({ employee, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!employee) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface rounded-lg shadow-xl w-full max-w-lg flex flex-col overflow-hidden animate-fade-in"
      >
        {/* Header with background decoration */}
        <div className="flex justify-between items-start p-6 border-b border-outline-variant/30 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-24 bg-primary/10 -z-10"></div>
          
          <div className="flex flex-col gap-4 w-full">
            <div className="flex justify-between items-start w-full">
              <img
                src={employee.avatar}
                alt={employee.name}
                className="w-20 h-20 rounded-full border-4 border-surface object-cover shadow-sm"
              />
              <button
                type="button"
                onClick={onClose}
                className="text-on-surface-variant hover:text-on-surface transition-colors rounded-full p-1 hover:bg-surface-variant cursor-pointer z-10 bg-surface/50 backdrop-blur"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div>
              <h2 className="font-display-sm text-on-surface">{employee.name}</h2>
              <p className="font-body-md text-primary font-medium mt-0.5">{employee.position}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[60vh] flex flex-col gap-6">
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1">Mã nhân sự</label>
              <p className="text-sm text-on-surface bg-surface-container-low px-3 py-2 rounded border border-outline-variant/50">
                {employee.id}
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1">Trạng thái</label>
              <div className="bg-surface-container-low px-3 py-2 rounded border border-outline-variant/50 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${employee.status === 'active' ? 'bg-success' : 'bg-outline'}`}></span>
                <span className="text-sm text-on-surface">{employee.status === 'active' ? 'Đang hoạt động' : 'Ngừng hoạt động'}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1">Số điện thoại</label>
              <p className="text-sm text-on-surface bg-surface-container-low px-3 py-2 rounded border border-outline-variant/50 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-secondary">call</span>
                {employee.phone}
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1">Email công ty</label>
              <p className="text-sm text-on-surface bg-surface-container-low px-3 py-2 rounded border border-outline-variant/50 flex items-center gap-2 truncate" title={employee.email}>
                <span className="material-symbols-outlined text-[16px] text-secondary flex-shrink-0">mail</span>
                <span className="truncate">{employee.email}</span>
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1">Phòng ban & Vai trò hệ thống</label>
            <div className="bg-surface-container-low p-3 rounded border border-outline-variant/50 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-secondary">Phòng ban chính:</span>
                <span className="text-sm font-medium text-on-surface">{employee.department}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-secondary">Quyền hệ thống:</span>
                <span className="text-sm font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">{employee.role}</span>
              </div>
            </div>
          </div>

          {employee.secondary && employee.secondary.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1">Vị trí kiêm nhiệm ({employee.secondary.length})</label>
              <div className="bg-surface-container-low p-3 rounded border border-outline-variant/50 flex flex-col gap-3">
                {employee.secondary.map((s, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-[16px] text-primary mt-0.5">badge</span>
                    <div>
                      <p className="text-sm font-medium text-on-surface">{s.department}</p>
                      <p className="text-xs text-secondary">{s.position}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-outline-variant/30 bg-surface-container-lowest flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="font-label-md text-on-surface-variant px-5 py-2 rounded-md hover:bg-surface-variant transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
