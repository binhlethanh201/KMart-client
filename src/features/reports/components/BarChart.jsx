import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../../i18n/I18nProvider';

/**
 * BE-51: biểu đồ cột ngang cho "Thống kê theo loại đơn".
 * BE-52: chỉ vào một cột sẽ hiện thông tin chi tiết của mục đó.
 * BE-80: số của mỗi cột luôn nằm NGAY SAU đầu thanh của chính nó.
 *
 * Trước đây số được đặt trong một cột `w-12` riêng, nhưng cột đó chỉ được render khi thanh ≤ 15%.
 * Vì không được chừa chỗ ở các dòng còn lại nên dòng có thanh ngắn bị co mất 60px: thanh nền lệch
 * hẳn so với các dòng khác, và số bị đẩy ra tận mép phải nên trông "lạc loài" (VD "Đơn xin làm việc
 * tại nhà" = 1).
 *
 * BE-81: số luôn nằm BÊN TRONG thanh xanh như mọi cột khác. Cột có giá trị quá nhỏ được nới tối thiểu
 * đủ chứa số (VD giá trị 1 chỉ ~11px thì nới lên ~19px) — lệch vài pixel, không đáng kể so với việc
 * số nằm ngoài thanh.
 *
 * data: [{ name, value, hint? }]
 */
export default function BarChart({ data, maxBars = 10 }) {
  const { t } = useI18n();
  const [hoverIdx, setHoverIdx] = useState(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const trackRef = useRef(null);

  // Bề rộng thanh nền để biết số có đủ chỗ nằm trong thanh hay không. Mọi dòng đều dùng `flex-1`
  // nên chỉ cần đo dòng đầu tiên.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return undefined;
    const sync = () => setTrackWidth(el.clientWidth);
    sync();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!data || data.length === 0) {
    return <div className="text-center text-gray-500 py-8">{t('Không có dữ liệu')}</div>;
  }

  const maxValue = Math.max(...data.map((d) => d.value || 0), 1);
  const displayData = data.slice(0, maxBars);
  const total = data.reduce((sum, d) => sum + (d.value || 0), 0);

  return (
    <div className="space-y-3">
      {displayData.map((item, idx) => {
        const percentage = (item.value / maxValue) * 100;
        const share = total > 0 ? ((item.value || 0) / total) * 100 : 0;
        const isHover = hoverIdx === idx;
        const label = String(item.value ?? 0);
        // Số luôn nằm trong thanh: cần `pr-2` (8px) + bề rộng chữ (~7px mỗi chữ số ở cỡ 12px) + 2px lề trái.
        const textPx = Math.ceil(label.length * 7.2);
        const minBarPx = textPx + 10;
        const barPx = (trackWidth * percentage) / 100;
        // Khi chưa đo được bề rộng thanh nền (lần render đầu) thì tạm dùng ngưỡng % như trước.
        const needsMin = trackWidth > 0 ? barPx < minBarPx : percentage <= 15;
        const barWidth = needsMin ? `${minBarPx}px` : `${percentage}%`;

        return (
          <div
            key={idx}
            className={`flex items-center gap-3 rounded-lg px-1.5 py-1 transition-colors ${isHover ? 'bg-[#f6f6f4]' : ''}`}
            onMouseEnter={() => setHoverIdx(idx)}
            onMouseLeave={() => setHoverIdx(null)}
            title={`${item.name}: ${item.value} (${share.toFixed(1)}%)`}
          >
            <div className={`w-40 text-sm truncate ${isHover ? 'text-[#1d1d1f] font-semibold' : 'text-gray-700'}`} title={t(item.name)}>
              {t(item.name)}
            </div>
            <div
              ref={idx === 0 ? trackRef : null}
              className="relative flex-1 h-7 bg-gray-100 rounded overflow-hidden"
            >
              <div
                className="h-full rounded transition-all duration-500 flex items-center justify-end pr-2"
                style={{ width: barWidth, backgroundColor: isHover ? '#d94a38' : '#3b82f6' }}
              >
                <span className="text-xs text-white font-medium">{label}</span>
              </div>
              {/* Hộp thông tin khi chỉ vào cột */}
              {isHover && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 text-[11px] pointer-events-none">
                  <span className="px-1.5 py-0.5 rounded bg-white/90 border border-[#eeece7] text-gray-600 font-semibold">
                    {share.toFixed(1)}%{item.hint ? ` · ${item.hint}` : ''}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
