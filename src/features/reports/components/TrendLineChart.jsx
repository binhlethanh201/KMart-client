import { useEffect, useId, useMemo, useState } from 'react';
import { useI18n } from '../../../i18n/I18nProvider';

const PAD = { top: 20, right: 20, bottom: 38, left: 52 };
const TOOLTIP_W = 210;
/** Bề rộng tạm dùng ở lần render đầu (trước khi đo được khung thật). */
const FALLBACK_WIDTH = 900;

/**
 * Mốc trục Y "đẹp" (1/2/5 × 10^n) để tránh nhãn lẻ như 0,3,6,8,11.
 */
function niceScale(maxValue, tickCount = 4) {
  const max = Math.max(maxValue, 1);
  const raw = max / tickCount;
  const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
  const normalized = raw / magnitude;
  const niceStep = (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10) * magnitude;
  // Số liệu là SỐ ĐƠN (nguyên) nên bước chia luôn tối thiểu 1 để nhãn không bị lẻ như 0,5.
  const step = Math.max(1, Math.round(niceStep));
  const top = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = 0; v <= top + step / 1000; v += step) ticks.push(Math.round(v * 1000) / 1000);
  return { top, ticks };
}

/**
 * BE-51: biểu đồ ĐƯỜNG nhiều chuỗi cho xu hướng đơn theo tháng.
 *
 * BE-55: vẽ theo TOẠ ĐỘ PIXEL THẬT (đo bằng ResizeObserver) thay cho viewBox 0..100 co giãn,
 * nên các điểm tròn không còn bị méo thành hình ellipse; trục Y chia mốc đẹp; có vùng tô dần
 * dưới đường và hộp thông tin không tràn ra ngoài khung.
 *
 * series: [{ key, label, color, values: number[] }]
 * labels: string[] (nhãn trục X, ví dụ "T10/2026")
 * changePercents: number[] — % tăng/giảm so với tháng trước (hiện dưới nhãn và trong hộp thông tin)
 * tooltips: object[] — dòng thông tin BỔ SUNG cho từng tháng trong hộp thông tin
 */
export default function TrendLineChart({
  labels = [],
  series = [],
  changePercents = null,
  tooltips = null,
  height = 280,
}) {
  const { t } = useI18n();
  // BE-55: chỉ đo CHIỀU RỘNG; chiều cao lấy trực tiếp từ prop. Trước đây chờ đo được cả 2
  // chiều mới vẽ, mà phép đo có thể trả về 0 -> biểu đồ trắng trơn dù có dữ liệu.
  //
  // BE-56: dùng ref dạng callback + theo dõi phần tử trong state. Lỗi trước đây: khi màn báo cáo
  // còn đang tải dữ liệu thì `labels` rỗng nên component return sớm, khung chưa được gắn vào DOM
  // -> effect (deps rỗng) chạy đúng 1 lần khi khung chưa tồn tại rồi KHÔNG BAO GIỜ chạy lại,
  // nên bề rộng mãi bằng 0 và biểu đồ chỉ vẽ được đúng bằng bề rộng dự phòng 900px (hụt nửa khung).
  const [wrapEl, setWrapEl] = useState(null);
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const [hoverIdx, setHoverIdx] = useState(null);
  const gradientId = useId();

  useEffect(() => {
    if (!wrapEl) return undefined;
    const measure = () => {
      const w = Math.round(wrapEl.getBoundingClientRect().width);
      if (w > 0) setMeasuredWidth((prev) => (prev === w ? prev : w));
    };
    measure();
    // Đo lại sau khung hình đầu để bắt được trường hợp lúc mount khung chưa có kích thước.
    const raf = typeof requestAnimationFrame === 'undefined' ? null : requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    if (typeof ResizeObserver === 'undefined') {
      return () => {
        if (raf !== null) cancelAnimationFrame(raf);
        window.removeEventListener('resize', measure);
      };
    }
    const observer = new ResizeObserver(measure);
    observer.observe(wrapEl);
    return () => {
      if (raf !== null) cancelAnimationFrame(raf);
      window.removeEventListener('resize', measure);
      observer.disconnect();
    };
  }, [wrapEl]);

  const { top, ticks } = useMemo(
    () => niceScale(Math.max(...series.flatMap((s) => s.values || []), 0)),
    [series]
  );

  // Luôn vẽ được: nếu chưa đo được bề rộng thì dùng tạm giá trị hợp lý thay vì để trắng.
  const chartWidth = measuredWidth > 0 ? measuredWidth : FALLBACK_WIDTH;
  const chartHeight = height;
  const innerW = Math.max(1, chartWidth - PAD.left - PAD.right);
  const innerH = Math.max(1, chartHeight - PAD.top - PAD.bottom);
  const stepX = labels.length > 1 ? innerW / (labels.length - 1) : 0;

  const toX = (i) => PAD.left + i * stepX;
  const toY = (v) => PAD.top + innerH - (v / (top || 1)) * innerH;

  const paths = useMemo(
    () => series.map((s) => {
      const pts = (s.values || []).map((v, i) => ({ x: toX(i), y: toY(v), value: v }));
      const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
      const base = (PAD.top + innerH).toFixed(2);
      const area = pts.length > 1
        ? `${line} L${pts[pts.length - 1].x.toFixed(2)},${base} L${pts[0].x.toFixed(2)},${base} Z`
        : '';
      return { ...s, points: pts, line, area };
    }),
    // toạ độ phụ thuộc kích thước khung nên phải tính lại khi khung đổi
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [series, innerW, innerH, top, labels.length]
  );

  if (!labels.length) {
    return <div className="py-10 text-center text-sm text-gray-500">{t('Không có dữ liệu xu hướng')}</div>;
  }

  const hoverX = hoverIdx !== null ? toX(hoverIdx) : null;
  const extra = tooltips && hoverIdx !== null ? tooltips[hoverIdx] : null;

  // Hộp thông tin: chỉ liệt kê chuỗi có số > 0 (bớt rối khi nhiều loại đơn cùng bằng 0)
  const tooltipRows = hoverIdx === null
    ? []
    : paths
        .map((s) => ({ key: s.key, label: s.label, color: s.color, value: s.values?.[hoverIdx] ?? 0 }))
        .filter((r) => r.value > 0)
        .sort((a, b) => b.value - a.value);

  const tooltipLeft = hoverIdx === null
    ? 0
    : Math.min(
        Math.max(
          8,
          toX(hoverIdx) + (hoverIdx > labels.length / 2 ? -TOOLTIP_W - 14 : 14)
        ),
        Math.max(8, chartWidth - TOOLTIP_W - 8)
      );

  return (
    <div className="w-full">
      {/* Chú giải */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-3">
        {paths.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{s.label}</span>
          </span>
        ))}
        <span className="text-[10px] text-gray-400 ml-auto">
          {t('Đưa chuột vào biểu đồ để xem chi tiết tháng')}
        </span>
      </div>

      <div ref={setWrapEl} className="relative w-full" style={{ height }}>
        <svg width={chartWidth} height={chartHeight} className="block">
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={paths[0]?.color || '#10b981'} stopOpacity="0.22" />
                  <stop offset="100%" stopColor={paths[0]?.color || '#10b981'} stopOpacity="0.01" />
                </linearGradient>
              </defs>

              {/* Lưới ngang + nhãn trục Y */}
              {ticks.map((v) => (
                <g key={v}>
                  <line
                    x1={PAD.left}
                    y1={toY(v)}
                    x2={PAD.left + innerW}
                    y2={toY(v)}
                    stroke={v === 0 ? 'rgba(0,0,0,0.14)' : 'rgba(0,0,0,0.06)'}
                    strokeWidth={1}
                    shapeRendering="crispEdges"
                  />
                  <text
                    x={PAD.left - 10}
                    y={toY(v) + 3.5}
                    textAnchor="end"
                    className="fill-gray-400"
                    style={{ fontSize: 10, fontWeight: 600 }}
                  >
                    {v}
                  </text>
                </g>
              ))}

              {/* Vùng tô dần dưới đường khi chỉ có 1 chuỗi */}
              {paths.length === 1 && paths[0].area && (
                <path d={paths[0].area} fill={`url(#${gradientId})`} stroke="none" />
              )}

              {/* Vạch dọc + nền sáng của tháng đang chỉ */}
              {hoverX !== null && (
                <>
                  <rect
                    x={hoverX - stepX / 2}
                    y={PAD.top}
                    width={Math.max(stepX, 1)}
                    height={innerH}
                    fill="rgba(217,74,56,0.05)"
                  />
                  <line
                    x1={hoverX}
                    y1={PAD.top}
                    x2={hoverX}
                    y2={PAD.top + innerH}
                    stroke="rgba(217,74,56,0.45)"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                  />
                </>
              )}

              {/* Các đường */}
              {paths.map((s) => (
                <path
                  key={s.key}
                  d={s.line}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              ))}

              {/* Điểm dữ liệu: hình tròn THẬT (px); chỉ hiện điểm 0 khi được chỉ vào */}
              {paths.map((s) =>
                s.points.map((p, i) => {
                  const isHover = hoverIdx === i;
                  if (p.value === 0 && !isHover) return null;
                  return (
                    <circle
                      key={`${s.key}-${i}`}
                      cx={p.x}
                      cy={p.y}
                      r={isHover ? 5 : 3.5}
                      fill={isHover ? s.color : '#fff'}
                      stroke={s.color}
                      strokeWidth={2}
                    />
                  );
                })
              )}

              {/* Nhãn trục X */}
              {labels.map((lb, i) => (
                <text
                  key={lb + i}
                  x={toX(i)}
                  y={PAD.top + innerH + 16}
                  textAnchor="middle"
                  className={hoverIdx === i ? 'fill-[#d94a38]' : 'fill-gray-400'}
                  style={{ fontSize: 10, fontWeight: 700 }}
                >
                  {lb}
                </text>
              ))}

              {/* % tăng/giảm dưới nhãn tháng */}
              {changePercents && labels.map((lb, i) => {
                if (i === 0 || changePercents[i] === undefined) return null;
                const v = changePercents[i];
                const color = v > 0 ? '#059669' : v < 0 ? '#dc2626' : '#9ca3af';
                return (
                  <text
                    key={`chg-${lb}-${i}`}
                    x={toX(i)}
                    y={PAD.top + innerH + 30}
                    textAnchor="middle"
                    fill={color}
                    style={{ fontSize: 9.5, fontWeight: 700 }}
                  >
                    {v > 0 ? '▲' : v < 0 ? '▼' : '•'} {Math.abs(v).toFixed(0)}%
                  </text>
                );
              })}
            </svg>

            {/* Hộp thông tin khi chỉ vào một tháng */}
            {hoverIdx !== null && (
              <div
                className="absolute z-20 pointer-events-none rounded-xl border border-[#eeece7] bg-white shadow-lg px-3 py-2.5"
                style={{ left: tooltipLeft, top: 6, width: TOOLTIP_W }}
              >
                <div className="text-[12px] font-bold text-[#1d1d1f] mb-2 flex items-center justify-between gap-2">
                  <span>{labels[hoverIdx]}</span>
                  <span className="text-[10px] font-semibold text-gray-400 whitespace-nowrap">
                    {paths[0]?.values?.[hoverIdx] ?? 0} {t('đơn')}
                  </span>
                </div>

                {tooltipRows.length === 0 ? (
                  <p className="text-[11px] text-gray-400">{t('Tháng này không có đơn được duyệt')}</p>
                ) : (
                  <div className="space-y-1">
                    {tooltipRows.map((r) => (
                      <div key={r.key} className="flex items-center justify-between gap-3">
                        <span className="inline-flex items-center gap-1.5 min-w-0">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: r.color }} />
                          <span className="text-[11px] text-gray-600 truncate">{r.label}</span>
                        </span>
                        <span className="text-[11px] font-bold text-[#1d1d1f] flex-shrink-0">{r.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {extra && Object.entries(extra).map(([k, v]) => (
                  <div
                    key={k}
                    className="mt-2 pt-2 border-t border-[#f0eee9] flex items-center justify-between gap-3"
                  >
                    <span className="text-[11px] font-semibold text-gray-500">{k}</span>
                    <span className="text-[11px] font-bold text-[#1d1d1f]">{v}</span>
                  </div>
                ))}

                {changePercents && changePercents[hoverIdx] !== undefined && hoverIdx > 0 && (
                  <div
                    className={`mt-2 pt-2 border-t border-[#f0eee9] text-[11px] font-bold ${
                      changePercents[hoverIdx] > 0
                        ? 'text-emerald-600'
                        : changePercents[hoverIdx] < 0
                          ? 'text-red-600'
                          : 'text-gray-500'
                    }`}
                  >
                    {changePercents[hoverIdx] > 0 ? '▲' : changePercents[hoverIdx] < 0 ? '▼' : '•'}{' '}
                    {Math.abs(changePercents[hoverIdx]).toFixed(0)}% {t('so với tháng trước')}
                  </div>
                )}
              </div>
            )}

            {/* Vùng bắt sự kiện hover theo từng tháng */}
            <div
              className="absolute inset-0 flex"
              style={{
                paddingLeft: PAD.left,
                paddingRight: PAD.right,
                paddingTop: PAD.top,
                paddingBottom: PAD.bottom,
              }}
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
      </div>
    </div>
  );
}
