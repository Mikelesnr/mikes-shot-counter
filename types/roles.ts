export enum UserRole {
  ADMIN = 'ADMIN',
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  STAFF = 'STAFF',
}

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'System Admin',
  [UserRole.OWNER]: 'Shop Owner',
  [UserRole.MANAGER]: 'Shop Manager',
  [UserRole.STAFF]: 'Bar Staff',
};

/** Where each role lands after signing in, and where they get sent if they wander into the wrong area. */
export const ROLE_HOME: Record<UserRole, string> = {
  [UserRole.ADMIN]: '/admin',
  [UserRole.OWNER]: '/owner',
  [UserRole.MANAGER]: '/manager',
  [UserRole.STAFF]: '/counter',
};

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && (Object.values(UserRole) as string[]).includes(value);
}
