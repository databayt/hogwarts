"use server"

import { db } from "@/lib/db"
import { currentUser } from "@/components/auth/auth"

import { filterProfileData, getPermissionLevel } from "./permissions"
import type { ProfileContext, ProfileData, ProfileType } from "./types"

/**
 * Detect profile type based on which relation exists
 */
function detectProfileType(user: any): ProfileType {
  if (user.student) return "STUDENT"
  if (user.teacher) return "TEACHER"
  if (user.guardian) return "GUARDIAN"
  if (user.role === "STAFF" || user.role === "ACCOUNTANT") return "STAFF"
  return "USER"
}

/**
 * Get profile by user ID with proper multi-tenant scoping
 */
export async function getProfileById(userId: string) {
  try {
    const viewer = await currentUser()

    // Fetch user with all profile relations
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        student: {
          include: {
            studentYearLevels: {
              include: {
                yearLevel: {
                  select: {
                    id: true,
                    levelName: true,
                  },
                },
                schoolYear: {
                  select: {
                    id: true,
                    yearName: true,
                  },
                },
              },
            },
            studentClasses: {
              include: {
                class: {
                  select: {
                    id: true,
                    name: true,
                    subject: {
                      select: {
                        id: true,
                        subjectName: true,
                      },
                    },
                  },
                },
              },
            },
            studentGuardians: {
              include: {
                guardian: {
                  select: {
                    id: true,
                    givenName: true,
                    surname: true,
                    emailAddress: true,
                  },
                },
                guardianType: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        teacher: {
          include: {
            teacherDepartments: {
              include: {
                department: {
                  select: {
                    id: true,
                    departmentName: true,
                  },
                },
              },
            },
            classes: {
              select: {
                id: true,
                name: true,
                subject: {
                  select: {
                    id: true,
                    subjectName: true,
                  },
                },
              },
            },
            phoneNumbers: {
              select: {
                id: true,
                phoneNumber: true,
                phoneType: true,
                isPrimary: true,
              },
            },
            qualifications: {
              select: {
                id: true,
                qualificationType: true,
                name: true,
                institution: true,
                dateObtained: true,
              },
            },
          },
        },
        guardian: {
          include: {
            phoneNumbers: {
              select: {
                id: true,
                phoneNumber: true,
                phoneType: true,
                isPrimary: true,
              },
            },
            studentGuardians: {
              include: {
                student: {
                  select: {
                    id: true,
                    givenName: true,
                    middleName: true,
                    surname: true,
                    profilePhotoUrl: true,
                    userId: true,
                  },
                },
                guardianType: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            teacher: {
              select: {
                id: true,
                givenName: true,
                surname: true,
                emailAddress: true,
                employeeId: true,
              },
            },
          },
        },
      },
    })

    if (!user) {
      return {
        success: false,
        error: "User not found",
      }
    }

    // Multi-tenant check - ensure user belongs to viewer's school (unless viewer is DEVELOPER)
    if (viewer?.role !== "DEVELOPER") {
      if (user.schoolId !== viewer?.schoolId) {
        return {
          success: false,
          error: "Unauthorized - User does not belong to your school",
        }
      }
    }

    // Detect profile type
    const profileType = detectProfileType(user)

    // Build profile data
    const profileData: ProfileData = {
      id: user.id,
      username: user.username,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image,
      role: user.role,
      schoolId: user.schoolId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      student: (user as any).student || undefined,
      teacher: (user as any).teacher || undefined,
      guardian: (user as any).guardian || undefined,
      profileType,
    }

    // Build permission context
    const context: ProfileContext = {
      viewerId: viewer?.id || null,
      viewerRole: (viewer?.role as any) || null,
      viewerSchoolId: viewer?.schoolId || null,
      profileUserId: user.id,
      profileSchoolId: user.schoolId,
      profileType,
    }

    // Get permission level
    const permissionLevel = getPermissionLevel(context)

    // Filter data based on permissions
    const filteredData = filterProfileData(profileData, permissionLevel)

    return {
      success: true,
      data: filteredData,
      permissionLevel,
    }
  } catch (error) {
    console.error("Error fetching profile:", error)
    return {
      success: false,
      error: "Failed to fetch profile data",
    }
  }
}

/**
 * Check if current user can view a profile
 */
export async function canViewProfile(userId: string): Promise<boolean> {
  try {
    const viewer = await currentUser()

    if (!viewer) return false

    // DEVELOPER can view all profiles
    if (viewer.role === "DEVELOPER") return true

    // Can always view own profile
    if (viewer.id === userId) return true

    // Fetch target user
    const targetUser = await db.user.findUnique({
      where: { id: userId },
      select: { schoolId: true },
    })

    if (!targetUser) return false

    // Must be in same school (unless DEVELOPER)
    return targetUser.schoolId === viewer.schoolId
  } catch (error) {
    console.error("Error checking profile access:", error)
    return false
  }
}
