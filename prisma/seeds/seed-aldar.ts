// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Aldar Education Demo Seed
 *
 * Creates the Aldar Education demo tenant for the UAE pitch.
 * Currency AED, country AE, timezone Asia/Dubai, Arabic UI.
 *
 * Seeds: school + admin + parent + student + fee structure + assignment.
 * Idempotent — safe to re-run.
 *
 * Usage:
 *   pnpm db:seed:aldar
 *   or
 *   tsx prisma/seeds/seed-aldar.ts
 *
 * After running, demo at:
 *   aldar.localhost:3000/ar
 *   admin: admin@aldar.ae / 1234
 *   parent: parent@aldar.ae / 1234
 *   student: student@aldar.ae / 1234
 */

import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

const PASSWORD = "1234"
const SCHOOL_DOMAIN = "aldar"
const ACADEMIC_YEAR = "2026-2027"
const TUITION_AED = 12000

const ADMIN_EMAIL = "admin@aldar.ae"
const PARENT_EMAIL = "parent@aldar.ae"
const STUDENT_EMAIL = "student@aldar.ae"

async function upsertSchool() {
  console.log("🏫 Aldar school...")
  const school = await prisma.school.upsert({
    where: { domain: SCHOOL_DOMAIN },
    update: {
      country: "AE",
      timezone: "Asia/Dubai",
      currency: "AED",
      preferredLanguage: "ar",
      isActive: true,
      isPublished: true,
    },
    create: {
      name: "مدرسة الدار التعليمية",
      domain: SCHOOL_DOMAIN,
      email: ADMIN_EMAIL,
      address: "أبوظبي، الإمارات العربية المتحدة",
      city: "أبوظبي",
      state: "أبوظبي",
      country: "AE",
      timezone: "Asia/Dubai",
      preferredLanguage: "ar",
      currency: "AED",
      planType: "premium",
      maxStudents: 5000,
      maxTeachers: 500,
      maxClasses: 200,
      isActive: true,
      isPublished: true,
      onboardingCompletedAt: new Date(),
      schoolType: "private",
      schoolLevel: "both",
    },
  })
  console.log(`✅ ${school.name} (${school.domain})`)
  return school
}

async function upsertUser(
  email: string,
  username: string,
  role: "ADMIN" | "GUARDIAN" | "STUDENT",
  schoolId: string
) {
  const hashedPassword = await bcrypt.hash(PASSWORD, 10)
  const user = await prisma.user.upsert({
    where: { email_schoolId: { email, schoolId } },
    update: { role, emailVerified: new Date() },
    create: {
      email,
      username,
      password: hashedPassword,
      role,
      schoolId,
      emailVerified: new Date(),
    },
  })
  console.log(`✅ ${role} ${user.email}`)
  return user
}

async function upsertSchoolYear(schoolId: string) {
  const yearName = ACADEMIC_YEAR
  const existing = await prisma.schoolYear.findFirst({
    where: { schoolId, yearName },
  })
  if (existing) {
    console.log(`✅ School year ${yearName} exists`)
    return existing
  }
  const sy = await prisma.schoolYear.create({
    data: {
      schoolId,
      yearName,
      startDate: new Date("2026-09-01"),
      endDate: new Date("2027-06-30"),
    },
  })
  console.log(`✅ School year ${sy.yearName}`)
  return sy
}

async function upsertYearLevel(schoolId: string) {
  const existing = await prisma.yearLevel.findFirst({
    where: { schoolId, levelOrder: 6 },
  })
  if (existing) return existing
  const yl = await prisma.yearLevel.create({
    data: {
      schoolId,
      levelName: "الصف السادس",
      levelOrder: 6,
      lang: "ar",
    },
  })
  console.log(`✅ Year level ${yl.levelName}`)
  return yl
}

async function upsertGuardianType(schoolId: string) {
  const existing = await prisma.guardianType.findFirst({
    where: { schoolId, name: "Father" },
  })
  if (existing) return existing
  const gt = await prisma.guardianType.create({
    data: { schoolId, name: "Father" },
  })
  console.log(`✅ Guardian type ${gt.name}`)
  return gt
}

async function upsertStudent(
  schoolId: string,
  userId: string,
  yearLevelId: string,
  schoolYearId: string
) {
  const grNumber = "ALD-001"
  let student = await prisma.student.findFirst({
    where: { schoolId, grNumber },
  })
  if (!student) {
    student = await prisma.student.create({
      data: {
        schoolId,
        userId,
        grNumber,
        firstName: "أحمد",
        lastName: "المنصوري",
        lang: "ar",
        dateOfBirth: new Date("2014-05-15"),
        gender: "male",
        nationality: "AE",
        enrollmentDate: new Date("2026-09-01"),
      },
    })
    console.log(`✅ Student ${student.firstName} ${student.lastName}`)
  }

  // Link student to year level
  const existingYl = await prisma.studentYearLevel.findFirst({
    where: { schoolId, studentId: student.id, yearId: schoolYearId },
  })
  if (!existingYl) {
    await prisma.studentYearLevel.create({
      data: {
        schoolId,
        studentId: student.id,
        levelId: yearLevelId,
        yearId: schoolYearId,
      },
    })
    console.log(`✅ Student linked to year level`)
  }

  return student
}

async function upsertGuardian(
  schoolId: string,
  userId: string,
  studentId: string,
  guardianTypeId: string
) {
  let guardian = await prisma.guardian.findFirst({
    where: { schoolId, userId },
  })
  if (!guardian) {
    guardian = await prisma.guardian.create({
      data: {
        schoolId,
        userId,
        firstName: "محمد",
        lastName: "المنصوري",
        lang: "ar",
        emailAddress: PARENT_EMAIL,
      },
    })
    console.log(`✅ Guardian ${guardian.firstName} ${guardian.lastName}`)
  }

  const existingLink = await prisma.studentGuardian.findFirst({
    where: { schoolId, studentId, guardianId: guardian.id },
  })
  if (!existingLink) {
    await prisma.studentGuardian.create({
      data: {
        schoolId,
        studentId,
        guardianId: guardian.id,
        guardianTypeId,
        isPrimary: true,
      },
    })
    console.log(`✅ Student-guardian link created`)
  }

  return guardian
}

async function upsertFeeStructure(schoolId: string) {
  const name = "الرسوم الدراسية - الفصل الأول"
  let fs = await prisma.feeStructure.findFirst({
    where: { schoolId, name, academicYear: ACADEMIC_YEAR },
  })
  if (!fs) {
    fs = await prisma.feeStructure.create({
      data: {
        schoolId,
        name,
        academicYear: ACADEMIC_YEAR,
        description: "رسوم الفصل الدراسي الأول للعام 2026-2027",
        tuitionFee: TUITION_AED,
        totalAmount: TUITION_AED,
        installments: 3,
        paymentSchedule: [
          {
            dueDate: "2026-09-15",
            amount: 4000,
            description: "القسط الأول",
          },
          {
            dueDate: "2026-11-15",
            amount: 4000,
            description: "القسط الثاني",
          },
          {
            dueDate: "2027-01-15",
            amount: 4000,
            description: "القسط الثالث",
          },
        ],
        isActive: true,
      },
    })
    console.log(`✅ Fee structure: ${fs.name} (AED ${TUITION_AED})`)
  }
  return fs
}

async function upsertFeeAssignment(
  schoolId: string,
  studentId: string,
  feeStructureId: string
) {
  const existing = await prisma.feeAssignment.findUnique({
    where: {
      studentId_feeStructureId_academicYear: {
        studentId,
        feeStructureId,
        academicYear: ACADEMIC_YEAR,
      },
    },
  })
  if (existing) {
    console.log(`✅ Fee assignment exists (${existing.id})`)
    return existing
  }
  const assignment = await prisma.feeAssignment.create({
    data: {
      schoolId,
      studentId,
      feeStructureId,
      academicYear: ACADEMIC_YEAR,
      finalAmount: TUITION_AED,
      status: "PENDING",
    },
  })
  console.log(`✅ Fee assignment ${assignment.id} (AED ${TUITION_AED})`)
  return assignment
}

async function main() {
  console.log("\n🇦🇪 Aldar Education demo seed\n" + "─".repeat(50))

  const school = await upsertSchool()
  const admin = await upsertUser(ADMIN_EMAIL, "Aldar Admin", "ADMIN", school.id)
  const parentUser = await upsertUser(
    PARENT_EMAIL,
    "Aldar Parent",
    "GUARDIAN",
    school.id
  )
  const studentUser = await upsertUser(
    STUDENT_EMAIL,
    "Aldar Student",
    "STUDENT",
    school.id
  )

  const schoolYear = await upsertSchoolYear(school.id)
  const yearLevel = await upsertYearLevel(school.id)
  const guardianType = await upsertGuardianType(school.id)

  const student = await upsertStudent(
    school.id,
    studentUser.id,
    yearLevel.id,
    schoolYear.id
  )
  await upsertGuardian(school.id, parentUser.id, student.id, guardianType.id)

  const feeStructure = await upsertFeeStructure(school.id)
  const assignment = await upsertFeeAssignment(
    school.id,
    student.id,
    feeStructure.id
  )

  console.log("\n" + "─".repeat(50))
  console.log("✨ Aldar demo seeded successfully")
  console.log(`\nDemo URLs (run \`pnpm dev\` first):`)
  console.log(`  Marketing: http://${SCHOOL_DOMAIN}.localhost:3000/ar`)
  console.log(`  Admin:     http://${SCHOOL_DOMAIN}.localhost:3000/ar/finance`)
  console.log(
    `  Parent picker: http://${SCHOOL_DOMAIN}.localhost:3000/ar/finance/fees/assignments/${assignment.id}`
  )
  console.log(`\nLogins (password: ${PASSWORD}):`)
  console.log(`  ${admin.email}   (ADMIN)`)
  console.log(`  ${parentUser.email}  (GUARDIAN)`)
  console.log(`  ${studentUser.email} (STUDENT)\n`)
}

main()
  .catch((err) => {
    console.error("\n❌ Aldar seed failed:", err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
