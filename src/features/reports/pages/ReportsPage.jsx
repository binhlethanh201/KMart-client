import { useState, useEffect } from 'react';
import { reportService } from '../services/reportService';
import { departmentService } from '../../departments/services/departmentService';
import { documentTypeService } from '../../../services/documentTypeService';
import StatCard from '../components/StatCard';
import FilterBar from '../components/FilterBar';
import BarChart from '../components/BarChart';
import PieChart from '../components/PieChart';
import LineChart from '../components/LineChart';
import ExportModal from '../components/ExportModal';

export default function ReportsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    departmentId: null,
    documentTypeId: null,
    status: '',
  });
  const [departments, setDepartments] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  useEffect(() => {
    departmentService.getAll().then(setDepartments).catch(console.error);
    documentTypeService.getAll().then(setDocumentTypes).catch(console.error);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const response = await reportService.getDashboardStats(filters);
        setStats(response.data);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [filters]);

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return (
    <div className="py-16 px-8 md:px-16 lg:px-24 space-y-12 h-full overflow-y-auto bg-[#f6f6f4] font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#d94a38] mb-4">
            Báo cáo & Thống kê
          </p>
          <h1 className="text-4xl md:text-5xl font-black text-[#1d1d1f] tracking-tight max-w-2xl leading-tight">
            Hiệu suất xử lý đơn từ.
            <br />
            Hiểu rõ qua từng con số.
          </h1>
        </div>
        <button
          onClick={() => setExportModalOpen(true)}
          className="flex items-center gap-2 px-8 py-4 bg-[#1d1d1f] text-white rounded-full hover:bg-black transition-colors font-semibold tracking-wide w-fit"
        >
          Xuất Báo Cáo
        </button>
      </div>

      {/* Bộ lọc */}
      <div className="bg-white rounded-[24px] p-2 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <FilterBar
          filters={filters}
          departments={departments}
          documentTypes={documentTypes}
          onChange={handleFilterChange}
        />
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-2 gap-8">
          {[1, 2].map(i => (
            <div key={i} className="h-40 bg-white rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] animate-pulse" />
          ))}
        </div>
      ) : stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <StatCard title="Tổng Đơn Đã Duyệt" value={stats.approvedApplications} icon="verified" color="green" />
          <StatCard
            title="Thời Gian Duyệt TB (Giờ)"
            value={stats.averageApprovalTimeHours?.toFixed(1) || '0'}
            icon="schedule"
            color="blue"
          />
        </div>
      )}

      {/* Biểu đồ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Theo loại đơn - Bar Chart */}
        <div className="bg-white rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-8 flex flex-col h-[450px]">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#d94a38] mb-8">
            Thống kê theo loại đơn
          </h3>
          <div className="flex-1 min-h-0 overflow-y-auto pr-4 custom-scrollbar">
            <BarChart
              data={(stats?.byType || []).map(t => ({
                name: t.documentType || 'Không rõ',
                value: t.count || 0
              }))}
            />
          </div>
        </div>

        {/* Xu hướng theo tháng */}
        <div className="bg-[#1d1d1f] rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-8 h-[450px] flex flex-col">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#f6f6f4] mb-8 opacity-70">
            Xu hướng duyệt đơn theo tháng
          </h3>
          <div className="flex-1 min-h-0">
            <LineChart data={stats?.approvalTimeStats?.monthlyTrend || []} isDark />
          </div>
        </div>
      </div>

      {/* Bảng chi tiết phòng ban dạng Cards */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-[#d94a38] mb-6 ml-2">
          Chi tiết theo phòng ban
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {(stats?.byDepartment || []).map((d, index) => {
            const maxApproved = Math.max(...(stats?.byDepartment || []).map(x => x.approved), 1);
            const volumePercent = (d.approved / maxApproved) * 100;

            return (
              <div key={d.departmentId || index} className="bg-white rounded-[24px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col gap-6 hover:-translate-y-1 transition-transform">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#f6f6f4] text-[#1d1d1f] flex items-center justify-center text-lg font-bold">
                    {d.departmentName?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-[#1d1d1f] text-lg leading-tight">{d.departmentName}</h4>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-[#f6f6f4] rounded-2xl p-4">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Đã duyệt</p>
                    <p className="text-2xl font-black text-[#1d1d1f]">{d.approved}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Thời gian TB</p>
                    <p className="text-xl font-bold text-[#1d1d1f] mt-1">{d.averageApprovalTimeHours?.toFixed(1) || '-'}h</p>
                  </div>
                </div>

                <div className="h-2 bg-[#f6f6f4] rounded-full overflow-hidden w-full">
                  <div className="h-full bg-[#d94a38] rounded-full" style={{ width: `${volumePercent}%` }} />
                </div>
              </div>
            );
          })}
          {(!stats?.byDepartment || stats.byDepartment.length === 0) && (
            <div className="col-span-full py-12 text-center text-gray-500 font-medium bg-white rounded-[24px]">
              Không có dữ liệu phòng ban
            </div>
          )}
        </div>
      </div>

      {/* Modal xuất Excel */}
      <ExportModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        documentTypes={documentTypes}
        filters={filters}
      />
    </div>
  );
}

function translateStatus(status) {
  const map = {
    PendingApproval: 'Chờ duyệt',
    Approved: 'Đã duyệt',
    Rejected: 'Từ chối',
    Draft: 'Nháp',
    Submitted: 'Đã gửi',
    NeedsSupplement: 'Cần bổ sung',
    Canceled: 'Đã hủy',
  };
  return map[status] || status;
}
