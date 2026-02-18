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
    // Find the user
    const existingUser = await prisma.user.findFirst({
      where: { email: TEST_USER_EMAIL },
    })

    if (existingUser) {
      // Delete any schools created by this user EXCEPT the demo school
      const deletedSchools = await prisma.school.deleteMany({
        where: {
          createdByUserId: existingUser.id,
          domain: { not: "demo" },
        },
      })
      if (deletedSchools.count > 0) {
        console.log(`   Deleted ${deletedSchools.count} orphaned school(s)`)
      }

      // Reset user to fresh state
      await prisma.user.update({
        where: { id: existingUser.id },
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
