import { ROLE_STYLES } from '../features/hr/data/constants';
import { translate as t } from '../i18n/I18nProvider';

/**
 * Nhãn tiếng Việt cho vai trò hệ thống.
 * BE lưu role dạng mã (ADMIN, HR, MANAGER, TEAM_LEADER, STAFF) nên UI phải dịch lại,
 * tránh hiển thị mã tiếng Anh cho người dùng.
 */
export const ROLE_LABELS = {
  ADMIN: 'Quản trị viên',
  HR: 'Nhân sự',
  MANAGER: 'Quản lý',
  TEAM_LEADER: 'Trưởng nhóm',
  STAFF: 'Nhân viên',
};

/** Chuẩn hoá role về mã in hoa (nhận cả object { roleName }, chuỗi, hoặc rỗng). */
export function normalizeRole(role) {
  if (!role) return '';
  const raw = typeof role === 'string'
    ? role
    : role.roleName || role.name || role.code || role.role || '';
  return String(raw).trim().toUpperCase();
}

/** Dịch tên vai trò sang tiếng Việt; giữ nguyên nếu không phải vai trò hệ thống. */
export function roleLabel(role) {
  const code = normalizeRole(role);
  return t(ROLE_LABELS[code] || ROLE_STYLES[code]?.label || code || 'Nhân viên');
}

/** Lấy nhãn + màu hiển thị cho vai trò hệ thống (dùng cho badge). */
export function roleStyle(role) {
  const code = normalizeRole(role);
  return {
    label: t(ROLE_LABELS[code] || ROLE_STYLES[code]?.label || code || 'Nhân viên'),
    cls: ROLE_STYLES[code]?.cls || 'text-secondary',
    dot: ROLE_STYLES[code]?.dot || 'bg-outline',
  };
}