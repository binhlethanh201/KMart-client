import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';

/**
 * Khu nội dung (thường là bộ lọc) thu gọn được trên màn hình hẹp.
 *
 * Vì sao: trên điện thoại các khối lọc nhiều ô chiếm gần nửa màn hình, đẩy phần
 * dữ liệu chính xuống dưới gấp đôi lần cuộn. Từ cỡ md (768px) trở lên mọi thứ
 * luôn hiển thị như cũ; dưới md chỉ còn một hàng nút bấm để mở/đóng khu lọc.
 *
 * - `title`: nhãn chuỗi nguồn (đã có trong bảng dịch), VD 'Bộ lọc'.
 * - `count`: số điều kiện đang áp dụng, hiện cạnh nhãn để khỏi mở ra vẫn biết.
 * - `defaultOpen`: mặc định mở (mặc định đóng trên mobile).
 */
export default function CollapsibleOnMobile({ title = 'Bộ lọc', count = 0, defaultOpen = false, children }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="md:hidden flex items-center gap-2 w-full px-1 py-2 text-sm font-semibold text-on-surface-variant cursor-pointer"
      >
        <span className="material-symbols-outlined text-[18px] text-primary">tune</span>
        <span>{t(title)}</span>
        {count > 0 && (
          <span className="text-[11px] font-bold text-primary bg-primary/10 rounded-full px-2 py-0.5">
            {count}
          </span>
        )}
        <span
          className={`material-symbols-outlined text-[18px] ml-auto transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        >
          expand_more
        </span>
      </button>
      <div className={`${open ? 'block' : 'hidden'} md:block`}>{children}</div>
    </div>
  );
}
