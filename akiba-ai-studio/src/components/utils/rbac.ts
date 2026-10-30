import type { AuthenticatedUser } from '../AccountAccessPage';

export type ChamaRole = AuthenticatedUser['role'];
export type ChamaPermission =
  | 'profile:read:own'
  | 'contributions:read:own'
  | 'loans:read:own'
  | 'announcements:read'
  | 'meetings:read'
  | 'contributions:create'
  | 'loans:create'
  | 'chama:admin';

const memberPermissions: readonly ChamaPermission[] = [
  'profile:read:own',
  'contributions:read:own',
  'loans:read:own',
  'announcements:read',
  'meetings:read',
  'contributions:create',
  'loans:create',
];

export const rolePermissions: Readonly<Record<ChamaRole, readonly ChamaPermission[]>> = {
  member: memberPermissions,
  treasurer: memberPermissions,
  secretary: memberPermissions,
  chairperson: memberPermissions,
  admin: [...memberPermissions, 'chama:admin'],
};

export function hasPermission(role: ChamaRole, permission: ChamaPermission): boolean {
  return rolePermissions[role].includes(permission);
}

export function canAccessRole(role: ChamaRole, allowedRoles: readonly ChamaRole[]): boolean {
  return allowedRoles.includes(role);
}
