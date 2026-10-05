import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../../../i18n/I18nProvider';

/**
 * BE-76: hộp thoại xác nhận hủy đơn của chính người tạo.
 *
 * Lý do là TUỲ CHỌN (khác với từ chối đơn — bắt buộc theo BR06) vì đây là đơn của chính họ
 * và chưa ai duyệt. Vẫn khuyến khích ghi để người duyệt hiểu vì sao đơn biến mất.
 *
 * Cha chỉ mount khi cần nên state tự reset mỗi lần mở.
 */
export default function CancelRequestModal({ requestId, requestTitle, onClose, onConfirm }) {
  const { t } = useI18n();
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !saving && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, saving]);

  const submit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    // Không tự đóng: cha chỉ đóng khi máy chủ xác nhận hủy thành công, để nếu thất bại
    // người dùng còn thấy lý do trong hộp thoại.
    const ok = await onConfirm(reason.trim());
    setSaving(false);
    if (ok) onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[110] bg-black/50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t('Hủy đơn')}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="bg-surface rounded-lg shadow-xl w-full max-w-md flex flex-col overflow-hidden"
      >
        <div className="flex justify-between items-start p-5 border-b border-outline-variant/30">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-error-container text-error flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined">cancel</span>
            </div>
            <div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface">{t('Hủy đơn này?')}</h2>
              <p className="text-xs text-secondary mt-0.5">
                {t('Đơn')} <span className="font-medium text-on-surface">{requestId}</span>
                {requestTitle ? ` · ${requestTitle}` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-variant cursor-pointer disabled:opacity-40"
            aria-label={t('Đóng')}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-sm text-on-surface">
            {t('Đơn sẽ được hủy và không ai cần duyệt nữa. Thao tác này không thể hoàn tác.')}
          </p>
          <div>
            <label className="block font-label-md text-label-md text-on-surface-variant mb-1.5">
              {t('Lý do hủy')} <span className="text-secondary font-normal">({t('không bắt buộc')})</span>
            </label>
            <textarea
              autoFocus
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={1000}
              className="w-full rounded-md border border-outline-variant bg-surface-container-lowest p-3 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none min-h-[90px]"
              placeholder={t('VD: Nhập nhầm ngày, đã xin nghỉ theo cách khác...')}
            />
            <p className="text-xs text-secondary mt-1">{reason.length}/1000</p>
          </div>
        </div>

        <div className="p-5 pt-0 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="font-label-md text-on-surface-variant px-4 py-2 rounded-md hover:bg-surface-variant transition-colors cursor-pointer disabled:opacity-40"
          >
            {t('Giữ đơn')}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="font-label-md text-on-error bg-error px-5 py-2 rounded-md hover:bg-error/90 transition-colors shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">{saving ? 'hourglass_top' : 'cancel'}</span>
            {saving ? t('Đang hủy...') : t('Xác nhận hủy đơn')}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}
