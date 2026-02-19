/**
 * Timetable Permission Configuration
 * Client-safe permission utilities and constants
 * Can be imported in both client and server components
 */

// ============================================================================
// Types
// ============================================================================

export type TimetableRole =
  | "DEVELOPER"
  | "ADMIN"
  | "TEACHER"
  | "STUDENT"
  | "GUARDIAN"
  | "ACCOUNTANT"
  | "STAFF"
  | "USER"

export type TimetableAction =
  // Permission actions
  | "view_all"
  | "view_own"
  | "view_class"
  | "view_child"
  | "edit"
  | "create"
  | "delete"
  | "bulk_edit"
  | "manage_conflicts"
  | "export"
  | "import"
  | "configure_settings"
  | "view_analytics"
  | "manage_substitutions"
  // Audit log actions
  | "generate_preview"
  | "apply_generated"
  | "bulk_import"
  | "create_period"
  | "update_period"
  | "delete_period"
  | "copy_periods"
  | "create_default_periods"
  | "update_term_dates"
  | "create_schedule_exception"
  | "update_schedule_exception"
  | "delete_schedule_exception"
  | "copy_schedule_settings"
  // Substitution audit log actions
  | "create_teacher_absence"
  | "update_teacher_absence"
  | "assign_substitute"
  | "respond_substitution"
  | "cancel_substitution"
  | "apply_structure"

export type AccessLevel = "none" | "read" | "write" | "admin"

// ============================================================================
// Permission Matrix
// ============================================================================

/**
 * Defines what actions each role can perform
 */
export const PERMISSION_MATRIX: Record<TimetableRole, TimetableAction[]> = {
  DEVELOPER: [
    "view_all",
    "edit",
    "create",
    "delete",
    "bulk_edit",
    "manage_conflicts",
    "export",
    "import",
    "configure_settings",
    "view_analytics",
    "manage_substitutions",
  ],
  ADMIN: [
    "view_all",
    "edit",
    "create",
    "delete",
    "bulk_edit",
    "manage_conflicts",
    "export",
    "import",
    "configure_settings",
    "view_analytics",
    "manage_substitutions",
  ],
  TEACHER: ["view_all", "view_own", "export", "view_analytics"],
  STUDENT: ["view_class", "export"],
  GUARDIAN: ["view_child", "export"],
  ACCOUNTANT: ["view_all", "export", "view_analytics"],
  STAFF: ["view_all", "export"],
  USER: [], // No timetable permissions by default
}

/**
 * Access level mapping for simplified checks
 */
export const ACCESS_LEVELS: Record<TimetableRole, AccessLevel> = {
  DEVELOPER: "admin",
  ADMIN: "admin",
  TEACHER: "read",
  STUDENT: "read",
  GUARDIAN: "read",
  ACCOUNTANT: "read",
  STAFF: "read",
  USER: "none",
}

// ============================================================================
// Permission Checking Functions (Client-Safe)
// ============================================================================

/**
 * Check if a role has permission for an action
 */
export function hasPermission(
  role: TimetableRole | null | undefined,
  action: TimetableAction
): boolean {
  if (!role) return false
  const permissions = PERMISSION_MATRIX[role]
  return permissions ? permissions.includes(action) : false
}

/**
 * Get the access level for a role
 */
export function getAccessLevel(
  role: TimetableRole | null | undefined
): AccessLevel {
  if (!role) return "none"
  return ACCESS_LEVELS[role] || "none"
}

/**
 * Check if a role can modify timetable
 */
export function canModifyTimetable(
  role: TimetableRole | null | undefined
): boolean {
  const accessLevel = getAccessLevel(role)
  return accessLevel === "admin" || accessLevel === "write"
}

/**
 * Check if a role can view timetable
 */
export function canViewTimetable(
  role: TimetableRole | null | undefined
): boolean {
  const accessLevel = getAccessLevel(role)
  return accessLevel !== "none"
}

/**
 * Check if a role can export timetable
 */
export function canExportTimetable(
  role: TimetableRole | null | undefined
): boolean {
  return hasPermission(role, "export")
}

/**
 * Check if a role can manage conflicts
 */
export function canManageConflicts(
  role: TimetableRole | null | undefined
): boolean {
  return hasPermission(role, "manage_conflicts")
}

/**
 * Check if a role can configure settings
 */
export function canConfigureSettings(
  role: TimetableRole | null | undefined
): boolean {
  return hasPermission(role, "configure_settings")
}

// ============================================================================
// UI Helper Functions
// ============================================================================

/**
 * Get UI configuration based on role
 * Use this to conditionally render UI elements
 */
export function getUIConfigForRole(role: TimetableRole | null | undefined) {
  const canModify = canModifyTimetable(role)
  const canExport = canExportTimetable(role)
  const hasConflictPermissions = canManageConflicts(role)
  const hasSettingsPermissions = canConfigureSettings(role)

  return {
    showEditButton: canModify,
    showAddButton: canModify,
    showDeleteButton: canModify,
    showBulkActions: canModify,
    showExportButton: canExport,
    showImportButton: canModify,
    showConfigButton: hasSettingsPermissions,
    showConflictIndicator: hasConflictPermissions,
    showAnalytics: hasPermission(role, "view_analytics"),
    enableDragDrop: canModify,
    enableSlotClick: canModify,
    readOnlyMode: !canModify,
  }
}

/**
 * Get the appropriate view type for a role
 */
export function getViewTypeForRole(
  role: TimetableRole | null | undefined,
  context?: {
    isTeacher?: boolean
    isStudent?: boolean
    isGuardian?: boolean
    teacherId?: string
    studentId?: string
    classId?: string
  }
): "admin" | "teacher" | "student" | "guardian" | "readonly" {
  if (!role) return "readonly"

  switch (role) {
    case "DEVELOPER":
    case "ADMIN":
      return "admin"

    case "TEACHER":
      return context?.isTeacher ? "teacher" : "readonly"

    case "STUDENT":
      return context?.isStudent ? "student" : "readonly"

    case "GUARDIAN":
      return context?.isGuardian ? "guardian" : "readonly"

    default:
      return "readonly"
  }
}
