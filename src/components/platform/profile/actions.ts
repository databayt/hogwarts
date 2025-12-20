"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import type { Prisma } from "@prisma/client"
import { z } from "zod"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

// ============================================================================
// Validation Schemas
// ============================================================================

const updateProfileSchema = z.object({
  displayName: z.string().min(1),
  avatarUrl: z.string().url().optional().or(z.literal("")),
  locale: z.enum(["ar", "en"]).default("ar"),
})

const updateBioSchema = z.object({
  bio: z.string().max(500).optional(),
})

const updateSettingsSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).optional(),
  language: z.enum(["ar", "en"]).optional(),
  allowMessages: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
})

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
// GitHub-Style Profile Actions
// ============================================================================

const updateGitHubProfileSchema = z.object({
  bio: z.string().max(500).optional(),
  website: z.string().url().optional().or(z.literal("")),
  timezone: z.string().optional(),
  statusEmoji: z.string().max(10).optional(),
  statusMessage: z.string().max(100).optional(),
  pronouns: z.string().max(50).optional(),
  socialLinks: z
    .object({
      github: z.string().url().optional().or(z.literal("")),
      twitter: z.string().url().optional().or(z.literal("")),
      linkedin: z.string().url().optional().or(z.literal("")),
    })
    .optional(),
})

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

const pinnedItemSchema = z.object({
  itemType: z.enum([
    "COURSE",
    "SUBJECT",
    "PROJECT",
    "ACHIEVEMENT",
    "CERTIFICATE",
    "CLASS",
    "CHILD",
    "DEPARTMENT",
    "PUBLICATION",
    "TASK",
  ]),
  itemId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  isPublic: z.boolean().default(true),
})

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

// ============================================================================
// Contribution Data Actions
// ============================================================================

export interface ContributionDay {
  date: string
  count: number
  level: 0 | 1 | 2 | 3 | 4
  details: {
    attendance?: number
    assignments?: number
    achievements?: number
    activities?: number
  }
}

export async function getContributionData(userId?: string, year?: number) {
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
    const targetYear = year || new Date().getFullYear()

    const startDate = new Date(targetYear, 0, 1)
    const endDate = new Date(targetYear, 11, 31, 23, 59, 59)

    // Fetch user activities grouped by date
    const activities = await db.userActivity.groupBy({
      by: ["createdAt"],
      where: {
        schoolId,
        userId: targetUserId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: {
        id: true,
      },
    })

    // Also fetch attendance records if user is a student
    const attendanceRecords = await db.attendance.findMany({
      where: {
        schoolId,
        student: {
          user: { id: targetUserId },
        },
        date: {
          gte: startDate,
          lte: endDate,
        },
        status: "PRESENT",
      },
      select: { date: true },
    })

    // Fetch assignment submissions
    const submissions = await db.assignmentSubmission.findMany({
      where: {
        schoolId,
        student: {
          user: { id: targetUserId },
        },
        submittedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: { submittedAt: true },
    })

    // Build contribution map
    const contributionMap = new Map<string, ContributionDay>()

    // Initialize all days in the year
    const current = new Date(startDate)
    while (current <= endDate) {
      const dateStr = current.toISOString().split("T")[0]
      contributionMap.set(dateStr, {
        date: dateStr,
        count: 0,
        level: 0,
        details: {
          attendance: 0,
          assignments: 0,
          achievements: 0,
          activities: 0,
        },
      })
      current.setDate(current.getDate() + 1)
    }

    // Add activities
    for (const activity of activities) {
      const dateStr = activity.createdAt.toISOString().split("T")[0]
      const day = contributionMap.get(dateStr)
      if (day) {
        day.count += activity._count.id
        day.details.activities =
          (day.details.activities || 0) + activity._count.id
      }
    }

    // Add attendance
    for (const record of attendanceRecords) {
      const dateStr = record.date.toISOString().split("T")[0]
      const day = contributionMap.get(dateStr)
      if (day) {
        day.count += 1
        day.details.attendance = (day.details.attendance || 0) + 1
      }
    }

    // Add submissions
    for (const submission of submissions) {
      if (submission.submittedAt) {
        const dateStr = submission.submittedAt.toISOString().split("T")[0]
        const day = contributionMap.get(dateStr)
        if (day) {
          day.count += 1
          day.details.assignments = (day.details.assignments || 0) + 1
        }
      }
    }

    // Calculate levels based on count
    for (const day of contributionMap.values()) {
      if (day.count === 0) day.level = 0
      else if (day.count <= 2) day.level = 1
      else if (day.count <= 4) day.level = 2
      else if (day.count <= 6) day.level = 3
      else day.level = 4
    }

    const contributions = Array.from(contributionMap.values())
    const totalContributions = contributions.reduce(
      (sum, d) => sum + d.count,
      0
    )

    return {
      success: true as const,
      data: {
        contributions,
        totalContributions,
        year: targetYear,
      },
    }
  } catch (error) {
    console.error("Error fetching contribution data:", error)
    return {
      success: false as const,
      error: "Failed to fetch contribution data",
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
