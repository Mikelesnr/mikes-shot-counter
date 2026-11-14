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