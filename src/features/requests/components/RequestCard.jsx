import React from 'react';

export default function RequestCard({ 
  status, // 'approved', 'pending', 'rejected'
  title,
  requestId,
  date,
  department,
  metaLabel,
  metaValue,
  statusLabel,
  icon,
  iconBg,
  iconColor,
  statusBadgeBg,
  statusBadgeColor,
  statusBadgeBorder,
  approvers,
  isFavorite
}) {
  const isRejected = status === 'rejected';

  return (
    <div className={`bg-surface p-5 rounded-lg shadow-sm border border-outline-variant hover:shadow hover:border-outline transition-all group flex flex-col md:flex-row gap-5 md:items-center cursor-pointer relative overflow-hidden ${isRejected ? 'opacity-70 bg-surface-container-lowest' : ''}`}>
      {/* Subtle pending indicator */}
      {status === 'pending' && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-warning"></div>
      )}
      
      <div className="flex items-start gap-4 flex-1">
        <button className="flex items-center justify-center p-1 hover:bg-slate-100 rounded-full transition-colors group/star">
          <span className={`material-symbols-outlined transition-colors ${isFavorite ? 'text-amber-500 fill' : 'text-slate-300 group-hover/star:text-amber-400'}`}>
            star
          </span>
        </button>
        
        <div className={`w-10 h-10 rounded-md ${iconBg} flex items-center justify-center flex-shrink-0 border border-outline-variant/50`}>
          <span className={`material-symbols-outlined ${iconColor}`}>{icon}</span>
        </div>
        
        <div className="flex flex-col">
          <div className="flex items-center gap-3 mb-1">
            <h3 className={`font-headline-sm text-headline-sm text-on-surface font-bold group-hover:text-primary transition-colors ${isRejected ? 'line-through text-slate-500' : ''}`}>
              {title}
            </h3>
            <span className={`px-2 py-0.5 rounded text-[11px] uppercase tracking-wide font-bold ${statusBadgeBg} ${statusBadgeColor} flex items-center gap-1 border ${statusBadgeBorder}`}>
              {statusLabel}
            </span>
          </div>
          <p className="font-body-md text-body-md text-slate-500 mb-2">Mã đơn: {requestId} • {date}</p>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-label-md text-[10px] uppercase">
              {department}
            </span>
            <span className={`font-body-md text-body-md text-sm ${isRejected ? 'text-rose-500 italic' : 'text-slate-400'}`}>
              {metaLabel}: {metaValue}
            </span>
          </div>
        </div>
      </div>

      {/* Approvers Stack */}
      <div className="flex flex-col items-start md:items-end gap-1.5 border-t md:border-t-0 md:border-l border-outline-variant pt-4 md:pt-0 md:pl-5 min-w-[200px]">
        <span className="font-label-md text-label-md text-slate-400">Luồng duyệt</span>
        <div className={`flex items-center ${isRejected ? 'opacity-70' : ''}`}>
          {approvers.map((approver, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && (
                <span className="material-symbols-outlined text-slate-300 mx-1 text-[16px]">arrow_forward</span>
              )}
              {approver.isCurrentUser ? (
                <div className="flex items-center gap-1.5 ml-2 bg-primary-container/30 px-2 py-0.5 rounded border border-primary/20">
                  <div className="relative">
                    <img className="w-5 h-5 rounded-full border border-primary/30" src={approver.avatar} alt="Current User" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full border border-surface"></div>
                  </div>
                  <span className="font-label-md text-xs text-primary font-medium">Bạn</span>
                </div>
              ) : (
                <div className="relative mr-4">
                  <img className="w-8 h-8 rounded-full border-2 border-white" src={approver.avatar} alt="Approver" />
                  {approver.statusIcon && (
                    <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${approver.statusIconBg}`}>
                      <span className="material-symbols-outlined text-white text-[10px] font-bold">{approver.statusIcon}</span>
                    </div>
                  )}
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
