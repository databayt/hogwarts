"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
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

    // Note: bio field not currently in User model schema
    // TODO: Add bio field to User model if needed
    // await db.user.update({
    //   where: { id: session.user.id },
    //   data: {
    //     bio: parsed.bio || null,
    //   },
    // })

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
