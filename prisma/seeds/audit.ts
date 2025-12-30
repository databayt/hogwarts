/**
 * Audit Seed
 * Creates Audit Log entries for system activity tracking
 *
 * Phase 16: Compliance
 *
 * Features:
 * - 500+ audit log entries
 * - Distribution across action types
 * - Spread over past 30 days
 * - Realistic IP addresses and user agents
 */

import type { PrismaClient } from "@prisma/client"

import type { UserRef } from "./types"
import {
  logPhase,
  logSuccess,
  processBatch,
  randomElement,
  randomNumber,
} from "./utils"

// ============================================================================
// SAMPLE DATA
// ============================================================================

// Action categories with their specific actions
const AUDIT_ACTIONS = {
  auth: [
    "LOGIN_SUCCESS",
    "LOGIN_FAILED",
    "LOGOUT",
    "PASSWORD_CHANGED",
    "PASSWORD_RESET_REQUESTED",
    "SESSION_EXPIRED",
    "MFA_ENABLED",
    "MFA_DISABLED",
  ],
  user: [
    "USER_CREATED",
    "USER_UPDATED",
    "USER_DELETED",
    "PROFILE_UPDATED",
    "ROLE_CHANGED",
    "PERMISSIONS_UPDATED",
  ],
  student: [
    "STUDENT_CREATED",
    "STUDENT_UPDATED",
    "STUDENT_ENROLLED",
    "STUDENT_TRANSFERRED",
    "STUDENT_GRADUATED",
    "ATTENDANCE_MARKED",
    "GRADE_POSTED",
    "REPORT_CARD_GENERATED",
  ],
  teacher: [
    "TEACHER_CREATED",
    "TEACHER_UPDATED",
    "CLASS_ASSIGNED",
    "SUBJECT_ASSIGNED",
    "TIMETABLE_UPDATED",
  ],
  academic: [
    "CLASS_CREATED",
    "EXAM_SCHEDULED",
    "EXAM_RESULTS_PUBLISHED",
    "ASSIGNMENT_CREATED",
    "ASSIGNMENT_GRADED",
    "LESSON_CREATED",
    "LESSON_UPDATED",
  ],
  finance: [
    "FEE_CREATED",
    "PAYMENT_RECEIVED",
    "INVOICE_GENERATED",
    "RECEIPT_ISSUED",
    "EXPENSE_RECORDED",
    "BUDGET_UPDATED",
  ],
  settings: [
    "SCHOOL_SETTINGS_UPDATED",
    "BRANDING_UPDATED",
    "YEAR_CREATED",
    "TERM_CREATED",
    "DEPARTMENT_CREATED",
  ],
  data: [
    "DATA_EXPORTED",
    "DATA_IMPORTED",
    "BACKUP_CREATED",
    "REPORT_GENERATED",
  ],
}

const ACTION_REASONS: Record<string, string[]> = {
  LOGIN_SUCCESS: [
    "Successful login via email/password",
    "Login via Google OAuth",
    "Login via Facebook OAuth",
    "Login from mobile device",
  ],
  LOGIN_FAILED: [
    "Invalid password",
    "User not found",
    "Account locked",
    "Too many attempts",
  ],
  LOGOUT: ["User initiated logout", "Session timeout", "Automatic logout"],
  PASSWORD_CHANGED: [
    "Password changed by user",
    "Password reset completed",
    "Admin password reset",
  ],
  USER_CREATED: [
    "New user registration",
    "User created by admin",
    "Bulk import",
  ],
  USER_UPDATED: [
    "Profile information updated",
    "Contact details changed",
    "Settings modified",
  ],
  STUDENT_CREATED: [
    "New student enrollment",
    "Student imported from CSV",
    "Transfer student added",
  ],
  STUDENT_UPDATED: [
    "Student profile updated",
    "Academic record modified",
    "Contact information changed",
  ],
  ATTENDANCE_MARKED: [
    "Daily attendance recorded",
    "Attendance modified by teacher",
    "Bulk attendance update",
  ],
  GRADE_POSTED: [
    "Exam grade posted",
    "Assignment grade recorded",
    "Grade correction",
  ],
  PAYMENT_RECEIVED: [
    "Fee payment received",
    "Online payment processed",
    "Cash payment recorded",
  ],
  DATA_EXPORTED: [
    "Student data exported",
    "Financial report exported",
    "Attendance report generated",
  ],
  SCHOOL_SETTINGS_UPDATED: [
    "School configuration changed",
    "Academic year settings updated",
    "Notification settings modified",
  ],
}

// Sample IP addresses (internal and external)
const IP_ADDRESSES = [
  "192.168.1.100",
  "192.168.1.105",
  "192.168.1.110",
  "10.0.0.50",
  "10.0.0.55",
  "10.0.0.60",
  "172.16.0.100",
  "172.16.0.101",
  "41.67.128.55", // Sudan IP range
  "41.67.130.100",
  "197.254.100.50",
  "197.254.100.100",
  "102.0.100.50",
  "102.0.100.55",
]

// Sample user agents
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
  "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
  "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Edge/120.0.0.0",
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get a random action with category weighting
 * Auth actions are more common (login/logout happen frequently)
 */
function getRandomAction(): { action: string; category: string } {
  // Weight distribution
  const weights = {
    auth: 35, // 35% - most common
    student: 20, // 20%
    academic: 15, // 15%
    finance: 10, // 10%
    teacher: 8, // 8%
    user: 7, // 7%
    data: 3, // 3%
    settings: 2, // 2%
  }

  // Select category based on weight
  let random = randomNumber(1, 100)
  let category = "auth"

  for (const [cat, weight] of Object.entries(weights)) {
    random -= weight
    if (random <= 0) {
      category = cat
      break
    }
  }

  const actions =
    AUDIT_ACTIONS[category as keyof typeof AUDIT_ACTIONS] || AUDIT_ACTIONS.auth
  const action = randomElement(actions)

  return { action, category }
}

/**
 * Get a reason for the action
 */
function getActionReason(action: string): string | null {
  const reasons = ACTION_REASONS[action]
  if (reasons && reasons.length > 0) {
    return randomElement(reasons)
  }
  return null
}

/**
 * Generate a random date within the last N days
 */
function getRandomPastDate(daysAgo: number): Date {
  const date = new Date()
  date.setDate(date.getDate() - randomNumber(0, daysAgo))
  date.setHours(
    randomNumber(6, 22),
    randomNumber(0, 59),
    randomNumber(0, 59),
    0
  )
  return date
}

// ============================================================================
// AUDIT LOG SEEDING
// ============================================================================

/**
 * Seed audit log entries
 * Target: 500+ entries distributed over 30 days
 */
export async function seedAuditLogs(
  prisma: PrismaClient,
  schoolId: string,
  users: UserRef[]
): Promise<number> {
  logPhase(16, "COMPLIANCE", "الامتثال والتدقيق")

  if (users.length === 0) {
    logSuccess("Audit Logs", 0, "no users available")
    return 0
  }

  let auditCount = 0

  // Generate 550 audit log entries
  const targetCount = 550
  const logsToCreate: Array<{
    userId: string
    action: string
    reason: string | null
    ip: string
    userAgent: string
    createdAt: Date
  }> = []

  for (let i = 0; i < targetCount; i++) {
    const user = randomElement(users)
    const { action } = getRandomAction()
    const reason = getActionReason(action)
    const ip = randomElement(IP_ADDRESSES)
    const userAgent = randomElement(USER_AGENTS)
    const createdAt = getRandomPastDate(30)

    logsToCreate.push({
      userId: user.id,
      action,
      reason,
      ip,
      userAgent,
      createdAt,
    })
  }

  // Sort by date (oldest first) for realistic ordering
  logsToCreate.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

  // Create in batches
  await processBatch(logsToCreate, 50, async (logData) => {
    try {
      await prisma.auditLog.create({
        data: {
          schoolId,
          userId: logData.userId,
          action: logData.action,
          reason: logData.reason,
          ip: logData.ip,
          userAgent: logData.userAgent,
          createdAt: logData.createdAt,
        },
      })
      auditCount++
    } catch {
      // Skip if creation fails
    }
  })

  logSuccess("Audit Logs", auditCount, "across all action types")

  return auditCount
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

export { seedAuditLogs as seedAudit }
