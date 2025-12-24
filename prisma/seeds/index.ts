/**
 * Seed System Orchestrator
 *
 * Main entry point for seeding the Hogwarts school database.
 * Executes all seed phases in dependency order.
 *
 * Usage:
 *   pnpm db:seed
 *
 * Expected Output:
 *   - 1 School (demo.databayt.org)
 *   - 3104 Users (all roles)
 *   - 100 Teachers (Arabic names)
 *   - 1000 Students (K-12 distribution)
 *   - 2000 Guardians (2 per student)
 *   - 14 Year Levels (KG1-12)
 *   - 6 Departments
 *   - 19 Subjects (bilingual)
 *   - 30+ Classrooms
 *   - 400+ Classes
 *   - 10,000+ Attendance records (10 days)
 *   - 10 Sample Invoices
 */

import { PrismaClient } from "@prisma/client"

import { seedAcademicStructure } from "./academic"
import { seedAnnouncements } from "./announcements"
import { seedAttendance } from "./attendance"
import { seedAllUsers } from "./auth"
import { seedBanking } from "./banking"
import { seedAllClasses } from "./classes"
import { seedClassrooms } from "./classrooms"
import { seedEvents } from "./events"
import { seedExamResults, seedExams } from "./exams"
import { seedFees } from "./fees"
import { seedFinance } from "./finance"
import { seedGrades } from "./grades"
import { seedInvoices } from "./invoices"
import { seedLessons } from "./lessons"
import { seedLibrary } from "./library"
import { seedAllPeople } from "./people"
import { seedQBank } from "./qbank"
import { seedSchoolWithBranding } from "./school"
import { seedStreamCourses } from "./stream"
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
    // PHASE 5: PEOPLE
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
          schoolYear
        )
    )
    context.teachers = teachers
    context.students = students
    context.guardians = guardians

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

    await measureDuration("Lessons", () =>
      seedLessons(prisma, school.id, classes)
    )

    await measureDuration("Library", () => seedLibrary(prisma, school.id))

    // ========================================================================
    // PHASE 8: ANNOUNCEMENTS & EVENTS
    // ========================================================================
    await measureDuration("Announcements", () =>
      seedAnnouncements(prisma, school.id, adminUsers)
    )

    await measureDuration("Events", () => seedEvents(prisma, school.id))

    // ========================================================================
    // PHASE 9: EXAMS, QBANK & GRADES
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

    await measureDuration("Grades", () =>
      seedGrades(prisma, school.id, students, yearLevels, term)
    )

    // ========================================================================
    // PHASE 10: FINANCE
    // ========================================================================
    await measureDuration("Finance", () => seedFinance(prisma, school.id))

    await measureDuration("Fees", () =>
      seedFees(prisma, school.id, students, yearLevels)
    )

    await measureDuration("Invoices", () =>
      seedInvoices(prisma, school.id, students, adminUsers)
    )

    // ========================================================================
    // PHASE 11: BANKING
    // ========================================================================
    await measureDuration("Banking", () =>
      seedBanking(prisma, school.id, adminUsers)
    )

    // ========================================================================
    // PHASE 12: OPERATIONS
    // ========================================================================
    await measureDuration("Attendance", () =>
      seedAttendance(prisma, school.id, students, classes, teachers)
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

    // ========================================================================
    // COMPLETION
    // ========================================================================
    logSummary(startTime, {
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
