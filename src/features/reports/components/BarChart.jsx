export default function BarChart({ data, maxBars = 10 }) {
  if (!data || data.length === 0) {
    return <div className="text-center text-gray-500 py-8">Không có dữ liệu</div>;
  }

  const maxValue = Math.max(...data.map(d => d.value || 0), 1);
  const displayData = data.slice(0, maxBars);

  return (
    <div className="space-y-3">
      {displayData.map((item, idx) => {
        const percentage = (item.value / maxValue) * 100;

        return (
          <div key={idx} className="flex items-center gap-3">
            <div className="w-40 text-sm truncate text-gray-700" title={item.name}>
              {item.name}
            </div>
            <div className="flex-1 h-7 bg-gray-100 rounded overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded transition-all duration-500 flex items-center justify-end pr-2"
                style={{ width: `${percentage}%` }}
              >
                {percentage > 15 && (
                  <span className="text-xs text-white font-medium">{item.value}</span>
                )}
              </div>
            </div>
            {percentage <= 15 && (
              <div className="w-12 text-sm text-right font-medium text-gray-700">
                {item.value}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
