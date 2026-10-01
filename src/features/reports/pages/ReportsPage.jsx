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
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Báo Cáo & Thống Kê</h1>
          <p className="text-sm text-gray-500 mt-1">
            Số liệu thống kê cho từng hạng mục đơn theo phòng ban
          </p>
        </div>
        <button
          onClick={() => setExportModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
        >
          <span className="material-symbols-outlined">download</span>
          Xuất Excel
        </button>
      </div>

      {/* Bộ lọc */}
      <FilterBar
        filters={filters}
        departments={departments}
        documentTypes={documentTypes}
        onChange={handleFilterChange}
      />

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-24 bg-white rounded-lg shadow animate-pulse" />
          ))}
        </div>
      ) : stats && (
        <div className="grid grid-cols-4 gap-4">
          <StatCard title="Tổng Đơn" value={stats.totalApplications} icon="description" color="blue" />
          <StatCard title="Đang Chờ Duyệt" value={stats.pendingApplications} icon="pending_actions" color="yellow" />
          <StatCard title="Đã Duyệt" value={stats.approvedApplications} icon="check_circle" color="green" />
          <StatCard title="Từ Chối" value={stats.rejectedApplications} icon="cancel" color="red" />
        </div>
      )}

      {/* Biểu đồ hàng 1 */}
      <div className="grid grid-cols-2 gap-6">
        {/* Theo loại đơn - Pie Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-lg mb-4">Thống kê theo loại đơn</h3>
          <PieChart data={stats?.byType || []} />
        </div>

        {/* Theo trạng thái - Bar Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-lg mb-4">Phân bố trạng thái</h3>
          <BarChart
            data={(stats?.byStatus || []).map(s => ({
              name: translateStatus(s.status),
              value: s.count,
            }))}
          />
        </div>
      </div>

      {/* Theo phòng ban */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold text-lg mb-4">Thống kê theo phòng ban</h3>
        <BarChart
          data={(stats?.byDepartment || []).map(d => ({
            name: d.departmentName,
            value: d.totalApplications,
          }))}
        />
      </div>

      {/* Xu hướng theo tháng */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold text-lg mb-4">Xu hướng xử lý đơn theo tháng</h3>
        <LineChart data={stats?.approvalTimeStats?.monthlyTrend || []} />
      </div>

      {/* Bảng chi tiết phòng ban */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold text-lg mb-4">Chi tiết theo phòng ban</h3>
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left text-sm text-gray-500 py-2">Phòng ban</th>
              <th className="text-right text-sm text-gray-500 py-2">Tổng</th>
              <th className="text-right text-sm text-gray-500 py-2">Chờ duyệt</th>
              <th className="text-right text-sm text-gray-500 py-2">Đã duyệt</th>
              <th className="text-right text-sm text-gray-500 py-2">Từ chối</th>
              <th className="text-right text-sm text-gray-500 py-2">TG TB (h)</th>
            </tr>
          </thead>
          <tbody>
            {(stats?.byDepartment || []).map(d => (
              <tr key={d.departmentId} className="border-b hover:bg-gray-50">
                <td className="py-3 font-medium">{d.departmentName}</td>
                <td className="text-right">{d.totalApplications}</td>
                <td className="text-right text-yellow-600">{d.pending}</td>
                <td className="text-right text-green-600">{d.approved}</td>
                <td className="text-right text-red-600">{d.rejected}</td>
                <td className="text-right">{d.averageApprovalTimeHours?.toFixed(1) || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
