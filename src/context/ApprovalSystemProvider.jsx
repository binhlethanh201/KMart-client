import { useState, useEffect, useCallback, useMemo } from 'react';
import { ApprovalSystemContext } from './approvalStore';
import { USERS, SEED_REQUESTS, WORKFLOW_BY_TYPE, STEP_ROLE } from '../features/requests/data/seed';
import { DEPARTMENTS } from '../features/departments/data/departments';
import { EMPLOYEES } from '../features/departments/data/employees';
import { FORM_FIELDS } from '../features/system-config/data/mockData';

const STORAGE_KEY = 'kmart.approval.v3';

const userName = (id) => USERS.find((u) => u.id === id)?.name ?? 'Hệ thống';
const userById = (id) => USERS.find((u) => u.id === id);

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (p && Array.isArray(p.requests)) {
        return {
          currentUserId: p.currentUserId ?? USERS[0].id,
          requests: p.requests,
          departments: Array.isArray(p.departments) ? p.departments : DEPARTMENTS,
          employees: Array.isArray(p.employees) ? p.employees : EMPLOYEES,
          formFields: p.formFields || FORM_FIELDS,
        };
      }
    }
  } catch {
    /* ignore corrupted storage */
  }
  return { currentUserId: USERS[0].id, requests: SEED_REQUESTS, departments: DEPARTMENTS, employees: EMPLOYEES, formFields: FORM_FIELDS };
}

function stamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ApprovalSystemProvider({ children }) {
  const init = load();
  const [currentUserId, setCurrentUserId] = useState(init.currentUserId);
  const [requests, setRequests] = useState(init.requests);
  const [departments, setDepartments] = useState(init.departments);
  const [employees, setEmployees] = useState(init.employees);
  const [formFields, setFormFields] = useState(init.formFields);
  const [toasts, setToasts] = useState([]);

  // Persist to localStorage on any change.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ currentUserId, requests, departments, employees, formFields }));
    } catch {
      /* quota / private mode - ignore */
    }
  }, [currentUserId, requests, departments, employees, formFields]);

  const currentUser = useMemo(() => userById(currentUserId), [currentUserId]);

  const pushToast = useCallback((message, variant = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, variant }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  const dismissToast = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  // Build a fresh request from modal form data.
  const createRequest = useCallback(
    (data) => {
      const id = `REQ-${Math.floor(1000 + Math.random() * 8999)}`;
      const chain = WORKFLOW_BY_TYPE[data.type] || ['u_tvql', 'u_lhtl'];
      const steps = chain.map((uid) => ({ approverId: uid, status: 'pending', actedAt: null }));
      const req = {
        id,
        title: data.title || data.type,
        type: data.type,
        creatorId: currentUserId,
        departmentId: userById(currentUserId)?.departmentId ?? 4,
        createdAt: stamp(),
        status: 'pending',
        currentStep: 0,
        fields: {
          startTime: data.startTime || '',
          endTime: data.endTime || '',
          reason: data.reason || '',
          impact: data.impact || 'Không ảnh hưởng',
          attachment: data.attachment || null,
          ...data // Capture dynamic fields from Form Builder
        },
        steps,
        comments: [],
        history: [{ at: stamp(), text: `${userName(currentUserId)} đã tạo yêu cầu ${id}.`, type: 'create' }],
      };
      setRequests((r) => [req, ...r]);
      pushToast(`Đã tạo đề xuất ${id}`, 'success');
      return id;
    },
    [currentUserId, pushToast]
  );

  const approveRequest = useCallback(
    (reqId) => {
      setRequests((list) =>
        list.map((r) => {
          if (r.id !== reqId) return r;
          const steps = r.steps.map((s, i) => (i === r.currentStep ? { ...s, status: 'approved', actedAt: stamp() } : s));
          const isLast = r.currentStep >= r.steps.length - 1;
          const next = isLast ? r.currentStep : r.currentStep + 1;
          const status = isLast ? 'approved' : 'pending';
          const actor = r.steps[r.currentStep].approverId;
          const entry = {
            at: stamp(),
            text: `${userName(actor)} đã thay đổi trạng thái thành Đã duyệt (${STEP_ROLE[actor] || 'Cấp ' + (r.currentStep + 1)}).`,
            type: 'approve',
          };
          return { ...r, steps, currentStep: next, status, history: [entry, ...r.history] };
        })
      );
      pushToast('Đã phê duyệt bước này', 'success');
    },
    [pushToast]
  );

  const rejectRequest = useCallback(
    (reqId, reason) => {
      setRequests((list) =>
        list.map((r) => {
          if (r.id !== reqId) return r;
          const steps = r.steps.map((s, i) => (i === r.currentStep ? { ...s, status: 'rejected', actedAt: stamp() } : s));
          const actor = r.steps[r.currentStep]?.approverId ?? currentUserId;
          const entry = {
            at: stamp(),
            text: `${userName(actor)} đã từ chối. Lý do: ${reason}`,
            type: 'reject',
          };
          return { ...r, steps, status: 'rejected', rejectReason: reason, history: [entry, ...r.history] };
        })
      );
      pushToast('Đã từ chối yêu cầu', 'error');
    },
    [currentUserId, pushToast]
  );

  const addComment = useCallback(
    (reqId, text) => {
      if (!text.trim()) return;
      const at = stamp();
      setRequests((list) =>
        list.map((r) => {
          if (r.id !== reqId) return r;
          const comment = { userId: currentUserId, text: text.trim(), at };
          const entry = { at, text: `${userName(currentUserId)} đã thêm bình luận.`, type: 'comment' };
          return { ...r, comments: [...(r.comments || []), comment], history: [entry, ...r.history] };
        })
      );
    },
    [currentUserId]
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
    (data) => {
      const newId = (departments.reduce((m, d) => Math.max(m, Number(d.id) || 0), 0) || 0) + 1;
      const head = data.head || null; // employee object
      const deputy = data.deputy || null; // employee object
      const addedMembers = data.members || []; // [{ employee, assignment: 'primary' | 'secondary' }]
      const headTitle = data.type === 'Siêu thị / Chi nhánh' ? 'Cửa hàng trưởng' : 'Trưởng phòng';

      const leaders = [];
      if (head) leaders.push({ title: headTitle, name: head.name });
      if (deputy) leaders.push({ title: 'Phó phòng', name: deputy.name });

      const allMembers = [
        ...(head ? [head] : []),
        ...(deputy ? [deputy] : []),
        ...addedMembers.map((m) => m.employee),
      ];
      const total = allMembers.length;
      const dept = {
        id: newId,
        icon: data.icon,
        status: data.status === 'inactive' ? 'Inactive' : 'Active',
        name: data.name,
        code: data.code,
        type: data.type,
        leaders,
        members: allMembers.map((m) => m.avatar).slice(0, 2),
        extraCount: Math.max(0, total - 2),
        memberCount: total,
        createdAt: stamp(),
        staff: allMembers.map((m, i) => ({
          id: m.id,
          name: m.name,
          role: i === 0 && head ? head.position || headTitle : i === 1 && deputy ? 'Phó phòng' : m.position || 'Nhân viên',
          avatar: m.avatar,
          email: m.email || '',
          status: m.status || 'active',
        })),
      };
      setDepartments((d) => [...d, dept]);

      // Update employee assignments: head/deputy + primary members -> departmentId;
      // secondary (kiêm nhiệm) members -> add to secondary list.
      const primaryIds = new Set([
        ...(head ? [head.id] : []),
        ...(deputy ? [deputy.id] : []),
        ...addedMembers.filter((m) => m.assignment === 'primary').map((m) => m.employee.id),
      ]);
      const secondaryIds = new Set(addedMembers.filter((m) => m.assignment === 'secondary').map((m) => m.employee.id));

      setEmployees((list) =>
        list.map((e) => {
          if (primaryIds.has(e.id)) {
            return { ...e, departmentId: newId, department: data.name };
          }
          if (secondaryIds.has(e.id)) {
            return {
              ...e,
              secondary: [...(e.secondary || []), { department: data.name, position: 'Kiêm nhiệm' }],
            };
          }
          return e;
        })
      );

      pushToast('Thêm mới phòng ban thành công!', 'success');
      return newId;
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
      users: USERS,
      currentUser,
      currentUserId,
      setCurrentUserId,
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
      formFields,
      setFormFields,
      toasts,
      pushToast,
      dismissToast,
    }),
    [currentUser, currentUserId, requests, createRequest, approveRequest, rejectRequest, addComment, simulateTimeout, canApprove, departments, employees, addDepartment, formFields, toasts, pushToast, dismissToast]
  );

  return <ApprovalSystemContext.Provider value={value}>{children}</ApprovalSystemContext.Provider>;
}
