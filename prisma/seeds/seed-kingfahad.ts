// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * King Fahad Schools Tenant Seed
 *
 * Creates the King Fahad Schools tenant for Ahmed Baha pilot.
 * Idempotent — safe to run multiple times.
 *
 * Usage:
 *   tsx prisma/seeds/seed-kingfahad.ts
 */

import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

const ADMIN_PASSWORD = "kingfahad2026"
const ADMIN_EMAIL = "admin@kingfahad.edu"

async function createSchool() {
  console.log("🔍 Checking King Fahad Schools...")

  const school = await prisma.school.upsert({
    where: { domain: "kingfahad" },
    update: {
      name: "مدارس الملك فهد",
      isActive: true,
    },
    create: {
      name: "مدارس الملك فهد",
      domain: "kingfahad",
      email: ADMIN_EMAIL,
      address: "الخرطوم، السودان",
      city: "الخرطوم",
      state: "الخرطوم",
      country: "SD",
      timezone: "Africa/Khartoum",
      preferredLanguage: "ar",
      currency: "SDG",
      planType: "premium",
      maxStudents: 2000,
      maxTeachers: 200,
      maxClasses: 60,
      isActive: true,
      isPublished: true,
      onboardingCompletedAt: new Date(),
      schoolType: "private",
      schoolLevel: "both",
    },
  })

  console.log(`✅ School ready: ${school.name} (${school.domain})`)
  return school
}

async function createAdmin(schoolId: string) {
  console.log("🔍 Checking admin user...")

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10)

  const admin = await prisma.user.upsert({
    where: {
      email_schoolId: {
        email: ADMIN_EMAIL,
        schoolId,
      },
    },
    update: {},
    create: {
      email: ADMIN_EMAIL,
      username: "أحمد بهاء",
      password: hashedPassword,
      role: "ADMIN",
      schoolId,
      emailVerified: new Date(),
    },
  })

  console.log(`✅ Admin user ready: ${admin.email}`)
  return admin
}

async function createAdmissionCampaign(schoolId: string) {
  console.log("🔍 Checking admission campaign...")

  const campaignName = "قبول العام الدراسي 2026-2027"

  const campaign = await prisma.admissionCampaign.upsert({
    where: {
      schoolId_name: {
        schoolId,
        name: campaignName,
      },
    },
    update: {},
    create: {
      schoolId,
      name: campaignName,
      academicYear: "2026-2027",
      description:
        "التسجيل مفتوح للعام الدراسي الجديد 2026-2027 لجميع المراحل الدراسية",
      startDate: new Date("2026-04-01"),
      endDate: new Date("2026-09-30"),
      totalSeats: 500,
      applicationFee: 0,
      status: "OPEN",
    },
  })

  console.log(`✅ Campaign ready: ${campaign.name}`)
  return campaign
}

async function createAdmissionSettings(schoolId: string) {
  console.log("🔍 Checking admission settings...")

  const existing = await prisma.admissionSettings.findUnique({
    where: { schoolId },
  })

  if (existing) {
    console.log("✅ Admission settings exist")
    return existing
  }

  const settings = await prisma.admissionSettings.create({
    data: {
      schoolId,
      enableOnlinePayment: false,
      paymentMethods: ["cash"],
      offerExpiryDays: 14,
      enablePublicPortal: true,
      enableInquiryForm: true,
      enableTourBooking: true,
      autoEmailNotifications: true,
    },
  })

  console.log("✅ Admission settings created")
  return settings
}

async function createYearLevels(schoolId: string) {
  console.log("🔍 Setting up year levels...")

  const levels = [
    { levelName: "KG1", levelOrder: 0 },
    { levelName: "KG2", levelOrder: 1 },
    { levelName: "الصف الأول", levelOrder: 2 },
    { levelName: "الصف الثاني", levelOrder: 3 },
    { levelName: "الصف الثالث", levelOrder: 4 },
    { levelName: "الصف الرابع", levelOrder: 5 },
    { levelName: "الصف الخامس", levelOrder: 6 },
    { levelName: "الصف السادس", levelOrder: 7 },
    { levelName: "الصف السابع", levelOrder: 8 },
    { levelName: "الصف الثامن", levelOrder: 9 },
    { levelName: "الصف التاسع", levelOrder: 10 },
    { levelName: "الصف العاشر", levelOrder: 11 },
    { levelName: "الصف الحادي عشر", levelOrder: 12 },
    { levelName: "الصف الثاني عشر", levelOrder: 13 },
  ]

  for (const level of levels) {
    await prisma.yearLevel.upsert({
      where: {
        schoolId_levelName: {
          schoolId,
          levelName: level.levelName,
        },
      },
      update: {},
      create: {
        schoolId,
        ...level,
      },
    })
  }

  console.log(`✅ ${levels.length} year levels ready`)
}

async function main() {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log("🏫 KING FAHAD SCHOOLS — Tenant Setup")
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

  try {
    const school = await createSchool()
    await createAdmin(school.id)
    await createAdmissionCampaign(school.id)
    await createAdmissionSettings(school.id)
    await createYearLevels(school.id)

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log("✅ King Fahad Schools tenant ready!")
    console.log("")
    console.log("  Production: https://kingfahad.databayt.org")
    console.log("  Local dev:  http://kingfahad.localhost:3000")
    console.log("")
    console.log(`  Admin login: ${ADMIN_EMAIL}`)
    console.log(`  Password:    ${ADMIN_PASSWORD}`)
    console.log("")
    console.log("  Admission:   Campaign open (Apr 2026 – Sep 2026)")
    console.log("  Apply URL:   /ar/s/kingfahad/application")
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  } catch (error) {
    console.error("❌ Failed:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
