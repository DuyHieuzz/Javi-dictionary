import type { IUserResponse } from "@/types/backend";

/**
 * Kiểm tra user có permission cụ thể không (qua role).
 */
export function hasPermission(
  user: IUserResponse | null | undefined,
  permissionName: string
): boolean {
  if (!user?.role?.permissions) return false;
  return user.role.permissions.some((perm) => perm.name === permissionName);
}
