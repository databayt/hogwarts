// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Finance Permissions Utility
 *
 * This is one of the ONLY shared utilities in the finance block.
 * All sub-blocks use this for permission checking.
 *
 * Implements a hybrid permission system:
 * - Role-based access (base layer)
 * - Granular permissions (fine-tuning)
 */

import { cache } from "react"
import { auth } from "@/auth"
import { UserRole } from "@prisma/client"

import { db } from "@/lib/db"

/**
 * Finance modules that can have permissions
 */
export type FinanceModule =
  | "invoice"
  | "receipt"
  | "banking"
  | "fees"
  | "salary"
  | "payroll"
  | "timesheet"
  | "wallet"
  | "budget"
  | "expenses"
  | "accounts"
  | "reports"

/**
 * Actions that can be performed on finance modules
 */
export type FinanceAction =
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "approve"
  | "process"
  | "export"

/**
 * Roles with default finance access
 */
const FINANCE_ADMIN_ROLES: UserRole[] = ["ADMIN", "ACCOUNTANT", "DEVELOPER"]

/**
 * Per-request memo of the caller's role + tenant.
 *
 * A finance page evaluates several actions on the same module (fees checks
 * view/edit/approve/create/export), and every one of those used to repeat this
 * identical lookup. React's `cache()` dedupes them within a single request
 * only -- an authorization answer must never survive into the next request, so
 * do NOT reach for `unstable_cache` or a module-level map here.
 */
const getFinanceUser = cache(
  async (userId: string) =>
    await db.user.findUnique({
      where: { id: userId },
      select: { role: true, schoolId: true },
    })
)

/**
 * Per-request memo of every granular action granted on one module.
 *
 * Reading the whole module in one `findMany` collapses the N per-action
 * `findUnique`s a page used to issue into a single query, and `cache()` then
 * shares that one result across all N checks.
 */
const getGrantedActions = cache(
  async (
    schoolId: string,
    userId: string,
    module: FinanceModule
  ): Promise<ReadonlySet<string>> => {
    const rows = await db.financePermission.findMany({
      where: { schoolId, userId, module },
      select: { action: true },
    })
    return new Set(rows.map((r) => r.action))
  }
)

/**
 * Check if user has permission to perform action on module
 *
 * @param userId - User ID to check
 * @param schoolId - School ID for multi-tenant isolation
 * @param module - Finance module (e.g., "invoice", "payroll")
 * @param action - Action to perform (e.g., "view", "create", "approve")
 * @returns true if user has permission, false otherwise
 *
 * @example
 * ```typescript
 * const canCreate = await checkFinancePermission(
 *   userId,
 *   schoolId,
 *   'invoice',
 *   'create'
 * )
 * if (!canCreate) {
 *   return { success: false, error: 'Unauthorized' }
 * }
 * ```
 */
export async function checkFinancePermission(
  userId: string,
  schoolId: string,
  module: FinanceModule,
  action: FinanceAction
): Promise<boolean> {
  try {
    // Get user with role (memoized per request)
    const user = await getFinanceUser(userId)

    if (!user) return false

    // Developers can access everything
    if (user.role === "DEVELOPER") return true

    // Check if user belongs to this school
    if (user.schoolId !== schoolId) return false

    // Check role-based access (base layer) -- short-circuits before the
    // granular table is ever touched, which is the common case for
    // ADMIN/ACCOUNTANT.
    if (FINANCE_ADMIN_ROLES.includes(user.role)) return true

    // Check granular permissions (fine-tuning)
    const granted = await getGrantedActions(schoolId, userId, module)

    return granted.has(action)
  } catch (error) {
    console.error("Error checking finance permission:", error)
    return false
  }
}

/**
 * Check if current session user has permission
 * Convenience wrapper around checkFinancePermission
 *
 * @param schoolId - School ID for multi-tenant isolation
 * @param module - Finance module
 * @param action - Action to perform
 * @returns true if current user has permission
 *
 * @example
 * ```typescript
 * // In a server action
 * export async function createInvoice(data: FormData) {
 *   const { schoolId } = await getTenantContext()
 *
 *   const canCreate = await checkCurrentUserPermission(
 *     schoolId,
 *     'invoice',
 *     'create'
 *   )
 *
 *   if (!canCreate) {
 *     return { success: false, error: 'Unauthorized' }
 *   }
 *   // ... rest of action
 * }
 * ```
 */
export async function checkCurrentUserPermission(
  schoolId: string,
  module: FinanceModule,
  action: FinanceAction
): Promise<boolean> {
  const session = await auth()
  if (!session?.user?.id) return false

  return checkFinancePermission(session.user.id, schoolId, module, action)
}

/**
 * Get all permissions for a user in a specific module
 * Useful for UI to show/hide buttons based on permissions
 *
 * @param userId - User ID
 * @param schoolId - School ID
 * @param module - Finance module
 * @returns Array of actions the user can perform
 *
 * @example
 * ```typescript
 * const permissions = await getUserModulePermissions(
 *   userId,
 *   schoolId,
 *   'invoice'
 * )
 * // permissions might be: ['view', 'create', 'edit']
 * ```
 */
export async function getUserModulePermissions(
  userId: string,
  schoolId: string,
  module: FinanceModule
): Promise<FinanceAction[]> {
  try {
    const user = await getFinanceUser(userId)

    if (!user || user.schoolId !== schoolId) return []

    // Admins have all permissions
    if (FINANCE_ADMIN_ROLES.includes(user.role)) {
      return [
        "view",
        "create",
        "edit",
        "delete",
        "approve",
        "process",
        "export",
      ]
    }

    // Get granular permissions (shares the per-request memo with
    // checkFinancePermission, so a page that calls both pays for one query)
    const granted = await getGrantedActions(schoolId, userId, module)

    return [...granted] as FinanceAction[]
  } catch (error) {
    console.error("Error getting user module permissions:", error)
    return []
  }
}

/**
 * Grant permission to a user for a specific module and action
 * Only admins can grant permissions
 *
 * @param grantedBy - User ID of admin granting permission
 * @param grantedTo - User ID receiving permission
 * @param schoolId - School ID
 * @param module - Finance module
 * @param action - Action to grant
 * @returns true if permission granted successfully
 */
export async function grantFinancePermission(
  grantedBy: string,
  grantedTo: string,
  schoolId: string,
  module: FinanceModule,
  action: FinanceAction
): Promise<boolean> {
  try {
    // Check if granter has admin access
    const canGrant = await checkFinancePermission(
      grantedBy,
      schoolId,
      module,
      "approve" // Approve action implies can manage permissions
    )

    if (!canGrant) return false

    // Grant permission
    await db.financePermission.create({
      data: {
        schoolId,
        userId: grantedTo,
        module,
        action,
      },
    })

    return true
  } catch (error) {
    console.error("Error granting finance permission:", error)
    return false
  }
}

/**
 * Revoke permission from a user
 * Only admins can revoke permissions
 *
 * @param revokedBy - User ID of admin revoking permission
 * @param revokedFrom - User ID losing permission
 * @param schoolId - School ID
 * @param module - Finance module
 * @param action - Action to revoke
 * @returns true if permission revoked successfully
 */
export async function revokeFinancePermission(
  revokedBy: string,
  revokedFrom: string,
  schoolId: string,
  module: FinanceModule,
  action: FinanceAction
): Promise<boolean> {
  try {
    // Check if revoker has admin access
    const canRevoke = await checkFinancePermission(
      revokedBy,
      schoolId,
      module,
      "approve"
    )

    if (!canRevoke) return false

    // Revoke permission
    await db.financePermission.delete({
      where: {
        schoolId_userId_module_action: {
          schoolId,
          userId: revokedFrom,
          module,
          action,
        },
      },
    })

    return true
  } catch (error) {
    console.error("Error revoking finance permission:", error)
    return false
  }
}

/**
 * Check if user has any of the specified roles
 *
 * @param userId - User ID to check
 * @param roles - Array of roles to check against
 * @returns true if user has one of the roles
 */
export async function hasFinanceRole(
  userId: string,
  roles: UserRole[]
): Promise<boolean> {
  try {
    const user = await getFinanceUser(userId)

    if (!user) return false
    return roles.includes(user.role)
  } catch (error) {
    console.error("Error checking finance role:", error)
    return false
  }
}

/**
 * Module-specific permission helpers
 * These provide convenient shortcuts for common permission checks
 */

export const FinancePermissions = {
  // Invoice permissions
  canViewInvoices: (userId: string, schoolId: string) =>
    checkFinancePermission(userId, schoolId, "invoice", "view"),
  canCreateInvoices: (userId: string, schoolId: string) =>
    checkFinancePermission(userId, schoolId, "invoice", "create"),
  canEditInvoices: (userId: string, schoolId: string) =>
    checkFinancePermission(userId, schoolId, "invoice", "edit"),

  // Payroll permissions
  canViewPayroll: (userId: string, schoolId: string) =>
    checkFinancePermission(userId, schoolId, "payroll", "view"),
  canProcessPayroll: (userId: string, schoolId: string) =>
    checkFinancePermission(userId, schoolId, "payroll", "process"),
  canApprovePayroll: (userId: string, schoolId: string) =>
    checkFinancePermission(userId, schoolId, "payroll", "approve"),

  // Expense permissions
  canViewExpenses: (userId: string, schoolId: string) =>
    checkFinancePermission(userId, schoolId, "expenses", "view"),
  canCreateExpenses: (userId: string, schoolId: string) =>
    checkFinancePermission(userId, schoolId, "expenses", "create"),
  canApproveExpenses: (userId: string, schoolId: string) =>
    checkFinancePermission(userId, schoolId, "expenses", "approve"),

  // Accounts permissions (accounting system)
  canViewAccounts: (userId: string, schoolId: string) =>
    checkFinancePermission(userId, schoolId, "accounts", "view"),
  canEditAccounts: (userId: string, schoolId: string) =>
    checkFinancePermission(userId, schoolId, "accounts", "edit"),

  // Reports permissions
  canViewReports: (userId: string, schoolId: string) =>
    checkFinancePermission(userId, schoolId, "reports", "view"),
  canExportReports: (userId: string, schoolId: string) =>
    checkFinancePermission(userId, schoolId, "reports", "export"),
}
