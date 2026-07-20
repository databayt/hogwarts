// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

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
// LEGACY CLEANUP
// ============================================================================

// Titles written by the pre-i18n version of this seed (English text stored
// with the schema default lang "ar"). Mislabeled rows can never be localized
// — the translator sees contentLang === displayLang and returns them as-is —
// so an Arabic viewer gets raw English. Purge them before the count guard so
// any environment that still carries them self-heals on the next seed run.
const LEGACY_EN_TITLES = [
  "New Assignment Posted",
  "Assignment Due Soon",
  "Assignment Graded",
  "New Grade Posted",
  "Attendance Recorded",
  "Student Absence Alert",
  "Fee Payment Due",
  "Overdue Payment Notice",
  "Payment Received",
  "New Announcement",
  "Event Reminder",
  "Class Cancelled",
  "Class Rescheduled",
  "System Notification",
  "Welcome to Hogwarts Academy",
  "Document Shared",
  "Report Ready",
]

// ============================================================================
// NOTIFICATION TEMPLATES
// ============================================================================

const NOTIFICATION_CONFIGS = [
  // Assignment notifications
  {
    type: "assignment_created" as const,
    priority: "normal" as const,
    title: "واجب جديد",
    bodyTemplate:
      "تم نشر واجب جديد بعنوان '{{assignmentName}}'. تاريخ التسليم: {{dueDate}}.",
    targetRole: "STUDENT",
    weight: 15,
  },
  {
    type: "assignment_due" as const,
    priority: "high" as const,
    title: "موعد تسليم الواجب يقترب",
    bodyTemplate:
      "تذكير: موعد تسليم '{{assignmentName}}' غداً. يرجى التسليم قبل الموعد النهائي.",
    targetRole: "STUDENT",
    weight: 10,
  },
  {
    type: "assignment_graded" as const,
    priority: "normal" as const,
    title: "تم تصحيح الواجب",
    bodyTemplate:
      "تم تصحيح واجبك '{{assignmentName}}'. الدرجة: {{score}}/{{total}}.",
    targetRole: "STUDENT",
    weight: 12,
  },

  // Grade notifications
  {
    type: "grade_posted" as const,
    priority: "normal" as const,
    title: "تم نشر درجة جديدة",
    bodyTemplate: "تم نشر درجتك في مادة {{subject}}. يرجى مراجعة سجل الدرجات.",
    targetRole: "STUDENT",
    weight: 10,
  },

  // Attendance notifications
  {
    type: "attendance_marked" as const,
    priority: "low" as const,
    title: "تم تسجيل الحضور",
    bodyTemplate: "تم تسجيل حضورك اليوم بحالة: {{status}}.",
    targetRole: "STUDENT",
    weight: 8,
  },
  {
    type: "attendance_alert" as const,
    priority: "high" as const,
    title: "تنبيه غياب الطالب",
    bodyTemplate: "تم تسجيل غياب ابنك/ابنتك عن حصة {{subject}} اليوم.",
    targetRole: "GUARDIAN",
    weight: 8,
  },

  // Fee notifications
  {
    type: "fee_due" as const,
    priority: "high" as const,
    title: "استحقاق دفع الرسوم",
    bodyTemplate:
      "دفعة الرسوم المدرسية البالغة {{amount}} مستحقة بتاريخ {{dueDate}}.",
    targetRole: "GUARDIAN",
    weight: 10,
  },
  {
    type: "fee_overdue" as const,
    priority: "urgent" as const,
    title: "إشعار تأخر السداد",
    bodyTemplate: "تأخر سداد رسومك البالغة {{amount}}. يرجى السداد فوراً.",
    targetRole: "GUARDIAN",
    weight: 5,
  },
  {
    type: "fee_paid" as const,
    priority: "normal" as const,
    title: "تم استلام الدفعة",
    bodyTemplate: "تم استلام دفعة بقيمة {{amount}}. شكراً لكم.",
    targetRole: "GUARDIAN",
    weight: 8,
  },

  // Announcement notifications
  {
    type: "announcement" as const,
    priority: "normal" as const,
    title: "إعلان جديد",
    bodyTemplate: "{{title}}: {{preview}}...",
    targetRole: "ALL",
    weight: 12,
  },

  // Event notifications
  {
    type: "event_reminder" as const,
    priority: "normal" as const,
    title: "تذكير بالفعالية",
    bodyTemplate: "تذكير: من المقرر إقامة {{eventName}} بتاريخ {{eventDate}}.",
    targetRole: "ALL",
    weight: 8,
  },

  // Class notifications
  {
    type: "class_cancelled" as const,
    priority: "high" as const,
    title: "تم إلغاء الحصة",
    bodyTemplate: "تم إلغاء {{className}} المقررة بتاريخ {{date}}.",
    targetRole: "STUDENT",
    weight: 5,
  },
  {
    type: "class_rescheduled" as const,
    priority: "high" as const,
    title: "تم تغيير موعد الحصة",
    bodyTemplate: "تم تغيير موعد {{className}} إلى {{newDate}}.",
    targetRole: "STUDENT",
    weight: 5,
  },

  // System notifications
  {
    type: "system_alert" as const,
    priority: "normal" as const,
    title: "إشعار النظام",
    bodyTemplate: "{{message}}",
    targetRole: "ALL",
    weight: 5,
  },
  {
    type: "account_created" as const,
    priority: "normal" as const,
    title: "مرحباً بك في مدرستنا",
    bodyTemplate: "تم إنشاء حسابك بنجاح. أكمل ملفك الشخصي للبدء.",
    targetRole: "ALL",
    weight: 3,
  },
  {
    type: "document_shared" as const,
    priority: "normal" as const,
    title: "تمت مشاركة مستند",
    bodyTemplate: "قام {{senderName}} بمشاركة مستند معك: {{documentName}}.",
    targetRole: "ALL",
    weight: 6,
  },
  {
    type: "report_ready" as const,
    priority: "normal" as const,
    title: "التقرير جاهز",
    bodyTemplate: "تقرير {{reportType}} الخاص بك جاهز للتحميل.",
    targetRole: "ALL",
    weight: 5,
  },
]

// Sample data for templates
const ASSIGNMENT_NAMES = [
  "مراجعة الفصل الخامس",
  "مجموعة مسائل الرياضيات",
  "تقرير المختبر العلمي",
  "واجب كتابة مقال",
  "مشروع جماعي",
  "اختبار أسبوعي قصير",
  "فهم المقروء",
  "تمارين تدريبية",
]

const SUBJECTS = [
  "الرياضيات",
  "اللغة العربية",
  "اللغة الإنجليزية",
  "العلوم",
  "الفيزياء",
  "الكيمياء",
  "الأحياء",
  "التاريخ",
  "الجغرافيا",
  "التربية الإسلامية",
]

const EVENT_NAMES = [
  "اجتماع أولياء الأمور والمعلمين",
  "اليوم الرياضي",
  "المعرض العلمي",
  "الاحتفال السنوي",
  "امتحانات منتصف الفصل",
  "الامتحانات النهائية",
  "الطابور الصباحي",
  "معرض الكتاب",
]

const ANNOUNCEMENT_TITLES = [
  "إشعار إغلاق المدرسة",
  "جدول الإجازات",
  "صدور جدول الامتحانات",
  "مواعيد جديدة للمكتبة",
  "اختبارات الانضمام للفريق الرياضي",
  "إعلان رحلة مدرسية",
  "باب التسجيل مفتوح",
  "تحديث مهم",
]

const SYSTEM_MESSAGES = [
  "صيانة النظام مقررة هذه الليلة.",
  "تمت إضافة ميزات جديدة إلى لوحة تحكم المدرسة.",
  "يرجى تحديث بيانات التواصل الخاصة بك.",
  "تم تحديث نظام الدرجات.",
  "دخلت إجراءات أمنية جديدة حيز التنفيذ.",
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
  body = body.replace("{{dueDate}}", "١٥ ديسمبر ٢٠٢٥")
  body = body.replace("{{score}}", String(randomNumber(70, 100)))
  body = body.replace("{{total}}", "100")
  body = body.replace("{{subject}}", randomElement(SUBJECTS))
  body = body.replace("{{status}}", randomElement(["حاضر", "متأخر"]))
  body = body.replace("{{amount}}", `${randomNumber(50000, 500000)} ج.س`)
  body = body.replace("{{title}}", randomElement(ANNOUNCEMENT_TITLES))
  body = body.replace(
    "{{preview}}",
    "يرجى قراءة الإعلان كاملاً للاطلاع على التفاصيل"
  )
  body = body.replace("{{eventName}}", randomElement(EVENT_NAMES))
  body = body.replace("{{eventDate}}", "٢٠ ديسمبر ٢٠٢٥")
  body = body.replace("{{className}}", `حصة ${randomElement(SUBJECTS)}`)
  body = body.replace("{{date}}", "١٨ ديسمبر ٢٠٢٥")
  body = body.replace("{{newDate}}", "١٩ ديسمبر ٢٠٢٥")
  body = body.replace("{{message}}", randomElement(SYSTEM_MESSAGES))
  body = body.replace("{{senderName}}", "إدارة المدرسة")
  body = body.replace("{{documentName}}", "تقرير_الأداء.pdf")
  body = body.replace(
    "{{reportType}}",
    randomElement(["الأداء", "الحضور", "التحصيل"])
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
  // Self-heal: drop rows left behind by the old English seed (see
  // LEGACY_EN_TITLES). Exact-title match keeps organic rows untouched.
  const purged = await prisma.notification.deleteMany({
    where: { schoolId, title: { in: LEGACY_EN_TITLES } },
  })
  if (purged.count > 0) {
    logSuccess("Notifications", purged.count, "legacy English rows purged")
  }

  // Guard against re-seeding a populated table, but don't let a handful of
  // organic rows (real dispatches) block the demo fill after a purge — this
  // seed targets ~550 rows, so anything above 50 means it already ran.
  const existing = await prisma.notification.count({ where: { schoolId } })
  if (existing > 50) {
    logSuccess("Notifications", existing, "already seeded – skipping")
    return existing
  }

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
