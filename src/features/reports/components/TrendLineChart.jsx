import { useMemo, useState } from 'react';
import { useI18n } from '../../../i18n/I18nProvider';

/**
 * BE-51: biểu đồ ĐƯỜNG nhiều chuỗi cho xu hướng đơn theo tháng.
 *
 * BE-52: chỉ vào một tháng sẽ hiện hộp thông tin (tooltip) với đầy đủ số liệu của tháng đó,
 * có vạch dọc đánh dấu và làm nổi các điểm dữ liệu.
 *
 * series: [{ key, label, color, values: number[] }]
 * labels: string[] (nhãn trục X, ví dụ "T10/2026")
 * changePercents: number[] (tuỳ chọn) — % tăng/giảm của chuỗi chính so với tháng trước
 * tooltips: object[] (tuỳ chọn) — dữ liệu riêng cho từng tháng, hiện thêm trong hộp thông tin
 */
export default function TrendLineChart({
  labels = [],
  series = [],
  changePercents = null,
  tooltips = null,
  height = 260,
  dark = false,
}) {
  const { t } = useI18n();
  const [hoverIdx, setHoverIdx] = useState(null);

  const { maxValue, paths } = useMemo(() => {
    const allValues = series.flatMap((s) => s.values || []);
    const max = Math.max(...allValues, 1);
    const w = 100;
    const h = 100;
    const stepX = labels.length > 1 ? w / (labels.length - 1) : 0;

    const built = series.map((s) => {
      const pts = (s.values || []).map((v, i) => ({
        x: i * stepX,
        y: h - (v / max) * h,
        value: v,
      }));
      return {
        ...s,
        points: pts,
        d: pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' '),
      };
    });

    return { maxValue: max, paths: built };
  }, [labels, series]);

  if (!labels.length) {
    return (
      <div className={`py-10 text-center text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
        {t('Không có dữ liệu xu hướng')}
      </div>
    );
  }

  const gridLines = [0, 0.25, 0.5, 0.75, 1];
  const axisText = dark ? 'text-gray-400' : 'text-gray-500';
  const gridColor = dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)';
  const stepX = labels.length > 1 ? 100 / (labels.length - 1) : 0;
  const hoverX = hoverIdx !== null ? hoverIdx * stepX : null;
  const extra = tooltips && hoverIdx !== null ? tooltips[hoverIdx] : null;

  return (
    <div className="w-full">
      {/* Chú giải */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        {paths.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
            <span className={`text-[11px] font-semibold uppercase tracking-wide ${axisText}`}>{s.label}</span>
          </span>
        ))}
        <span className={`text-[10px] ml-auto ${axisText}`}>{t('Đưa chuột vào biểu đồ để xem chi tiết tháng')}</span>
      </div>

      <div className="relative" style={{ height }}>
        {/* Lưới ngang + nhãn trục Y */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          {gridLines.map((g, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className={`text-[9px] w-8 text-right ${axisText}`}>
                {Math.round(maxValue * (1 - g))}
              </span>
              <div className="flex-1 h-px" style={{ backgroundColor: gridColor }} />
            </div>
          ))}
        </div>

        {/* Vùng vẽ */}
        <div className="absolute inset-0 pl-10 pr-2 pb-6">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
            {/* Vạch dọc đánh dấu tháng đang chỉ */}
            {hoverX !== null && (
              <line
                x1={hoverX}
                y1={0}
                x2={hoverX}
                y2={100}
                stroke={dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.25)'}
                strokeWidth={1}
                strokeDasharray="3 3"
                vectorEffect="non-scaling-stroke"
              />
            )}

            {paths.map((s) => (
              <path
                key={s.key}
                d={s.d}
                fill="none"
                stroke={s.color}
                strokeWidth={dark ? 1.6 : 1.8}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {paths.map((s) =>
              s.points.map((p, i) => (
                <circle
                  key={`${s.key}-${i}`}
                  cx={p.x}
                  cy={p.y}
                  r={hoverIdx === i ? 3 : 1.6}
                  fill={s.color}
                  stroke={hoverIdx === i ? (dark ? '#1d1d1f' : '#fff') : 'none'}
                  strokeWidth={1.5}
                  vectorEffect="non-scaling-stroke"
                />
              ))
            )}
          </svg>
        </div>

        {/* Vùng bắt sự kiện hover theo từng tháng */}
        <div
          className="absolute inset-0 pl-10 pr-2 pb-6 flex"
          onMouseLeave={() => setHoverIdx(null)}
        >
          {labels.map((lb, i) => (
            <div
              key={lb + i}
              className="flex-1 h-full cursor-crosshair"
              onMouseEnter={() => setHoverIdx(i)}
            />
          ))}
        </div>

        {/* Hộp thông tin chi tiết tháng */}
        {hoverIdx !== null && (
          <div
            className="absolute z-20 pointer-events-none rounded-xl border px-3 py-2.5 shadow-lg text-[11px] min-w-[170px] bg-white border-[#eeece7] text-[#1d1d1f]"
            style={{
              left: `calc(${(hoverIdx / Math.max(labels.length - 1, 1)) * 100}% ${hoverIdx > labels.length / 2 ? '- 190px' : '+ 12px'})`,
              top: 8,
            }}
          >
            <p className="font-bold text-[12px] mb-1.5">{labels[hoverIdx]}</p>
            {paths.map((s) => (
              <div key={s.key} className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-gray-600">{s.label}</span>
                </span>
                <span className="font-bold">{s.values?.[hoverIdx] ?? 0}</span>
              </div>
            ))}
            {extra && Object.entries(extra).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-3 mt-1 pt-1 border-t border-[#f0eee9] text-gray-600">
                <span>{k}</span>
                <span className="font-semibold text-[#1d1d1f]">{v}</span>
              </div>
            ))}
            {changePercents && changePercents[hoverIdx] !== undefined && hoverIdx > 0 && (
              <div
                className={`mt-1.5 pt-1.5 border-t border-[#f0eee9] font-bold ${
                  changePercents[hoverIdx] > 0 ? 'text-emerald-600' : changePercents[hoverIdx] < 0 ? 'text-red-600' : 'text-gray-500'
                }`}
              >
                {changePercents[hoverIdx] > 0 ? '▲' : changePercents[hoverIdx] < 0 ? '▼' : '•'}{' '}
                {Math.abs(changePercents[hoverIdx]).toFixed(0)}% {t('so với tháng trước')}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Nhãn trục X + % tăng/giảm so với tháng trước */}
      <div className="flex pl-10 pr-2 mt-1">
        {labels.map((lb, i) => (
          <div key={lb + i} className="flex-1 flex flex-col items-center min-w-0">
            <span className={`text-[9px] font-semibold truncate ${hoverIdx === i ? 'text-[#d94a38]' : axisText}`}>{lb}</span>
            {changePercents && changePercents[i] !== undefined && i > 0 && (
              <span
                className={`text-[9px] font-bold ${
                  changePercents[i] > 0 ? 'text-emerald-500' : changePercents[i] < 0 ? 'text-red-500' : axisText
                }`}
                title={t('So với tháng trước')}
              >
                {changePercents[i] > 0 ? '▲' : changePercents[i] < 0 ? '▼' : '•'}
                {Math.abs(changePercents[i]).toFixed(0)}%
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
