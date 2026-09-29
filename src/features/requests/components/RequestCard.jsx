import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApproval } from '../../../context/useApproval';
import { useHr } from '../../hr/context/HrProvider';
import { STATUS_META } from '../data/constants';

// Status-driven request card. Clicking navigates to the detail page.
export default function RequestCard({ request: r }) {
  const navigate = useNavigate();
  const { canApprove } = useApproval();
  const { employees } = useHr();
  const [isExpanded, setIsExpanded] = useState(false);

  const meta = STATUS_META[r.status] || { badge: 'bg-surface-container text-on-surface', dot: 'bg-outline', label: 'Không rõ' };

  // Use creator name directly from API if available, fallback to search in employees
  const creatorEmp = employees.find((u) => u.id === r.creatorId);
  const creatorName = r.creatorName || creatorEmp?.name || 'Người gửi ẩn danh';
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
  let summaryText = 'Không rõ';
  let summaryColor = 'text-secondary';
  let statusIcon = 'horizontal_rule';

  if (r.status === 'returned_timeout') {
    const timeoutIndex = r.steps.findIndex(s => ['pending', 'submitted', 'pendingapproval'].includes((s.status || '').toLowerCase())) >= 0
      ? r.steps.findIndex(s => ['pending', 'submitted', 'pendingapproval'].includes((s.status || '').toLowerCase()))
      : Math.min(Number(r.currentStep) || 0, r.steps.length - 1);
    currentActorStep = r.steps[timeoutIndex] || r.steps[r.steps.length - 1];
    summaryText = 'Quá hạn 12h';
    summaryColor = 'text-error';
    statusIcon = 'close';
  } else if (isPending) {
    currentActorStep = r.steps.find(s => s.status === 'pending' || s.status === 'submitted' || s.status === 'pendingapproval');
    summaryText = 'Đang chờ duyệt';
    summaryColor = 'text-warning';
    statusIcon = 'schedule';
  } else if (isApproved) {
    currentActorStep = r.steps[r.steps.length - 1];
    summaryText = 'Đã hoàn thành';
    summaryColor = 'text-success';
    statusIcon = 'check';
  } else if (isRejected) {
    currentActorStep = r.steps.find(s => s.status === 'rejected' || s.status === 'canceled') || r.steps[r.steps.length - 1];
    summaryText = r.status === 'canceled' ? 'Đã hủy' : 'Đã từ chối';
    summaryColor = 'text-error';
    statusIcon = 'close';
  } else if (isNeedsSupplement) {
    // BE-06: đơn đang chờ NGƯỜI GỬI bổ sung - trước đây hiện "Không rõ"
    currentActorStep = null;
    summaryText = 'Yêu cầu bổ sung';
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
  const currentActorName = currentActorUser?.name || 'Người duyệt';
  const currentActorAvatar = currentActorUser?.avatar;
  let currentActorRole = isNeedsSupplement ? 'NGƯỜI GỬI' : 'NGƯỜI DUYỆT';
  if (!isNeedsSupplement && currentActorUser) {
     if (currentActorUser.role === 'ADMIN') currentActorRole = 'QUẢN TRỊ VIÊN';
     else if (currentActorUser.role === 'HR') currentActorRole = 'NHÂN SỰ';
     else if (currentActorUser.role === 'MANAGER') currentActorRole = 'QUẢN LÝ';
     else if (currentActorUser.department) currentActorRole = currentActorUser.department;
     else if (currentActorUser.position) currentActorRole = currentActorUser.position;
  }

  return (
    <div className={`bg-surface rounded-xl shadow-sm border border-outline-variant hover:shadow-md hover:border-primary/30 transition-all flex flex-col relative overflow-hidden group ${isRejected ? 'opacity-80' : ''}`}>
      
      {/* Left border indicators */}
      {isActionable && <div className="absolute left-0 top-0 bottom-0 w-1 bg-warning z-10 pointer-events-none"></div>}
      {!isActionable && isPending && <div className="absolute left-0 top-0 bottom-0 w-1 bg-warning/40 z-10 pointer-events-none"></div>}
      {isApproved && <div className="absolute left-0 top-0 bottom-0 w-1 bg-success/40 z-10 pointer-events-none"></div>}
      {isRejected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-error/40 z-10 pointer-events-none"></div>}
      {isNeedsSupplement && <div className="absolute left-0 top-0 bottom-0 w-1 bg-warning/70 z-10 pointer-events-none"></div>}

      {/* MAIN CARD BODY (Clickable) */}
      <div 
        onClick={() => navigate(`/requests/${r.id}`)}
        className="p-4 flex flex-col md:flex-row gap-4 md:items-center cursor-pointer"
      >
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${isApproved ? 'bg-success/10 border-success/20 text-success' : (isPending || isNeedsSupplement) ? 'bg-warning/10 border-warning/20 text-warning' : 'bg-error/10 border-error/20 text-error'}`}>
            <span className="material-symbols-outlined text-[24px]">
              {isApproved ? 'task_alt' : isPending ? 'pending_actions' : isNeedsSupplement ? 'edit_note' : 'block'}
            </span>
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            {/* Status Badge */}
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full ${meta.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                {meta.label}
              </span>
              {isActionable && (
                <span className="px-2.5 py-0.5 bg-warning-container text-on-warning-container rounded-full text-[10px] uppercase font-bold flex items-center gap-1 animate-pulse shadow-sm">
                  <span className="material-symbols-outlined text-[12px]">priority_high</span> Cần bạn duyệt
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
            </div>
          </div>
        </div>

        {/* RIGHT SIDE SUMMARY */}
        {currentActorUser && (
          <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-outline-variant pt-4 md:pt-0 md:pl-5 min-w-[200px]">
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
          </div>
        )}
      </div>

      {/* TOGGLE BUTTON */}
      <div className="px-4 pb-3 pt-1 flex justify-center">
        <button 
          onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
          className="flex items-center gap-1 text-[11px] font-medium text-secondary hover:text-primary transition-colors py-1 px-4 rounded-full border border-outline-variant hover:bg-surface-container-low cursor-pointer shadow-sm"
        >
          {isExpanded ? 'Ẩn chi tiết luồng duyệt' : 'Xem chi tiết luồng duyệt'}
          <span className="material-symbols-outlined text-[16px] transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            keyboard_arrow_down
          </span>
        </button>
      </div>

      {/* EXPANDED FLOW */}
      {isExpanded && (
        <div className="px-5 py-4 border-t border-outline-variant/50 bg-surface-container-lowest animate-in slide-in-from-top-2 duration-300 ease-out w-full overflow-hidden">
          <span className="text-[12px] text-secondary font-medium mb-3 block">
            Tiến trình duyệt
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
                    NGƯỜI GỬI
                  </span>
                </div>
              </div>
              
              {r.steps.length > 0 && (
                <span className="material-symbols-outlined text-outline-variant/60 text-[16px] mx-0.5 -mt-6">
                  arrow_forward
                </span>
              )}
            </div>

            {/* Approver Nodes */}
            {r.steps.map((s, idx) => {
              const u = employees.find((x) => x.id === s.approverId);
              // Bước And/Sequential có nhiều người cùng duyệt -> hiện đủ thay vì chỉ người đầu tiên
              const stepApproverNames = (s.approverIds?.length ? s.approverIds : [s.approverId])
                .map((aid) => employees.find((x) => x.id === aid)?.name)
                .filter(Boolean);
              const isGroupStep = stepApproverNames.length > 1;
              const approverName = isGroupStep
                ? `${stepApproverNames.join(', ')}`
                : (stepApproverNames[0] || u?.name || 'Người duyệt');
              let approverRole = 'NHÂN SỰ';
              if (u) {
                 if (u.role === 'ADMIN') approverRole = 'QUẢN TRỊ VIÊN';
                 else if (u.role === 'HR') approverRole = 'NHÂN SỰ';
                 else if (u.role === 'MANAGER') approverRole = 'QUẢN LÝ';
                 else if (u.department) approverRole = u.department;
                 else if (u.position) approverRole = u.position;
              }
              if (isGroupStep) approverRole = `${stepApproverNames.length} NGƯỜI DUYỆT`;
              
              return (
                <div key={idx} className="flex items-center gap-1 shrink-0 pt-1">
                  <div className="flex flex-col items-center min-w-[60px] max-w-[80px] relative">
                    <div className="relative">
                      {u?.avatar ? (
                        <img src={u.avatar} alt={approverName} className="w-8 h-8 rounded-full object-cover shadow-sm border border-outline-variant" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#29b6f6] text-on-surface font-normal text-[13px] flex items-center justify-center shadow-sm">
                          {getInitials(approverName)}
                        </div>
                      )}
                      {/* Status badge */}
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center ${r.status === 'returned_timeout' && idx === (r.steps.findIndex(s => ['pending', 'submitted', 'pendingapproval'].includes((s.status || '').toLowerCase())) >= 0 ? r.steps.findIndex(s => ['pending', 'submitted', 'pendingapproval'].includes((s.status || '').toLowerCase())) : Math.min(Number(r.currentStep) || 0, r.steps.length - 1)) ? 'bg-error' : s.status === 'approved' ? 'bg-success' : s.status === 'pending' ? 'bg-warning' : s.status === 'rejected' || s.status === 'canceled' ? 'bg-error' : 'bg-outline-variant'}`}>
                        <span className="material-symbols-outlined text-white text-[8px] font-bold">
                          {r.status === 'returned_timeout' && idx === (r.steps.findIndex(s => ['pending', 'submitted', 'pendingapproval'].includes((s.status || '').toLowerCase())) >= 0 ? r.steps.findIndex(s => ['pending', 'submitted', 'pendingapproval'].includes((s.status || '').toLowerCase())) : Math.min(Number(r.currentStep) || 0, r.steps.length - 1)) ? 'close' : s.status === 'approved' ? 'check' : s.status === 'pending' ? 'schedule' : s.status === 'rejected' || s.status === 'canceled' ? 'close' : 'more_horiz'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center w-full mt-1.5 gap-0.5">
                      <span className="text-[11px] font-bold text-on-surface text-center w-full truncate leading-tight" title={approverName}>
                        {approverName}
                      </span>
                      <span className="text-[9px] text-primary text-center w-full truncate uppercase font-medium tracking-wide">
                        {approverRole}
                      </span>
                    </div>
                  </div>
                  
                  {idx < r.steps.length - 1 && (
                    <span className="material-symbols-outlined text-outline-variant/60 text-[16px] mx-0.5 -mt-6">
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
