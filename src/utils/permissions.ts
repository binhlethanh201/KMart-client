/** Kiểm tra user có quyền cụ thể hay không. Wildcard "*" = có mọi quyền. */
export function hasPermission(
  userPermissions: string[] | undefined | null,
  required: string
): boolean {
  if (!userPermissions || userPermissions.length === 0) return false;
  if (userPermissions.includes('*')) return true;
  return userPermissions.includes(required);
}

/** Kiểm tra user có ÍT NHẤT một trong các quyền được yêu cầu. */
export function hasAnyPermission(
  userPermissions: string[] | undefined | null,
  required: string[]
): boolean {
  if (!userPermissions || !required.length) return false;
  if (userPermissions.includes('*')) return true;
  return required.some((p) => userPermissions.includes(p));
}
