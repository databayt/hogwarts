/**
 * Gamification Validation Schemas & Types
 *
 * Point values, badge definitions, and gamification rules.
 */
import { z } from "zod"

// Point values for different attendance actions
export const POINT_VALUES = {
  DAILY_PRESENT: 10,
  DAILY_ON_TIME: 5, // Bonus for not being late
  DAILY_LATE: 5, // Reduced points for late arrival
  WEEKLY_STREAK: 50, // 5-day streak bonus
  BIWEEKLY_STREAK: 100, // 10-day streak bonus
  MONTHLY_PERFECT: 200, // Perfect month bonus
  COMPETITION_WIN: 100, // Class competition winner
  IMPROVEMENT: 25, // Attendance improvement bonus
} as const

// Badge definitions
export const BADGE_DEFINITIONS = {
  PERFECT_WEEK: {
    code: "PERFECT_WEEK",
    name: { en: "Perfect Week", ar: "أسبوع مثالي" },
    description: {
      en: "5 consecutive days of on-time attendance",
      ar: "5 أيام متتالية من الحضور في الوقت المحدد",
    },
    icon: "calendar-check",
    color: "#10B981",
    pointValue: 50,
    criteria: { streakDays: 5, requireOnTime: true },
  },
  PERFECT_MONTH: {
    code: "PERFECT_MONTH",
    name: { en: "Perfect Month", ar: "شهر مثالي" },
    description: {
      en: "100% attendance for the entire month",
      ar: "حضور 100% طوال الشهر",
    },
    icon: "trophy",
    color: "#F59E0B",
    pointValue: 200,
    criteria: { monthlyPerfect: true },
  },
  EARLY_BIRD: {
    code: "EARLY_BIRD",
    name: { en: "Early Bird", ar: "الطائر المبكر" },
    description: {
      en: "Arrived on time for 20 consecutive days",
      ar: "وصل في الوقت المحدد لـ 20 يوماً متتالياً",
    },
    icon: "sunrise",
    color: "#8B5CF6",
    pointValue: 100,
    criteria: { streakDays: 20, requireOnTime: true },
  },
  COMEBACK_KID: {
    code: "COMEBACK_KID",
    name: { en: "Comeback Kid", ar: "العودة القوية" },
    description: {
      en: "Improved attendance by 15% or more",
      ar: "تحسين الحضور بنسبة 15% أو أكثر",
    },
    icon: "trending-up",
    color: "#EC4899",
    pointValue: 75,
    criteria: { improvementPercent: 15 },
  },
  ATTENDANCE_CHAMPION: {
    code: "ATTENDANCE_CHAMPION",
    name: { en: "Attendance Champion", ar: "بطل الحضور" },
    description: {
      en: "Top 3 in class leaderboard for the month",
      ar: "ضمن أفضل 3 في لوحة المتصدرين للشهر",
    },
    icon: "medal",
    color: "#EAB308",
    pointValue: 150,
    criteria: { topRank: 3 },
  },
  STREAK_MASTER: {
    code: "STREAK_MASTER",
    name: { en: "Streak Master", ar: "خبير السلاسل" },
    description: {
      en: "Maintained a 30-day attendance streak",
      ar: "حافظ على سلسلة حضور 30 يوماً",
    },
    icon: "flame",
    color: "#EF4444",
    pointValue: 300,
    criteria: { streakDays: 30 },
  },
  TEAM_PLAYER: {
    code: "TEAM_PLAYER",
    name: { en: "Team Player", ar: "لاعب الفريق" },
    description: {
      en: "Part of the winning class in a competition",
      ar: "جزء من الفصل الفائز في المسابقة",
    },
    icon: "users",
    color: "#3B82F6",
    pointValue: 100,
    criteria: { competitionWinner: true },
  },
} as const

export type BadgeCode = keyof typeof BADGE_DEFINITIONS

// Schemas for gamification actions
export const awardPointsSchema = z.object({
  studentId: z.string().min(1),
  points: z.number().int(),
  reason: z.enum([
    "DAILY_PRESENT",
    "DAILY_ON_TIME",
    "WEEKLY_STREAK",
    "BIWEEKLY_STREAK",
    "MONTHLY_PERFECT",
    "BADGE_EARNED",
    "COMPETITION_WIN",
    "IMPROVEMENT",
    "CUSTOM",
  ]),
  description: z.string().optional(),
  attendanceId: z.string().optional(),
  badgeId: z.string().optional(),
})

export type AwardPointsInput = z.infer<typeof awardPointsSchema>

export const createCompetitionSchema = z.object({
  name: z.string().min(1, "Competition name is required"),
  lang: z.string().default("ar"),
  description: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  classIds: z.array(z.string()).min(2, "At least 2 classes required"),
  winnerReward: z.string().optional(),
  participantPoints: z.number().int().min(0).default(0),
  winnerPoints: z.number().int().min(0).default(100),
})

export type CreateCompetitionInput = z.infer<typeof createCompetitionSchema>

export const awardBadgeSchema = z.object({
  studentId: z.string().min(1),
  badgeCode: z.string().min(1),
  periodStart: z.coerce.date().optional(),
  periodEnd: z.coerce.date().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export type AwardBadgeInput = z.infer<typeof awardBadgeSchema>

// Leaderboard types
export interface LeaderboardEntry {
  rank: number
  studentId: string
  studentName: string
  profilePhotoUrl: string | null
  points: number
  currentStreak: number
  longestStreak: number
  badges: {
    code: string
    name: string
    icon: string
    color: string
  }[]
}

export interface ClassLeaderboardEntry {
  rank: number
  classId: string
  className: string
  attendanceRate: number
  totalStudents: number
  presentDays: number
  absentDays: number
}

// Get badge info by code
export function getBadgeInfo(code: string) {
  return BADGE_DEFINITIONS[code as BadgeCode] || null
}

// Calculate streak bonus
export function getStreakBonus(streakDays: number): number {
  if (streakDays >= 30) return 300
  if (streakDays >= 20) return 150
  if (streakDays >= 10) return POINT_VALUES.BIWEEKLY_STREAK
  if (streakDays >= 5) return POINT_VALUES.WEEKLY_STREAK
  return 0
}

// Check if student qualifies for a badge
export function checkBadgeQualification(
  badgeCode: BadgeCode,
  stats: {
    currentStreak: number
    longestStreak: number
    monthlyPresent: number
    monthlyLate: number
    monthlyAbsent: number
    improvementPercent?: number
    competitionRank?: number
    isCompetitionWinner?: boolean
  }
): boolean {
  const badge = BADGE_DEFINITIONS[badgeCode]
  if (!badge) return false

  const criteria = badge.criteria

  if ("streakDays" in criteria) {
    const requiredStreak = criteria.streakDays
    if ("requireOnTime" in criteria && criteria.requireOnTime) {
      // Must have streak without any late days
      return stats.currentStreak >= requiredStreak && stats.monthlyLate === 0
    }
    return stats.currentStreak >= requiredStreak
  }

  if ("monthlyPerfect" in criteria) {
    return stats.monthlyAbsent === 0 && stats.monthlyLate === 0
  }

  if ("improvementPercent" in criteria) {
    return (stats.improvementPercent ?? 0) >= criteria.improvementPercent
  }

  if ("topRank" in criteria) {
    return (stats.competitionRank ?? 999) <= criteria.topRank
  }

  if ("competitionWinner" in criteria) {
    return stats.isCompetitionWinner === true
  }

  return false
}
