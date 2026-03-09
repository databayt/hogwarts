"use server"

import { revalidatePath, unstable_cache } from "next/cache"
import { auth } from "@/auth"
import type { Prisma } from "@prisma/client"
import { z } from "zod"

import { getDisplayText } from "@/lib/content-display"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

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
import {
  pinnedItemSchema,
  updateBioSchema,
  updateGitHubProfileSchema,
  updateProfileSchema,
  updateSettingsSchema,
} from "./validation"

// ============================================================================
// Profile Fetching Actions
// ============================================================================

export async function getStudentProfile(studentId?: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false as const, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false as const, error: "School context not found" }
    }

    // Use provided ID or current user's ID
    const targetId = studentId || session.user.id

    const student = await db.student.findFirst({
      where: {
        id: targetId,
        schoolId,
      },
      include: {
        user: true,
        studentYearLevels: {
          include: {
            yearLevel: true,
          },
        },
        studentClasses: {
          include: {
            class: {
              include: {
                subject: true,
                teacher: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        },
        studentGuardians: {
          include: {
            guardian: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    })

    if (!student) {
      return { success: false as const, error: "Student not found" }
    }

    return { success: true as const, data: student }
  } catch (error) {
    console.error("Error fetching student profile:", error)
    return { success: false as const, error: "Failed to fetch student profile" }
  }
}

export async function getTeacherProfile(teacherId?: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false as const, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false as const, error: "School context not found" }
    }

    const targetId = teacherId || session.user.id

    const teacher = await db.teacher.findFirst({
      where: {
        id: targetId,
        schoolId,
      },
      include: {
        user: true,
        teacherDepartments: {
          include: {
            department: true,
          },
        },
        classes: {
          include: {
            subject: true,
            studentClasses: {
              include: {
                student: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!teacher) {
      return { success: false as const, error: "Teacher not found" }
    }

    return { success: true as const, data: teacher }
  } catch (error) {
    console.error("Error fetching teacher profile:", error)
    return { success: false as const, error: "Failed to fetch teacher profile" }
  }
}

export async function getParentProfile(parentId?: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false as const, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false as const, error: "School context not found" }
    }

    const targetId = parentId || session.user.id

    const parent = await db.guardian.findFirst({
      where: {
        id: targetId,
        schoolId,
      },
      include: {
        user: true,
        studentGuardians: {
          include: {
            student: {
              include: {
                user: true,
                studentYearLevels: {
                  include: {
                    yearLevel: true,
                  },
                },
                studentClasses: {
                  include: {
                    class: {
                      include: {
                        subject: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!parent) {
      return { success: false as const, error: "Parent not found" }
    }

    return { success: true as const, data: parent }
  } catch (error) {
    console.error("Error fetching parent profile:", error)
    return { success: false as const, error: "Failed to fetch parent profile" }
  }
}

export async function getStaffProfile(staffId?: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false as const, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false as const, error: "School context not found" }
    }

    const targetId = staffId || session.user.id

    // For staff, we fetch the user directly with school context
    const user = await db.user.findFirst({
      where: {
        id: targetId,
        schoolId,
        role: {
          in: ["STAFF", "ACCOUNTANT", "ADMIN", "DEVELOPER"],
        },
      },
    })

    if (!user) {
      return { success: false as const, error: "Staff not found" }
    }

    return { success: true as const, data: user }
  } catch (error) {
    console.error("Error fetching staff profile:", error)
    return { success: false as const, error: "Failed to fetch staff profile" }
  }
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
      return { success: false as const, error: "Not authenticated" }
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
      return { success: false as const, error: "Invalid input data" }
    }
    return { success: false as const, error: "Failed to update profile" }
  }
}

export async function updateProfileBio(input: z.infer<typeof updateBioSchema>) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false as const, error: "Not authenticated" }
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
      return { success: false as const, error: "Invalid input data" }
    }
    return { success: false as const, error: "Failed to update bio" }
  }
}

export async function updateProfileSettings(
  input: z.infer<typeof updateSettingsSchema>
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false as const, error: "Not authenticated" }
    }

    const parsed = updateSettingsSchema.parse(input)

    // Update user settings
    // Note: This assumes you have a UserSettings table or similar
    // If not, you may need to store settings in JSON field on User table
    await db.user.update({
      where: { id: session.user.id },
      data: {
        // Store settings as JSON or in separate table
        // This is a placeholder - adjust based on your schema
      },
    })

    revalidatePath("/profile")
    revalidatePath("/profile/settings")
    return { success: true as const }
  } catch (error) {
    console.error("Error updating settings:", error)
    if (error instanceof z.ZodError) {
      return { success: false as const, error: "Invalid input data" }
    }
    return { success: false as const, error: "Failed to update settings" }
  }
}

export async function uploadProfileAvatar(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false as const, error: "Not authenticated" }
    }

    // This is a placeholder for file upload logic
    // You would typically:
    // 1. Extract the file from formData
    // 2. Upload to cloud storage (S3, Cloudinary, etc.)
    // 3. Get the URL
    // 4. Update user's image field

    const file = formData.get("avatar") as File
    if (!file) {
      return { success: false as const, error: "No file provided" }
    }

    // Placeholder for upload logic
    // const uploadedUrl = await uploadToCloudStorage(file)

    // await db.user.update({
    //   where: { id: session.user.id },
    //   data: { image: uploadedUrl },
    // })

    revalidatePath("/profile")
    return {
      success: true as const,
      message: "Avatar upload not yet implemented",
    }
  } catch (error) {
    console.error("Error uploading avatar:", error)
    return { success: false as const, error: "Failed to upload avatar" }
  }
}

// ============================================================================
// Profile Basic Data (for GitHub-style profile sidebar)
// ============================================================================

export async function getProfileBasicData(userId: string, lang?: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false as const, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false as const, error: "School context not found" }
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
            givenName: true,
            surname: true,
            profilePhotoUrl: true,
            grNumber: true,
            city: true,
            enrollmentDate: true,
            email: true,
          },
        },
        teacher: {
          select: {
            id: true,
            givenName: true,
            surname: true,
            profilePhotoUrl: true,
            employeeId: true,
            emailAddress: true,
            joiningDate: true,
          },
        },
        guardian: {
          select: {
            id: true,
            givenName: true,
            surname: true,
            emailAddress: true,
          },
        },
        staffMember: {
          select: {
            id: true,
            givenName: true,
            surname: true,
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
      return { success: false as const, error: "User not found" }
    }

    // Build flat data object matching what sidebar's getRoleConfig expects
    const roleRecord =
      user.student || user.teacher || user.guardian || user.staffMember
    const data: Record<string, unknown> = {
      id: roleRecord?.id || user.id,
      givenName: roleRecord?.givenName || user.username || "",
      surname: roleRecord?.surname || "",
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
    }

    // Translate name and bio if viewing in a different language
    const displayLang = lang || "ar"
    if (displayLang !== "ar" && schoolId) {
      const [translatedName, translatedBio] = await Promise.all([
        data.givenName
          ? getDisplayText(
              data.givenName as string,
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
      if (translatedName) data.givenName = translatedName
      if (translatedBio) data.bio = translatedBio
    }

    return { success: true as const, data }
  } catch (error) {
    console.error("Error fetching profile basic data:", error)
    return { success: false as const, error: "Failed to fetch profile data" }
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
      return { success: false as const, error: "Not authenticated" }
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
      return { success: false as const, error: "Invalid input data" }
    }
    return { success: false as const, error: "Failed to update profile" }
  }
}

// ============================================================================
// Pinned Items Actions
// ============================================================================

export async function getPinnedItems(userId?: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false as const, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false as const, error: "School context not found" }
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
    return { success: false as const, error: "Failed to fetch pinned items" }
  }
}

export async function updatePinnedItems(
  items: z.infer<typeof pinnedItemSchema>[]
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false as const, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false as const, error: "School context not found" }
    }

    // Validate max 6 pinned items
    if (items.length > 6) {
      return {
        success: false as const,
        error: "Maximum 6 pinned items allowed",
      }
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
      return { success: false as const, error: "Invalid input data" }
    }
    return { success: false as const, error: "Failed to update pinned items" }
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

function getYearDateRange(year: number): { startDate: Date; endDate: Date } {
  const startDate = new Date(year, 0, 1)
  const endDate = new Date(year, 11, 31)
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
    current.setDate(current.getDate() + 1)
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
  const [payments, messages] = await Promise.all([
    db.payment
      .findMany({
        where: {
          schoolId,
          paymentDate: { gte: startDate, lte: endDate },
        },
        select: { paymentDate: true },
        take: 0,
      })
      .catch(() => []),
    db.message
      .findMany({
        where: {
          senderId: guardianUserId,
          createdAt: { gte: startDate, lte: endDate },
        },
        select: { createdAt: true },
      })
      .catch(() => []),
  ])

  payments.forEach((p) => addActivity(map, p.paymentDate, "payment_made"))
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
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "School context not found" }
    }

    const userId = params.userId || session.user.id
    const year = params.year || new Date().getFullYear()

    if (year < 2020 || year > new Date().getFullYear() + 1) {
      return { success: false, error: "Invalid year parameter" }
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    if (!user) {
      return { success: false, error: "User not found" }
    }

    const role = mapUserRoleToProfileRole(user.role)
    if (!role) {
      return { success: false, error: "Unsupported user role" }
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

/**
 * Determine profile role for a user
 */
export async function getUserProfileRole(
  userId?: string
): Promise<ProfileRole | null> {
  try {
    const session = await auth()
    const targetUserId = userId || session?.user?.id

    if (!targetUserId) return null

    const user = await db.user.findUnique({
      where: { id: targetUserId },
      select: { role: true },
    })

    if (!user) return null

    return mapUserRoleToProfileRole(user.role)
  } catch {
    return null
  }
}

// ============================================================================
// Recent Activity Actions
// ============================================================================

export async function getRecentActivity(userId?: string, limit = 20) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false as const, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false as const, error: "School context not found" }
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
    return { success: false as const, error: "Failed to fetch recent activity" }
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
      return { success: false as const, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false as const, error: "School context not found" }
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
    return { success: false as const, error: "Failed to log activity" }
  }
}

// ============================================================================
// Get User Profile with GitHub-style Fields
// ============================================================================

export async function getUserProfileWithGitHubFields(userId?: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false as const, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false as const, error: "School context not found" }
    }

    const targetUserId = userId || session.user.id

    const user = await db.user.findFirst({
      where: {
        id: targetUserId,
        schoolId,
      },
      select: {
        id: true,
        username: true,
        email: true,
        image: true,
        role: true,
        bio: true,
        website: true,
        timezone: true,
        statusEmoji: true,
        statusMessage: true,
        pronouns: true,
        socialLinks: true,
        createdAt: true,
        student: {
          select: {
            id: true,
            givenName: true,
            middleName: true,
            surname: true,
            profilePhotoUrl: true,
            grNumber: true,
            city: true,
            enrollmentDate: true,
          },
        },
        teacher: {
          select: {
            id: true,
            givenName: true,
            surname: true,
            profilePhotoUrl: true,
            employeeId: true,
            emailAddress: true,
            joiningDate: true,
          },
        },
        guardian: {
          select: {
            id: true,
            givenName: true,
            surname: true,
            emailAddress: true,
          },
        },
        pinnedItems: {
          where: {
            ...(targetUserId !== session.user.id && { isPublic: true }),
          },
          orderBy: { order: "asc" },
          take: 6,
        },
        userActivities: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    })

    if (!user) {
      return { success: false as const, error: "User not found" }
    }

    // Get name based on role
    let displayName = user.username || ""
    let profilePhoto = user.image
    if (user.student) {
      displayName =
        `${user.student.givenName || ""} ${user.student.surname || ""}`.trim()
      profilePhoto = user.student.profilePhotoUrl || user.image
    } else if (user.teacher) {
      displayName =
        `${user.teacher.givenName || ""} ${user.teacher.surname || ""}`.trim()
      profilePhoto = user.teacher.profilePhotoUrl || user.image
    } else if (user.guardian) {
      displayName =
        `${user.guardian.givenName || ""} ${user.guardian.surname || ""}`.trim()
    }

    return {
      success: true as const,
      data: {
        ...user,
        displayName,
        profilePhoto,
        isOwner: targetUserId === session.user.id,
      },
    }
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return { success: false as const, error: "Failed to fetch user profile" }
  }
}
