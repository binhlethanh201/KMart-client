export default function LineChart({ data, isDark = false }) {
  if (!data || data.length === 0) {
    return <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Không có dữ liệu xu hướng</div>;
  }

  const chartData = data.slice(0, 6).reverse();
  const maxValue = Math.max(...chartData.map(d => d.approved || 0), 1);

  const barColor = isDark ? '#f6f6f4' : '#1d1d1f';
  const textColor = isDark ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className="flex flex-col h-full justify-end pb-4">
      <div className="flex items-end gap-4 h-full min-h-[200px]">
        {chartData.map((item, idx) => {
          const approved = item.approved || 0;
          const height = (approved / maxValue) * 100;

          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-4 h-full justify-end group">
              <div className="w-full flex items-end justify-center h-full relative">
                {/* Tooltip */}
                <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs py-1 px-2 rounded font-bold pointer-events-none z-10 whitespace-nowrap">
                  {approved} đơn
                </div>

                <div
                  className="w-full max-w-[48px] rounded-t-lg transition-all duration-500"
                  style={{
                    height: `${Math.max(height, 5)}%`,
                    backgroundColor: barColor,
                    opacity: isDark ? 0.9 : 1
                  }}
                />
              </div>
              <span className={`text-xs font-bold uppercase tracking-wider ${textColor}`}>
                {item.monthName}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
