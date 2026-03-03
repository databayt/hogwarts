// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

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

import { ADMIN_USERS, HP_CHARACTERS } from "./constants"
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

      // Use findFirst + create/update to handle null schoolId correctly
      // (Prisma upsert with composite unique can't match NULL values)
      const existing = await prisma.user.findFirst({
        where: { email: userData.email, schoolId: userSchoolId },
      })

      const bio = (userData as { bio?: string }).bio || null
      const image = (userData as { image?: string }).image || null

      const user = existing
        ? await prisma.user.update({
            where: { id: existing.id },
            data: {
              username: userData.username,
              bio,
              image,
              password: passwordHash,
              role: userData.role as UserRole,
              emailVerified: new Date(),
            },
          })
        : await prisma.user.create({
            data: {
              email: userData.email,
              username: userData.username,
              bio,
              image,
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
          ...(index === 0
            ? {
                username: HP_CHARACTERS.teacher.nameAr,
                bio: HP_CHARACTERS.teacher.bio,
              }
            : {}),
          emailVerified: new Date(),
        },
        create: {
          email,
          username:
            index === 0
              ? HP_CHARACTERS.teacher.nameAr
              : `Teacher ${index}`.trim(),
          ...(index === 0 ? { bio: HP_CHARACTERS.teacher.bio } : {}),
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
          ...(index === 0
            ? {
                username: HP_CHARACTERS.student.nameAr,
                bio: HP_CHARACTERS.student.bio,
              }
            : {}),
          emailVerified: new Date(),
        },
        create: {
          email,
          username:
            index === 0
              ? HP_CHARACTERS.student.nameAr
              : `Student ${index}`.trim(),
          ...(index === 0 ? { bio: HP_CHARACTERS.student.bio } : {}),
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
          ...(index === 0
            ? {
                username: HP_CHARACTERS.guardian0.nameAr,
                bio: HP_CHARACTERS.guardian0.bio,
              }
            : index === 1
              ? {
                  username: HP_CHARACTERS.guardian1.nameAr,
                  bio: HP_CHARACTERS.guardian1.bio,
                }
              : {}),
          emailVerified: new Date(),
        },
        create: {
          email,
          username:
            index === 0
              ? HP_CHARACTERS.guardian0.nameAr
              : index === 1
                ? HP_CHARACTERS.guardian1.nameAr
                : `Parent ${index}`.trim(),
          ...(index === 0
            ? { bio: HP_CHARACTERS.guardian0.bio }
            : index === 1
              ? { bio: HP_CHARACTERS.guardian1.bio }
              : {}),
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
