import { useState, useEffect, useCallback, useMemo } from 'react';
import { ApprovalSystemContext } from './approvalStore';
import { departmentService } from '../features/departments/services/departmentService';
import { applicationService } from '../features/requests/services/applicationService';
import { authService } from '../features/auth/services/authService';
import { userService } from '../features/hr/services/userService';
import { FORM_FIELDS } from '../features/system-config/data/mockData';

const STORAGE_KEY = 'kmart.approval.v3';

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (p && Array.isArray(p.requests)) {
        return {
          formFields: p.formFields || FORM_FIELDS
        };
      }
    }
  } catch (e) { }
  return {
    formFields: FORM_FIELDS
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
      const [myReqs, pendingReqs] = await Promise.all([
        applicationService.getMyRequests(),
        applicationService.getPendingApprovals()
      ]);
      // Merge unique
      const all = [...myReqs, ...pendingReqs];
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
      const { getFullAvatarUrl } = await import('../features/hr/services/userService');
      const actualAvatar = getFullAvatarUrl(u.avatarUrl);
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
        profileData: u.profileData ? JSON.parse(u.profileData) : null,
        avatar: actualAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullName || 'User')}&background=random&color=fff&size=128`
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

  // Build a fresh request from modal form data.
  const createRequest = useCallback(
    async (data) => {
      try {
        // Create draft
        const req = await applicationService.create(data);
        // Automatically submit
        const submitted = await applicationService.submit(req.id);
        setRequests((r) => [submitted, ...r]);
        pushToast(`Đã tạo đề xuất ${submitted.id}`, 'success');
        return submitted.id;
      } catch (err) {
        pushToast('Lỗi tạo đề xuất', 'error');
        console.error(err);
      }
    },
    [pushToast]
  );

  const approveRequest = useCallback(
    async (reqId) => {
      try {
        const updated = await applicationService.approve(reqId);
        setRequests((list) => list.map((r) => (r.id === reqId ? updated : r)));
        pushToast('Đã phê duyệt bước này', 'success');
      } catch (err) {
        pushToast('Lỗi phê duyệt', 'error');
      }
    },
    [pushToast]
  );

  const rejectRequest = useCallback(
    async (reqId, reason) => {
      try {
        const updated = await applicationService.reject(reqId, reason);
        setRequests((list) => list.map((r) => (r.id === reqId ? updated : r)));
        pushToast('Đã từ chối yêu cầu', 'error');
      } catch (err) {
        pushToast('Lỗi từ chối', 'error');
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
        pushToast('Lỗi thêm bình luận', 'error');
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
      pushToast('Đã giả lập Timeout 12h - đơn trả về nơi khởi tạo', 'warning');
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
      if (!r || r.status !== 'pending') return false;
      const step = r.steps[r.currentStep];
      return step && step.approverId === currentUserId;
    },
    [currentUserId]
  );

  const value = useMemo(
    () => ({

      currentUser,
      currentUserId,

      requests,
      createRequest,
      approveRequest,
      rejectRequest,
      addComment,
      simulateTimeout,
      canApprove,
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
    [currentUser, currentUserId, requests, createRequest, approveRequest, rejectRequest, addComment, simulateTimeout, canApprove, departments, employees, addDepartment, updateDepartment, deleteDepartment, toggleDepartmentStatus, formFields, toasts, pushToast, dismissToast]
  );

  return <ApprovalSystemContext.Provider value={value}>{children}</ApprovalSystemContext.Provider>;
}
