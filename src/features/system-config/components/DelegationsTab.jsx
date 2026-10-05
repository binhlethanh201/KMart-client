import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { delegationService } from '../../../services/delegationService';
import { userService } from '../../hr/services/userService';
import { useApproval } from '../../../context/useApproval';
import { useI18n } from '../../../i18n/I18nProvider';
import { describeApiError } from '../../../utils/apiError';

/* ─── Shared form styles ─────────────────────────────────────────────────────── */
const fieldCls =
  'w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary';
const fieldErrCls =
  'w-full rounded-md border border-error bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none focus:border-error focus:ring-1 focus:ring-error';
const labelCls = 'block font-label-md text-label-md text-on-surface-variant mb-1.5';

/* ─── Date helpers ───────────────────────────────────────────────────────────── */
const FORMAT_DATE = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

/* ─── User picker ────────────────────────────────────────────────────────────── */
function UserSelect({ value, onChange, excludeId }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    userService.getAll().then(setUsers).catch(() => setUsers([]));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (u.id === excludeId) return false;
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        (u.id || '').toLowerCase().includes(q) ||
        (u.position || '').toLowerCase().includes(q)
      );
    });
  }, [users, search, excludeId]);

  const selected = users.find((u) => u.id === value);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (!e.target.closest('.user-select-root')) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className={`relative user-select-root ${open ? 'z-50' : 'z-10'}`}>
      <div
        onClick={() => setOpen((o) => !o)}
        className="bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-2 flex items-center justify-between cursor-pointer hover:border-primary transition-colors"
      >
        {selected ? (
          <div className="flex items-center gap-2 overflow-hidden">
            <img
              src={selected.avatar}
              alt={selected.name}
              className="w-7 h-7 rounded-full object-cover flex-shrink-0 border border-outline-variant/50"
            />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-on-surface truncate">{selected.name}</div>
              <div className="text-[11px] text-secondary truncate">
                {selected.id?.substring(0, 8).toUpperCase()} · {t(selected.position || 'Nhân viên')}
              </div>
            </div>
          </div>
        ) : (
          <span className="text-sm text-secondary">{t('Chọn người được ủy quyền...')}</span>
        )}
        <span className="material-symbols-outlined text-outline flex-shrink-0 ml-2">
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </div>

      {open && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-surface border border-outline-variant rounded-md shadow-lg z-50 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-outline-variant/50 flex items-center gap-2 bg-surface-container-lowest">
            <span className="material-symbols-outlined text-secondary text-[16px] flex-shrink-0">search</span>
            <input
              autoFocus
              type="text"
              placeholder={t('Tìm tên hoặc mã nhân sự...')}
              className="flex-1 bg-transparent text-xs text-on-surface outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              onClick={(e) => { e.stopPropagation(); setOpen(false); setSearch(''); }}
              className="text-secondary hover:text-error p-0.5 rounded cursor-pointer"
              aria-label={t('Đóng')}
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
          <div className="max-h-[200px] overflow-y-auto p-1.5 flex flex-col gap-0.5">
            {filtered.length === 0 ? (
              <div className="text-xs text-secondary text-center py-4 italic">{t('Không tìm thấy nhân sự nào.')}</div>
            ) : (
              filtered.map((u) => (
                <button
                  key={u.id}
                  onClick={() => { onChange(u.id); setOpen(false); setSearch(''); }}
                  className={`flex items-center gap-2.5 p-2 rounded text-left transition-colors cursor-pointer ${
                    value === u.id ? 'bg-primary-container/40' : 'hover:bg-surface-container-low'
                  }`}
                >
                  <img
                    src={u.avatar}
                    alt={u.name}
                    className="w-7 h-7 rounded-full object-cover border border-outline-variant/50 flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className={`text-xs font-semibold truncate ${value === u.id ? 'text-primary' : 'text-on-surface'}`}>
                      {u.name}
                    </div>
                    <div className="text-[10px] text-secondary truncate">
                      {u.id?.substring(0, 8).toUpperCase()} · {t(u.position || 'Nhân viên')}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Create Delegation Modal ────────────────────────────────────────────────── */
function CreateDelegationModal({ onClose, onSuccess, pushToast }) {
  const { t } = useI18n();
  const { currentUser } = useApproval();

  const today = useMemo(() => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }, []);

  const tomorrow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }, []);

  const [delegateId, setDelegateId] = useState('');
  const [startDate, setStartDate] = useState(tomorrow);
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !saving) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, saving]);

  const validate = () => {
    const next = {};
    if (!delegateId) next.delegateId = t('Vui lòng chọn người được ủy quyền.');
    else if (delegateId === currentUser?.id) next.delegateId = t('Không thể ủy quyền cho chính mình.');
    if (!startDate) next.startDate = t('Vui lòng chọn ngày bắt đầu.');
    if (!endDate) next.endDate = t('Vui lòng chọn ngày kết thúc.');
    if (startDate && endDate && startDate > endDate) {
      next.endDate = t('Ngày kết thúc phải sau ngày bắt đầu.');
    }
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    setSubmitError('');
    try {
      await delegationService.create({
        delegateId,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        reason: reason.trim() || undefined,
      });
      pushToast(t('Đã tạo ủy quyền thành công.'), 'success');
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Create delegation failed:', err);
      setSubmitError(describeApiError(err, t, 'Không tạo được ủy quyền.'));
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[110] bg-black/50 flex items-center justify-center p-4"
      onClick={() => !saving && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delegation-modal-title"
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="bg-surface rounded-lg shadow-xl w-full max-w-lg flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex justify-between items-start p-5 border-b border-outline-variant/30">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined">person_add</span>
            </div>
            <div>
              <h2 id="delegation-modal-title" className="font-headline-sm text-on-surface">
                {t('Tạo ủy quyền')}
              </h2>
              <p className="text-xs text-secondary mt-0.5">
                {t('Người được ủy quyền sẽ có thể duyệt đơn thay bạn trong khoảng thời gian được chỉ định.')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-variant cursor-pointer disabled:opacity-40"
            aria-label={t('Đóng')}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-4">
          {/* Delegate */}
          <div>
            <label className={labelCls}>
              {t('Người được ủy quyền')} <span className="text-error">*</span>
            </label>
            <UserSelect
              value={delegateId}
              onChange={(id) => {
                setDelegateId(id);
                setErrors((e) => ({ ...e, delegateId: null, submit: null }));
              }}
              excludeId={currentUser?.id}
            />
            {errors.delegateId && (
              <p className="text-xs text-error mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">error</span>
                {errors.delegateId}
              </p>
            )}
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>
                {t('Ngày bắt đầu')} <span className="text-error">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                min={today}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setErrors((e2) => ({ ...e2, startDate: null, submit: null }));
                }}
                className={errors.startDate ? fieldErrCls : fieldCls}
              />
              {errors.startDate && <p className="text-xs text-error mt-1">{errors.startDate}</p>}
            </div>
            <div>
              <label className={labelCls}>
                {t('Ngày kết thúc')} <span className="text-error">*</span>
              </label>
              <input
                type="date"
                value={endDate}
                min={startDate || today}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setErrors((e2) => ({ ...e2, endDate: null, submit: null }));
                }}
                className={errors.endDate ? fieldErrCls : fieldCls}
              />
              {errors.endDate && <p className="text-xs text-error mt-1">{errors.endDate}</p>}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className={labelCls}>{t('Lý do ủy quyền')}</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder={t('VD: Đi công tác nước ngoài từ ngày 10–15/6')}
              className={fieldCls + ' resize-none'}
            />
          </div>

          {submitError && (
            <div className="text-xs text-error flex items-start gap-1.5 bg-error-container/30 border border-error/30 rounded-md px-3 py-2">
              <span className="material-symbols-outlined text-[16px] flex-shrink-0">error</span>
              {submitError}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 pt-0 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="font-label-md text-on-surface-variant px-4 py-2 rounded-md hover:bg-surface-variant transition-colors cursor-pointer disabled:opacity-40"
          >
            {t('Hủy')}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="font-label-md text-on-primary bg-primary px-5 py-2 rounded-md hover:bg-primary/90 transition-colors shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <span className={`material-symbols-outlined text-[18px] ${saving ? 'animate-spin' : ''}`}>
              {saving ? 'progress_activity' : 'add_task'}
            </span>
            {saving ? t('Đang tạo...') : t('Tạo ủy quyền')}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}

/* ─── Status badge ───────────────────────────────────────────────────────────── */
function StatusBadge({ isActive, startDate, endDate }) {
  const { t } = useI18n();
  const now = new Date();
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;

  if (!isActive) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-surface-container-high text-secondary">
        <span className="w-1.5 h-1.5 rounded-full bg-outline" />
        {t('Đã thu hồi')}
      </span>
    );
  }
  if (start > now) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-primary-container/50 text-primary border border-primary/30">
        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
        {t('Sắp tới')}
      </span>
    );
  }
  if (end && end < now) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-surface-container-high text-secondary">
        <span className="w-1.5 h-1.5 rounded-full bg-outline" />
        {t('Đã hết hạn')}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-success-container text-on-success-container">
      <span className="w-1.5 h-1.5 rounded-full bg-success" />
      {t('Đang hoạt động')}
    </span>
  );
}

/* ─── DelegationsTab ────────────────────────────────────────────────────────── */
export default function DelegationsTab() {
  const { t } = useI18n();
  const { currentUser, pushToast } = useApproval();

  const [tab, setTab] = useState('mine');
  const [myDelegations, setMyDelegations] = useState([]);
  const [toMeDelegations, setToMeDelegations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [revokingId, setRevokingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [mine, toMe] = await Promise.all([
        delegationService.getMine(),
        delegationService.getToMe(),
      ]);
      setMyDelegations(Array.isArray(mine) ? mine : []);
      setToMeDelegations(Array.isArray(toMe) ? toMe : []);
    } catch (err) {
      console.error('Failed to load delegations:', err);
      pushToast(t('Không tải được danh sách ủy quyền.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRevoke = async (delegation) => {
    const confirmMsg = delegation.isActive
      ? t('Thu hồi ủy quyền cho "{v0}"? Người này sẽ không còn duyệt đơn thay bạn.', { v0: delegation.delegateName })
      : t('Xóa bản ghi ủy quyền này?');
    if (!window.confirm(confirmMsg)) return;

    setRevokingId(delegation.id);
    try {
      await delegationService.revoke(delegation.id);
      pushToast(t('Đã thu hồi ủy quyền.'), 'success');
      load();
    } catch (err) {
      console.error('Revoke delegation failed:', err);
      pushToast(describeApiError(err, t, 'Không thu hồi được ủy quyền.'), 'error');
    } finally {
      setRevokingId(null);
    }
  };

  const COLS = [
    { key: 'person',    label: tab === 'mine' ? t('Người được ủy quyền') : t('Người ủy quyền') },
    { key: 'startDate', label: t('Ngày bắt đầu') },
    { key: 'endDate',   label: t('Ngày kết thúc') },
    { key: 'reason',    label: t('Lý do') },
    { key: 'status',    label: t('Trạng thái') },
    { key: 'actions',   label: t('Thao tác') },
  ];

  const data = tab === 'mine' ? myDelegations : toMeDelegations;

  const TABLE_ROWS = data.map((d) => ({
    id: d.id,
    person: tab === 'mine' ? d.delegateName : d.delegatorName,
    startDate: d.startDate,
    endDate: d.endDate,
    reason: d.reason,
    isActive: d.isActive,
    delegation: d,
  }));

  return (
    <section className="flex flex-col gap-4">
      {/* Tab header */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex bg-surface-container-lowest border border-outline-variant rounded-md overflow-hidden">
          {[
            { id: 'mine', label: t('Ủy quyền đã tạo'), count: myDelegations.length },
            { id: 'to-me', label: t('Ủy quyền nhận được'), count: toMeDelegations.length },
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => setTab(opt.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer flex items-center gap-2 ${
                tab === opt.id
                  ? 'bg-primary text-on-primary'
                  : 'text-secondary hover:text-on-surface hover:bg-surface-container-low'
              }`}
            >
              {opt.label}
              {opt.count > 0 && (
                <span
                  className={`inline-flex items-center justify-center min-w-[20px] h-5 rounded-full text-[11px] font-bold px-1.5 ${
                    tab === opt.id
                      ? 'bg-on-primary/20 text-on-primary'
                      : 'bg-primary/10 text-primary'
                  }`}
                >
                  {opt.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="ml-auto">
          <button
            onClick={() => setShowCreate(true)}
            className="bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-colors font-label-md px-4 py-2 rounded-md flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            {t('Tạo ủy quyền')}
          </button>
        </div>
      </div>

      {/* Info note */}
      {tab === 'mine' && (
        <div className="flex items-start gap-2 text-xs text-secondary bg-primary-container/20 border border-primary/20 rounded-lg px-3 py-2.5">
          <span className="material-symbols-outlined text-[16px] text-primary flex-shrink-0 mt-px">info</span>
          <span>
            {t('Bạn chỉ có thể có một ủy quyền đang hoạt động tại một thời điểm. Ủy quyền mới sẽ ghi đè ủy quyền cũ nếu có thời gian chồng chéo.')}
          </span>
        </div>
      )}

      {/* Table */}
      <div className="bg-surface border border-outline-variant rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-container-lowest text-[12px] uppercase tracking-wide text-secondary border-b border-outline-variant/60">
              {COLS.map((c) => (
                <th key={c.key} className="px-4 py-3 font-semibold">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={COLS.length} className="px-4 py-16 text-center text-secondary">
                  <span className="material-symbols-outlined text-[28px] block mb-2 animate-spin">progress_activity</span>
                  {t('Đang tải danh sách ủy quyền...')}
                </td>
              </tr>
            ) : TABLE_ROWS.length === 0 ? (
              <tr>
                <td colSpan={COLS.length} className="px-4 py-16 text-center text-secondary">
                  <span className="material-symbols-outlined text-[28px] block mb-2 opacity-40">assignment</span>
                  {tab === 'mine'
                    ? t('Bạn chưa tạo ủy quyền nào.')
                    : t('Bạn chưa nhận được ủy quyền nào.')}
                </td>
              </tr>
            ) : (
              TABLE_ROWS.map((row) => (
                <tr
                  key={row.id}
                  className="border-t border-outline-variant/60 hover:bg-surface-container-low/40 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-on-surface">{row.person || '—'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-on-surface">{FORMAT_DATE(row.startDate)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-on-surface">{FORMAT_DATE(row.endDate)}</div>
                  </td>
                  <td className="px-4 py-3 max-w-[200px]">
                    <div className="text-sm text-secondary truncate" title={row.reason}>
                      {row.reason || '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      isActive={row.isActive}
                      startDate={row.startDate}
                      endDate={row.endDate}
                    />
                  </td>
                  <td className="px-4 py-3">
                    {tab === 'mine' && (
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => handleRevoke(row.delegation)}
                          disabled={revokingId === row.id}
                          title={row.isActive ? t('Thu hồi ủy quyền') : t('Xóa bản ghi')}
                          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                            revokingId === row.id
                              ? 'text-outline opacity-40 cursor-not-allowed'
                              : 'text-secondary hover:text-error hover:bg-error-container/30'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {revokingId === row.id ? 'progress_activity' : 'delete'}
                          </span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <CreateDelegationModal
          onClose={() => setShowCreate(false)}
          onSuccess={load}
          pushToast={pushToast}
        />
      )}
    </section>
  );
}
