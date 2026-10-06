import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { STATUS_META } from '../../requests/data/constants';
import { useI18n } from '../../../i18n/I18nProvider';
import { FILTER_CONTROL_CLS, FILTER_SELECT_CLS, FILTER_SEARCH_CLS, FILTER_SEARCH_ICON_CLS, FILTER_GHOST_BUTTON_CLS } from '../../../styles/filterControls';
import Select from '../../../components/Select';
import Pagination from '../../../components/Pagination';

// BE-43: nhân viên chỉ xem báo cáo của CHÍNH MÌNH; trưởng/phó phòng xem toàn phòng.
export default function DepartmentReport({ deptRequests, members, employees, isDeptManager = true, currentUserId }) {
  const { t } = useI18n();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expanded, setExpanded] = useState({});
  const [searchQueries, setSearchQueries] = useState({});
  // 'all' la hang so trung tinh (KHONG dung chuoi da dich) de doi ngon ngu khong lam sai bo loc.
  const [chartFilter, setChartFilter] = useState('all');
  const [memberSearch, setMemberSearch] = useState('');
  const [memberPage, setMemberPage] = useState(1);
  const [memberPageSize, setMemberPageSize] = useState(10);

  // Nhân viên: chỉ thống kê trên đơn của bản thân, và bảng thành viên chỉ còn chính họ.
  const scopedRequests = useMemo(
    () => (isDeptManager ? deptRequests : deptRequests.filter(r => String(r.creatorId) === String(currentUserId))),
    [deptRequests, isDeptManager, currentUserId]
  );
  const scopedMembers = useMemo(
    () => (isDeptManager ? members : members.filter(m => String(m.id) === String(currentUserId))),
    [members, isDeptManager, currentUserId]
  );

  const handleMemberSearch = (val) => {
    setMemberSearch(val);
    setMemberPage(1);
  };

  const toggleExpand = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  const handleSearchChange = (key, val) => setSearchQueries(prev => ({ ...prev, [key]: val }));

  const stats = useMemo(() => {
    // Collect all unique document types dynamically from requests
    // ONLY include 'approved' requests
    let filteredRequests = scopedRequests.filter(r => r.status === 'approved');
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filteredRequests = filteredRequests.filter(r => new Date(r._createdAt) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filteredRequests = filteredRequests.filter(r => new Date(r._createdAt) <= end);
    }

    // Collect all unique document types dynamically from requests
    const typeSet = new Set();
    filteredRequests.forEach(r => {
      if (r.type) typeSet.add(r.type);
    });
    const types = Array.from(typeSet).sort();

    // Map each member to their stats
    const rows = scopedMembers.map(member => {
      // Find employee info for avatar/name if members list misses something
      const emp = employees.find(e => e.id === member.id) || member;
      const userRequests = filteredRequests.filter(r => r.creatorId === member.id);
      
      const total = userRequests.length;

      const typeCounts = {};
      types.forEach(t => {
        typeCounts[t] = userRequests.filter(r => r.type === t).length;
      });

      return {
        id: member.id,
        name: emp.name,
        avatar: emp.avatar,
        title: emp.title || emp.position || emp.role,
        total,
        typeCounts
      };
    });

    // Sort by total descending
    rows.sort((a, b) => b.total - a.total);

    // Compute type distribution for the department chart
    const typeDistribution = types.map(t => ({
      name: t,
      count: filteredRequests.filter(r => r.type === t).length
    })).filter(t => t.count > 0).sort((a, b) => b.count - a.count);

    return { types, rows, filteredRequests, typeDistribution };
  }, [scopedRequests, scopedMembers, employees, startDate, endDate]);

  const filteredRows = useMemo(() => {
    let result = stats.rows;
    if (memberSearch.trim()) {
      const q = memberSearch.toLowerCase();
      result = result.filter(r => r.name.toLowerCase().includes(q) || (r.title && r.title.toLowerCase().includes(q)));
    }
    return result;
  }, [stats.rows, memberSearch]);

  // Lưới auto-fill (số cột tự co giãn theo bề rộng khung) + phân trang giống
  // trang Phòng ban & Nhóm: chọn số thẻ/trang, dãy hiển thị và nút số trang.
  const memberTotalPages = Math.max(1, Math.ceil(filteredRows.length / memberPageSize));
  const safeMemberPage = Math.min(Math.max(1, memberPage), memberTotalPages);
  const pagedRows = filteredRows.slice((safeMemberPage - 1) * memberPageSize, safeMemberPage * memberPageSize);

  if (scopedMembers.length === 0) {
    return (
      <div className="bg-surface rounded-xl shadow-sm border border-outline-variant p-10 text-center">
        <span className="material-symbols-outlined text-[48px] text-outline mb-3">bar_chart</span>
        <h3 className="text-lg font-bold text-on-surface mb-1">{t('Chưa có dữ liệu thống kê')}</h3>
        <p className="text-secondary text-sm">{t('Cần có nhân sự trong phòng ban để hiển thị báo cáo.')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Date Filter */}
      <div className="bg-surface rounded-xl p-4 border border-outline-variant shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">analytics</span>
          {t('Báo cáo & Thống kê Đơn từ')}
        </h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-secondary">{t('Từ ngày:')}</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={FILTER_CONTROL_CLS}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-secondary">{t('Đến ngày:')}</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={FILTER_CONTROL_CLS}
            />
          </div>
          {(startDate || endDate) && (
            <button
              onClick={() => { setStartDate(''); setEndDate(''); }}
              className={`${FILTER_GHOST_BUTTON_CLS} h-[38px] text-[13px]`}
            >
              {t('Xóa bộ lọc')}
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))]">
        <div className="bg-surface rounded-xl p-5 border border-outline-variant shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-success/10 text-success flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[24px]">task_alt</span>
          </div>
          <div>
            <p className="text-sm font-medium text-secondary mb-0.5">{t('Tổng số đơn đã duyệt')}</p>
            <p className="text-2xl font-bold text-on-surface leading-none">{stats.filteredRequests.length}</p>
          </div>
        </div>
        <div className="bg-surface rounded-xl p-5 border border-outline-variant shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[24px]">group</span>
          </div>
          <div>
            <p className="text-sm font-medium text-secondary mb-0.5">{t('Số nhân sự có đơn được duyệt')}</p>
            <p className="text-2xl font-bold text-on-surface leading-none">
              {stats.rows.filter(r => r.total > 0).length} <span className="text-sm font-normal text-secondary ml-1">/ {stats.rows.length} {t('người')}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      {stats.rows.length > 0 && (
        <div className="bg-surface border border-outline-variant rounded-2xl p-6 shadow-sm mb-6 mt-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">bar_chart</span>
              {t('Biểu đồ so sánh lượng đơn từ')}
            </h3>
            <Select
              value={chartFilter}
              onChange={setChartFilter}
              className={`${FILTER_SELECT_CLS} h-[38px] min-w-[150px] px-3 text-[13px]`}
              align="right"
              options={[
                { value: 'all', label: t('Tất cả loại đơn') },
                ...stats.types.map((ty) => ({ value: ty, label: ty })),
              ]}
            />
          </div>
          <div className="relative h-72 w-full mt-4 flex items-end px-4 pb-16 pt-6">
             {/* Grid lines */}
             <div className="absolute top-6 bottom-16 left-4 right-4 flex flex-col justify-between pointer-events-none">
               {[...Array(5)].map((_, i) => (
                 <div key={i} className="w-full h-px bg-outline-variant/40"></div>
               ))}
             </div>
             
             {/* Bars */}
             <div className="relative z-10 flex items-end justify-around w-full h-full gap-2 border-b-2 border-outline-variant/60">
                {[...stats.rows].sort((a, b) => {
                  const getCount = (r) => chartFilter === 'all' ? r.total : (r.typeCounts[chartFilter] || 0);
                  return getCount(b) - getCount(a);
                }).map((row, index) => {
                  const getCount = (r) => chartFilter === 'all' ? r.total : (r.typeCounts[chartFilter] || 0);
                  const count = getCount(row);
                  const maxTotal = Math.max(1, ...stats.rows.map(r => getCount(r)));
                  const percentage = (count / maxTotal) * 100;
                  
                  return (
                    <div key={`chart-${row.id}`} className="relative flex flex-col items-center group h-full justify-end flex-1 max-w-[64px]">
                      {/* Number label on top */}
                      <span className="text-xs font-bold text-on-surface mb-1.5 opacity-80 group-hover:opacity-100 group-hover:-translate-y-1 transition-all">
                        {count}
                      </span>
                      
                      {/* Bar */}
                      <div 
                        className="w-full bg-[#128bb8] group-hover:bg-[#0f7296] transition-all duration-700 ease-out rounded-t-sm shadow-sm"
                        style={{ height: `${Math.max(percentage, 1)}%` }}
                      ></div>
                      
                      {/* X-axis label (Avatar + short name + title) */}
                      <div className="absolute top-full mt-3 w-full flex flex-col items-center">
                         {row.avatar ? (
                            <img src={row.avatar} className="w-6 h-6 rounded-full object-cover border border-outline-variant shadow-sm" title={row.name} />
                         ) : (
                            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 shadow-sm" title={row.name}>
                              {row.name.charAt(0).toUpperCase()}
                            </div>
                         )}
                         <span className="text-[10px] font-medium text-secondary mt-1 text-center w-[200%] truncate" title={row.name}>
                            {row.name.split(' ').pop()}
                         </span>
                         <span className="text-[9px] text-outline mt-0.5 truncate w-[200%] text-center uppercase tracking-wider" title={t(row.title) || t('Nhân sự')}>
                            {t(row.title) || t('Nhân sự')}
                         </span>
                      </div>
                    </div>
                  );
                })}
             </div>
          </div>
        </div>
      )}

      {/* Individual Cards Section */}
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">groups</span>
            {t('Chi tiết theo nhân sự')}
          </h3>
          <div className="relative w-full sm:w-64">
            <span className={FILTER_SEARCH_ICON_CLS}>search</span>
            <input
              type="text"
              placeholder={t('Tìm nhân viên...')}
              value={memberSearch}
              onChange={(e) => handleMemberSearch(e.target.value)}
              className={FILTER_SEARCH_CLS}
            />
          </div>
        </div>

        {filteredRows.length === 0 ? (
          <div className="text-center py-10 bg-surface rounded-xl border border-outline-variant">
            <span className="material-symbols-outlined text-[48px] text-outline mb-2">person_off</span>
            <p className="text-secondary font-medium">{t('Không tìm thấy nhân sự phù hợp.')}</p>
          </div>
        ) : (
          <>
          <div className="grid gap-5 items-start grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))]">
              {pagedRows.map(row => (
          <div key={row.id} className="bg-surface border border-outline-variant rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col group">
            {/* Header */}
            <div className="flex items-center gap-4 mb-5">
              {row.avatar ? (
                <img src={row.avatar} alt={row.name} className="w-14 h-14 rounded-full object-cover shadow-sm border border-outline-variant" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-primary/10 text-primary font-bold text-xl flex items-center justify-center shadow-sm">
                  {row.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base text-on-surface truncate group-hover:text-primary transition-colors">{row.name}</h3>
                <p className="text-xs text-secondary font-medium uppercase tracking-wider truncate mt-0.5">{t(row.title) || t('Nhân sự')}</p>
              </div>
              <div className="text-center shrink-0 ml-2">
                <div className="bg-success/10 text-success w-12 h-12 rounded-xl flex flex-col items-center justify-center border border-success/20">
                  <span className="text-xl font-black leading-none">{row.total}</span>
                </div>
                <span className="text-[10px] font-bold text-success/80 uppercase tracking-wider mt-1 block">{t('Đã duyệt')}</span>
              </div>
            </div>

            {/* Type Breakdown */}
            <div className="mt-auto pt-4 border-t border-outline-variant/60">
              <p className="text-[11px] font-bold text-secondary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">receipt_long</span>
                {t('Chi tiết các loại đơn')}
              </p>
              
              <div className="space-y-2">
                {row.total === 0 ? (
                  <div className="text-center py-4 text-sm text-secondary italic bg-surface-container-lowest rounded-lg border border-dashed border-outline-variant">
                    {t('Chưa phát sinh đơn từ')}
                  </div>
                ) : (
                  stats.types.map((t, index) => {
                    const count = row.typeCounts[t];
                    if (count === 0) return null;
                    const percentage = Math.round((count / row.total) * 100);
                    const colors = ['bg-[#3b82f6]', 'bg-[#10b981]', 'bg-[#f59e0b]', 'bg-[#ef4444]', 'bg-[#8b5cf6]', 'bg-[#ec4899]', 'bg-[#14b8a6]'];
                    const color = colors[index % colors.length];
                    
                    const expandKey = `${row.id}-${t}`;
                    const isExpanded = expanded[expandKey];
                    const searchQuery = searchQueries[expandKey] || '';
                    const userRequestsForType = stats.filteredRequests.filter(r => r.creatorId === row.id && r.type === t);
                    
                    const filteredList = userRequestsForType.filter(req => 
                      req.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      (req.title && req.title.toLowerCase().includes(searchQuery.toLowerCase()))
                    );

                    return (
                      <div key={t} className="mb-3 last:mb-0">
                        <div 
                          className="cursor-pointer group/item" 
                          onClick={() => toggleExpand(expandKey)}
                        >
                          <div className="flex justify-between items-end mb-1 text-[11px]">
                            <span className="font-bold text-on-surface truncate pr-2 group-hover/item:text-primary transition-colors flex items-center gap-0.5">
                              <span className={`material-symbols-outlined text-[14px] transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                expand_more
                              </span>
                              {t}
                            </span>
                            <span className="text-on-surface font-bold whitespace-nowrap">
                              {count} <span className="font-medium text-secondary">({percentage}%)</span>
                            </span>
                          </div>
                          <div className="w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden shadow-inner">
                            <div 
                              className={`h-1.5 rounded-full ${color} transition-all duration-1000 ease-out`} 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Expanded detail list */}
                        {isExpanded && (
                          <div className="mt-2 pl-2 ml-1.5 border-l-2 border-outline-variant/60 flex flex-col gap-2">
                            <input
                              type="text"
                              value={searchQuery}
                              onChange={(e) => handleSearchChange(expandKey, e.target.value)}
                              placeholder="Tìm mã đơn, tiêu đề..."
                              className="w-full bg-surface-container-lowest border border-outline-variant rounded px-2 py-1 text-[11px] outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="space-y-1 max-h-[190px] overflow-y-auto pr-1">
                              {filteredList.length === 0 ? (
                                <div className="text-[11px] text-secondary italic text-center py-2">Không tìm thấy đơn</div>
                              ) : (
                                filteredList.map(req => (
                                  <Link
                                    key={req.id}
                                    to={`/requests/${req.id}`}
                                    className="block bg-surface-container-lowest hover:bg-surface-container-low p-2 rounded border border-outline-variant/30 transition-colors"
                                  >
                                    <div className="flex justify-between items-start mb-0.5">
                                      <span className="font-bold text-primary text-xs hover:underline">
                                        {req.id.substring(0, 8).toUpperCase()}
                                      </span>
                                      <span className="text-[10px] text-secondary">
                                        {req.createdAt || new Date(req._createdAt).toLocaleString('vi-VN')}
                                      </span>
                                    </div>
                                    <div className="text-[11px] text-on-surface-variant truncate" title={req.title}>
                                      {req.title}
                                    </div>
                                  </Link>
                                ))
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

            {/* Thanh phân trang cùng kiểu với trang Phòng ban & Nhóm */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-4 px-3 md:px-4 py-2.5 border border-outline-variant/60 rounded-lg bg-surface-container-lowest">
              <div className="flex flex-wrap items-center gap-2 text-xs text-secondary">
                <span>{t('Hiển thị')}</span>
                <Select
                  value={memberPageSize}
                  onChange={(value) => {
                    setMemberPageSize(Number(value));
                    setMemberPage(1);
                  }}
                  className="filter-control filter-select h-[34px] py-0 pl-2.5 pr-8 text-xs"
                  options={[
                    { value: 5, label: t('5 nhân sự') },
                    { value: 10, label: t('10 nhân sự') },
                    { value: 20, label: t('20 nhân sự') },
                  ]}
                />
                <span className="whitespace-nowrap">
                  {filteredRows.length === 0 ? 0 : (safeMemberPage - 1) * memberPageSize + 1}
                  {' - '}
                  {Math.min(safeMemberPage * memberPageSize, filteredRows.length)}
                  {' '}
                  {t('trong tổng số')} {filteredRows.length} {t('nhân sự')}
                </span>
              </div>
              {memberTotalPages > 1 && (
                <Pagination
                  currentPage={safeMemberPage}
                  totalPages={memberTotalPages}
                  onPageChange={setMemberPage}
                  className="w-auto py-0 flex justify-end items-center gap-1.5 flex-nowrap"
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
