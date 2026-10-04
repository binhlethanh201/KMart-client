import { useMemo, useState } from 'react';
import { useI18n } from '../../../i18n/I18nProvider';

/**
 * Biểu đồ tròn (donut) phân bổ theo loại đơn.
 * BE-52: chỉ vào một lát hoặc một dòng chú giải sẽ làm nổi lát đó và hiện thông tin chi tiết.
 * Nhận cả 2 dạng dữ liệu: { count, documentType } và { value, name }.
 */
export default function PieChart({ data }) {
  const { t } = useI18n();
  const [hoverIdx, setHoverIdx] = useState(null);

  const rows = useMemo(
    () => (data || []).map((item) => ({
      label: item.name ?? item.documentType ?? item.departmentName ?? 'Unknown',
      value: Number(item.value ?? item.count ?? 0),
    })),
    [data]
  );

  if (!rows.length) {
    return <div className="text-center text-gray-500 py-8">{t('Không có dữ liệu')}</div>;
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];
  const total = rows.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="flex items-center gap-8">
      {/* Donut */}
      <div className="relative w-40 h-40 flex-shrink-0">
        <svg viewBox="0 0 100 100" className="transform -rotate-90">
          {rows.reduce((acc, item, idx) => {
            const percentage = total > 0 ? (item.value / total) * 100 : 0;
            const isHover = hoverIdx === idx;
            acc.elements.push(
              <circle
                key={idx}
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke={COLORS[idx % COLORS.length]}
                strokeWidth={isHover ? 18 : 14}
                strokeDasharray={`${percentage} ${100 - percentage}`}
                strokeDashoffset={acc.offset}
                opacity={hoverIdx === null || isHover ? 1 : 0.35}
                onMouseEnter={() => setHoverIdx(idx)}
                onMouseLeave={() => setHoverIdx(null)}
                className="cursor-pointer transition-all"
              >
                <title>{`${t(item.label)}: ${item.value} (${percentage.toFixed(1)}%)`}</title>
              </circle>
            );
            acc.offset -= percentage;
            return acc;
          }, { elements: [], offset: 25 }).elements}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {hoverIdx === null ? (
            <>
              <span className="text-2xl font-bold">{total}</span>
              <span className="text-xs text-gray-500">{t('Tổng')}</span>
            </>
          ) : (
            <>
              <span className="text-2xl font-bold" style={{ color: COLORS[hoverIdx % COLORS.length] }}>
                {total > 0 ? ((rows[hoverIdx].value / total) * 100).toFixed(1) : 0}%
              </span>
              <span className="text-xs text-gray-500">{rows[hoverIdx].value} {t('đơn')}</span>
            </>
          )}
        </div>
      </div>

      {/* Chú giải */}
      <div className="flex-1 space-y-2">
        {rows.map((item, idx) => {
          const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
          const isHover = hoverIdx === idx;

          return (
            <div
              key={idx}
              className={`flex items-center gap-3 rounded-lg px-2 py-1 transition-colors cursor-pointer ${
                isHover ? 'bg-[#f6f6f4]' : ''
              }`}
              onMouseEnter={() => setHoverIdx(idx)}
              onMouseLeave={() => setHoverIdx(null)}
            >
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: COLORS[idx % COLORS.length] }}
              />
              <span className={`text-sm flex-1 truncate ${isHover ? 'font-semibold text-[#1d1d1f]' : ''}`}>{t(item.label)}</span>
              <span className="text-sm font-medium">{percentage}%</span>
              <span className="text-xs text-gray-500 w-10 text-right">{item.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

