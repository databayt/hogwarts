// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Auto-Recovery Seed for Demo School
 *
 * This script ensures the demo school exists on every deployment.
 * It is SAFE to run multiple times (idempotent).
 *
 * Features:
 * - Runs on every Vercel deployment (via build script)
 * - Creates demo school if missing
 * - NEVER deletes any data
 * - Safe for contributors to run
 *
 * Usage:
 *   tsx prisma/seeds/ensure-demo.ts
 *
 * This script is automatically run during build:
 *   pnpm build → prisma generate → ensure-demo.ts → next build
 */

import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

import { DEMO_PASSWORD, DEMO_SCHOOL } from "./constants"

const prisma = new PrismaClient()

async function ensureDemoSchool() {
  console.log("🔍 Checking demo school...")

  const existing = await prisma.school.findUnique({
    where: { domain: "demo" },
    select: { id: true, name: true, domain: true },
  })

  if (existing) {
    console.log(`✅ Demo school exists: ${existing.name} (${existing.id})`)
    return existing
  }

  console.log("⚠️ Demo school missing, creating...")

  // Create the demo school with only existing schema fields
  const school = await prisma.school.create({
    data: {
      name: DEMO_SCHOOL.name,
      domain: DEMO_SCHOOL.domain,
      email: DEMO_SCHOOL.email,
      website: DEMO_SCHOOL.website,
      phoneNumber: DEMO_SCHOOL.phone,
      address: DEMO_SCHOOL.address,
      timezone: DEMO_SCHOOL.timezone,
      preferredLanguage: DEMO_SCHOOL.preferredLanguage,
      planType: DEMO_SCHOOL.planType,
      maxStudents: DEMO_SCHOOL.maxStudents,
      maxTeachers: DEMO_SCHOOL.maxTeachers,
      isActive: true,
      // Weather coordinates for Khartoum, Sudan
      latitude: 15.5007,
      longitude: 32.5599,
    },
  })

  console.log(`✅ Demo school created: ${school.name} (${school.id})`)
  return school
}

async function ensureAdminUser(schoolId: string) {
  console.log("🔍 Checking admin user...")

  const existingAdmin = await prisma.user.findFirst({
    where: {
      email: "admin@databayt.org",
      schoolId,
    },
    select: { id: true, email: true },
  })

  if (existingAdmin) {
    console.log(`✅ Admin user exists: ${existingAdmin.email}`)
    return existingAdmin
  }

  console.log("⚠️ Admin user missing, creating...")

  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10)

  const admin = await prisma.user.upsert({
    where: {
      email_schoolId: {
        email: "admin@databayt.org",
        schoolId,
      },
    },
    update: {},
    create: {
      email: "admin@databayt.org",
      password: hashedPassword,
      role: "ADMIN",
      emailVerified: new Date(),
      schoolId,
    },
  })

  console.log(`✅ Admin user created: ${admin.email}`)
  return admin
}

async function main() {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log("🌱 ENSURE DEMO - Auto-Recovery Seed")
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

  try {
    // Ensure demo school exists
    const school = await ensureDemoSchool()

    // Ensure admin user exists
    await ensureAdminUser(school.id)

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log("✅ Demo environment verified")
    console.log(`🌐 URL: https://demo.databayt.org`)
    console.log(`📧 Admin: admin@databayt.org`)
    console.log(`🔑 Password: ${DEMO_PASSWORD}`)
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  } catch (error) {
    // Database errors (quota exceeded, connection issues) should NOT fail the build
    // The app can still work, just demo might not be available
    console.warn(
      "⚠️ Demo seed skipped (database unavailable):",
      (error as Error).message || error
    )
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log("⏭️ Continuing build without demo verification...")
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  } finally {
    try {
      await prisma.$disconnect()
    } catch {
      // Ignore disconnect errors
    }
  }
}

// Handle unhandled rejections gracefully
process.on("unhandledRejection", (reason) => {
  console.warn("⚠️ Unhandled rejection in ensure-demo (ignored):", reason)
})

main().then(() => {
  // Force clean exit after completion
  process.exit(0)
})
