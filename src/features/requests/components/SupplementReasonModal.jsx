import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../../../i18n/I18nProvider';

/**
 * BE-94: hộp thoại người duyệt yêu cầu bổ sung thông tin.
 *
 * Trước đây hộp thoại tự đóng NGAY khi bấm gửi (dù máy chủ từ chối) nên người duyệt mất hết
 * nội dung vừa gõ và chỉ nhận một thông báo mơ hồ. Nay:
 *  - chỉ đóng khi gửi THÀNH CÔNG, gửi lỗi thì giữ nguyên nội dung và hiện câu lỗi tại chỗ;
 *  - câu nhắc "nhập nội dung" chỉ hiện SAU khi người dùng bấm gửi, không hiện sẵn như một lỗi;
 *  - giới hạn 1000 ký tự đúng như máy chủ, kèm bộ đếm, để không phải nhận lỗi từ máy chủ.
 */
const MAX_LENGTH = 1000;

export default function SupplementReasonModal({ requestId, onClose, onConfirm }) {
  const { t } = useI18n();
  const [reason, setReason] = useState('');
  const [sending, setSending] = useState(false);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !sending && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, sending]);

  const submit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (!reason.trim() || sending) return;

    setSending(true);
    setError('');
    const res = await onConfirm(reason.trim());
    setSending(false);

    if (res?.ok) {
      onClose();
      return;
    }
    // Máy chủ từ chối -> giữ nguyên hộp thoại và nội dung đã gõ, hiện đúng câu lỗi của máy chủ.
    setError(res?.error || t('Không gửi được yêu cầu bổ sung. Vui lòng thử lại.'));
  };

  const empty = !reason.trim();

  return createPortal(
    <div
      className="fixed inset-0 z-[110] bg-black/50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t('Yêu cầu bổ sung')}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="bg-surface rounded-lg shadow-xl w-full max-w-md flex flex-col overflow-hidden"
      >
        <div className="flex justify-between items-start p-5 border-b border-outline-variant/30">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined">edit_note</span>
            </div>
            <div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface">{t('Yêu cầu bổ sung')}</h2>
              <p className="text-xs text-secondary mt-0.5">{t('Đơn')} {requestId}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={sending} className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-variant cursor-pointer disabled:opacity-40" aria-label={t('Đóng')}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-5">
          <label className="block font-label-md text-label-md text-on-surface-variant mb-1.5">{t('Lý do / Thông tin cần bổ sung')}</label>
          <textarea
            autoFocus
            value={reason}
            maxLength={MAX_LENGTH}
            onChange={(e) => { setReason(e.target.value); setError(''); }}
            className="w-full rounded-md border border-outline-variant bg-surface-container-lowest p-3 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none min-h-[100px]"
            placeholder={t('Nhập yêu cầu bổ sung thông tin cụ thể (bắt buộc)...')}
          />
          <div className="flex items-center justify-between gap-2 mt-2">
            {/* Nhắc thiếu nội dung chỉ hiện SAU khi người dùng bấm gửi (trước đây hiện ngay
                khi mở hộp thoại nên trông như một lỗi của người dùng). */}
            {touched && empty ? (
              <p className="text-xs text-error flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">error</span>
                {t('Vui lòng nhập nội dung cần bổ sung để gửi yêu cầu.')}
              </p>
            ) : <span />}
            <span className="text-[11px] text-on-surface-variant whitespace-nowrap">
              {reason.length}/{MAX_LENGTH}
            </span>
          </div>
          {error && (
            <p className="text-xs text-error mt-2 flex items-start gap-1">
              <span className="material-symbols-outlined text-[14px] mt-px">error</span>
              {error}
            </p>
          )}
        </div>
        <div className="p-5 pt-0 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={sending} className="font-label-md text-on-surface-variant px-4 py-2 rounded-md hover:bg-surface-variant transition-colors cursor-pointer disabled:opacity-40">
            {t('Hủy')}
          </button>
          <button
            type="submit"
            disabled={sending}
            className="font-label-md text-on-primary bg-primary px-5 py-2 rounded-md hover:bg-primary/90 transition-colors shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <span className={`material-symbols-outlined text-[18px] ${sending ? 'animate-spin' : ''}`}>
              {sending ? 'progress_activity' : 'send'}
            </span>
            {sending ? t('Đang gửi...') : t('Gửi yêu cầu')}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}
