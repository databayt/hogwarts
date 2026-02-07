"use server"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

export async function getRoleStats() {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Unauthorized")

  const users = await db.user.findMany({
    where: { schoolId },
    select: { role: true, isTwoFactorEnabled: true },
  })

  const roleStats: Record<string, { count: number; twoFactorCount: number }> =
    {}

  for (const user of users) {
    if (!roleStats[user.role]) {
      roleStats[user.role] = { count: 0, twoFactorCount: 0 }
    }
    roleStats[user.role].count++
    if (user.isTwoFactorEnabled) {
      roleStats[user.role].twoFactorCount++
    }
  }

  return roleStats
}

const PERMISSION_MATRIX: Record<string, string[]> = {
  ADMIN: [
    "Manage users",
    "Manage classes",
    "View reports",
    "Manage settings",
    "View billing",
    "Manage communication",
    "View audit logs",
  ],
  TEACHER: [
    "View students",
    "Manage grades",
    "Mark attendance",
    "View class reports",
    "Send messages",
  ],
  STUDENT: [
    "View grades",
    "View attendance",
    "View assignments",
    "Send messages",
  ],
  GUARDIAN: [
    "View student grades",
    "View attendance",
    "Receive notifications",
    "Send messages",
  ],
  ACCOUNTANT: [
    "View billing",
    "Manage invoices",
    "View financial reports",
    "Process payments",
  ],
  STAFF: ["View students", "View attendance", "View reports", "Send messages"],
}

export async function getPermissionMatrix() {
  return PERMISSION_MATRIX
}
