/**
 * Profile badge earning engine.
 *
 * Replaces the old hardcoded "Student of the Year" / "Best Football Player"
 * mock achievements in sidebar.tsx with badges DERIVED FROM REAL school signals
 * (attendance, exam results, merit rank, activity volume, organization
 * membership, and a student's own Achievement records).
 *
 * `recomputeProfileBadges` is idempotent: it computes the qualifying set and
 * reconciles the auto-managed ProfileBadge rows for the user (upserting earned
 * ones, removing ones no longer qualifying). Manually-awarded badges — any key
 * not in the auto-managed namespace — are never touched.
 *
 * NOT a "use server" module: it is a plain library called from the seed, a cron,
 * or the `recomputeMyBadges` server action in actions.ts.
 */
import type { Prisma, ProfileBadgeLevel } from "@prisma/client"

import { db } from "@/lib/db"

import type { ProfileRole } from "./types"

const ACHIEVEMENT_BADGE_PREFIX = "achievement_"

// Auto-managed catalog. `key` is stable; titles/descriptions are dictionary keys
// resolved at render time (stored here as the canonical English source so the
// translation cache can localize them). icon must match an illustration asset
// in /public/illustrations (starstruck, galaxy-brain, pull-shark, quickdraw,
// yolo, pair-extraordinaire, public-sponsor).
interface BadgeDef {
  key: string
  title: string
  description: string
  icon: string
  level: ProfileBadgeLevel
}

export const BADGE_CATALOG: Record<string, BadgeDef> = {
  community_member: {
    key: "community_member",
    title: "Community Member",
    description: "An active member of a school organization",
    icon: "pair-extraordinaire",
    level: "BRONZE",
  },
  active_contributor: {
    key: "active_contributor",
    title: "Active Contributor",
    description: "Consistently active across the school platform",
    icon: "pull-shark",
    level: "SILVER",
  },
  perfect_attendance: {
    key: "perfect_attendance",
    title: "Perfect Attendance",
    description: "Outstanding attendance record this year",
    icon: "quickdraw",
    level: "SILVER",
  },
  top_of_class: {
    key: "top_of_class",
    title: "First of Class",
    description: "Ranked first by merit",
    icon: "galaxy-brain",
    level: "GOLD",
  },
  honor_roll: {
    key: "honor_roll",
    title: "Honor Roll",
    description: "Ranked among the top of the cohort",
    icon: "starstruck",
    level: "GOLD",
  },
  diligent_educator: {
    key: "diligent_educator",
    title: "Diligent Educator",
    description: "Marked attendance and graded work consistently",
    icon: "pull-shark",
    level: "GOLD",
  },
}

const CATALOG_KEYS = new Set(Object.keys(BADGE_CATALOG))

function isAutoManaged(key: string): boolean {
  return CATALOG_KEYS.has(key) || key.startsWith(ACHIEVEMENT_BADGE_PREFIX)
}

const CATEGORY_ICON: Record<string, string> = {
  academic: "galaxy-brain",
  sports: "yolo",
  arts: "starstruck",
  cultural: "starstruck",
  leadership: "pair-extraordinaire",
  "community service": "public-sponsor",
}

function iconForCategory(category?: string | null): string {
  if (!category) return "starstruck"
  return CATEGORY_ICON[category.toLowerCase()] ?? "starstruck"
}

function levelForAchievement(level?: string | null): ProfileBadgeLevel {
  switch ((level ?? "").toLowerCase()) {
    case "international":
    case "national":
      return "PLATINUM"
    case "state":
    case "district":
      return "GOLD"
    case "school":
      return "SILVER"
    default:
      return "BRONZE"
  }
}

interface DesiredBadge {
  key: string
  title: string
  description: string | null
  icon: string
  level: ProfileBadgeLevel
  context: string | null
  earnedAt: Date
}

const CURRENT_YEAR_START = () =>
  new Date(Date.UTC(new Date().getUTCFullYear(), 0, 1))

/**
 * Recompute the auto-managed badge set for a user and reconcile the DB rows.
 * Tenant-scoped; safe to call repeatedly.
 */
export async function recomputeProfileBadges(
  userId: string,
  schoolId: string,
  role: ProfileRole,
  lang = "ar"
): Promise<{ awarded: number }> {
  const desired: DesiredBadge[] = []
  const now = new Date()
  const yearStart = CURRENT_YEAR_START()

  // Signal: organization membership
  const orgCount = await db.organizationMembership.count({
    where: { schoolId, userId },
  })
  if (orgCount > 0) {
    const d = BADGE_CATALOG.community_member
    desired.push({ ...d, context: null, earnedAt: now })
  }

  // Signal: platform activity volume
  const activityCount = await db.userActivity.count({
    where: { schoolId, userId, createdAt: { gte: yearStart } },
  })
  if (activityCount >= 20) {
    const d = BADGE_CATALOG.active_contributor
    desired.push({ ...d, context: null, earnedAt: now })
  }

  if (role === "student") {
    const student = await db.student.findFirst({
      where: { userId, schoolId },
      select: {
        id: true,
        application: { select: { meritRank: true } },
      },
    })
    if (student) {
      const [total, absent, achievements] = await Promise.all([
        db.attendance.count({
          where: { schoolId, studentId: student.id, date: { gte: yearStart } },
        }),
        db.attendance.count({
          where: {
            schoolId,
            studentId: student.id,
            date: { gte: yearStart },
            status: "ABSENT",
          },
        }),
        db.achievement.findMany({
          where: { schoolId, studentId: student.id },
          orderBy: { achievementDate: "desc" },
          take: 6,
          select: {
            id: true,
            title: true,
            description: true,
            category: true,
            level: true,
            achievementDate: true,
          },
        }),
      ])

      if (total >= 10 && absent === 0) {
        const d = BADGE_CATALOG.perfect_attendance
        desired.push({ ...d, context: null, earnedAt: now })
      }

      const rank = student.application?.meritRank ?? null
      if (rank === 1) {
        const d = BADGE_CATALOG.top_of_class
        desired.push({ ...d, context: null, earnedAt: now })
      } else if (rank !== null && rank <= 3) {
        const d = BADGE_CATALOG.honor_roll
        desired.push({ ...d, context: null, earnedAt: now })
      }

      for (const a of achievements) {
        desired.push({
          key: `${ACHIEVEMENT_BADGE_PREFIX}${a.id}`,
          title: a.title,
          description: a.description,
          icon: iconForCategory(a.category),
          level: levelForAchievement(a.level),
          context: a.category ?? null,
          earnedAt: a.achievementDate ?? now,
        })
      }
    }
  } else if (role === "teacher") {
    const teacher = await db.teacher.findFirst({
      where: { userId, schoolId },
      select: { id: true },
    })
    if (teacher) {
      const [marked, graded] = await Promise.all([
        db.attendance.count({
          where: {
            schoolId,
            markedBy: teacher.id,
            markedAt: { gte: yearStart },
          },
        }),
        db.result.count({
          where: {
            schoolId,
            gradedBy: teacher.id,
            gradedAt: { gte: yearStart },
          },
        }),
      ])
      if (marked >= 20 || graded >= 20) {
        const d = BADGE_CATALOG.diligent_educator
        desired.push({ ...d, context: null, earnedAt: now })
      }
      if (marked >= 20) {
        const d = BADGE_CATALOG.perfect_attendance
        desired.push({
          ...d,
          description: "Marked attendance reliably this year",
          context: null,
          earnedAt: now,
        })
      }
    }
  }

  // Reconcile: upsert desired, remove stale auto-managed badges.
  const existing = await db.profileBadge.findMany({
    where: { schoolId, userId },
    select: { key: true },
  })
  const desiredKeys = new Set(desired.map((d) => d.key))
  const staleKeys = existing
    .map((e) => e.key)
    .filter((k) => isAutoManaged(k) && !desiredKeys.has(k))

  await db.$transaction([
    ...(staleKeys.length
      ? [
          db.profileBadge.deleteMany({
            where: { schoolId, userId, key: { in: staleKeys } },
          }),
        ]
      : []),
    ...desired.map((d) =>
      db.profileBadge.upsert({
        where: { schoolId_userId_key: { schoolId, userId, key: d.key } },
        create: {
          schoolId,
          userId,
          key: d.key,
          title: d.title,
          description: d.description,
          icon: d.icon,
          level: d.level,
          context: d.context,
          earnedAt: d.earnedAt,
          isPublic: true,
          lang,
        },
        // Only refresh presentation fields; keep earnedAt/isPublic stable so an
        // admin's manual visibility toggle and the original earn date survive.
        update: {
          title: d.title,
          description: d.description,
          icon: d.icon,
          level: d.level,
          context: d.context,
        } satisfies Prisma.ProfileBadgeUpdateInput,
      })
    ),
  ])

  return { awarded: desired.length }
}
