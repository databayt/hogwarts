/**
 * Gamification Server Actions
 *
 * Server actions for managing attendance points, badges, and competitions.
 */
"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { db } from "@/lib/db"

import {
  awardBadgeSchema,
  awardPointsSchema,
  BADGE_DEFINITIONS,
  checkBadgeQualification,
  createCompetitionSchema,
  getStreakBonus,
  POINT_VALUES,
  type AwardBadgeInput,
  type AwardPointsInput,
  type BadgeCode,
  type CreateCompetitionInput,
  type LeaderboardEntry,
} from "./validation"

interface ActionResult {
  success: boolean
  error?: string
  data?: unknown
}

/**
 * Award points to a student
 */
export async function awardPoints(
  input: AwardPointsInput
): Promise<ActionResult> {
  const session = await auth()
  const schoolId = session?.user?.schoolId
  const userId = session?.user?.id

  if (!schoolId) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const validated = awardPointsSchema.parse(input)

    const reward = await db.attendanceReward.create({
      data: {
        schoolId,
        studentId: validated.studentId,
        points: validated.points,
        reason: validated.reason,
        description: validated.description,
        awardedBy: userId,
        attendanceId: validated.attendanceId,
        badgeId: validated.badgeId,
      },
    })

    revalidatePath("/attendance/gamification")

    return { success: true, data: reward }
  } catch (error) {
    console.error("Error awarding points:", error)
    return { success: false, error: "Failed to award points" }
  }
}

/**
 * Process daily attendance for points (called after attendance is marked)
 */
export async function processAttendancePoints(
  studentId: string,
  attendanceId: string,
  status: "PRESENT" | "LATE" | "ABSENT"
): Promise<ActionResult> {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    // Only award points for present or late
    if (status === "ABSENT") {
      // Reset streak on absence
      await db.attendanceStreak.upsert({
        where: { studentId },
        create: {
          schoolId,
          studentId,
          currentStreak: 0,
          monthlyAbsent: 1,
        },
        update: {
          currentStreak: 0,
          monthlyAbsent: { increment: 1 },
        },
      })
      return { success: true, data: { points: 0, streakBroken: true } }
    }

    // Get or create streak record
    const streak = await db.attendanceStreak.upsert({
      where: { studentId },
      create: {
        schoolId,
        studentId,
        currentStreak: 1,
        longestStreak: 1,
        streakStartDate: new Date(),
        lastPresentDate: new Date(),
        monthlyPresent: status === "PRESENT" ? 1 : 0,
        monthlyLate: status === "LATE" ? 1 : 0,
        monthStart: new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          1
        ),
      },
      update: {
        currentStreak: { increment: 1 },
        lastPresentDate: new Date(),
        monthlyPresent: status === "PRESENT" ? { increment: 1 } : undefined,
        monthlyLate: status === "LATE" ? { increment: 1 } : undefined,
      },
    })

    // Update longest streak if needed
    if (streak.currentStreak > streak.longestStreak) {
      await db.attendanceStreak.update({
        where: { studentId },
        data: { longestStreak: streak.currentStreak },
      })
    }

    // Calculate points
    let totalPoints = 0
    const rewards: { reason: string; points: number }[] = []

    // Base points for attendance
    if (status === "PRESENT") {
      totalPoints += POINT_VALUES.DAILY_PRESENT
      rewards.push({
        reason: "DAILY_PRESENT",
        points: POINT_VALUES.DAILY_PRESENT,
      })

      // Bonus for on-time
      totalPoints += POINT_VALUES.DAILY_ON_TIME
      rewards.push({
        reason: "DAILY_ON_TIME",
        points: POINT_VALUES.DAILY_ON_TIME,
      })
    } else if (status === "LATE") {
      totalPoints += POINT_VALUES.DAILY_LATE
      rewards.push({ reason: "DAILY_PRESENT", points: POINT_VALUES.DAILY_LATE })
    }

    // Streak bonuses
    const streakBonus = getStreakBonus(streak.currentStreak + 1)
    const previousStreakBonus = getStreakBonus(streak.currentStreak)

    if (streakBonus > previousStreakBonus) {
      const bonusPoints = streakBonus - previousStreakBonus
      totalPoints += bonusPoints

      const reason =
        streak.currentStreak + 1 >= 10 ? "BIWEEKLY_STREAK" : "WEEKLY_STREAK"
      rewards.push({ reason, points: bonusPoints })
    }

    // Create reward records
    for (const reward of rewards) {
      await db.attendanceReward.create({
        data: {
          schoolId,
          studentId,
          points: reward.points,
          reason: reward.reason as
            | "DAILY_PRESENT"
            | "DAILY_ON_TIME"
            | "WEEKLY_STREAK"
            | "BIWEEKLY_STREAK",
          attendanceId,
        },
      })
    }

    // Check for badge qualifications
    const updatedStreak = await db.attendanceStreak.findUnique({
      where: { studentId },
    })

    if (updatedStreak) {
      const stats = {
        currentStreak: updatedStreak.currentStreak,
        longestStreak: updatedStreak.longestStreak,
        monthlyPresent: updatedStreak.monthlyPresent,
        monthlyLate: updatedStreak.monthlyLate,
        monthlyAbsent: updatedStreak.monthlyAbsent,
      }

      // Check each badge
      for (const [code, _badge] of Object.entries(BADGE_DEFINITIONS)) {
        if (checkBadgeQualification(code as BadgeCode, stats)) {
          // Check if already has this badge for current period
          const weekStart = new Date()
          weekStart.setDate(weekStart.getDate() - weekStart.getDay())
          weekStart.setHours(0, 0, 0, 0)

          const existingBadge = await db.studentBadge.findFirst({
            where: {
              studentId,
              badge: { code },
              periodStart: { gte: weekStart },
            },
          })

          if (!existingBadge) {
            await awardBadge({
              studentId,
              badgeCode: code,
              periodStart: weekStart,
              periodEnd: new Date(),
            })
          }
        }
      }
    }

    return {
      success: true,
      data: {
        points: totalPoints,
        currentStreak: streak.currentStreak + 1,
        rewards,
      },
    }
  } catch (error) {
    console.error("Error processing attendance points:", error)
    return { success: false, error: "Failed to process attendance points" }
  }
}

/**
 * Award a badge to a student
 */
export async function awardBadge(
  input: AwardBadgeInput
): Promise<ActionResult> {
  const session = await auth()
  const schoolId = session?.user?.schoolId
  const userId = session?.user?.id

  if (!schoolId) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const validated = awardBadgeSchema.parse(input)

    // Get or create badge template
    let badge = await db.attendanceBadge.findFirst({
      where: { schoolId, code: validated.badgeCode },
    })

    if (!badge) {
      const definition = BADGE_DEFINITIONS[validated.badgeCode as BadgeCode]
      if (!definition) {
        return { success: false, error: "Invalid badge code" }
      }

      badge = await db.attendanceBadge.create({
        data: {
          schoolId,
          code: definition.code,
          name: definition.name.en,
          description: definition.description.en,
          lang: "en",
          icon: definition.icon,
          color: definition.color,
          pointValue: definition.pointValue,
          criteria: definition.criteria,
        },
      })
    }

    // Award badge to student
    const studentBadge = await db.studentBadge.create({
      data: {
        schoolId,
        studentId: validated.studentId,
        badgeId: badge.id,
        awardedBy: userId,
        periodStart: validated.periodStart,
        periodEnd: validated.periodEnd,
        metadata: validated.metadata
          ? JSON.parse(JSON.stringify(validated.metadata))
          : undefined,
      },
    })

    // Award bonus points for earning badge
    if (badge.pointValue > 0) {
      await db.attendanceReward.create({
        data: {
          schoolId,
          studentId: validated.studentId,
          points: badge.pointValue,
          reason: "BADGE_EARNED",
          description: `Earned badge: ${badge.name}`,
          badgeId: badge.id,
        },
      })
    }

    revalidatePath("/attendance/gamification")

    return { success: true, data: studentBadge }
  } catch (error) {
    console.error("Error awarding badge:", error)
    return { success: false, error: "Failed to award badge" }
  }
}

/**
 * Get student leaderboard
 */
export async function getLeaderboard(
  limit: number = 10
): Promise<ActionResult> {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    // Get students with their total points
    const students = await db.student.findMany({
      where: { schoolId, status: "ACTIVE" },
      select: {
        id: true,
        givenName: true,
        surname: true,
        profilePhotoUrl: true,
        attendanceRewards: {
          select: { points: true },
        },
        attendanceStreak: {
          select: { currentStreak: true, longestStreak: true },
        },
        studentBadges: {
          include: {
            badge: {
              select: { code: true, name: true, icon: true, color: true },
            },
          },
          orderBy: { awardedAt: "desc" },
          take: 5,
        },
      },
    })

    // Calculate total points and sort
    const leaderboard: LeaderboardEntry[] = students
      .map((student) => ({
        studentId: student.id,
        studentName: `${student.givenName} ${student.surname}`,
        profilePhotoUrl: student.profilePhotoUrl,
        points: student.attendanceRewards.reduce((sum, r) => sum + r.points, 0),
        currentStreak: student.attendanceStreak?.currentStreak || 0,
        longestStreak: student.attendanceStreak?.longestStreak || 0,
        badges: student.studentBadges.map((sb) => ({
          code: sb.badge.code,
          name: sb.badge.name,
          icon: sb.badge.icon,
          color: sb.badge.color,
        })),
        rank: 0,
      }))
      .sort((a, b) => b.points - a.points)
      .slice(0, limit)
      .map((entry, index) => ({ ...entry, rank: index + 1 }))

    return { success: true, data: leaderboard }
  } catch (error) {
    console.error("Error getting leaderboard:", error)
    return { success: false, error: "Failed to get leaderboard" }
  }
}

/**
 * Get student gamification stats
 */
export async function getStudentGamificationStats(
  studentId: string
): Promise<ActionResult> {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const [rewards, streak, badges] = await Promise.all([
      db.attendanceReward.findMany({
        where: { schoolId, studentId },
        orderBy: { awardedAt: "desc" },
        take: 20,
      }),
      db.attendanceStreak.findUnique({
        where: { studentId },
      }),
      db.studentBadge.findMany({
        where: { schoolId, studentId },
        include: {
          badge: true,
        },
        orderBy: { awardedAt: "desc" },
      }),
    ])

    const totalPoints = rewards.reduce((sum, r) => sum + r.points, 0)

    // Get rank
    const allStudentPoints = await db.attendanceReward.groupBy({
      by: ["studentId"],
      where: { schoolId },
      _sum: { points: true },
      orderBy: { _sum: { points: "desc" } },
    })

    const rank =
      allStudentPoints.findIndex((s) => s.studentId === studentId) + 1

    return {
      success: true,
      data: {
        totalPoints,
        rank,
        totalStudents: allStudentPoints.length,
        currentStreak: streak?.currentStreak || 0,
        longestStreak: streak?.longestStreak || 0,
        monthlyPresent: streak?.monthlyPresent || 0,
        monthlyLate: streak?.monthlyLate || 0,
        monthlyAbsent: streak?.monthlyAbsent || 0,
        badges: badges.map((b) => ({
          id: b.id,
          code: b.badge.code,
          name: b.badge.name,
          lang: b.badge.lang,
          icon: b.badge.icon,
          color: b.badge.color,
          awardedAt: b.awardedAt,
        })),
        recentRewards: rewards.slice(0, 10).map((r) => ({
          id: r.id,
          points: r.points,
          reason: r.reason,
          description: r.description,
          awardedAt: r.awardedAt,
        })),
      },
    }
  } catch (error) {
    console.error("Error getting student stats:", error)
    return { success: false, error: "Failed to get student stats" }
  }
}

/**
 * Create an attendance competition
 */
export async function createCompetition(
  input: CreateCompetitionInput
): Promise<ActionResult> {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const validated = createCompetitionSchema.parse(input)

    // Create competition
    const competition = await db.attendanceCompetition.create({
      data: {
        schoolId,
        name: validated.name,
        lang: "ar",
        description: validated.description,
        startDate: validated.startDate,
        endDate: validated.endDate,
        winnerReward: validated.winnerReward,
        participantPoints: validated.participantPoints,
        winnerPoints: validated.winnerPoints,
      },
    })

    // Create entries for each class
    for (const classId of validated.classIds) {
      // Get student count for the class
      const studentCount = await db.studentClass.count({
        where: { schoolId, classId },
      })

      await db.classCompetitionEntry.create({
        data: {
          schoolId,
          competitionId: competition.id,
          classId,
          totalStudents: studentCount,
        },
      })
    }

    revalidatePath("/attendance/gamification")

    return { success: true, data: competition }
  } catch (error) {
    console.error("Error creating competition:", error)
    return { success: false, error: "Failed to create competition" }
  }
}

/**
 * Get active competitions
 */
export async function getActiveCompetitions(): Promise<ActionResult> {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const now = new Date()

    const competitions = await db.attendanceCompetition.findMany({
      where: {
        schoolId,
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        entries: {
          include: {
            class: {
              select: { id: true, name: true, lang: true },
            },
          },
          orderBy: { attendanceRate: "desc" },
        },
      },
    })

    return {
      success: true,
      data: competitions.map((c) => ({
        id: c.id,
        name: c.name,
        lang: c.lang,
        description: c.description,
        startDate: c.startDate,
        endDate: c.endDate,
        winnerReward: c.winnerReward,
        entries: c.entries.map((e, index) => ({
          rank: index + 1,
          classId: e.classId,
          className: e.class.name,
          classLang: e.class.lang,
          attendanceRate: e.attendanceRate,
          totalStudents: e.totalStudents,
          presentDays: e.presentDays,
          absentDays: e.absentDays,
        })),
      })),
    }
  } catch (error) {
    console.error("Error getting competitions:", error)
    return { success: false, error: "Failed to get competitions" }
  }
}

/**
 * Update competition standings (should be run daily)
 */
export async function updateCompetitionStandings(
  competitionId: string
): Promise<ActionResult> {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const competition = await db.attendanceCompetition.findFirst({
      where: { id: competitionId, schoolId },
      include: { entries: true },
    })

    if (!competition) {
      return { success: false, error: "Competition not found" }
    }

    // Update each class's stats
    for (const entry of competition.entries) {
      const attendances = await db.attendance.findMany({
        where: {
          schoolId,
          classId: entry.classId,
          date: {
            gte: competition.startDate,
            lte: competition.endDate,
          },
          deletedAt: null,
        },
        select: { status: true },
      })

      const presentDays = attendances.filter(
        (a) => a.status === "PRESENT" || a.status === "LATE"
      ).length
      const absentDays = attendances.filter((a) => a.status === "ABSENT").length
      const totalDays = attendances.length

      const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0

      await db.classCompetitionEntry.update({
        where: { id: entry.id },
        data: {
          presentDays,
          absentDays,
          attendanceRate,
        },
      })
    }

    // Update ranks
    const updatedEntries = await db.classCompetitionEntry.findMany({
      where: { competitionId },
      orderBy: { attendanceRate: "desc" },
    })

    for (let i = 0; i < updatedEntries.length; i++) {
      await db.classCompetitionEntry.update({
        where: { id: updatedEntries[i].id },
        data: { rank: i + 1 },
      })
    }

    revalidatePath("/attendance/gamification")

    return { success: true }
  } catch (error) {
    console.error("Error updating competition standings:", error)
    return { success: false, error: "Failed to update standings" }
  }
}

/**
 * Initialize default badges for school
 */
export async function initializeDefaultBadges(): Promise<ActionResult> {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const badges = Object.entries(BADGE_DEFINITIONS).map(([_code, def]) => ({
      schoolId,
      code: def.code,
      name: def.name.en,
      description: def.description.en,
      lang: "en",
      icon: def.icon,
      color: def.color,
      pointValue: def.pointValue,
      criteria: def.criteria,
    }))

    // Use createMany with skipDuplicates
    await db.attendanceBadge.createMany({
      data: badges,
      skipDuplicates: true,
    })

    return { success: true }
  } catch (error) {
    console.error("Error initializing badges:", error)
    return { success: false, error: "Failed to initialize badges" }
  }
}
