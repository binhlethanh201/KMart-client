export default function LineChart({ data }) {
  if (!data || data.length === 0) {
    return <div className="text-center text-gray-500 py-8">Không có dữ liệu xu hướng</div>;
  }

  const chartData = data.slice(0, 6).reverse();
  const maxValue = Math.max(...chartData.map(d => d.totalApplications || 0), 1);

  return (
    <div>
      {/* Bar chart cho xu hướng */}
      <div className="flex items-end gap-4 h-48 mb-4">
        {chartData.map((item, idx) => {
          const total = item.totalApplications || 0;
          const approved = item.approved || 0;
          const totalHeight = (total / maxValue) * 100;

          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex items-end justify-center flex-1">
                <div
                  className="w-full max-w-16 rounded-t transition-all duration-500"
                  style={{
                    height: `${totalHeight}%`,
                    background: total > 0
                      ? `linear-gradient(to top, #10B981 ${(approved/total)*100}%, #E5E7EB ${(approved/total)*100}%)`
                      : '#E5E7EB'
                  }}
                  title={`${item.monthName}: ${total} đơn (Duyệt: ${approved})`}
                />
              </div>
              <span className="text-xs text-gray-500 truncate">{item.monthName}</span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 pt-4 border-t">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded" />
          <span className="text-sm">Đã duyệt</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-300 rounded" />
          <span className="text-sm">Tổng đơn</span>
        </div>
      </div>
    </div>
  );
}
