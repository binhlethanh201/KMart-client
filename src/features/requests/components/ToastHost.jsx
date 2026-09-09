import { createPortal } from 'react-dom';
import { useApproval } from '../../../context/useApproval';

// Fixed toast stack. Reads from context so any handler can fire one.
export default function ToastHost() {
  const { toasts, dismissToast } = useApproval();

  const styles = {
    success: { bar: 'bg-success', icon: 'check_circle', cls: 'text-on-success-container bg-success-container border-success/20' },
    error: { bar: 'bg-error', icon: 'cancel', cls: 'text-on-error-container bg-error-container border-error/20' },
    warning: { bar: 'bg-warning', icon: 'warning', cls: 'text-on-warning-container bg-warning-container border-warning/20' },
    info: { bar: 'bg-primary', icon: 'info', cls: 'text-on-primary-container bg-primary-container border-primary/20' },
  };

  if (toasts.length === 0) return null;

  return createPortal(
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[130] flex flex-col gap-2 items-center w-full max-w-sm px-4 pointer-events-none">
      {toasts.map((t) => {
        const s = styles[t.variant] || styles.info;
        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-2.5 pl-3 pr-2 py-2.5 rounded-lg border shadow-lg ${s.cls} w-full`}
          >
            <span className={`material-symbols-outlined text-[20px]`}>{s.icon}</span>
            <span className="text-sm font-medium flex-1">{t.message}</span>
            <button onClick={() => dismissToast(t.id)} className="p-1 rounded hover:bg-black/10 cursor-pointer" aria-label="Đóng">
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        );
      })}
    </div>,
    document.body
  );
}
