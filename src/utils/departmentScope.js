/**
 * BE-88: phạm vi phòng ban của người dùng hiện tại.
 *
 * Trước đây các ô lọc "Phòng ban" đổ ra TOÀN BỘ phòng ban trong hệ thống, kể cả với người chỉ thuộc
 * một phòng ban. Vừa rối vừa gợi ý rằng họ xem được dữ liệu của phòng khác; chọn phòng khác thì danh
 * sách trống nên càng khó hiểu.
 *
 * Nay: chỉ liệt kê những phòng ban người dùng thực sự thuộc về (theo mọi vị trí kiêm nhiệm).
 * Riêng ADMIN/HR vẫn thấy tất cả vì họ quản lý toàn tổ chức.
 */

/** Vai trò được xem toàn tổ chức. */
const ORG_WIDE_ROLES = new Set(['ADMIN', 'ADMINISTRATOR', 'HR']);

/** Mã quyền cho phép xem mọi phòng ban (khớp cách cấp quyền ở ApprovalSystemProvider). */
const ORG_WIDE_PERMISSIONS = new Set(['*', 'DEPARTMENT_VIEW_ALL', 'REPORT_VIEW']);

/** Id mọi phòng ban người dùng thuộc về (vị trí chính + vị trí kiêm nhiệm). */
export function getUserDepartmentIds(user) {
  const ids = new Set();
  (user?.allPositions || []).forEach((p) => {
    if (p?.departmentId) ids.add(p.departmentId);
  });
  if (user?.departmentId) ids.add(user.departmentId);
  return [...ids];
}

/** Người dùng có được xem toàn tổ chức không. */
export function hasOrgWideScope(user) {
  if (!user) return true;
  const roles = [user.role, ...(user.roles || [])]
    .filter(Boolean)
    .map((r) => String(r).toUpperCase());
  if (roles.some((r) => ORG_WIDE_ROLES.has(r))) return true;
  return (user.permissions || []).some((p) => ORG_WIDE_PERMISSIONS.has(String(p).toUpperCase()));
}

/**
 * Lọc danh sách phòng ban xuống phạm vi của người dùng.
 * Nếu không xác định được phòng ban nào thì trả về nguyên danh sách (thà rộng còn hơn chặn nhầm).
 */
export function scopeDepartmentsForUser(departments, user) {
  const list = departments || [];
  if (hasOrgWideScope(user)) return list;

  const ids = new Set(getUserDepartmentIds(user));
  if (ids.size === 0) return list;

  const scoped = list.filter((d) => ids.has(d.id));
  return scoped.length > 0 ? scoped : list;
}

export default scopeDepartmentsForUser;
