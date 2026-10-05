import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { userService } from '../services/userService';
import { departmentService } from '../../departments/services/departmentService';
import { positionService } from '../services/positionService';
import { roleService } from '../services/roleService';
import { useI18n } from '../../../i18n/I18nProvider';
import { describeApiError } from '../../../utils/apiError';
import { HR_DATA_CHANGED } from '../../../utils/hrEvents';

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

  /**
   * BE-95: nạp lại toàn bộ dữ liệu nhân sự.
   *
   * Trước đây chỉ nạp MỘT LẦN khi app khởi động nên sau khi xoá/đổi tên phòng ban ở màn
   * "Phòng ban & Nhóm", danh sách nhân sự vẫn giữ tên phòng ban cũ -> tài khoản nhân sự trông
   * như vẫn còn thuộc phòng ban đã xoá cho tới khi tải lại cả trang.
   */
  const loadAll = useCallback(async () => {
    try {
      const [empData, deptData, posData, roleData] = await Promise.all([
        userService.getAll(),
        departmentService.getAll(),
        positionService.getAll(),
        roleService.getAll().catch(() => ({ data: [] }))
      ]);
      setEmployees(empData);
      setDepartments(deptData);
      setPositions(posData);
      setRoles(roleData);
      setError(null);
    } catch (err) {
      console.error('Failed to load HR data', err);
      setError(err?.response?.data?.message || err?.message || t('Không thể tải dữ liệu nhân sự.'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // BE-95/BE-99: phòng ban hoặc CHỨC VỤ bị tạo/sửa/xoá ở nơi khác -> nạp lại để cột
  // "Phòng ban & Chức vụ" của nhân sự và các dropdown không còn hiển thị dữ liệu cũ.
  useEffect(() => {
    const onChanged = () => { loadAll(); };
    window.addEventListener(HR_DATA_CHANGED, onChanged);
    // Tương thích sự kiện cũ (được phát trước khi hợp nhất thành HR_DATA_CHANGED).
    window.addEventListener('departments:changed', onChanged);
    return () => {
      window.removeEventListener(HR_DATA_CHANGED, onChanged);
      window.removeEventListener('departments:changed', onChanged);
    };
  }, [loadAll]);

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
      // BE-68: trả lỗi về cho FORM hiển thị (dịch được theo ngôn ngữ), không dùng alert()
      // vì alert chặn giao diện và không đổi được ngôn ngữ.
      // BE-70: lấy câu giải thích chi tiết; trước đây ưu tiên `message` nên lỗi kiểm tra dữ liệu
      // chỉ hiện đúng một chữ "Validation failed".
      return { ok: false, message: describeApiError(err, t, 'Không lưu được nhân sự'), status };
    }
  }, [t]);

  const toggleLock = useCallback(async (id) => {
    try {
      const emp = employees.find(e => e.id === id);
      if (emp) {
        // BE-119: dùng trạng thái THẬT trong CSDL (dbStatus) để đảo, không dùng `status` hiển thị
        // (đã bị đổi thành inactive khi tài khoản thiếu phòng ban chính) — nếu không sẽ gửi sai.
        await userService.toggleLock(id, emp.dbStatus || emp.status);
        setEmployees((list) =>
          list.map((e) => {
            if (e.id !== id) return e;
            const nextDb = (e.dbStatus || e.status) === 'active' ? 'inactive' : 'active';
            // Trạng thái hiển thị vẫn là "tắt" nếu tài khoản chưa có phòng ban công tác chính.
            return { ...e, dbStatus: nextDb, status: e.blockedByNoPrimary ? 'inactive' : nextDb };
          })
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

  /**
   * BE-87: xoá nhân sự. Trước đây API đã có sẵn nhưng giao diện không có chỗ nào gọi tới nên
   * không thể xoá nhân sự trong app.
   */
  const deleteEmployee = useCallback(async (id) => {
    try {
      await userService.delete(id);
      setEmployees(list => list.filter(e => e.id !== id));
      return { ok: true };
    } catch (err) {
      console.error('Failed to delete employee', err);
      return { ok: false, message: describeApiError(err, t, 'Không xóa được nhân sự') };
    }
  }, [t]);

  return (
    <HrContext.Provider value={{ employees, departments, positions, roles, loading, error, getEmployee, saveEmployee, toggleLock, resetPassword, deleteEmployee }}>
      {children}
    </HrContext.Provider>
  );
}
