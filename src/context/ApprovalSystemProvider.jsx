import { useState, useEffect, useCallback, useMemo } from 'react';
import { ApprovalSystemContext } from './approvalStore';
import { departmentService } from '../features/departments/services/departmentService';
import { applicationService } from '../features/requests/services/applicationService';
import { authService } from '../features/auth/services/authService';
import { userService, getFullAvatarUrl } from '../features/hr/services/userService';
import { PERMISSIONS } from '../constants/permissions';
import { useI18n } from '../i18n/I18nProvider';
import { describeApiError } from '../utils/apiError';
import { notifyHrDataChanged } from '../utils/hrEvents';
import { canUserApprove } from '../features/requests/approvalEligibility';

const STORAGE_KEY = 'kmart.approval.v3';

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (p && Array.isArray(p.requests)) {
        return {
          formFields: p.formFields || {}
        };
      }
    }
  } catch (e) { }
  return {
    formFields: {}
  };
}

export function ApprovalSystemProvider({ children }) {
  const { t } = useI18n();
  const init = load();
  const [currentUser, setCurrentUser] = useState(null);
  const [requests, setRequests] = useState([]); // Fetch from API
  const [departments, setDepartments] = useState([]); // Fetch from API
  const [employees, setEmployees] = useState([]);
  const [formFields, setFormFields] = useState(init.formFields);
  const [toasts, setToasts] = useState([]);

  // Persist to localStorage on any change.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ requests, formFields }));
    } catch {
      /* quota / private mode - ignore */
    }
  }, [requests, formFields]);

  // Load departments from API
  useEffect(() => {
    departmentService.getAll()
      .then(data => setDepartments(data))
      .catch(err => console.error('Failed to load departments', err));
  }, []);

  // Load employees from API (dùng cho EmployeeSelect trong Add/Edit Department)
  useEffect(() => {
    userService.getAll()
      .then(data => setEmployees(data))
      .catch(err => console.error('Failed to load employees', err));
  }, []);

  // Load requests from API
  const loadRequests = useCallback(async () => {
    try {
      const [allReqs, myReqs, pendingReqs] = await Promise.all([
        applicationService.getAll(),
        applicationService.getMyRequests(),
        applicationService.getPendingApprovals()
      ]);
      // Merge unique: order is important. pendingReqs comes last so its _isPendingReq overwrites others if same ID
      const all = [...allReqs, ...myReqs, ...pendingReqs];
      const unique = Array.from(new Map(all.map(item => [item.id, item])).values());
      setRequests(unique);
    } catch (err) {
      console.error('Failed to load requests', err);
    }
  }, []);

  useEffect(() => {
    loadRequests();
    authService.getCurrentUser().then(async u => {
      const positionsList = u.positions || u.departments || [];
      const primaryPos = positionsList.find(p => p.isPrimary) || positionsList[0];
      const actualAvatar = getFullAvatarUrl(u.avatarUrl);
      const parsedRoles = (u.roles || []).map(r => typeof r === 'string' ? r : r.roleName || r.name || r.role || '').filter(Boolean);
      let perms = (u.permissions || []).filter(p => typeof p === 'string');
      if (perms.length === 0 && parsedRoles.some(r => r.toUpperCase() === 'HR' || r.toUpperCase() === 'ADMIN' || r.toUpperCase() === 'ADMINISTRATOR')) {
        perms = ['*'];
      }

      setCurrentUser({
        id: u.id,
        name: u.fullName,
        email: u.email,
        personalEmail: u.personalEmail,
        phone: u.phone,
        departmentId: primaryPos?.departmentId,
        department: primaryPos?.departmentName || t('Chưa phân bổ'),
        positionId: primaryPos?.positionId,
        position: primaryPos?.positionName || t('Nhân viên'),
        allPositions: positionsList,
        role: u.roles?.[0]?.roleName || 'STAFF',
        profileData: u.profileData ? JSON.parse(u.profileData) : null,
        avatar: actualAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullName || 'User')}&background=random&color=fff&size=128`,
        roles: parsedRoles,
        permissions: perms,
      });
    }).catch(console.error);
  }, [loadRequests]);

  const currentUserId = currentUser?.id;

  const pushToast = useCallback((message, variant = 'info', { resolved = false } = {}) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, message, variant, resolved }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3000);
  }, []);

  const dismissToast = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  // BE-09: upload file đính kèm. Backend cần applicationId để gắn file nên bắt buộc
  // phải chạy SAU khi tạo/cập nhật đơn và TRƯỚC khi submit.
  // Một file lỗi không được chặn cả đơn -> báo lỗi rồi đi tiếp.
  const uploadAttachments = useCallback(
    async (applicationId, files) => {
      if (!files || files.length === 0) return;
      for (const file of files) {
        try {
          await applicationService.uploadAttachment(applicationId, file);
        } catch (err) {
          console.error('Failed to upload attachment', file?.name, err);
          const msg = err.response?.data?.error || t('Không tải lên được "{v0}"', { v0: file?.name || 'file' });
          pushToast(msg, 'error');
        }
      }
    },
    [pushToast]
  );

  // Build a fresh request from modal form data.
  const createRequest = useCallback(
    async (data) => {
      try {
        // Create draft
        const req = await applicationService.create(data);
        // BE-09: đính kèm file thật (trước đây chỉ lưu TÊN file vào form data)
        await uploadAttachments(req.id, data.attachments);
        // Automatically submit
        const submitted = await applicationService.submit(req.id);
        setRequests((r) => [submitted, ...r]);
        pushToast(t('Đã tạo đề xuất {v0}', { v0: submitted.id }), 'success');
        return submitted.id;
      } catch (err) {
        let msg = t('Lỗi tạo đề xuất');
        if (err.response?.data?.errors) {
          const errs = err.response.data.errors;
          msg = Array.isArray(errs) ? errs[0] : (Object.values(errs)[0]?.[0] || msg);
        } else if (err.response?.data?.message) {
          msg = err.response.data.message;
        } else if (err.response?.data?.error) {
          msg = err.response.data.error;
        }
        pushToast(msg, 'error');
        console.error(err);
      }
    },
    [pushToast, uploadAttachments]
  );

  const approveRequest = useCallback(
    async (reqId) => {
      try {
        const updated = await applicationService.approve(reqId);
        // BE-75: ghi lại kết quả tức thì để UI đổi ngay, KHÔNG dựa vào cờ cũ trong danh sách.
        setRequests((list) => list.map((r) => (r.id === reqId ? { ...updated, _isPendingReq: false } : r)));
        pushToast(t('Đã phê duyệt bước này'), 'success');
        // BE-75: tải lại danh sách từ máy chủ. Trước đây chỉ sửa cục bộ nên số liệu bước duyệt,
        // trạng thái và nhãn "Cần bạn duyệt" của các đơn liên quan bị cũ.
        loadRequests();
        return true;
      } catch (err) {
        const errorMsg = err.response?.data?.error || err.response?.data?.message || t('Lỗi khi phê duyệt');
        pushToast(errorMsg, 'error');
        console.error('Approve error:', err);
        // BE-75: đơn có thể đã bị người khác duyệt / quá hạn. Tải lại để nút "Duyệt nhanh"
        // biến mất thay vì để người dùng bấm lại rồi nhận lỗi lần nữa.
        loadRequests();
        return false;
      }
    },
    [pushToast, t, loadRequests]
  );

  // Bổ sung thông tin cho đơn bị trả về (NeedsSupplement) rồi gửi lại cho người duyệt
  const updateRequest = useCallback(
    async (reqId, data) => {
      try {
        await applicationService.update(reqId, data);
        // BE-09: bổ sung thêm file đính kèm (nếu có) trước khi gửi lại
        await uploadAttachments(reqId, data.attachments);
        const submitted = await applicationService.submit(reqId);
        setRequests((list) => list.map((r) => (r.id === reqId ? { ...submitted, _isPendingReq: r._isPendingReq } : r)));
        pushToast(t('Đã bổ sung và gửi lại đơn'), 'success');
        return submitted.id;
      } catch (err) {
        const msg = err.response?.data?.error || err.response?.data?.message || t('Lỗi khi cập nhật đơn');
        pushToast(msg, 'error');
        console.error(err);
      }
    },
    [pushToast, uploadAttachments]
  );

  const rejectRequest = useCallback(
    async (reqId, reason) => {
      try {
        const updated = await applicationService.reject(reqId, reason);
        setRequests((list) => list.map((r) => (r.id === reqId ? { ...updated, _isPendingReq: false } : r)));
        pushToast(t('Đã từ chối yêu cầu'), 'success');
      } catch (err) {
        const errorMsg = err.response?.data?.error || err.response?.data?.message || t('Lỗi khi từ chối');
        pushToast(errorMsg, 'error');
        console.error('Reject error:', err);
      }
    },
    [pushToast]
  );

  /**
   * BE-76: người tạo hủy đơn của mình khi chưa ai duyệt.
   *
   * Trả về true/false để nơi gọi biết có nên đóng hộp thoại hay không. Nếu hai người cùng
   * thao tác, máy chủ trả 409 kèm lý do cụ thể (đơn đã bị duyệt / đã bị hủy...) — ta hiển thị
   * nguyên văn câu đó và tải lại danh sách để giao diện khớp trạng thái thật.
   */
  const cancelRequest = useCallback(
    async (reqId, reason) => {
      try {
        const updated = await applicationService.cancel(reqId, reason);
        setRequests((list) => list.map((r) => (r.id === reqId ? { ...updated, _isPendingReq: false } : r)));
        pushToast(t('Đã hủy đơn'), 'success');
        loadRequests();
        return true;
      } catch (err) {
        const errorMsg = err.response?.data?.error || err.response?.data?.message || t('Lỗi khi hủy đơn');
        pushToast(errorMsg, 'error');
        console.error('Cancel error:', err);
        // Trạng thái trên máy chủ đã đổi -> đồng bộ lại để nút Hủy biến mất.
        loadRequests();
        return false;
      }
    },
    [pushToast, t, loadRequests]
  );

  /**
   * BE-94: người duyệt yêu cầu bổ sung. Trả về { ok, error } để hộp thoại biết có nên đóng hay
   * không và hiển thị đúng câu lỗi của máy chủ (trước đây hộp thoại đóng ngay, gửi lỗi là mất
   * sạch nội dung vừa gõ).
   */
  const requestSupplement = useCallback(
    async (reqId, reason) => {
      try {
        const updated = await applicationService.supplement(reqId, reason);
        setRequests((list) => list.map((r) => (r.id === reqId ? { ...updated, _isPendingReq: r._isPendingReq } : r)));
        pushToast(t('Đã gửi yêu cầu bổ sung'), 'success');
        loadRequests();
        return { ok: true };
      } catch (err) {
        // Câu lỗi chi tiết của máy chủ nằm trong `errors` (FluentValidation), `message` chỉ là
        // "Dữ liệu không hợp lệ" nên phải đọc `errors` trước.
        const errors = err.response?.data?.errors;
        const errorMsg = (Array.isArray(errors) && errors[0])
          || err.response?.data?.error
          || err.response?.data?.message
          || t('Lỗi khi yêu cầu bổ sung');
        pushToast(errorMsg, 'error');
        console.error('Supplement error:', err);
        loadRequests();
        return { ok: false, error: errorMsg };
      }
    },
    [pushToast, t, loadRequests]
  );

  const addComment = useCallback(
    async (reqId, text) => {
      if (!text.trim()) return;
      try {
        await applicationService.addComment(reqId, text);
        // Refresh request to get the comment
        const updated = await applicationService.getById(reqId);
        setRequests((list) => list.map((r) => (r.id === reqId ? { ...updated, _isPendingReq: r._isPendingReq } : r)));
      } catch (err) {
        const errorMsg = err.response?.data?.error || err.response?.data?.message || t('Lỗi khi thêm bình luận');
        pushToast(errorMsg, 'error');
        console.error('Add comment error:', err);
      }
    },
    [pushToast]
  );

  /**
   * BE-67: giả lập quá hạn — gọi API thật để chạy đúng luồng xử lý quá hạn của máy chủ,
   * sau đó nạp lại đơn để thấy trạng thái/nhật ký mới (trước đây chỉ sửa state ở client nên
   * không phản ánh gì thật và mất ngay khi tải lại trang).
   */
  const simulateTimeout = useCallback(
    async (reqId) => {
      try {
        const result = await applicationService.simulateTimeout(reqId);
        const updated = await applicationService.getById(reqId);
        setRequests((list) =>
          list.map((r) => (r.id === reqId ? { ...updated, _isPendingReq: r._isPendingReq } : r))
        );
        pushToast(result?.message || t('Đã xử lý quá hạn cho đơn này'), 'warning');
      } catch (err) {
        const errorMsg = err.response?.data?.error || err.response?.data?.message || t('Không giả lập được quá hạn');
        pushToast(errorMsg, 'error');
        console.error('Simulate timeout error:', err);
      }
    },
    [pushToast]
  );

  // Create a new department + assign personnel. Updates both the departments
  // array (card renders on the grid) and the employees' department assignment.
  const addDepartment = useCallback(
    async (data) => {
      try {
        const newDept = await departmentService.create(data);
        setDepartments((d) => [...d, newDept]);
        // BE-95: báo cho module Nhân sự nạp lại danh sách (phòng ban mới phải xuất hiện trong
        // bộ lọc/chức danh của nhân sự ngay, không cần tải lại cả trang).
        notifyHrDataChanged();
        // BE-71: nói rõ trạng thái vừa tạo — phòng ban "Ngừng hoạt động" không hiện trong
        // bộ lọc mặc định nên người dùng dễ tưởng tạo nhầm thành "Đang hoạt động".
        if (newDept?.status === 'Inactive') {
          pushToast(
            t('Đã tạo phòng ban "{v0}" ở trạng thái Ngừng hoạt động. Chọn bộ lọc "Ngừng hoạt động" để xem.',
              { v0: newDept.name }),
            'success'
          );
        } else {
          pushToast(t('Thêm mới phòng ban thành công!'), 'success');
        }
        return newDept.id;
      } catch (err) {
        console.error(err);
        // BE-70: hiện câu giải thích chi tiết ("Tên phòng ban tối thiểu 2 ký tự"...) thay vì
        // "Validation failed" chung chung khiến người dùng đoán sai nguyên nhân.
        pushToast(describeApiError(err, t, 'Lỗi khi thêm phòng ban'), 'error', { resolved: true });
      }
    },
    [pushToast, t]
  );

  const updateDepartment = useCallback(
    async (id, updates) => {
      try {
        const updated = await departmentService.update(id, updates);
        setDepartments((list) => list.map((d) => (d.id === id ? updated : d)));
        notifyHrDataChanged();
        pushToast(t('Cập nhật phòng ban thành công!'), 'success');
        // BE-70: trả về id để form chỉ đóng khi máy chủ đã lưu xong.
        return updated?.id || id;
      } catch (err) {
        console.error(err);
        pushToast(describeApiError(err, t, 'Lỗi cập nhật phòng ban'), 'error', { resolved: true });
      }
    },
    [pushToast, t]
  );

  const deleteDepartment = useCallback(
    async (id) => {
      try {
        await departmentService.delete(id);
        setDepartments((list) => list.filter((d) => d.id !== id));
        // BE-95: nhân sự từng thuộc phòng ban này phải được nạp lại, nếu không cột
        // "Phòng ban & Chức vụ" vẫn hiển thị phòng ban vừa xoá.
        notifyHrDataChanged();
        pushToast(t('Đã xóa phòng ban'), 'success');
      } catch (err) {
        console.error(err);
        pushToast(describeApiError(err, t, 'Lỗi xóa phòng ban'), 'error', { resolved: true });
      }
    },
    [pushToast]
  );

  const toggleDepartmentStatus = useCallback(
    async (id) => {
      try {
        const res = await departmentService.toggleStatus(id);
        setDepartments((list) => list.map((d) => (d.id === id ? { ...d, status: res.department?.isActive ? 'Active' : 'Inactive' } : d)));
        pushToast(res.message || t('Thay đổi trạng thái thành công'), 'success');
      } catch (err) {
        pushToast(t('Lỗi khi đổi trạng thái'), 'error');
      }
    },
    [departments, pushToast]
  );

  // Does the current user hold the pending step for this request?
  // BE-75: dùng chung một hàm với danh sách/nút bấm để không lệch kết quả.
  const canApprove = useCallback(
    (r) => canUserApprove(r, currentUserId),
    [currentUserId]
  );

  // Kiểm tra user có quyền cụ thể hay không. Wildcard "*" = có mọi quyền.
  const hasPermission = useCallback(
    (required) => {
      const perms = currentUser?.permissions || [];
      if (!perms || perms.length === 0) return false;
      if (perms.includes(PERMISSIONS.WILDCARD)) return true;
      return perms.includes(required);
    },
    [currentUser?.permissions]
  );

  const value = useMemo(
    () => ({

      currentUser,
      currentUserId,

      requests,
      createRequest,
      updateRequest,
      approveRequest,
      rejectRequest,
      cancelRequest,
      requestSupplement,
      addComment,
      simulateTimeout,
      canApprove,
      hasPermission,
      departments,
      employees,
      addDepartment,
      updateDepartment,
      deleteDepartment,
      toggleDepartmentStatus,
      formFields,
      setFormFields,
      toasts,
      pushToast,
      dismissToast,
    }),
    [currentUser, currentUserId, requests, createRequest, updateRequest, approveRequest, rejectRequest, cancelRequest, requestSupplement, addComment, simulateTimeout, canApprove, hasPermission, departments, employees, addDepartment, updateDepartment, deleteDepartment, toggleDepartmentStatus, formFields, setFormFields, toasts, pushToast, dismissToast]
  );

  return <ApprovalSystemContext.Provider value={value}>{children}</ApprovalSystemContext.Provider>;
}
