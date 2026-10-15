"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { db } from "@/lib/db"

import { requireSchoolRole } from "../../require-school-admin"

export async function getRoleStats() {
  const { schoolId } = await requireSchoolRole()

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

/** Permission ids (translated in `schoolConsole.access.permissions`). */
const PERMISSION_MATRIX: Record<string, string[]> = {
  ADMIN: [
    "manageUsers",
    "manageClasses",
    "viewReports",
    "manageSettings",
    "viewBilling",
    "manageCommunication",
    "viewAuditLogs",
  ],
  TEACHER: [
    "viewStudents",
    "manageGrades",
    "markAttendance",
    "viewClassReports",
    "sendMessages",
  ],
  STUDENT: ["viewGrades", "viewAttendance", "viewAssignments", "sendMessages"],
  GUARDIAN: [
    "viewStudentGrades",
    "viewAttendance",
    "receiveNotifications",
    "sendMessages",
  ],
  ACCOUNTANT: [
    "viewBilling",
    "manageInvoices",
    "viewFinancialReports",
    "processPayments",
  ],
  STAFF: ["viewStudents", "viewAttendance", "viewReports", "sendMessages"],
}

export async function getPermissionMatrix() {
  await requireSchoolRole()
  return PERMISSION_MATRIX
}
