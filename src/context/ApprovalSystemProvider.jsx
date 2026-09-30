import { useState, useEffect, useCallback, useMemo } from 'react';
import { ApprovalSystemContext } from './approvalStore';
import { departmentService } from '../features/departments/services/departmentService';
import { applicationService } from '../features/requests/services/applicationService';
import { authService } from '../features/auth/services/authService';
import { userService, getFullAvatarUrl } from '../features/hr/services/userService';
import { PERMISSIONS } from '../constants/permissions';

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

function stamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ApprovalSystemProvider({ children }) {
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
        department: primaryPos?.departmentName || 'Chưa phân bổ',
        positionId: primaryPos?.positionId,
        position: primaryPos?.positionName || 'Nhân viên',
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

  const pushToast = useCallback((message, variant = 'info') => {
    const id = Date.now();
    setToasts((t) => [...t, { id, message, variant }]);
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
          const msg = err.response?.data?.error || `Không tải lên được "${file?.name || 'file'}"`;
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
        pushToast(`Đã tạo đề xuất ${submitted.id}`, 'success');
        return submitted.id;
      } catch (err) {
        let msg = 'Lỗi tạo đề xuất';
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
        setRequests((list) => list.map((r) => (r.id === reqId ? updated : r)));
        pushToast('Đã phê duyệt bước này', 'success');
      } catch (err) {
        const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Lỗi khi phê duyệt';
        pushToast(errorMsg, 'error');
        console.error('Approve error:', err);
      }
    },
    [pushToast]
  );

  // Bổ sung thông tin cho đơn bị trả về (NeedsSupplement) rồi gửi lại cho người duyệt
  const updateRequest = useCallback(
    async (reqId, data) => {
      try {
        await applicationService.update(reqId, data);
        // BE-09: bổ sung thêm file đính kèm (nếu có) trước khi gửi lại
        await uploadAttachments(reqId, data.attachments);
        const submitted = await applicationService.submit(reqId);
        setRequests((list) => list.map((r) => (r.id === reqId ? submitted : r)));
        pushToast('Đã bổ sung và gửi lại đơn', 'success');
        return submitted.id;
      } catch (err) {
        const msg = err.response?.data?.error || err.response?.data?.message || 'Lỗi khi cập nhật đơn';
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
        setRequests((list) => list.map((r) => (r.id === reqId ? updated : r)));
        pushToast('Đã từ chối yêu cầu', 'success');
      } catch (err) {
        const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Lỗi khi từ chối';
        pushToast(errorMsg, 'error');
        console.error('Reject error:', err);
      }
    },
    [pushToast]
  );

  const requestSupplement = useCallback(
    async (reqId, reason) => {
      try {
        const updated = await applicationService.supplement(reqId, reason);
        setRequests((list) => list.map((r) => (r.id === reqId ? updated : r)));
        pushToast('Đã gửi yêu cầu bổ sung', 'success');
      } catch (err) {
        const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Lỗi khi yêu cầu bổ sung';
        pushToast(errorMsg, 'error');
        console.error('Supplement error:', err);
      }
    },
    [pushToast]
  );

  const addComment = useCallback(
    async (reqId, text) => {
      if (!text.trim()) return;
      try {
        await applicationService.addComment(reqId, text);
        // Refresh request to get the comment
        const updated = await applicationService.getById(reqId);
        setRequests((list) => list.map((r) => (r.id === reqId ? updated : r)));
      } catch (err) {
        const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Lỗi khi thêm bình luận';
        pushToast(errorMsg, 'error');
        console.error('Add comment error:', err);
      }
    },
    [pushToast]
  );

  const simulateTimeout = useCallback(
    (reqId) => {
      setRequests((list) =>
        list.map((r) => {
          if (r.id !== reqId) return r;
          const entry = {
            at: stamp(),
            text: 'Hệ thống tự động trả đơn về nơi khởi tạo do quá hạn 12h không xử lý',
            type: 'timeout',
          };
          return { ...r, status: 'returned_timeout', history: [entry, ...r.history] };
        })
      );
      pushToast('Đã giả lập quá hạn 12h - đơn trả về nơi khởi tạo', 'warning');
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
        pushToast('Thêm mới phòng ban thành công!', 'success');
        return newDept.id;
      } catch (err) {
        const backendMessage = err.response?.data?.message || 'Lỗi khi thêm phòng ban';
        pushToast(backendMessage, 'error');
        console.error(err);
      }
    },
    [pushToast]
  );

  const updateDepartment = useCallback(
    async (id, updates) => {
      try {
        const updated = await departmentService.update(id, updates);
        setDepartments((list) => list.map((d) => (d.id === id ? updated : d)));
        pushToast('Cập nhật phòng ban thành công!', 'success');
      } catch (err) {
        const backendMessage = err.response?.data?.message || 'Lỗi cập nhật phòng ban';
        pushToast(backendMessage, 'error');
        console.error(err);
      }
    },
    [pushToast]
  );

  const deleteDepartment = useCallback(
    async (id) => {
      try {
        await departmentService.delete(id);
        setDepartments((list) => list.filter((d) => d.id !== id));
        pushToast('Đã xóa phòng ban', 'success');
      } catch (err) {
        pushToast('Lỗi xóa phòng ban', 'error');
      }
    },
    [pushToast]
  );

  const toggleDepartmentStatus = useCallback(
    async (id) => {
      try {
        const res = await departmentService.toggleStatus(id);
        setDepartments((list) => list.map((d) => (d.id === id ? { ...d, status: res.department?.isActive ? 'Active' : 'Inactive' } : d)));
        pushToast(res.message || 'Thay đổi trạng thái thành công', 'success');
      } catch (err) {
        pushToast('Lỗi khi đổi trạng thái', 'error');
      }
    },
    [departments, pushToast]
  );

  // Does the current user hold the pending step for this request?
  const canApprove = useCallback(
    (r) => {
      if (!r || !['pending', 'submitted', 'pendingapproval'].includes(r.status)) return false;
      // BE-08: don cua chinh minh thi khong bao gio "can ban duyet",
      // ke ca khi BE tra ve trong danh sach pending.
      if (currentUserId && r.creatorId === currentUserId) return false;
      if (r._isPendingReq !== true) return false;

      // BE-18: danh sách /pending của backend trả CẢ những đơn người này đã đi qua
      // (để hiện trong "Đã phê duyệt"/"Từ chối"), không chỉ đơn đang tới lượt.
      // Vì vậy phải kiểm tra đúng người này có thuộc BƯỚC ĐANG CHỜ hiện tại hay không,
      // nếu không người đã duyệt xong bước trước vẫn thấy nút Duyệt và bị 403.
      const steps = r.steps || [];
      const currentOrder = Number(r.currentStep) || 0;
      if (steps.length > 0 && currentOrder > 0) {
        const currentStep = steps.find((s) => Number(s.stepOrder) === currentOrder);
        if (!currentStep) return false;
        const ids = currentStep.approverIds?.length
          ? currentStep.approverIds
          : (currentStep.approverId ? [currentStep.approverId] : []);
        if (ids.length > 0 && !ids.includes(currentUserId)) return false;
      }

      return true;
    },
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
    [currentUser, currentUserId, requests, createRequest, updateRequest, approveRequest, rejectRequest, requestSupplement, addComment, simulateTimeout, canApprove, hasPermission, departments, employees, addDepartment, updateDepartment, deleteDepartment, toggleDepartmentStatus, formFields, setFormFields, toasts, pushToast, dismissToast]
  );

  return <ApprovalSystemContext.Provider value={value}>{children}</ApprovalSystemContext.Provider>;
}
