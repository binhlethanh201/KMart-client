import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApproval } from '../../../context/useApproval';
import { useHr } from '../../hr/context/HrProvider';
import { STATUS_META } from '../data/constants';
import { useI18n } from '../../../i18n/I18nProvider';

// Status-driven request card. Clicking navigates to the detail page.
export default function RequestCard({ request: r }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { canApprove, departments } = useApproval();
  const { employees } = useHr();
  const [isExpanded, setIsExpanded] = useState(false);

  // BE-16: phòng ban mà đơn nhắm tới (Data.departments) -> hiện rõ "đơn phòng nào"
  const targetDeptCodes = (() => {
    const ids = r._rawData?.departments;
    if (!Array.isArray(ids) || ids.length === 0) return [];
    return ids
      .map((id) => (departments || []).find((d) => d.id === id))
      .filter(Boolean)
      .map((d) => d.code || d.name);
  })();

  const meta = STATUS_META[r.status] || { badge: 'bg-surface-container text-on-surface', dot: 'bg-outline', label: t('Không rõ') };

  // Use creator name directly from API if available, fallback to search in employees
  const creatorEmp = employees.find((u) => u.id === r.creatorId);
  const creatorName = r.creatorName || creatorEmp?.name || t('Người gửi ẩn danh');
  const creatorAvatar = creatorEmp?.avatar;
  const isActionable = canApprove(r);
  
  const isPending = r.status === 'pending' || r.status === 'submitted' || r.status === 'pendingapproval';
  const isApproved = r.status === 'approved';
  const isRejected = r.status === 'rejected' || r.status === 'returned_timeout' || r.status === 'canceled';
  const isNeedsSupplement = r.status === 'needssupplement';

  const getInitials = (name) => {
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  // Determine current actor for the right side summary
  let currentActorStep = null;
  let summaryText = t('Không rõ');
  let summaryColor = 'text-secondary';
  let statusIcon = 'horizontal_rule';

  if (r.status === 'returned_timeout') {
    const timeoutIndex = r.steps.findIndex(s => ['pending', 'submitted', 'pendingapproval'].includes((s.status || '').toLowerCase())) >= 0
      ? r.steps.findIndex(s => ['pending', 'submitted', 'pendingapproval'].includes((s.status || '').toLowerCase()))
      : Math.min(Number(r.currentStep) || 0, r.steps.length - 1);
    currentActorStep = r.steps[timeoutIndex] || r.steps[r.steps.length - 1];
    summaryText = t('Quá hạn 12h');
    summaryColor = 'text-error';
    statusIcon = 'close';
  } else if (isPending) {
    currentActorStep = r.steps.find(s => s.status === 'pending' || s.status === 'submitted' || s.status === 'pendingapproval');
    summaryText = t('Đang chờ duyệt');
    summaryColor = 'text-warning';
    statusIcon = 'schedule';
  } else if (isApproved) {
    currentActorStep = r.steps[r.steps.length - 1];
    summaryText = t('Đã hoàn thành');
    summaryColor = 'text-success';
    statusIcon = 'check';
  } else if (isRejected) {
    currentActorStep = r.steps.find(s => s.status === 'rejected' || s.status === 'canceled') || r.steps[r.steps.length - 1];
    summaryText = r.status === 'canceled' ? t('Đã hủy') : t('Đã từ chối');
    summaryColor = 'text-error';
    statusIcon = 'close';
  } else if (isNeedsSupplement) {
    // BE-06: đơn đang chờ NGƯỜI GỬI bổ sung - trước đây hiện "Không rõ"
    currentActorStep = null;
    summaryText = t('Yêu cầu bổ sung');
    summaryColor = 'text-warning';
    statusIcon = 'edit_note';
  }

  // BE-06: với đơn cần bổ sung, người phải hành động là người gửi nên không lấy step nào cả
  if (isNeedsSupplement) {
    currentActorStep = null;
  } else if (!currentActorStep && r.steps.length > 0) {
    // If no step is found (e.g. no steps defined yet or all steps approved but request is not), fallback
    currentActorStep = r.steps[0];
  }

  const currentActorUser = isNeedsSupplement
    ? { name: creatorName, avatar: creatorAvatar }
    : (currentActorStep ? employees.find(x => x.id === currentActorStep.approverId) : null);
  const currentActorName = currentActorUser?.name || t('Người duyệt');
  const currentActorAvatar = currentActorUser?.avatar;
  let currentActorRole = isNeedsSupplement ? t('NGƯỜI GỬI') : t('NGƯỜI DUYỆT');
  if (!isNeedsSupplement && currentActorUser) {
     if (currentActorUser.role === 'ADMIN') currentActorRole = t('QUẢN TRỊ VIÊN');
     else if (currentActorUser.role === 'HR') currentActorRole = t('NHÂN SỰ');
     else if (currentActorUser.role === 'MANAGER') currentActorRole = t('QUẢN LÝ');
     else if (currentActorUser.department) currentActorRole = currentActorUser.department;
     else if (currentActorUser.position) currentActorRole = currentActorUser.position;
  }

  // BE-23: lấy danh sách người duyệt của bước liên quan để hiển thị ĐỦ số người
  // (cả đơn đang chờ LẪN đơn đã duyệt/từ chối) thay vì chỉ 1 người đại diện.
  const actorApproverIds = currentActorStep
    ? (currentActorStep.approverIds?.length
      ? currentActorStep.approverIds
      : (currentActorStep.approverId ? [currentActorStep.approverId] : []))
    : [];
  const actorApprovers = actorApproverIds
    .map((id) => employees.find((x) => x.id === id))
    .filter(Boolean)
    .map((u) => ({ id: u.id, name: u.name, avatar: u.avatar }));
  const isMultiApprover = actorApprovers.length > 1;

  // BE-24/25: với đơn TỪ CHỐI -> "ai từ chối · bước nào".
  // Ưu tiên nhật ký; đơn cũ thiếu nhật ký thì `step.approverId` chính là người đã bấm từ chối.
  const rejectHistory = (r.histories || []).filter(h => h.action === 'rejected').slice(-1)[0];
  const rejectedStep = r.steps.find(s => s.status === 'rejected');
  const rejectedByUser = employees.find(x => x.id === (rejectHistory?.userId || rejectedStep?.approverId));
  const rejectedStepOrder = rejectHistory?.stepOrder || rejectedStep?.stepOrder;

  // BE-25: chức vụ/phòng ban của người thực hiện để hiện dưới tên
  const roleLabel = (u) => {
    if (!u) return '';
    if (u.role === 'ADMIN') return t('QUẢN TRỊ VIÊN');
    if (u.role === 'HR') return t('NHÂN SỰ');
    if (u.role === 'MANAGER') return t('QUẢN LÝ');
    if (u.role === 'TEAM_LEADER') return t('TRƯỞNG NHÓM');
    if (u.department) return u.department;
    if (u.position) return u.position;
    return '';
  };

  // BE-24/25: với đơn BỔ SUNG -> "ai yêu cầu bổ sung · bước nào".
  // Ưu tiên nhật ký SUPPLEMENT_REQUESTED; đơn cũ không có thì lấy comment; cuối cùng lấy người giữ bước.
  const suppHistory = (r.histories || []).filter(h => h.action === 'supplement_requested').slice(-1)[0];
  const suppComment = (r.comments || []).find(c => (c.text || '').startsWith('[Yêu cầu bổ sung]'));
  const suppStep = r.steps.find(s => s.status === 'pending' || s.status === 'submitted' || s.status === 'pendingapproval');
  const suppUserId = suppHistory?.userId || suppComment?.userId || suppStep?.approverId;
  const suppStepOrder = suppHistory?.stepOrder || suppStep?.stepOrder;
  const suppByUser = employees.find(x => x.id === suppUserId);

  return (
    <div className={`bg-surface rounded-xl shadow-sm border border-outline-variant hover:shadow-md hover:border-primary/30 transition-all flex flex-col relative overflow-hidden group ${isRejected ? 'opacity-80' : ''}`}>
      
      {/* Left border indicators */}
      {isActionable && <div className="absolute left-0 top-0 bottom-0 w-1 bg-warning z-10 pointer-events-none"></div>}
      {!isActionable && isPending && <div className="absolute left-0 top-0 bottom-0 w-1 bg-warning/40 z-10 pointer-events-none"></div>}
      {isApproved && <div className="absolute left-0 top-0 bottom-0 w-1 bg-success/40 z-10 pointer-events-none"></div>}
      {isRejected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-error/40 z-10 pointer-events-none"></div>}
      {isNeedsSupplement && <div className="absolute left-0 top-0 bottom-0 w-1 bg-supplement/70 z-10 pointer-events-none"></div>}

      {/* MAIN CARD BODY (Clickable) */}
      <div 
        onClick={() => navigate(`/requests/${r.id}`)}
        className="p-4 flex flex-col md:flex-row gap-4 md:items-center cursor-pointer"
      >
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${isApproved ? 'bg-success/10 border-success/20 text-success' : isNeedsSupplement ? 'bg-supplement/10 border-supplement/20 text-supplement' : isPending ? 'bg-warning/10 border-warning/20 text-warning' : 'bg-error/10 border-error/20 text-error'}`}>
            <span className="material-symbols-outlined text-[24px]">
              {isApproved ? 'task_alt' : isPending ? 'pending_actions' : isNeedsSupplement ? 'edit_note' : 'block'}
            </span>
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            {/* Status Badge */}
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full ${meta.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                {t(meta.label)}
              </span>
              {isActionable && (
                <span className="px-2.5 py-0.5 bg-warning-container text-on-warning-container rounded-full text-[10px] uppercase font-bold flex items-center gap-1 animate-pulse shadow-sm">
                  <span className="material-symbols-outlined text-[12px]">priority_high</span> {t('Cần bạn duyệt')}
                </span>
              )}
            </div>
            
            {/* Title */}
            <h3 className="text-base text-on-surface font-bold group-hover:text-primary transition-colors truncate mb-2" title={r.title}>
              {r.title}
            </h3>
            
            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-secondary">
              <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">tag</span><span className="font-medium text-on-surface">{r.id.substring(0, 8).toUpperCase()}</span></span>
              <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">category</span><span className="font-medium text-on-surface">{r.type}</span></span>
              <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">schedule</span><span className="font-medium text-on-surface">{r.createdAt}</span></span>
              {targetDeptCodes.length > 0 && (
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">apartment</span>
                  {targetDeptCodes.map((code) => (
                    <span key={code} className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wide">{code}</span>
                  ))}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT SIDE SUMMARY */}
        {currentActorUser && (
          <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-outline-variant pt-4 md:pt-0 md:pl-5 min-w-[200px]">
            {/* BE-24: đơn TỪ CHỐI -> chỉ hiện ai từ chối ở bước nào */}
            {isRejected ? (
              <>
                <div className="relative flex-shrink-0">
                  {rejectedByUser?.avatar ? (
                    <img src={rejectedByUser.avatar} alt={rejectedByUser.name} className="w-10 h-10 rounded-full object-cover shadow-sm border border-error/20" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-error/10 text-error text-[13px] font-bold flex items-center justify-center">
                      {getInitials(rejectedByUser?.name || currentActorName)}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white bg-error flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-[10px] font-bold">close</span>
                  </div>
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider mb-0.5 text-error">{summaryText}</span>
                  <span className="text-[13px] font-bold text-on-surface truncate w-full" title={rejectedByUser?.name}>
                    {rejectedByUser?.name || currentActorName}
                  </span>
                  <span className="text-[10px] text-secondary truncate w-full uppercase tracking-wide font-medium mt-0.5">
                    {rejectedByUser ? `${roleLabel(rejectedByUser)}${rejectedStepOrder ? t(' · Bước {v0}', { v0: rejectedStepOrder }) : ''}` : currentActorRole}
                  </span>
                </div>
              </>
            ) : isNeedsSupplement ? (
              <>
                <div className="relative flex-shrink-0">
                  {suppByUser?.avatar ? (
                    <img src={suppByUser.avatar} alt={suppByUser.name} className="w-10 h-10 rounded-full object-cover shadow-sm border border-supplement/20" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-supplement/10 text-supplement text-[13px] font-bold flex items-center justify-center">
                      {getInitials(suppByUser?.name || creatorName)}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white bg-supplement flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-[10px] font-bold">edit_note</span>
                  </div>
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider mb-0.5 text-supplement">{t('Yêu cầu bổ sung')}</span>
                  <span className="text-[13px] font-bold text-on-surface truncate w-full" title={suppByUser?.name || creatorName}>
                    {suppByUser?.name || t('Người duyệt')}
                  </span>
                  <span className="text-[10px] text-secondary truncate w-full uppercase tracking-wide font-medium mt-0.5">
                    {suppByUser ? `${roleLabel(suppByUser)}${suppStepOrder ? t(' · Bước {v0}', { v0: suppStepOrder }) : ''}` : t('Yêu cầu người gửi bổ sung')}
                  </span>
                </div>
              </>
            ) : isMultiApprover ? (
              <>
                {/* BE-24: nhiều người duyệt -> chồng avatar tối đa 2 + SỐ Ở GÓC TRÊN BÊN PHẢI */}
                <div className="relative flex-shrink-0 h-10" style={{ width: `${32 + Math.min(actorApprovers.length - 1, 1) * 20}px` }}>
                  {actorApprovers.slice(0, 2).map((u, i) => (
                    <div key={u.id} className="absolute top-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-sm overflow-hidden" style={{ left: `${i * 20}px`, zIndex: 4 - i }}>
                      {u.avatar ? (
                        <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#29b6f6] text-white text-[11px] flex items-center justify-center">
                          {getInitials(u.name)}
                        </div>
                      )}
                    </div>
                  ))}
                  {/* Số người ở GÓC TRÊN BÊN PHẢI cụm avatar (xám trung tính, không chói) */}
                  <div className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-slate-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-sm z-10">
                    {actorApprovers.length}
                  </div>
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${summaryColor}`}>{summaryText}</span>
                  <span className="text-[13px] font-bold text-on-surface truncate w-full">
                    {actorApprovers.length} {t('người')} {isApproved ? t('đồng ý') : t('duyệt')}
                  </span>
                  <span className="text-[10px] text-secondary truncate w-full uppercase tracking-wide font-medium mt-0.5" title={actorApprovers.map(u => u.name).join(', ')}>
                    {actorApprovers[0]?.name}, ...
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="relative">
                  {currentActorAvatar ? (
                    <img src={currentActorAvatar} alt={currentActorName} className="w-10 h-10 rounded-full object-cover shadow-sm border border-outline-variant" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#29b6f6] text-on-surface font-normal text-[14px] flex items-center justify-center shadow-sm">
                      {getInitials(currentActorName)}
                    </div>
                  )}
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${r.status === 'approved' ? 'bg-success' : r.status === 'returned_timeout' ? 'bg-error' : (r.status === 'pending' || r.status === 'needssupplement') ? 'bg-warning' : 'bg-error'}`}>
                    <span className="material-symbols-outlined text-white text-[10px] font-bold">
                      {statusIcon}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${summaryColor}`}>{summaryText}</span>
                  <span className="text-[13px] font-bold text-on-surface truncate w-full" title={currentActorName}>{currentActorName}</span>
                  <span className="text-[10px] text-secondary truncate w-full uppercase tracking-wide font-medium mt-0.5">{currentActorRole}</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* TOGGLE BUTTON */}
      <div className="px-4 pb-3 pt-1 flex justify-center">
        <button 
          onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
          className="flex items-center gap-1 text-[11px] font-medium text-secondary hover:text-primary transition-colors py-1 px-4 rounded-full border border-outline-variant hover:bg-surface-container-low cursor-pointer shadow-sm"
        >
          {isExpanded ? t('Ẩn chi tiết luồng duyệt') : t('Xem chi tiết luồng duyệt')}
          <span className="material-symbols-outlined text-[16px] transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            keyboard_arrow_down
          </span>
        </button>
      </div>

      {/* EXPANDED FLOW */}
      {isExpanded && (
        <div className="px-5 py-4 border-t border-outline-variant/50 bg-surface-container-lowest animate-in slide-in-from-top-2 duration-300 ease-out w-full overflow-hidden">
          <span className="text-[12px] text-secondary font-medium mb-3 block">
            {t('Tiến trình duyệt')}
          </span>
          
          <div className="flex items-start gap-1 overflow-x-auto w-full pb-2 scrollbar-hide">
            
            {/* Sender Node */}
            <div className="flex items-center gap-1 shrink-0 pt-1">
              <div className="flex flex-col items-center min-w-[60px] max-w-[80px]">
                {creatorAvatar ? (
                  <img src={creatorAvatar} alt={creatorName} className="w-8 h-8 rounded-full object-cover shadow-sm border border-outline-variant" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#29b6f6] text-on-surface font-normal text-[13px] flex items-center justify-center shadow-sm">
                    {getInitials(creatorName)}
                  </div>
                )}
                <div className="flex flex-col items-center w-full mt-1.5 gap-0.5">
                  <span className="text-[11px] font-bold text-on-surface text-center w-full truncate leading-tight" title={creatorName}>
                    {creatorName}
                  </span>
                  <span className="text-[9px] text-secondary text-center w-full truncate uppercase font-medium tracking-wide">
                    {t('NGƯỜI GỬI')}
                  </span>
                </div>
              </div>
              
              {r.steps.length > 0 && (
                <span className="material-symbols-outlined text-on-surface/70 text-[18px] mx-1 -mt-6">
                  arrow_forward
                </span>
              )}
            </div>

            {/* Approver Nodes — BE-20: bước nhiều người hiển thị TỪNG người rõ ràng */}
            {r.steps.map((s, idx) => {
              const ids = s.approverIds?.length ? s.approverIds : (s.approverId ? [s.approverId] : []);
              const isParallel = ['and', 'or'].includes((s.multiRule || '').trim().toLowerCase());
              const isSequential = ids.length > 1 && !isParallel;
              const isGroupStep = ids.length > 1 && isParallel;
              const isTimeoutStep = r.status === 'returned_timeout' && idx === (r.steps.findIndex(x => ['pending', 'submitted', 'pendingapproval'].includes((x.status || '').toLowerCase())) >= 0 ? r.steps.findIndex(x => ['pending', 'submitted', 'pendingapproval'].includes((x.status || '').toLowerCase())) : Math.min(Number(r.currentStep) || 0, r.steps.length - 1));

              // Badge trạng thái cho từng người: nếu bước đã duyệt/từ chối thì dùng chung, còn lại theo bước
              const nodeBadge = isTimeoutStep ? 'error'
                : s.status === 'approved' ? 'success'
                  : s.status === 'pending' ? 'warning'
                    : (s.status === 'rejected' || s.status === 'canceled') ? 'error'
                      : 'muted';
              const badgeClass = nodeBadge === 'success' ? 'bg-success' : nodeBadge === 'warning' ? 'bg-warning' : nodeBadge === 'error' ? 'bg-error' : 'bg-outline-variant';
              const badgeIcon = nodeBadge === 'success' ? 'check' : nodeBadge === 'warning' ? 'schedule' : nodeBadge === 'error' ? 'close' : 'more_horiz';

              const renderPerson = (aid) => {
                const u = employees.find((x) => x.id === aid);
                const nm = u?.name || t('Người duyệt');
                let role = t('NHÂN SỰ');
                if (u) {
                  if (u.role === 'ADMIN') role = t('QUẢN TRỊ VIÊN');
                  else if (u.role === 'HR') role = t('NHÂN SỰ');
                  else if (u.role === 'MANAGER') role = t('QUẢN LÝ');
                  else if (u.department) role = u.department;
                  else if (u.position) role = u.position;
                }
                return (
                  <div key={aid} className="flex flex-col items-center min-w-[64px] max-w-[88px]">
                    <div className="relative">
                      {u?.avatar ? (
                        <img src={u.avatar} alt={nm} className="w-8 h-8 rounded-full object-cover shadow-sm border border-outline-variant" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#29b6f6] text-on-surface font-normal text-[13px] flex items-center justify-center shadow-sm">
                          {getInitials(nm)}
                        </div>
                      )}
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center ${badgeClass}`}>
                        <span className="material-symbols-outlined text-white text-[8px] font-bold">{badgeIcon}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center w-full mt-1.5 gap-0.5">
                      <span className="text-[11px] font-bold text-on-surface text-center w-full truncate leading-tight" title={nm}>{nm}</span>
                      <span className="text-[9px] text-primary text-center w-full truncate uppercase font-medium tracking-wide">{role}</span>
                    </div>
                  </div>
                );
              };

              return (
                <div key={idx} className="flex items-center gap-1 shrink-0 pt-1">
                  {isGroupStep ? (
                    <div className="relative rounded-lg border border-dashed border-outline-variant bg-surface px-2.5 pb-1.5 pt-4">
                      <span className="absolute -top-2 left-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[8px] font-bold uppercase tracking-wider">
                        <span className="material-symbols-outlined text-[10px]">call_split</span>
                        {t('Bước')} {s.stepOrder} · {ids.length} {t('người')}
                      </span>
                      <div className="flex items-start gap-2">
                        {ids.map(renderPerson)}
                      </div>
                    </div>
                  ) : isSequential ? (
                    <div className="flex items-center gap-1 shrink-0">
                      {ids.map((aid, aidx) => (
                        <div key={aid} className="flex items-center gap-1 shrink-0">
                          {renderPerson(aid)}
                          {aidx < ids.length - 1 && (
                            <span className="material-symbols-outlined text-on-surface/70 text-[18px] mx-1 -mt-6">
                              arrow_forward
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    renderPerson(ids[0])
                  )}

                  {idx < r.steps.length - 1 && (
                    <span className="material-symbols-outlined text-on-surface/70 text-[18px] mx-1 -mt-6">
                      arrow_forward
                    </span>
                  )}
                </div>
              );
            })}
            
          </div>
        </div>
      )}
    </div>
  );
}
