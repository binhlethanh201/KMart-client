import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportService } from '../services/reportService';
import { useI18n } from '../../../i18n/I18nProvider';
import { FILTER_CONTROL_CLS, FILTER_LABEL_CLS, FILTER_SEARCH_CLS, FILTER_SEARCH_ICON_CLS, FILTER_GHOST_BUTTON_CLS } from '../../../styles/filterControls';
import LoadError from '../../../components/LoadError';
import ExportTableButton from './ExportTableButton';
import TablePager from './TablePager';

/**
 * BE-64: bảng "Soi kĩ từng đơn" tách thành component RIÊNG.
 *
 * Lý do: ô tìm kiếm / khoảng ngày / phân trang là state CỤC BỘ của bảng này.
 * Khi state nằm trong trang, mỗi ký tự gõ vào đều làm React vẽ lại TOÀN BỘ trang
 * (KPI, biểu đồ, các thẻ khác), trông như "tải lại cả trang" và dễ làm nhảy vị trí cuộn.
 * Tách ra đây thì chỉ RIÊNG bảng này vẽ lại.
 */
export default function DrillTable({ query }) {
  const { t } = useI18n();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState(query?.from || '');
  const [to, setTo] = useState(query?.to || '');
  /**
   * RPT-02: cờ "không nạp được danh sách đơn".
   * Trước đây `.catch()` xoá dữ liệu về rỗng nên bảng hiện "Không có đơn nào phù hợp bộ lọc" —
   * sai sự thật, và còn xoá luôn số dòng đang có nên người dùng tưởng bộ lọc ăn quá chặt.
   */
  const [loadError, setLoadError] = useState(false);

  // Bộ lọc chung đổi thì khoảng ngày của bảng đi theo (tránh hiểu nhầm số liệu).
  useEffect(() => {
    setFrom(query?.from || '');
    setTo(query?.to || '');
  }, [query?.from, query?.to]);

  // Gõ tìm kiếm thì chờ 300ms mới gọi API để không bắn request theo từng ký tự.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const request = useMemo(() => ({
    ...query,
    from: from || query?.from,
    to: to || query?.to,
    search: search || undefined,
  }), [query, from, to, search]);

  const load = useCallback((targetPage, targetSize) => {
    setLoading(true);
    setLoadError(false);
    reportService.getApplications(request, targetPage, targetSize)
      .then((r) => {
        const data = r.data || {};
        setItems(data.items || data.Items || []);
        setTotalCount(data.totalCount ?? data.TotalCount ?? 0);
        setPage(targetPage);
      })
      .catch(() => {
        setItems([]);
        setTotalCount(0);
        setLoadError(true);
      })
      .finally(() => setLoading(false));
  }, [request]);

  // Đổi bộ lọc / từ khoá / khoảng ngày / số dòng thì quay về trang 1.
  useEffect(() => { load(1, pageSize); }, [load, pageSize]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const firstRow = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRow = Math.min(page * pageSize, totalCount);
  const hasFilter = Boolean(searchInput || from || to);

  return (
    <div className="bg-white rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-6 md:p-8">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-5">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-accent">{t('Soi kĩ từng đơn')}</h3>
          <p className="text-[11px] text-gray-500 mt-1">
            {t('Bấm vào một dòng để mở chi tiết đơn.')} · {totalCount} {t('đơn')}
          </p>
        </div>
        <ExportTableButton table="applications" filters={request} filePrefix="DanhSachDon" />
      </div>

      {/* Tìm kiếm nhanh + khoảng ngày ngay trong bảng để khỏi phải cuộn lên bộ lọc chung */}
      <div className="flex items-end gap-3 flex-wrap mb-5 pb-5 border-b border-[#f0eee9]">
        <div className="flex flex-col gap-1.5 flex-1 min-w-full sm:min-w-[240px]">
          <label className={FILTER_LABEL_CLS} htmlFor="drill-search">{t('Tìm kiếm đơn')}</label>
          <div className="relative">
            <span className={FILTER_SEARCH_ICON_CLS} aria-hidden="true">
              search
            </span>
            <input
              id="drill-search"
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('Mã đơn, mã nhân sự, người tạo, phòng ban, loại đơn...')}
              className={`${FILTER_SEARCH_CLS} pr-9`}
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1d1d1f] cursor-pointer"
                title={t('Xóa tìm kiếm')}
              >
                <span aria-hidden="true" className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={FILTER_LABEL_CLS} htmlFor="drill-from-date">{t('Từ ngày')}</label>
          <input
            id="drill-from-date"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className={FILTER_CONTROL_CLS}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={FILTER_LABEL_CLS} htmlFor="drill-to-date">{t('Đến ngày')}</label>
          <input
            id="drill-to-date"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className={FILTER_CONTROL_CLS}
          />
        </div>

        {hasFilter && (
          <button
            type="button"
            onClick={() => {
              setSearchInput('');
              setFrom('');
              setTo('');
            }}
            className={FILTER_GHOST_BUTTON_CLS}
          >
            {t('Đặt lại')}
          </button>
        )}
      </div>

      {/* Giữ NGUYÊN số dòng đang xem khi nạp trang mới, chỉ làm mờ đi -> chiều cao không tụt,
          thanh cuộn không bị kéo ngược lên. */}
      <div className="relative overflow-x-auto min-h-[560px]">
        {loading && items.length > 0 && (
          <div className="absolute inset-0 z-10 bg-white/55 flex items-start justify-center pt-6 pointer-events-none">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white shadow-sm border border-[#eeece7] text-[11px] font-semibold text-gray-500">
              <span aria-hidden="true" className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
              {t('Đang tải...')}
            </span>
          </div>
        )}
        <table className={`stack-grid w-full text-left sm:min-w-[900px] transition-opacity ${loading && items.length > 0 ? 'opacity-50' : 'opacity-100'}`}>
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-gray-400 border-b border-[#eeece7]">
              <th className="py-3 pr-4 font-bold">{t('Mã đơn')}</th>
              <th className="py-3 pr-4 font-bold">{t('Loại đơn')}</th>
              {/* RPT-01: cột mã nhân sự — hai người trùng họ tên phải phân biệt được ngay trên bảng */}
              <th className="py-3 pr-4 font-bold">{t('Mã nhân sự')}</th>
              <th className="py-3 pr-4 font-bold">{t('Người tạo')}</th>
              <th className="py-3 pr-4 font-bold">{t('Phòng ban')}</th>
              <th className="py-3 pr-4 font-bold">{t('Chức vụ')}</th>
              <th className="py-3 pr-4 font-bold">{t('Bước')}</th>
              <th className="py-3 pr-4 font-bold text-right">{t('Xử lý (giờ)')}</th>
            </tr>
          </thead>
          <tbody>
            {loading && items.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-gray-400 text-sm">{t('Đang tải...')}</td>
              </tr>
            )}
            {(!loading || items.length > 0) && items.map((a) => (
              <tr
                key={a.id}
                onClick={() => navigate(`/requests/${a.id}`)}
                className="border-b border-[#f4f2ee] hover:bg-[#faf9f7] cursor-pointer transition-colors"
              >
                <td data-label={t('Mã đơn')} className="py-3 pr-4 text-[12px] font-mono font-semibold text-[#1d1d1f]">
                  {(a.code || a.id || '').toString().substring(0, 8).toUpperCase()}
                </td>
                <td data-label={t('Loại đơn')} className="py-3 pr-4 text-[12px] text-[#1d1d1f]">{t(a.documentTypeName || '—')}</td>
                <td data-label={t('Mã nhân sự')} className="py-3 pr-4 text-[12px] font-mono text-gray-500">
                  {/* RPT-01: mã nhân sự do máy chủ trả về (`applicantCode`); DTO không có
                      `applicantId` nên trước đây nhánh dự phòng đó là code chết. */}
                  {a.applicantCode || '—'}
                </td>
                <td data-label={t('Người tạo')} className="py-3 pr-4 text-[12px] text-gray-600">{a.applicantName || '—'}</td>
                <td data-label={t('Phòng ban')} className="py-3 pr-4 text-[12px] text-gray-600">{t(a.departmentName || '—')}</td>
                <td data-label={t('Chức vụ')} className="py-3 pr-4 text-[12px] text-gray-600">{t(a.positionName || '—')}</td>
                <td data-label={t('Bước')} className="py-3 pr-4 text-[12px] text-gray-600">
                  {a.totalSteps ? `${a.currentStepOrder || 0}/${a.totalSteps}` : '—'}
                </td>
                <td data-label={t('Xử lý (giờ)')} className="py-3 pr-4 text-right text-[12px] text-gray-600">
                  {a.durationHours != null ? a.durationHours.toFixed(1) : '—'}
                </td>
              </tr>
            ))}
            {!loading && loadError && (
              <tr>
                <td colSpan={8} className="py-6">
                  <LoadError
                    message={t('Không tải được danh sách đơn.')}
                    onRetry={() => load(page, pageSize)}
                  />
                </td>
              </tr>
            )}
            {!loading && !loadError && items.length === 0 && (
              <tr>
                <td colSpan={8} className="py-10 text-center text-gray-500 text-sm">
                  {t('Không có đơn nào phù hợp bộ lọc')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <TablePager
        variant="light"
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
        totalPages={totalPages}
        firstRow={firstRow}
        lastRow={lastRow}
        onPageChange={(nextPage) => load(nextPage, pageSize)}
        onPageSizeChange={setPageSize}
        unitLabel={t('đơn')}
      />
    </div>
  );
}
