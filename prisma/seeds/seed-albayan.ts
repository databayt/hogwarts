// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Albayan School Tenant Seed
 *
 * Creates the Albayan (البيان) tenant: a Sudan-curriculum school with a full
 * functional account set (admin + teacher + student + parent) so every
 * dashboard renders real, non-empty data — the same shape as the demo school.
 *
 * The Sudan curriculum is attached by calling the app's real catalog-setup
 * functions (setupDefaultsForSchool → setupCatalogForSchool), which find the
 * already-seeded SD national catalog subjects and create the academic
 * structure + SubjectSelection bridge rows. We do NOT hand-roll grades.
 *
 * Idempotent — safe to run multiple times.
 *
 * Usage:
 *   npx tsx prisma/seeds/seed-albayan.ts
 */

// Load central .env FIRST so process.env.DATABASE_URL is populated before
// the transitively-imported @/lib/db reads it at module scope.
import "dotenv/config"

import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

import {
  setupCatalogForSchool,
  setupDefaultsForSchool,
} from "@/lib/catalog-setup"

const prisma = new PrismaClient()

// ---------------------------------------------------------------------------
// Identity & constants
// ---------------------------------------------------------------------------

const DOMAIN = "albayan"
const PASSWORD = "1234"

const ADMIN_EMAIL = "admin@albayan.edu"
const TEACHER_EMAIL = "teacher@albayan.edu"
const STUDENT_EMAIL = "student@albayan.edu"
const PARENT_EMAIL = "parent@albayan.edu"

// Demo people (Arabic primary names — single-language storage convention)
const TEACHER_NAME = { first: "فاطمة", last: "حسن", gender: "F" as const }
const STUDENT_NAME = { first: "محمد", last: "علي", gender: "M" as const }
const PARENT_NAME = { first: "علي", last: "علي" } // father, shares student surname

// Guardian relationship types (Arabic) — mirror prisma/seeds/constants.ts
const GUARDIAN_TYPES = [
  "الأب", // Father
  "الأم", // Mother
  "ولي الأمر", // Guardian
  "الجد/الجدة", // Grandparent
  "الأخ/الأخت", // Sibling
]

// ---------------------------------------------------------------------------
// School
// ---------------------------------------------------------------------------

async function createSchool() {
  console.log("🔍 Checking Albayan school...")

  const school = await prisma.school.upsert({
    where: { domain: DOMAIN },
    update: {
      name: "البيان",
      nameEn: "Albayan",
      isActive: true,
      isPublished: true,
    },
    create: {
      name: "البيان", // Arabic primary (preferredLanguage = ar)
      nameEn: "Albayan", // English display name (used for locale = en)
      domain: DOMAIN,
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

// ---------------------------------------------------------------------------
// Users (login accounts)
// ---------------------------------------------------------------------------

type Role = "ADMIN" | "TEACHER" | "STUDENT" | "GUARDIAN"

async function createUser(
  schoolId: string,
  email: string,
  username: string,
  role: Role
) {
  const hashedPassword = await bcrypt.hash(PASSWORD, 10)

  const user = await prisma.user.upsert({
    where: { email_schoolId: { email, schoolId } },
    update: {
      username,
      password: hashedPassword,
      role,
      emailVerified: new Date(),
    },
    create: {
      email,
      username,
      password: hashedPassword,
      role,
      schoolId,
      emailVerified: new Date(),
    },
  })

  console.log(`✅ ${role} user ready: ${user.email}`)
  return user
}

// ---------------------------------------------------------------------------
// Guardian types
// ---------------------------------------------------------------------------

async function seedGuardianTypes(schoolId: string) {
  console.log("🔍 Setting up guardian types...")
  const map = new Map<string, string>()

  for (const name of GUARDIAN_TYPES) {
    const record = await prisma.guardianType.upsert({
      where: { schoolId_name: { schoolId, name } },
      update: {},
      create: { schoolId, name },
    })
    map.set(name, record.id)
  }

  console.log(`  ✅ ${map.size} guardian types`)
  return map
}

// ---------------------------------------------------------------------------
// School year & section (minimal enrollment scaffolding for the demo student)
// ---------------------------------------------------------------------------

async function ensureSchoolYear(schoolId: string) {
  const yearName = "2026/2027"
  const schoolYear = await prisma.schoolYear.upsert({
    where: { schoolId_yearName: { schoolId, yearName } },
    update: {},
    create: {
      schoolId,
      yearName,
      startDate: new Date("2026-09-01"),
      endDate: new Date("2027-06-30"),
    },
  })
  console.log(`  ✅ School year: ${schoolYear.yearName}`)
  return schoolYear
}

async function ensureSection(
  schoolId: string,
  grade: { id: string; name: string }
) {
  const letter = "A"
  const name = `${grade.name} - ${letter}`
  const section = await prisma.section.upsert({
    where: { schoolId_gradeId_letter: { schoolId, gradeId: grade.id, letter } },
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
  console.log(`  ✅ Section: ${section.name}`)
  return section
}

// ---------------------------------------------------------------------------
// Kindergarten (الروضة)
// ---------------------------------------------------------------------------

/**
 * Extend the academic structure with kindergarten.
 *
 * setupCatalogForSchool only generates grades 1-12 (the SD national catalog has
 * no KG subjects), so KG is added here as a dedicated AcademicLevel tagged
 * ELEMENTARY (the SchoolLevel enum has no KINDERGARTEN value) holding KG1/KG2
 * grades, each linked to the matching KG YearLevel created by
 * setupDefaultsForSchool and given one section. Idempotent.
 */
async function ensureKindergarten(schoolId: string) {
  console.log("🔍 Extending with kindergarten (الروضة)...")

  // Dedicated KG level — slug distinguishes it; level enum must be ELEMENTARY.
  const kgLevel = await prisma.academicLevel.upsert({
    where: { schoolId_slug: { schoolId, slug: "kindergarten" } },
    update: {},
    create: {
      schoolId,
      name: "مرحلة الروضة",
      slug: "kindergarten",
      lang: "ar",
      level: "ELEMENTARY", // SchoolLevel has no KINDERGARTEN; ELEMENTARY is closest
      levelOrder: 0, // before elementary (levelOrder 1)
      startGrade: -1,
      endGrade: 0,
    },
  })

  const KG_GRADES = [
    {
      slug: "kg1",
      name: "الروضة الأولى",
      gradeNumber: -1,
      yearLevelName: "KG1",
    },
    {
      slug: "kg2",
      name: "الروضة الثانية",
      gradeNumber: 0,
      yearLevelName: "KG2",
    },
  ]

  for (const kg of KG_GRADES) {
    const yearLevel = await prisma.yearLevel.findFirst({
      where: { schoolId, levelName: kg.yearLevelName },
      select: { id: true },
    })

    const grade = await prisma.academicGrade.upsert({
      where: {
        schoolId_gradeNumber: { schoolId, gradeNumber: kg.gradeNumber },
      },
      update: {
        name: kg.name,
        slug: kg.slug,
        levelId: kgLevel.id,
        yearLevelId: yearLevel?.id ?? null,
      },
      create: {
        schoolId,
        levelId: kgLevel.id,
        yearLevelId: yearLevel?.id ?? null,
        name: kg.name,
        slug: kg.slug,
        lang: "ar",
        gradeNumber: kg.gradeNumber,
        maxStudents: 25,
      },
    })

    const letter = "A"
    await prisma.section.upsert({
      where: {
        schoolId_gradeId_letter: { schoolId, gradeId: grade.id, letter },
      },
      update: { maxCapacity: 25 },
      create: {
        schoolId,
        gradeId: grade.id,
        name: `${kg.name} - ${letter}`,
        letter,
        lang: "ar",
        maxCapacity: 25,
      },
    })

    console.log(`  ✅ ${kg.name} (KG) + section ready`)
  }
}

// ---------------------------------------------------------------------------
// Domain records: Teacher / Student / Guardian (idempotent via findFirst-by-userId)
// ---------------------------------------------------------------------------

async function createTeacher(schoolId: string, userId: string) {
  const existing = await prisma.teacher.findFirst({
    where: { schoolId, userId },
  })
  if (existing) {
    console.log(
      `✅ Teacher record exists: ${existing.firstName} ${existing.lastName}`
    )
    return existing
  }

  const teacher = await prisma.teacher.create({
    data: {
      schoolId,
      userId,
      emailAddress: TEACHER_EMAIL,
      employeeId: "T0001",
      firstName: TEACHER_NAME.first,
      lastName: TEACHER_NAME.last,
      gender: TEACHER_NAME.gender,
      employmentStatus: "ACTIVE",
      employmentType: "FULL_TIME",
      joiningDate: new Date(),
    },
  })
  console.log(`✅ Teacher created: ${teacher.firstName} ${teacher.lastName}`)
  return teacher
}

async function createStudent(
  schoolId: string,
  userId: string,
  grade: { id: string; yearLevelId: string | null },
  sectionId: string,
  schoolYearId: string
) {
  const grNumber = "GR0001"

  const student = await prisma.student.upsert({
    where: { schoolId_grNumber: { schoolId, grNumber } },
    update: {
      userId,
      firstName: STUDENT_NAME.first,
      lastName: STUDENT_NAME.last,
      gender: STUDENT_NAME.gender,
      academicGradeId: grade.id,
      sectionId,
      status: "ACTIVE",
    },
    create: {
      schoolId,
      userId,
      grNumber,
      firstName: STUDENT_NAME.first,
      lastName: STUDENT_NAME.last,
      gender: STUDENT_NAME.gender,
      dateOfBirth: new Date("2010-05-15"), // ~16yo for Grade 10
      nationality: "SD",
      currentAddress: "الخرطوم",
      city: "الخرطوم",
      country: "SD",
      email: STUDENT_EMAIL,
      enrollmentDate: new Date(),
      status: "ACTIVE",
      studentType: "REGULAR",
      academicGradeId: grade.id,
      sectionId,
    },
  })
  console.log(
    `✅ Student created: ${student.firstName} ${student.lastName} (Grade 10)`
  )

  // Link to year level (web dashboard / promotion parity). Skip if Grade 10's
  // YearLevel link is somehow absent — StudentYearLevel.levelId is required.
  if (grade.yearLevelId) {
    await prisma.studentYearLevel.upsert({
      where: {
        schoolId_studentId_yearId: {
          schoolId,
          studentId: student.id,
          yearId: schoolYearId,
        },
      },
      update: { levelId: grade.yearLevelId },
      create: {
        schoolId,
        studentId: student.id,
        levelId: grade.yearLevelId,
        yearId: schoolYearId,
      },
    })
    console.log("  ✅ Student linked to year level")
  } else {
    console.log(
      "  ⚠️  Grade 10 has no linked YearLevel — skipped StudentYearLevel"
    )
  }

  return student
}

async function createGuardian(
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
        emailAddress: PARENT_EMAIL,
        firstName: PARENT_NAME.first,
        lastName: PARENT_NAME.last,
      },
    })
    console.log(
      `✅ Guardian created: ${guardian.firstName} ${guardian.lastName}`
    )
  } else {
    console.log(
      `✅ Guardian record exists: ${guardian.firstName} ${guardian.lastName}`
    )
  }

  // Link guardian → student (father, primary)
  await prisma.studentGuardian.upsert({
    where: {
      schoolId_studentId_guardianId: {
        schoolId,
        studentId,
        guardianId: guardian.id,
      },
    },
    update: { guardianTypeId, isPrimary: true },
    create: {
      schoolId,
      studentId,
      guardianId: guardian.id,
      guardianTypeId,
      isPrimary: true,
    },
  })

  // Contact phone
  const phoneNumber = "+249912345678"
  await prisma.guardianPhoneNumber.upsert({
    where: {
      schoolId_guardianId_phoneNumber: {
        schoolId,
        guardianId: guardian.id,
        phoneNumber,
      },
    },
    update: {},
    create: {
      schoolId,
      guardianId: guardian.id,
      phoneNumber,
      phoneType: "mobile",
      isPrimary: true,
    },
  })
  console.log("  ✅ Guardian linked to student (father, primary)")

  return guardian
}

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

async function main() {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log("🏫 ALBAYAN (البيان) — Tenant Setup")
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

  try {
    // 1. School
    const school = await createSchool()
    const schoolId = school.id

    // 2. Login accounts
    const adminUser = await createUser(
      schoolId,
      ADMIN_EMAIL,
      "أحمد إبراهيم",
      "ADMIN"
    )
    const teacherUser = await createUser(
      schoolId,
      TEACHER_EMAIL,
      `${TEACHER_NAME.first} ${TEACHER_NAME.last}`,
      "TEACHER"
    )
    const studentUser = await createUser(
      schoolId,
      STUDENT_EMAIL,
      `${STUDENT_NAME.first} ${STUDENT_NAME.last}`,
      "STUDENT"
    )
    const parentUser = await createUser(
      schoolId,
      PARENT_EMAIL,
      `${PARENT_NAME.first} ${PARENT_NAME.last}`,
      "GUARDIAN"
    )
    void adminUser // admin needs no domain record

    // 3. Defaults (YearLevels/Departments/ScoreRanges) — MUST precede catalog
    console.log("🔍 Provisioning school defaults...")
    const defaults = await setupDefaultsForSchool(schoolId, "both")
    console.log(
      `  ✅ Defaults: ${defaults.yearLevels} year levels, ${defaults.departments} departments, ${defaults.scoreRanges} score ranges`
    )

    // 4. Sudan curriculum — AcademicLevels/Grades/Streams + SubjectSelections.
    // Idempotent: skipIfExists bails if academic structure already exists.
    console.log("🔍 Attaching Sudan curriculum...")
    await setupCatalogForSchool(schoolId, { skipIfExists: true })

    const selectionCount = await prisma.subjectSelection.count({
      where: { schoolId },
    })
    console.log(`  ✅ Subject selections: ${selectionCount}`)

    // 4b. Kindergarten — added after catalog (KG isn't in the SD catalog)
    await ensureKindergarten(schoolId)

    // 5. Look up Grade 10 (الصف العاشر) by gradeNumber
    const grade10 = await prisma.academicGrade.findUnique({
      where: { schoolId_gradeNumber: { schoolId, gradeNumber: 10 } },
      select: { id: true, name: true, yearLevelId: true },
    })
    if (!grade10) {
      throw new Error(
        "Grade 10 AcademicGrade not found after catalog setup — cannot enroll demo student."
      )
    }

    // 6. Enrollment scaffolding
    console.log("🔍 Setting up enrollment scaffolding...")
    const schoolYear = await ensureSchoolYear(schoolId)
    const section = await ensureSection(schoolId, grade10)
    const guardianTypeMap = await seedGuardianTypes(schoolId)

    // 7. Domain records
    console.log("🔍 Creating domain records...")
    await createTeacher(schoolId, teacherUser.id)
    const student = await createStudent(
      schoolId,
      studentUser.id,
      grade10,
      section.id,
      schoolYear.id
    )
    const fatherTypeId = guardianTypeMap.get("الأب")
    if (!fatherTypeId) throw new Error("Guardian type 'الأب' not found")
    await createGuardian(schoolId, parentUser.id, student.id, fatherTypeId)

    // 8. Summary
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log("✅ Albayan tenant ready!")
    console.log("")
    console.log("  Production: https://albayan.databayt.org")
    console.log("  Local dev:  http://albayan.localhost:3000")
    console.log("")
    console.log(`  Admin login:   ${ADMIN_EMAIL}`)
    console.log(`  Teacher login: ${TEACHER_EMAIL}`)
    console.log(`  Student login: ${STUDENT_EMAIL}  (Grade 10)`)
    console.log(`  Parent login:  ${PARENT_EMAIL}  (guardian of student)`)
    console.log(`  Password:      ${PASSWORD}`)
    console.log("")
    console.log("  Curriculum:    Sudan national (السوداني الوطني)")
    console.log("  Grades:        KG1–KG2 (الروضة) + Grade 1–12")
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  } catch (error) {
    console.error("❌ Failed:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
