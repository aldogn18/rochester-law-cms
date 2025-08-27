import { UserRole } from '@prisma/client'
import { Session } from 'next-auth'

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  ADMIN: 5,
  ATTORNEY: 4,
  PARALEGAL: 3,
  CLIENT_DEPT: 2,
  USER: 1
}

export const PERMISSIONS = {
  // Case permissions
  CASE_CREATE: [UserRole.ADMIN, UserRole.ATTORNEY, UserRole.PARALEGAL],
  CASE_READ: [UserRole.ADMIN, UserRole.ATTORNEY, UserRole.PARALEGAL, UserRole.CLIENT_DEPT],
  CASE_UPDATE: [UserRole.ADMIN, UserRole.ATTORNEY, UserRole.PARALEGAL],
  CASE_DELETE: [UserRole.ADMIN, UserRole.ATTORNEY],
  
  // Document permissions
  DOCUMENT_CREATE: [UserRole.ADMIN, UserRole.ATTORNEY, UserRole.PARALEGAL],
  DOCUMENT_READ: [UserRole.ADMIN, UserRole.ATTORNEY, UserRole.PARALEGAL, UserRole.CLIENT_DEPT],
  DOCUMENT_UPDATE: [UserRole.ADMIN, UserRole.ATTORNEY, UserRole.PARALEGAL],
  DOCUMENT_DELETE: [UserRole.ADMIN, UserRole.ATTORNEY],
  DOCUMENT_UPLOAD: [UserRole.ADMIN, UserRole.ATTORNEY, UserRole.PARALEGAL],
  
  // User management
  USER_MANAGE: [UserRole.ADMIN],
  USER_VIEW: [UserRole.ADMIN, UserRole.ATTORNEY],
  
  // Department management
  DEPARTMENT_MANAGE: [UserRole.ADMIN],
  
  // System administration
  SYSTEM_ADMIN: [UserRole.ADMIN],
  
  // Reporting
  REPORTS_VIEW: [UserRole.ADMIN, UserRole.ATTORNEY],
  REPORTS_EXPORT: [UserRole.ADMIN, UserRole.ATTORNEY]
} as const

export type Permission = keyof typeof PERMISSIONS

export function hasPermission(
  userRole: UserRole,
  permission: Permission
): boolean {
  return PERMISSIONS[permission].includes(userRole)
}

export function hasMinimumRole(
  userRole: UserRole,
  minimumRole: UserRole
): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minimumRole]
}

export function canAccessCase(
  session: Session | null,
  caseOwnerId?: string,
  caseDepartmentId?: string
): boolean {
  if (!session) return false
  
  const { role, departmentId } = session.user
  
  // Admins can access all cases
  if (role === UserRole.ADMIN) return true
  
  // Users can only access cases from their department
  if (departmentId && caseDepartmentId && departmentId !== caseDepartmentId) {
    return false
  }
  
  // Check basic case read permission
  return hasPermission(role, 'CASE_READ')
}

export function canEditCase(
  session: Session | null,
  caseOwnerId?: string,
  caseDepartmentId?: string
): boolean {
  if (!session) return false
  
  const { role, id: userId, departmentId } = session.user
  
  // Admins can edit all cases
  if (role === UserRole.ADMIN) return true
  
  // Users can only edit cases from their department
  if (departmentId && caseDepartmentId && departmentId !== caseDepartmentId) {
    return false
  }
  
  // Attorneys can edit any case in their department
  if (role === UserRole.ATTORNEY && departmentId === caseDepartmentId) {
    return true
  }
  
  // Paralegals can only edit cases assigned to them or they created
  if (role === UserRole.PARALEGAL && (caseOwnerId === userId)) {
    return true
  }
  
  return false
}

export function canDeleteCase(
  session: Session | null,
  caseOwnerId?: string,
  caseDepartmentId?: string
): boolean {
  if (!session) return false
  
  const { role, departmentId } = session.user
  
  // Only admins and attorneys can delete cases
  if (!hasPermission(role, 'CASE_DELETE')) return false
  
  // Must be in same department (unless admin)
  if (role !== UserRole.ADMIN) {
    if (departmentId && caseDepartmentId && departmentId !== caseDepartmentId) {
      return false
    }
  }
  
  return true
}