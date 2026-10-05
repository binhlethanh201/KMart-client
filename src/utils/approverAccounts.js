import { PERMISSIONS } from '../constants/permissions';

/**
 * BE-148: ai được coi là "cấp duyệt đơn" — tức là người có thể nhận/ủy quyền duyệt đơn.
 *
 * Vì sao cần danh sách vai trò bên cạnh quyền APPLICATION_APPROVE: trong dữ liệu thật có những
 * vai trò cấp cao KHÔNG được gán quyền APPLICATION_APPROVE (ví dụ BOARD — Ban giám đốc/Hội đồng,
 * SUPERVISOR — Ban giám sát) nhưng vẫn là cấp duyệt. Nếu chỉ kiểm tra mỗi quyền thì các tài khoản
 * này không thấy thẻ "Ủy quyền tạm thời" trên sidebar.
 */
export const APPROVER_ROLES = [
  'ADMIN',
  'ADMINISTRATOR',
  'HR',
  'MANAGER',
  'DIRECTOR',
  'BOARD',
  'TEAM_LEADER',
  'SUPERVISOR',
  'STORE_MANAGER',
  'STORE_LEADER',
];

const APPROVER_ROLE_SET = new Set(APPROVER_ROLES);

/**
 * Tài khoản này có phải cấp duyệt đơn không?
 * Đúng khi: giữ quyền APPLICATION_APPROVE, hoặc thuộc một vai trò cấp duyệt ở trên.
 */
export function isApproverAccount(currentUser, hasPermission) {
  const roles = (currentUser?.roles?.length ? currentUser.roles : [currentUser?.role])
    .filter(Boolean)
    .map((r) => String(r).toUpperCase());
  if (roles.some((r) => APPROVER_ROLE_SET.has(r))) return true;

  const perms = (currentUser?.permissions || []).map((p) => String(p).toUpperCase());
  if (perms.includes(PERMISSIONS.WILDCARD) || perms.includes(PERMISSIONS.APPLICATION_APPROVE)) return true;

  return typeof hasPermission === 'function' ? Boolean(hasPermission(PERMISSIONS.APPLICATION_APPROVE)) : false;
}
