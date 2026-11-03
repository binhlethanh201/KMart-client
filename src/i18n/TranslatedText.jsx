import { useState } from 'react';
import { useI18n } from './I18nProvider';

/**
 * Hiển thị NỘI DUNG do người dùng nhập (lý do, bình luận, tiêu đề đơn...) qua dịch tự động.
 *
 * `allowViewOriginal`: bật nút "Xem bản gốc" cho các khối nhạy cảm (lý do từ chối/bổ sung)
 * để người dùng đối chiếu nguyên văn khi cần.
 *
 * Component chỉ hiển thị: KHÔNG phân tích, KHÔNG biến đổi chuỗi gốc — mọi logic cắt tiền tố
 * ("[Từ chối] ...") phải được làm TRƯỚC khi truyền `text` vào đây.
 */
export default function TranslatedText({ text, allowViewOriginal = false, className = '' }) {
  const { t, tContent } = useI18n();
  const [showOriginal, setShowOriginal] = useState(false);

  const original = text == null ? '' : String(text);
  const translated = tContent(original);
  const canToggle = allowViewOriginal && original.trim() !== '' && translated !== original;

  return (
    <span className={className}>
      {canToggle && showOriginal ? original : translated}
      {canToggle && (
        <button
          type="button"
          aria-pressed={showOriginal}
          onClick={() => setShowOriginal((v) => !v)}
          className="ml-1 text-[11px] text-secondary underline cursor-pointer align-baseline"
        >
          {showOriginal ? t('Xem bản dịch') : t('Xem bản gốc')}
        </button>
      )}
    </span>
  );
}
