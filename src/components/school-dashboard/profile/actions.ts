"use server"

import { revalidatePath, unstable_cache } from "next/cache"
import { auth } from "@/auth"
import type { Prisma } from "@prisma/client"
import { z } from "zod"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { getDisplayText } from "@/lib/content-display"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { getPermissionLevel } from "./detail/permissions"
import type { PermissionLevel, ProfileContext } from "./detail/types"
import type {
  ActivityType,
  ContributionDataPoint,
  ContributionGraphData,
  ContributionSummary,
  GetContributionDataParams,
  GetContributionDataResult,
  ProfileRole,
} from "./types"
import {
  logUserActivitySchema,
  pinnedItemSchema,
  updateBioSchema,
  updateGitHubProfileSchema,
  updateProfileSchema,
  updateSettingsSchema,
} from "./validation"

/**
 * Compute the viewer's permission level for a given profile.
 * Used by getProfileBasicData so the UI can mask sensitive fields
 * (emailAddress, employeeId, joiningDate) for non-owners and non-admins.
 *
 * The strict admin user-detail-page filter lives in detail/actions.ts.
 */
function computeViewerPermission(args: {
  viewerId: string | null
  viewerRole: string | null | undefined
  viewerSchoolId: string | null
  profileUserId: string
  profileSchoolId: string | null
}): PermissionLevel {
  const ctx: ProfileContext = {
    viewerId: args.viewerId,
    viewerRole: (args.viewerRole as ProfileContext["viewerRole"]) ?? null,
    viewerSchoolId: args.viewerSchoolId,
    profileUserId: args.profileUserId,
    profileSchoolId: args.profileSchoolId,
    profileType: "USER",
  }
  return getPermissionLevel(ctx)
}

// ============================================================================
// Profile Update Actions
// ============================================================================

export async function updateProfile(
  input: z.infer<typeof updateProfileSchema>
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const parsed = updateProfileSchema.parse(input)

    await db.user.update({
      where: { id: session.user.id },
      data: {
        username: parsed.displayName,
        image: parsed.avatarUrl || null,
      },
    })

    revalidatePath("/profile")
    return { success: true as const }
  } catch (error) {
    console.error("Error updating profile:", error)
    if (error instanceof z.ZodError) {
      return actionError(ACTION_ERRORS.VALIDATION_ERROR)
    }
    return actionError(ACTION_ERRORS.UPDATE_FAILED)
  }
}

export async function updateProfileBio(input: z.infer<typeof updateBioSchema>) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const parsed = updateBioSchema.parse(input)

    await db.user.update({
      where: { id: session.user.id },
      data: {
        bio: parsed.bio || null,
      },
    })

    revalidatePath("/profile")
    return { success: true as const }
  } catch (error) {
    console.error("Error updating bio:", error)
    if (error instanceof z.ZodError) {
      return actionError(ACTION_ERRORS.VALIDATION_ERROR)
    }
    return actionError(ACTION_ERRORS.UPDATE_FAILED)
  }
}

export async function updateProfileSettings(
  input: z.infer<typeof updateSettingsSchema>
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    updateSettingsSchema.parse(input)

    // The User schema does not yet have settings columns (theme, notification
    // prefs, allowMessages). Returning NOT_IMPLEMENTED so the UI can render a
    // proper translated message instead of a misleading success toast.
    return actionError(ACTION_ERRORS.NOT_IMPLEMENTED)
  } catch (error) {
    console.error("Error updating settings:", error)
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

    await db.user.update({
      where: { id: session.user.id },
      data: { image: result.url },
    })

    revalidatePath("/profile")
    return { success: true as const, data: { url: result.url } }
  } catch (error) {
    console.error("Error uploading avatar:", error)
    return actionError(ACTION_ERRORS.UPLOAD_FAILED)
  }
}

// ============================================================================
// Profile Basic Data (for GitHub-style profile sidebar)
// ============================================================================

export async function getProfileBasicData(userId: string, lang?: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    // Fetch user with role-specific relations
    const user = await db.user.findFirst({
      where: { id: userId, schoolId },
      select: {
        id: true,
        username: true,
        email: true,
        image: true,
        role: true,
        bio: true,
        website: true,
        timezone: true,
        pronouns: true,
        socialLinks: true,
        statusEmoji: true,
        statusMessage: true,
        createdAt: true,
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhotoUrl: true,
            grNumber: true,
            city: true,
            enrollmentDate: true,
            email: true,
            application: {
              select: {
                applicationNumber: true,
                campaignId: true,
                status: true,
                submittedAt: true,
                confirmationDate: true,
                meritRank: true,
                meritScore: true,
                campaign: { select: { name: true, academicYear: true } },
              },
            },
          },
        },
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhotoUrl: true,
            employeeId: true,
            emailAddress: true,
            joiningDate: true,
          },
        },
        guardian: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            emailAddress: true,
          },
        },
        staffMember: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhotoUrl: true,
            employeeId: true,
            emailAddress: true,
            joiningDate: true,
            city: true,
          },
        },
      },
    })

    if (!user) {
      // Fallback: try looking up as a student ID (students created via wizard may not have a User)
      const student = await db.student.findFirst({
        where: { id: userId, schoolId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profilePhotoUrl: true,
          grNumber: true,
          city: true,
          enrollmentDate: true,
          email: true,
          createdAt: true,
        },
      })
      if (student) {
        const data: Record<string, unknown> = {
          id: student.id,
          firstName: student.firstName || "",
          lastName: student.lastName || "",
          profilePhotoUrl: student.profilePhotoUrl || null,
          emailAddress: student.email || "",
          createdAt: student.createdAt.toISOString(),
          bio: null,
          grNumber: student.grNumber,
          city: student.city,
          enrollmentDate: student.enrollmentDate?.toISOString(),
          role: "STUDENT",
          viewerPermission: computeViewerPermission({
            viewerId: session.user.id,
            viewerRole: session.user.role,
            viewerSchoolId: session.user.schoolId ?? null,
            // Wizard-created students have no User row, so the viewer can
            // never be the "owner" — treat them as a peer/admin viewer.
            profileUserId: student.id,
            profileSchoolId: schoolId,
          }),
        }

        if (lang && lang !== "ar" && schoolId && data.firstName) {
          const translated = await getDisplayText(
            data.firstName as string,
            "ar",
            lang as "en",
            schoolId
          )
          if (translated) data.firstName = translated
        }

        return { success: true as const, data }
      }

      // Fallback: try looking up as a teacher ID (teachers created via wizard may not have a User)
      const teacher = await db.teacher.findFirst({
        where: { id: userId, schoolId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profilePhotoUrl: true,
          employeeId: true,
          emailAddress: true,
          joiningDate: true,
          createdAt: true,
        },
      })
      if (teacher) {
        const data: Record<string, unknown> = {
          id: teacher.id,
          firstName: teacher.firstName || "",
          lastName: teacher.lastName || "",
          profilePhotoUrl: teacher.profilePhotoUrl || null,
          emailAddress: teacher.emailAddress || "",
          createdAt: teacher.createdAt.toISOString(),
          bio: null,
          employeeId: teacher.employeeId,
          joiningDate: teacher.joiningDate?.toISOString(),
          role: "TEACHER",
          viewerPermission: computeViewerPermission({
            viewerId: session.user.id,
            viewerRole: session.user.role,
            viewerSchoolId: session.user.schoolId ?? null,
            profileUserId: teacher.id,
            profileSchoolId: schoolId,
          }),
        }

        if (lang && lang !== "ar" && schoolId && data.firstName) {
          const translated = await getDisplayText(
            data.firstName as string,
            "ar",
            lang as "en",
            schoolId
          )
          if (translated) data.firstName = translated
        }

        return { success: true as const, data }
      }

      return actionError(ACTION_ERRORS.NOT_FOUND)
    }

    // Build flat data object matching what sidebar's getRoleConfig expects
    const roleRecord =
      user.student || user.teacher || user.guardian || user.staffMember
    const data: Record<string, unknown> = {
      id: roleRecord?.id || user.id,
      firstName: roleRecord?.firstName || user.username || "",
      lastName: roleRecord?.lastName || "",
      profilePhotoUrl:
        (user.student?.profilePhotoUrl ??
          user.teacher?.profilePhotoUrl ??
          user.staffMember?.profilePhotoUrl ??
          user.image) ||
        null,
      emailAddress:
        user.student?.email ??
        user.teacher?.emailAddress ??
        user.guardian?.emailAddress ??
        user.staffMember?.emailAddress ??
        user.email ??
        "",
      createdAt: user.createdAt.toISOString(),
      bio: user.bio || null,
      // Role-specific fields
      grNumber: user.student?.grNumber,
      city: user.student?.city ?? user.staffMember?.city,
      enrollmentDate: user.student?.enrollmentDate?.toISOString(),
      employeeId: user.teacher?.employeeId ?? user.staffMember?.employeeId,
      joiningDate: (
        user.teacher?.joiningDate ?? user.staffMember?.joiningDate
      )?.toISOString(),
      // GitHub-style fields
      website: user.website,
      timezone: user.timezone,
      pronouns: user.pronouns,
      socialLinks: user.socialLinks,
      statusEmoji: user.statusEmoji,
      statusMessage: user.statusMessage,
      role: user.role,
      // Viewer permission level — lets the UI choose whether to show
      // contact details (emailAddress, employeeId, etc.) or hide them.
      // See detail/permissions.ts for the strict admin-detail-page filter.
      viewerPermission: computeViewerPermission({
        viewerId: session.user.id,
        viewerRole: session.user.role,
        viewerSchoolId: session.user.schoolId ?? null,
        profileUserId: user.id,
        // user was found via `where: { id, schoolId }` so schoolId is the
        // tenant we already resolved.
        profileSchoolId: schoolId,
      }),
    }

    // Translate name and bio if viewing in a different language
    const displayLang = lang || "ar"
    if (displayLang !== "ar" && schoolId) {
      const [translatedName, translatedBio] = await Promise.all([
        data.firstName
          ? getDisplayText(
              data.firstName as string,
              "ar",
              displayLang as "en",
              schoolId
            )
          : Promise.resolve(null),
        data.bio
          ? getDisplayText(
              data.bio as string,
              "ar",
              displayLang as "en",
              schoolId
            )
          : Promise.resolve(null),
      ])
      if (translatedName) data.firstName = translatedName
      if (translatedBio) data.bio = translatedBio
    }

    // Attach real, tenant-scoped stats/achievements/relations. Replaces the
    // fabricated counts/achievements the sidebar + dashboards used to hardcode.
    await attachRoleStats(
      data,
      {
        studentId: user.student?.id ?? null,
        teacherId: user.teacher?.id ?? null,
        guardianId: user.guardian?.id ?? null,
      },
      schoolId
    )

    return { success: true as const, data }
  } catch (error) {
    console.error("Error fetching profile basic data:", error)
    return actionError(ACTION_ERRORS.SAVE_FAILED)
  }
}

// Map a stored Achievement.category to one of the available badge
// illustrations (decorative only — title/description/date stay real).
function badgeForAchievementCategory(category: string): string {
  switch (category.toLowerCase()) {
    case "academic":
      return "galaxy-brain"
    case "sports":
      return "yolo"
    case "arts":
      return "starstruck"
    case "cultural":
      return "pull-shark"
    case "leadership":
      return "quickdraw"
    case "community service":
      return "public-sponsor"
    default:
      return "starstruck"
  }
}

// Map a stored Achievement.level to a badge tier.
function mapAchievementLevel(
  level: string | null
): "bronze" | "silver" | "gold" | "platinum" {
  switch ((level ?? "").toLowerCase()) {
    case "international":
    case "national":
      return "platinum"
    case "state":
      return "gold"
    case "district":
      return "silver"
    default:
      return "bronze"
  }
}

/**
 * Derive real, tenant-scoped stats/relations for the sidebar and role
 * dashboards and mutate them onto `data`. Each query is scoped by schoolId.
 * Counts/lists are left undefined when absent so the UI omits them (honest).
 */
async function attachRoleStats(
  data: Record<string, unknown>,
  ids: {
    studentId?: string | null
    teacherId?: string | null
    guardianId?: string | null
  },
  schoolId: string
): Promise<void> {
  if (ids.studentId) {
    const [classes, avg, achievements] = await Promise.all([
      db.studentClass.findMany({
        where: { studentId: ids.studentId, schoolId },
        select: { class: { select: { name: true, subjectId: true } } },
      }),
      db.result.aggregate({
        where: { studentId: ids.studentId, schoolId },
        _avg: { percentage: true },
      }),
      db.achievement.findMany({
        where: { studentId: ids.studentId, schoolId },
        orderBy: { achievementDate: "desc" },
        take: 12,
        select: {
          id: true,
          title: true,
          description: true,
          achievementDate: true,
          category: true,
          level: true,
          position: true,
          issuedBy: true,
        },
      }),
    ])
    data.classCount = classes.length
    data.subjectCount = new Set(classes.map((c) => c.class.subjectId)).size
    data.subjects = Array.from(
      new Map(classes.map((c) => [c.class.subjectId, c.class.name])).values()
    )
    data.averagePercentage =
      avg._avg.percentage != null ? Math.round(avg._avg.percentage) : undefined
    data.achievements = achievements.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description ?? "",
      icon: badgeForAchievementCategory(a.category),
      earnedAt: a.achievementDate.toISOString(),
      level: mapAchievementLevel(a.level),
      context: [a.position, a.issuedBy].filter(Boolean).join(" · "),
    }))
  } else if (ids.teacherId) {
    const classes = await db.class.findMany({
      where: { teacherId: ids.teacherId, schoolId },
      select: {
        id: true,
        name: true,
        _count: { select: { studentClasses: true } },
      },
    })
    data.classCount = classes.length
    data.studentsTaught = classes.reduce(
      (n, c) => n + c._count.studentClasses,
      0
    )
    data.classes = classes.map((c) => ({
      id: c.id,
      name: c.name,
      studentCount: c._count.studentClasses,
    }))
  } else if (ids.guardianId) {
    const links = await db.studentGuardian.findMany({
      where: { guardianId: ids.guardianId, schoolId },
      select: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhotoUrl: true,
          },
        },
      },
    })
    data.childrenCount = links.length
    data.children = links.map((l) => ({
      id: l.student.id,
      firstName: l.student.firstName ?? "",
      lastName: l.student.lastName ?? "",
      profilePhotoUrl: l.student.profilePhotoUrl ?? null,
    }))
  }
}

// ============================================================================
// GitHub-Style Profile Actions
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
    return { success: true as const }
  } catch (error) {
    console.error("Error updating GitHub profile:", error)
    if (error instanceof z.ZodError) {
      return actionError(ACTION_ERRORS.VALIDATION_ERROR)
    }
    return actionError(ACTION_ERRORS.UPDATE_FAILED)
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
        // Only show public items if viewing someone else's profile
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

    // Validate max 6 pinned items
    if (items.length > 6) {
      return actionError(ACTION_ERRORS.VALIDATION_ERROR, "MAX_PINNED_EXCEEDED")
    }

    // Parse all items
    const parsedItems = items.map((item) => pinnedItemSchema.parse(item))

    // Delete existing pinned items
    await db.pinnedItem.deleteMany({
      where: {
        schoolId,
        userId: session.user.id,
      },
    })

    // Create new pinned items
    await db.pinnedItem.createMany({
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
    })

    revalidatePath("/profile")
    return { success: true as const }
  } catch (error) {
    console.error("Error updating pinned items:", error)
    if (error instanceof z.ZodError) {
      return actionError(ACTION_ERRORS.VALIDATION_ERROR)
    }
    return actionError(ACTION_ERRORS.UPDATE_FAILED)
  }
}

/**
 * Map UserRole to ProfileRole
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

// Use UTC throughout the contribution map so the boundaries are stable
// regardless of the server's local timezone (Vercel runs UTC, but devs
// in MENA / Asia were getting Dec 31 → Jan 1 drift).
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
  const averagePerDay = activeDays > 0 ? totalActivities / totalDays : 0

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
  studentId: string,
  schoolId: string,
  startDate: Date,
  endDate: Date,
  map: Map<string, ContributionDataPoint>
): Promise<void> {
  const student = await db.student.findFirst({
    where: { userId: studentId, schoolId },
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
        userId: studentId,
        borrowDate: { gte: startDate, lte: endDate },
      },
      select: { borrowDate: true },
    }),
  ])

  attendance.forEach((a) => addActivity(map, a.date, "attendance"))
  submissions.forEach((s) => {
    if (s.submittedAt) addActivity(map, s.submittedAt, "assignment_submitted")
  })
  results.forEach((r) => addActivity(map, r.gradedAt, "exam_completed"))
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

  attendanceMarked.forEach((a: { markedAt: Date }) =>
    addActivity(map, a.markedAt, "attendance_taken")
  )
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
  // Messages sent by this guardian. Message has no schoolId column — tenant
  // isolation is enforced through its Conversation relation.
  // (Payment-based parent contributions are not wired yet — see ISSUE.md.)
  const messages = await db.message
    .findMany({
      where: {
        senderId: guardianUserId,
        conversation: { schoolId },
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
  const [timesheetEntries, expenses] = await Promise.all([
    db.timesheetEntry
      .findMany({
        where: {
          schoolId,
          teacherId: staffUserId,
          entryDate: { gte: startDate, lte: endDate },
        },
        select: { entryDate: true },
      })
      .catch(() => []),
    db.expense
      .findMany({
        where: {
          schoolId,
          approvedBy: staffUserId,
          approvedAt: { gte: startDate, lte: endDate },
        },
        select: { approvedAt: true },
      })
      .catch(() => []),
  ])

  timesheetEntries.forEach((t) =>
    addActivity(map, t.entryDate, "task_completed")
  )
  expenses.forEach((e) => {
    if (e.approvedAt) addActivity(map, e.approvedAt, "expense_processed")
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

    // Scope the role lookup by schoolId so a caller-supplied userId from
    // another tenant returns NOT_FOUND instead of leaking role/existence.
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
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch contribution data",
    }
  }
}

// ============================================================================
// Recent Activity Actions
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

    const activities = await db.userActivity.findMany({
      where: {
        schoolId,
        userId: targetUserId,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
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

export async function logUserActivity(
  input: z.infer<typeof logUserActivitySchema>
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

    const parsed = logUserActivitySchema.parse(input)

    await db.userActivity.create({
      data: {
        schoolId,
        userId: session.user.id,
        activityType: parsed.activityType,
        title: parsed.title,
        description: parsed.description ?? undefined,
        metadata: (parsed.metadata as Prisma.InputJsonValue) ?? undefined,
      },
    })

    return { success: true as const }
  } catch (error) {
    console.error("Error logging activity:", error)
    if (error instanceof z.ZodError) {
      return actionError(ACTION_ERRORS.VALIDATION_ERROR)
    }
    return actionError(ACTION_ERRORS.SAVE_FAILED)
  }
}
