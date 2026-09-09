import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

// Mandatory rejection reason modal (BR06). Must supply a reason to confirm.
// Conditionally mounted by the parent so state resets cleanly each open.
export default function RejectReasonModal({ requestId, onClose, onConfirm }) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = (e) => {
    e.preventDefault();
    if (!reason.trim()) return;
    onConfirm(reason.trim());
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[110] bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Từ chối yêu cầu"
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="bg-surface rounded-lg shadow-xl w-full max-w-md flex flex-col overflow-hidden"
      >
        <div className="flex justify-between items-start p-5 border-b border-outline-variant/30">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-error-container text-error flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined">gavel</span>
            </div>
            <div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface">Từ chối yêu cầu</h2>
              <p className="text-xs text-secondary mt-0.5">Đơn {requestId} - bắt buộc ghi lý do (BR06)</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-variant cursor-pointer" aria-label="Đóng">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-5">
          <label className="block font-label-md text-label-md text-on-surface-variant mb-1.5">Lý do từ chối</label>
          <textarea
            autoFocus
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-md border border-outline-variant bg-surface-container-lowest p-3 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none min-h-[100px]"
            placeholder="Nhập lý do từ chối cụ thể (yêu cầu bắt buộc)..."
          />
          {!reason.trim() && (
            <p className="text-xs text-on-surface-variant mt-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">info</span>
              Vui lòng nhập lý do để xác nhận từ chối.
            </p>
          )}
        </div>
        <div className="p-5 pt-0 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="font-label-md text-on-surface-variant px-4 py-2 rounded-md hover:bg-surface-variant transition-colors cursor-pointer">
            Hủy
          </button>
          <button
            type="submit"
            disabled={!reason.trim()}
            className="font-label-md text-on-error bg-error px-5 py-2 rounded-md hover:bg-error/90 transition-colors shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
            Xác nhận từ chối
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}
