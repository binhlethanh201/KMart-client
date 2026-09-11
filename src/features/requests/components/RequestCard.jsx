import { useNavigate } from 'react-router-dom';
import { useApproval } from '../../../context/useApproval';
import { STATUS_META, USERS } from '../data/seed';

// Status-driven request card. Clicking navigates to the detail page.
export default function RequestCard({ request: r }) {
  const navigate = useNavigate();
  const { canApprove } = useApproval();
  const meta = STATUS_META[r.status];
  const creator = USERS.find((u) => u.id === r.creatorId);
  const isActionable = canApprove(r);
  const isRejected = r.status === 'rejected' || r.status === 'returned_timeout';

  return (
    <div
      onClick={() => navigate(`/requests/${r.id}`)}
      className={`bg-surface p-4 rounded-lg shadow-sm border border-outline-variant hover:shadow hover:border-outline transition-all flex flex-col md:flex-row gap-4 md:items-center cursor-pointer relative overflow-hidden ${isRejected ? 'opacity-90' : ''}`}
    >
      {isActionable && <div className="absolute left-0 top-0 bottom-0 w-1 bg-warning"></div>}
      {r.status === 'pending' && !isActionable && <div className="absolute left-0 top-0 bottom-0 w-1 bg-warning/40"></div>}

      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-md bg-surface-container flex items-center justify-center flex-shrink-0 border border-outline-variant/50">
          <span className="material-symbols-outlined text-on-surface-variant">{r.status === 'approved' ? 'task_alt' : r.status === 'pending' ? 'pending_actions' : 'block'}</span>
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold group-hover:text-primary truncate">{r.title}</h3>
            <span className={`inline-flex items-center gap-1 text-[11px] uppercase tracking-wide font-bold ${meta.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
              {meta.label}
            </span>
          </div>
          <p className="text-xs text-secondary mb-2">Mã: {r.id} - {r.type} - {r.createdAt}</p>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-surface-container text-secondary rounded text-[10px] uppercase font-medium">
              {creator?.role}
            </span>
            {isActionable && (
              <span className="px-2 py-0.5 bg-warning-container text-on-warning-container rounded text-[10px] uppercase font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">priority_high</span> Cần bạn duyệt
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Approval chain */}
      <div className="flex flex-col items-start md:items-end gap-1.5 border-t md:border-t-0 md:border-l border-outline-variant pt-3 md:pt-0 md:pl-4 min-w-[220px]">
        <span className="text-xs text-slate-400">Luồng duyệt</span>
        <div className="flex items-center">
          {/* creator */}
          <img className="w-7 h-7 rounded-full border-2 border-white object-cover" src={creator?.avatar} alt={creator?.name} title={`Người tạo: ${creator?.name}`} />
          <span className="material-symbols-outlined text-slate-300 mx-1 text-[16px]">arrow_forward</span>
          {r.steps.map((s, i) => {
            const u = USERS.find((x) => x.id === s.approverId);
            return (
              <div key={i} className="flex items-center">
                {i > 0 && <span className="material-symbols-outlined text-slate-300 mx-1 text-[16px]">arrow_forward</span>}
                <div className="relative mr-1">
                  <img className={`w-7 h-7 rounded-full border-2 object-cover ${s.status === 'pending' ? 'border-warning' : s.status === 'approved' ? 'border-success' : 'border-error'}`} src={u?.avatar} alt={u?.name} />
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${s.status === 'approved' ? 'bg-success' : s.status === 'pending' ? 'bg-warning' : 'bg-error'}`}>
                    <span className="material-symbols-outlined text-white text-[10px] font-bold">{s.status === 'approved' ? 'check' : s.status === 'pending' ? 'schedule' : 'close'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
