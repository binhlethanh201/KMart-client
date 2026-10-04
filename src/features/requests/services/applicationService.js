import apiClient from '../../../services/apiClient';
import { translate as t } from '../../../i18n/I18nProvider';

// BE-15: nhãn tiếng Việt + màu cho từng loại hành động trong "Nhật ký hệ thống".
// Backend trả Action dạng hằng số (APPROVED, SUPPLEMENT_REQUESTED...).
const HISTORY_META = {
  created: { type: 'create', text: 'Đơn được tạo' },
  submitted: { type: 'create', text: 'Gửi đơn để phê duyệt' },
  approved: { type: 'approve', text: 'Đã phê duyệt' },
  rejected: { type: 'reject', text: 'Đã từ chối đơn' },
  rejected: { type: 'reject', text: 'Đã từ chối đơn' },
  canceled: { type: 'timeout', text: 'Đã hủy đơn' },
  cancelled: { type: 'timeout', text: 'Đã hủy đơn' },
  supplement_requested: { type: 'supplement', text: 'Yêu cầu bổ sung thông tin' },
  supplement_completed: { type: 'supplement', text: 'Đã bổ sung và gửi lại' },
  // BE-38: hệ thống tự xử lý do quá hạn (trả về nơi khởi tạo)
  timeout: { type: 'timeout', text: 'Trả về do quá hạn xử lý' },
};

/**
 * BE-67: trạng thái hiển thị của đơn.
 *
 * Máy chủ khi đơn quá hạn sẽ đặt status = Canceled và ghi một mốc nhật ký Action = "Timeout".
 * Trước đây FE tự bịa ra trạng thái 'returned_timeout' ở client (chỉ sửa state, mất khi tải lại).
 * Nay suy ra TỪ DỮ LIỆU THẬT để UI hiện đúng "Trả về (quá hạn)".
 */
const deriveStatus = (a) => {
  const status = (a.status || '').toLowerCase();
  const hasTimeoutHistory = (a.histories || []).some(
    (h) => (h.action || '').toLowerCase() === 'timeout'
  );
  return status === 'canceled' && hasTimeoutHistory ? 'returned_timeout' : status;
};

const mapToFrontendModel = (a) => {  const rawData = (typeof a.data === 'string')
    ? (() => { try { return JSON.parse(a.data); } catch { return {}; } })()
    : (a.data || {});
  return {
    id: a.id,
    title: a.title || (a.documentTypeName || t('Yêu cầu')),
    type: a.documentTypeName || t('Yêu cầu'),
    // cần cho BE-04 (chọn người duyệt) và cho luồng bổ sung rồi gửi lại
    documentTypeId: a.documentTypeId,
    selectedApproverId: a.selectedApproverId || null,
    _rawData: rawData,
    creatorId: a.creatorId || a.applicantId,
    creatorName: a.creatorName || a.applicantName,
    departmentId: a.departmentId,
    createdAt: new Date(a.createdAt).toLocaleString('vi-VN'),
    _createdAt: a.createdAt,
    // BE-67: hạn xử lý của bước hiện tại (máy chủ đặt theo cấu hình "Xử lý quá hạn" của bước).
    deadlineAt: a.deadlineAt || null,
    status: deriveStatus(a),
    currentStep: a.currentStepOrder || 0,
    // BE-89: KHÔNG ghi đè `reason` (và các khoá trùng tên field động).
    // Một số mẫu đơn có field động tên `reason` (nhãn "Lý do"); trước đây dòng `...(a.reason ? {reason})`
    // đè lên giá trị field động nên đơn hiện sai nội dung và mất giá trị nhân viên đã nhập.
    // Lý do cấp đơn được tách riêng thành `reasonText`.
    fields: {
      ...rawData,
      ...(a.startDate ? { startTime: new Date(a.startDate).toLocaleString('vi-VN') } : {}),
      ...(a.endDate ? { endTime: new Date(a.endDate).toLocaleString('vi-VN') } : {}),
      ...(a.totalDays ? { totalDays: a.totalDays } : {})
    },
    /** Lý do / mô tả cấp đơn (khác field động cùng tên `reason` của mẫu đơn). */
    reasonText: a.reason || '',
    steps: (a.steps || []).map(s => ({
      approverId: s.approverId,
      // bước MultiRule = And/Sequential có nhiều người cùng duyệt, phải hiện đủ
      approverIds: (s.approverIds && s.approverIds.length)
        ? s.approverIds
        : (s.approverId ? [s.approverId] : []),
      status: s.status.toLowerCase(),
      actedAt: s.actedAt ? new Date(s.actedAt).toLocaleString('vi-VN') : null,
      // BE-18: cần giữ stepOrder để biết bước nào đang chờ (phân biệt người tới lượt
      // với người đã duyệt xong bước trước trong cùng danh sách /pending).
      stepOrder: s.stepOrder
    })),
    comments: (a.comments || []).map(c => ({
      id: c.id,
      userId: c.userId,
      userName: c.userName,
      text: c.content,
      at: new Date(c.createdAt).toLocaleString('vi-VN')
    })),
    // BE-25: nhật ký thô để card biết CHÍNH XÁC ai từ chối / ai yêu cầu bổ sung ở bước nào.
    // Không dùng `history` (đã ghép chuỗi tiếng Việt) vì cần userId + stepOrder + thời điểm.
    histories: (a.histories || []).map(h => ({
      userId: h.userId,
      userName: h.userName,
      action: (h.action || '').toLowerCase(),
      stepOrder: h.stepOrder,
      comment: h.comment,
      at: h.createdAt ? new Date(h.createdAt).toLocaleString('vi-VN') : null,
      // BE-30: giữ mốc thời gian THÔ để sắp thứ tự duyệt trong cùng một bước
      atRaw: h.createdAt || null
    })),
    history: (a.histories || []).map(h => {
      // BE-15: dịch Action -> nhãn tiếng Việt, kèm tên người thực hiện và lý do (nếu có)
      const key = (h.action || '').toLowerCase();
      const meta = HISTORY_META[key] || { type: 'comment', text: h.action || t('Cập nhật') };
      const actor = h.userName ? `${h.userName}` : '';
      let text = t(meta.text);
      if (actor) text += ` - ${actor}`;
      if (h.comment && !['supplement_requested'].includes(key)) text += `: ${h.comment}`;
      return {
        at: new Date(h.createdAt).toLocaleString('vi-VN'),
        text,
        type: meta.type
      };
    })
  };
};

export const applicationService = {
  getAll: async () => {
    try {
      const response = await apiClient.get('/applications?limit=1000');
      return response.data.items.map(mapToFrontendModel);
    } catch (err) {
      if (err.response?.status === 403 || err.response?.status === 401) return [];
      throw err;
    }
  },

  getMyRequests: async () => {
    const response = await apiClient.get('/applications/my?limit=1000');
    return response.data.items.map(mapToFrontendModel);
  },

  getPendingApprovals: async () => {
    const response = await apiClient.get('/applications/pending?limit=1000');
    // BE-75: `/applications/pending` trả cả những đơn người này ĐÃ đi qua (để hiện ở tab
    // "Đã phê duyệt"/"Từ chối"), nên cờ `_isPendingReq` ở đây mang nghĩa "đơn có gửi đến tôi",
    // KHÔNG phải "đang chờ tôi duyệt". Việc quyết định có hiện nút Duyệt hay không do
    // `canUserApprove` đảm nhiệm (dùng chung với trang phòng ban và trang chi tiết).
    return response.data.items.map(a => {
      const mapped = mapToFrontendModel(a);
      return { ...mapped, _isPendingReq: true };
    });
  },

  getById: async (id) => {
    const response = await apiClient.get(`/applications/${id}`);
    return mapToFrontendModel(response.data);
  },

  create: async (data) => {
    const payload = {
      documentTypeId: data.documentTypeId,
      reason: data.reason || '',
      data: data.data || {},
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      totalDays: data.totalDays || null,
      // BE-04: người duyệt do người tạo chọn (chỉ gửi khi bước 1 có nhiều ứng viên)
      selectedApproverId: data.selectedApproverId || null,
    };
    const response = await apiClient.post('/applications', payload);
    return mapToFrontendModel(response.data);
  },

  submit: async (id) => {
    const response = await apiClient.post(`/applications/${id}/submit`);
    return mapToFrontendModel(response.data);
  },

  approve: async (id, comment = '') => {
    const response = await apiClient.post(`/applications/${id}/approve`, { comment });
    return mapToFrontendModel(response.data);
  },

  reject: async (id, reason) => {
    const response = await apiClient.post(`/applications/${id}/reject`, { reason });
    return mapToFrontendModel(response.data);
  },

  supplement: async (id, reason) => {
    const response = await apiClient.post(`/applications/${id}/supplement`, { reason });
    return mapToFrontendModel(response.data);
  },

  // BE-76: người tạo tự hủy đơn khi chưa ai duyệt. `reason` là tuỳ chọn.
  cancel: async (id, reason) => {
    const response = await apiClient.post(`/applications/${id}/cancel`, { reason: reason || null });
    return mapToFrontendModel(response.data);
  },

  /**
   * BE-67: giả lập quá hạn cho đơn đang chờ duyệt (chỉ ADMIN/HR).
   * Máy chủ đẩy hạn về quá khứ rồi chạy ĐÚNG luồng xử lý quá hạn thật
   * (trả về nơi khởi tạo hoặc chuyển lên cấp trên theo cấu hình bước).
   */
  simulateTimeout: async (id) => {
    const response = await apiClient.post(`/applications/${id}/simulate-timeout`);
    return response.data;
  },

  addComment: async (id, content) => {
    const response = await apiClient.post(`/applications/${id}/comments`, { content });
    return response.data;
  },

  // BE-09: tài liệu đính kèm. Backend đã có sẵn nhóm endpoint
  // /api/applications/{id}/attachments (list/upload/download/delete) nhưng FE chưa từng gọi.
  getAttachments: async (applicationId) => {
    const response = await apiClient.get(`/applications/${applicationId}/attachments`);
    return response.data || [];
  },

  // BE-09: upload file thật. Phải có applicationId trước nên chỉ gọi được SAU khi tạo đơn.
  uploadAttachment: async (applicationId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post(
      `/applications/${applicationId}/attachments`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  // Endpoint download có [Authorize] nên không dùng <a href> được (không gửi kèm Bearer token).
  // Phải tải qua axios rồi bơm vào object URL.
  downloadAttachment: async (applicationId, attachmentId, fileName) => {
    const response = await apiClient.get(
      `/applications/${applicationId}/attachments/${attachmentId}/download`,
      { responseType: 'blob' }
    );
    // BE-21: blob trả về có thể là JSON lỗi (vd 404) dù status 200 -> kiểm tra để báo đúng.
    const blob = response.data;
    if (blob && blob.type && blob.type.includes('application/json')) {
      const text = await blob.text();
      let msg = 'Không tải được tài liệu';
      try { msg = JSON.parse(text)?.error || msg; } catch { /* ignore */ }
      throw new Error(msg);
    }

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'attachment';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    // BUG FIX: trước đây remove() + revokeObjectURL() gọi NGAY sau click() khiến trình duyệt
    // thu hồi URL trước khi kịp tải -> file không tải được. Trễ cả hai một nhịp.
    setTimeout(() => {
      link.remove();
      window.URL.revokeObjectURL(url);
    }, 1500);
  },

  // Bổ sung thông tin cho đơn đang ở trạng thái NeedsSupplement
  update: async (id, data) => {
    const payload = {
      reason: data.reason || '',
      data: data.data || {},
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      totalDays: data.totalDays || null,
    };
    const response = await apiClient.put(`/applications/${id}`, payload);
    return mapToFrontendModel(response.data);
  }
};
