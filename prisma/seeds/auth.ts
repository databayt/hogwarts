/**
 * Auth Seed
 * Creates User accounts for all roles
 *
 * Phase 1: Core Foundation - User Accounts
 *
 * Accounts created:
 * - dev@databayt.org (DEVELOPER)
 * - admin@databayt.org (ADMIN)
 * - accountant@databayt.org (ACCOUNTANT)
 * - staff@databayt.org (STAFF)
 * - teacher@databayt.org, teacher1-99@databayt.org (TEACHER) - 100 total
 * - student@databayt.org, student1-999@databayt.org (STUDENT) - 1000 total
 * - parent@databayt.org, parent1-1999@databayt.org (GUARDIAN) - 2000 total
 *
 * All accounts use password: 1234
 */

import type { PrismaClient, UserRole } from "@prisma/client"

import { ADMIN_USERS } from "./constants"
import type { UserRef } from "./types"
import {
  generateSchoolEmail,
  getPasswordHash,
  isUniqueConstraintError,
  logSuccess,
  logWarning,
  processBatch,
} from "./utils"

// ============================================================================
// ADMIN USERS SEEDING
// ============================================================================

/**
 * Seed admin users (dev, admin, accountant, staff)
 */
export async function seedAdminUsers(
  prisma: PrismaClient,
  schoolId: string
): Promise<UserRef[]> {
  const passwordHash = await getPasswordHash()
  const users: UserRef[] = []

  for (const userData of ADMIN_USERS) {
    try {
      // Developer and USER roles have no schoolId (platform-level accounts)
      const userSchoolId =
        userData.role === "DEVELOPER" || userData.role === "USER"
          ? null
          : schoolId

      const user = await prisma.user.upsert({
        where: {
          email_schoolId: {
            email: userData.email,
            schoolId: userSchoolId ?? "",
          },
        },
        update: {
          username: userData.username,
          password: passwordHash,
          role: userData.role as UserRole,
          emailVerified: new Date(),
        },
        create: {
          email: userData.email,
          username: userData.username,
          password: passwordHash,
          role: userData.role as UserRole,
          schoolId: userSchoolId,
          emailVerified: new Date(),
        },
      })

      users.push({
        id: user.id,
        email: user.email!,
        role: user.role,
      })
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        // Find existing user
        const existing = await prisma.user.findFirst({
          where: { email: userData.email },
        })
        if (existing) {
          users.push({
            id: existing.id,
            email: existing.email!,
            role: existing.role,
          })
        }
        logWarning(`User ${userData.email} already exists, skipped`)
      } else {
        throw error
      }
    }
  }

  logSuccess("Admin Users", users.length, "dev, admin, accountant, staff")
  return users
}

// ============================================================================
// TEACHER USERS SEEDING
// ============================================================================

/**
 * Seed teacher user accounts (100 total)
 * Creates only the User records - Teacher profiles created in people.ts
 */
export async function seedTeacherUsers(
  prisma: PrismaClient,
  schoolId: string,
  count: number = 100
): Promise<UserRef[]> {
  const passwordHash = await getPasswordHash()
  const users: UserRef[] = []

  // Process in batches for performance
  const indices = Array.from({ length: count }, (_, i) => i)

  await processBatch(indices, 20, async (index) => {
    const email = generateSchoolEmail("teacher", index)

    try {
      const user = await prisma.user.upsert({
        where: {
          email_schoolId: {
            email,
            schoolId,
          },
        },
        update: {
          password: passwordHash,
          role: "TEACHER",
          emailVerified: new Date(),
        },
        create: {
          email,
          username: `Teacher ${index === 0 ? "" : index}`.trim(),
          password: passwordHash,
          role: "TEACHER",
          schoolId,
          emailVerified: new Date(),
        },
      })

      users.push({
        id: user.id,
        email: user.email!,
        role: user.role,
      })
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error
      }
      // Find existing user
      const existing = await prisma.user.findFirst({
        where: { email, schoolId },
      })
      if (existing) {
        users.push({
          id: existing.id,
          email: existing.email!,
          role: existing.role,
        })
      }
    }
  })

  logSuccess("Teacher Users", users.length, "teacher@, teacher1-99@")
  return users
}

// ============================================================================
// STUDENT USERS SEEDING
// ============================================================================

/**
 * Seed student user accounts (1000 total)
 * Creates only the User records - Student profiles created in people.ts
 */
export async function seedStudentUsers(
  prisma: PrismaClient,
  schoolId: string,
  count: number = 1000
): Promise<UserRef[]> {
  const passwordHash = await getPasswordHash()
  const users: UserRef[] = []

  // Process in batches for performance
  const indices = Array.from({ length: count }, (_, i) => i)

  await processBatch(indices, 50, async (index) => {
    const email = generateSchoolEmail("student", index)

    try {
      const user = await prisma.user.upsert({
        where: {
          email_schoolId: {
            email,
            schoolId,
          },
        },
        update: {
          password: passwordHash,
          role: "STUDENT",
          emailVerified: new Date(),
        },
        create: {
          email,
          username: `Student ${index === 0 ? "" : index}`.trim(),
          password: passwordHash,
          role: "STUDENT",
          schoolId,
          emailVerified: new Date(),
        },
      })

      users.push({
        id: user.id,
        email: user.email!,
        role: user.role,
      })
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error
      }
      // Find existing user
      const existing = await prisma.user.findFirst({
        where: { email, schoolId },
      })
      if (existing) {
        users.push({
          id: existing.id,
          email: existing.email!,
          role: existing.role,
        })
      }
    }
  })

  logSuccess("Student Users", users.length, "student@, student1-999@")
  return users
}

// ============================================================================
// GUARDIAN USERS SEEDING
// ============================================================================

/**
 * Seed guardian/parent user accounts (2000 total - 2 per student)
 * Creates only the User records - Guardian profiles created in people.ts
 */
export async function seedGuardianUsers(
  prisma: PrismaClient,
  schoolId: string,
  count: number = 2000
): Promise<UserRef[]> {
  const passwordHash = await getPasswordHash()
  const users: UserRef[] = []

  // Process in batches for performance
  const indices = Array.from({ length: count }, (_, i) => i)

  await processBatch(indices, 50, async (index) => {
    const email = generateSchoolEmail("parent", index)

    try {
      const user = await prisma.user.upsert({
        where: {
          email_schoolId: {
            email,
            schoolId,
          },
        },
        update: {
          password: passwordHash,
          role: "GUARDIAN",
          emailVerified: new Date(),
        },
        create: {
          email,
          username: `Parent ${index === 0 ? "" : index}`.trim(),
          password: passwordHash,
          role: "GUARDIAN",
          schoolId,
          emailVerified: new Date(),
        },
      })

      users.push({
        id: user.id,
        email: user.email!,
        role: user.role,
      })
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error
      }
      // Find existing user
      const existing = await prisma.user.findFirst({
        where: { email, schoolId },
      })
      if (existing) {
        users.push({
          id: existing.id,
          email: existing.email!,
          role: existing.role,
        })
      }
    }
  })

  logSuccess("Guardian Users", users.length, "parent@, parent1-1999@")
  return users
}

// ============================================================================
// COMBINED AUTH SEEDING
// ============================================================================

/**
 * Seed all user accounts
 * Returns all user references for linking to profiles
 */
export async function seedAllUsers(
  prisma: PrismaClient,
  schoolId: string
): Promise<{
  adminUsers: UserRef[]
  teacherUsers: UserRef[]
  studentUsers: UserRef[]
  guardianUsers: UserRef[]
  allUsers: UserRef[]
}> {
  const adminUsers = await seedAdminUsers(prisma, schoolId)
  const teacherUsers = await seedTeacherUsers(prisma, schoolId, 100)
  const studentUsers = await seedStudentUsers(prisma, schoolId, 1000)
  const guardianUsers = await seedGuardianUsers(prisma, schoolId, 2000)

  // Combine all users
  const allUsers = [
    ...adminUsers,
    ...teacherUsers,
    ...studentUsers,
    ...guardianUsers,
  ]

  return {
    adminUsers,
    teacherUsers,
    studentUsers,
    guardianUsers,
    allUsers,
  }
}
