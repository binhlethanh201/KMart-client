import { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApproval } from '../../../context/useApproval';
import { useHr } from '../../hr/context/HrProvider';
import RejectReasonModal from '../components/RejectReasonModal';
import SupplementReasonModal from '../components/SupplementReasonModal';
import UserInfoModal from '../components/UserInfoModal';
import { STATUS_META, STEP_ROLE } from '../data/constants';
import useDocumentTitle from '../../../hooks/useDocumentTitle';

const historyBorder = {
  approve: 'border-success',
  reject: 'border-error',
  timeout: 'border-error',
  comment: 'border-outline-variant',
  create: 'border-outline-variant',
};
const historyBg = {
  approve: 'bg-success-container/10',
  reject: 'bg-error-container/10',
  timeout: 'bg-error-container/10',
};

export default function RequestDetail() {
  const { id } = useParams();
  const { requests, currentUser, canApprove, approveRequest, rejectRequest, addComment, simulateTimeout } = useApproval();
  const { employees } = useHr();
  const request = requests.find((r) => r.id === id);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [supplementOpen, setSupplementOpen] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [comment, setComment] = useState('');
  const commentRef = useRef(null);

  useDocumentTitle(request ? `Chi tiết yêu cầu ${request.id.substring(0, 8).toUpperCase()}` : 'Chi tiết yêu cầu');

  if (!request) {
    return (
      <div className="flex-1 flex items-center justify-center h-full bg-background p-6">
        <div className="text-center">
          <span className="material-symbols-outlined text-[48px] text-outline block mb-2">search_off</span>
          <p className="text-on-surface font-medium">Không tìm thấy yêu cầu {id}.</p>
          <Link to="/my-requests" className="text-primary text-sm hover:underline mt-2 inline-block">Quay lại danh sách</Link>
        </div>
      </div>
    );
  }

  const meta = STATUS_META[request.status] || { badge: 'bg-gray-100 text-gray-800', dot: 'bg-gray-500', label: 'Không rõ' };
  const creatorName = request.creatorName || employees.find((u) => u.id === request.creatorId)?.name;
  const creatorRole = employees.find((u) => u.id === request.creatorId)?.position || 'Nhân viên';
  const creatorAvatar = employees.find((u) => u.id === request.creatorId)?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(creatorName || 'User')}&background=random&color=fff&size=128`;
  const actionable = canApprove(request);
  const pendingStep = request.steps[request.currentStep];

  const postComment = () => {
    if (!comment.trim()) return;
    addComment(request.id, comment);
    setComment('');
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-background h-full overflow-hidden">
      <header className="bg-surface border-b border-outline-variant flex-shrink-0 z-20">
        {/* Breadcrumbs */}
        <div className="h-12 px-6 flex items-center border-b border-outline-variant/50">
          <nav className="flex text-sm text-secondary" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-2">
              <li className="inline-flex items-center">
                <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">home</span>
                  Trang chủ
                </Link>
              </li>
              <li className="flex items-center">
                <span className="material-symbols-outlined text-[16px] text-outline mx-1">chevron_right</span>
                <Link to="/my-requests" className="hover:text-primary transition-colors">Yêu cầu &amp; Phê duyệt</Link>
              </li>
              <li aria-current="page" className="flex items-center">
                <span className="material-symbols-outlined text-[16px] text-outline mx-1">chevron_right</span>
                <span className="text-on-surface font-medium">Chi tiết {request.id.substring(0, 8).toUpperCase()}</span>
              </li>
            </ol>
          </nav>
        </div>

        {/* Action Header */}
        <div className="px-6 py-4 flex flex-col xl:flex-row xl:justify-between xl:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="font-display-lg text-on-surface">{request.title}</h1>
              <span className={`inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide ${meta.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                {meta.label}
              </span>
            </div>
            <p className="font-body-md text-secondary text-sm">
              Mã hệ thống: <strong>{request.id.substring(0, 8).toUpperCase()}</strong> - Đã nộp: {request.createdAt} - Người tạo: <strong>{creatorName}</strong>
            </p>
          </div>

          {/* Action bar */}
          <div className="flex flex-wrap items-center gap-2">
            {import.meta.env.DEV && (
              <button
                onClick={() => simulateTimeout(request.id)}
                className="px-3 py-1.5 rounded text-sm font-medium border border-warning text-warning hover:bg-warning-container transition-colors flex items-center gap-2 bg-surface cursor-pointer"
                title="Giả lập quá hạn 12h không xử lý (BR11)"
              >
                <span className="material-symbols-outlined text-[16px]">bolt</span>
                Giả lập Timeout 12h
              </button>
            )}
            <div className="w-px h-6 bg-outline-variant mx-1"></div>
            <button
              onClick={() => setSupplementOpen(true)}
              className="px-3 py-1.5 rounded text-sm font-medium border border-outline-variant text-on-surface hover:bg-surface-container transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">edit_note</span>
              Yêu cầu bổ sung
            </button>
            <button
              onClick={() => setRejectOpen(true)}
              disabled={!actionable}
              className="px-4 py-1.5 rounded text-sm font-medium border border-error text-error hover:bg-error-container transition-colors flex items-center gap-2 bg-surface cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title={actionable ? 'Từ chối yêu cầu' : 'Bạn không phải người duyệt bước này'}
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
              Từ chối
            </button>
            <button
              onClick={() => setShowApproveConfirm(true)}
              disabled={!actionable}
              className="px-5 py-1.5 rounded text-sm font-medium bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-colors flex items-center gap-2 border border-transparent shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title={actionable ? 'Phê duyệt yêu cầu' : 'Bạn không phải người duyệt bước này'}
            >
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              Duyệt yêu cầu
            </button>
          </div>

          {/* Approve Confirmation Dialog */}
          {showApproveConfirm && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
              <div className="bg-surface rounded-lg shadow-xl max-w-sm w-full p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-success-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-success text-[24px]">check_circle</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-on-surface">Xác nhận phê duyệt</h3>
                    <p className="text-sm text-secondary">Hành động này không thể hoàn tác</p>
                  </div>
                </div>
                <p className="text-sm text-on-surface mb-6">
                  Bạn có chắc chắn muốn phê duyệt yêu cầu này không?
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowApproveConfirm(false)}
                    className="px-4 py-2 rounded border border-outline-variant text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={() => {
                      setShowApproveConfirm(false);
                      approveRequest(request.id);
                    }}
                    className="px-4 py-2 rounded bg-primary text-on-primary hover:bg-primary/90 transition-colors cursor-pointer"
                  >
                    Xác nhận duyệt
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-surface">
        {/* Left: detail + discussion */}
        <div className="flex-1 overflow-y-auto p-6 border-r border-outline-variant">
          <div className="w-full space-y-6">
            {/* Detail block */}
            <section className="bg-surface border border-outline-variant rounded-lg shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-surface-container-low border-b border-outline-variant flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-secondary">feed</span>
                <h2 className="text-sm text-on-surface uppercase tracking-wide font-semibold">Chi tiết Đề xuất</h2>
              </div>
              <table className="w-full text-left text-sm">
                <tbody className="divide-y divide-outline-variant">
                  <tr>
                    <th className="py-3 px-4 font-medium text-secondary bg-surface-container-lowest w-1/3 align-top border-r border-outline-variant">Người đề xuất</th>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img className="w-8 h-8 rounded-full border border-outline-variant object-cover" src={creatorAvatar} alt={creatorName} />
                          <div>
                            <p className="font-medium text-on-surface">{creatorName} ({String(request.creatorId).substring(0, 8).toUpperCase()})</p>
                            <p className="text-xs text-secondary">{creatorRole} - Kmart Siêu thị Cầu Giấy</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowUserInfo(true)}
                          className="p-1.5 text-secondary hover:text-primary hover:bg-primary-container/30 rounded-full transition-colors cursor-pointer"
                          title="Xem thông tin chi tiết"
                        >
                          <span className="material-symbols-outlined text-[20px]">info</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <th className="py-3 px-4 font-medium text-secondary bg-surface-container-lowest align-top border-r border-outline-variant">Loại đơn từ</th>
                    <td className="py-3 px-4 text-on-surface">{request.type}</td>
                  </tr>
                  {Object.entries(request.fields).map(([key, val]) => {
                    // Skip internal or special fields
                    if (['title', 'type', 'attachment'].includes(key)) return null;
                    if (val === undefined || val === null || val === '') return null; // hide empty

                    // Map legacy keys to nice labels for seed data compatibility
                    let label = key;
                    if (key === 'startTime') label = 'Thời gian bắt đầu';
                    else if (key === 'endTime') label = 'Thời gian kết thúc';
                    else if (key === 'reason') label = 'Lý do cụ thể';
                    else if (key === 'impact') label = 'Ảnh hưởng công việc';

                    return (
                      <tr key={key}>
                        <th className="py-3 px-4 font-medium text-secondary bg-surface-container-lowest align-top border-r border-outline-variant">{label}</th>
                        <td className="py-3 px-4 text-on-surface">{Array.isArray(val) ? val.join(', ') : val}</td>
                      </tr>
                    );
                  })}
                  {request.rejectReason && (
                    <tr>
                      <th className="py-3 px-4 font-medium text-error bg-error-container/10 align-top border-r border-error/20">Lý do từ chối</th>
                      <td className="py-3 px-4 text-on-error-container bg-error-container/10">{request.rejectReason}</td>
                    </tr>
                  )}
                  <tr>
                    <th className="py-3 px-4 font-medium text-secondary bg-surface-container-lowest align-top border-r border-outline-variant">Tài liệu đính kèm</th>
                    <td className="py-3 px-4">
                      {request.fields.attachment ? (
                        <a href="#" onClick={(e) => e.preventDefault()} className="inline-flex items-center gap-2 border border-outline-variant rounded bg-surface px-3 py-1.5 text-sm hover:border-primary transition-colors text-on-surface group">
                          <span className="material-symbols-outlined text-[16px] text-secondary group-hover:text-primary">attach_file</span>
                          {request.fields.attachment}
                        </a>
                      ) : (
                        <span className="text-secondary text-xs italic">Không có tài liệu</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>

            {/* Comment thread */}
            <section className="bg-surface border border-outline-variant rounded-lg shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-surface-container-low border-b border-outline-variant flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-secondary">forum</span>
                <h2 className="text-sm text-on-surface uppercase tracking-wide font-semibold">Lịch sử Thảo luận</h2>
                <span className="ml-auto text-xs text-secondary">{request.comments?.length || 0} bình luận</span>
              </div>
              <div className="p-4 space-y-3">
                {request.comments?.length === 0 && (
                  <p className="text-sm text-secondary italic">Chưa có bình luận nào.</p>
                )}
                {request.comments?.map((c, i) => {
                  const u = employees.find((x) => x.id === c.userId);
                  return (
                    <div key={i} className="flex gap-3">
                      <img className="w-8 h-8 rounded-full border border-outline-variant object-cover" src={u?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u?.name || 'User')}&background=random&color=fff&size=128`} alt={u?.name || 'User'} />
                      <div className="flex-1 bg-surface-container-lowest border border-outline-variant rounded-md p-3">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-sm text-on-surface">{u?.name || 'User'}</span>
                          <span className="text-xs text-secondary">{c.at}</span>
                        </div>
                        <p className="text-sm text-on-surface whitespace-pre-wrap">{c.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Comment input */}
              <div className="bg-surface-container-low p-4 border-t border-outline-variant">
                <div className="flex gap-3">
                  <img className="w-8 h-8 rounded-full border border-outline-variant object-cover" src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'User')}&background=random&color=fff&size=128`} alt={currentUser?.name || 'User'} />
                  <div className="flex-1">
                    <textarea
                      ref={commentRef}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) postComment(); }}
                      className="w-full border border-outline-variant rounded-md p-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none bg-surface-container-lowest text-on-surface min-h-[70px] resize-none"
                      placeholder="Nhập ghi chú hoặc thảo luận (Ctrl+Enter để gửi)..."
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-secondary flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">alternate_email</span>
                        @mention người dùng
                      </span>
                      <button
                        onClick={postComment}
                        disabled={!comment.trim()}
                        className="bg-secondary text-on-secondary hover:bg-secondary/90 hover:text-white px-4 py-1.5 rounded text-sm font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Gửi phản hồi
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Right: workflow + audit */}
        <div className="w-full lg:w-[360px] bg-surface flex-shrink-0 flex flex-col overflow-y-auto">
          {/* Action reminder */}
          <div className={`border-b p-4 ${actionable ? 'bg-warning-container/30 border-warning/20' : 'bg-surface-container-low border-outline-variant'}`}>
            <h3 className={`text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1 ${actionable ? 'text-warning' : 'text-secondary'}`}>
              <span className="material-symbols-outlined text-[14px]">{actionable ? 'warning' : 'task_alt'}</span>
              {actionable ? 'Yêu cầu hành động' : 'Trạng thái'}
            </h3>
            <p className="text-sm text-on-surface">
              {actionable ? (
                <>Đơn cần <strong>{currentUser?.name || 'bạn'}</strong> phê duyệt ở bước {request.currentStep + 1}. Hạn chót: <strong>12 giờ</strong>.</>
              ) : request.status === 'approved' ? 'Đơn đã được phê duyệt hoàn tất.' : request.status === 'rejected' ? 'Đơn đã bị từ chối.' : request.status === 'returned_timeout' ? 'Đơn đã trả về nơi khởi tạo do quá hạn.' : 'Đơn đang chờ người duyệt khác xử lý.'}
            </p>
          </div>

          {/* Workflow chain */}
          <div className="p-6 border-b border-outline-variant">
            <h3 className="text-xs text-secondary uppercase tracking-widest mb-4 flex items-center gap-2 font-semibold">
              <span className="material-symbols-outlined text-[16px]">account_tree</span>
              Cấp bậc Phê duyệt
            </h3>
            <div className="relative">
              <div className="absolute left-[11px] top-3 bottom-3 w-px bg-outline-variant z-0"></div>
              <ul className="space-y-5 relative z-10">
                {/* creator */}
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-surface border border-outline-variant flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[12px] text-secondary">person</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-secondary uppercase tracking-wide">Người nộp đơn</p>
                    <p className="text-sm text-on-surface font-medium mt-0.5">{creatorName}</p>
                  </div>
                </li>
                {/* steps */}
                {request.steps.map((s, i) => {
                  const u = employees.find((x) => x.id === s.approverId);
                  const approverName = u?.name || 'User';
                  const isCurrent = i === request.currentStep && request.status === 'pending';
                  if (s.status === 'approved') {
                    return (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-success text-on-success flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                          <span className="material-symbols-outlined text-[12px]">check</span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-success uppercase tracking-wide">{STEP_ROLE[s.approverId] || `Cấp ${i + 1}`}</p>
                          <p className="text-sm text-on-surface font-medium mt-0.5">{approverName}</p>
                          <p className="text-xs text-success font-medium mt-0.5">Đã duyệt ({s.actedAt})</p>
                        </div>
                      </li>
                    );
                  }
                  if (s.status === 'rejected') {
                    return (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-error text-on-error flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                          <span className="material-symbols-outlined text-[12px]">close</span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-error uppercase tracking-wide">{STEP_ROLE[s.approverId] || `Cấp ${i + 1}`}</p>
                          <p className="text-sm text-on-surface font-medium mt-0.5">{approverName}</p>
                          <p className="text-xs text-error font-medium mt-0.5">Đã từ chối ({s.actedAt})</p>
                        </div>
                      </li>
                    );
                  }
                  // pending
                  return (
                    <li key={i} className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm ${isCurrent ? 'bg-warning text-on-warning ring-2 ring-warning/20' : 'bg-surface border border-outline-variant text-secondary'}`}>
                        <span className="material-symbols-outlined text-[12px]">schedule</span>
                      </div>
                      <div className={isCurrent ? 'bg-warning-container/20 p-2 rounded border border-warning/20 w-full -mt-1' : ''}>
                        <p className={`text-xs font-bold uppercase tracking-wide ${isCurrent ? 'text-warning' : 'text-secondary'}`}>{STEP_ROLE[s.approverId] || `Cấp ${i + 1}`}</p>
                        <p className="text-sm text-on-surface font-medium mt-0.5">{approverName}{pendingStep?.approverId === s.approverId && actionable ? ' (Bạn)' : ''}</p>
                        <p className={`text-xs font-medium mt-0.5 ${isCurrent ? 'text-warning' : 'text-secondary'}`}>{isCurrent ? 'Đang chờ xử lý' : 'Chưa đến lượt'}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Audit log */}
          <div className="p-6">
            <h3 className="text-xs text-secondary uppercase tracking-widest mb-4 flex items-center gap-2 font-semibold">
              <span className="material-symbols-outlined text-[16px]">history</span>
              Nhật ký hệ thống
            </h3>
            <ul className="space-y-3">
              {request.history?.map((h, i) => (
                <li key={i} className={`text-xs text-secondary border-l-2 pl-3 py-1 ${historyBorder[h.type] || 'border-outline-variant'} ${historyBg[h.type] || ''}`}>
                  <span className="font-medium text-on-surface">{h.at}</span> - {h.text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>

      {rejectOpen && (
        <RejectReasonModal
          requestId={request.id}
          onClose={() => setRejectOpen(false)}
          onConfirm={(reason) => {
            rejectRequest(request.id, reason);
            setRejectOpen(false);
          }}
        />
      )}

      {supplementOpen && (
        <SupplementReasonModal
          requestId={request.id}
          onClose={() => setSupplementOpen(false)}
          onConfirm={(reason) => {
            addComment(request.id, `[Yêu cầu bổ sung] ${reason}`);
            setSupplementOpen(false);
          }}
        />
      )}

      {showUserInfo && (
        <UserInfoModal
          user={{
            id: request.creatorId,
            name: creatorName,
            role: creatorRole,
            avatar: creatorAvatar,
            employeeId: String(request.creatorId).substring(0, 8).toUpperCase(),
            email: employees.find((u) => u.id === request.creatorId)?.email,
            personalEmail: employees.find((u) => u.id === request.creatorId)?.personalEmail,
            phone: employees.find((u) => u.id === request.creatorId)?.phone
          }}
          onClose={() => setShowUserInfo(false)}
        />
      )}
    </div>
  );
}
