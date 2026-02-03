/**
 * Notifications Seed
 * Creates Notifications for all user types
 *
 * Phase 14: Communications
 *
 * Features:
 * - 500+ notifications across all types
 * - Distribution across user types (students, teachers, guardians)
 * - Mix of read/unread status
 * - Priority levels
 */

import type { PrismaClient } from "@prisma/client"

import type { StudentRef, TeacherRef, UserRef } from "./types"
import { logSuccess, processBatch, randomElement, randomNumber } from "./utils"

// ============================================================================
// NOTIFICATION TEMPLATES
// ============================================================================

const NOTIFICATION_CONFIGS = [
  // Assignment notifications
  {
    type: "assignment_created" as const,
    priority: "normal" as const,
    title: "New Assignment Posted",
    bodyTemplate:
      "A new assignment '{{assignmentName}}' has been posted. Due date: {{dueDate}}.",
    targetRole: "STUDENT",
    weight: 15,
  },
  {
    type: "assignment_due" as const,
    priority: "high" as const,
    title: "Assignment Due Soon",
    bodyTemplate:
      "Reminder: '{{assignmentName}}' is due tomorrow. Please submit before the deadline.",
    targetRole: "STUDENT",
    weight: 10,
  },
  {
    type: "assignment_graded" as const,
    priority: "normal" as const,
    title: "Assignment Graded",
    bodyTemplate:
      "Your assignment '{{assignmentName}}' has been graded. Score: {{score}}/{{total}}.",
    targetRole: "STUDENT",
    weight: 12,
  },

  // Grade notifications
  {
    type: "grade_posted" as const,
    priority: "normal" as const,
    title: "New Grade Posted",
    bodyTemplate:
      "Your grade for {{subject}} has been posted. Check your gradebook.",
    targetRole: "STUDENT",
    weight: 10,
  },

  // Attendance notifications
  {
    type: "attendance_marked" as const,
    priority: "low" as const,
    title: "Attendance Recorded",
    bodyTemplate: "Your attendance for today has been marked as {{status}}.",
    targetRole: "STUDENT",
    weight: 8,
  },
  {
    type: "attendance_alert" as const,
    priority: "high" as const,
    title: "Student Absence Alert",
    bodyTemplate: "Your child was marked absent from {{subject}} today.",
    targetRole: "GUARDIAN",
    weight: 8,
  },

  // Fee notifications
  {
    type: "fee_due" as const,
    priority: "high" as const,
    title: "Fee Payment Due",
    bodyTemplate:
      "Your school fee payment of {{amount}} is due by {{dueDate}}.",
    targetRole: "GUARDIAN",
    weight: 10,
  },
  {
    type: "fee_overdue" as const,
    priority: "urgent" as const,
    title: "Overdue Payment Notice",
    bodyTemplate:
      "Your fee payment of {{amount}} is overdue. Please make payment immediately.",
    targetRole: "GUARDIAN",
    weight: 5,
  },
  {
    type: "fee_paid" as const,
    priority: "normal" as const,
    title: "Payment Received",
    bodyTemplate: "Payment of {{amount}} has been received. Thank you.",
    targetRole: "GUARDIAN",
    weight: 8,
  },

  // Announcement notifications
  {
    type: "announcement" as const,
    priority: "normal" as const,
    title: "New Announcement",
    bodyTemplate: "{{title}}: {{preview}}...",
    targetRole: "ALL",
    weight: 12,
  },

  // Event notifications
  {
    type: "event_reminder" as const,
    priority: "normal" as const,
    title: "Event Reminder",
    bodyTemplate: "Reminder: {{eventName}} is scheduled for {{eventDate}}.",
    targetRole: "ALL",
    weight: 8,
  },

  // Class notifications
  {
    type: "class_cancelled" as const,
    priority: "high" as const,
    title: "Class Cancelled",
    bodyTemplate: "{{className}} scheduled for {{date}} has been cancelled.",
    targetRole: "STUDENT",
    weight: 5,
  },
  {
    type: "class_rescheduled" as const,
    priority: "high" as const,
    title: "Class Rescheduled",
    bodyTemplate: "{{className}} has been rescheduled to {{newDate}}.",
    targetRole: "STUDENT",
    weight: 5,
  },

  // System notifications
  {
    type: "system_alert" as const,
    priority: "normal" as const,
    title: "System Notification",
    bodyTemplate: "{{message}}",
    targetRole: "ALL",
    weight: 5,
  },
  {
    type: "account_created" as const,
    priority: "normal" as const,
    title: "Welcome to Hogwarts Academy",
    bodyTemplate:
      "Your account has been created successfully. Complete your profile to get started.",
    targetRole: "ALL",
    weight: 3,
  },
  {
    type: "document_shared" as const,
    priority: "normal" as const,
    title: "Document Shared",
    bodyTemplate:
      "{{senderName}} has shared a document with you: {{documentName}}.",
    targetRole: "ALL",
    weight: 6,
  },
  {
    type: "report_ready" as const,
    priority: "normal" as const,
    title: "Report Ready",
    bodyTemplate: "Your {{reportType}} report is ready for download.",
    targetRole: "ALL",
    weight: 5,
  },
]

// Sample data for templates
const ASSIGNMENT_NAMES = [
  "Chapter 5 Review",
  "Math Problem Set",
  "Science Lab Report",
  "Essay Assignment",
  "Group Project",
  "Weekly Quiz",
  "Reading Comprehension",
  "Practice Problems",
]

const SUBJECTS = [
  "Mathematics",
  "Arabic",
  "English",
  "Science",
  "Physics",
  "Chemistry",
  "Biology",
  "History",
  "Geography",
  "Islamic Studies",
]

const EVENT_NAMES = [
  "Parent-Teacher Conference",
  "Sports Day",
  "Science Fair",
  "Annual Day Celebration",
  "Mid-Term Exams",
  "Final Exams",
  "School Assembly",
  "Book Fair",
]

const ANNOUNCEMENT_TITLES = [
  "School Closure Notice",
  "Holiday Schedule",
  "Exam Schedule Released",
  "New Library Hours",
  "Sports Team Tryouts",
  "School Trip Announcement",
  "Registration Open",
  "Important Update",
]

const SYSTEM_MESSAGES = [
  "System maintenance scheduled for tonight.",
  "New features have been added to the school-dashboard.",
  "Please update your contact information.",
  "The grading system has been updated.",
  "New security measures are in effect.",
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate notification body from template
 */
function generateNotificationBody(
  config: (typeof NOTIFICATION_CONFIGS)[0]
): string {
  let body = config.bodyTemplate

  // Replace placeholders with sample data
  body = body.replace("{{assignmentName}}", randomElement(ASSIGNMENT_NAMES))
  body = body.replace("{{dueDate}}", "December 15, 2025")
  body = body.replace("{{score}}", String(randomNumber(70, 100)))
  body = body.replace("{{total}}", "100")
  body = body.replace("{{subject}}", randomElement(SUBJECTS))
  body = body.replace("{{status}}", randomElement(["present", "late"]))
  body = body.replace("{{amount}}", `$${randomNumber(500, 2000)}`)
  body = body.replace("{{title}}", randomElement(ANNOUNCEMENT_TITLES))
  body = body.replace(
    "{{preview}}",
    "Please read the full announcement for details"
  )
  body = body.replace("{{eventName}}", randomElement(EVENT_NAMES))
  body = body.replace("{{eventDate}}", "December 20, 2025")
  body = body.replace("{{className}}", `${randomElement(SUBJECTS)} Class`)
  body = body.replace("{{date}}", "December 18, 2025")
  body = body.replace("{{newDate}}", "December 19, 2025")
  body = body.replace("{{message}}", randomElement(SYSTEM_MESSAGES))
  body = body.replace("{{senderName}}", "School Admin")
  body = body.replace("{{documentName}}", "Progress Report.pdf")
  body = body.replace(
    "{{reportType}}",
    randomElement(["progress", "attendance", "performance"])
  )

  return body
}

/**
 * Generate a random date within the last 30 days
 */
function generateRecentDate(daysAgo: number = 30): Date {
  const date = new Date()
  date.setDate(date.getDate() - randomNumber(0, daysAgo))
  date.setHours(randomNumber(7, 20), randomNumber(0, 59), 0, 0)
  return date
}

// ============================================================================
// NOTIFICATIONS SEEDING
// ============================================================================

/**
 * Seed notifications for all users
 * Target: 500+ notifications
 */
export async function seedNotifications(
  prisma: PrismaClient,
  schoolId: string,
  teachers: TeacherRef[],
  students: StudentRef[],
  adminUsers: UserRef[]
): Promise<number> {
  let notificationCount = 0

  // Get user IDs by role
  const teacherUserIds = teachers
    .filter((t) => t.userId)
    .map((t) => t.userId!)
    .slice(0, 50)
  const studentUserIds = students
    .filter((s) => s.userId)
    .map((s) => s.userId!)
    .slice(0, 200)
  const adminUserIds = adminUsers.map((u) => u.id).slice(0, 4)

  // Get guardian user IDs from related guardians
  const guardianRecords = await prisma.guardian.findMany({
    where: { schoolId },
    select: { userId: true },
    take: 100,
  })
  const guardianUserIds = guardianRecords
    .filter((g) => g.userId)
    .map((g) => g.userId!)

  const allUserIds = [
    ...teacherUserIds,
    ...studentUserIds,
    ...adminUserIds,
    ...guardianUserIds,
  ]

  if (allUserIds.length === 0) {
    logSuccess("Notifications", 0, "no users found")
    return 0
  }

  // Calculate total weight for distribution
  const totalWeight = NOTIFICATION_CONFIGS.reduce((sum, c) => sum + c.weight, 0)

  // Generate 500+ notifications
  const targetCount = 550
  const notificationsToCreate: Array<{
    config: (typeof NOTIFICATION_CONFIGS)[0]
    userId: string
  }> = []

  for (let i = 0; i < targetCount; i++) {
    // Select notification type based on weight
    let random = Math.random() * totalWeight
    let selectedConfig = NOTIFICATION_CONFIGS[0]
    for (const config of NOTIFICATION_CONFIGS) {
      random -= config.weight
      if (random <= 0) {
        selectedConfig = config
        break
      }
    }

    // Select user based on target role
    let userPool: string[]
    switch (selectedConfig.targetRole) {
      case "STUDENT":
        userPool = studentUserIds.length > 0 ? studentUserIds : allUserIds
        break
      case "GUARDIAN":
        userPool = guardianUserIds.length > 0 ? guardianUserIds : allUserIds
        break
      case "TEACHER":
        userPool = teacherUserIds.length > 0 ? teacherUserIds : allUserIds
        break
      default:
        userPool = allUserIds
    }

    const userId = randomElement(userPool)
    if (userId) {
      notificationsToCreate.push({ config: selectedConfig, userId })
    }
  }

  // Create notifications in batches
  await processBatch(notificationsToCreate, 50, async ({ config, userId }) => {
    const createdAt = generateRecentDate(30)
    const isRead = Math.random() < 0.6 // 60% read

    try {
      await prisma.notification.create({
        data: {
          schoolId,
          userId,
          type: config.type,
          priority: config.priority,
          title: config.title,
          body: generateNotificationBody(config),
          channels: ["in_app"],
          read: isRead,
          readAt: isRead
            ? new Date(createdAt.getTime() + randomNumber(60000, 86400000))
            : null,
          createdAt,
          updatedAt: createdAt,
        },
      })
      notificationCount++
    } catch {
      // Skip if notification creation fails
    }
  })

  logSuccess("Notifications", notificationCount, "across all types")

  return notificationCount
}
