import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { delegationService, onDelegationsChanged } from '../services/delegationService';
import { useApproval } from '../context/useApproval';
import { useI18n } from '../i18n/I18nProvider';
import { isApproverAccount } from '../utils/approverAccounts';
import { CreateDelegationModal } from '../features/system-config/components/DelegationsTab';

/*
 * BE-146: thẻ "Ủy quyền tạm thời" trên sidebar trái.
 *
 * BE-148: hiển thị cho MỌI cấp có thể duyệt đơn (không chỉ HR/Admin/Giám đốc) và cho cả người
 * ĐƯỢC người khác ủy quyền:
 *   - Cấp duyệt đơn (có quyền APPLICATION_APPROVE hoặc vai trò MANAGER/TEAM_LEADER/BOARD/…)
 *     → thấy thẻ, có nút tạo ủy quyền khi chưa ủy quyền cho ai.
 *   - Ai đang ĐƯỢC ủy quyền (kể cả nhân viên) → thẻ hiện "Đã được <ai> ủy quyền".
 */

const formatDate = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

/** Ủy quyền còn hiệu lực (đang chạy) hoặc sắp tới; đã thu hồi/hết hạn thì bỏ qua. */
const pickLive = (list) => {
  const now = new Date();
  const live = (list || []).filter((d) => d?.isActive && d.endDate && new Date(d.endDate) >= now);
  if (!live.length) return { active: null, upcoming: null, count: 0 };
  const active = live.find((d) => new Date(d.startDate) <= now) || null;
  const upcoming = active ? null : live.find((d) => new Date(d.startDate) > now) || null;
  return { active, upcoming, count: live.length };
};

export default function SidebarDelegationCard({ isCollapsed }) {
  const { t } = useI18n();
  const { pushToast, hasPermission, currentUser } = useApproval();
  const location = useLocation();
  const [mine, setMine] = useState([]);
  const [toMe, setToMe] = useState([]);
  const [showCreate, setShowCreate] = useState(false);

  // Ai được coi là "cấp duyệt đơn": có quyền duyệt, HOẶC giữ vai trò quản lý/trưởng nhóm/…
  const canApprove = useMemo(
    () => isApproverAccount(currentUser, hasPermission),
    [currentUser, hasPermission],
  );

  const load = useCallback(() => {
    Promise.all([delegationService.getMine(), delegationService.getToMe()])
      .then(([my, received]) => {
        setMine(Array.isArray(my) ? my : []);
        setToMe(Array.isArray(received) ? received : []);
      })
      .catch(() => {
        setMine([]);
        setToMe([]);
      });
  }, []);

  // BE-147: tải lại khi đổi trang và mỗi khi có thao tác tạo/thu hồi ủy quyền ở bất kỳ màn hình nào.
  useEffect(() => { load(); }, [load, location.pathname]);
  useEffect(() => onDelegationsChanged(load), [load]);

  const today = useMemo(() => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }, []);

  /** Ủy quyền TÔI đã tạo cho người khác. */
  const gave = useMemo(() => pickLive(mine), [mine]);
  /** Ủy quyền NGƯỜI KHÁC tạo cho tôi. */
  const received = useMemo(() => pickLive(toMe), [toMe]);

  const givenShown = gave.active || gave.upcoming;
  const receivedShown = received.active || received.upcoming;

  // Thẻ hiện với người có thể duyệt đơn, hoặc người đang dính tới một ủy quyền nào đó
  // (ví dụ nhân viên được cấp trên ủy quyền duyệt thay).
  if (!canApprove && !givenShown && !receivedShown) return null;

  if (isCollapsed) {
    const label = givenShown
      ? `${t('Ủy quyền tạm thời')}: ${givenShown.delegateName || ''} — ${t('Hết hạn')} ${formatDate(givenShown.endDate)}`
      : receivedShown
        ? `${t('Đã được ủy quyền')}: ${receivedShown.delegatorName || ''}`
        : t('Ủy quyền tạm thời');
    return (
      <div className="px-3 py-2 border-t border-white/10 flex justify-center">
        <Link
          to="/delegations"
          title={label}
          className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">assignment_ind</span>
          {(gave.active || received.active) && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-success shadow-[0_0_6px_rgba(34,197,94,0.8)]" />
          )}
        </Link>
      </div>
    );
  }

  const statusBadge = (isActiveNow) => (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
      isActiveNow ? 'bg-success/15 text-success' : 'bg-primary/15 text-primary'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isActiveNow ? 'bg-success' : 'bg-primary'}`} />
      {isActiveNow ? t('Đang hoạt động') : t('Sắp tới')}
    </span>
  );

  const range = (d, isActiveNow) => (
    <p className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
      <span className="material-symbols-outlined text-[12px]">schedule</span>
      {isActiveNow
        ? <>{t('Hết hạn')}: <span className="text-warning font-semibold">{formatDate(d.endDate)}</span></>
        : <>{t('Bắt đầu')}: {formatDate(d.startDate)}</>}
    </p>
  );

  return (
    <div className="px-3 py-2.5 border-t border-white/10">
      <div className="rounded-lg bg-white/5 border border-white/10 p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-slate-500 font-semibold min-w-0">
            <span className="material-symbols-outlined text-[14px] flex-shrink-0">assignment_ind</span>
            <span className="truncate">{t('Ủy quyền tạm thời')}</span>
          </span>
          {canApprove && !givenShown && (
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

        {/* Tôi ủy quyền cho ai */}
        {givenShown && (
          <Link to="/delegations" className="block mt-1.5 group">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">{t('Đã ủy quyền cho')}</p>
            <p className="text-xs font-semibold text-white truncate group-hover:text-primary transition-colors">
              {givenShown.delegateName || t('Người được ủy quyền')}
            </p>
            {range(givenShown, Boolean(gave.active))}
            {statusBadge(Boolean(gave.active))}
          </Link>
        )}

        {/* Tôi được ai ủy quyền */}
        {receivedShown && (
          <Link
            to="/delegations"
            className={`block group ${givenShown ? 'mt-2 pt-2 border-t border-white/10' : 'mt-1.5'}`}
          >
            <p className="text-[10px] uppercase tracking-wide text-slate-500">{t('Đã được ủy quyền')}</p>
            <p className="text-xs font-semibold text-white truncate group-hover:text-primary transition-colors">
              {receivedShown.delegatorName || t('Người ủy quyền')}
            </p>
            {range(receivedShown, Boolean(received.active))}
            <span className="flex items-center gap-1.5">
              {statusBadge(Boolean(received.active))}
              {received.count > 1 && (
                <span className="text-[10px] text-slate-500">+{received.count - 1}</span>
              )}
            </span>
          </Link>
        )}

        {!givenShown && !receivedShown && (
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
