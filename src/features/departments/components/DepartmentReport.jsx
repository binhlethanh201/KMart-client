import React, { useState, useMemo } from 'react';
import { STATUS_META } from '../../requests/data/constants';

export default function DepartmentReport({ deptRequests, members, employees }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const stats = useMemo(() => {
    // Collect all unique document types dynamically from requests
    // ONLY include 'approved' requests
    let filteredRequests = deptRequests.filter(r => r.status === 'approved');
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
    const rows = members.map(member => {
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
  }, [deptRequests, members, employees, startDate, endDate]);

  if (members.length === 0) {
    return (
      <div className="bg-surface rounded-xl shadow-sm border border-outline-variant p-10 text-center">
        <span className="material-symbols-outlined text-[48px] text-outline mb-3">bar_chart</span>
        <h3 className="text-lg font-bold text-on-surface mb-1">Chưa có dữ liệu thống kê</h3>
        <p className="text-secondary text-sm">Cần có nhân sự trong phòng ban để hiển thị báo cáo.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Date Filter */}
      <div className="bg-surface rounded-xl p-4 border border-outline-variant shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">analytics</span>
          Báo cáo & Thống kê Đơn từ
        </h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-secondary">Từ ngày:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-surface border border-outline-variant rounded-md px-3 py-1.5 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-secondary">Đến ngày:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-surface border border-outline-variant rounded-md px-3 py-1.5 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          {(startDate || endDate) && (
            <button
              onClick={() => { setStartDate(''); setEndDate(''); }}
              className="text-sm text-secondary hover:text-error transition-colors underline ml-2"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface rounded-xl p-5 border border-outline-variant shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-success/10 text-success flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[24px]">task_alt</span>
          </div>
          <div>
            <p className="text-sm font-medium text-secondary mb-0.5">Tổng số đơn đã duyệt</p>
            <p className="text-2xl font-bold text-on-surface leading-none">{stats.filteredRequests.length}</p>
          </div>
        </div>
        <div className="bg-surface rounded-xl p-5 border border-outline-variant shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[24px]">group</span>
          </div>
          <div>
            <p className="text-sm font-medium text-secondary mb-0.5">Số nhân sự có đơn được duyệt</p>
            <p className="text-2xl font-bold text-on-surface leading-none">
              {stats.rows.filter(r => r.total > 0).length} <span className="text-sm font-normal text-secondary ml-1">/ {stats.rows.length} người</span>
            </p>
          </div>
        </div>
      </div>

      {/* Individual Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {stats.rows.map(row => (
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
                <p className="text-xs text-secondary font-medium uppercase tracking-wider truncate mt-0.5">{row.title || 'Nhân sự'}</p>
              </div>
              <div className="text-center shrink-0 ml-2">
                <div className="bg-success/10 text-success w-12 h-12 rounded-xl flex flex-col items-center justify-center border border-success/20">
                  <span className="text-xl font-black leading-none">{row.total}</span>
                </div>
                <span className="text-[10px] font-bold text-success/80 uppercase tracking-wider mt-1 block">Đã duyệt</span>
              </div>
            </div>

            {/* Type Breakdown */}
            <div className="mt-auto pt-4 border-t border-outline-variant/60">
              <p className="text-[11px] font-bold text-secondary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">receipt_long</span>
                Chi tiết các loại đơn
              </p>
              
              <div className="space-y-2">
                {row.total === 0 ? (
                  <div className="text-center py-4 text-sm text-secondary italic bg-surface-container-lowest rounded-lg border border-dashed border-outline-variant">
                    Chưa phát sinh đơn từ
                  </div>
                ) : (
                  stats.types.map((t, index) => {
                    const count = row.typeCounts[t];
                    if (count === 0) return null;
                    const percentage = Math.round((count / row.total) * 100);
                    const colors = ['bg-[#3b82f6]', 'bg-[#10b981]', 'bg-[#f59e0b]', 'bg-[#ef4444]', 'bg-[#8b5cf6]', 'bg-[#ec4899]', 'bg-[#14b8a6]'];
                    const color = colors[index % colors.length];
                    
                    return (
                      <div key={t} className="mb-3 last:mb-0">
                        <div className="flex justify-between items-end mb-1 text-[11px]">
                          <span className="font-bold text-on-surface truncate pr-2">{t}</span>
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
                    );
                  })
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
