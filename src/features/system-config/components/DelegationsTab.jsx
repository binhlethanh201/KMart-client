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
              type="button"
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
                  type="button"
                  onClick={() => { onChange(u.id, u); setOpen(false); setSearch(''); }}
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
export function CreateDelegationModal({ onClose, onSuccess, pushToast, defaultStartDate = null }) {
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
  /** BE-143: giữ luôn TÊN người được ủy quyền để thông báo kết quả nêu đúng người vừa chọn. */
  const [delegateName, setDelegateName] = useState('');
  /* BE-146: "ủy quyền tạm thời" tạo nhanh từ sidebar bắt đầu NGAY HÔM NAY (defaultStartDate). */
  const [startDate, setStartDate] = useState(defaultStartDate || tomorrow);
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
      const created = await delegationService.create({
        delegateId,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        reason: reason.trim() || undefined,
      });
      // BE-143: máy chủ chỉ cho phép MỘT người được ủy quyền tại một thời điểm, nên khi tạo cái mới
      // thì ủy quyền cũ (nếu có) đã bị thu hồi tự động — báo rõ để người dùng không bị bất ngờ.
      const superseded = Number(created?.supersededCount) || 0;
      pushToast(
        superseded > 0
          ? t('Đã tạo ủy quyền mới cho "{v0}". {v1} ủy quyền trước đó đã được thu hồi (mỗi lúc chỉ có một người được ủy quyền).', { v0: delegateName, v1: superseded })
          : t('Đã tạo ủy quyền thành công.'),
        'success'
      );
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
              onChange={(id, user) => {
                setDelegateId(id);
                setDelegateName(user?.name || '');
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
  const { pushToast } = useApproval();

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

  // Chỉ quan tâm ủy quyền CÒN HIỆU LỰC (đang chạy hoặc sắp tới). Lịch sử/log do bên Nhân sự ghi nhận.
  const isLive = (d) => d?.isActive && (!d.endDate || new Date(d.endDate) >= new Date());
  const current = myDelegations.find(isLive) || null;
  const received = toMeDelegations.filter(isLive);

  const Avatar = ({ name, tone = 'primary' }) => (
    <div
      className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0 ${
        tone === 'primary' ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-on-surface'
      }`}
    >
      {(name || '?').trim().split(' ').pop()?.charAt(0).toUpperCase()}
    </div>
  );

  return (
    <section className="flex flex-col gap-4 max-w-3xl">
      {/* Ủy quyền của tôi */}
      <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-outline-variant/50">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">swap_horiz</span>
            <h2 className="text-base font-semibold text-on-surface">{t('Ủy quyền của tôi')}</h2>
          </div>
          {current && (
            <StatusBadge isActive={current.isActive} startDate={current.startDate} endDate={current.endDate} />
          )}
        </div>

        {loading ? (
          <div className="px-5 py-12 text-center text-secondary text-sm">
            <span className="material-symbols-outlined text-[28px] block mb-2 animate-spin">progress_activity</span>
            {t('Đang tải...')}
          </div>
        ) : current ? (
          <div className="p-5 flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar name={t('Bạn')} tone="neutral" />
                <div className="min-w-0">
                  <div className="text-[11px] uppercase tracking-wide text-secondary">{t('Người ủy quyền')}</div>
                  <div className="text-sm font-semibold text-on-surface">{t('Bạn')}</div>
                </div>
              </div>
              <div className="flex-1 flex items-center gap-2 text-primary">
                <div className="flex-1 h-px bg-primary/30" />
                <span className="material-symbols-outlined">arrow_forward</span>
                <div className="flex-1 h-px bg-primary/30" />
              </div>
              <div className="flex items-center gap-3 min-w-0">
                <Avatar name={current.delegateName} />
                <div className="min-w-0">
                  <div className="text-[11px] uppercase tracking-wide text-secondary">{t('Người được ủy quyền')}</div>
                  <div className="text-sm font-semibold text-on-surface truncate">{current.delegateName || '—'}</div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-container-lowest border border-outline-variant/60 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-on-surface">
                <span className="material-symbols-outlined text-[18px] text-secondary">event</span>
                {FORMAT_DATE(current.startDate)} — {FORMAT_DATE(current.endDate)}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCreate(true)}
                  className="text-sm font-medium text-primary hover:bg-primary/10 px-3 py-1.5 rounded-md transition-colors cursor-pointer"
                >
                  {t('Đổi người')}
                </button>
                <button
                  onClick={() => handleRevoke(current)}
                  disabled={revokingId === current.id}
                  className="text-sm font-medium text-error hover:bg-error-container/30 px-3 py-1.5 rounded-md transition-colors cursor-pointer disabled:opacity-40"
                >
                  {revokingId === current.id ? t('Đang thu hồi...') : t('Thu hồi')}
                </button>
              </div>
            </div>
            {current.reason && (
              <p className="text-xs text-secondary -mt-2">{t('Lý do')}: {current.reason}</p>
            )}
          </div>
        ) : (
          <div className="px-5 py-10 flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px]">person_add</span>
            </div>
            <div>
              <div className="text-sm font-semibold text-on-surface">{t('Chưa ủy quyền cho ai')}</div>
              <div className="text-xs text-secondary mt-1">
                {t('Chọn một người duyệt đơn thay bạn trong khoảng thời gian bạn vắng mặt.')}
              </div>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="bg-primary text-on-primary hover:bg-primary/90 transition-colors text-sm font-medium px-4 py-2 rounded-md flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              {t('Tạo ủy quyền')}
            </button>
          </div>
        )}
      </div>

      {/* Đang duyệt thay người khác (chỉ hiện khi có) */}
      {!loading && received.length > 0 && (
        <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-outline-variant/50">
            <span className="material-symbols-outlined text-primary text-[20px]">assignment_ind</span>
            <h3 className="text-sm font-semibold text-on-surface">{t('Bạn đang duyệt thay')}</h3>
          </div>
          <div className="divide-y divide-outline-variant/40">
            {received.map((d) => (
              <div key={d.id} className="flex items-center gap-3 px-5 py-3">
                <Avatar name={d.delegatorName} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-on-surface truncate">{d.delegatorName || '—'}</div>
                  <div className="text-xs text-secondary">
                    {FORMAT_DATE(d.startDate)} — {FORMAT_DATE(d.endDate)}
                  </div>
                </div>
                <StatusBadge isActive={d.isActive} startDate={d.startDate} endDate={d.endDate} />
              </div>
            ))}
          </div>
        </div>
      )}

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
