import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../../../i18n/I18nProvider';
import ExportTableButton from './ExportTableButton';
import TablePager from './TablePager';

/**
 * BE-64: bảng "Bảng điều hành — Đơn được duyệt theo nhân sự".
 *
 * Tách riêng + tách state (tìm kiếm / phân trang) ra khỏi trang để gõ tìm kiếm
 * chỉ vẽ lại bảng này, không vẽ lại cả trang Báo cáo.
 *
 * Tìm kiếm theo tên nhân sự, phòng công tác chính, chức vụ — lọc ngay trên dữ liệu
 * đã tải nên không cần gọi lại máy chủ.
 */
export default function RosterTable({ managers, rosterMode, total, onPickDepartment, query }) {
  const { t } = useI18n();

  const [query_, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const positions = useMemo(
    () => [...new Set(managers.map((m) => m.positionName).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'vi')),
    [managers]
  );

  const filtered = useMemo(() => {
    const keyword = query_.trim().toLowerCase();
    return managers.filter((m) => {
      const matchKeyword = !keyword
        || (m.fullName || '').toLowerCase().includes(keyword)
        || (m.departmentName || '').toLowerCase().includes(keyword)
        || (m.positionName || '').toLowerCase().includes(keyword);
      const matchRole = !roleFilter || m.positionName === roleFilter;
      return matchKeyword && matchRole;
    });
  }, [managers, query_, roleFilter]);

  useEffect(() => { setPage(1); }, [query_, roleFilter, pageSize, rosterMode, managers.length]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const rows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const firstRow = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const lastRow = Math.min(safePage * pageSize, filtered.length);
  const maxApproved = Math.max(...managers.map((x) => x.approvedCount || 0), 1);
  const hasFilter = Boolean(query_ || roleFilter);

  return (
    <div>
      <div className="flex items-start justify-between gap-3 flex-wrap mb-6">
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

      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div className="flex p-0.5 bg-white/5 border border-white/10 rounded-lg w-fit">
          <button
            type="button"
            onClick={() => onPickDepartment && onPickDepartment({ rosterMode: 'managers' })}
            className={`text-[11px] px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
              rosterMode === 'managers' ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {t('Quản lý')}
          </button>
          <button
            type="button"
            onClick={() => onPickDepartment && onPickDepartment({ rosterMode: 'all' })}
            className={`text-[11px] px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
              rosterMode === 'all' ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {t('Tất cả nhân sự')}
          </button>
        </div>
        <ExportTableButton table="managers" filters={query} scope={rosterMode} filePrefix="BangDieuHanh" />
      </div>

      {/* Tìm kiếm + lọc chức vụ ngay trong bảng (lọc tại chỗ, không gọi lại máy chủ) */}
      <div className="flex items-end gap-3 flex-wrap mb-5 pb-4 border-b border-white/10">
        <div className="flex flex-col gap-1.5 flex-1 min-w-[220px]">
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{t('Tìm kiếm nhân sự')}</label>
          <div className="relative">
            <span className="material-symbols-outlined text-[18px] text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={query_}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('Tên, phòng công tác, chức vụ...')}
              className="w-full h-[38px] pl-10 pr-9 bg-white/5 border border-white/15 rounded-lg text-[13px] text-white placeholder:text-gray-500 outline-none focus:border-white/40 transition-colors"
            />
            {query_ && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
                title={t('Xóa tìm kiếm')}
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{t('Chức vụ')}</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-[38px] px-3 rounded-lg bg-white/5 border border-white/15 text-[12px] text-gray-200 outline-none cursor-pointer hover:border-white/30 transition-colors"
          >
            <option value="" className="text-[#1d1d1f]">{t('Tất cả chức vụ')}</option>
            {positions.map((position) => (
              <option key={position} value={position} className="text-[#1d1d1f]">{t(position)}</option>
            ))}
          </select>
        </div>

        {hasFilter && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setRoleFilter('');
            }}
            className="h-[38px] px-4 rounded-lg border border-white/15 text-[12px] font-semibold text-gray-300 hover:text-white hover:border-white/30 transition-colors cursor-pointer"
          >
            {t('Đặt lại')}
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400 py-6 text-center">
          {managers.length === 0 ? t('Chưa có dữ liệu nhân sự') : t('Không tìm thấy nhân sự phù hợp')}
        </p>
      ) : (
        <>
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
                {rows.map((m) => {
                  const share = total > 0 ? ((m.approvedCount || 0) / total) * 100 : 0;
                  return (
                    <tr
                      key={m.userId}
                      onClick={() => m.departmentId && onPickDepartment && onPickDepartment({ departmentId: m.departmentId })}
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
                        <span className="text-[12px] text-gray-300">{t(m.departmentName || '—')}</span>
                      </td>
                      <td className="py-3 pr-4 text-[12px] text-gray-300">{t(m.positionName || '—')}</td>
                      <td className="py-3 pr-4 text-right text-[15px] font-bold text-emerald-400">{m.approvedCount}</td>
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

          <TablePager
            variant="dark"
            page={safePage}
            pageSize={pageSize}
            totalCount={filtered.length}
            totalPages={totalPages}
            firstRow={firstRow}
            lastRow={lastRow}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            unitLabel={t('nhân sự')}
          />
        </>
      )}
    </div>
  );
}
