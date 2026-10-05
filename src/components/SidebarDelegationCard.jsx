import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { delegationService } from '../services/delegationService';
import { useApproval } from '../context/useApproval';
import { useI18n } from '../i18n/I18nProvider';
import { CreateDelegationModal } from '../features/system-config/components/DelegationsTab';

/*
 * BE-146: thẻ "Ủy quyền tạm thời" trên sidebar trái.
 * - Khi CHƯA có ủy quyền hiệu lực: nút tạo nhanh ủy quyền tạm thời (bắt đầu ngay hôm nay).
 * - Khi ĐANG có: hiện người được ủy quyền + thời gian hết hạn, bấm vào sang trang quản lý.
 */

const formatDate = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export default function SidebarDelegationCard({ isCollapsed }) {
  const { t } = useI18n();
  const { pushToast, hasPermission } = useApproval();
  const [delegations, setDelegations] = useState([]);
  const [showCreate, setShowCreate] = useState(false);

  // Chỉ người có quyền duyệt đơn mới cần ủy quyền duyệt thay (giống mục "Ủy quyền" trên rail).
  const canDelegate = typeof hasPermission === 'function'
    ? hasPermission('APPLICATION_APPROVE')
    : true;

  const load = useCallback(() => {
    delegationService.getMine()
      .then((list) => setDelegations(Array.isArray(list) ? list : []))
      .catch(() => setDelegations([]));
  }, []);

  useEffect(() => { if (canDelegate) load(); }, [canDelegate, load]);

  const today = useMemo(() => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }, []);

  /** Ủy quyền ĐANG có hiệu lực (đã bắt đầu, chưa hết hạn, chưa thu hồi). */
  const activeDelegation = useMemo(() => {
    const now = new Date();
    return delegations.find((d) => d.isActive
      && new Date(d.startDate) <= now
      && new Date(d.endDate) >= now) || null;
  }, [delegations]);

  /** Ủy quyền sắp tới (chưa đến ngày bắt đầu) — vẫn đáng hiển thị để người dùng biết. */
  const upcomingDelegation = useMemo(() => {
    if (activeDelegation) return null;
    const now = new Date();
    return delegations.find((d) => d.isActive && new Date(d.startDate) > now) || null;
  }, [delegations, activeDelegation]);

  const shown = activeDelegation || upcomingDelegation;

  if (!canDelegate) return null;

  if (isCollapsed) {
    return (
      <div className="px-3 py-2 border-t border-white/10 flex justify-center">
        <Link
          to="/delegations"
          title={shown
            ? `${t('Ủy quyền tạm thời')}: ${shown.delegateName || ''} — ${t('Hết hạn')} ${formatDate(shown.endDate)}`
            : t('Ủy quyền tạm thời')}
          className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">assignment_ind</span>
          {activeDelegation && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-success shadow-[0_0_6px_rgba(34,197,94,0.8)]" />
          )}
        </Link>
      </div>
    );
  }

  return (
    <div className="px-3 py-2.5 border-t border-white/10">
      <div className="rounded-lg bg-white/5 border border-white/10 p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-slate-500 font-semibold min-w-0">
            <span className="material-symbols-outlined text-[14px] flex-shrink-0">assignment_ind</span>
            <span className="truncate">{t('Ủy quyền tạm thời')}</span>
          </span>
          {!shown && (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              title={t('Tạo ủy quyền tạm thời')}
              className="flex-shrink-0 w-6 h-6 rounded-md bg-primary/15 text-primary hover:bg-primary hover:text-on-primary flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">add</span>
            </button>
          )}
        </div>

        {shown ? (
          <Link to="/delegations" className="block mt-1.5 group">
            <p className="text-xs font-semibold text-white truncate group-hover:text-primary transition-colors">
              {shown.delegateName || t('Người được ủy quyền')}
            </p>
            <p className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
              <span className="material-symbols-outlined text-[12px]">schedule</span>
              {activeDelegation
                ? <>{t('Hết hạn')}: <span className="text-warning font-semibold">{formatDate(shown.endDate)}</span></>
                : <>{t('Bắt đầu')}: {formatDate(shown.startDate)}</>}
            </p>
            {activeDelegation && (
              <span className="inline-flex items-center gap-1 mt-1.5 px-1.5 py-0.5 rounded-full bg-success/15 text-success text-[10px] font-bold uppercase tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-success" />
                {t('Đang hoạt động')}
              </span>
            )}
          </Link>
        ) : (
          <p className="text-[11px] text-slate-500 mt-1.5 leading-snug">
            {t('Chưa có ủy quyền. Tạo ủy quyền tạm thời để người khác duyệt đơn thay bạn.')}
          </p>
        )}
      </div>

      {showCreate && (
        <CreateDelegationModal
          defaultStartDate={today}
          onClose={() => setShowCreate(false)}
          onSuccess={load}
          pushToast={pushToast}
        />
      )}
    </div>
  );
}
