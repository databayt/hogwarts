// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Seed System Orchestrator
 *
 * Main entry point for seeding the Hogwarts school database.
 * Executes all seed phases in dependency order.
 *
 * Usage:
 *   pnpm db:seed
 *
 * Expected Output (Enhanced):
 *   - 1 School (demo.databayt.org)
 *   - 3104 Users (all roles)
 *   - 100 Teachers (+ qualifications, experience, expertise)
 *   - 1000 Students (K-12 distribution)
 *   - 2000 Guardians (2 per student)
 *   - 14 Year Levels (KG1-12)
 *   - 6 Departments
 *   - 62 US Subjects (K-12)
 *   - 30+ Classrooms
 *   - 400+ Classes
 *   - 200+ Assignments + 500 Submissions
 *   - 10,000+ Attendance records (10 days)
 *   - 2 Fiscal Years + 200 Expenses + 100 Journal Entries
 *   - 1000 Fee Records + 500 Payments
 *   - 100 Library Borrow Records
 *   - 50 Conversations + 300 Messages
 *   - 500+ Notifications
 *   - 50 Admission Applications
 *   - 500+ Audit Logs
 *   - 50 Health Records + 25 Disciplinary + 35 Achievements
 */

// dotenv MUST load before any module that reads DATABASE_URL at import time.
// The production provisioning pipeline (@/components/catalog/setup) pulls in
// the @/lib/db singleton, which reads process.env.DATABASE_URL on first import.
// On Vercel the env is already injected (no .env file) so this is a no-op there.
import "dotenv/config"

import { PrismaClient } from "@prisma/client"

import { autoGenerateTimetableForSchool } from "@/components/catalog/provision"
import {
  setupCatalogForSchool,
  setupDefaultsForSchool,
} from "@/components/catalog/setup"

import {
  seedDepartments,
  seedPeriods,
  seedSchoolYear,
  seedTerms,
  seedYearLevels,
} from "./academic"
import { seedAdmission } from "./admission"
import { seedAnnouncements } from "./announcements"
import { seedAssignments, seedAssignmentSubmissions } from "./assignments"
import { seedAttendance } from "./attendance"
import {
  seedAttendanceExcuses,
  seedAttendanceInterventions,
} from "./attendance-extras"
import { seedAuditLogs } from "./audit"
import { seedAllUsers } from "./auth"
import { seedBanking } from "./banking"
import { seedCatalogBooks } from "./catalog/books"
import { seedCatalog } from "./catalog/index"
import { seedAllClasses } from "./classes"
import { seedClassrooms } from "./classrooms"
import { SEED_IS_LITE, SEED_IS_MEDIUM } from "./constants"
import { seedEvents } from "./events"
import { seedExamResults, seedExams, seedGradingConfig } from "./exams"
import { seedFees } from "./fees"
import { seedFinanceComplete } from "./finance"
import { seedGamification } from "./gamification"
import { seedGrades } from "./grades"
import { seedWellness } from "./health"
import { seedInvoices } from "./invoices"
import { seedLibrary } from "./library"
import { seedMessaging } from "./messages"
import { seedNotifications } from "./notifications"
import { seedPayroll } from "./payroll"
import { seedAllPeople, seedStudentDocuments } from "./people"
import { seedProfileActivity } from "./profile-activity"
import { seedProfileExtras } from "./profile-extras"
import { seedQBank } from "./qbank"
import { seedSchoolWithBranding } from "./school"
import { seedStaffMembers } from "./staff-members"
import { seedStreamCourses, seedStreamEnrollments } from "./stream"
import { seedSubjects } from "./subjects"
import type { SeedContext } from "./types"
import {
  logHeader,
  logPhase,
  logSuccess,
  logSummary,
  measureDuration,
} from "./utils"
import { seedWallets } from "./wallet"

// ============================================================================
// SEED STATUS — the single source of truth for "is the demo fully seeded?"
// Shared by the in-seed short-circuit (below) and ensure-demo.ts (prebuild).
// Two metrics, not one: students prove Phase 2 (users) ran; classes prove the
// run reached Phase 6. A partial seed (users but no classes) is NOT "full".
// ============================================================================

// Lite/medium profiles lower the "fully seeded" bar to match their smaller
// output so ensure-demo.ts takes the fast path instead of re-growing the demo
// to full on every deploy. Each bound sits safely below what that profile
// produces (lite ~52 students; medium ~380 students / ~156 classes).
export const SEED_THRESHOLDS: { students: number; classes: number } =
  SEED_IS_LITE
    ? { students: 30, classes: 5 }
    : SEED_IS_MEDIUM
      ? { students: 250, classes: 50 }
      : { students: 500, classes: 100 }

export async function getDemoSeedStatus(
  prisma: PrismaClient,
  schoolId: string
): Promise<{ students: number; classes: number; fullySeeded: boolean }> {
  const [students, classes] = await Promise.all([
    prisma.user.count({ where: { schoolId, role: "STUDENT" } }),
    prisma.class.count({ where: { schoolId } }),
  ])
  return {
    students,
    classes,
    fullySeeded:
      students >= SEED_THRESHOLDS.students &&
      classes >= SEED_THRESHOLDS.classes,
  }
}

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

export async function seedMain(externalPrisma?: PrismaClient) {
  const startTime = Date.now()
  const prisma = externalPrisma ?? new PrismaClient()
  const ownsConnection = !externalPrisma

  try {
    logHeader()

    // Build context progressively through phases
    const context: Partial<SeedContext> = { prisma }

    // ========================================================================
    // PHASE 0: GLOBAL CATALOG
    // ========================================================================
    logPhase(0, "GLOBAL CATALOG", "الكتالوج العالمي")

    const catalogSubjects = await measureDuration(
      "Catalog (Subjects, Chapters, Lessons)",
      () => seedCatalog(prisma)
    )

    // ========================================================================
    // PHASE 1: CORE FOUNDATION
    // ========================================================================
    logPhase(1, "CORE FOUNDATION", "الأساس")

    const school = await measureDuration("School + Branding", () =>
      seedSchoolWithBranding(prisma)
    )
    context.school = school
    context.schoolId = school.id

    // ========================================================================
    // SHORT-CIRCUIT — skip the heavy phases when the demo is already fully
    // seeded. prebuild (ensure-demo.ts) runs this against the PROD demo on
    // every Vercel deploy; the per-phase guards already prevent duplication,
    // but this two-metric check lets a healthy demo exit in seconds instead
    // of re-walking ~30 phases. A PARTIAL seed (users created but classes
    // never reached) fails the classes check, falls through, and the
    // idempotent phases resume only the missing work.
    // ========================================================================
    // SEED_FORCE=1 bypasses the short-circuit and re-walks every phase (which
    // is safe — all phases are idempotent). Useful for an operator forcing a
    // re-seed, and for verifying idempotency (run twice, assert equal counts).
    const seedStatus = await getDemoSeedStatus(prisma, school.id)
    if (process.env.SEED_FORCE !== "1" && seedStatus.fullySeeded) {
      console.log(
        `\n⚡ Demo already fully seeded (${seedStatus.students} students, ${seedStatus.classes} classes).`
      )
      console.log(
        "   Running an idempotency pass on users + academic structure, then exiting early.\n"
      )
      await measureDuration("Users (idempotency pass)", () =>
        seedAllUsers(prisma, school.id)
      )
      await measureDuration(
        "Academic Structure (idempotency pass)",
        async () => {
          const yr = await seedSchoolYear(prisma, school.id)
          await seedTerms(prisma, school.id, yr.id)
          await seedPeriods(prisma, school.id, yr.id)
          await seedYearLevels(prisma, school.id)
          await seedDepartments(prisma, school.id)
          await setupDefaultsForSchool(school.id, school.schoolLevel ?? "both")
          await setupCatalogForSchool(school.id, { skipIfExists: true })
        }
      )
      logSummary(startTime, {
        students: seedStatus.students,
        classes: seedStatus.classes,
      })
      return
    }

    // ========================================================================
    // PHASE 2: USER ACCOUNTS
    // ========================================================================
    logPhase(2, "USER ACCOUNTS", "حسابات المستخدمين")

    const { adminUsers, teacherUsers, studentUsers, guardianUsers, allUsers } =
      await measureDuration("All Users", () => seedAllUsers(prisma, school.id))
    context.users = allUsers

    // ========================================================================
    // PHASE 3: ACADEMIC STRUCTURE (unified on the production provisioning
    // pipeline — src/components/catalog/setup.ts, the same code path real
    // schools get at onboarding). The seed owns only the temporal/operational
    // structure (school year / terms / periods) and the demo's Arabic-named
    // YearLevels + Departments; setup.ts owns ScoreRanges and the catalog
    // academic structure (levels / grades / streams / subject selections).
    // ========================================================================
    const { schoolYear, terms, periods, yearLevels, departments } =
      await measureDuration("Academic Structure", async () => {
        const schoolYear = await seedSchoolYear(prisma, school.id)
        const terms = await seedTerms(prisma, school.id, schoolYear.id)
        const periods = await seedPeriods(prisma, school.id, schoolYear.id)
        // YearLevels + Departments keep the demo's Arabic names (levelOrder
        // 1=KG1 … 14=Grade 12 matches YEAR_LEVEL_DEFAULTS in setup.ts, so the
        // grade↔yearLevel mapping inside setupCatalogForSchool resolves
        // correctly). setupDefaultsForSchool below sees them (count > 0) and
        // only provisions ScoreRanges — no duplication, no name drift.
        const yearLevels = await seedYearLevels(prisma, school.id)
        const departments = await seedDepartments(prisma, school.id)
        return { schoolYear, terms, periods, yearLevels, departments }
      })
    context.schoolYear = schoolYear
    context.terms = terms
    context.periods = periods
    context.yearLevels = yearLevels
    context.departments = departments

    // Production defaults: only ScoreRanges are created here (YearLevels +
    // Departments already exist from above). Idempotent.
    await measureDuration(
      "Defaults (ScoreRanges via production pipeline)",
      () => setupDefaultsForSchool(school.id, school.schoolLevel ?? "both")
    )

    // Phase 3.5: catalog academic structure via the PRODUCTION pipeline —
    // replaces the retired hand-rolled catalog/demo.ts seedDemoSchool. Reads
    // the school's country/curriculum (SD) from the DB. skipIfExists (default)
    // makes it a fast no-op once the structure is provisioned.
    await measureDuration(
      "Catalog Academic Structure (production setupCatalogForSchool)",
      () => setupCatalogForSchool(school.id, { skipIfExists: true })
    )

    // ========================================================================
    // PHASE 4: SUBJECTS & CLASSROOMS
    // ========================================================================
    logPhase(4, "SUBJECTS & CLASSROOMS", "المواد والفصول")

    const subjects = await measureDuration("Subjects", () =>
      seedSubjects(prisma, school.id, departments)
    )
    context.subjects = subjects

    const classrooms = await measureDuration("Classrooms", () =>
      seedClassrooms(prisma, school.id)
    )
    context.classrooms = classrooms

    // ========================================================================
    // PHASE 5: PEOPLE (Enhanced with qualifications, experience, expertise)
    // ========================================================================
    const { teachers, students, guardians } = await measureDuration(
      "People",
      () =>
        seedAllPeople(
          prisma,
          school.id,
          teacherUsers,
          studentUsers,
          guardianUsers,
          departments,
          yearLevels,
          schoolYear,
          subjects // Pass subjects for teacher expertise
        )
    )
    context.teachers = teachers
    context.students = students
    context.guardians = guardians

    // Student Documents
    await measureDuration("Student Documents", () =>
      seedStudentDocuments(prisma, school.id, students, adminUsers)
    )

    // Staff Members (non-teaching staff)
    await measureDuration("Staff Members", () =>
      seedStaffMembers(prisma, school.id, departments, adminUsers)
    )

    // ========================================================================
    // PHASE 6: CLASSES & ENROLLMENTS
    // ========================================================================
    // Scope classes + timetable to the ACTIVE term, not blindly Term 1.
    // `seedTerms` derives which term is active from today's date, so a seed run
    // during the Term 2 window (Jan–Jun) marked Term 2 active while everything
    // below landed on Term 1 — `resolveActiveTerm` then read Term 2 and found
    // zero slots, rendering an empty grid on a school with 1,120 seeded slots.
    const term = terms.find((t) => t.isActive) ?? terms[0]

    const classes = await measureDuration("Classes & Enrollments", () =>
      seedAllClasses(
        prisma,
        school.id,
        subjects,
        yearLevels,
        teachers,
        students,
        classrooms,
        periods,
        term
      )
    )
    context.classes = classes

    // ========================================================================
    // PHASE 7: LMS / STREAM
    // ========================================================================
    logPhase(7, "LMS / STREAM", "نظام التعلم")

    await measureDuration("Stream Courses", () =>
      seedStreamCourses(prisma, school.id, subjects, adminUsers)
    )

    await measureDuration("Stream Enrollments", () =>
      seedStreamEnrollments(prisma, school.id, students)
    )

    await measureDuration("Library (with borrow records)", () =>
      seedLibrary(prisma, school.id, students)
    )

    await measureDuration("Catalog Books", () =>
      seedCatalogBooks(prisma, school.id)
    )

    // ========================================================================
    // PHASE 8: ASSIGNMENTS
    // ========================================================================
    await measureDuration("Assignments", () =>
      seedAssignments(
        prisma,
        school.id,
        classes,
        teachers,
        term.startDate,
        term.endDate
      )
    )

    await measureDuration("Submissions", () =>
      seedAssignmentSubmissions(prisma, school.id, students, classes, teachers)
    )

    // ========================================================================
    // PHASE 9: ANNOUNCEMENTS & EVENTS
    // ========================================================================
    await measureDuration("Announcements", () =>
      seedAnnouncements(prisma, school.id, adminUsers)
    )

    await measureDuration("Events", () => seedEvents(prisma, school.id))

    // ========================================================================
    // PHASE 10: EXAMS, QBANK & GRADES
    // ========================================================================
    await measureDuration("Exams", () =>
      seedExams(prisma, school.id, subjects, classes, term)
    )

    await measureDuration("Exam Results", () =>
      seedExamResults(prisma, school.id, students, classes)
    )

    await measureDuration("QBank", () =>
      seedQBank(prisma, school.id, subjects, adminUsers)
    )

    await measureDuration("Grading Config", () =>
      seedGradingConfig(prisma, school.id)
    )

    await measureDuration("Grades", () =>
      seedGrades(prisma, school.id, students, yearLevels, term)
    )

    // ========================================================================
    // PHASE 11: FINANCE (Enhanced with 2-year history)
    // ========================================================================
    await measureDuration("Finance (2-year history)", () =>
      seedFinanceComplete(prisma, school.id, departments, adminUsers[0] || null)
    )

    await measureDuration("Fees (with payments)", () =>
      seedFees(prisma, school.id, students, yearLevels)
    )

    await measureDuration("Invoices", () =>
      seedInvoices(prisma, school.id, students, adminUsers)
    )

    // Payroll (salary structures, runs, slips)
    await measureDuration("Payroll", () =>
      seedPayroll(prisma, school.id, teachers, adminUsers)
    )

    // ========================================================================
    // PHASE 12: BANKING
    // ========================================================================
    await measureDuration("Banking", () =>
      seedBanking(prisma, school.id, adminUsers)
    )

    await measureDuration("Wallets", () =>
      seedWallets(prisma, school.id, students, adminUsers)
    )

    // ========================================================================
    // PHASE 13: OPERATIONS
    // ========================================================================
    await measureDuration("Attendance", () =>
      seedAttendance(prisma, school.id, students, classes, teachers, periods)
    )

    // Attendance excuses and interventions (depends on attendance records)
    await measureDuration("Attendance Excuses", () =>
      seedAttendanceExcuses(prisma, school.id, students, adminUsers)
    )

    await measureDuration("Attendance Interventions", () =>
      seedAttendanceInterventions(
        prisma,
        school.id,
        students,
        teachers,
        adminUsers
      )
    )

    // Timetable comes from the PRODUCTION generator — the same path a real
    // school gets at onboarding — so the seed and onboarding share one source
    // of truth (mirrors the retirement of the hand-rolled catalog/demo.ts).
    // The legacy `seedTimetable` scheduled classes into whatever room was free
    // (offices, labs, the football field) and emitted classId-only rows with no
    // sectionId/subjectId, so nothing landed in a section's homeroom and the
    // section-based reads couldn't see it. The generator places each section in
    // its own homeroom and writes section+subject on every slot.
    // It only createMany's, so clear the term first to keep re-seeds idempotent.
    await measureDuration("Timetable", async () => {
      // Count-guard like every other phase. Without this the delete+regenerate
      // below runs on EVERY deploy: `ensure-demo` only fast-paths at >=500
      // students, and the lite demo has ~57, so prebuild walks the slow path
      // each time and would rebuild the grid (and reshuffle every teacher
      // assignment) on every push. SEED_FORCE=1 re-walks deliberately.
      const existing = await prisma.timetable.count({
        where: { schoolId: school.id, termId: term.id, weekOffset: 0 },
      })
      if (existing > 0 && process.env.SEED_FORCE !== "1") {
        logSuccess("Timetable", existing, "already seeded — skipped")
        return
      }
      await prisma.timetable.deleteMany({
        where: { schoolId: school.id, termId: term.id, weekOffset: 0 },
      })
      const result = await autoGenerateTimetableForSchool(school.id)
      logSuccess(
        "Timetable",
        result.slotsCreated,
        result.warnings.length > 0
          ? `${result.warnings.length} warnings (subject over-allocation)`
          : undefined
      )
    })

    // Gamification (badges, streaks, competitions)
    await measureDuration("Gamification", () =>
      seedGamification(prisma, school.id, students, classes)
    )

    // Profile extras (organizations, memberships, earned badges)
    await measureDuration("Profile extras", () =>
      seedProfileExtras(prisma, school.id)
    )

    // Profile activity (current-year attendance, feed, pins, messages, badges)
    await measureDuration("Profile activity", () =>
      seedProfileActivity(prisma, school.id)
    )

    // ========================================================================
    // PHASE 14: COMMUNICATIONS
    // ========================================================================
    await measureDuration("Messages & Conversations", () =>
      seedMessaging(prisma, school.id, teachers, students, adminUsers)
    )

    await measureDuration("Notifications", () =>
      seedNotifications(prisma, school.id, teachers, students, adminUsers)
    )

    // ========================================================================
    // PHASE 15: ADMISSION
    // ========================================================================
    await measureDuration("Admission (campaigns, applications)", () =>
      seedAdmission(prisma, school.id, yearLevels, adminUsers)
    )

    // ========================================================================
    // PHASE 16: COMPLIANCE & WELLNESS
    // ========================================================================
    await measureDuration("Audit Logs", () =>
      seedAuditLogs(prisma, school.id, allUsers)
    )

    await measureDuration("Health & Wellness", () =>
      seedWellness(prisma, school.id, students, teachers, adminUsers)
    )

    // ========================================================================
    // COMPLETION
    // ========================================================================
    logSummary(startTime, {
      catalogSubjects: catalogSubjects.length,
      users: allUsers.length,
      teachers: teachers.length,
      students: students.length,
      guardians: guardians.length,
      departments: departments.length,
      subjects: subjects.length,
      yearLevels: yearLevels.length,
      classrooms: classrooms.length,
      classes: classes.length,
    })
  } catch (error) {
    console.error("❌ Seed failed:", error)
    throw error
  } finally {
    // Only close the pool we opened. When ensure-demo.ts passes its own client
    // it owns the lifecycle, so disconnecting here would break its later work.
    if (ownsConnection) await prisma.$disconnect()
  }
}

// ============================================================================
// EXECUTION (CLI: `pnpm db:seed`)
// ============================================================================
//
// Guarded so that `import { seedMain } from "./index"` (ensure-demo.ts) does
// NOT trigger a full seed at import time. Only runs when this file is the
// process entrypoint (tsx prisma/seeds/index.ts). Strict: exits non-zero on
// failure, which is correct for an explicit manual seed.
if (process.argv[1] && /seeds[\\/]index\.ts$/.test(process.argv[1])) {
  seedMain()
    .then(() => {
      console.log("\n✅ Seed completed successfully!")
      process.exit(0)
    })
    .catch((error) => {
      console.error("❌ Seed failed:", error)
      process.exit(1)
    })
}
