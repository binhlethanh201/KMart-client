import { useI18n } from '../i18n/I18nProvider';

/**
 * UX-01: trạng thái "tải dữ liệu thất bại" kèm nút thử lại.
 *
 * Vì sao cần: trước đây các chỗ nạp danh sách chỉ `console.error(...)` rồi để nguyên mảng rỗng.
 * Khi máy chủ lỗi hoặc mạng chập chờn, người dùng nhìn thấy màn hình **trống** và hiểu sai thành
 * "hệ thống không có dữ liệu" (ví dụ màn Phòng ban hiện như thể công ty chưa có phòng ban nào),
 * trong khi thực tế chỉ là không tải được.
 *
 * Dùng một component chung để mọi màn hình có cùng cách nói và cùng nút khắc phục.
 */
export default function LoadError({ message, onRetry, compact = false }) {
  const { t } = useI18n();
  const text = message || t('Không tải được dữ liệu. Vui lòng thử lại.');

  if (compact) {
    return (
      <div role="alert" className="flex items-center gap-2 text-xs text-error">
        <span aria-hidden="true" className="material-symbols-outlined text-[16px]">cloud_off</span>
        <span>{text}</span>
        {onRetry && (
          <button type="button" onClick={onRetry} className="underline underline-offset-2 hover:no-underline cursor-pointer">
            {t('Thử lại')}
          </button>
        )}
      </div>
    );
  }

  return (
    <div role="alert" className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <span aria-hidden="true" className="material-symbols-outlined text-[40px] text-error">cloud_off</span>
      <p className="font-medium text-on-surface">{text}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-label-md text-on-primary shadow-sm transition-colors hover:bg-on-primary-fixed-variant cursor-pointer"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[18px]">refresh</span>
          {t('Thử lại')}
        </button>
      )}
    </div>
  );
}
