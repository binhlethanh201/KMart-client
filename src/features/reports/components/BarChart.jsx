import { useState } from 'react';

/**
 * BE-51: biểu đồ cột ngang cho "Thống kê theo loại đơn".
 * BE-52: chỉ vào một cột sẽ hiện thông tin chi tiết của mục đó.
 *
 * data: [{ name, value, hint? }]
 */
export default function BarChart({ data, maxBars = 10 }) {
  const [hoverIdx, setHoverIdx] = useState(null);

  if (!data || data.length === 0) {
    return <div className="text-center text-gray-500 py-8">Không có dữ liệu</div>;
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

        return (
          <div
            key={idx}
            className={`flex items-center gap-3 rounded-lg px-1.5 py-1 transition-colors ${isHover ? 'bg-[#f6f6f4]' : ''}`}
            onMouseEnter={() => setHoverIdx(idx)}
            onMouseLeave={() => setHoverIdx(null)}
            title={`${item.name}: ${item.value} (${share.toFixed(1)}%)`}
          >
            <div className={`w-40 text-sm truncate ${isHover ? 'text-[#1d1d1f] font-semibold' : 'text-gray-700'}`} title={item.name}>
              {item.name}
            </div>
            <div className="flex-1 h-7 bg-gray-100 rounded overflow-hidden relative">
              <div
                className="h-full rounded transition-all duration-500 flex items-center justify-end pr-2"
                style={{ width: `${percentage}%`, backgroundColor: isHover ? '#d94a38' : '#3b82f6' }}
              >
                {percentage > 15 && (
                  <span className="text-xs text-white font-medium">{item.value}</span>
                )}
              </div>
              {/* Hộp thông tin khi chỉ vào cột */}
              {isHover && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 text-[11px] pointer-events-none">
                  {percentage <= 15 && <span className="font-bold text-[#1d1d1f]">{item.value}</span>}
                  <span className="px-1.5 py-0.5 rounded bg-white/90 border border-[#eeece7] text-gray-600 font-semibold">
                    {share.toFixed(1)}%{item.hint ? ` · ${item.hint}` : ''}
                  </span>
                </div>
              )}
            </div>
            {percentage <= 15 && (
              <div className="w-12 text-sm text-right font-medium text-gray-700">{item.value}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
