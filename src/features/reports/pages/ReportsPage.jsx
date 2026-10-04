import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportService } from '../services/reportService';
import { departmentService } from '../../departments/services/departmentService';
import { documentTypeService } from '../../../services/documentTypeService';
import { positionService } from '../../hr/services/positionService';
import useDocumentTitle from '../../../hooks/useDocumentTitle';
import { PAGE_TITLE_CLS } from '../../../components/PageHeader';
import StatCard from '../components/StatCard';
import FilterBar from '../components/FilterBar';
import BarChart from '../components/BarChart';
import PieChart from '../components/PieChart';
import TrendLineChart from '../components/TrendLineChart';
import ExportTableButton from '../components/ExportTableButton';
import DrillTable from '../components/DrillTable';
import RosterTable from '../components/RosterTable';
import ExportModal from '../components/ExportModal';
import { useI18n } from '../../../i18n/I18nProvider';

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

  const [filters, setFilters] = useState({
    from: '',
    to: '',
    block: null,
    departmentId: null,
    documentTypeId: null,
    positionId: null,
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
    block: filters.block || undefined,
    departmentId: filters.departmentId || undefined,
    documentTypeId: filters.documentTypeId || undefined,
    positionId: filters.positionId || undefined,
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
        label: t(name),
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
        sorted.forEach((tp) => { rows[t(tp.documentType)] = `${tp.count} · ${(tp.percentage ?? 0).toFixed(0)}%`; });
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


  return (
    <div className="py-10 px-6 md:px-10 lg:px-16 space-y-8 h-full overflow-y-auto bg-background font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#d94a38] mb-3">
            {t('Báo cáo & Thống kê')}
          </p>
          <h1 className={`${PAGE_TITLE_CLS} max-w-2xl`}>
            {t('Báo cáo đơn từ')}
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
            value={t(byDepartment[0]?.departmentName || '—')}
            icon="apartment"
            sub={byDepartment[0] ? `${byDepartment[0].totalApplications ?? 0} ${t('đơn')} · ${topDeptShare.toFixed(0)}%` : null}
          />
          <StatCard
            title={t('Loại đơn nhiều nhất')}
            value={t(byType[0]?.documentType || '—')}
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
          <div className="flex items-start justify-between gap-3 mb-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#d94a38]">
              {t('Đơn đã duyệt theo loại đơn')}
            </h3>
            <ExportTableButton table="byType" filters={query} filePrefix="DonDaDuyet_TheoLoaiDon" />
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto pr-4 custom-scrollbar">
            <BarChart
              data={byType.map((tp) => ({
                name: t(tp.documentType || 'Không rõ'),
                value: tp.count || 0,
              }))}
            />
          </div>
        </div>

        <div className="bg-white rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-6 md:p-8 flex flex-col h-[420px]">
          <div className="flex items-start justify-between gap-3 mb-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#d94a38]">
              {t('Đơn đã duyệt theo phòng ban')}
            </h3>
            <ExportTableButton table="byDepartment" filters={query} filePrefix="DonDaDuyet_TheoPhongBan" />
          </div>
          <div className="flex-1 min-h-0">
            <PieChart
              data={byDepartment.map((d) => ({
                name: t(d.departmentName || 'Chưa phân bổ'),
                value: d.totalApplications ?? d.approved ?? 0,
              }))}
            />
          </div>
        </div>
      </div>

      {/* Xu hướng theo tháng — tổng hợp hoặc tách theo từng loại đơn */}
      <div className="bg-white rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#d94a38]">
            {t('Xu hướng đơn ĐÃ DUYỆT theo tháng (12 tháng)')}
          </h3>

          <div className="flex items-center gap-3 flex-wrap">
            {/* BE-53: chuyển chế độ xem */}
            <div className="flex p-1 bg-[#f6f6f4] rounded-full">
              {[
                { id: 'total', label: t('Tổng hợp') },
                { id: 'type', label: t('Theo loại đơn') },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setTrendMode(m.id)}
                  className={`text-[11px] px-3.5 py-1.5 rounded-full font-semibold transition-all cursor-pointer ${
                    trendMode === m.id
                      ? 'bg-white text-[#1d1d1f] shadow-[0_1px_4px_rgba(0,0,0,0.10)]'
                      : 'text-gray-500 hover:text-[#1d1d1f]'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {hasTrend && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f6f6f4] text-[11px] text-gray-600">
                  {t('Tháng này')}
                  <strong className="text-[13px] font-black text-[#1d1d1f]">{lastMonth?.total ?? 0}</strong>
                  {t('đơn đã duyệt')}
                </span>
                {(lastMonth?.totalChangePercent ?? 0) !== 0 && (
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold ${
                      (lastMonth?.totalChangePercent ?? 0) > 0
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-red-50 text-red-700'
                    }`}
                    title={t('So với tháng trước')}
                  >
                    {(lastMonth?.totalChangePercent ?? 0) > 0 ? '▲' : '▼'}{' '}
                    {Math.abs(lastMonth?.totalChangePercent ?? 0).toFixed(0)}%
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Kết luận nhanh: loại đơn được duyệt nhiều nhất trong tháng đang xem */}
        {topTypeOfMonth && (
          <div className="mb-4 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50/70 border border-emerald-100">
            <span className="material-symbols-outlined text-[16px] text-emerald-600">emoji_events</span>
            <span className="text-[11px] text-gray-600">{t('Tháng này duyệt nhiều nhất:')}</span>
            <strong className="text-[12px] text-[#1d1d1f]">{t(topTypeOfMonth.documentType)}</strong>
            <span className="text-[11px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-100">
              {topTypeOfMonth.count} {t('đơn')} · {(topTypeOfMonth.percentage ?? 0).toFixed(0)}%
            </span>
          </div>
        )}

        <TrendLineChart
          labels={trendLabels}
          series={trendSeries}
          changePercents={trendMode === 'total' ? trendChange : null}
          tooltips={trendTooltips}
          height={300}
        />
      </div>

      {/* Bảng điều hành — Quản lý cấp cao (BE-64: tách riêng để tìm kiếm không vẽ lại cả trang) */}
      <div className="bg-[#1d1d1f] rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-6 md:p-8">
        <RosterTable
          managers={managers}
          rosterMode={rosterMode}
          total={total}
          query={query}
          onPickDepartment={(patch) => {
            if (patch.rosterMode) setRosterMode(patch.rosterMode);
            else handleFilterChange(patch);
          }}
        />
      </div>

      {/* So sánh theo phòng ban & chức vụ */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-6 md:p-8">
          <div className="flex items-start justify-between gap-3 mb-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#d94a38]">
              {t('So sánh theo phòng ban')}
            </h3>
            <ExportTableButton table="byDepartment" filters={query} filePrefix="SoSanh_PhongBan" />
          </div>
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
                      {t(d.departmentName)}
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
          <div className="flex items-start justify-between gap-3 mb-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#d94a38]">
              {t('So sánh theo chức vụ')}
            </h3>
            <ExportTableButton table="byPosition" filters={query} filePrefix="SoSanh_ChucVu" />
          </div>
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
                      {t(p.positionName)}
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

      {/* Soi kĩ từng đơn (BE-64: tách riêng để tìm kiếm/lọc ngày không vẽ lại cả trang) */}
      <DrillTable query={query} />

      <ExportModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        documentTypes={documentTypes}
        filters={filters}
      />
    </div>
  );
}
