import type { IUserResponse, IRole, IPermission } from "@/types/backend";

/** Lấy danh sách tên permission từ user */
export function getPermissionNames(user?: IUserResponse | null): string[] {
  if (!user) return [];
  const role = (user as any).role as IRole | undefined | null;
  if (!role || !role.permissions) return [];
  return role.permissions.map((p: IPermission) => String(p.name));
}

/** Check 1 permission */
export function hasPermission(
  user: IUserResponse | null | undefined,
  permissionName: string
): boolean {
  const names = getPermissionNames(user);
  return names.includes(permissionName);
}

/** Check user có ít nhất 1 trong các permission */
export function hasAnyPermission(
  user: IUserResponse | null | undefined,
  perms: string[] | undefined | null
): boolean {
  if (!perms || perms.length === 0) return true;
  const names = getPermissionNames(user);
  return perms.some(p => names.includes(p));
}

/** Check user có tất cả permission */
export function hasAllPermissions(
  user: IUserResponse | null | undefined,
  perms: string[]
): boolean {
  if (!perms || perms.length === 0) return true;
  const names = getPermissionNames(user);
  return perms.every(p => names.includes(p));
}
