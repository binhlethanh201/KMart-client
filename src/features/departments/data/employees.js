// Unified employee roster for the approval-system global state.
// Reuses the HR mock employees but adds a numeric `departmentId` so the
// Add Department modal can assign staff to a department by id.

import { EMPLOYEES as HR_EMPLOYEES } from '../../hr/data/mockData';

// Map HR department name strings -> department id (see departments.js).
const DEPT_NAME_TO_ID = {
  'Phòng Marketing': 1,
  'Khối Công Nghệ': 2,
  'Khối Công nghệ': 2,
  'Phòng CSKH': 3,
  'Kmart Siêu thị Trung tâm': 4,
  'Kmart Siêu thị trung tâm': 4,
};

export const EMPLOYEES = HR_EMPLOYEES.map((e) => ({
  ...e,
  departmentId: DEPT_NAME_TO_ID[e.department] ?? null,
}));
