// Full role hierarchy for the ERP. Existing DB rows use a subset
// ('admin' | 'senior_manager' | 'manager'); new roles are additive.
export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'senior_manager'
  | 'manager'
  | 'staff';

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  senior_manager: 'Senior Manager',
  manager: 'Manager',
  staff: 'Staff',
};

/** Roles with elevated, org-wide privileges. */
export const ADMIN_ROLES: UserRole[] = ['super_admin', 'admin'];

export function isAdminRole(role: UserRole | null | undefined): boolean {
  return !!role && ADMIN_ROLES.includes(role);
}
