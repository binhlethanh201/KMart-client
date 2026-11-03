import { useState, useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../../../i18n/I18nProvider';
import { describeApiError } from '../../../utils/apiError';
import { userService } from '../services/userService';

const labelCls = 'block font-label-md text-label-md text-on-surface-variant mb-1.5';
const cardCls = 'bg-surface border border-outline-variant/60 rounded-lg p-4';

/** Nhãn cho từng trạng thái job (queued|hashing|committing|completed|failed). */
const phaseLabel = (t, status) => {
  if (status === 'queued') return t('Đang chờ xử lý...');
  if (status === 'hashing') return t('Đang tạo mật khẩu...');
  if (status === 'committing') return t('Đang ghi dữ liệu...');
  if (status === 'completed') return t('Hoàn tất');
  if (status === 'failed') return t('Thất bại');
  return t('Đang xử lý...');
};

function StatBox({ label, value, tone = 'text-on-surface' }) {
  return (
    <div className="bg-surface-container-low rounded-md px-3 py-2 text-center">
      <div className={`text-lg font-bold ${tone}`}>{value}</div>
      <div className="text-[11px] text-secondary leading-tight">{label}</div>
    </div>
  );
}

/**
 * Nhập Excel Nhân sự — 2 bước trong 1 modal:
 *   Bước 1: chọn file .xlsx -> dry-run (POST ?dryRun=true) xem báo cáo đối soát, KHÔNG ghi CSDL.
 *   Bước 2: "Xác nhận cập nhật" -> POST ?dryRun=false nhận jobId, hỏi trạng thái mỗi 2 giây,
 *           xong thì hiện kết quả + nút tải file mật khẩu tạm.
 */
export default function ImportExcelModal({ onClose }) {
  const { t } = useI18n();
  const fileFieldId = useId();

  const [file, setFile] = useState(null);
  // preview: báo cáo dry-run; previewError/loading cho bước 1.
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  // jobId + jobStatus điều khiển bước 2 (progress bar / kết quả / lỗi).
  const [committing, setCommitting] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [commitError, setCommitError] = useState(null);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Hỏi trạng thái job mỗi 2 giây; dừng khi completed/failed hoặc modal bị unmount
  // (cancelled + clearTimeout tránh setState sau unmount).
  useEffect(() => {
    if (!jobId) return undefined;
    let cancelled = false;
    let timer;
    const poll = async () => {
      try {
        const s = await userService.getImportJobStatus(jobId);
        if (cancelled) return;
        setJobStatus(s);
        if (s.status === 'completed' || s.status === 'failed') return;
      } catch (e) {
        if (!cancelled) {
          setJobStatus({ jobId, status: 'failed', error: describeApiError(e, t, 'Không hỏi được trạng thái nhập') });
        }
        return;
      }
      timer = setTimeout(poll, 2000);
    };
    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [jobId, t]);

  const onPickFile = async (e) => {
    const picked = e.target.files?.[0];
    if (!picked) return;
    setFile(picked);
    setPreview(null);
    setPreviewError(null);
    setPreviewLoading(true);
    try {
      const report = await userService.importExcelDryRun(picked);
      setPreview(report);
    } catch (err) {
      setPreviewError(describeApiError(err, t, 'Không đọc được file Excel'));
    } finally {
      setPreviewLoading(false);
    }
  };

  const commit = async () => {
    if (!preview || !file) return;
    setCommitting(true);
    setCommitError(null);
    try {
      const res = await userService.importExcelCommit(file);
      setJobStatus(null);
      setJobId(res.jobId);
    } catch (err) {
      setCommitError(describeApiError(err, t, 'Không gửi được yêu cầu nhập'));
    } finally {
      setCommitting(false);
    }
  };

  const downloadCredentials = async () => {
    try {
      await userService.downloadImportCredentials(jobId);
    } catch (err) {
      setCommitError(describeApiError(err, t, 'Không tải được file mật khẩu'));
    }
  };

  // Gom cảnh báo theo mã (code) để người dùng dễ quét từng nhóm lỗi.
  const warningsByCode = (preview?.warnings || []).reduce((acc, w) => {
    (acc[w.code] = acc[w.code] || []).push(w);
    return acc;
  }, {});

  const running = Boolean(jobId) && jobStatus?.status !== 'completed' && jobStatus?.status !== 'failed';
  const pct = jobStatus?.totalUsers > 0
    ? Math.min(100, Math.round((jobStatus.processedUsers || 0) / jobStatus.totalUsers * 100))
    : null;

  return createPortal(
    <div
      className="fixed inset-0 z-[110] bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t('Nhập Excel Nhân sự')}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface rounded-lg shadow-xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-outline-variant flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <span aria-hidden="true" className="material-symbols-outlined">upload_file</span>
            </div>
            <div>
              <h2 className="font-headline-md text-on-surface">{t('Nhập Excel Nhân sự')}</h2>
              <p className="text-xs text-secondary mt-0.5">
                {t('Chọn file .xlsx để xem trước, sau đó xác nhận cập nhật vào hệ thống.')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-1.5 rounded-full hover:bg-surface-variant cursor-pointer"
            aria-label={t('Đóng')}
          >
            <span aria-hidden="true" className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Bước 1: chọn file + dry-run */}
          <div>
            <label className={labelCls} htmlFor={fileFieldId}>{t('File Excel (.xlsx)')}</label>
            <input
              id={fileFieldId}
              type="file"
              accept=".xlsx,.xls"
              onChange={onPickFile}
              disabled={previewLoading || running}
              className="w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary file:mr-3 file:font-label-md disabled:opacity-50"
            />
          </div>

          {previewLoading && (
            <p className="flex items-center gap-2 text-sm text-secondary" role="status">
              <span aria-hidden="true" className="material-symbols-outlined animate-spin">progress_activity</span>
              {t('Đang đọc file và đối soát...')}
            </p>
          )}

          {previewError && (
            <div
              className="flex items-start gap-2.5 rounded-lg border border-error/20 bg-error-container p-3 text-body-md text-on-error-container"
              role="alert"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[18px]">error</span>
              {previewError}
            </div>
          )}

          {preview && (
            <div className="space-y-3">
              <div className={`${cardCls} space-y-3`}>
                <h3 className="text-xs font-bold uppercase tracking-wider text-secondary">
                  {t('Tổng quan')}
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  <StatBox label={t('Dòng đã đọc')} value={preview.totalRowsRead} />
                  <StatBox label={t('Dòng nhân sự')} value={preview.employeeRowsParsed} />
                  <StatBox label={t('Nhân sự sau gộp')} value={preview.uniqueUsersAfterMerge} />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <StatBox label={t('Phòng ban mới')} value={preview.departmentsToCreate} tone="text-primary" />
                  <StatBox label={t('Phòng ban khớp')} value={preview.departmentsMatchedExisting} />
                  <StatBox label={t('Người tạo mới')} value={preview.usersToCreate} tone="text-primary" />
                  <StatBox label={t('Người cập nhật')} value={preview.usersToUpdate} />
                </div>
              </div>

              {(preview.mergedConcurrentUsers?.length > 0) && (
                <div className={`${cardCls} space-y-2`}>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
                    <span aria-hidden="true" className="material-symbols-outlined text-[16px]">merge</span>
                    {t('Nhân sự kiêm nhiệm đã gộp')}
                  </h3>
                  <ul className="space-y-1 max-h-32 overflow-y-auto text-sm text-on-surface-variant">
                    {preview.mergedConcurrentUsers.map((m) => (
                      <li key={m.employeeCode} className="flex gap-2">
                        <span className="font-mono text-xs text-secondary flex-shrink-0">{m.employeeCode}</span>
                        <span className="min-w-0">
                          <span className="text-on-surface">{m.fullName}</span>
                          {' — '}
                          {m.units.join(', ')}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(preview.regionsWithoutManager?.length > 0) && (
                <div
                  className="rounded-lg bg-warning-container p-3 text-on-warning-container"
                  role="alert"
                >
                  <p className="flex items-center gap-2 font-label-md">
                    <span aria-hidden="true" className="material-symbols-outlined text-[18px]">warning</span>
                    {t('Khu vực chưa có quản lý')}
                  </p>
                  <ul className="list-disc list-inside text-sm mt-1.5 space-y-0.5">
                    {preview.regionsWithoutManager.map((r) => <li key={r}>{r}</li>)}
                  </ul>
                </div>
              )}

              {(preview.warnings?.length > 0) && (
                <div className={`${cardCls} space-y-2`}>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
                    <span aria-hidden="true" className="material-symbols-outlined text-[16px]">report</span>
                    {t('Cảnh báo')} ({preview.warnings.length})
                  </h3>
                  <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                    {Object.entries(warningsByCode).map(([code, items]) => (
                      <div key={code}>
                        <p className="text-[11px] font-bold text-warning uppercase tracking-wider">
                          {code} ({items.length})
                        </p>
                        <ul className="text-xs text-on-surface-variant space-y-0.5 mt-0.5">
                          {items.map((w, i) => (
                            <li key={`${w.row}-${i}`}>
                              {t('Dòng')} {w.row}: {w.message}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bước 2: tiến trình job sau khi xác nhận */}
          {running && (
            <div className="space-y-1.5" role="status" aria-live="polite">
              <p className="text-sm text-on-surface-variant flex items-center justify-between">
                <span>{phaseLabel(t, jobStatus?.status)}</span>
                {pct !== null && (
                  <span className="font-mono text-xs text-secondary">
                    {jobStatus.processedUsers || 0}/{jobStatus.totalUsers}
                  </span>
                )}
              </p>
              {pct !== null ? (
                <div className="h-2 rounded-full bg-surface-container-low overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${pct}%` }}
                    data-testid="progress-fill"
                  />
                </div>
              ) : (
                <div className="h-2 rounded-full bg-surface-container-low overflow-hidden">
                  <div className="h-full w-1/3 bg-primary animate-pulse" data-testid="progress-indeterminate" />
                </div>
              )}
            </div>
          )}

          {jobStatus?.status === 'completed' && (
            <div className="rounded-lg bg-success-container p-4 text-on-success-container space-y-3" role="status">
              <p className="flex items-center gap-2 font-label-md">
                <span aria-hidden="true" className="material-symbols-outlined text-[20px]">check_circle</span>
                {t('Nhập dữ liệu hoàn tất')}
              </p>
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div>
                  <div className="text-lg font-bold">{jobStatus.createdUsers ?? 0}</div>
                  <div className="text-[11px] opacity-80">{t('Người tạo mới')}</div>
                </div>
                <div>
                  <div className="text-lg font-bold">{jobStatus.updatedUsers ?? 0}</div>
                  <div className="text-[11px] opacity-80">{t('Người cập nhật')}</div>
                </div>
                <div>
                  <div className="text-lg font-bold">{jobStatus.createdDepartments ?? 0}</div>
                  <div className="text-[11px] opacity-80">{t('Phòng ban mới')}</div>
                </div>
              </div>
              {jobStatus.hasCredentialsFile && (
                <button
                  type="button"
                  onClick={downloadCredentials}
                  className="w-full justify-center font-label-md bg-primary text-on-primary hover:bg-on-primary-fixed-variant px-4 py-2 rounded-md flex items-center gap-2 shadow-sm cursor-pointer transition-colors"
                >
                  <span aria-hidden="true" className="material-symbols-outlined text-[18px]">download</span>
                  {t('Tải file mật khẩu tạm (.xlsx)')}
                </button>
              )}
            </div>
          )}

          {jobStatus?.status === 'failed' && (
            <div
              className="flex items-start gap-2.5 rounded-lg border border-error/20 bg-error-container p-3 text-body-md text-on-error-container"
              role="alert"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[18px]">error</span>
              {jobStatus.error || t('Nhập dữ liệu thất bại.')}
            </div>
          )}

          {commitError && (
            <div
              className="flex items-start gap-2.5 rounded-lg border border-error/20 bg-error-container p-3 text-body-md text-on-error-container"
              role="alert"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[18px]">error</span>
              {commitError}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-outline-variant flex-shrink-0 space-y-3">
          {/* Cảnh báo cố định, không có nút ẩn — thao tác nhập ghi thẳng vào CSDL thật. */}
          <p className="text-xs text-warning flex items-start gap-1.5" role="note">
            <span aria-hidden="true" className="material-symbols-outlined text-[14px] mt-px">info</span>
            {t('Thao tác này chỉ THÊM hoặc CẬP NHẬT, không xóa bất kỳ dữ liệu nào.')}
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="font-label-md text-on-surface-variant px-4 py-2 rounded-md hover:bg-surface-variant transition-colors cursor-pointer"
            >
              {t('Đóng')}
            </button>
            <button
              type="button"
              onClick={commit}
              disabled={!preview || committing || running || jobStatus?.status === 'completed'}
              className="font-label-md text-on-primary bg-primary hover:bg-on-primary-fixed-variant px-5 py-2 rounded-md transition-colors shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[18px]">check_circle</span>
              {committing ? t('Đang gửi...') : t('Xác nhận cập nhật')}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
