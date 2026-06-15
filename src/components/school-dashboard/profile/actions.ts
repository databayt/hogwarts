"use server"

import { revalidatePath, unstable_cache } from "next/cache"
import { auth } from "@/auth"
import type { Prisma } from "@prisma/client"
import { z } from "zod"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { recomputeProfileBadges } from "./badges"
import type {
  ActivityType,
  ContributionDataPoint,
  ContributionGraphData,
  ContributionSummary,
  GetContributionDataParams,
  GetContributionDataResult,
  ProfileRole,
} from "./types"
import { ACTIVITY_LABELS } from "./types"
import { pinnedItemSchema, updateGitHubProfileSchema } from "./validation"

/**
 * Map UserRole to ProfileRole. null for roles that have no profile view.
 */
function mapUserRoleToProfileRole(role: string): ProfileRole | null {
  switch (role) {
    case "STUDENT":
      return "student"
    case "TEACHER":
      return "teacher"
    case "GUARDIAN":
      return "parent"
    case "STAFF":
    case "ADMIN":
    case "ACCOUNTANT":
      return "staff"
    default:
      return null
  }
}

// ============================================================================
// Profile Update Actions
// ============================================================================

export async function updateGitHubProfile(
  input: z.infer<typeof updateGitHubProfileSchema>
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const parsed = updateGitHubProfileSchema.parse(input)

    await db.user.update({
      where: { id: session.user.id },
      data: {
        ...(parsed.displayName !== undefined && {
          username: parsed.displayName,
        }),
        bio: parsed.bio || null,
        website: parsed.website || null,
        timezone: parsed.timezone || null,
        statusEmoji: parsed.statusEmoji || null,
        statusMessage: parsed.statusMessage || null,
        pronouns: parsed.pronouns || null,
        socialLinks: (parsed.socialLinks as Prisma.InputJsonValue) ?? undefined,
      },
    })

    revalidatePath("/profile")
    revalidatePath("/[lang]/s/[subdomain]/(school-dashboard)/profile", "page")
    return { success: true as const }
  } catch (error) {
    console.error("Error updating GitHub profile:", error)
    if (error instanceof z.ZodError) {
      return actionError(ACTION_ERRORS.VALIDATION_ERROR)
    }
    return actionError(ACTION_ERRORS.UPDATE_FAILED)
  }
}

const AVATAR_MAX_BYTES = 5 * 1024 * 1024
const AVATAR_ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
])

export async function uploadProfileAvatar(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const raw = formData.get("avatar")
    if (!(raw instanceof File) || raw.size === 0) {
      return actionError(ACTION_ERRORS.VALIDATION_ERROR)
    }

    if (!AVATAR_ALLOWED_MIME.has(raw.type)) {
      return actionError(ACTION_ERRORS.INVALID_FILE_TYPE)
    }

    if (raw.size > AVATAR_MAX_BYTES) {
      return actionError(ACTION_ERRORS.UPLOAD_FAILED, "FILE_TOO_LARGE")
    }

    // Hand off to the shared file/upload pipeline (auth + tenant + S3 + DB).
    // Imported lazily so that test mocks and tree-shaking are unaffected.
    const { uploadFile } = await import("@/components/file/upload/actions")

    const fd = new FormData()
    fd.append("file", raw)
    const result = await uploadFile(fd, {
      category: "image",
      type: "avatar",
      access: "public",
    })

    if (!result.success || !result.url) {
      return actionError(ACTION_ERRORS.UPLOAD_FAILED)
    }

    const url = result.url

    // Update the User.image AND the role entity's profilePhotoUrl, since the
    // profile views prefer the role entity's photo over User.image. Without
    // this the uploaded avatar would not appear for students/teachers/staff.
    const user = await db.user.update({
      where: { id: session.user.id },
      data: { image: url },
      select: {
        student: { select: { id: true } },
        teacher: { select: { id: true } },
        staffMember: { select: { id: true } },
      },
    })

    if (user.student) {
      await db.student.update({
        where: { id: user.student.id },
        data: { profilePhotoUrl: url },
      })
    } else if (user.teacher) {
      await db.teacher.update({
        where: { id: user.teacher.id },
        data: { profilePhotoUrl: url },
      })
    } else if (user.staffMember) {
      await db.staffMember.update({
        where: { id: user.staffMember.id },
        data: { profilePhotoUrl: url },
      })
    }

    revalidatePath("/profile")
    revalidatePath("/[lang]/s/[subdomain]/(school-dashboard)/profile", "page")
    return { success: true as const, data: { url } }
  } catch (error) {
    console.error("Error uploading avatar:", error)
    return actionError(ACTION_ERRORS.UPLOAD_FAILED)
  }
}

// ============================================================================
// Pinned Items Actions
// ============================================================================

export async function getPinnedItems(userId?: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    const targetUserId = userId || session.user.id

    const pinnedItems = await db.pinnedItem.findMany({
      where: {
        schoolId,
        userId: targetUserId,
        // Only show public items when viewing someone else's profile
        ...(targetUserId !== session.user.id && { isPublic: true }),
      },
      orderBy: { order: "asc" },
    })

    return { success: true as const, data: pinnedItems }
  } catch (error) {
    console.error("Error fetching pinned items:", error)
    return actionError(ACTION_ERRORS.SAVE_FAILED)
  }
}

export async function updatePinnedItems(
  items: z.infer<typeof pinnedItemSchema>[]
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    // Max 6 pinned items
    if (items.length > 6) {
      return actionError(ACTION_ERRORS.VALIDATION_ERROR, "MAX_PINNED_EXCEEDED")
    }

    const parsedItems = items.map((item) => pinnedItemSchema.parse(item))

    // Replace the user's own pinned set (scoped to self — a user can only edit
    // their own pins).
    await db.$transaction([
      db.pinnedItem.deleteMany({
        where: { schoolId, userId: session.user.id },
      }),
      db.pinnedItem.createMany({
        data: parsedItems.map((item, index) => ({
          schoolId,
          userId: session.user.id,
          itemType: item.itemType,
          itemId: item.itemId,
          title: item.title,
          description: item.description ?? undefined,
          metadata: (item.metadata as Prisma.InputJsonValue) ?? undefined,
          isPublic: item.isPublic,
          order: index,
        })),
      }),
    ])

    revalidatePath("/profile")
    revalidatePath("/[lang]/s/[subdomain]/(school-dashboard)/profile", "page")
    return { success: true as const }
  } catch (error) {
    console.error("Error updating pinned items:", error)
    if (error instanceof z.ZodError) {
      return actionError(ACTION_ERRORS.VALIDATION_ERROR)
    }
    return actionError(ACTION_ERRORS.UPDATE_FAILED)
  }
}

// ============================================================================
// Contribution Graph
// ============================================================================

// Use UTC throughout the contribution map so the boundaries are stable
// regardless of the server's local timezone (Vercel runs UTC, but devs
// in MENA / Asia were getting Dec 31 -> Jan 1 drift).
function getYearDateRange(year: number): { startDate: Date; endDate: Date } {
  const startDate = new Date(Date.UTC(year, 0, 1))
  const endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999))
  return { startDate, endDate }
}

function formatDateKey(date: Date): string {
  return date.toISOString().split("T")[0]
}

function initializeContributionMap(
  startDate: Date,
  endDate: Date
): Map<string, ContributionDataPoint> {
  const map = new Map<string, ContributionDataPoint>()
  const current = new Date(startDate)

  while (current <= endDate) {
    const dateKey = formatDateKey(current)
    map.set(dateKey, {
      date: dateKey,
      count: 0,
      level: 0,
      activities: [],
    })
    current.setUTCDate(current.getUTCDate() + 1)
  }

  return map
}

function addActivity(
  map: Map<string, ContributionDataPoint>,
  date: Date,
  type: ActivityType,
  count: number = 1
): void {
  const dateKey = formatDateKey(date)
  const day = map.get(dateKey)
  if (!day) return

  day.count += count

  const existing = day.activities.find((a) => a.type === type)
  if (existing) {
    existing.count += count
  } else {
    day.activities.push({
      type,
      count,
      label: ACTIVITY_LABELS[type],
    })
  }
}

function calculateIntensityLevels(
  map: Map<string, ContributionDataPoint>
): void {
  const counts = Array.from(map.values())
    .map((c) => c.count)
    .filter((c) => c > 0)
    .sort((a, b) => a - b)

  if (counts.length === 0) return

  const p25 = counts[Math.floor(counts.length * 0.25)] || 1
  const p50 = counts[Math.floor(counts.length * 0.5)] || 2
  const p75 = counts[Math.floor(counts.length * 0.75)] || 4

  for (const day of map.values()) {
    if (day.count === 0) {
      day.level = 0
    } else if (day.count <= p25) {
      day.level = 1
    } else if (day.count <= p50) {
      day.level = 2
    } else if (day.count <= p75) {
      day.level = 3
    } else {
      day.level = 4
    }
  }
}

function calculateSummary(
  contributions: ContributionDataPoint[]
): ContributionSummary {
  const activeDays = contributions.filter((c) => c.count > 0).length
  const totalDays = contributions.length

  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 0

  const sorted = [...contributions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  for (const day of sorted) {
    if (day.count > 0) {
      currentStreak++
    } else {
      break
    }
  }

  for (const day of contributions) {
    if (day.count > 0) {
      tempStreak++
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak
      }
    } else {
      tempStreak = 0
    }
  }

  const totalActivities = contributions.reduce((sum, c) => sum + c.count, 0)
  const averagePerDay = totalDays > 0 ? totalActivities / totalDays : 0

  const peakDay = contributions.reduce(
    (max, c) => (c.count > (max?.count || 0) ? c : max),
    null as ContributionDataPoint | null
  )

  return {
    activeDays,
    longestStreak,
    currentStreak,
    averagePerDay: Math.round(averagePerDay * 100) / 100,
    peakDay: peakDay ? { date: peakDay.date, count: peakDay.count } : null,
  }
}

async function fetchStudentActivities(
  studentUserId: string,
  schoolId: string,
  startDate: Date,
  endDate: Date,
  map: Map<string, ContributionDataPoint>
): Promise<void> {
  const student = await db.student.findFirst({
    where: { userId: studentUserId, schoolId },
    select: { id: true },
  })

  if (!student) return

  const [attendance, submissions, results, borrowRecords] = await Promise.all([
    db.attendance.findMany({
      where: {
        schoolId,
        studentId: student.id,
        date: { gte: startDate, lte: endDate },
        status: { in: ["PRESENT", "LATE"] },
      },
      select: { date: true },
    }),
    db.assignmentSubmission.findMany({
      where: {
        schoolId,
        studentId: student.id,
        submittedAt: { gte: startDate, lte: endDate },
        status: { in: ["SUBMITTED", "LATE_SUBMITTED", "GRADED"] },
      },
      select: { submittedAt: true },
    }),
    db.result.findMany({
      where: {
        schoolId,
        studentId: student.id,
        gradedAt: { gte: startDate, lte: endDate },
      },
      select: { gradedAt: true },
    }),
    db.borrowRecord.findMany({
      where: {
        schoolId,
        userId: studentUserId,
        borrowDate: { gte: startDate, lte: endDate },
      },
      select: { borrowDate: true },
    }),
  ])

  attendance.forEach((a) => addActivity(map, a.date, "attendance"))
  submissions.forEach((s) => {
    if (s.submittedAt) addActivity(map, s.submittedAt, "assignment_submitted")
  })
  results.forEach((r) => {
    if (r.gradedAt) addActivity(map, r.gradedAt, "exam_completed")
  })
  borrowRecords.forEach((b) => addActivity(map, b.borrowDate, "library_visit"))
}

async function fetchTeacherActivities(
  teacherUserId: string,
  schoolId: string,
  startDate: Date,
  endDate: Date,
  map: Map<string, ContributionDataPoint>
): Promise<void> {
  const teacher = await db.teacher.findFirst({
    where: { userId: teacherUserId, schoolId },
    select: { id: true },
  })

  if (!teacher) return

  const [attendanceMarked, gradesPublished] = await Promise.all([
    db.attendance.findMany({
      where: {
        schoolId,
        markedBy: teacher.id,
        markedAt: { gte: startDate, lte: endDate },
      },
      select: { markedAt: true },
    }),
    db.result.findMany({
      where: {
        schoolId,
        gradedBy: teacher.id,
        gradedAt: { gte: startDate, lte: endDate },
      },
      select: { gradedAt: true },
    }),
  ])

  attendanceMarked.forEach((a: { markedAt: Date | null }) => {
    if (a.markedAt) addActivity(map, a.markedAt, "attendance_taken")
  })
  gradesPublished.forEach((g: { gradedAt: Date | null }) => {
    if (g.gradedAt) addActivity(map, g.gradedAt, "grade_published")
  })
}

async function fetchParentActivities(
  guardianUserId: string,
  schoolId: string,
  startDate: Date,
  endDate: Date,
  map: Map<string, ContributionDataPoint>
): Promise<void> {
  // NOTE: payments are not yet attributable to a guardian user (the Payment
  // model has no payer-user FK), so they are intentionally omitted here rather
  // than fetched unscoped. Re-add once Payment gains a paidByUserId field.
  const messages = await db.message
    .findMany({
      where: {
        senderId: guardianUserId,
        createdAt: { gte: startDate, lte: endDate },
      },
      select: { createdAt: true },
    })
    .catch(() => [])

  messages.forEach((m) => addActivity(map, m.createdAt, "message_sent"))
}

async function fetchStaffActivities(
  staffUserId: string,
  schoolId: string,
  startDate: Date,
  endDate: Date,
  map: Map<string, ContributionDataPoint>
): Promise<void> {
  // Surface real staff signals: expenses they approved and any logged
  // UserActivity rows. (timesheetEntry.teacherId expects a Teacher id, not a
  // User id, so it is omitted to avoid a silent always-empty query.)
  const expenses = await db.expense
    .findMany({
      where: {
        schoolId,
        approvedBy: staffUserId,
        approvedAt: { gte: startDate, lte: endDate },
      },
      select: { approvedAt: true },
    })
    .catch(() => [])

  expenses.forEach((e) => {
    if (e.approvedAt) addActivity(map, e.approvedAt, "task_completed")
  })
}

const getCachedContributionData = unstable_cache(
  async (
    userId: string,
    schoolId: string,
    year: number,
    role: ProfileRole
  ): Promise<ContributionGraphData> => {
    const { startDate, endDate } = getYearDateRange(year)
    const map = initializeContributionMap(startDate, endDate)

    switch (role) {
      case "student":
        await fetchStudentActivities(userId, schoolId, startDate, endDate, map)
        break
      case "teacher":
        await fetchTeacherActivities(userId, schoolId, startDate, endDate, map)
        break
      case "parent":
        await fetchParentActivities(userId, schoolId, startDate, endDate, map)
        break
      case "staff":
        await fetchStaffActivities(userId, schoolId, startDate, endDate, map)
        break
    }

    calculateIntensityLevels(map)

    const contributions = Array.from(map.values())
    const totalActivities = contributions.reduce((sum, c) => sum + c.count, 0)
    const summary = calculateSummary(contributions)

    return {
      contributions,
      totalActivities,
      year,
      role,
      summary,
    }
  },
  ["contribution-data"],
  {
    revalidate: 300,
    tags: ["contribution-data"],
  }
)

export async function getContributionData(
  params: GetContributionDataParams = {}
): Promise<GetContributionDataResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    const userId = params.userId || session.user.id
    const year = params.year || new Date().getFullYear()

    if (year < 2020 || year > new Date().getFullYear() + 1) {
      return actionError(ACTION_ERRORS.VALIDATION_ERROR)
    }

    // Scope the role lookup by schoolId — prevents cross-tenant user-existence /
    // role enumeration via an arbitrary userId.
    const user = await db.user.findFirst({
      where: { id: userId, schoolId },
      select: { role: true },
    })

    if (!user) {
      return actionError(ACTION_ERRORS.NOT_FOUND)
    }

    const role = mapUserRoleToProfileRole(user.role)
    if (!role) {
      return actionError(ACTION_ERRORS.UNKNOWN)
    }

    const data = await getCachedContributionData(userId, schoolId, year, role)

    return { success: true, data }
  } catch (error) {
    console.error("Error fetching contribution data:", error)
    return actionError(ACTION_ERRORS.SAVE_FAILED)
  }
}

// ============================================================================
// Recent Activity
// ============================================================================

export async function getRecentActivity(userId?: string, limit = 20) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    const targetUserId = userId || session.user.id

    // AUTHZ: only the owner or a privileged role may read another user's
    // activity feed. Without this, any student could read a teacher's feed.
    if (targetUserId !== session.user.id) {
      const viewerRole = (session.user.role as string) ?? ""
      if (!["ADMIN", "DEVELOPER", "STAFF"].includes(viewerRole)) {
        return actionError(ACTION_ERRORS.UNAUTHORIZED)
      }
    }

    const activities = await db.userActivity.findMany({
      where: {
        schoolId,
        userId: targetUserId,
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(Math.max(limit, 1), 50),
    })

    return { success: true as const, data: activities }
  } catch (error) {
    console.error("Error fetching recent activity:", error)
    return actionError(ACTION_ERRORS.SAVE_FAILED)
  }
}

// ============================================================================
// Log User Activity (for contribution tracking)
// ============================================================================

export async function logUserActivity(input: {
  activityType:
    | "ASSIGNMENT_SUBMITTED"
    | "ATTENDANCE_MARKED"
    | "ACHIEVEMENT_EARNED"
    | "EXAM_COMPLETED"
    | "COURSE_ENROLLED"
    | "COURSE_COMPLETED"
    | "LIBRARY_CHECKOUT"
    | "LIBRARY_RETURN"
    | "EVENT_ATTENDED"
    | "CLUB_JOINED"
    | "PROJECT_CREATED"
    | "PROJECT_UPDATED"
    | "GRADE_RECEIVED"
    | "CERTIFICATE_EARNED"
    | "PROFILE_UPDATED"
    | "OTHER"
  title: string
  description?: string
  metadata?: Record<string, unknown>
}) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    await db.userActivity.create({
      data: {
        schoolId,
        userId: session.user.id,
        activityType: input.activityType,
        title: input.title,
        description: input.description ?? undefined,
        metadata: (input.metadata as Prisma.InputJsonValue) ?? undefined,
      },
    })

    return { success: true as const }
  } catch (error) {
    console.error("Error logging activity:", error)
    return actionError(ACTION_ERRORS.SAVE_FAILED)
  }
}

// ============================================================================
// Badge recompute (self-heal / manual refresh)
// ============================================================================

/**
 * Recompute the calling user's earned badges from real signals. Idempotent.
 * Returns the number of badges currently held.
 */
export async function recomputeMyBadges() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    const role = mapUserRoleToProfileRole((session.user.role as string) ?? "")
    if (!role) {
      return actionError(ACTION_ERRORS.UNKNOWN)
    }

    const { awarded } = await recomputeProfileBadges(
      session.user.id,
      schoolId,
      role
    )

    revalidatePath("/[lang]/s/[subdomain]/(school-dashboard)/profile", "page")
    return { success: true as const, data: { awarded } }
  } catch (error) {
    console.error("Error recomputing badges:", error)
    return actionError(ACTION_ERRORS.SAVE_FAILED)
  }
}
