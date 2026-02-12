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
 *   - 19 Subjects (bilingual)
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

import { PrismaClient } from "@prisma/client"

import { seedAcademicStructure } from "./academic"
import { seedAcademicStructureCatalog } from "./academic-structure-catalog"
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
import { seedCatalog } from "./catalog"
import { seedAllClasses } from "./classes"
import { seedClassrooms } from "./classrooms"
import { seedEvents } from "./events"
import { seedExamResults, seedExams, seedGradingConfig } from "./exams"
import { seedFees } from "./fees"
import { seedFinanceComplete } from "./finance"
import { seedGamification } from "./gamification"
import { seedGrades } from "./grades"
import { seedWellness } from "./health"
import { seedInvoices } from "./invoices"
import { seedLessons } from "./lessons"
import { seedLibrary } from "./library"
import { seedMessaging } from "./messages"
import { seedNotifications } from "./notifications"
import { seedPayroll } from "./payroll"
import { seedAllPeople, seedStudentDocuments } from "./people"
import { seedQBank } from "./qbank"
import { seedSchoolWithBranding } from "./school"
import { seedStaffMembers } from "./staff-members"
import { seedStreamCourses, seedStreamEnrollments } from "./stream"
import { seedSubjects } from "./subjects"
import { seedTimetable } from "./timetable"
import type { SeedContext } from "./types"
import { logHeader, logPhase, logSummary, measureDuration } from "./utils"

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

async function main() {
  const startTime = Date.now()
  const prisma = new PrismaClient()

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
    // PHASE 2: USER ACCOUNTS
    // ========================================================================
    logPhase(2, "USER ACCOUNTS", "حسابات المستخدمين")

    const { adminUsers, teacherUsers, studentUsers, guardianUsers, allUsers } =
      await measureDuration("All Users", () => seedAllUsers(prisma, school.id))
    context.users = allUsers

    // ========================================================================
    // PHASE 3: ACADEMIC STRUCTURE
    // ========================================================================
    const { schoolYear, terms, periods, departments, yearLevels } =
      await measureDuration("Academic Structure", () =>
        seedAcademicStructure(prisma, school.id)
      )
    context.schoolYear = schoolYear
    context.terms = terms
    context.periods = periods
    context.departments = departments
    context.yearLevels = yearLevels

    // Phase 3.5: Academic Structure + Catalog Bridge
    await measureDuration("Academic Structure + Catalog Bridge", () =>
      seedAcademicStructureCatalog(
        prisma,
        school.id,
        yearLevels,
        catalogSubjects,
        school.schoolLevel
      )
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
    const term = terms[0] // Use first term

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

    await measureDuration("Lessons", () =>
      seedLessons(prisma, school.id, classes)
    )

    await measureDuration("Library (with borrow records)", () =>
      seedLibrary(prisma, school.id, students)
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

    await measureDuration("Timetable", () =>
      seedTimetable(
        prisma,
        school.id,
        classes,
        teachers,
        classrooms,
        periods,
        term
      )
    )

    // Gamification (badges, streaks, competitions)
    await measureDuration("Gamification", () =>
      seedGamification(prisma, school.id, students, classes)
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
    await prisma.$disconnect()
  }
}

// ============================================================================
// EXECUTION
// ============================================================================

main()
  .then(() => {
    console.log("\n✅ Seed completed successfully!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("❌ Seed failed:", error)
    process.exit(1)
  })
