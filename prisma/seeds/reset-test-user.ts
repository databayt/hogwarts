// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Reset Test User Script
 *
 * Resets user@databayt.org to fresh state for onboarding testing:
 * - Role: USER
 * - No schoolId
 * - Clears any associated data
 *
 * Usage: pnpm db:reset-test-user
 */

import { PrismaClient } from "@prisma/client"

import { getPasswordHash } from "./utils"

const prisma = new PrismaClient()

const TEST_USER_EMAIL = "user@databayt.org"

async function resetTestUser() {
  console.log("🔄 Resetting test user: user@databayt.org")

  const passwordHash = await getPasswordHash()

  try {
    // Find ALL users with this email (duplicates possible due to NULL schoolId uniqueness)
    const allUsers = await prisma.user.findMany({
      where: { email: TEST_USER_EMAIL },
      orderBy: { createdAt: "asc" },
    })

    if (allUsers.length > 0) {
      // Keep the oldest, delete duplicates
      const keeper = allUsers[0]
      const duplicates = allUsers.slice(1)

      if (duplicates.length > 0) {
        const duplicateIds = duplicates.map((u) => u.id)
        await prisma.user.deleteMany({ where: { id: { in: duplicateIds } } })
        console.log(`   Deleted ${duplicates.length} duplicate user(s)`)
      }

      // Find schools created by this user (except demo)
      const schoolsToDelete = await prisma.school.findMany({
        where: {
          createdByUserId: keeper.id,
          domain: { not: "demo" },
        },
        select: { id: true },
      })

      if (schoolsToDelete.length > 0) {
        const schoolIds = schoolsToDelete.map((s) => s.id)

        // Unlink users first (FK constraint prevents school deletion otherwise)
        const unlinkedUsers = await prisma.user.updateMany({
          where: { schoolId: { in: schoolIds } },
          data: { schoolId: null, role: "USER" },
        })
        if (unlinkedUsers.count > 0) {
          console.log(
            `   Unlinked ${unlinkedUsers.count} user(s) from school(s)`
          )
        }

        // Now safe to delete
        const deletedSchools = await prisma.school.deleteMany({
          where: { id: { in: schoolIds } },
        })
        if (deletedSchools.count > 0) {
          console.log(`   Deleted ${deletedSchools.count} orphaned school(s)`)
        }
      }

      // Reset user to fresh state
      await prisma.user.update({
        where: { id: keeper.id },
        data: {
          role: "USER",
          schoolId: null,
          username: "New User",
          password: passwordHash,
          emailVerified: new Date(),
        },
      })

      console.log("✅ Test user reset successfully:")
      console.log("   Email: user@databayt.org")
      console.log("   Role: USER")
      console.log("   School: None")
      console.log("   Password: 1234")
    } else {
      // Create the user if it doesn't exist
      await prisma.user.create({
        data: {
          email: TEST_USER_EMAIL,
          username: "New User",
          password: passwordHash,
          role: "USER",
          schoolId: null,
          emailVerified: new Date(),
        },
      })

      console.log("✅ Test user created:")
      console.log("   Email: user@databayt.org")
      console.log("   Role: USER")
      console.log("   School: None")
      console.log("   Password: 1234")
    }
  } catch (error) {
    console.error("❌ Failed to reset test user:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

resetTestUser()
