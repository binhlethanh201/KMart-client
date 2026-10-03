import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { userService } from '../services/userService';
import { departmentService } from '../../departments/services/departmentService';
import { positionService } from '../services/positionService';
import { roleService } from '../services/roleService';
import { useI18n } from '../../../i18n/I18nProvider';

const HrContext = createContext(null);

export const useHr = () => useContext(HrContext);

// Shared HR state so the list page and the detail page stay in sync:
// edit / lock / reset performed from either page reflects on the other.
export function HrProvider({ children }) {
  const { t } = useI18n();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      userService.getAll(),
      departmentService.getAll(),
      positionService.getAll(),
      roleService.getAll()
    ]).then(([empData, deptData, posData, roleData]) => {
      setEmployees(empData);
      setDepartments(deptData);
      setPositions(posData);
      setRoles(roleData);
      setError(null);
    }).catch((err) => {
      console.error('Failed to load HR data', err);
      setError(err?.response?.data?.message || err?.message || t('Không thể tải dữ liệu nhân sự.'));
    }).finally(() => setLoading(false));
  }, []);

  const getEmployee = useCallback((id) => employees.find((e) => e.id === id) || null, [employees]);

  const saveEmployee = useCallback(async (form) => {
    try {
      if (form.id) {
        const updated = await userService.update(form.id, form);
        setEmployees(list => list.map(e => e.id === form.id ? { ...e, ...updated } : e));
      } else {
        const created = await userService.create(form);
        setEmployees(list => [created, ...list]);
      }
      return { ok: true };
    } catch (err) {
      console.error('Failed to save employee', err);
      const status = err.response?.status;
      const body = err.response?.data;
      // BE-68: trả lỗi về cho FORM hiển thị (dịch được theo ngôn ngữ), không dùng alert()
      // vì alert chặn giao diện và không đổi được ngôn ngữ.
      const detail =
        body?.error ||
        body?.message ||
        (Array.isArray(body?.errors) ? body.errors.join('; ') : '') ||
        err.message ||
        t('Không lưu được nhân sự');
      return { ok: false, message: detail, status };
    }
  }, []);

  const toggleLock = useCallback(async (id) => {
    try {
      const emp = employees.find(e => e.id === id);
      if (emp) {
        await userService.toggleLock(id, emp.status);
        setEmployees((list) =>
          list.map((e) => (e.id === id ? { ...e, status: e.status === 'active' ? 'inactive' : 'active' } : e))
        );
      }
    } catch (err) {
      console.error('Failed to toggle lock', err);
    }
  }, [employees]);

  const resetPassword = useCallback(async (id) => {
    try {
      return await userService.resetPassword(id);
    } catch (err) {
      console.error('Failed to reset password', err);
      return null;
    }
  }, []);

  return (
    <HrContext.Provider value={{ employees, departments, positions, roles, loading, error, getEmployee, saveEmployee, toggleLock, resetPassword }}>
      {children}
    </HrContext.Provider>
  );
}
