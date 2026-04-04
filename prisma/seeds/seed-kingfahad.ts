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

const ADMIN_PASSWORD = "1234"
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

async function createAcademicStructure(schoolId: string) {
  console.log("🔍 Setting up academic structure...")

  // --- AcademicLevels ---
  const LEVELS = [
    {
      name: "المرحلة الابتدائية",
      slug: "elementary",
      level: "ELEMENTARY" as const,
      levelOrder: 1,
      startGrade: 1,
      endGrade: 6,
    },
    {
      name: "المرحلة المتوسطة",
      slug: "middle",
      level: "MIDDLE" as const,
      levelOrder: 2,
      startGrade: 7,
      endGrade: 9,
    },
    {
      name: "المرحلة الثانوية",
      slug: "high",
      level: "HIGH" as const,
      levelOrder: 3,
      startGrade: 10,
      endGrade: 12,
    },
  ]

  const levelIds = new Map<string, string>()
  for (const lvl of LEVELS) {
    const record = await prisma.academicLevel.upsert({
      where: { schoolId_slug: { schoolId, slug: lvl.slug } },
      update: {
        name: lvl.name,
        level: lvl.level,
        levelOrder: lvl.levelOrder,
        startGrade: lvl.startGrade,
        endGrade: lvl.endGrade,
      },
      create: {
        schoolId,
        name: lvl.name,
        slug: lvl.slug,
        lang: "ar",
        level: lvl.level,
        levelOrder: lvl.levelOrder,
        startGrade: lvl.startGrade,
        endGrade: lvl.endGrade,
      },
    })
    levelIds.set(lvl.slug, record.id)
  }
  console.log(`  ✅ ${LEVELS.length} academic levels`)

  // --- AcademicGrades ---
  // KG grades map to yearLevel orders 0,1; grades 1-12 map to orders 2-13
  const GRADES = [
    { name: "الروضة الأولى", slug: "kg1", gradeNumber: -1, yearLevelOrder: 0 },
    { name: "الروضة الثانية", slug: "kg2", gradeNumber: 0, yearLevelOrder: 1 },
    { name: "الصف الأول", slug: "grade-1", gradeNumber: 1, yearLevelOrder: 2 },
    {
      name: "الصف الثاني",
      slug: "grade-2",
      gradeNumber: 2,
      yearLevelOrder: 3,
    },
    {
      name: "الصف الثالث",
      slug: "grade-3",
      gradeNumber: 3,
      yearLevelOrder: 4,
    },
    {
      name: "الصف الرابع",
      slug: "grade-4",
      gradeNumber: 4,
      yearLevelOrder: 5,
    },
    {
      name: "الصف الخامس",
      slug: "grade-5",
      gradeNumber: 5,
      yearLevelOrder: 6,
    },
    {
      name: "الصف السادس",
      slug: "grade-6",
      gradeNumber: 6,
      yearLevelOrder: 7,
    },
    {
      name: "الصف السابع",
      slug: "grade-7",
      gradeNumber: 7,
      yearLevelOrder: 8,
    },
    {
      name: "الصف الثامن",
      slug: "grade-8",
      gradeNumber: 8,
      yearLevelOrder: 9,
    },
    {
      name: "الصف التاسع",
      slug: "grade-9",
      gradeNumber: 9,
      yearLevelOrder: 10,
    },
    {
      name: "الصف العاشر",
      slug: "grade-10",
      gradeNumber: 10,
      yearLevelOrder: 11,
    },
    {
      name: "الصف الحادي عشر",
      slug: "grade-11",
      gradeNumber: 11,
      yearLevelOrder: 12,
    },
    {
      name: "الصف الثاني عشر",
      slug: "grade-12",
      gradeNumber: 12,
      yearLevelOrder: 13,
    },
  ]

  // Fetch existing yearLevels for linking
  const yearLevels = await prisma.yearLevel.findMany({
    where: { schoolId },
    orderBy: { levelOrder: "asc" },
  })
  const yearLevelByOrder = new Map(yearLevels.map((yl) => [yl.levelOrder, yl]))

  const gradeIds: { id: string; gradeNumber: number; name: string }[] = []

  for (const g of GRADES) {
    const levelSlug =
      g.gradeNumber >= 1 && g.gradeNumber <= 6
        ? "elementary"
        : g.gradeNumber >= 7 && g.gradeNumber <= 9
          ? "middle"
          : g.gradeNumber >= 10 && g.gradeNumber <= 12
            ? "high"
            : "elementary" // KG → elementary
    const levelId = levelIds.get(levelSlug)!
    const yearLevel = yearLevelByOrder.get(g.yearLevelOrder)

    const record = await prisma.academicGrade.upsert({
      where: {
        schoolId_gradeNumber: { schoolId, gradeNumber: g.gradeNumber },
      },
      update: {
        name: g.name,
        slug: g.slug,
        levelId,
        yearLevelId: yearLevel?.id ?? null,
      },
      create: {
        schoolId,
        levelId,
        yearLevelId: yearLevel?.id ?? null,
        name: g.name,
        slug: g.slug,
        lang: "ar",
        gradeNumber: g.gradeNumber,
        maxStudents: 30,
      },
    })
    gradeIds.push({ id: record.id, gradeNumber: g.gradeNumber, name: g.name })
  }
  console.log(`  ✅ ${GRADES.length} academic grades`)

  return gradeIds
}

async function createSections(
  schoolId: string,
  grades: { id: string; gradeNumber: number; name: string }[]
) {
  console.log("🔍 Setting up sections (2 per grade, 30 capacity)...")

  let created = 0
  for (const grade of grades) {
    for (let i = 0; i < 2; i++) {
      const letter = String.fromCharCode(65 + i) // A, B
      const name = `${grade.name} - ${letter}`

      try {
        await prisma.section.upsert({
          where: { schoolId_name: { schoolId, name } },
          update: { maxCapacity: 30 },
          create: {
            schoolId,
            gradeId: grade.id,
            name,
            letter,
            lang: "ar",
            maxCapacity: 30,
          },
        })
        created++
      } catch {
        // Skip if already exists with different constraints
      }
    }
  }

  console.log(`  ✅ ${created} sections created`)
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
    const grades = await createAcademicStructure(school.id)
    await createSections(school.id, grades)

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
