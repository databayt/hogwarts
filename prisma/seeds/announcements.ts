/**
 * Announcements Seed
 * Creates school announcements with bilingual content
 *
 * Phase 7: Announcements & Events
 */

import type { PrismaClient } from "@prisma/client"

import { ANNOUNCEMENTS } from "./constants"
import type { UserRef } from "./types"
import { logPhase, logSuccess } from "./utils"

// ============================================================================
// ANNOUNCEMENTS SEEDING
// ============================================================================

/**
 * Seed announcements (20+ bilingual announcements)
 * Note: Announcement model has no unique constraint, using findFirst + create
 */
export async function seedAnnouncements(
  prisma: PrismaClient,
  schoolId: string,
  adminUsers: UserRef[]
): Promise<number> {
  logPhase(7, "ANNOUNCEMENTS & EVENTS", "الإعلانات والفعاليات")

  const admin = adminUsers.find((u) => u.role === "ADMIN") || adminUsers[0]
  if (!admin) return 0

  let count = 0

  for (const announcement of ANNOUNCEMENTS) {
    try {
      // Check if announcement exists (by title)
      const existing = await prisma.announcement.findFirst({
        where: {
          schoolId,
          titleEn: announcement.titleEn,
        },
      })

      if (!existing) {
        await prisma.announcement.create({
          data: {
            schoolId,
            titleEn: announcement.titleEn,
            titleAr: announcement.titleAr,
            bodyEn: announcement.bodyEn,
            bodyAr: announcement.bodyAr,
            scope: announcement.scope.toLowerCase() as
              | "school"
              | "class"
              | "role",
            priority: announcement.priority.toLowerCase() as
              | "low"
              | "normal"
              | "high"
              | "urgent",
            published: true,
            publishedAt: new Date(),
            createdBy: admin.id,
          },
        })
        count++
      }
    } catch {
      // Skip if announcement already exists
    }
  }

  // Add more diverse announcements
  const additionalAnnouncements = [
    {
      titleEn: "Library New Arrivals",
      titleAr: "الكتب الجديدة في المكتبة",
      bodyEn: "Check out our latest collection of educational books!",
      bodyAr: "اطلعوا على مجموعتنا الجديدة من الكتب التعليمية!",
      scope: "school" as const,
      priority: "normal" as const,
    },
    {
      titleEn: "Exam Schedule Released",
      titleAr: "إعلان جدول الامتحانات",
      bodyEn:
        "The midterm exam schedule has been released. Please check your portal.",
      bodyAr:
        "تم الإعلان عن جدول امتحانات منتصف الفصل. يرجى مراجعة البوابة الإلكترونية.",
      scope: "school" as const,
      priority: "high" as const,
    },
    {
      titleEn: "School Uniform Reminder",
      titleAr: "تذكير بالزي المدرسي",
      bodyEn: "All students must wear proper school uniform.",
      bodyAr: "يجب على جميع الطلاب ارتداء الزي المدرسي الرسمي.",
      scope: "school" as const,
      priority: "normal" as const,
    },
    {
      titleEn: "Science Fair Registration",
      titleAr: "التسجيل في معرض العلوم",
      bodyEn: "Register now for the annual science fair!",
      bodyAr: "سجل الآن في معرض العلوم السنوي!",
      scope: "school" as const,
      priority: "normal" as const,
    },
    {
      titleEn: "Holiday Notice",
      titleAr: "إشعار بالإجازة",
      bodyEn: "School will be closed for the upcoming holiday.",
      bodyAr: "ستكون المدرسة مغلقة خلال الإجازة القادمة.",
      scope: "school" as const,
      priority: "high" as const,
    },
  ]

  for (const announcement of additionalAnnouncements) {
    try {
      const existing = await prisma.announcement.findFirst({
        where: {
          schoolId,
          titleEn: announcement.titleEn,
        },
      })

      if (!existing) {
        await prisma.announcement.create({
          data: {
            schoolId,
            titleEn: announcement.titleEn,
            titleAr: announcement.titleAr,
            bodyEn: announcement.bodyEn,
            bodyAr: announcement.bodyAr,
            scope: announcement.scope,
            priority: announcement.priority,
            published: true,
            publishedAt: new Date(),
            createdBy: admin.id,
          },
        })
        count++
      }
    } catch {
      // Skip if announcement already exists
    }
  }

  logSuccess("Announcements", count, "bilingual")

  return count
}
