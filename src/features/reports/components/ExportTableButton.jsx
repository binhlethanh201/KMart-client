import { useState } from 'react';
import { reportService } from '../services/reportService';
import { useI18n } from '../../../i18n/I18nProvider';

/**
 * BE-62: nút nhỏ "Excel" để xuất RIÊNG một bảng trên màn Báo cáo & Thống kê.
 *
 * Số liệu lấy từ đúng hàm dựng số liệu của màn hình nên file xuất ra khớp với số đang thấy,
 * và vẫn tuân theo bộ lọc đang áp dụng.
 *
 * table: 'managers' | 'byDepartment' | 'byPosition' | 'byType' | 'applications'
 */
export default function ExportTableButton({ table, filters, scope, filePrefix, title }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const handleExport = async () => {
    if (busy) return;
    setBusy(true);
    setError(false);
    try {
      const blob = await reportService.exportTable({ table, filters, scope });
      const stamp = new Date().toISOString().slice(0, 10);
      reportService.downloadExcel(blob, `${filePrefix || table}_${stamp}.xlsx`);
    } catch (err) {
      console.error('Export table failed:', err);
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={busy}
      title={title || t('Xuất bảng này ra Excel')}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-bold transition-colors cursor-pointer disabled:cursor-wait ${
        error
          ? 'border-red-200 bg-red-50 text-red-600'
          : 'border-[#e5e2db] bg-white text-[#66655F] hover:text-[#1d1d1f] hover:border-[#c9c5bb]'
      }`}
    >
      <span className={`material-symbols-outlined text-[15px] ${busy ? 'animate-spin' : ''}`}>
        {busy ? 'progress_activity' : error ? 'error' : 'download'}
      </span>
      {busy ? t('Đang xuất...') : t('Excel')}
    </button>
  );
}
