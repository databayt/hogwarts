"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import {
  checkFinancePermission,
  grantFinancePermission,
  revokeFinancePermission,
  type FinanceAction,
  type FinanceModule,
} from "@/components/platform/finance/lib/permissions"

export type UserPermissionSummary = {
  userId: string
  userName: string
  userEmail: string
  userRole: string
  permissions: Array<{
    module: FinanceModule
    actions: FinanceAction[]
  }>
}

export type ModulePermissionSummary = {
  module: FinanceModule
  users: Array<{
    userId: string
    userName: string
    userEmail: string
    userRole: string
    actions: FinanceAction[]
  }>
}

/**
 * Get all users in school with their finance permissions
 */
export async function getAllUsersWithPermissions(): Promise<{
  success: boolean
  data?: UserPermissionSummary[]
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id || !session.user.schoolId) {
      return { success: false, error: "Unauthorized" }
    }

    const schoolId = session.user.schoolId

    // Check if current user can manage permissions
    const canManage = await checkFinancePermission(
      session.user.id,
      schoolId,
      "accounts", // Use accounts module as proxy for admin access
      "approve"
    )

    if (!canManage) {
      return { success: false, error: "Insufficient permissions" }
    }

    // Get all users in school
    const users = await db.user.findMany({
      where: { schoolId },
      select: {
        id: true,
        email: true,
        role: true,
      },
      orderBy: { email: "asc" },
    })

    // Get all finance permissions for this school
    const permissions = await db.financePermission.findMany({
      where: { schoolId },
      select: {
        userId: true,
        module: true,
        action: true,
      },
    })

    // Group permissions by user and module
    const userPermissionsMap = new Map<
      string,
      Map<FinanceModule, FinanceAction[]>
    >()

    for (const perm of permissions) {
      if (!userPermissionsMap.has(perm.userId)) {
        userPermissionsMap.set(perm.userId, new Map())
      }
      const userPerms = userPermissionsMap.get(perm.userId)!
      if (!userPerms.has(perm.module as FinanceModule)) {
        userPerms.set(perm.module as FinanceModule, [])
      }
      userPerms.get(perm.module as FinanceModule)!.push(perm.action as FinanceAction)
    }

    // Build summary
    const summary: UserPermissionSummary[] = users.map((user) => {
      const userPerms = userPermissionsMap.get(user.id) || new Map()
      const permissions = Array.from(userPerms.entries()).map(
        ([module, actions]) => ({
          module,
          actions,
        })
      )

      return {
        userId: user.id,
        userName: user.email || "Unknown",
        userEmail: user.email || "",
        userRole: user.role,
        permissions,
      }
    })

    return { success: true, data: summary }
  } catch (error) {
    console.error("Error getting users with permissions:", error)
    return { success: false, error: "Failed to fetch users" }
  }
}

/**
 * Get permissions grouped by module
 */
export async function getPermissionsByModule(): Promise<{
  success: boolean
  data?: ModulePermissionSummary[]
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id || !session.user.schoolId) {
      return { success: false, error: "Unauthorized" }
    }

    const schoolId = session.user.schoolId

    // Check if current user can manage permissions
    const canManage = await checkFinancePermission(
      session.user.id,
      schoolId,
      "accounts",
      "approve"
    )

    if (!canManage) {
      return { success: false, error: "Insufficient permissions" }
    }

    // Get all finance permissions
    const permissions = await db.financePermission.findMany({
      where: { schoolId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    })

    // Group by module
    const moduleMap = new Map<
      FinanceModule,
      Map<string, { user: any; actions: FinanceAction[] }>
    >()

    for (const perm of permissions) {
      const module = perm.module as FinanceModule
      if (!moduleMap.has(module)) {
        moduleMap.set(module, new Map())
      }
      const modulePerms = moduleMap.get(module)!
      if (!modulePerms.has(perm.userId)) {
        modulePerms.set(perm.userId, {
          user: perm.user,
          actions: [],
        })
      }
      modulePerms.get(perm.userId)!.actions.push(perm.action as FinanceAction)
    }

    // Build summary
    const summary: ModulePermissionSummary[] = Array.from(
      moduleMap.entries()
    ).map(([module, users]) => ({
      module,
      users: Array.from(users.values()).map((u) => ({
        userId: u.user.id,
        userName: u.user.email || "Unknown",
        userEmail: u.user.email || "",
        userRole: u.user.role,
        actions: u.actions,
      })),
    }))

    return { success: true, data: summary }
  } catch (error) {
    console.error("Error getting permissions by module:", error)
    return { success: false, error: "Failed to fetch module permissions" }
  }
}

/**
 * Grant a permission to a user
 */
export async function grantPermission(
  userId: string,
  module: FinanceModule,
  action: FinanceAction
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id || !session.user.schoolId) {
      return { success: false, error: "Unauthorized" }
    }

    const schoolId = session.user.schoolId

    // Check if target user belongs to this school
    const targetUser = await db.user.findUnique({
      where: { id: userId },
      select: { schoolId: true },
    })

    if (!targetUser || targetUser.schoolId !== schoolId) {
      return { success: false, error: "User not found in this school" }
    }

    // Grant permission
    const success = await grantFinancePermission(
      session.user.id,
      userId,
      schoolId,
      module,
      action
    )

    if (!success) {
      return { success: false, error: "Failed to grant permission" }
    }

    revalidatePath("/finance/permissions")
    return { success: true }
  } catch (error) {
    console.error("Error granting permission:", error)
    return { success: false, error: "Failed to grant permission" }
  }
}

/**
 * Revoke a permission from a user
 */
export async function revokePermission(
  userId: string,
  module: FinanceModule,
  action: FinanceAction
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id || !session.user.schoolId) {
      return { success: false, error: "Unauthorized" }
    }

    const schoolId = session.user.schoolId

    // Revoke permission
    const success = await revokeFinancePermission(
      session.user.id,
      userId,
      schoolId,
      module,
      action
    )

    if (!success) {
      return { success: false, error: "Failed to revoke permission" }
    }

    revalidatePath("/finance/permissions")
    return { success: true }
  } catch (error) {
    console.error("Error revoking permission:", error)
    return { success: false, error: "Failed to revoke permission" }
  }
}

/**
 * Bulk grant permissions to a user across multiple modules/actions
 */
export async function bulkGrantPermissions(
  userId: string,
  permissions: Array<{ module: FinanceModule; action: FinanceAction }>
): Promise<{ success: boolean; granted: number; failed: number; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id || !session.user.schoolId) {
      return { success: false, granted: 0, failed: 0, error: "Unauthorized" }
    }

    const schoolId = session.user.schoolId

    let granted = 0
    let failed = 0

    for (const perm of permissions) {
      const success = await grantFinancePermission(
        session.user.id,
        userId,
        schoolId,
        perm.module,
        perm.action
      )
      if (success) {
        granted++
      } else {
        failed++
      }
    }

    revalidatePath("/finance/permissions")
    return { success: true, granted, failed }
  } catch (error) {
    console.error("Error bulk granting permissions:", error)
    return {
      success: false,
      granted: 0,
      failed: permissions.length,
      error: "Failed to bulk grant permissions",
    }
  }
}

/**
 * Bulk revoke permissions from a user
 */
export async function bulkRevokePermissions(
  userId: string,
  permissions: Array<{ module: FinanceModule; action: FinanceAction }>
): Promise<{ success: boolean; revoked: number; failed: number; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id || !session.user.schoolId) {
      return { success: false, revoked: 0, failed: 0, error: "Unauthorized" }
    }

    const schoolId = session.user.schoolId

    let revoked = 0
    let failed = 0

    for (const perm of permissions) {
      const success = await revokeFinancePermission(
        session.user.id,
        userId,
        schoolId,
        perm.module,
        perm.action
      )
      if (success) {
        revoked++
      } else {
        failed++
      }
    }

    revalidatePath("/finance/permissions")
    return { success: true, revoked, failed }
  } catch (error) {
    console.error("Error bulk revoking permissions:", error)
    return {
      success: false,
      revoked: 0,
      failed: permissions.length,
      error: "Failed to bulk revoke permissions",
    }
  }
}

/**
 * Copy permissions from one user to another
 */
export async function copyPermissions(
  fromUserId: string,
  toUserId: string
): Promise<{ success: boolean; copied: number; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id || !session.user.schoolId) {
      return { success: false, copied: 0, error: "Unauthorized" }
    }

    const schoolId = session.user.schoolId

    // Get source user's permissions
    const sourcePermissions = await db.financePermission.findMany({
      where: {
        schoolId,
        userId: fromUserId,
      },
      select: {
        module: true,
        action: true,
      },
    })

    // Copy each permission
    let copied = 0
    for (const perm of sourcePermissions) {
      const success = await grantFinancePermission(
        session.user.id,
        toUserId,
        schoolId,
        perm.module as FinanceModule,
        perm.action as FinanceAction
      )
      if (success) copied++
    }

    revalidatePath("/finance/permissions")
    return { success: true, copied }
  } catch (error) {
    console.error("Error copying permissions:", error)
    return { success: false, copied: 0, error: "Failed to copy permissions" }
  }
}
