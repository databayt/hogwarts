// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Reset Test Applicant Script
 *
 * Resets applicant@databayt.org to fresh state for application flow testing:
 * - Role: USER
 * - No schoolId
 * - Clears all application artifacts (Application, ApplicationSession, Student, Enrollment)
 *
 * Usage: pnpm db:reset-test-applicant
 */

import { PrismaClient } from "@prisma/client"

import { getPasswordHash } from "./utils"

const TEST_APPLICANT_EMAIL = "applicant@databayt.org"

export async function resetTestApplicant() {
  const prisma = new PrismaClient()

  console.log("🔄 Resetting test applicant: applicant@databayt.org")

  const passwordHash = await getPasswordHash()

  try {
    // Find ALL users with this email (duplicates possible due to NULL schoolId uniqueness)
    const allUsers = await prisma.user.findMany({
      where: { email: TEST_APPLICANT_EMAIL },
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

      // Delete all Application records
      const deletedApplications = await prisma.application.deleteMany({
        where: { userId: keeper.id },
      })
      if (deletedApplications.count > 0) {
        console.log(`   Deleted ${deletedApplications.count} application(s)`)
      }

      // Delete all ApplicationSession records
      const deletedSessions = await prisma.applicationSession.deleteMany({
        where: { userId: keeper.id },
      })
      if (deletedSessions.count > 0) {
        console.log(
          `   Deleted ${deletedSessions.count} application session(s)`
        )
      }

      // Delete any Student records (cascades to StudentClass, StudentYearLevel, FeeAssignment, etc.)
      const deletedStudents = await prisma.student.deleteMany({
        where: { userId: keeper.id },
      })
      if (deletedStudents.count > 0) {
        console.log(
          `   Deleted ${deletedStudents.count} student record(s) (+ cascaded children)`
        )
      }

      // Delete any Enrollment (LMS) records
      const deletedEnrollments = await prisma.enrollment.deleteMany({
        where: { userId: keeper.id },
      })
      if (deletedEnrollments.count > 0) {
        console.log(`   Deleted ${deletedEnrollments.count} enrollment(s)`)
      }

      // Reset user to fresh state
      await prisma.user.update({
        where: { id: keeper.id },
        data: {
          role: "USER",
          schoolId: null,
          username: "لونا لوفغود",
          password: passwordHash,
          emailVerified: new Date(),
        },
      })

      console.log("✅ Test applicant reset successfully:")
      console.log("   Email: applicant@databayt.org")
      console.log("   Role: USER")
      console.log("   School: None")
      console.log("   Password: 1234")
    } else {
      // Create the user if it doesn't exist
      await prisma.user.create({
        data: {
          email: TEST_APPLICANT_EMAIL,
          username: "لونا لوفغود",
          password: passwordHash,
          role: "USER",
          schoolId: null,
          emailVerified: new Date(),
        },
      })

      console.log("✅ Test applicant created:")
      console.log("   Email: applicant@databayt.org")
      console.log("   Role: USER")
      console.log("   School: None")
      console.log("   Password: 1234")
    }
  } catch (error) {
    console.error("❌ Failed to reset test applicant:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run directly when executed as a script
resetTestApplicant()
