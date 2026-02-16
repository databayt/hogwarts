/**
 * Single Seed Runner
 *
 * Runs ONE seed module against the existing demo school.
 * Resolves dependencies from the database - never re-seeds foundations.
 *
 * Usage:
 *   pnpm db:seed:single subjects
 *   pnpm db:seed:single finance
 *   pnpm db:seed:single --list
 *
 * ~1-5 seconds vs 60-120s for full seed.
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
import { seedCatalogImages } from "./catalog-images"
import { seedAllClasses } from "./classes"
import { seedClassrooms } from "./classrooms"
import { seedClickViewCatalog } from "./clickview-catalog"
import { seedClickViewImages } from "./clickview-images"
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
import type {
  ClassRef,
  ClassroomRef,
  DepartmentRef,
  PeriodRef,
  SchoolRef,
  StudentRef,
  SubjectRef,
  TeacherRef,
  TermRef,
  UserRef,
  YearLevelRef,
} from "./types"
import { measureDuration } from "./utils"

// ============================================================================
// DB RESOLVERS - Fetch existing data instead of re-seeding
// ============================================================================

async function resolveSchool(prisma: PrismaClient): Promise<SchoolRef> {
  const school = await prisma.school.findFirst({
    where: { domain: "demo" },
    select: { id: true, name: true, domain: true },
  })
  if (!school) {
    throw new Error("Demo school not found. Run full seed first: pnpm db:seed")
  }
  return school
}

async function resolveUsers(
  prisma: PrismaClient,
  schoolId: string
): Promise<{
  allUsers: UserRef[]
  adminUsers: UserRef[]
  teacherUsers: UserRef[]
  studentUsers: UserRef[]
  guardianUsers: UserRef[]
}> {
  const users = await prisma.user.findMany({
    where: { schoolId },
    select: { id: true, email: true, role: true },
  })
  return {
    allUsers: users,
    adminUsers: users.filter((u) => u.role === "ADMIN"),
    teacherUsers: users.filter((u) => u.role === "TEACHER"),
    studentUsers: users.filter((u) => u.role === "STUDENT"),
    guardianUsers: users.filter((u) => u.role === "GUARDIAN"),
  }
}

async function resolveTeachers(
  prisma: PrismaClient,
  schoolId: string
): Promise<TeacherRef[]> {
  const teachers = await prisma.teacher.findMany({
    where: { schoolId },
    select: {
      id: true,
      userId: true,
      emailAddress: true,
      givenName: true,
      surname: true,
    },
  })
  return teachers.map((t) => ({
    id: t.id,
    userId: t.userId,
    emailAddress: t.emailAddress ?? "",
    givenName: t.givenName,
    surname: t.surname,
  }))
}

async function resolveStudents(
  prisma: PrismaClient,
  schoolId: string
): Promise<StudentRef[]> {
  const students = await prisma.student.findMany({
    where: { schoolId },
    select: {
      id: true,
      userId: true,
      grNumber: true,
      givenName: true,
      surname: true,
      yearLevelId: true,
    },
  })
  return students.map((s) => ({
    id: s.id,
    userId: s.userId,
    grNumber: s.grNumber,
    givenName: s.givenName,
    surname: s.surname,
    yearLevelId: s.yearLevelId ?? undefined,
  }))
}

async function resolveDepartments(
  prisma: PrismaClient,
  schoolId: string
): Promise<DepartmentRef[]> {
  const departments = await prisma.department.findMany({
    where: { schoolId },
    select: { id: true, departmentName: true, lang: true },
  })
  return departments.map((d) => ({
    id: d.id,
    departmentName: d.departmentName,
    lang: d.lang ?? "ar",
  }))
}

async function resolveSubjects(
  prisma: PrismaClient,
  schoolId: string
): Promise<SubjectRef[]> {
  const subjects = await prisma.subject.findMany({
    where: { schoolId },
    select: {
      id: true,
      subjectName: true,
      lang: true,
      departmentId: true,
    },
  })
  return subjects.map((s) => ({
    id: s.id,
    subjectName: s.subjectName,
    lang: s.lang ?? "ar",
    departmentId: s.departmentId ?? "",
  }))
}

async function resolveYearLevels(
  prisma: PrismaClient,
  schoolId: string
): Promise<YearLevelRef[]> {
  const yearLevels = await prisma.yearLevel.findMany({
    where: { schoolId },
    select: { id: true, levelName: true, lang: true, levelOrder: true },
    orderBy: { levelOrder: "asc" },
  })
  return yearLevels.map((y) => ({
    id: y.id,
    levelName: y.levelName,
    lang: y.lang ?? "ar",
    levelOrder: y.levelOrder,
  }))
}

async function resolveClassrooms(
  prisma: PrismaClient,
  schoolId: string
): Promise<ClassroomRef[]> {
  const classrooms = await prisma.classroom.findMany({
    where: { schoolId },
    select: { id: true, name: true, capacity: true },
  })
  return classrooms.map((c) => ({
    id: c.id,
    name: c.name,
    capacity: c.capacity,
  }))
}

async function resolveClasses(
  prisma: PrismaClient,
  schoolId: string
): Promise<ClassRef[]> {
  const classes = await prisma.class.findMany({
    where: { schoolId },
    select: {
      id: true,
      name: true,
      lang: true,
      subjectId: true,
      yearLevelId: true,
    },
  })
  return classes.map((c) => ({
    id: c.id,
    name: c.name,
    lang: c.lang ?? "ar",
    subjectId: c.subjectId,
    yearLevelId: c.yearLevelId ?? "",
  }))
}

async function resolvePeriods(
  prisma: PrismaClient,
  schoolId: string
): Promise<PeriodRef[]> {
  const periods = await prisma.period.findMany({
    where: { schoolId },
    select: { id: true, name: true, startTime: true, endTime: true },
    orderBy: { startTime: "asc" },
  })
  return periods.map((p) => ({
    id: p.id,
    name: p.name,
    startTime:
      p.startTime instanceof Date
        ? p.startTime.toTimeString().slice(0, 5)
        : String(p.startTime),
    endTime:
      p.endTime instanceof Date
        ? p.endTime.toTimeString().slice(0, 5)
        : String(p.endTime),
  }))
}

async function resolveTerm(
  prisma: PrismaClient,
  schoolId: string
): Promise<TermRef> {
  const term = await prisma.term.findFirst({
    where: { schoolId },
    select: { id: true, termNumber: true, startDate: true, endDate: true },
    orderBy: { termNumber: "asc" },
  })
  if (!term) throw new Error("No term found. Run full seed first.")
  return term
}

async function resolveSchoolYear(prisma: PrismaClient, schoolId: string) {
  const sy = await prisma.schoolYear.findFirst({
    where: { schoolId },
    select: { id: true, yearName: true, startDate: true, endDate: true },
  })
  if (!sy) throw new Error("No school year found. Run full seed first.")
  return sy
}

// ============================================================================
// SEED REGISTRY
// ============================================================================

type SeedRunner = (prisma: PrismaClient, schoolId: string) => Promise<void>

const SEEDS: Record<string, { description: string; run: SeedRunner }> = {
  // Foundation
  catalog: {
    description: "Global catalog (subjects, chapters, lessons)",
    run: async (prisma) => {
      await seedCatalog(prisma)
    },
  },
  "catalog-images": {
    description: "Upload ClickView images to S3/CloudFront",
    run: async (prisma) => {
      await seedCatalogImages(prisma)
    },
  },
  "clickview-catalog": {
    description:
      "ClickView US catalog (62 subjects, 201 chapters, 986 lessons)",
    run: async (prisma) => {
      await seedClickViewCatalog(prisma)
    },
  },
  "clickview-images": {
    description: "Upload ClickView subject images to S3/CloudFront",
    run: async (prisma) => {
      await seedClickViewImages(prisma)
    },
  },
  school: {
    description: "Demo school + branding",
    run: async (prisma) => {
      await seedSchoolWithBranding(prisma)
    },
  },
  auth: {
    description: "User accounts (all roles)",
    run: async (prisma, schoolId) => {
      await seedAllUsers(prisma, schoolId)
    },
  },
  academic: {
    description: "School year, terms, periods, departments, year levels",
    run: async (prisma, schoolId) => {
      await seedAcademicStructure(prisma, schoolId)
    },
  },
  "academic-catalog": {
    description: "Academic structure + catalog bridge",
    run: async (prisma, schoolId) => {
      const yearLevels = await resolveYearLevels(prisma, schoolId)
      const catalogSubjects = await prisma.catalogSubject.findMany({
        select: { id: true, name: true, slug: true },
      })
      const school = await prisma.school.findUnique({
        where: { id: schoolId },
        select: { schoolLevel: true },
      })
      await seedAcademicStructureCatalog(
        prisma,
        schoolId,
        yearLevels,
        catalogSubjects,
        school?.schoolLevel
      )
    },
  },

  // Core data
  subjects: {
    description: "School subjects (19 bilingual)",
    run: async (prisma, schoolId) => {
      const departments = await resolveDepartments(prisma, schoolId)
      await seedSubjects(prisma, schoolId, departments)
    },
  },
  classrooms: {
    description: "Classrooms (30+)",
    run: async (prisma, schoolId) => {
      await seedClassrooms(prisma, schoolId)
    },
  },
  people: {
    description: "Teachers, students, guardians + qualifications",
    run: async (prisma, schoolId) => {
      const { teacherUsers, studentUsers, guardianUsers } = await resolveUsers(
        prisma,
        schoolId
      )
      const departments = await resolveDepartments(prisma, schoolId)
      const yearLevels = await resolveYearLevels(prisma, schoolId)
      const schoolYear = await resolveSchoolYear(prisma, schoolId)
      const subjects = await resolveSubjects(prisma, schoolId)
      await seedAllPeople(
        prisma,
        schoolId,
        teacherUsers,
        studentUsers,
        guardianUsers,
        departments,
        yearLevels,
        schoolYear,
        subjects
      )
    },
  },
  "student-documents": {
    description: "Student documents",
    run: async (prisma, schoolId) => {
      const students = await resolveStudents(prisma, schoolId)
      const { adminUsers } = await resolveUsers(prisma, schoolId)
      await seedStudentDocuments(prisma, schoolId, students, adminUsers)
    },
  },
  "staff-members": {
    description: "Non-teaching staff",
    run: async (prisma, schoolId) => {
      const departments = await resolveDepartments(prisma, schoolId)
      const { adminUsers } = await resolveUsers(prisma, schoolId)
      await seedStaffMembers(prisma, schoolId, departments, adminUsers)
    },
  },
  classes: {
    description: "Classes + enrollments (400+)",
    run: async (prisma, schoolId) => {
      const subjects = await resolveSubjects(prisma, schoolId)
      const yearLevels = await resolveYearLevels(prisma, schoolId)
      const teachers = await resolveTeachers(prisma, schoolId)
      const students = await resolveStudents(prisma, schoolId)
      const classrooms = await resolveClassrooms(prisma, schoolId)
      const periods = await resolvePeriods(prisma, schoolId)
      const term = await resolveTerm(prisma, schoolId)
      await seedAllClasses(
        prisma,
        schoolId,
        subjects,
        yearLevels,
        teachers,
        students,
        classrooms,
        periods,
        term
      )
    },
  },

  // LMS / Stream
  stream: {
    description: "Stream courses + enrollments",
    run: async (prisma, schoolId) => {
      const subjects = await resolveSubjects(prisma, schoolId)
      const { adminUsers } = await resolveUsers(prisma, schoolId)
      const students = await resolveStudents(prisma, schoolId)
      await seedStreamCourses(prisma, schoolId, subjects, adminUsers)
      await seedStreamEnrollments(prisma, schoolId, students)
    },
  },
  lessons: {
    description: "Lessons for classes",
    run: async (prisma, schoolId) => {
      const classes = await resolveClasses(prisma, schoolId)
      await seedLessons(prisma, schoolId, classes)
    },
  },
  library: {
    description: "Books + borrow records",
    run: async (prisma, schoolId) => {
      const students = await resolveStudents(prisma, schoolId)
      await seedLibrary(prisma, schoolId, students)
    },
  },

  // Assignments & Exams
  assignments: {
    description: "Assignments + submissions",
    run: async (prisma, schoolId) => {
      const classes = await resolveClasses(prisma, schoolId)
      const teachers = await resolveTeachers(prisma, schoolId)
      const students = await resolveStudents(prisma, schoolId)
      const term = await resolveTerm(prisma, schoolId)
      await seedAssignments(
        prisma,
        schoolId,
        classes,
        teachers,
        term.startDate,
        term.endDate
      )
      await seedAssignmentSubmissions(
        prisma,
        schoolId,
        students,
        classes,
        teachers
      )
    },
  },
  exams: {
    description: "Exams + results + grading config",
    run: async (prisma, schoolId) => {
      const subjects = await resolveSubjects(prisma, schoolId)
      const classes = await resolveClasses(prisma, schoolId)
      const students = await resolveStudents(prisma, schoolId)
      const term = await resolveTerm(prisma, schoolId)
      await seedExams(prisma, schoolId, subjects, classes, term)
      await seedExamResults(prisma, schoolId, students, classes)
      await seedGradingConfig(prisma, schoolId)
    },
  },
  qbank: {
    description: "Question bank",
    run: async (prisma, schoolId) => {
      const subjects = await resolveSubjects(prisma, schoolId)
      const { adminUsers } = await resolveUsers(prisma, schoolId)
      await seedQBank(prisma, schoolId, subjects, adminUsers)
    },
  },
  grades: {
    description: "Grade boundaries + report cards",
    run: async (prisma, schoolId) => {
      const students = await resolveStudents(prisma, schoolId)
      const yearLevels = await resolveYearLevels(prisma, schoolId)
      const term = await resolveTerm(prisma, schoolId)
      await seedGrades(prisma, schoolId, students, yearLevels, term)
    },
  },

  // Communication
  announcements: {
    description: "School announcements",
    run: async (prisma, schoolId) => {
      const { adminUsers } = await resolveUsers(prisma, schoolId)
      await seedAnnouncements(prisma, schoolId, adminUsers)
    },
  },
  events: {
    description: "School events",
    run: async (prisma, schoolId) => {
      await seedEvents(prisma, schoolId)
    },
  },
  messages: {
    description: "Conversations + messages",
    run: async (prisma, schoolId) => {
      const teachers = await resolveTeachers(prisma, schoolId)
      const students = await resolveStudents(prisma, schoolId)
      const { adminUsers } = await resolveUsers(prisma, schoolId)
      await seedMessaging(prisma, schoolId, teachers, students, adminUsers)
    },
  },
  notifications: {
    description: "User notifications",
    run: async (prisma, schoolId) => {
      const teachers = await resolveTeachers(prisma, schoolId)
      const students = await resolveStudents(prisma, schoolId)
      const { adminUsers } = await resolveUsers(prisma, schoolId)
      await seedNotifications(prisma, schoolId, teachers, students, adminUsers)
    },
  },

  // Finance
  finance: {
    description: "Finance (2-year history, expenses, journals)",
    run: async (prisma, schoolId) => {
      const departments = await resolveDepartments(prisma, schoolId)
      const { adminUsers } = await resolveUsers(prisma, schoolId)
      await seedFinanceComplete(
        prisma,
        schoolId,
        departments,
        adminUsers[0] || null
      )
    },
  },
  fees: {
    description: "Fee structures + payments + scholarships",
    run: async (prisma, schoolId) => {
      const students = await resolveStudents(prisma, schoolId)
      const yearLevels = await resolveYearLevels(prisma, schoolId)
      await seedFees(prisma, schoolId, students, yearLevels)
    },
  },
  invoices: {
    description: "Student invoices",
    run: async (prisma, schoolId) => {
      const students = await resolveStudents(prisma, schoolId)
      const { adminUsers } = await resolveUsers(prisma, schoolId)
      await seedInvoices(prisma, schoolId, students, adminUsers)
    },
  },
  payroll: {
    description: "Salary structures + payroll runs",
    run: async (prisma, schoolId) => {
      const teachers = await resolveTeachers(prisma, schoolId)
      const { adminUsers } = await resolveUsers(prisma, schoolId)
      await seedPayroll(prisma, schoolId, teachers, adminUsers)
    },
  },
  banking: {
    description: "Bank accounts + transactions",
    run: async (prisma, schoolId) => {
      const { adminUsers } = await resolveUsers(prisma, schoolId)
      await seedBanking(prisma, schoolId, adminUsers)
    },
  },

  // Operations
  attendance: {
    description: "Attendance records (10 days)",
    run: async (prisma, schoolId) => {
      const students = await resolveStudents(prisma, schoolId)
      const classes = await resolveClasses(prisma, schoolId)
      const teachers = await resolveTeachers(prisma, schoolId)
      const periods = await resolvePeriods(prisma, schoolId)
      await seedAttendance(
        prisma,
        schoolId,
        students,
        classes,
        teachers,
        periods
      )
    },
  },
  "attendance-extras": {
    description: "Attendance excuses + interventions",
    run: async (prisma, schoolId) => {
      const students = await resolveStudents(prisma, schoolId)
      const teachers = await resolveTeachers(prisma, schoolId)
      const { adminUsers } = await resolveUsers(prisma, schoolId)
      await seedAttendanceExcuses(prisma, schoolId, students, adminUsers)
      await seedAttendanceInterventions(
        prisma,
        schoolId,
        students,
        teachers,
        adminUsers
      )
    },
  },
  timetable: {
    description: "Weekly timetable",
    run: async (prisma, schoolId) => {
      const classes = await resolveClasses(prisma, schoolId)
      const teachers = await resolveTeachers(prisma, schoolId)
      const classrooms = await resolveClassrooms(prisma, schoolId)
      const periods = await resolvePeriods(prisma, schoolId)
      const term = await resolveTerm(prisma, schoolId)
      await seedTimetable(
        prisma,
        schoolId,
        classes,
        teachers,
        classrooms,
        periods,
        term
      )
    },
  },
  gamification: {
    description: "Badges, streaks, competitions",
    run: async (prisma, schoolId) => {
      const students = await resolveStudents(prisma, schoolId)
      const classes = await resolveClasses(prisma, schoolId)
      await seedGamification(prisma, schoolId, students, classes)
    },
  },

  // Compliance
  admission: {
    description: "Admission campaigns + applications",
    run: async (prisma, schoolId) => {
      const yearLevels = await resolveYearLevels(prisma, schoolId)
      const { adminUsers } = await resolveUsers(prisma, schoolId)
      await seedAdmission(prisma, schoolId, yearLevels, adminUsers)
    },
  },
  audit: {
    description: "Audit logs",
    run: async (prisma, schoolId) => {
      const { allUsers } = await resolveUsers(prisma, schoolId)
      await seedAuditLogs(prisma, schoolId, allUsers)
    },
  },
  health: {
    description: "Health, disciplinary, achievements",
    run: async (prisma, schoolId) => {
      const students = await resolveStudents(prisma, schoolId)
      const teachers = await resolveTeachers(prisma, schoolId)
      const { adminUsers } = await resolveUsers(prisma, schoolId)
      await seedWellness(prisma, schoolId, students, teachers, adminUsers)
    },
  },
}

// ============================================================================
// CLI
// ============================================================================

async function main() {
  const arg = process.argv[2]

  if (!arg || arg === "--list") {
    console.log("\n Available seeds:\n")
    for (const [name, { description }] of Object.entries(SEEDS)) {
      console.log(`  ${name.padEnd(22)} ${description}`)
    }
    console.log(`\n Usage: pnpm db:seed:single <name>\n`)
    process.exit(0)
  }

  const seed = SEEDS[arg]
  if (!seed) {
    console.error(`\n Unknown seed: "${arg}"`)
    console.error(` Run with --list to see available seeds.\n`)
    process.exit(1)
  }

  const prisma = new PrismaClient()

  try {
    console.log(`\n Running seed: ${arg}`)
    console.log(` ${seed.description}`)
    console.log("-".repeat(50))

    // Resolve demo school
    const school = await resolveSchool(prisma)
    console.log(` School: ${school.name} (${school.id})`)

    // Run the seed
    await measureDuration(arg, () => seed.run(prisma, school.id))

    console.log(`\n Done: ${arg}\n`)
  } catch (error) {
    console.error(`\n Seed "${arg}" failed:`, error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
