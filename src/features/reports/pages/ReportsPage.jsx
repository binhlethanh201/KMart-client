import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportService } from '../services/reportService';
import { departmentService } from '../../departments/services/departmentService';
import { documentTypeService } from '../../../services/documentTypeService';
import { positionService } from '../../hr/services/positionService';
import useDocumentTitle from '../../../hooks/useDocumentTitle';
import StatCard from '../components/StatCard';
import FilterBar from '../components/FilterBar';
import BarChart from '../components/BarChart';
import PieChart from '../components/PieChart';
import TrendLineChart from '../components/TrendLineChart';
import ExportModal from '../components/ExportModal';
import { useI18n } from '../../../i18n/I18nProvider';

const STATUS_LABELS = {
  Approved: 'Đã duyệt',
};

const DRILL_PAGE_SIZE = 10;

export default function ReportsPage() {
  const { t } = useI18n();
  useDocumentTitle(t('Báo cáo & Thống kê'));
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [overview, setOverview] = useState(null);
  const [trend, setTrend] = useState([]);
  const [managers, setManagers] = useState([]);
  const [byPosition, setByPosition] = useState([]);
  const [drill, setDrill] = useState({ items: [], totalCount: 0 });
  const [drillPage, setDrillPage] = useState(1);
  const [drillLoading, setDrillLoading] = useState(false);

  const [filters, setFilters] = useState({
    from: '',
    to: '',
    block: null,
    departmentId: null,
    documentTypeId: null,
    positionId: null,
    status: null,
  });

  const [departments, setDepartments] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [positions, setPositions] = useState([]);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [trendMode, setTrendMode] = useState('total'); // 'total' | 'type'
  const [rosterMode, setRosterMode] = useState('managers'); // 'managers' | 'all'

  useEffect(() => {
    departmentService.getAll().then(setDepartments).catch(console.error);
    documentTypeService.getAll().then(setDocumentTypes).catch(console.error);
    positionService.getAll().then(setPositions).catch(console.error);
  }, []);

  const query = useMemo(() => ({
    from: filters.from || undefined,
    to: filters.to || undefined,
    departmentId: filters.departmentId || undefined,
    documentTypeId: filters.documentTypeId || undefined,
    positionId: filters.positionId || undefined,
    status: filters.status || undefined,
  }), [filters]);

  // KPI + xu hướng + bảng quản lý + so sánh chức vụ
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      reportService.getOverview(query).then((r) => r.data).catch(() => null),
      reportService.getDashboardStats(query).then((r) => r.data).catch(() => null),
      reportService.getTrend(query, 12).then((r) => r.data?.points || r.data || []).catch(() => []),
      reportService.getManagers(query, rosterMode).then((r) => r.data || []).catch(() => []),
      reportService.getByPosition(query).then((r) => r.data || []).catch(() => []),
    ])
      .then(([overviewData, statsData, trendData, managerData, positionData]) => {
        if (cancelled) return;
        setOverview(overviewData);
        setStats(statsData);
        setTrend(Array.isArray(trendData) ? trendData : []);
        setManagers(Array.isArray(managerData) ? managerData : []);
        setByPosition(Array.isArray(positionData) ? positionData : []);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [query, rosterMode]);

  // Danh sách đơn chi tiết — "soi kĩ từng đơn"
  const loadDrill = useCallback((page) => {
    setDrillLoading(true);
    reportService.getApplications(query, page, DRILL_PAGE_SIZE)
      .then((r) => {
        const data = r.data || {};
        setDrill({
          items: data.items || data.Items || [],
          totalCount: data.totalCount ?? data.TotalCount ?? 0,
        });
        setDrillPage(page);
      })
      .catch(() => setDrill({ items: [], totalCount: 0 }))
      .finally(() => setDrillLoading(false));
  }, [query]);

  useEffect(() => { loadDrill(1); }, [loadDrill]);

  const handleFilterChange = (newFilters) => setFilters((prev) => ({ ...prev, ...newFilters }));

  const trendLabels = trend.map((p) => p.label || `T${p.month}/${p.year}`);
  const trendChange = trend.map((p) => p.totalChangePercent ?? 0);

  // BE-53: hai chế độ xem — tổng hợp, hoặc TÁCH THEO TỪNG LOẠI ĐƠN để thấy tháng đó
  // loại đơn nào được duyệt nhiều nhất.
  const TREND_TYPE_COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

  const trendTypeNames = useMemo(() => {
    const counts = new Map();
    trend.forEach((p) => (p.byType || []).forEach((tp) => {
      counts.set(tp.documentType, (counts.get(tp.documentType) || 0) + (tp.count || 0));
    }));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name);
  }, [trend]);

  const trendSeries = useMemo(() => {
    if (trendMode === 'type' && trendTypeNames.length > 0) {
      return trendTypeNames.map((name, i) => ({
        key: `type-${i}`,
        label: name,
        color: TREND_TYPE_COLORS[i % TREND_TYPE_COLORS.length],
        values: trend.map((p) => {
          const found = (p.byType || []).find((tp) => tp.documentType === name);
          return found?.count || 0;
        }),
      }));
    }
    return [
      {
        key: 'approved',
        label: t('Đơn đã duyệt'),
        color: '#10b981',
        values: trend.map((p) => p.approved || p.total || 0),
      },
    ];
  }, [trend, trendMode, trendTypeNames, t]);

  // Hộp thông tin khi chỉ vào một tháng: ở chế độ "theo loại đơn" liệt kê từng loại đơn
  // (nhiều nhất trước) để biết ngay tháng đó loại nào được duyệt nhiều.
  const trendTooltips = useMemo(
    () => trend.map((p, i) => {
      const rows = {};
      const sorted = [...(p.byType || [])].sort((a, b) => (b.count || 0) - (a.count || 0));
      if (trendMode === 'type' && sorted.length) {
        sorted.forEach((tp) => { rows[tp.documentType] = `${tp.count} · ${(tp.percentage ?? 0).toFixed(0)}%`; });
        rows[t('Tổng tháng')] = p.total || 0;
      } else {
        rows[t('Tháng trước')] = trend[i - 1]?.total ?? 0;
      }
      return rows;
    }),
    [trend, trendMode, t]
  );

  // Ở chế độ tổng hợp: thêm dòng "nhiều nhất tháng này: <loại đơn>"
  const topTypeOfMonth = trend.slice(-1)[0]?.byType?.[0];

  // BE-52: báo cáo chỉ quan tâm ĐƠN ĐÃ DUYỆT.
  const total = overview?.total ?? stats?.approvedApplications ?? 0;
  const byDepartment = (overview?.byDepartment?.length ? overview.byDepartment : (stats?.byDepartment || []));
  const byType = (overview?.byType?.length ? overview.byType : (stats?.byType || []));
  const maxDeptTotal = Math.max(...byDepartment.map((x) => x.totalApplications ?? x.approved ?? 0), 1);
  const topDeptShare = total > 0 && byDepartment.length
    ? ((byDepartment[0].totalApplications ?? byDepartment[0].approved ?? 0) / total) * 100
    : 0;
  const topTypeShare = total > 0 && byType.length
    ? ((byType[0].count ?? 0) / total) * 100
    : 0;
  const lastMonth = trend.slice(-1)[0];
  const hasTrend = trend.length > 1;

  const visibleDrill = drill.items || [];
  const totalDrillPages = Math.max(1, Math.ceil((drill.totalCount || 0) / DRILL_PAGE_SIZE));

  return (
    <div className="py-10 px-6 md:px-10 lg:px-16 space-y-8 h-full overflow-y-auto bg-[#f6f6f4] font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#d94a38] mb-3">
            {t('Báo cáo & Thống kê')}
          </p>
          <h1 className="text-3xl md:text-4xl font-black text-[#1d1d1f] tracking-tight max-w-2xl leading-tight">
            {t('Đơn đã được duyệt, nhìn từ mọi góc độ.')}
          </h1>
        </div>
        <button
          onClick={() => setExportModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3.5 bg-[#1d1d1f] text-white rounded-full hover:bg-black transition-colors font-semibold tracking-wide w-fit cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">download</span>
          {t('Xuất Báo Cáo')}
        </button>
      </div>

      {/* Bộ lọc */}
      <div className="bg-white rounded-[24px] p-2 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <FilterBar
          filters={filters}
          departments={departments}
          documentTypes={documentTypes}
          positions={positions}
          onChange={handleFilterChange}
        />
      </div>

      {/* Số liệu tổng quan */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-36 bg-white rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard title={t('Tổng đơn đã duyệt')} value={total} icon="verified" accent="green" />
          <StatCard
            title={t('Phòng ban nhiều nhất')}
            value={byDepartment[0]?.departmentName || '—'}
            icon="apartment"
            sub={byDepartment[0] ? `${byDepartment[0].totalApplications ?? 0} ${t('đơn')} · ${topDeptShare.toFixed(0)}%` : null}
          />
          <StatCard
            title={t('Loại đơn nhiều nhất')}
            value={byType[0]?.documentType || '—'}
            icon="description"
            sub={byType[0] ? `${byType[0].count ?? 0} ${t('đơn')} · ${topTypeShare.toFixed(0)}%` : null}
          />
          <StatCard
            title={t('Đã duyệt tháng này')}
            value={lastMonth?.total ?? 0}
            icon="event_available"
            accent="indigo"
            sub={hasTrend ? `${t('Tháng trước')}: ${trend.slice(-2)[0]?.total ?? 0}` : null}
          />
          <StatCard
            title={t('Tăng/giảm so với tháng trước')}
            value={`${(lastMonth?.totalChangePercent ?? 0) >= 0 ? '+' : ''}${(lastMonth?.totalChangePercent ?? 0).toFixed(0)}%`}
            icon={(lastMonth?.totalChangePercent ?? 0) >= 0 ? 'trending_up' : 'trending_down'}
            accent={(lastMonth?.totalChangePercent ?? 0) >= 0 ? 'green' : 'red'}
          />
          <StatCard
            title={t('Số phòng ban có đơn')}
            value={byDepartment.length}
            icon="corporate_fare"
            accent="sky"
            sub={t('{v0} loại đơn', { v0: byType.length })}
          />
        </div>
      )}

      {/* Phân bổ theo loại đơn & phòng ban — đặt TRƯỚC xu hướng để nhìn tổng quan trước */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-6 md:p-8 flex flex-col h-[420px]">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#d94a38] mb-6">
            {t('Đơn đã duyệt theo loại đơn')}
          </h3>
          <div className="flex-1 min-h-0 overflow-y-auto pr-4 custom-scrollbar">
            <BarChart
              data={byType.map((tp) => ({
                name: tp.documentType || t('Không rõ'),
                value: tp.count || 0,
              }))}
            />
          </div>
        </div>

        <div className="bg-white rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-6 md:p-8 flex flex-col h-[420px]">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#d94a38] mb-6">
            {t('Đơn đã duyệt theo phòng ban')}
          </h3>
          <div className="flex-1 min-h-0">
            <PieChart
              data={byDepartment.map((d) => ({
                name: d.departmentName || t('Chưa phân bổ'),
                value: d.totalApplications ?? d.approved ?? 0,
              }))}
            />
          </div>
        </div>
      </div>

      {/* Xu hướng theo tháng — tổng hợp hoặc tách theo từng loại đơn */}
      <div className="bg-white rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#d94a38]">
            {t('Xu hướng đơn ĐÃ DUYỆT theo tháng (12 tháng)')}
          </h3>

          <div className="flex items-center gap-3 flex-wrap">
            {/* BE-53: chuyển chế độ xem */}
            <div className="flex p-0.5 bg-[#f6f6f4] border border-[#eeece7] rounded-lg">
              <button
                type="button"
                onClick={() => setTrendMode('total')}
                className={`text-[11px] px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                  trendMode === 'total' ? 'bg-white text-[#1d1d1f] shadow-sm' : 'text-gray-500 hover:text-[#1d1d1f]'
                }`}
              >
                {t('Tổng hợp')}
              </button>
              <button
                type="button"
                onClick={() => setTrendMode('type')}
                className={`text-[11px] px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                  trendMode === 'type' ? 'bg-white text-[#1d1d1f] shadow-sm' : 'text-gray-500 hover:text-[#1d1d1f]'
                }`}
              >
                {t('Theo loại đơn')}
              </button>
            </div>

            {hasTrend && (
              <div className="flex items-center gap-4 text-[11px]">
                <span className="text-gray-500">
                  {t('Tháng này')}: <strong className="text-[#1d1d1f]">{lastMonth?.total ?? 0}</strong> {t('đơn đã duyệt')}
                </span>
                <span className={`font-bold ${(lastMonth?.totalChangePercent ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {(lastMonth?.totalChangePercent ?? 0) >= 0 ? '▲' : '▼'}{' '}
                  {Math.abs(lastMonth?.totalChangePercent ?? 0).toFixed(0)}%
                  <span className="text-gray-400 font-normal"> {t('so với tháng trước')}</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Kết luận nhanh: loại đơn được duyệt nhiều nhất trong tháng đang xem */}
        {topTypeOfMonth && (
          <p className="text-[11px] text-gray-500 mb-4">
            {t('Tháng này duyệt nhiều nhất:')}{' '}
            <strong className="text-[#1d1d1f]">{topTypeOfMonth.documentType}</strong>{' '}
            <span className="text-emerald-600 font-semibold">
              {topTypeOfMonth.count} {t('đơn')} · {(topTypeOfMonth.percentage ?? 0).toFixed(0)}%
            </span>
          </p>
        )}

        <TrendLineChart
          labels={trendLabels}
          series={trendSeries}
          changePercents={trendMode === 'total' ? trendChange : null}
          tooltips={trendTooltips}
          height={280}
        />
      </div>

      {/* Bảng điều hành — Quản lý cấp cao */}
      <div className="bg-[#1d1d1f] rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-6 md:p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#f6f6f4] opacity-80">
              {t('Bảng điều hành — Đơn được duyệt theo nhân sự')}
            </h3>
            <p className="text-[11px] text-gray-400 mt-1">
              {rosterMode === 'all'
                ? t('Số đơn CỦA mỗi nhân sự đã được người khác duyệt trong kỳ, tách riêng đơn nghỉ (căn cứ tính lương). Bấm vào một dòng để lọc theo phòng ban.')
                : t('Số đơn CỦA mỗi quản lý đã được người khác duyệt trong kỳ, tách riêng đơn nghỉ (căn cứ tính lương). Bấm vào một dòng để lọc theo phòng ban.')}
            </p>
          </div>
          <span className="material-symbols-outlined text-white/40 text-[28px]">supervisor_account</span>
        </div>

        {/* BE-54: chuyển giữa xem quản lý và xem tất cả nhân sự (phục vụ tính lương) */}
        <div className="flex p-0.5 bg-white/5 border border-white/10 rounded-lg w-fit mb-6">
          <button
            type="button"
            onClick={() => setRosterMode('managers')}
            className={`text-[11px] px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
              rosterMode === 'managers' ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {t('Quản lý')}
          </button>
          <button
            type="button"
            onClick={() => setRosterMode('all')}
            className={`text-[11px] px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
              rosterMode === 'all' ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {t('Tất cả nhân sự')}
          </button>
        </div>

        {managers.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">{t('Chưa có dữ liệu nhân sự')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[820px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-gray-400 border-b border-white/10">
                  <th className="py-3 pr-4 font-bold">{t('Nhân sự')}</th>
                  <th className="py-3 pr-4 font-bold">{t('Phòng công tác chính')}</th>
                  <th className="py-3 pr-4 font-bold">{t('Chức vụ')}</th>
                  <th className="py-3 pr-4 font-bold text-right">{t('Đơn được duyệt')}</th>
                  <th className="py-3 pr-4 font-bold text-right">{t('Trong đó đơn nghỉ')}</th>
                  <th className="py-3 pr-4 font-bold">{t('Tỷ trọng')}</th>
                  <th className="py-3 font-bold text-right">{t('Lần được duyệt gần nhất')}</th>
                </tr>
              </thead>
              <tbody>
                {managers.map((m) => {
                  const maxApproved = Math.max(...managers.map((x) => x.approvedCount || 0), 1);
                  const share = total > 0 ? ((m.approvedCount || 0) / total) * 100 : 0;
                  return (
                    <tr
                      key={m.userId}
                      onClick={() => handleFilterChange({ departmentId: m.departmentId || null })}
                      className={`border-b border-white/5 hover:bg-white/5 transition-colors ${m.departmentId ? 'cursor-pointer' : ''}`}
                      title={m.departmentId ? t('Lọc báo cáo theo phòng ban của người này') : undefined}
                    >
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                            {(m.fullName || '?').trim().split(' ').slice(-1)[0].charAt(0)}
                          </div>
                          <p className="text-[13px] font-semibold text-white truncate">{m.fullName}</p>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-[12px] text-gray-300">{m.departmentName || '—'}</span>
                      </td>
                      <td className="py-3 pr-4 text-[12px] text-gray-300">{m.positionName || '—'}</td>
                      <td className="py-3 pr-4 text-right text-[15px] font-bold text-emerald-400">
                        {m.approvedCount}
                      </td>
                      <td className="py-3 pr-4 text-right">
                        <span
                          className={`text-[13px] font-bold ${m.leaveApprovedCount > 0 ? 'text-amber-300' : 'text-gray-500'}`}
                          title={t('Số đơn nghỉ phép / làm việc tại nhà đã được duyệt — căn cứ tính lương')}
                        >
                          {m.leaveApprovedCount}
                        </span>
                      </td>
                      <td className="py-3 pr-4 w-[170px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-400 rounded-full"
                              style={{ width: `${((m.approvedCount || 0) / maxApproved) * 100}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-gray-400 w-10 text-right">{share.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="py-3 text-right text-[12px] text-gray-300">
                        {m.lastActionAt ? new Date(m.lastActionAt).toLocaleDateString('vi-VN') : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* So sánh theo phòng ban & chức vụ */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-6 md:p-8">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#d94a38] mb-6">
            {t('So sánh theo phòng ban')}
          </h3>
          <div className="space-y-4 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
            {byDepartment.map((d, index) => {
              const value = d.totalApplications ?? d.approved ?? 0;
              const volumePercent = (value / maxDeptTotal) * 100;
              const share = total > 0 ? (value / total) * 100 : 0;
              return (
                <div key={d.departmentId || index} className="border border-[#eeece7] rounded-2xl p-4 hover:border-[#d94a38]/40 transition-colors">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <button
                      onClick={() => handleFilterChange({ departmentId: d.departmentId })}
                      className="font-bold text-[#1d1d1f] text-[15px] hover:text-[#d94a38] transition-colors text-left cursor-pointer"
                      title={t('Lọc báo cáo theo phòng ban này')}
                    >
                      {d.departmentName}
                    </button>
                    <span
                      className="text-[11px] font-bold text-[#d94a38] bg-[#fdf2f0] px-2 py-1 rounded-full cursor-help"
                      title={t('Tỷ lệ đơn đã duyệt của phòng ban trên tổng đơn đã duyệt')}
                    >
                      {share.toFixed(0)}% {t('tổng đơn')}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center mb-3">
                    <div>
                      <p className="text-[9px] uppercase font-bold text-gray-400">{t('Đơn đã duyệt')}</p>
                      <p className="text-2xl font-black text-emerald-600">{value}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase font-bold text-gray-400">{t('Tỷ lệ trong tổng')}</p>
                      <p className="text-2xl font-black text-[#1d1d1f]">{share.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="h-1.5 bg-[#f6f6f4] rounded-full overflow-hidden w-full">
                    <div className="h-full bg-[#d94a38] rounded-full" style={{ width: `${volumePercent}%` }} />
                  </div>
                </div>
              );
            })}
            {byDepartment.length === 0 && (
              <div className="py-10 text-center text-gray-500 font-medium">{t('Không có dữ liệu phòng ban')}</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-6 md:p-8">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#d94a38] mb-6">
            {t('So sánh theo chức vụ')}
          </h3>
          <div className="space-y-4 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
            {byPosition.map((p, index) => {
              const share = total > 0 ? ((p.total ?? 0) / total) * 100 : 0;
              return (
                <div key={p.positionId || index} className="border border-[#eeece7] rounded-2xl p-4 hover:border-[#d94a38]/40 transition-colors">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <button
                      onClick={() => handleFilterChange({ positionId: p.positionId })}
                      className="font-bold text-[#1d1d1f] text-[15px] hover:text-[#d94a38] transition-colors text-left cursor-pointer"
                      title={t('Lọc báo cáo theo chức vụ này')}
                    >
                      {p.positionName}
                    </button>
                    <span
                      className="text-[11px] font-bold text-[#d94a38] bg-[#fdf2f0] px-2 py-1 rounded-full cursor-help"
                      title={t('Tỷ lệ đơn đã duyệt của chức vụ này trên tổng đơn đã duyệt')}
                    >
                      {share.toFixed(0)}% {t('tổng đơn')}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div>
                      <p className="text-[9px] uppercase font-bold text-gray-400">{t('Đơn đã duyệt')}</p>
                      <p className="text-2xl font-black text-emerald-600">{p.total ?? 0}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase font-bold text-gray-400">{t('Tỷ lệ trong tổng')}</p>
                      <p className="text-2xl font-black text-[#1d1d1f]">{share.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              );
            })}
            {byPosition.length === 0 && (
              <div className="py-10 text-center text-gray-500 font-medium">{t('Không có dữ liệu chức vụ')}</div>
            )}
          </div>
        </div>
      </div>

      {/* Soi kĩ từng đơn */}
      <div className="bg-white rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-6 md:p-8">
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#d94a38]">
            {t('Soi kĩ từng đơn')}
          </h3>
          <p className="text-[11px] text-gray-500 mt-1">
            {t('Bấm vào một dòng để mở chi tiết đơn.')} · {drill.totalCount} {t('đơn')}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-gray-400 border-b border-[#eeece7]">
                <th className="py-3 pr-4 font-bold">{t('Mã đơn')}</th>
                <th className="py-3 pr-4 font-bold">{t('Loại đơn')}</th>
                <th className="py-3 pr-4 font-bold">{t('Người tạo')}</th>
                <th className="py-3 pr-4 font-bold">{t('Phòng ban')}</th>
                <th className="py-3 pr-4 font-bold">{t('Chức vụ')}</th>
                <th className="py-3 pr-4 font-bold">{t('Bước')}</th>
                <th className="py-3 pr-4 font-bold">{t('Trạng thái')}</th>
                <th className="py-3 pr-4 font-bold text-right">{t('Xử lý (giờ)')}</th>
              </tr>
            </thead>
            <tbody>
              {drillLoading && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400 text-sm">{t('Đang tải...')}</td>
                </tr>
              )}
              {!drillLoading && visibleDrill.map((a) => (
                <tr
                  key={a.id}
                  onClick={() => navigate(`/requests/${a.id}`)}
                  className="border-b border-[#f4f2ee] hover:bg-[#faf9f7] cursor-pointer transition-colors"
                >
                  <td className="py-3 pr-4 text-[12px] font-mono font-semibold text-[#1d1d1f]">
                    {(a.code || a.id || '').toString().substring(0, 8).toUpperCase()}
                  </td>
                  <td className="py-3 pr-4 text-[12px] text-[#1d1d1f]">{a.documentTypeName || '—'}</td>
                  <td className="py-3 pr-4 text-[12px] text-gray-600">{a.applicantName || '—'}</td>
                  <td className="py-3 pr-4 text-[12px] text-gray-600">{a.departmentName || '—'}</td>
                  <td className="py-3 pr-4 text-[12px] text-gray-600">{a.positionName || '—'}</td>
                  <td className="py-3 pr-4 text-[12px] text-gray-600">
                    {a.totalSteps ? `${a.currentStepOrder || 0}/${a.totalSteps}` : '—'}
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                      {t(STATUS_LABELS[a.status] || a.status || '—')}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right text-[12px] text-gray-600">
                    {a.durationHours != null ? a.durationHours.toFixed(1) : '—'}
                  </td>
                </tr>
              ))}
              {!drillLoading && visibleDrill.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-gray-500 text-sm">
                    {t('Không có đơn nào phù hợp bộ lọc')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalDrillPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              disabled={drillPage <= 1}
              onClick={() => loadDrill(drillPage - 1)}
              className="px-3 py-1.5 rounded-md border border-[#D9D5CC] text-[12px] font-semibold disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              ‹ {t('Trước')}
            </button>
            <span className="text-[12px] text-gray-500">
              {t('Trang')} {drillPage} / {totalDrillPages}
            </span>
            <button
              disabled={drillPage >= totalDrillPages}
              onClick={() => loadDrill(drillPage + 1)}
              className="px-3 py-1.5 rounded-md border border-[#D9D5CC] text-[12px] font-semibold disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              {t('Sau')} ›
            </button>
          </div>
        )}
      </div>

      <ExportModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        documentTypes={documentTypes}
        filters={filters}
      />
    </div>
  );
}
