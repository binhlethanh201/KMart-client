import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useI18n } from '../i18n/I18nProvider';

/**
 * MOBILE-12: nhắc xoay ngang màn hình khi trang vẫn còn nội dung rộng hơn khung nhìn.
 *
 * Vì sao cần: phần lớn bảng đã được xếp dọc trên điện thoại (xem `stack-grid` trong index.css),
 * nhưng vẫn còn loại nội dung không biết trước bề rộng — bảng Markdown do người dùng tự viết ở
 * trang Hướng dẫn. Khi đó báo thẳng cho người dùng biết phải xoay ngang, thay vì để họ đoán.
 *
 * Chỉ hiện khi: màn hình điện thoại (< 640px) đang cầm DỌC, và thật sự có chỗ bị tràn.
 * Kiểm tra lại sau khi đổi trang / xoay máy / đổi kích thước, nên không cần bảo trì gì thêm:
 * sửa được chỗ tràn thì thông báo tự biến mất.
 */
const PHONE_QUERY = '(max-width: 639.98px) and (orientation: portrait)';

/** Đo lại vài lần sau khi vào trang để bắt kịp dữ liệu tải về muộn, rồi thôi (không theo dõi liên tục). */
const RECHECK_DELAYS_MS = [400, 1200, 2500];

/**
 * Trang bị coi là "tràn" khi: chính trang cuộn ngang, HOẶC có một BẢNG rộng hơn khung từ 40px.
 * Chỉ tính bảng: dải chip lọc trạng thái (cuộn ngang có chủ ý) không được coi là tràn.
 * Ngưỡng 40px để bỏ qua sai số làm tròn, không phải để bỏ qua phần vượt thật.
 */
function hasOverflow() {
  const vw = document.documentElement.clientWidth;
  if (document.documentElement.scrollWidth > vw + 8) return true;
  return [...document.querySelectorAll('main *')].some((el) => {
    const cs = getComputedStyle(el);
    if (cs.overflowX !== 'auto' && cs.overflowX !== 'scroll') return false;
    if (!el.querySelector('table')) return false;
    return el.scrollWidth > el.clientWidth + 40;
  });
}

export default function RotateHint() {
  const { t } = useI18n();
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const check = () => setVisible(window.matchMedia(PHONE_QUERY).matches && hasOverflow());
    const timers = RECHECK_DELAYS_MS.map((ms) => setTimeout(check, ms));
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
  }, [pathname]);

  if (!visible) return null;

  return (
    <div
      role="status"
      className="sm:hidden sticky top-16 z-20 flex items-center gap-2 px-4 py-2.5 text-[13px] bg-warning-container/70 text-on-warning-container border-b border-warning/40"
    >
      <span aria-hidden="true" className="material-symbols-outlined text-[18px] text-warning flex-shrink-0">
        screen_rotation
      </span>
      <span>{t('Xoay ngang màn hình để xem đầy đủ nội dung trang này.')}</span>
    </div>
  );
}
