import { useI18n } from '../i18n/I18nProvider';

/**
 * BE-97: khung tiêu đề dùng CHUNG cho mọi trang.
 *
 * Vì sao cần: mỗi trang tự dựng tiêu đề một kiểu (nền `bg-surface` trắng ngả xanh, cỡ chữ
 * `text-2xl font-bold`) nên nhìn lệch tông với trang Báo cáo / Phòng ban (nền ấm #f6f6f4) và
 * cỡ chữ mỗi trang một khác. Nay tất cả dùng đúng tông ấm + đúng bộ chữ của trang Báo cáo:
 *   * nền ấm  #f6f6f4  (giống thẻ tiêu đề trang "Phòng ban & Nhóm" và nền trang Báo cáo)
 *   * tiêu đề #1d1d1f, cùng cỡ chữ ở mọi trang
 *
 * BE-102: hạ độ đậm của tiêu đề từ `font-black` (900) xuống `font-semibold` (600) và thu cỡ chữ
 * lại một bậc — chữ 900 cỡ 36px nhìn "nặng" và lấn át nội dung. Mọi trang PHẢI dùng chung hằng
 * `PAGE_TITLE_CLS` bên dưới để không lệch nhau về sau.
 *
 * Cách dùng:
 *   <PageHeader icon="description" title={t('Đơn từ cá nhân')} actions={<button .../>}>
 *     ...hàng lọc / tab nằm trong cùng khung tiêu đề...
 *   </PageHeader>
 */

/** Bộ chữ tiêu đề trang — dùng chung cho cả trang có khung tiêu đề riêng (Báo cáo, Chi tiết...). */
export const PAGE_TITLE_CLS = 'text-2xl md:text-3xl font-semibold text-[#1d1d1f] tracking-tight leading-tight';

export default function PageHeader({
  icon,
  title,
  subtitle,
  actions,
  children,
  className = '',
  contentClassName = 'px-6 pt-5 pb-4',
}) {
  const { t } = useI18n();

  return (
    <div className={`bg-[#f6f6f4] border-b border-outline-variant flex-shrink-0 z-10 ${className}`}>
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 ${contentClassName}`}>
        <div className="flex items-center gap-3 min-w-0">
          {icon && (
            <div className="w-11 h-11 rounded-lg bg-white border border-[#e7e3da] shadow-sm flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-primary text-[24px]">{icon}</span>
            </div>
          )}
          <div className="min-w-0">
            <h1 className={`${PAGE_TITLE_CLS} truncate`}>
              {typeof title === 'string' ? t(title) : title}
            </h1>
            {subtitle && <p className="text-[13px] text-[#66655F] mt-1">{subtitle}</p>}
          </div>
        </div>

        {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
      </div>

      {children}
    </div>
  );
}
