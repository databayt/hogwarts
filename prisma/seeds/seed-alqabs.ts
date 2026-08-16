// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Al-Qabas Schools (مدارس القبس) Tenant Seed — Port Sudan
 *
 * Private Sudanese-curriculum school covering elementary, middle and high.
 * Reachable on every registered root domain once seeded (School.domain is the
 * tenant identity — see src/lib/root-domain.ts):
 *   https://alqabs.balqalam.com   https://alqabs.databayt.org
 *   http://alqabs.localhost:3000  (dev)
 *
 * Unlike seed-kingfahad.ts this does NOT hand-roll the academic structure — it
 * drives the production provisioning pipeline (setupDefaultsForSchool →
 * setupCatalogForSchool → repairProvisioning), so the tenant is identical to
 * one created through onboarding and picks up the SD national curriculum from
 * School.country alone.
 *
 * Idempotent — safe to re-run.
 *
 * Usage:
 *   pnpm db:seed:alqabs
 *   tsx prisma/seeds/seed-alqabs.ts
 */

// MUST be first: @/lib/db reads process.env.DATABASE_URL at module scope, and
// Prisma's own .env load lands too late for that const.
import "dotenv/config"

import { createHash } from "node:crypto"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import bcrypt from "bcryptjs"

import { db } from "@/lib/db"
import { getS3Client } from "@/lib/s3"
import {
  getProvisioningStatus,
  repairProvisioning,
} from "@/components/catalog/provision"
import {
  setupCatalogForSchool,
  setupDefaultsForSchool,
} from "@/components/catalog/setup"

const PASSWORD = "1234"
const DOMAIN = "alqabs"
const EMAIL_DOMAIN = "alqabs.edu"
const ACADEMIC_YEAR = "2026-2027"

const email = (local: string) => `${local}@${EMAIL_DOMAIN}`

const ADMIN_EMAIL = email("admin")
const PRINCIPAL_EMAIL = email("principal")
const STAFF_EMAIL = email("staff")
const ACCOUNTANT_EMAIL = email("accountant")
const TEACHER_EMAIL = email("teacher")
const STUDENT_EMAIL = email("student")
const PARENT_EMAIL = email("parent")
const USER_EMAIL = email("user")
const APPLICANT_EMAIL = email("applicant")

type SchoolRole =
  | "ADMIN"
  | "STAFF"
  | "ACCOUNTANT"
  | "TEACHER"
  | "STUDENT"
  | "GUARDIAN"

// ============================================================================
// School
// ============================================================================

async function upsertSchool() {
  console.log("🏫 Al-Qabas schools...")

  const common = {
    name: "مدارس القبس",
    nameEn: "Al-Qabas Schools",
    address: "بورتسودان، ولاية البحر الأحمر، السودان",
    city: "بورتسودان",
    state: "البحر الأحمر",
    country: "SD",
    // Resolved from the Google Maps pin (Plus Code J67F+QC6, Port Sudan).
    latitude: 19.614423,
    longitude: 37.2235097,
    timezone: "Africa/Khartoum",
    preferredLanguage: "ar",
    currency: "SDG",
    schoolType: "private",
    schoolLevel: "both",
    isActive: true,
    isPublished: true,
  }

  // Explicit select: this script runs a locally-generated client against remote
  // databases that may lag the schema. Selecting only what we use keeps a
  // not-yet-pushed column from turning the very first query into a P2022.
  const school = await db.school.upsert({
    where: { domain: DOMAIN },
    update: common,
    create: {
      ...common,
      domain: DOMAIN,
      email: ADMIN_EMAIL,
      planType: "premium",
      maxStudents: 2000,
      maxTeachers: 200,
      maxClasses: 60,
      onboardingCompletedAt: new Date(),
    },
    select: { id: true, name: true, domain: true },
  })

  console.log(`✅ ${school.name} (${school.domain})`)
  return school
}

// ============================================================================
// Users
// ============================================================================

async function upsertSchoolUser(
  userEmail: string,
  username: string,
  role: SchoolRole,
  schoolId: string
) {
  const hashedPassword = await bcrypt.hash(PASSWORD, 10)
  const user = await db.user.upsert({
    where: { email_schoolId: { email: userEmail, schoolId } },
    update: { role, username, emailVerified: new Date() },
    create: {
      email: userEmail,
      username,
      password: hashedPassword,
      role,
      schoolId,
      emailVerified: new Date(),
    },
    select: { id: true, email: true, role: true },
  })
  console.log(`  ✅ ${role.padEnd(10)} ${user.email}`)
  return user
}

/**
 * Platform users carry schoolId = null, so the email_schoolId composite key
 * can't address them — find-then-create is the only correct shape here.
 */
async function upsertPlatformUser(
  userEmail: string,
  username: string,
  label: string
) {
  const hashedPassword = await bcrypt.hash(PASSWORD, 10)
  const existing = await db.user.findFirst({
    where: { email: userEmail, schoolId: null },
    orderBy: { createdAt: "asc" },
    select: { id: true, emailVerified: true },
  })

  if (existing) {
    await db.user.update({
      where: { id: existing.id },
      data: {
        username,
        password: hashedPassword,
        role: "USER",
        emailVerified: existing.emailVerified ?? new Date(),
      },
    })
    console.log(`  ✅ USER       ${userEmail} (${label})`)
    return existing
  }

  const user = await db.user.create({
    data: {
      email: userEmail,
      username,
      password: hashedPassword,
      role: "USER",
      schoolId: null,
      emailVerified: new Date(),
    },
    select: { id: true },
  })
  console.log(`  ✅ USER       ${userEmail} (${label})`)
  return user
}

// ============================================================================
// Domain records — staff, teacher, student, guardian
// ============================================================================

async function upsertStaffMember(
  schoolId: string,
  userId: string,
  data: {
    employeeId: string
    firstName: string
    lastName: string
    emailAddress: string
    position: string
    gender: string
  }
) {
  const staff = await db.staffMember.upsert({
    where: {
      schoolId_emailAddress: { schoolId, emailAddress: data.emailAddress },
    },
    update: { position: data.position, userId },
    create: {
      schoolId,
      userId,
      employeeId: data.employeeId,
      firstName: data.firstName,
      lastName: data.lastName,
      emailAddress: data.emailAddress,
      position: data.position,
      gender: data.gender,
      joiningDate: new Date("2026-09-01"),
      city: "بورتسودان",
      state: "البحر الأحمر",
      country: "SD",
    },
    select: { id: true, position: true },
  })
  console.log(
    `  ✅ StaffMember ${data.firstName} ${data.lastName} — ${staff.position}`
  )
  return staff
}

async function upsertTeacher(schoolId: string, userId: string) {
  const teacher = await db.teacher.upsert({
    where: { schoolId_emailAddress: { schoolId, emailAddress: TEACHER_EMAIL } },
    update: { userId },
    create: {
      schoolId,
      userId,
      employeeId: "QBS-T-001",
      firstName: "عثمان",
      lastName: "إدريس",
      lang: "ar",
      gender: "male",
      nationality: "SD",
      emailAddress: TEACHER_EMAIL,
      joiningDate: new Date("2026-09-01"),
      city: "بورتسودان",
      state: "البحر الأحمر",
      country: "SD",
    },
    select: { id: true, firstName: true, lastName: true },
  })
  console.log(`  ✅ Teacher ${teacher.firstName} ${teacher.lastName}`)
  return teacher
}

async function upsertStudent(schoolId: string, userId: string) {
  const grNumber = "QBS-0001"

  // Place the student in grade 7 (middle stage) — provisioned by the catalog
  // pipeline, so both the grade and its sections already exist.
  const grade = await db.academicGrade.findFirst({
    where: { schoolId, gradeNumber: 7 },
    select: { id: true, name: true },
  })
  const section = grade
    ? await db.section.findFirst({
        where: { schoolId, gradeId: grade.id },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      })
    : null

  let student = await db.student.findFirst({
    where: { schoolId, grNumber },
    select: { id: true, firstName: true, lastName: true },
  })

  if (!student) {
    student = await db.student.create({
      data: {
        schoolId,
        userId,
        grNumber,
        firstName: "مريم",
        lastName: "الطيب",
        lang: "ar",
        dateOfBirth: new Date("2013-03-11"),
        gender: "female",
        nationality: "SD",
        email: STUDENT_EMAIL,
        city: "بورتسودان",
        state: "البحر الأحمر",
        country: "SD",
        enrollmentDate: new Date("2026-09-01"),
        academicGradeId: grade?.id ?? null,
        sectionId: section?.id ?? null,
      },
      select: { id: true, firstName: true, lastName: true },
    })
    console.log(
      `  ✅ Student ${student.firstName} ${student.lastName}` +
        (section ? ` → ${section.name}` : " (no section available)")
    )
  } else {
    await db.student.update({
      where: { id: student.id },
      data: {
        userId,
        academicGradeId: grade?.id ?? undefined,
        sectionId: section?.id ?? undefined,
      },
    })
    console.log(
      `  ✅ Student ${student.firstName} ${student.lastName} (exists)`
    )
  }

  // Enrollment row — needs a SchoolYear, which repairProvisioning created.
  const schoolYear = await db.schoolYear.findFirst({
    where: { schoolId },
    orderBy: { startDate: "desc" },
    select: { id: true, yearName: true },
  })
  const yearLevel = await db.yearLevel.findFirst({
    where: { schoolId, levelName: { contains: "7" } },
    select: { id: true },
  })

  if (schoolYear && yearLevel) {
    const existing = await db.studentYearLevel.findFirst({
      where: { schoolId, studentId: student.id, yearId: schoolYear.id },
      select: { id: true },
    })
    if (!existing) {
      await db.studentYearLevel.create({
        data: {
          schoolId,
          studentId: student.id,
          levelId: yearLevel.id,
          yearId: schoolYear.id,
        },
      })
    }
    console.log(`  ✅ Enrolled in ${schoolYear.yearName}`)
  } else {
    console.warn("  ⚠️  No SchoolYear/YearLevel — enrollment row skipped")
  }

  return student
}

async function upsertGuardian(
  schoolId: string,
  userId: string,
  studentId: string
) {
  let guardianType = await db.guardianType.findFirst({
    where: { schoolId, name: "Father" },
    select: { id: true },
  })
  if (!guardianType) {
    guardianType = await db.guardianType.create({
      data: { schoolId, name: "Father" },
      select: { id: true },
    })
  }

  let guardian = await db.guardian.findFirst({
    where: { schoolId, emailAddress: PARENT_EMAIL },
    select: { id: true, firstName: true, lastName: true },
  })
  if (!guardian) {
    guardian = await db.guardian.create({
      data: {
        schoolId,
        userId,
        firstName: "الطيب",
        lastName: "الطيب",
        lang: "ar",
        emailAddress: PARENT_EMAIL,
      },
      select: { id: true, firstName: true, lastName: true },
    })
  }
  console.log(`  ✅ Guardian ${guardian.firstName} ${guardian.lastName}`)

  const link = await db.studentGuardian.findFirst({
    where: { schoolId, studentId, guardianId: guardian.id },
    select: { id: true },
  })
  if (!link) {
    await db.studentGuardian.create({
      data: {
        schoolId,
        studentId,
        guardianId: guardian.id,
        guardianTypeId: guardianType.id,
        isPrimary: true,
      },
    })
  }
  console.log("  ✅ Student ↔ guardian linked")

  return guardian
}

// ============================================================================
// Logo
// ============================================================================

const LOGO_PATH = join(__dirname, "assets", "alqabs-logo.png")

/**
 * Upload the school logo to S3 and point School.logoUrl at it.
 *
 * The key is content-addressed, so re-running uploads the same object and
 * produces the same URL — idempotent, and a replaced logo file gets a fresh
 * key rather than being served from a stale cache.
 *
 * Deliberately the DIRECT S3 URL, never cdn.databayt.org: the CDN fronts the
 * curated bucket, not this upload bucket, and 403s on every fresh upload.
 * Mirrors AWSS3Provider.upload() and the `${schoolId}/logos/…` path built by
 * uploadFile() (src/components/file/upload/actions.ts).
 */
async function uploadLogo(schoolId: string) {
  console.log("\n🎨 Logo...")

  if (!existsSync(LOGO_PATH)) {
    console.warn(`  ⚠️  ${LOGO_PATH} missing — skipping (logoUrl unchanged)`)
    return
  }

  const client = getS3Client()
  const bucket = process.env.AWS_S3_BUCKET
  if (!client || !bucket) {
    console.warn("  ⚠️  S3 not configured (AWS_* env) — skipping")
    return
  }

  const body = readFileSync(LOGO_PATH)
  const digest = createHash("sha256").update(body).digest("hex").slice(0, 12)
  const key = `${schoolId}/logos/alqabs-logo-${digest}.png`
  const region = process.env.AWS_REGION || "us-east-1"
  const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: "image/png",
      Metadata: { schoolId, originalName: "alqabs-logo.png" },
    })
  )

  await db.school.update({ where: { id: schoolId }, data: { logoUrl: url } })
  console.log(`  ✅ ${url}`)
}

// ============================================================================
// Admission — gives the applicant account something to do
// ============================================================================

async function upsertAdmission(schoolId: string) {
  console.log("📝 Admission...")

  const name = `قبول العام الدراسي ${ACADEMIC_YEAR}`
  const campaign = await db.admissionCampaign.upsert({
    where: { schoolId_name: { schoolId, name } },
    update: {},
    create: {
      schoolId,
      name,
      academicYear: ACADEMIC_YEAR,
      description: `التسجيل مفتوح للعام الدراسي ${ACADEMIC_YEAR} لجميع المراحل الدراسية`,
      startDate: new Date("2026-04-01"),
      endDate: new Date("2026-09-30"),
      totalSeats: 400,
      applicationFee: 0,
      status: "OPEN",
    },
    select: { name: true },
  })
  console.log(`  ✅ Campaign ${campaign.name}`)

  const existing = await db.admissionSettings.findUnique({
    where: { schoolId },
    select: { id: true },
  })
  if (!existing) {
    await db.admissionSettings.create({
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
  }
  console.log("  ✅ Admission settings")
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log("🏫 مدارس القبس — Al-Qabas Tenant Setup")
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

  const school = await upsertSchool()
  const schoolId = school.id

  // --- Academic structure via the production pipeline (order matters:
  // academic grades link to YearLevels, so defaults must precede catalog) ---
  console.log("\n📚 Academic structure...")
  const defaults = await setupDefaultsForSchool(schoolId, "both")
  console.log(
    `  ✅ defaults: ${defaults.yearLevels} year levels, ${defaults.departments} departments, ${defaults.scoreRanges} score ranges`
  )

  await setupCatalogForSchool(schoolId)
  const selections = await db.subjectSelection.count({ where: { schoolId } })
  console.log(`  ✅ catalog: ${selections} subject selections`)

  const repair = await repairProvisioning(schoolId)
  console.log(
    `  ✅ provisioning: repaired [${repair.repaired.join(", ") || "nothing missing"}]`
  )
  if (repair.failed.length > 0) {
    for (const f of repair.failed) {
      console.warn(`  ⚠️  stage ${f.stage} failed: ${f.error}`)
    }
  }

  // --- Accounts ---
  console.log("\n👥 School accounts...")
  await upsertSchoolUser(ADMIN_EMAIL, "إدارة القبس", "ADMIN", schoolId)

  // No PRINCIPAL value exists in UserRole — the principal is a STAFF login
  // distinguished by their StaffMember.position.
  const principalUser = await upsertSchoolUser(
    PRINCIPAL_EMAIL,
    "أبو بكر جيكوني",
    "STAFF",
    schoolId
  )
  const staffUser = await upsertSchoolUser(
    STAFF_EMAIL,
    "سمية عبد الله",
    "STAFF",
    schoolId
  )
  const accountantUser = await upsertSchoolUser(
    ACCOUNTANT_EMAIL,
    "خالد بابكر",
    "ACCOUNTANT",
    schoolId
  )
  const teacherUser = await upsertSchoolUser(
    TEACHER_EMAIL,
    "عثمان إدريس",
    "TEACHER",
    schoolId
  )
  const studentUser = await upsertSchoolUser(
    STUDENT_EMAIL,
    "مريم الطيب",
    "STUDENT",
    schoolId
  )
  const parentUser = await upsertSchoolUser(
    PARENT_EMAIL,
    "الطيب الطيب",
    "GUARDIAN",
    schoolId
  )

  console.log("\n👤 Platform accounts...")
  await upsertPlatformUser(USER_EMAIL, "زائر القبس", "tour visitor")
  await upsertPlatformUser(APPLICANT_EMAIL, "مقدم طلب", "applicant")

  // --- Domain records ---
  console.log("\n🗂️  Domain records...")
  await upsertStaffMember(schoolId, principalUser.id, {
    employeeId: "QBS-S-001",
    firstName: "أبو بكر",
    lastName: "جيكوني",
    emailAddress: PRINCIPAL_EMAIL,
    position: "مدير المدرسة",
    gender: "male",
  })
  await upsertStaffMember(schoolId, staffUser.id, {
    employeeId: "QBS-S-002",
    firstName: "سمية",
    lastName: "عبد الله",
    emailAddress: STAFF_EMAIL,
    position: "إداري",
    gender: "female",
  })
  await upsertStaffMember(schoolId, accountantUser.id, {
    employeeId: "QBS-S-003",
    firstName: "خالد",
    lastName: "بابكر",
    emailAddress: ACCOUNTANT_EMAIL,
    position: "محاسب",
    gender: "male",
  })
  await upsertTeacher(schoolId, teacherUser.id)
  const student = await upsertStudent(schoolId, studentUser.id)
  await upsertGuardian(schoolId, parentUser.id, student.id)

  await upsertAdmission(schoolId)
  await uploadLogo(schoolId)

  // --- Report ---
  const status = await getProvisioningStatus(schoolId)
  console.log("\n📊 Provisioning status")
  console.log(`  healthy: ${status.healthy}`)
  if (status.missing.length > 0) {
    console.log(`  missing: ${status.missing.join(", ")}`)
  }
  console.log(
    `  levels ${status.counts.academicLevels} · grades ${status.counts.academicGrades} · streams ${status.counts.academicStreams} · subjects ${status.counts.subjectSelections}`
  )
  console.log(
    `  years ${status.counts.schoolYears} · terms ${status.counts.terms} · periods ${status.counts.periods} · sections ${status.counts.sections} · timetable ${status.counts.timetableSlots}`
  )

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log("✅ Al-Qabas tenant ready")
  console.log("")
  console.log("  https://alqabs.balqalam.com/ar")
  console.log("  https://alqabs.databayt.org/ar")
  console.log("  http://alqabs.localhost:3000/ar   (dev)")
  console.log("")
  console.log(`  ${ADMIN_EMAIL.padEnd(26)} ADMIN`)
  console.log(`  ${PRINCIPAL_EMAIL.padEnd(26)} STAFF (مدير المدرسة)`)
  console.log(`  ${STAFF_EMAIL.padEnd(26)} STAFF`)
  console.log(`  ${ACCOUNTANT_EMAIL.padEnd(26)} ACCOUNTANT`)
  console.log(`  ${TEACHER_EMAIL.padEnd(26)} TEACHER`)
  console.log(`  ${STUDENT_EMAIL.padEnd(26)} STUDENT`)
  console.log(`  ${PARENT_EMAIL.padEnd(26)} GUARDIAN`)
  console.log(`  ${USER_EMAIL.padEnd(26)} USER (platform)`)
  console.log(`  ${APPLICANT_EMAIL.padEnd(26)} USER (platform, applicant)`)
  console.log(`  password: ${PASSWORD}`)
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
}

main()
  .catch((error) => {
    console.error("❌ Failed:", error)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
