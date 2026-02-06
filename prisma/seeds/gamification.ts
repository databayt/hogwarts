/**
 * Gamification Seed
 * Creates attendance badges, competitions, streaks, rewards, and student badges
 *
 * Phase 15: Gamification
 *
 * Features:
 * - 8-10 AttendanceBadge definitions
 * - 1 AttendanceCompetition with ClassCompetitionEntry for 15 classes
 * - AttendanceStreak for top 50 students
 * - 100-200 AttendanceReward point records
 * - 50-80 StudentBadge awards
 */

import type { PrismaClient } from "@prisma/client"

import type { ClassRef, StudentRef } from "./types"
import { logSuccess, randomNumber } from "./utils"

// ============================================================================
// BADGE DEFINITIONS
// ============================================================================

const BADGE_DEFINITIONS = [
  {
    code: "PERFECT_WEEK",
    name: "حضور مثالي أسبوعي",
    description: "حضور 5 أيام كاملة في أسبوع واحد",
    icon: "trophy",
    color: "#FFD700",
    pointValue: 50,
  },
  {
    code: "EARLY_BIRD",
    name: "الطائر المبكر",
    description: "الحضور قبل الجرس لمدة 10 أيام متتالية",
    icon: "sunrise",
    color: "#FF8C00",
    pointValue: 30,
  },
  {
    code: "STREAK_5",
    name: "سلسلة 5 أيام",
    description: "حضور 5 أيام متتالية بدون غياب",
    icon: "flame",
    color: "#FF4500",
    pointValue: 25,
  },
  {
    code: "STREAK_10",
    name: "سلسلة 10 أيام",
    description: "حضور 10 أيام متتالية بدون غياب",
    icon: "flame",
    color: "#DC2626",
    pointValue: 50,
  },
  {
    code: "STREAK_30",
    name: "سلسلة 30 يوماً",
    description: "حضور شهر كامل بدون غياب",
    icon: "award",
    color: "#9333EA",
    pointValue: 100,
  },
  {
    code: "PERFECT_MONTH",
    name: "شهر مثالي",
    description: "حضور مثالي طوال الشهر",
    icon: "star",
    color: "#10B981",
    pointValue: 75,
  },
  {
    code: "COMEBACK_KID",
    name: "العودة القوية",
    description: "تحسن ملحوظ في الحضور بعد فترة غياب",
    icon: "trending-up",
    color: "#3B82F6",
    pointValue: 40,
  },
  {
    code: "CONSISTENCY_STAR",
    name: "نجم الانتظام",
    description: "معدل حضور 95% أو أعلى خلال الفصل",
    icon: "check-circle",
    color: "#059669",
    pointValue: 100,
  },
  {
    code: "CLASS_CHAMPION",
    name: "بطل الفصل",
    description: "أعلى معدل حضور في الفصل",
    icon: "crown",
    color: "#F59E0B",
    pointValue: 75,
  },
  {
    code: "HELPING_HAND",
    name: "يد المساعدة",
    description: "مساعدة زميل في تحسين حضوره",
    icon: "heart-handshake",
    color: "#EC4899",
    pointValue: 30,
  },
]

// ============================================================================
// GAMIFICATION SEEDING
// ============================================================================

export async function seedGamification(
  prisma: PrismaClient,
  schoolId: string,
  students: StudentRef[],
  classes: ClassRef[]
): Promise<number> {
  let totalRecords = 0

  // 1. Create Badge Definitions
  const badgeIds: string[] = []
  for (const badge of BADGE_DEFINITIONS) {
    try {
      const existing = await prisma.attendanceBadge.findFirst({
        where: { schoolId, code: badge.code },
      })
      if (existing) {
        badgeIds.push(existing.id)
      } else {
        const created = await prisma.attendanceBadge.create({
          data: {
            schoolId,
            code: badge.code,
            name: badge.name,
            description: badge.description,
            lang: "ar",
            icon: badge.icon,
            color: badge.color,
            pointValue: badge.pointValue,
            isActive: true,
            isAutomatic: true,
          },
        })
        badgeIds.push(created.id)
        totalRecords++
      }
    } catch {
      // Skip duplicates
    }
  }
  logSuccess("Attendance Badges", badgeIds.length, "badge definitions")

  // 2. Create Competition (current month)
  const now = new Date()
  const competitionStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const competitionEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  let competitionId: string | null = null
  try {
    const existing = await prisma.attendanceCompetition.findFirst({
      where: { schoolId, isActive: true },
    })
    if (existing) {
      competitionId = existing.id
    } else {
      const competition = await prisma.attendanceCompetition.create({
        data: {
          schoolId,
          name: "تحدي الحضور الشهري",
          lang: "ar",
          description: "مسابقة بين الفصول لأعلى معدل حضور هذا الشهر",
          startDate: competitionStart,
          endDate: competitionEnd,
          isActive: true,
          winnerReward: "رحلة ترفيهية للفصل الفائز",
          participantPoints: 10,
          winnerPoints: 100,
        },
      })
      competitionId = competition.id
      totalRecords++
    }
  } catch {
    // Skip
  }

  // 3. Create Class Competition Entries (15 classes)
  if (competitionId) {
    const competitionClasses = classes.slice(0, 15)
    for (let i = 0; i < competitionClasses.length; i++) {
      const classInfo = competitionClasses[i]
      const attendanceRate = 75 + randomNumber(0, 25) // 75-100%
      try {
        await prisma.classCompetitionEntry.upsert({
          where: {
            competitionId_classId: {
              competitionId,
              classId: classInfo.id,
            },
          },
          update: { attendanceRate, rank: i + 1 },
          create: {
            schoolId,
            competitionId,
            classId: classInfo.id,
            totalStudents: randomNumber(25, 35),
            presentDays: randomNumber(200, 350),
            lateDays: randomNumber(10, 30),
            absentDays: randomNumber(5, 25),
            attendanceRate,
            rank: i + 1,
          },
        })
        totalRecords++
      } catch {
        // Skip duplicates
      }
    }
    logSuccess(
      "Competition Entries",
      competitionClasses.length,
      "class entries"
    )
  }

  // 4. Create Attendance Streaks for top 50 students
  const topStudents = students.slice(0, 50)
  let streakCount = 0
  for (let i = 0; i < topStudents.length; i++) {
    const student = topStudents[i]
    const currentStreak = randomNumber(5, 30)
    const longestStreak = Math.max(currentStreak, randomNumber(10, 45))

    try {
      await prisma.attendanceStreak.upsert({
        where: { studentId: student.id },
        update: { currentStreak, longestStreak },
        create: {
          schoolId,
          studentId: student.id,
          currentStreak,
          longestStreak,
          streakStartDate: new Date(
            now.getTime() - currentStreak * 24 * 60 * 60 * 1000
          ),
          lastPresentDate: now,
          monthlyPresent: randomNumber(15, 22),
          monthlyLate: randomNumber(0, 3),
          monthlyAbsent: randomNumber(0, 2),
          monthStart: competitionStart,
        },
      })
      streakCount++
    } catch {
      // Skip duplicates
    }
  }
  totalRecords += streakCount
  logSuccess("Attendance Streaks", streakCount, "top students")

  // 5. Create Attendance Rewards (150 point records)
  const rewardReasons = [
    "DAILY_PRESENT",
    "DAILY_ON_TIME",
    "WEEKLY_STREAK",
    "MONTHLY_PERFECT",
    "BADGE_EARNED",
    "IMPROVEMENT",
  ] as const
  let rewardCount = 0
  for (let i = 0; i < 150; i++) {
    const student = students[i % students.length]
    const reason = rewardReasons[i % rewardReasons.length]
    const points =
      reason === "MONTHLY_PERFECT"
        ? 75
        : reason === "WEEKLY_STREAK"
          ? 50
          : reason === "BADGE_EARNED"
            ? 40
            : reason === "IMPROVEMENT"
              ? 25
              : 10

    try {
      await prisma.attendanceReward.create({
        data: {
          schoolId,
          studentId: student.id,
          points,
          reason,
          description: `نقاط ${reason === "DAILY_PRESENT" ? "الحضور اليومي" : reason === "WEEKLY_STREAK" ? "سلسلة الأسبوع" : "التميز"}`,
          awardedAt: new Date(
            now.getTime() - randomNumber(1, 60) * 24 * 60 * 60 * 1000
          ),
        },
      })
      rewardCount++
    } catch {
      // Skip
    }
  }
  totalRecords += rewardCount
  logSuccess("Attendance Rewards", rewardCount, "point records")

  // 6. Create Student Badge Awards (70)
  let badgeAwardCount = 0
  for (let i = 0; i < 70; i++) {
    const student = students[i % students.length]
    const badgeId = badgeIds[i % badgeIds.length]
    const weeksAgo = randomNumber(1, 10)
    const periodStart = new Date(
      now.getTime() - weeksAgo * 7 * 24 * 60 * 60 * 1000
    )
    const periodEnd = new Date(periodStart.getTime() + 7 * 24 * 60 * 60 * 1000)

    try {
      await prisma.studentBadge.create({
        data: {
          schoolId,
          studentId: student.id,
          badgeId,
          awardedAt: new Date(
            now.getTime() - randomNumber(1, 60) * 24 * 60 * 60 * 1000
          ),
          periodStart,
          periodEnd,
        },
      })
      badgeAwardCount++
    } catch {
      // Skip duplicates (unique constraint on schoolId, studentId, badgeId, periodStart)
    }
  }
  totalRecords += badgeAwardCount
  logSuccess("Student Badges", badgeAwardCount, "badge awards")

  return totalRecords
}
