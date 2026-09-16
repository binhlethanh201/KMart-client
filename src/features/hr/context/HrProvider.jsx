import { createContext, useContext, useState, useCallback } from 'react';
import { EMPLOYEES, EMPTY_EMPLOYEE } from '../data/mockData';

const HrContext = createContext(null);

export const useHr = () => useContext(HrContext);

// Shared HR state so the list page and the detail page stay in sync:
// edit / lock / reset performed from either page reflects on the other.
export function HrProvider({ children }) {
  const [employees, setEmployees] = useState(EMPLOYEES);

  const getEmployee = useCallback((id) => employees.find((e) => e.id === id) || null, [employees]);

  const saveEmployee = useCallback((form) => {
    setEmployees((list) => {
      if (list.some((e) => e.id === form.id)) {
        return list.map((e) => (e.id === form.id ? { ...e, ...form } : e));
      }
      return [{ ...EMPTY_EMPLOYEE, ...form, avatar: form.avatar || EMPLOYEES[0].avatar }, ...list];
    });
  }, []);

  const toggleLock = useCallback((id) => {
    setEmployees((list) =>
      list.map((e) => (e.id === id ? { ...e, status: e.status === 'active' ? 'inactive' : 'active' } : e))
    );
  }, []);

  // Mock reset: returns a temporary password string. No backend to persist it.
  const resetPassword = useCallback(() => {
    return 'km@' + Math.random().toString(36).slice(2, 8);
  }, []);

  return (
    <HrContext.Provider value={{ employees, getEmployee, saveEmployee, toggleLock, resetPassword }}>
      {children}
    </HrContext.Provider>
  );
}
