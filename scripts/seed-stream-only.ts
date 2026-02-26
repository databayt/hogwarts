// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Seed Stream Courses Only
 *
 * Standalone script to seed stream courses with ClickView content.
 * Run after main seed completes or if you need to update just courses.
 *
 * Usage: pnpm tsx scripts/seed-stream-only.ts
 */

import { PrismaClient } from "@prisma/client"

import { seedStreamCourses } from "../prisma/seeds/stream"

const prisma = new PrismaClient()

async function main() {
  console.log("🎬 Stream Course Seeder")
  console.log("=======================\n")

  // Get the demo school
  const school = await prisma.school.findFirst({
    where: { domain: "demo" },
  })

  if (!school) {
    console.error("❌ Demo school not found. Run pnpm db:seed first.")
    process.exit(1)
  }

  console.log(`📍 School: ${school.name} (${school.domain})`)

  // Get admin users
  const adminUsers = await prisma.user.findMany({
    where: {
      schoolId: school.id,
      role: { in: ["ADMIN", "DEVELOPER"] },
    },
    select: { id: true, username: true, email: true, role: true },
  })

  if (adminUsers.length === 0) {
    console.error("❌ No admin users found. Run pnpm db:seed first.")
    process.exit(1)
  }

  console.log(`👤 Admin Users: ${adminUsers.length}`)
  console.log("")

  // Clear existing stream data for fresh seed
  console.log("🧹 Clearing existing stream data...")

  await prisma.streamChapter.deleteMany({
    where: {
      course: { schoolId: school.id },
    },
  })

  await prisma.streamCourse.deleteMany({
    where: { schoolId: school.id },
  })

  await prisma.streamCategory.deleteMany({
    where: { schoolId: school.id },
  })

  console.log("   ✅ Cleared courses, chapters, and categories")
  console.log("")

  // Seed stream courses
  console.log("📚 Seeding stream courses...")
  const courseCount = await seedStreamCourses(
    prisma,
    school.id,
    [], // subjects not used
    adminUsers.map((u) => ({
      id: u.id,
      name: u.username || "",
      email: u.email || "",
      role: u.role,
    }))
  )

  console.log("")
  console.log("=======================")
  console.log(`✅ Done! Created ${courseCount} courses`)
  console.log("   View at: https://demo.databayt.org/en/stream/courses")
}

main()
  .catch((error) => {
    console.error("❌ Error:", error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
