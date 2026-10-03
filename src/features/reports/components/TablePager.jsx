import { useI18n } from '../../../i18n/I18nProvider';

/** Số dòng mỗi trang cho phép chọn. */
const PAGE_SIZE_OPTIONS = [10, 20, 50];

/**
 * BE-63: thanh phân trang dùng chung cho các bảng ở trang Báo cáo & Thống kê.
 *
 * variant:
 *  - 'light' → cho thẻ nền trắng (bảng "Soi kĩ từng đơn")
 *  - 'dark'  → cho thẻ nền đen (bảng điều hành)
 */
export default function TablePager({
  page,
  pageSize,
  totalCount,
  totalPages,
  firstRow,
  lastRow,
  onPageChange,
  onPageSizeChange,
  unitLabel,
  variant = 'light',
}) {
  const { t } = useI18n();
  const isDark = variant === 'dark';

  const textClass = isDark ? 'text-gray-400' : 'text-gray-500';
  const strongClass = isDark ? 'text-white font-semibold' : 'text-[#1d1d1f] font-semibold';
  const selectClass = isDark
    ? 'bg-white/5 border-white/15 text-gray-200 hover:border-white/30'
    : 'bg-white border-[#e5e2db] text-[#1d1d1f] hover:border-[#c9c5bb]';
  const buttonClass = (disabled) => `w-7 h-7 flex items-center justify-center rounded-full border transition-colors ${
    isDark
      ? 'border-white/15 text-gray-300 hover:bg-white/10'
      : 'border-[#e5e2db] text-[#66655F] hover:bg-[#f6f6f4] hover:text-[#1d1d1f]'
  } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`;

  return (
    <div
      className={`flex items-center justify-between gap-4 flex-wrap mt-5 pt-4 ${
        isDark ? 'border-t border-white/10' : 'border-t border-[#f0eee9]'
      }`}
    >
      <div className={`flex items-center gap-2 text-[12px] ${textClass}`}>
        <span>{t('Hiển thị')}</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className={`h-8 px-2 rounded-md border text-[12px] outline-none cursor-pointer transition-colors ${selectClass}`}
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size} className={isDark ? 'text-[#1d1d1f]' : undefined}>
              {size} {t('dòng')}
            </option>
          ))}
        </select>
        <span>
          <strong className={strongClass}>{firstRow}</strong> - <strong className={strongClass}>{lastRow}</strong>
          {' '}{t('trong tổng số')} <strong className={strongClass}>{totalCount}</strong> {unitLabel || t('dòng')}
        </span>
      </div>

      <div className={`flex items-center gap-2 text-[12px] ${textClass}`}>
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className={buttonClass(page <= 1)}
          title={t('Trang trước')}
        >
          <span className="material-symbols-outlined text-[16px]">chevron_left</span>
        </button>
        <span>
          {t('Trang')} <strong className={strongClass}>{page}</strong> / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className={buttonClass(page >= totalPages)}
          title={t('Trang sau')}
        >
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        </button>
      </div>
    </div>
  );
}
