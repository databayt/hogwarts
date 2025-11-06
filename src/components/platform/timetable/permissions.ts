/**
 * Timetable Permission System - Server-Side Functions
 * Server-only permission guards and context functions
 */

import { auth } from '@/auth'
import { getTenantContext } from '@/lib/tenant-context'

// Re-export all client-safe utilities
export * from './permissions-config'

// Import what we need from config
import {
  type TimetableRole,
  type TimetableAction,
  PERMISSION_MATRIX,
  hasPermission,
  canModifyTimetable,
  canViewTimetable,
  canExportTimetable,
  canManageConflicts,
  canConfigureSettings,
  getAccessLevel,
} from './permissions-config'

// ============================================================================
// Server-Side Permission Guards
// ============================================================================

/**
 * Require a specific permission or throw an error
 * Use this in server actions
 */
export async function requirePermission(action: TimetableAction): Promise<void> {
  const session = await auth()
  const role = session?.user?.role as TimetableRole | undefined

  if (!hasPermission(role, action)) {
    throw new Error(`Permission denied: ${action} requires higher privileges`)
  }
}

/**
 * Require admin access or throw an error
 */
export async function requireAdminAccess(): Promise<void> {
  const session = await auth()
  const role = session?.user?.role as TimetableRole | undefined

  if (!canModifyTimetable(role)) {
    throw new Error('Permission denied: Admin access required')
  }
}

/**
 * Require at least read access or throw an error
 */
export async function requireReadAccess(): Promise<void> {
  const session = await auth()
  const role = session?.user?.role as TimetableRole | undefined

  if (!canViewTimetable(role)) {
    throw new Error('Permission denied: You do not have access to view timetable')
  }
}

/**
 * Get the current user's permissions context
 */
export async function getPermissionContext() {
  const session = await auth()
  const { schoolId } = await getTenantContext()

  const role = session?.user?.role as TimetableRole | undefined
  const userId = session?.user?.id
  const email = session?.user?.email

  return {
    userId,
    email,
    schoolId,
    role,
    accessLevel: getAccessLevel(role),
    permissions: role ? PERMISSION_MATRIX[role] : [],
    canView: canViewTimetable(role),
    canModify: canModifyTimetable(role),
    canExport: canExportTimetable(role),
    canManageConflicts: canManageConflicts(role),
    canConfigureSettings: canConfigureSettings(role),
  }
}

// ============================================================================
// Data Filtering Functions
// ============================================================================

/**
 * Filter timetable data based on user role
 * Used to restrict what data a user can see
 */
export async function filterTimetableByRole(
  timetableData: any,
  options?: {
    teacherId?: string
    studentId?: string
    classId?: string
    childIds?: string[]
  }
) {
  const { role, userId } = await getPermissionContext()

  switch (role) {
    case 'DEVELOPER':
    case 'ADMIN':
    case 'ACCOUNTANT':
    case 'STAFF':
      // Can see all timetable data
      return timetableData

    case 'TEACHER':
      // Can see all, but UI might highlight their own
      if (options?.teacherId) {
        // Filter to show only teacher's classes
        return timetableData.filter((item: any) =>
          item.teacherId === options.teacherId
        )
      }
      return timetableData

    case 'STUDENT':
      // Can only see their class timetable
      if (options?.classId) {
        return timetableData.filter((item: any) =>
          item.classId === options.classId
        )
      }
      return []

    case 'GUARDIAN':
      // Can only see their children's timetables
      if (options?.childIds && options.childIds.length > 0) {
        return timetableData.filter((item: any) =>
          options.childIds?.some(childId =>
            item.studentIds?.includes(childId) ||
            item.classId === childId // Assuming childId might be classId
          )
        )
      }
      return []

    default:
      // No access
      return []
  }
}

// ============================================================================
// Audit Logging
// ============================================================================

/**
 * Log timetable actions for audit trail
 */
export async function logTimetableAction(
  action: TimetableAction,
  details: {
    entityId?: string
    entityType?: 'slot' | 'config' | 'conflict' | 'bulk'
    changes?: Record<string, any>
    metadata?: Record<string, any>
  }
) {
  const { userId, email, schoolId, role } = await getPermissionContext()

  const auditLog = {
    timestamp: new Date().toISOString(),
    userId,
    email,
    schoolId,
    role,
    action,
    ...details,
  }

  // In production, this would write to an audit log table or service
  console.log('[TIMETABLE_AUDIT]', JSON.stringify(auditLog))

  // You could also send to monitoring service like Sentry
  // Sentry.captureMessage('Timetable Action', { extra: auditLog })

  return auditLog
}

// ============================================================================
// Middleware Functions
// ============================================================================

/**
 * Wrap server actions with permission checks
 * Example usage:
 * export const myAction = withPermission('edit', async (input) => { ... })
 */
export function withPermission<T extends (...args: any[]) => any>(
  requiredAction: TimetableAction,
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    await requirePermission(requiredAction)
    return handler(...args)
  }) as T
}

/**
 * Wrap server actions with admin checks
 */
export function withAdminAccess<T extends (...args: any[]) => any>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    await requireAdminAccess()
    return handler(...args)
  }) as T
}

/**
 * Wrap server actions with audit logging
 */
export function withAudit<T extends (...args: any[]) => any>(
  action: TimetableAction,
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    const result = await handler(...args)
    await logTimetableAction(action, {
      metadata: { args: args[0], result: result?.id || result },
    })
    return result
  }) as T
}