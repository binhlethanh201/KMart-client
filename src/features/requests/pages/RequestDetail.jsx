import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApproval } from '../../../context/useApproval';
import { useHr } from '../../hr/context/HrProvider';
import RejectReasonModal from '../components/RejectReasonModal';
import SupplementReasonModal from '../components/SupplementReasonModal';
import CreateRequestModal from '../components/CreateRequestModal';
import UserInfoModal from '../components/UserInfoModal';
import { STATUS_META, STEP_ROLE } from '../data/constants';
import useDocumentTitle from '../../../hooks/useDocumentTitle';
import { applicationService } from '../services/applicationService';

// BE-09: định dạng dung lượng file đính kèm
const formatFileSize = (bytes) => {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const historyBorder = {
  approve: 'border-success',
  reject: 'border-error',
  timeout: 'border-error',
  supplement: 'border-warning',
  comment: 'border-outline-variant',
  create: 'border-outline-variant',
};
const historyBg = {
  approve: 'bg-success-container/10',
  reject: 'bg-error-container/10',
  timeout: 'bg-error-container/10',
  supplement: 'bg-warning-container/10',
};

export default function RequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { requests, currentUser, currentUserId, canApprove, approveRequest, rejectRequest, requestSupplement, addComment, simulateTimeout, pushToast } = useApproval();
  const { employees } = useHr();
  const listRequest = requests.find((r) => r.id === id);

  // BE-15: dữ liệu danh sách (getAll/my/pending) KHÔNG kèm comments/histories nên trang chi tiết
  // luôn trống. Fetch riêng /applications/{id} để có đủ bình luận + nhật ký + lý do bổ sung.
  const [detail, setDetail] = useState(null);
  const refreshDetail = useCallback(() => {
    applicationService.getById(id)
      .then((data) => setDetail(data))
      .catch(() => setDetail(null));
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    setDetail(null);
    applicationService.getById(id)
      .then((data) => { if (!cancelled) setDetail(data); })
      .catch(() => { if (!cancelled) setDetail(null); });
    return () => { cancelled = true; };
  }, [id]);

  // BE-15: giữ cờ _isPendingReq của bản ghi trong danh sách "chờ tôi duyệt"
  // vì getById không trả cờ này -> nếu ghi đè thẳng sẽ làm nút Duyệt bị vô hiệu.
  const request = detail && detail.id === id
    ? { ...detail, _isPendingReq: listRequest?._isPendingReq }
    : listRequest;

  const [rejectOpen, setRejectOpen] = useState(false);
  const [supplementOpen, setSupplementOpen] = useState(false);
  const [supplementEditOpen, setSupplementEditOpen] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [comment, setComment] = useState('');
  const commentRef = useRef(null);

  // BE-09: tài liệu đính kèm thật của đơn (lấy từ /applications/{id}/attachments)
  const [attachments, setAttachments] = useState([]);
  const refreshAttachments = useCallback(() => {
    applicationService.getAttachments(id)
      .then((data) => setAttachments(data || []))
      .catch(() => setAttachments([]));
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    applicationService.getAttachments(id)
      .then((data) => { if (!cancelled) setAttachments(data || []); })
      .catch(() => { if (!cancelled) setAttachments([]); });
    return () => { cancelled = true; };
  }, [id]);

  const handleDownloadAttachment = async (attachment) => {
    try {
      await applicationService.downloadAttachment(
        id,
        attachment.id,
        attachment.originalFileName || attachment.fileName
      );
    } catch (err) {
      console.error('Failed to download attachment', err);
      pushToast('Không tải được tài liệu này', 'error');
    }
  };

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
  const isPendingWorkflow = ['pending', 'submitted', 'pendingapproval'].includes(request.status);
  const isTimeoutWorkflow = request.status === 'returned_timeout';
  const timeoutStepIndex = (() => {
    if (!request.steps?.length) return Math.max(0, Number(request.currentStep) || 0);

    const pendingIndex = request.steps.findIndex((step) =>
      ['pending', 'submitted', 'pendingapproval'].includes((step.status || '').toLowerCase())
    );

    if (pendingIndex >= 0) return pendingIndex;
    return Math.min(Number(request.currentStep) || 0, request.steps.length - 1);
  })();
  const activeStepIndex = isTimeoutWorkflow ? timeoutStepIndex : (() => {
    if (!request.steps?.length) return Math.max(0, Number(request.currentStep) || 0);

    const pendingIndex = request.steps.findIndex((step) =>
      ['pending', 'submitted', 'pendingapproval'].includes((step.status || '').toLowerCase())
    );

    if (pendingIndex >= 0) return pendingIndex;

    const currentIndex = Number(request.currentStep) || 0;
    return Math.min(currentIndex, request.steps.length - 1);
  })();
  const pendingStep = request.steps[activeStepIndex];

  // BE-15: đơn đang chờ CHÍNH người tạo bổ sung thông tin
  const isSupplementWorkflow = request.status === 'needssupplement';
  const isSupplementOwner = isSupplementWorkflow && currentUserId && request.creatorId === currentUserId;

  // Lý do bổ sung do người duyệt gửi (comment "[Yêu cầu bổ sung] ..."), lấy từ lịch sử thảo luận
  const supplementReasons = (request.comments || [])
    .filter((c) => (c.text || '').startsWith('[Yêu cầu bổ sung]'))
    .map((c) => ({ text: (c.text || '').replace('[Yêu cầu bổ sung]', '').trim(), at: c.at }));
  const lastSupplementReason = supplementReasons.length ? supplementReasons[supplementReasons.length - 1] : null;

  const postComment = async () => {
    if (!comment.trim()) return;
    const text = comment;
    setComment('');
    // BE-15: chờ gửi xong rồi tải lại chi tiết để bình luận xuất hiện ngay
    await addComment(request.id, text);
    refreshDetail();
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-background h-full overflow-hidden">
      <header className="bg-surface border-b border-outline-variant flex-shrink-0 z-20">
        <div className="px-6 py-4 border-b border-outline-variant/50">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-sm text-secondary hover:text-primary transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Quay lại
          </button>
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
            {/* BE-15: đơn đang chờ chính người tạo bổ sung -> cho bổ sung & gửi lại ngay tại đây */}
            {isSupplementOwner ? (
              <>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warning-container text-on-warning-container text-xs font-semibold">
                  <span className="material-symbols-outlined text-[16px]">edit_note</span>
                  Người duyệt yêu cầu bạn bổ sung thông tin
                </span>
                <button
                  onClick={() => setSupplementEditOpen(true)}
                  className="px-5 py-1.5 rounded text-sm font-medium bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-colors flex items-center gap-2 border border-transparent shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">edit_note</span>
                  Bổ sung &amp; gửi lại
                </button>
              </>
            ) : (
              <>
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
                  disabled={!actionable}
                  className="px-3 py-1.5 rounded text-sm font-medium border border-outline-variant text-on-surface hover:bg-surface-container transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  title={actionable ? 'Yêu cầu người gửi bổ sung thông tin' : 'Bạn không phải người duyệt bước này'}
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
              </>
            )}
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
                    onClick={async () => {
                      setShowApproveConfirm(false);
                      // chờ API xong rồi mới tải lại chi tiết (tránh race -> UI bị stale)
                      await approveRequest(request.id);
                      refreshDetail();
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
            {/* BE-15: banner lý do cần bổ sung (lấy từ comment "[Yêu cầu bổ sung] ...") */}
            {isSupplementWorkflow && (
              <section className="bg-warning-container/30 border border-warning/30 rounded-lg shadow-sm overflow-hidden">
                <div className="px-4 py-3 flex items-start gap-3">
                  <span className="material-symbols-outlined text-warning text-[20px] flex-shrink-0">edit_note</span>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm text-on-surface font-semibold">Đơn đang chờ bổ sung thông tin</h2>
                    {lastSupplementReason ? (
                      <p className="text-sm text-on-surface mt-1">
                        <strong className="font-semibold">Lý do cần bổ sung:</strong> {lastSupplementReason.text}
                        {lastSupplementReason.at && <span className="text-xs text-secondary ml-1">({lastSupplementReason.at})</span>}
                      </p>
                    ) : (
                      <p className="text-sm text-secondary mt-1 italic">Người duyệt yêu cầu bạn bổ sung thông tin cho đơn này.</p>
                    )}
                    {isSupplementOwner && (
                      <button
                        onClick={() => setSupplementEditOpen(true)}
                        className="mt-2 px-3.5 py-1.5 rounded-md bg-primary text-on-primary hover:bg-primary/90 transition-colors text-sm font-medium inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit_note</span>
                        Bổ sung &amp; gửi lại
                      </button>
                    )}
                  </div>
                </div>
              </section>
            )}

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
                    else if (key === 'totalDays') label = 'Tổng số ngày';

                    return (
                      <tr key={key}>
                        <th className="py-3 px-4 font-medium text-secondary bg-surface-container-lowest align-top border-r border-outline-variant">{label}</th>
                        <td className="py-3 px-4 text-on-surface">
                          {Array.isArray(val) ? val.join(', ') : (typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val))}
                        </td>
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
                      {attachments.length > 0 ? (
                        <div className="flex flex-col gap-1.5 items-start">
                          {attachments.map((a) => (
                            <button
                              key={a.id}
                              type="button"
                              onClick={() => handleDownloadAttachment(a)}
                              title={a.uploaderName ? `Người tải lên: ${a.uploaderName}` : undefined}
                              className="inline-flex items-center gap-2 border border-outline-variant rounded bg-surface px-3 py-1.5 text-sm hover:border-primary transition-colors text-on-surface group cursor-pointer max-w-full"
                            >
                              <span className="material-symbols-outlined text-[16px] text-secondary group-hover:text-primary">attach_file</span>
                              <span className="font-medium truncate">{a.originalFileName || a.fileName}</span>
                              <span className="text-xs text-secondary flex-shrink-0">{formatFileSize(a.fileSize)}</span>
                              <span className="material-symbols-outlined text-[16px] text-secondary group-hover:text-primary flex-shrink-0">download</span>
                            </button>
                          ))}
                        </div>
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
                  const authorName = u?.name || c.userName || 'User';
                  // BE-15: comment "[Yêu cầu bổ sung] ..." hiển thị nổi bật kèm lý do cụ thể
                  const isSupplement = (c.text || '').startsWith('[Yêu cầu bổ sung]');
                  if (isSupplement) {
                    const reason = (c.text || '').replace('[Yêu cầu bổ sung]', '').trim();
                    return (
                      <div key={i} className="flex gap-3">
                        <img className="w-8 h-8 rounded-full border border-outline-variant object-cover" src={u?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=random&color=fff&size=128`} alt={authorName} />
                        <div className="flex-1 bg-warning-container/40 border border-warning/30 rounded-md p-3">
                          <div className="flex justify-between items-start mb-1">
                            <span className="flex items-center gap-1.5 font-semibold text-sm text-warning">
                              <span className="material-symbols-outlined text-[16px]">edit_note</span>
                              Yêu cầu bổ sung
                            </span>
                            <span className="text-xs text-secondary">{c.at}</span>
                          </div>
                          <p className="text-xs text-secondary mb-1">Người gửi: {authorName}</p>
                          <p className="text-sm text-on-surface whitespace-pre-wrap">{reason}</p>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={i} className="flex gap-3">
                      <img className="w-8 h-8 rounded-full border border-outline-variant object-cover" src={u?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=random&color=fff&size=128`} alt={authorName} />
                      <div className="flex-1 bg-surface-container-lowest border border-outline-variant rounded-md p-3">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-sm text-on-surface">{authorName}</span>
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
          <div className={`border-b p-4 ${(actionable || isSupplementOwner) ? 'bg-warning-container/30 border-warning/20' : 'bg-surface-container-low border-outline-variant'}`}>
            <h3 className={`text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1 ${(actionable || isSupplementOwner) ? 'text-warning' : 'text-secondary'}`}>
              <span className="material-symbols-outlined text-[14px]">{(actionable || isSupplementOwner) ? 'warning' : 'task_alt'}</span>
              {(actionable || isSupplementOwner) ? 'Yêu cầu hành động' : 'Trạng thái'}
            </h3>
            <p className="text-sm text-on-surface">
              {isSupplementOwner ? (
                <>Đơn cần <strong>bạn bổ sung thông tin</strong> theo yêu cầu của người duyệt rồi gửi lại.</>
              ) : actionable ? (
                <>Đơn cần <strong>{currentUser?.name || 'bạn'}</strong> phê duyệt ở bước {activeStepIndex + 1}. Hạn chót: <strong>12 giờ</strong>.</>
              ) : request.status === 'approved' ? 'Đơn đã được phê duyệt hoàn tất.' : request.status === 'rejected' ? 'Đơn đã bị từ chối.' : request.status === 'returned_timeout' ? 'Đơn đã trả về nơi khởi tạo do quá hạn.' : isSupplementWorkflow ? 'Đơn đang chờ người gửi bổ sung thông tin.' : 'Đơn đang chờ người duyệt khác xử lý.'}
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
                  // Bước And/Sequential có nhiều người cùng duyệt -> hiện đủ thay vì chỉ người đầu tiên
                  const stepApproverNames = (s.approverIds?.length ? s.approverIds : [s.approverId])
                    .map((aid) => employees.find((x) => x.id === aid)?.name)
                    .filter(Boolean);
                  const approverName = stepApproverNames.length > 1
                    ? `${stepApproverNames.join(', ')} (${stepApproverNames.length} người)`
                    : (stepApproverNames[0] || u?.name || 'User');
                  const isCurrent = i === activeStepIndex && (isPendingWorkflow || isTimeoutWorkflow);
                  const isTimedOut = isTimeoutWorkflow && i === activeStepIndex;
                  // BE-15: bước đang giữ vì chờ người gửi bổ sung (không phải "đang duyệt")
                  const isSupplementPaused = isSupplementWorkflow && i === activeStepIndex;
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
                  if (isTimedOut) {
                    return (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-full bg-error text-on-error flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm ring-2 ring-error/20 ring-offset-1 ring-offset-surface">
                          <span className="material-symbols-outlined text-[13px]">close</span>
                        </div>
                        <div className="bg-error-container/20 p-2.5 rounded-xl border border-error/30 w-full -mt-1 shadow-sm">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold uppercase tracking-wide text-error">{STEP_ROLE[s.approverId] || `Cấp ${i + 1}`}</p>
                            <span className="inline-flex items-center gap-1 rounded-full bg-error text-on-error px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-90"></span>
                              Quá hạn
                            </span>
                          </div>
                          <p className="text-sm text-on-surface font-medium mt-0.5">{approverName}</p>
                          <p className="text-xs font-medium mt-0.5 text-error">Không phản hồi quá 12h, đơn trả về nơi khởi tạo</p>
                        </div>
                      </li>
                    );
                  }
                  // pending
                  return (
                    <li key={i} className="flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm transition-all ${isCurrent ? 'bg-warning text-on-warning ring-2 ring-warning/25 ring-offset-1 ring-offset-surface' : 'bg-surface border border-outline-variant text-secondary'}`}>
                        <span className="material-symbols-outlined text-[13px]">{isSupplementPaused ? 'edit_note' : isCurrent ? 'pending_actions' : 'schedule'}</span>
                      </div>
                      <div className={isCurrent ? 'bg-warning-container/25 p-2.5 rounded-xl border border-warning/30 w-full -mt-1 shadow-sm' : 'w-full'}>
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-xs font-bold uppercase tracking-wide ${isCurrent ? 'text-warning' : 'text-secondary'}`}>{STEP_ROLE[s.approverId] || `Cấp ${i + 1}`}</p>
                          {isCurrent && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-warning text-on-warning px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-90"></span>
                              {isSupplementPaused ? 'Chờ bổ sung' : 'Đang duyệt'}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-on-surface font-medium mt-0.5">{approverName}{pendingStep?.approverId === s.approverId && actionable ? ' (Bạn)' : ''}</p>
                        <p className={`text-xs font-medium mt-0.5 ${isCurrent ? 'text-warning' : 'text-secondary'}`}>
                          {isSupplementPaused ? 'Đã yêu cầu bổ sung - chờ người gửi cập nhật' : isCurrent ? (isTimeoutWorkflow ? 'Quá hạn 12h - chưa phản hồi' : 'Đang chờ xử lý') : 'Chưa đến lượt'}
                        </p>
                      </div>
                    </li>
                  );
                })}
                {/* BE-15: đơn bị yêu cầu bổ sung -> luồng quay về người gửi */}
                {isSupplementWorkflow && (
                  <li className="flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm ring-2 ring-warning/25 ring-offset-1 ring-offset-surface ${isSupplementOwner ? 'bg-warning text-on-warning' : 'bg-warning-container text-warning'}`}>
                      <span className="material-symbols-outlined text-[13px]">edit_note</span>
                    </div>
                    <div className="bg-warning-container/25 p-2.5 rounded-xl border border-warning/30 w-full -mt-1 shadow-sm">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold uppercase tracking-wide text-warning">Bổ sung thông tin</p>
                        <span className="inline-flex items-center gap-1 rounded-full bg-warning text-on-warning px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-90"></span>
                          {isSupplementOwner ? 'Cần bạn xử lý' : 'Chờ người gửi'}
                        </span>
                      </div>
                      <p className="text-sm text-on-surface font-medium mt-0.5">{creatorName} (Người gửi)</p>
                      <p className="text-xs font-medium mt-0.5 text-warning">Người duyệt yêu cầu bổ sung thông tin, đơn quay về người gửi</p>
                    </div>
                  </li>
                )}

                {request.steps.length === 0 && isPendingWorkflow && (
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-warning-container text-warning flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                      <span className="material-symbols-outlined text-[12px]">schedule</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-warning uppercase tracking-wide">Cấp {request.currentStep || 1}</p>
                      <p className="text-sm text-on-surface font-medium mt-0.5">Đang chờ hệ thống / người duyệt xử lý</p>
                    </div>
                  </li>
                )}
                {request.steps.length === 0 && request.status === "approved" && (
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-success-container text-success flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                      <span className="material-symbols-outlined text-[12px]">check</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-success uppercase tracking-wide">Hoàn tất</p>
                      <p className="text-sm text-on-surface font-medium mt-0.5">Đã phê duyệt</p>
                    </div>
                  </li>
                )}

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
          onConfirm={async (reason) => {
            setRejectOpen(false);
            await rejectRequest(request.id, reason);
            refreshDetail();
          }}
        />
      )}

      {supplementOpen && (
        <SupplementReasonModal
          requestId={request.id}
          onClose={() => setSupplementOpen(false)}
          onConfirm={async (reason) => {
            setSupplementOpen(false);
            await requestSupplement(request.id, reason);
            refreshDetail();
          }}
        />
      )}

      {/* BE-15: bổ sung & gửi lại ngay trên trang chi tiết (không cần sang màn khác) */}
      {supplementEditOpen && (
        <CreateRequestModal
          existingRequest={request}
          onClose={() => setSupplementEditOpen(false)}
          onSubmitted={() => {
            // Bổ sung xong -> tải lại chi tiết + tài liệu đính kèm
            refreshAttachments();
            refreshDetail();
          }}
        />
      )}

      {showUserInfo && (
        <UserInfoModal
          user={employees.find((u) => u.id === request.creatorId) || {
            id: request.creatorId,
            name: creatorName,
            role: creatorRole,
            avatar: creatorAvatar,
            employeeId: String(request.creatorId).substring(0, 8).toUpperCase(),
            email: null,
            personalEmail: null,
            phone: null,
            departmentId: null,
            status: 'active'
          }}
          onClose={() => setShowUserInfo(false)}
        />
      )}
    </div>
  );
}
