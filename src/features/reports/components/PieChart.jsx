export default function PieChart({ data }) {
  if (!data || data.length === 0) {
    return <div className="text-center text-gray-500 py-8">Không có dữ liệu</div>;
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];
  const total = data.reduce((sum, item) => sum + (item.count || 0), 0);

  return (
    <div className="flex items-center gap-8">
      {/* Donut */}
      <div className="relative w-40 h-40 flex-shrink-0">
        <svg viewBox="0 0 100 100" className="transform -rotate-90">
          {data.reduce((acc, item, idx) => {
            const count = item.count || 0;
            const percentage = total > 0 ? (count / total) * 100 : 0;
            acc.elements.push(
              <circle
                key={idx}
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke={COLORS[idx % COLORS.length]}
                strokeWidth="14"
                strokeDasharray={`${percentage} ${100 - percentage}`}
                strokeDashoffset={acc.offset}
              />
            );
            acc.offset -= percentage;
            return acc;
          }, { elements: [], offset: 25 }).elements}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{total}</span>
          <span className="text-xs text-gray-500">Tổng</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex-1 space-y-2">
        {data.map((item, idx) => {
          const count = item.count || 0;
          const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
          const name = item.documentType || 'Unknown';

          return (
            <div key={idx} className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: COLORS[idx % COLORS.length] }}
              />
              <span className="text-sm flex-1 truncate">{name}</span>
              <span className="text-sm font-medium">{percentage}%</span>
              <span className="text-xs text-gray-500 w-10 text-right">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
