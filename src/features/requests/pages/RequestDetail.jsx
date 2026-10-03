import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApproval } from '../../../context/useApproval';
import { useHr } from '../../hr/context/HrProvider';
import RejectReasonModal from '../components/RejectReasonModal';
import SupplementReasonModal from '../components/SupplementReasonModal';
import CreateRequestModal from '../components/CreateRequestModal';
import UserInfoModal from '../components/UserInfoModal';
import { STATUS_META } from '../data/constants';
import useDocumentTitle from '../../../hooks/useDocumentTitle';
import { applicationService } from '../services/applicationService';
import { useI18n } from '../../../i18n/I18nProvider';

// BE-09: định dạng dung lượng file đính kèm
const formatFileSize = (bytes) => {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// BE-26: màu/viền cho từng loại mốc trong dòng thời gian xử lý
// BE-27: "đang duyệt" dùng màu CAM (khớp chỉ báo "Cần bạn duyệt" ngoài danh sách)
const stepTone = {
  approved: { ring: 'bg-success text-on-success', text: 'text-success', box: '' },
  rejected: { ring: 'bg-error text-on-error', text: 'text-error', box: '' },
  timeout: { ring: 'bg-error text-on-error', text: 'text-error', box: 'bg-error-container/20 border border-error/30' },
  supplement: { ring: 'bg-pink-600 text-white', text: 'text-pink-700', box: 'bg-pink-50 border border-pink-200' },
  current: { ring: 'bg-orange-500 text-white', text: 'text-orange-700', box: 'bg-orange-50 border border-orange-300' },
  idle: { ring: 'bg-surface border border-outline-variant text-secondary', text: 'text-secondary', box: '' },
};

export default function RequestDetail() {
  const { t } = useI18n();
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
      pushToast(t('Không tải được tài liệu này'), 'error');
    }
  };

  useDocumentTitle(request ? t('Chi tiết yêu cầu {v0}', { v0: request.id.substring(0, 8).toUpperCase() }) : t('Chi tiết yêu cầu'));

  if (!request) {
    return (
      <div className="flex-1 flex items-center justify-center h-full bg-background p-6">
        <div className="text-center">
          <span className="material-symbols-outlined text-[48px] text-outline block mb-2">search_off</span>
          <p className="text-on-surface font-medium">{t('Không tìm thấy yêu cầu')} {id}.</p>
          <Link to="/my-requests" className="text-primary text-sm hover:underline mt-2 inline-block">{t('Quay lại danh sách')}</Link>
        </div>
      </div>
    );
  }

  const meta = STATUS_META[request.status] || { badge: 'bg-gray-100 text-gray-800', dot: 'bg-gray-500', label: t('Không rõ') };
  // BE-28: trong trang chi tiết dùng TEAL cho "yêu cầu bổ sung" (đồng bộ các khối bên dưới),
  // còn danh sách vẫn giữ màu tím của STATUS_META.
  const statusBadge = request.status === 'needssupplement'
    ? { badge: 'text-pink-700', dot: 'bg-pink-600' }
    : meta;
  const creatorName = request.creatorName || employees.find((u) => u.id === request.creatorId)?.name;
  const creatorRole = employees.find((u) => u.id === request.creatorId)?.position || t('Nhân viên');
  const creatorAvatar = employees.find((u) => u.id === request.creatorId)?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(creatorName || 'User')}&background=random&color=fff&size=128`;
  const actionable = canApprove(request);
  const isPendingWorkflow = ['pending', 'submitted', 'pendingapproval'].includes(request.status);

  /**
   * BE-67: hiển thị hạn xử lý của bước hiện tại (máy chủ đặt theo cấu hình "Xử lý quá hạn").
   * Trước đây người dùng không thấy còn bao lâu là hết hạn nên không hiểu vì sao đơn bị trả về.
   */
  const deadlineInfo = (() => {
    if (!isPendingWorkflow || !request.deadlineAt) return null;
    const deadline = new Date(request.deadlineAt);
    if (Number.isNaN(deadline.getTime())) return null;
    const hoursLeft = (deadline.getTime() - Date.now()) / 36e5;
    return {
      text: deadline.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      hoursLeft,
      overdue: hoursLeft <= 0,
      // Cảnh báo khi còn dưới 25% thời gian hoặc dưới 6 giờ.
      warning: hoursLeft > 0 && hoursLeft <= 6,
    };
  })();
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

  // BE-18: lý do từ chối (comment "[Từ chối] ..."), hiển thị banner khi đơn bị từ chối
  const rejectReasons = (request.comments || [])
    .filter((c) => (c.text || '').startsWith('[Từ chối]'))
    .map((c) => ({ text: (c.text || '').replace('[Từ chối]', '').trim(), at: c.at }));
  const lastRejectReason = rejectReasons.length ? rejectReasons[rejectReasons.length - 1] : (request.rejectReason ? { text: request.rejectReason, at: null } : null);

  // BE-26: gộp "Cấp bậc Phê duyệt" + "Nhật ký hệ thống" -> 1 dòng thời gian.
  // Lấy giờ duyệt RIÊNG của từng người trong bước (nhiều người duyệt cùng bước có thể duyệt lệch giờ).
  const histories = request.histories || [];
  const actedAtOf = {};
  // BE-30: giữ cả mốc thô để sắp thứ tự duyệt trong cùng 1 bước
  const actedAtRawOf = {};
  histories.forEach((h) => {
    if (h.action === 'approved' && h.at) actedAtOf[`${h.stepOrder}:${h.userId}`] = h.at;
    if (h.atRaw) actedAtRawOf[`${h.stepOrder}:${h.userId}`] = h.atRaw;
  });
  // BE-30: trạng thái RIÊNG của từng người trong bước (để mỗi người một màu:
  // đã duyệt = xanh lá, từ chối = đỏ, đã yêu cầu bổ sung = hồng).
  // BE-31: ưu tiên theo TRẠNG THÁI HIỆN TẠI của bước — nếu bước đã duyệt thì người
  // vừa yêu cầu bổ sung vừa duyệt sẽ hiện "Đã duyệt" (tránh hiện mãi hành động cũ).
  const actedByOf = {};
  histories.forEach((h) => {
    if (!h.at) return;
    const key = `${h.stepOrder}:${h.userId}`;
    const stepStatus = (request.steps || []).find(x => (x.stepOrder ?? 0) === h.stepOrder)?.status;
    // BE-31: bước đã duyệt xong thì bỏ qua mốc "yêu cầu bổ sung" cũ (tránh hiện mãi hành động đã qua)
    if (stepStatus === 'approved' && h.action === 'supplement_requested') return;
    const rank = stepStatus === 'approved'
      ? { approved: 3, rejected: 2 }
      : { rejected: 3, supplement_requested: 2, approved: 1 };
    const r = rank[h.action] || 0;
    if (!actedByOf[key] || r > (rank[actedByOf[key]] || 0)) actedByOf[key] = h.action;
  });

  // BE-31: FALLBACK cho đơn CŨ thiếu mốc nhật ký (từ chối trước khi có tính năng lưu history).
  // Khi bước đã kết thúc (approved/rejected) thì `step.approverId` chính là NGƯỜI ĐÃ THAO TÁC,
  // và `step.actedAt` là giờ họ thao tác.
  const stepActorOf = {};
  (request.steps || []).forEach((s) => {
    const n = s.stepOrder ?? 0;
    if ((s.status === 'approved' || s.status === 'rejected') && s.approverId) {
      stepActorOf[n] = {
        userId: s.approverId,
        action: s.status === 'approved' ? 'approved' : 'rejected',
        at: s.actedAt,
      };
    }
  });
  // BE-34: khi bước đã kết thúc mà có ít nhất 1 mốc nhật ký thì CHỈ người có mốc mới được coi
  // là đã thao tác. Trước đây fallback "cả bước đã duyệt thì ai cũng đã duyệt" khiến người
  // không hề duyệt (vd bước chỉ Vũ Thanh Hằng duyệt) cũng hiện "đã duyệt".
  const stepHasActorHistory = {};
  histories.forEach((h) => {
    if (h.action === 'approved' || h.action === 'rejected') {
      stepHasActorHistory[h.stepOrder] = true;
    }
  });
  const supplementEvents = histories.filter((h) => h.action === 'supplement_requested');
  const supplementDone = histories.filter((h) => h.action === 'supplement_completed');
  const nameOf = (uid) => employees.find((x) => x.id === uid)?.name || t('Người dùng');
  // BE-31: mốc nào xảy ra TRƯỚC thì hiện trước (so theo thời gian thực)
  const msOf = (v) => (v ? new Date(v).getTime() : Number.MAX_SAFE_INTEGER);
  const stepDoneMs = (n) => {
    const times = histories
      .filter((h) => h.stepOrder === n && (h.action === 'approved' || h.action === 'rejected') && h.atRaw)
      .map((h) => new Date(h.atRaw).getTime());
    const step = (request.steps || []).find((x) => (x.stepOrder ?? 0) === n);
    if (step?.actedAt) times.push(new Date(step.actedAt).getTime());
    return times.length ? Math.min(...times) : Number.MAX_SAFE_INTEGER;
  };

  // BE-26: sắp mốc theo bước để "yêu cầu bổ sung" / "đã bổ sung" nằm ĐÚNG chỗ trong dòng thời gian
  const stepOrdered = (request.steps || []).map((s, i) => ({ step: s, index: i }))
    .sort((a, b) => (a.step.stepOrder ?? a.index + 1) - (b.step.stepOrder ?? b.index + 1));

  // BE-26: gộp mọi mốc thành 1 danh sách rồi sắp theo bước -> đọc như một dòng thời gian thật.
  // Thứ tự trong cùng 1 bước: yêu cầu bổ sung -> bước duyệt -> đã bổ sung và gửi lại.
  // BE-27: mỗi NGƯỜI duyệt là 1 CHẤM riêng (to/nhỏ) để thấy rõ ai duyệt trước ai duyệt sau.
  const timelineItems = [{ kind: 'creator', key: 'creator', order: 0 }];
  stepOrdered.forEach(({ step: s, index: i }) => {
    const n = s.stepOrder ?? i + 1;
    timelineItems.push({ kind: 'step', step: s, index: i, key: `step-${i}`, order: n * 100 + 20 });
    const ids = (s.approverIds?.length ? s.approverIds : [s.approverId]).filter(Boolean);
    // BE-30: trong bước, ai duyệt TRƯỚC hiện trước (theo giờ thực); người chưa duyệt giữ nguyên thứ tự.
    const sortedIds = [...ids].sort((a, b) => {
      const ta = actedAtRawOf[`${n}:${a}`];
      const tb = actedAtRawOf[`${n}:${b}`];
      if (ta && tb) return new Date(ta) - new Date(tb);
      if (ta) return -1;
      if (tb) return 1;
      return 0;
    });
    sortedIds.forEach((aid, k) => {
      timelineItems.push({
        kind: 'person',
        step: s,
        index: i,
        approverId: aid,
        key: `person-${i}-${k}`,
        order: n * 100 + 25 + k,   // giữ đúng thứ tự duyệt trong bước
      });
    });
  });
  supplementEvents.forEach((h, i) => {
    const n = h.stepOrder || 1;
    // BE-31: nếu bước đã kết thúc TRƯỚC khi yêu cầu bổ sung -> hiện yêu cầu bổ sung SAU bước
    const after = msOf(h.atRaw) > stepDoneMs(n);
    timelineItems.push({
      kind: 'suppRequest',
      h,
      key: `suppreq-${i}`,
      order: after ? n * 100 + 40 : n * 100 + 5,
    });
  });
  supplementDone.forEach((h, i) => {
    const n = h.stepOrder || 1;
    const after = msOf(h.atRaw) > stepDoneMs(n);
    timelineItems.push({
      kind: 'suppDone',
      h,
      key: `suppdone-${i}`,
      order: after ? n * 100 + 50 : n * 100 + 6,
    });
  });
  // đơn chờ bổ sung nhưng chưa có mốc nhật ký -> vẫn hiện để biết đang chờ ai
  if (isSupplementWorkflow && supplementEvents.length === 0) {
    timelineItems.push({ kind: 'suppPending', key: 'supppending', order: (request.currentStep || 1) * 100 + 15 });
  }
  // BE-27: mốc kết thúc luôn nằm cuối, KHÔNG bị mất khi đơn hoàn tất / hủy / từ chối / quá hạn
  timelineItems.push({ kind: 'finish', key: 'finish', order: 999999 });
  timelineItems.sort((a, b) => a.order - b.order);

  // BE-50: chuỗi "từ ai ➔ đến ai" của đơn — người đọc thấy ngay thứ tự duyệt.
  const flowPath = [
    { key: 'path-creator', label: request.applicantName || currentUser?.name || t('Người nộp'), stepNo: null, status: 'done' },
  ];
  stepOrdered.forEach(({ step: s, index: i }) => {
    const n = s.stepOrder ?? i + 1;
    const ids = (s.approverIds?.length ? s.approverIds : [s.approverId]).filter(Boolean);
    const names = ids.map((id) => employees.find((x) => x.id === id)?.name).filter(Boolean);
    if (names.length === 0) return;
    flowPath.push({ key: `path-${n}`, label: names.join(' / '), stepNo: n, status: s.status });
  });

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
            {t('Quay lại')}
          </button>
        </div>

        {/* Action Header */}
        <div className="px-6 py-4 flex flex-col xl:flex-row xl:justify-between xl:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="font-display-lg text-on-surface">{request.title}</h1>
              <span className={`inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide ${statusBadge.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
                {t(meta.label)}
              </span>
            </div>
            <p className="font-body-md text-secondary text-sm">
              {t('Mã hệ thống:')} <strong>{request.id.substring(0, 8).toUpperCase()}</strong> {t('- Đã nộp:')} {request.createdAt} {t('- Người tạo:')} <strong>{creatorName}</strong>
            </p>

            {/* BE-67: hạn xử lý của bước hiện tại để người dùng biết còn bao lâu là quá hạn */}
            {deadlineInfo && (
              <p
                className={`mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                  deadlineInfo.overdue
                    ? 'bg-error-container text-on-error-container border-error/30'
                    : deadlineInfo.warning
                      ? 'bg-warning-container text-on-warning-container border-warning/30'
                      : 'bg-surface-container-low text-secondary border-outline-variant'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">schedule</span>
                {deadlineInfo.overdue
                  ? t('Đã quá hạn xử lý từ {v0}', { v0: deadlineInfo.text })
                  : t('Hạn xử lý: {v0} (còn {v1} giờ)', { v0: deadlineInfo.text, v1: Math.max(1, Math.round(deadlineInfo.hoursLeft)) })}
              </p>
            )}
          </div>

          {/* Action bar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* BE-15: đơn đang chờ chính người tạo bổ sung -> cho bổ sung & gửi lại ngay tại đây */}
            {isSupplementOwner ? (
              <>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pink-50 text-pink-800 text-xs font-semibold border border-pink-200">
                  <span className="material-symbols-outlined text-[16px]">edit_note</span>
                  {t('Người duyệt yêu cầu bạn bổ sung thông tin')}
                </span>
                <button
                  onClick={() => setSupplementEditOpen(true)}
                  className="px-5 py-1.5 rounded text-sm font-medium bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-colors flex items-center gap-2 border border-transparent shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">edit_note</span>
                  {t('Bổ sung & gửi lại')}
                </button>
              </>
            ) : (
              <>
                {import.meta.env.DEV && (
                  <button
                    onClick={() => simulateTimeout(request.id)}
                    className="px-3 py-1.5 rounded text-sm font-medium border border-warning text-warning hover:bg-warning-container transition-colors flex items-center gap-2 bg-surface cursor-pointer"
                    title={t('Giả lập đơn quá hạn để thử luồng xử lý quá hạn (chỉ ADMIN/HR)')}
                  >
                    <span className="material-symbols-outlined text-[16px]">bolt</span>
                    {t('Giả lập quá hạn')}
                  </button>
                )}
                <div className="w-px h-6 bg-outline-variant mx-1"></div>
                <button
                  onClick={() => setSupplementOpen(true)}
                  disabled={!actionable}
                  className="px-3 py-1.5 rounded text-sm font-medium border border-outline-variant text-on-surface hover:bg-surface-container transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  title={actionable ? t('Yêu cầu người gửi bổ sung thông tin') : t('Bạn không phải người duyệt bước này')}
                >
                  <span className="material-symbols-outlined text-[16px]">edit_note</span>
                  {t('Yêu cầu bổ sung')}
                </button>
                <button
                  onClick={() => setRejectOpen(true)}
                  disabled={!actionable}
                  className="px-4 py-1.5 rounded text-sm font-medium border border-error text-error hover:bg-error-container transition-colors flex items-center gap-2 bg-surface cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  title={actionable ? t('Từ chối yêu cầu') : t('Bạn không phải người duyệt bước này')}
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                  {t('Từ chối')}
                </button>
                <button
                  onClick={() => setShowApproveConfirm(true)}
                  disabled={!actionable}
                  className="px-5 py-1.5 rounded text-sm font-medium bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-colors flex items-center gap-2 border border-transparent shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  title={actionable ? t('Phê duyệt yêu cầu') : t('Bạn không phải người duyệt bước này')}
                >
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  {t('Duyệt yêu cầu')}
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
                    <h3 className="font-semibold text-on-surface">{t('Xác nhận phê duyệt')}</h3>
                    <p className="text-sm text-secondary">{t('Hành động này không thể hoàn tác')}</p>
                  </div>
                </div>
                <p className="text-sm text-on-surface mb-6">
                  {t('Bạn có chắc chắn muốn phê duyệt yêu cầu này không?')}
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowApproveConfirm(false)}
                    className="px-4 py-2 rounded border border-outline-variant text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                  >
                    {t('Hủy')}
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
                    {t('Xác nhận duyệt')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-background">
        {/* Left: detail + discussion */}
        <div className="flex-1 overflow-y-auto p-6 border-r border-outline-variant">
          <div className="w-full space-y-6">
            {/* BE-15: banner lý do cần bổ sung (lấy từ comment "[Yêu cầu bổ sung] ...") */}
            {isSupplementWorkflow && (
              <section className="bg-pink-50/60 border border-pink-200 rounded-lg shadow-sm overflow-hidden">
                <div className="px-4 py-3 flex items-start gap-3">
                  <span className="material-symbols-outlined text-pink-700 text-[20px] flex-shrink-0">edit_note</span>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm text-on-surface font-semibold">{t('Đơn đang chờ bổ sung thông tin')}</h2>
                    {lastSupplementReason ? (
                      <p className="text-sm text-on-surface mt-1">
                        <strong className="font-semibold">{t('Lý do cần bổ sung:')}</strong> {lastSupplementReason.text}
                        {lastSupplementReason.at && <span className="text-xs text-secondary ml-1">({lastSupplementReason.at})</span>}
                      </p>
                    ) : (
                      <p className="text-sm text-secondary mt-1 italic">{t('Người duyệt yêu cầu bạn bổ sung thông tin cho đơn này.')}</p>
                    )}
                    <p className="text-xs text-pink-700 mt-2 font-medium">
                      {isSupplementOwner ? t('Bấm "Bổ sung & gửi lại" ở góc trên bên phải để cập nhật và gửi lại đơn.') : t('Đang chờ người gửi cập nhật và gửi lại.')}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* BE-18: banner lý do từ chối (comment "[Từ chối] ..." hoặc rejectReason cũ) */}
            {request.status === 'rejected' && lastRejectReason && (
              <section className="bg-error-container/30 border border-error/30 rounded-lg shadow-sm overflow-hidden">
                <div className="px-4 py-3 flex items-start gap-3">
                  <span className="material-symbols-outlined text-error text-[20px] flex-shrink-0">block</span>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm text-on-surface font-semibold">{t('Đơn đã bị từ chối')}</h2>
                    <p className="text-sm text-on-surface mt-1">
                      <strong className="font-semibold">{t('Lý do từ chối:')}</strong> {lastRejectReason.text}
                      {lastRejectReason.at && <span className="text-xs text-secondary ml-1">({lastRejectReason.at})</span>}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Detail block */}
            <section className="bg-surface border border-outline-variant rounded-lg shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-surface-container-low border-b border-outline-variant flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-secondary">feed</span>
                <h2 className="text-sm text-on-surface uppercase tracking-wide font-semibold">{t('Chi tiết Đề xuất')}</h2>
              </div>
              <table className="w-full text-left text-sm">
                <tbody className="divide-y divide-outline-variant">
                  <tr>
                    <th className="py-3 px-4 font-medium text-secondary bg-surface-container-lowest w-1/3 align-top border-r border-outline-variant">{t('Người đề xuất')}</th>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img className="w-8 h-8 rounded-full border border-outline-variant object-cover" src={creatorAvatar} alt={creatorName} />
                          <div>
                            <p className="font-medium text-on-surface">{creatorName} ({String(request.creatorId).substring(0, 8).toUpperCase()})</p>
                            <p className="text-xs text-secondary">{creatorRole} {t('- Kmart Siêu thị Cầu Giấy')}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowUserInfo(true)}
                          className="p-1.5 text-secondary hover:text-primary hover:bg-primary-container/30 rounded-full transition-colors cursor-pointer"
                          title={t('Xem thông tin chi tiết')}
                        >
                          <span className="material-symbols-outlined text-[20px]">info</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <th className="py-3 px-4 font-medium text-secondary bg-surface-container-lowest align-top border-r border-outline-variant">{t('Loại đơn từ')}</th>
                    <td className="py-3 px-4 text-on-surface">{request.type}</td>
                  </tr>
                  {Object.entries(request.fields).map(([key, val]) => {
                    // Skip internal or special fields
                    if (['title', 'type', 'attachment'].includes(key)) return null;
                    if (key.startsWith('__')) return null; // BE-19: ẩn trường nội bộ (snapshot người duyệt)
                    if (val === undefined || val === null || val === '') return null; // hide empty
                    if (Array.isArray(val) && val.length === 0) return null; // ẩn mảng rỗng (vd departments)

                    // Map legacy keys to nice labels for seed data compatibility
                    let label = key;
                    if (key === 'startTime') label = t('Thời gian bắt đầu');
                    else if (key === 'endTime') label = t('Thời gian kết thúc');
                    else if (key === 'reason') label = t('Lý do cụ thể');
                    else if (key === 'impact') label = t('Ảnh hưởng công việc');
                    else if (key === 'totalDays') label = t('Tổng số ngày');

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
                      <th className="py-3 px-4 font-medium text-error bg-error-container/10 align-top border-r border-error/20">{t('Lý do từ chối')}</th>
                      <td className="py-3 px-4 text-on-error-container bg-error-container/10">{request.rejectReason}</td>
                    </tr>
                  )}
                  <tr>
                    <th className="py-3 px-4 font-medium text-secondary bg-surface-container-lowest align-top border-r border-outline-variant">{t('Tài liệu đính kèm')}</th>
                    <td className="py-3 px-4">
                      {attachments.length > 0 ? (
                        <div className="flex flex-col gap-1.5 items-start">
                          {attachments.map((a) => (
                            <button
                              key={a.id}
                              type="button"
                              onClick={() => handleDownloadAttachment(a)}
                              title={a.uploaderName ? t('Người tải lên: {v0}', { v0: a.uploaderName }) : undefined}
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
                        <span className="text-secondary text-xs italic">{t('Không có tài liệu')}</span>
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
                <h2 className="text-sm text-on-surface uppercase tracking-wide font-semibold">{t('Lịch sử Thảo luận')}</h2>
                <span className="ml-auto text-xs text-secondary">{request.comments?.length || 0} {t('bình luận')}</span>
              </div>
              <div className="p-4 space-y-3">
                {request.comments?.length === 0 && (
                  <p className="text-sm text-secondary italic">{t('Chưa có bình luận nào.')}</p>
                )}
                {request.comments?.map((c, i) => {
                  const u = employees.find((x) => x.id === c.userId);
                  const authorName = u?.name || c.userName || 'User';
                  // BE-15: comment "[Yêu cầu bổ sung] ..." hiển thị nổi bật kèm lý do cụ thể
                  const isSupplement = (c.text || '').startsWith('[Yêu cầu bổ sung]');
                  // BE-18: comment "[Từ chối] ..." hiển thị nổi bật kèm lý do từ chối
                  const isReject = (c.text || '').startsWith('[Từ chối]');
                  if (isSupplement) {
                    const reason = (c.text || '').replace('[Yêu cầu bổ sung]', '').trim();
                    return (
                      <div key={i} className="flex gap-3">
                        <img className="w-8 h-8 rounded-full border border-outline-variant object-cover" src={u?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=random&color=fff&size=128`} alt={authorName} />
                        <div className="flex-1 bg-pink-50/70 border border-pink-200 rounded-md p-3">
                          <div className="flex justify-between items-start mb-1">
                            <span className="flex items-center gap-1.5 font-semibold text-sm text-pink-700">
                              <span className="material-symbols-outlined text-[16px]">edit_note</span>
                              {t('Yêu cầu bổ sung')}
                            </span>
                            <span className="text-xs text-secondary">{c.at}</span>
                          </div>
                          <p className="text-xs text-secondary mb-1">{t('Người gửi:')} {authorName}</p>
                          <p className="text-sm text-on-surface whitespace-pre-wrap">{reason}</p>
                        </div>
                      </div>
                    );
                  }
                  if (isReject) {
                    const reason = (c.text || '').replace('[Từ chối]', '').trim();
                    return (
                      <div key={i} className="flex gap-3">
                        <img className="w-8 h-8 rounded-full border border-outline-variant object-cover" src={u?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=random&color=fff&size=128`} alt={authorName} />
                        <div className="flex-1 bg-error-container/40 border border-error/30 rounded-md p-3">
                          <div className="flex justify-between items-start mb-1">
                            <span className="flex items-center gap-1.5 font-semibold text-sm text-error">
                              <span className="material-symbols-outlined text-[16px]">block</span>
                              {t('Từ chối')}
                            </span>
                            <span className="text-xs text-secondary">{c.at}</span>
                          </div>
                          <p className="text-xs text-secondary mb-1">{t('Người duyệt:')} {authorName}</p>
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
                      placeholder={t('Nhập ghi chú hoặc thảo luận (Ctrl+Enter để gửi)...')}
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-secondary flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">alternate_email</span>
                        {t('@mention người dùng')}
                      </span>
                      <button
                        onClick={postComment}
                        disabled={!comment.trim()}
                        className="bg-secondary text-on-secondary hover:bg-secondary/90 hover:text-white px-4 py-1.5 rounded text-sm font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {t('Gửi phản hồi')}
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
          <div className={`border-b p-4 ${isSupplementOwner ? 'bg-pink-50/60 border-pink-200' : actionable ? 'bg-warning-container/30 border-warning/20' : 'bg-surface-container-low border-outline-variant'}`}>
            <h3 className={`text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1 ${isSupplementOwner ? 'text-pink-700' : actionable ? 'text-warning' : 'text-secondary'}`}>
              <span className="material-symbols-outlined text-[14px]">{(actionable || isSupplementOwner) ? 'warning' : 'task_alt'}</span>
              {(actionable || isSupplementOwner) ? t('Yêu cầu hành động') : t('Trạng thái')}
            </h3>
            <p className="text-sm text-on-surface">
              {isSupplementOwner ? (
                <>{t('Đơn cần')} <strong>{t('bạn bổ sung thông tin')}</strong> {t('theo yêu cầu của người duyệt rồi gửi lại.')}</>
              ) : actionable ? (
                <>{t('Đơn cần')} <strong>{currentUser?.name || t('bạn')}</strong> {t('phê duyệt ở bước')} {activeStepIndex + 1}{t('. Hạn chót:')} <strong>{t('12 giờ')}</strong>.</>
              ) : request.status === 'approved' ? t('Đơn đã được phê duyệt hoàn tất.') : request.status === 'rejected' ? t('Đơn đã bị từ chối.') : request.status === 'returned_timeout' ? t('Đơn đã trả về nơi khởi tạo do quá hạn.') : isSupplementWorkflow ? t('Đơn đang chờ người gửi bổ sung thông tin.') : t('Đơn đang chờ người duyệt khác xử lý.')}
            </p>
          </div>

          {/* BE-26: gộp "Cấp bậc Phê duyệt" + "Nhật ký hệ thống" -> 1 dòng thời gian duy nhất,
              mỗi mốc ghi rõ người thực hiện + thời gian; UI giữ nguyên phong cách timeline cũ. */}
          <div className="p-6">
            <h3 className="text-xs text-secondary uppercase tracking-widest mb-4 flex items-center gap-2 font-semibold">
              <span className="material-symbols-outlined text-[16px]">account_tree</span>
              {t('Tiến trình xử lý')}
            </h3>

            {/* BE-50: đường đi của đơn — rõ ràng TỪ AI ➔ ĐẾN AI theo đúng thứ tự duyệt */}
            <div className="mb-5 flex flex-wrap items-center gap-x-2 gap-y-1.5 px-3 py-2.5 rounded-lg border border-primary/20 bg-primary/5">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-primary">
                <span className="material-symbols-outlined text-[14px]">route</span>
                {t('Đường đi của đơn')}
              </span>
              {flowPath.map((p, pi) => (
                <span key={p.key} className="flex items-center gap-2">
                  {pi > 0 && (
                    <span className="material-symbols-outlined text-primary text-[16px] leading-none">arrow_forward</span>
                  )}
                  <span className="inline-flex items-center gap-1.5">
                    {p.stepNo != null && (
                      <span className="text-[10px] font-bold uppercase text-secondary">{t('Cấp')} {p.stepNo}</span>
                    )}
                    <span className={`text-[12px] font-semibold ${p.status === 'approved' ? 'text-success' : p.status === 'rejected' ? 'text-error' : 'text-on-surface'}`}>
                      {p.label}
                    </span>
                  </span>
                </span>
              ))}
              <span className="material-symbols-outlined text-success text-[16px] leading-none">arrow_forward</span>
              <span className="text-[12px] font-semibold text-success">{t('Hoàn tất')}</span>
            </div>

            <div className="relative">
              <div className="absolute left-[11px] top-3 bottom-3 w-px bg-outline-variant z-0"></div>
              <ul className="space-y-5 relative z-10">
                {timelineItems.map((item) => {
                  /* 1) Người nộp đơn */
                  if (item.kind === 'creator') {
                    return (
                      <li key={item.key} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-surface border border-outline-variant flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="material-symbols-outlined text-[12px] text-secondary">person</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-secondary uppercase tracking-wide">{t('Người nộp đơn')}</p>
                          <p className="text-sm text-on-surface font-medium mt-0.5">{creatorName}</p>
                          <p className="text-[11px] text-secondary mt-0.5">{t('Đã nộp:')} {request.createdAt}</p>
                        </div>
                      </li>
                    );
                  }

                  /* 2) Người duyệt đã yêu cầu bổ sung */
                  if (item.kind === 'suppRequest') {
                    const h = item.h;
                    const reason = (h.comment || '').replace('[Yêu cầu bổ sung]', '').trim();
                    return (
                      <li key={item.key} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-pink-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                          <span className="material-symbols-outlined text-[12px]">edit_note</span>
                        </div>
                        <div className="bg-pink-50/70 border border-pink-200 p-2.5 rounded-xl -mt-1 shadow-sm w-full min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold uppercase tracking-wide text-pink-700">{t('Yêu cầu bổ sung')}</p>
                            <span className="text-[11px] font-medium text-pink-700 flex-shrink-0">{h.at}</span>
                          </div>
                          <p className="text-sm text-on-surface font-medium mt-0.5">{nameOf(h.userId)} {t('(Người duyệt)')}</p>
                          {reason && <p className="text-[11px] text-pink-700 mt-1">{reason}</p>}
                        </div>
                      </li>
                    );
                  }

                  /* 3) Người gửi đã bổ sung và gửi lại */
                  if (item.kind === 'suppDone') {
                    const h = item.h;
                    return (
                      <li key={item.key} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-pink-600/15 text-pink-700 border border-pink-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="material-symbols-outlined text-[12px]">refresh</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-pink-700 uppercase tracking-wide">{t('Bổ sung thông tin')}</p>
                          <p className="text-sm text-on-surface font-medium mt-0.5">{nameOf(h.userId)} {t('(Người gửi)')}</p>
                          <p className="text-[11px] text-pink-700 mt-0.5">{t('Đã bổ sung và gửi lại ·')} {h.at}</p>
                        </div>
                      </li>
                    );
                  }

                  /* 4) Đơn đang chờ bổ sung (chưa có mốc nhật ký) */
                  if (item.kind === 'suppPending') {
                    return (
                      <li key={item.key} className="flex items-start gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm ring-2 ring-pink-500/20 ring-offset-1 ring-offset-surface ${isSupplementOwner ? 'bg-pink-600 text-white' : 'bg-pink-50 text-pink-700 border border-pink-300'}`}>
                          <span className="material-symbols-outlined text-[12px]">edit_note</span>
                        </div>
                        <div className="bg-pink-50/70 border border-pink-200 p-2.5 rounded-xl -mt-1 shadow-sm w-full min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold uppercase tracking-wide text-pink-700">{t('Bổ sung thông tin')}</p>
                            <span className="inline-flex items-center gap-1 rounded-full bg-pink-600 text-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-90"></span>
                              {isSupplementOwner ? t('Cần bạn xử lý') : t('Chờ người gửi')}
                            </span>
                          </div>
                          <p className="text-sm text-on-surface font-medium mt-0.5">{creatorName} {t('(Người gửi)')}</p>
                          <p className="text-[11px] font-medium mt-1 text-pink-700">{t('Người duyệt yêu cầu bổ sung thông tin, đơn quay về người gửi')}</p>
                        </div>
                      </li>
                    );
                  }

                  /* 5) Một người duyệt: CHẤM to/nhỏ + giờ, thấy rõ ai trước ai sau.
                     BE-30: MỖI NGƯỜI mang màu theo trạng thái riêng của họ
                     (đã duyệt = xanh, từ chối = đỏ, yêu cầu bổ sung = hồng, đang chờ = cam). */
                  if (item.kind === 'person') {
                    const { step: s, index: i, approverId } = item;
                    const person = employees.find((x) => x.id === approverId);
                    const stepKey = `${s.stepOrder ?? i + 1}:${approverId}`;
                    // BE-30/31: màu + nhãn theo trạng thái RIÊNG của người này.
                    // Ưu tiên nhật ký; nếu đơn cũ thiếu nhật ký thì lấy người thao tác từ chính bước.
                    const stepNo = s.stepOrder ?? i + 1;
                    const fallbackActor = stepActorOf[stepNo];
                    // BE-34: chỉ dùng fallback (người thao tác suy từ bước) khi bước KHÔNG có
                    // mốc nhật ký nào (đơn cũ). Có nhật ký rồi thì chỉ tin nhật ký.
                    const isFallbackActor = !stepHasActorHistory[stepNo]
                      && fallbackActor && fallbackActor.userId === approverId;
                    // BE-31: bước đã duyệt xong -> người vừa xin bổ sung vừa duyệt coi như ĐÃ DUYỆT
                    const actedByRaw = actedByOf[stepKey]
                      || (isFallbackActor ? fallbackActor.action : undefined);
                    const actedBy = (s.status === 'approved' && actedByRaw === 'supplement_requested')
                      ? 'approved'
                      : actedByRaw;
                    const at = actedBy === 'supplement_requested'
                      ? (histories.find(h => h.stepOrder === stepNo && h.userId === approverId && h.action === 'supplement_requested')?.at || s.actedAt)
                      : actedAtOf[stepKey] || (isFallbackActor ? fallbackActor.at : null) || (actedBy ? s.actedAt : null);

                    const isCurrent = i === activeStepIndex && (isPendingWorkflow || isTimeoutWorkflow);
                    const isTimedOut = isTimeoutWorkflow && i === activeStepIndex;
                    const isSupplementPaused = isSupplementWorkflow && i === activeStepIndex;
                    // BE-31: đơn đã dừng (từ chối / hủy / quá hạn) -> người chưa thao tác không còn "chưa đến lượt"
                    const isTerminated = request.status === 'rejected' || request.status === 'canceled' || isTimeoutWorkflow;

                    // BE-13: CHỈ "Duyệt lần lượt" mới bắt buộc theo đúng thứ tự.
                    // "Đồng thời — cần tất cả đồng ý", "Đồng thời — chỉ cần 1 người" và bước
                    // không cấu hình quy tắc: ai duyệt trước cũng được, không có "chưa đến lượt".
                    // Bước "Chuỗi quản lý liên tiếp" luôn là tuần tự (giống backend).
                    const isSequential = (s.approverIds?.length > 1) && (
                      (s.multiRule || '').trim().toLowerCase() === 'sequential'
                      || (s.approvalType || '').trim().toLowerCase() === 'chain'
                    );
                    let isCurrentSequentialPerson = true;
                    if (isSequential && isCurrent) {
                      const ids = (s.approverIds?.length ? s.approverIds : [s.approverId]).filter(Boolean);
                      const firstPendingId = ids.find(id => {
                        const k = `${s.stepOrder ?? i + 1}:${id}`;
                        const fbActor = stepActorOf[s.stepOrder ?? i + 1];
                        const isFb = !stepHasActorHistory[s.stepOrder ?? i + 1] && fbActor?.userId === id;
                        const raw = actedByOf[k] || (isFb ? fbActor.action : undefined);
                        const act = (s.status === 'approved' && raw === 'supplement_requested') ? 'approved' : raw;
                        return act !== 'approved';
                      });
                      isCurrentSequentialPerson = (firstPendingId === approverId);
                    }

                    // Trạng thái riêng của người này
                    let personTone;
                    let personLabel;
                    if (actedBy === 'rejected') {
                      personTone = stepTone.rejected; personLabel = t('Đã từ chối');
                    } else if (actedBy === 'supplement_requested') {
                      personTone = stepTone.supplement; personLabel = t('Đã yêu cầu bổ sung');
                    } else if (actedBy === 'approved') {
                      personTone = stepTone.approved; personLabel = t('Đã duyệt');
                    } else if (isTimedOut) {
                      personTone = stepTone.timeout; personLabel = t('Quá hạn');
                    } else if (isSupplementPaused) {
                      // chưa thao tác, chỉ đang bị giữ vì người khác xin bổ sung -> màu trung tính
                      personTone = stepTone.idle; personLabel = t('Chờ bổ sung');
                    } else if (isTerminated) {
                      // đơn đã dừng -> người này không còn cơ hội xử lý
                      personTone = stepTone.idle; personLabel = t('Không xử lý');
                    } else if (s.status === 'approved') {
                      // BE-34: bước đã duyệt xong, người không có mốc nhật ký = không tham gia duyệt
                      personTone = stepTone.idle; personLabel = t('Không duyệt bước này');
                    } else if (s.status === 'rejected') {
                      personTone = stepTone.idle; personLabel = t('Không xử lý');
                    } else if (isCurrent) {
                      if (isSequential && !isCurrentSequentialPerson) {
                        personTone = stepTone.idle; personLabel = t('Chưa đến lượt');
                      } else {
                        personTone = stepTone.current; personLabel = t('Đang chờ xử lý');
                      }
                    } else {
                      personTone = stepTone.idle; personLabel = t('Chưa đến lượt');
                    }

                    const isMe = pendingStep?.approverId === approverId && actionable;
                    // người đã thao tác (duyệt / từ chối / yêu cầu bổ sung) -> chấm to có icon
                    const done = ['approved', 'rejected', 'supplement_requested'].includes(actedBy) || isTimedOut;

                    return (
                      <li key={item.key} className="flex items-center gap-3">
                        {/* BE-27: chấm NHỎ = từng người trong bước (chấm to w-6 là cả bước) */}
                        <div className={`rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${done ? 'w-[18px] h-[18px] ml-[3px]' : 'w-[10px] h-[10px] ml-[7px] border'} ${personTone.ring}`}>
                          {done && (
                            <span className="material-symbols-outlined text-[11px]">
                              {actedBy === 'approved' ? 'check' : actedBy === 'rejected' ? 'close' : actedBy === 'supplement_requested' ? 'edit_note' : 'schedule'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-baseline justify-between gap-2 flex-1 min-w-0 py-0.5">
                          <span className={`text-[13px] font-medium truncate ${done ? 'text-on-surface' : 'text-secondary'}`} title={person?.name}>
                            {person?.name || 'User'}{isMe ? t(' (Bạn)') : ''}
                          </span>
                          {/* người đã thao tác chỉ hiện giờ (màu đã thể hiện trạng thái); người chưa thao tác hiện trạng thái ngắn */}
                          <span className={`text-[11px] font-medium flex-shrink-0 ${personTone.text}`}>
                            {done && at ? at : personLabel}
                          </span>
                        </div>
                      </li>
                    );
                  }

                  /* 6) Một bước duyệt (nhãn + trạng thái) */
                  if (item.kind === 'step') {
                    const { step: s, index: i } = item;
                    // Nhãn bước lấy từ tên bước thật của luồng duyệt (không dùng bảng cứng).
                    const stepLabel = s.name || t('Cấp {v0}', { v0: s.stepOrder || i + 1 });
                  const isCurrent = i === activeStepIndex && (isPendingWorkflow || isTimeoutWorkflow);
                  const isTimedOut = isTimeoutWorkflow && i === activeStepIndex;
                  // BE-15: bước đang giữ vì chờ người gửi bổ sung (không phải "đang duyệt")
                  const isSupplementPaused = isSupplementWorkflow && i === activeStepIndex;
                  // BE-31: đơn đã dừng -> bước chưa xử lý không còn là "chưa đến lượt"
                  const isTerminated = request.status === 'rejected' || request.status === 'canceled' || isTimeoutWorkflow;

                  const toneKey = s.status === 'approved' ? 'approved'
                    : s.status === 'rejected' ? 'rejected'
                      : isTimedOut ? 'timeout'
                        : isSupplementPaused ? 'supplement'
                          : isCurrent ? 'current' : 'idle';
                  const tone = stepTone[toneKey];

                  return (
                    <li key={item.key} className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm ${tone.ring} ${(isCurrent || isTimedOut) ? 'ring-2 ring-current/20 ring-offset-1 ring-offset-surface' : ''}`}>
                        <span className="material-symbols-outlined text-[12px]">
                          {s.status === 'approved' ? 'check' : (s.status === 'rejected' || isTimedOut) ? 'close' : isSupplementPaused ? 'edit_note' : isCurrent ? 'pending_actions' : 'schedule'}
                        </span>
                      </div>
                      <div className="w-full min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-xs font-bold uppercase tracking-wide ${tone.text}`}>{stepLabel}</p>
                          {(s.status === 'approved' || s.status === 'rejected') && (
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${s.status === 'approved' ? 'bg-success-container text-on-success-container' : 'bg-error-container text-on-error-container'}`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-90"></span>
                              {s.status === 'approved' ? t('Đã duyệt') : t('Từ chối')}
                            </span>
                          )}
                          {isTimedOut && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-error text-on-error px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-90"></span>
                              {t('Quá hạn')}
                            </span>
                          )}
                          {isCurrent && !isTimedOut && (
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${isSupplementPaused ? 'bg-pink-600 text-white' : 'bg-orange-500 text-white'}`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-90"></span>
                              {isSupplementPaused ? t('Chờ bổ sung') : t('Đang duyệt')}
                            </span>
                          )}
                        </div>
                        <p className={`text-[11px] font-medium mt-0.5 ${tone.text}`}>
                          {s.status === 'approved' ? t('Đã phê duyệt')
                            : s.status === 'rejected' ? t('Đã từ chối đơn')
                              : isTimedOut ? t('Không phản hồi quá 12h, đơn trả về nơi khởi tạo')
                                : isSupplementPaused ? t('Đã yêu cầu bổ sung - chờ người gửi cập nhật')
                                  : isTerminated ? t('Không xử lý (đơn đã dừng)')
                                    : isCurrent ? t('Đang chờ xử lý') : t('Chưa đến lượt')}
                        </p>
                      </div>
                    </li>
                  );
                  }

                  /* 7) Mốc kết thúc: LUÔN hiện khi đơn đã dừng (hoàn tất / từ chối / hủy / quá hạn) */
                  if (item.kind === 'finish') {
                    if (request.status === 'approved') {
                      return (
                        <li key={item.key} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-success text-on-success flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                            <span className="material-symbols-outlined text-[12px]">task_alt</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-success uppercase tracking-wide">{t('Hoàn tất')}</p>
                            <p className="text-sm text-on-surface font-medium mt-0.5">{t('Đơn đã được phê duyệt đầy đủ các cấp')}</p>
                          </div>
                        </li>
                      );
                    }
                    if (request.status === 'rejected' || isTimeoutWorkflow || request.status === 'canceled') {
                      const label = isTimeoutWorkflow ? t('Trả về nơi khởi tạo') : request.status === 'canceled' ? t('Đã hủy đơn') : t('Đã từ chối');
                      const desc = isTimeoutWorkflow ? t('Quá hạn xử lý 12h')
                        : request.status === 'canceled' ? t('Người gửi đã hủy đơn này')
                          : (lastRejectReason ? t('Lý do: {v0}', { v0: lastRejectReason.text }) : t('Đơn đã bị từ chối'));
                      return (
                        <li key={item.key} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-error text-on-error flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                            <span className="material-symbols-outlined text-[12px]">block</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-error uppercase tracking-wide">{label}</p>
                            <p className="text-sm text-on-surface font-medium mt-0.5">{desc}</p>
                            {request.status === 'rejected' && lastRejectReason?.at && (
                              <p className="text-[11px] text-error mt-0.5">{lastRejectReason.at}</p>
                            )}
                          </div>
                        </li>
                      );
                    }
                    if (request.steps.length === 0 && isPendingWorkflow) {
                      return (
                        <li key={item.key} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                            <span className="material-symbols-outlined text-[12px]">schedule</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-orange-700 uppercase tracking-wide">{t('Cấp')} {request.currentStep || 1}</p>
                            <p className="text-sm text-on-surface font-medium mt-0.5">{t('Đang chờ hệ thống / người duyệt xử lý')}</p>
                          </div>
                        </li>
                      );
                    }
                    return null;
                  }

                  return null;
                })}
              </ul>
            </div>
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
