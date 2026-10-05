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
      /*
       * BE-147: input type="date" chỉ có NGÀY, không có giờ. Nếu dùng `new Date('2026-10-06')`
       * thì JS hiểu là nửa đêm theo UTC — ở múi giờ +07 người dùng chọn "bắt đầu hôm nay" nhưng
       * ủy quyền lại chỉ có hiệu lực từ 07:00 sáng, và "kết thúc ngày X" thì lại hết hạn từ 07:00
       * sáng ngày X. Nay hiểu đúng theo giờ địa phương: bắt đầu từ 00:00 ngày bắt đầu, kết thúc
       * vào cuối ngày (23:59:59) của ngày kết thúc.
       */
      const [sy, sm, sd] = String(startDate).split('-').map(Number);
      const [ey, em, ed] = String(endDate).split('-').map(Number);
      const startInstant = new Date(sy, sm - 1, sd, 0, 0, 0);
      const endInstant = new Date(ey, em - 1, ed, 23, 59, 59);

      const created = await delegationService.create({
        delegateId,
        startDate: startInstant.toISOString(),
        endDate: endInstant.toISOString(),
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

/* ─── Chip thông tin người (dùng chung, khai báo ngoài component để không tạo lại mỗi lần render) ── */
function PersonAvatar({ name, tone = 'primary', size = 'md' }) {
  return (
    <div
      className={`${size === 'sm' ? 'w-9 h-9 text-sm' : 'w-11 h-11 text-base'} rounded-full flex items-center justify-center font-bold flex-shrink-0 ${
        tone === 'primary' ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-on-surface'
      }`}
    >
      {(name || '?').trim().split(' ').pop()?.charAt(0).toUpperCase()}
    </div>
  );
}

/** Một mắt xích trong chuỗi "ai ủy quyền ai". */
function PersonChip({ label, name, tone, fallback = '—' }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <PersonAvatar name={name} tone={tone} size="sm" />
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wide text-secondary leading-tight">{label}</div>
        <div className="text-sm font-semibold text-on-surface truncate">{name || fallback}</div>
      </div>
    </div>
  );
}

/** Hình minh họa "ai duyệt thay ai" — SVG nội bộ, không cần tải ảnh từ ngoài. */
function DelegationIllustration() {
  return (
    <svg viewBox="0 0 320 132" className="w-full h-auto max-h-[132px]" role="img" aria-hidden="true">
      {/* người ủy quyền */}
      <circle cx="58" cy="56" r="26" className="fill-primary/10" />
      <circle cx="58" cy="46" r="10" className="fill-primary/60" />
      <path d="M40 74c4-10 10-15 18-15s14 5 18 15z" className="fill-primary/60" />
      <rect x="30" y="90" width="56" height="8" rx="4" className="fill-primary/20" />
      <rect x="38" y="102" width="40" height="7" rx="3.5" className="fill-primary/10" />

      {/* mũi tên chuyển quyền */}
      <path d="M108 58h36" strokeWidth="2.5" strokeLinecap="round" className="stroke-primary/50" strokeDasharray="5 5" />
      <path d="M146 58l-8-5v10z" className="fill-primary/60" />
      <rect x="112" y="24" width="36" height="22" rx="5" className="fill-primary/10" />
      <path d="M118 35l5 5 9-9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="stroke-primary" fill="none" />

      {/* người được ủy quyền */}
      <circle cx="212" cy="56" r="26" className="fill-primary/10" />
      <circle cx="212" cy="46" r="10" className="fill-primary/60" />
      <path d="M194 74c4-10 10-15 18-15s14 5 18 15z" className="fill-primary/60" />
      <rect x="184" y="90" width="56" height="8" rx="4" className="fill-primary/20" />
      <rect x="192" y="102" width="40" height="7" rx="3.5" className="fill-primary/10" />

      {/* lá chắn + lịch */}
      <path d="M268 30l16 6v14c0 10-7 17-16 21-9-4-16-11-16-21V36z" className="fill-primary/10" />
      <path d="M262 50l5 5 10-11" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="stroke-primary" fill="none" />
    </svg>
  );
}

/** Một bước trong quy trình ủy quyền. */
function StepCard({ index, icon, title, desc }) {
  return (
    <div className="flex gap-3 rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-3.5 py-3 h-full">
      <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
        <span className="w-7 h-7 rounded-full bg-primary text-on-primary text-xs font-bold flex items-center justify-center">
          {index}
        </span>
        <span className="material-symbols-outlined text-[18px] text-primary">{icon}</span>
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-on-surface">{title}</div>
        <p className="text-xs text-secondary leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

/** Một dòng hỏi–đáp gọn trong khối FAQ. */
function FaqRow({ q, a }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="material-symbols-outlined text-[16px] text-primary flex-shrink-0 mt-px">quiz</span>
      <div className="min-w-0">
        <div className="text-xs font-semibold text-on-surface">{q}</div>
        <p className="text-xs text-secondary leading-relaxed">{a}</p>
      </div>
    </div>
  );
}

/** Dòng ghi chú ngắn trong panel phụ. */
function TipRow({ icon, text }) {
  return (
    <p className="flex items-start gap-2 text-xs text-on-surface-variant">
      <span className="material-symbols-outlined text-[15px] text-primary flex-shrink-0 mt-px">{icon}</span>
      <span>{text}</span>
    </p>
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

  return (
    <section className="flex flex-col gap-3 w-full max-w-[1280px] mx-auto flex-1 min-h-full">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-stretch">
        {/* Ủy quyền của tôi */}
        <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-outline-variant/50">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">swap_horiz</span>
              <h2 className="text-sm font-semibold text-on-surface">{t('Ủy quyền của tôi')}</h2>
            </div>
            {current && (
              <StatusBadge isActive={current.isActive} startDate={current.startDate} endDate={current.endDate} />
            )}
          </div>

          {loading ? (
            <div className="px-4 py-8 text-center text-secondary text-sm">
              <span className="material-symbols-outlined text-[24px] block mb-1.5 animate-spin">progress_activity</span>
              {t('Đang tải...')}
            </div>
          ) : current ? (
            /* Gọn trong MỘT hàng: ai ủy quyền ai · thời gian · thao tác */
            <div className="px-4 py-3.5 flex flex-wrap items-center gap-x-3 gap-y-3">
              <PersonChip label={t('Người ủy quyền')} name={t('Bạn')} tone="neutral" />

              <div className="flex items-center gap-1 text-primary flex-shrink-0">
                <span className="w-6 h-px bg-primary/30" />
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                <span className="w-6 h-px bg-primary/30" />
              </div>

              <PersonChip label={t('Người được ủy quyền')} name={current.delegateName} />

              <div className="flex items-center gap-2 ml-auto flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-on-surface bg-surface-container-lowest border border-outline-variant/60 rounded-full px-3 py-1.5 whitespace-nowrap">
                  <span className="material-symbols-outlined text-[15px] text-secondary">event</span>
                  {FORMAT_DATE(current.startDate)} — {FORMAT_DATE(current.endDate)}
                </span>
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

              {current.reason && (
                <p className="w-full text-xs text-secondary truncate" title={current.reason}>
                  {t('Lý do')}: {current.reason}
                </p>
              )}
            </div>
          ) : (
            <div className="px-4 py-3.5 flex flex-wrap items-center gap-3">
              <span className="material-symbols-outlined text-primary text-[22px]">person_add</span>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-on-surface">{t('Chưa ủy quyền cho ai')}</div>
                <div className="text-xs text-secondary">
                  {t('Chọn một người duyệt đơn thay bạn trong khoảng thời gian bạn vắng mặt.')}
                </div>
              </div>
              <button
                onClick={() => setShowCreate(true)}
                className="ml-auto bg-primary text-on-primary hover:bg-primary/90 transition-colors text-sm font-medium px-4 py-2 rounded-md flex items-center gap-2 shadow-sm cursor-pointer whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                {t('Tạo ủy quyền')}
              </button>
            </div>
          )}
        </div>

        {/* Phạm vi ủy quyền — nói rõ đây CHỈ là duyệt đơn thay, không phải nâng quyền */}
        <aside className="bg-primary-container/15 border border-primary/20 rounded-xl px-4 py-3.5 flex flex-col gap-2.5">
          <div className="flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined text-[18px]">policy</span>
            <h3 className="text-sm font-semibold">{t('Phạm vi ủy quyền')}</h3>
          </div>
          <p className="flex items-start gap-2 text-xs text-on-surface-variant">
            <span className="material-symbols-outlined text-[15px] text-primary flex-shrink-0 mt-px">check_circle</span>
            {t('Chỉ áp dụng cho việc DUYỆT ĐƠN thay bạn trong khoảng thời gian trên.')}
          </p>
          <p className="flex items-start gap-2 text-xs text-on-surface-variant">
            <span className="material-symbols-outlined text-[15px] text-primary flex-shrink-0 mt-px">shield_person</span>
            {t('Người được ủy quyền KHÔNG được cấp thêm quyền, không đổi vai trò, không vào được Cấu hình hệ thống.')}
          </p>
          <p className="flex items-start gap-2 text-xs text-on-surface-variant">
            <span className="material-symbols-outlined text-[15px] text-primary flex-shrink-0 mt-px">history</span>
            {t('Lịch sử ủy quyền do bộ phận Nhân sự ghi nhận.')}
          </p>
        </aside>
      </div>

      {/* Đang duyệt thay người khác (chỉ hiện khi có) */}
      {!loading && received.length > 0 && (
        <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-outline-variant/50">
            <span className="material-symbols-outlined text-primary text-[20px]">assignment_ind</span>
            <h3 className="text-sm font-semibold text-on-surface">{t('Bạn đang duyệt thay')}</h3>
            <span className="text-[11px] text-secondary ml-auto">{received.length}</span>
          </div>
          <div className="divide-y divide-outline-variant/40">
            {received.map((d) => (
              <div key={d.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
                <PersonChip label={t('Người ủy quyền')} name={d.delegatorName} />
                <span className="material-symbols-outlined text-[18px] text-secondary">arrow_forward</span>
                <PersonChip label={t('Người được ủy quyền')} name={t('Bạn')} tone="neutral" />
                <span className="inline-flex items-center gap-1.5 text-xs text-secondary bg-surface-container-lowest border border-outline-variant/60 rounded-full px-3 py-1.5 whitespace-nowrap ml-auto">
                  <span className="material-symbols-outlined text-[15px]">event</span>
                  {FORMAT_DATE(d.startDate)} — {FORMAT_DATE(d.endDate)}
                </span>
                <StatusBadge isActive={d.isActive} startDate={d.startDate} endDate={d.endDate} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hướng dẫn 3 bước */}
      <div className="bg-surface border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-outline-variant/50">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">route</span>
            <h3 className="text-sm font-semibold text-on-surface">{t('Ủy quyền hoạt động thế nào?')}</h3>
          </div>
          <span className="text-[11px] text-secondary">{t('3 bước')}</span>
        </div>
        <div className="grid gap-3 p-4 md:grid-cols-3 items-stretch">
          <StepCard
            index={1}
            icon="person_search"
            title={t('Chọn người duyệt thay')}
            desc={t('Chọn một nhân sự đủ thẩm quyền duyệt đơn của bạn trong khoảng thời gian bạn vắng mặt.')}
          />
          <StepCard
            index={2}
            icon="swap_horiz"
            title={t('Người đó duyệt đơn thay bạn')}
            desc={t('Đơn của bạn được chuyển đúng cho người nhận ủy quyền; lịch sử ghi rõ "duyệt thay".')}
          />
          <StepCard
            index={3}
            icon="event_busy"
            title={t('Tự động hết hiệu lực')}
            desc={t('Hết khoảng thời gian đã đặt, quyền duyệt thay tự chấm dứt, không cần thao tác thêm.')}
          />
        </div>
      </div>

      {/* Câu hỏi thường gặp · Giới hạn quyền hạn */}
      <div className="grid gap-3 lg:grid-cols-2 items-stretch">
        <div className="bg-surface border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-outline-variant/50">
            <span className="material-symbols-outlined text-primary text-[20px]">help</span>
            <h3 className="text-sm font-semibold text-on-surface">{t('Câu hỏi thường gặp')}</h3>
          </div>
          <div className="flex-1 flex flex-col justify-center gap-3 px-4 py-3.5">
            <FaqRow
              q={t('Ai có thể được ủy quyền?')}
              a={t('Một nhân sự đủ thẩm quyền duyệt đơn của bạn — không thể chọn chính bạn.')}
            />
            <FaqRow
              q={t('Đơn đang chờ duyệt có tự chuyển cho người nhận ủy quyền?')}
              a={t('Có. Đơn phát sinh trong khoảng thời gian ủy quyền sẽ do người được ủy quyền xử lý.')}
            />
            <FaqRow
              q={t('Ủy quyền xong tôi có mất quyền duyệt?')}
              a={t('Không. Bạn vẫn duyệt đơn của mình bình thường trong thời gian ủy quyền.')}
            />
            <FaqRow
              q={t('Khi nào nên thu hồi?')}
              a={t('Khi bạn trở lại sớm hơn dự kiến hoặc muốn đổi người duyệt thay.')}
            />
          </div>
        </div>

        <div className="bg-surface border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-outline-variant/50">
            <span className="material-symbols-outlined text-primary text-[20px]">fact_check</span>
            <h3 className="text-sm font-semibold text-on-surface">{t('Người nhận ủy quyền được làm gì?')}</h3>
          </div>
          <div className="flex-1 grid sm:grid-cols-2 gap-4 px-4 py-3.5 items-center">
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-success flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px]">check_circle</span>
                {t('Được phép')}
              </span>
              {[
                t('Duyệt hoặc từ chối đơn thay bạn'),
                t('Yêu cầu bổ sung thông tin'),
                t('Xem các đơn cần duyệt thay bạn'),
              ].map((s) => (
                <span key={s} className="flex items-start gap-2 text-xs text-on-surface-variant">
                  <span className="material-symbols-outlined text-[15px] text-success flex-shrink-0 mt-px">done</span>
                  {s}
                </span>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-error flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px]">block</span>
                {t('Không được phép')}
              </span>
              {[
                t('Cấp thêm quyền hoặc đổi vai trò'),
                t('Vào Cấu hình hệ thống'),
                t('Tạo đơn mới thay bạn'),
              ].map((s) => (
                <span key={s} className="flex items-start gap-2 text-xs text-on-surface-variant">
                  <span className="material-symbols-outlined text-[15px] text-error flex-shrink-0 mt-px">close</span>
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Khối cuối giãn theo chiều cao còn lại để trang không hở mảng trắng lớn */}
      <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] items-stretch flex-1 min-h-[150px]">
        <aside className="bg-primary-container/15 border border-primary/20 rounded-xl px-4 py-3.5 flex flex-col items-center justify-center gap-2.5 text-center">
          <DelegationIllustration />
          <p className="text-xs text-on-surface-variant max-w-[260px]">
            {t('Ủy quyền chỉ chuyển quyền DUYỆT ĐƠN, không chuyển vai trò hay quyền hệ thống.')}
          </p>
        </aside>
        <div className="bg-surface border border-outline-variant rounded-xl shadow-sm px-4 py-3.5 flex flex-col justify-center gap-2.5">
          <TipRow icon="schedule" text={t('Thời hạn ủy quyền không vượt quá ngày kết thúc bạn đặt.')} />
          <TipRow icon="looks_one" text={t('Mỗi thời điểm chỉ một người duyệt thay; tạo mới sẽ tự thu hồi ủy quyền cũ.')} />
          <TipRow icon="verified_user" text={t('Mọi thao tác duyệt thay đều được ghi vào nhật ký hệ thống.')} />
          <TipRow icon="support_agent" text={t('Cần đổi người hoặc thu hồi gấp? Liên hệ bộ phận Nhân sự.')} />
        </div>
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
