/**
 * Individual Seed Runner
 * Run seeds one at a time: npx tsx prisma/seeds/run-single.ts <phase>
 *
 * Phases (in order):
 *   1. cleanup     - Clear existing data
 *   2. school      - Create demo school + branding
 *   3. auth        - Create admin users (dev, admin, accountant, staff)
 *   4. academic    - School year, terms, year levels, periods
 *   5. departments - Departments + subjects (57 subjects AR/EN)
 *   6. classrooms  - Physical rooms (17 rooms)
 *   7. people      - Teachers (25), Students (100), Guardians (200)
 *   8. classes     - Class sections + enrollments
 *   9. library     - Books collection (AR/EN)
 *  10. announcements - School announcements
 *  11. events      - School events calendar
 *  12. fees        - Fee structures + student fees
 *  13. finance     - Accounts, transactions, payroll
 *  14. exams       - Exam schedules + results
 *  15. grades      - Student grades + assessments
 *  16. timetable   - Class schedules
 *  17. stream      - LMS courses + lessons
 *  18. lessons     - Lesson plans
 *  19. reports     - Student reports
 *  20. attendance  - Attendance records
 *  21. admission   - Admission applications
 *
 * Usage:
 *   npx tsx prisma/seeds/run-single.ts school
 *   npx tsx prisma/seeds/run-single.ts auth
 *   npx tsx prisma/seeds/run-single.ts academic
 */

import { PrismaClient } from "@prisma/client";
import { seedCleanup } from "./cleanup";
import { seedSchool } from "./school";
import { seedAuth } from "./auth";
import { seedAcademic } from "./academic";
import { seedDepartments } from "./departments";
import { seedClassrooms } from "./classrooms";
import { seedPeople } from "./people";
import { seedClasses } from "./classes";
import { seedLibrary } from "./library";
import { seedAnnouncements } from "./announcements";
import { seedEvents } from "./events";
import { seedFees } from "./fees";
import { seedExams } from "./exams";
import { seedGrades } from "./grades";
import { seedTimetable } from "./timetable";
import { seedStream } from "./stream";
import { seedLessons } from "./lessons";
import { seedReports } from "./reports";
import { seedAdmission } from "./admission";
import { seedFinance } from "./finance";
import { seedAttendance } from "./attendance";
import type { SeedPrisma } from "./types";

const prisma = new PrismaClient() as SeedPrisma;

// Helper to get school
async function getSchool() {
  const school = await prisma.school.findFirst({ where: { domain: "demo" } });
  if (!school) throw new Error("❌ School not found. Run 'school' phase first.");
  return school;
}

// Helper to get core data (maps to seed types)
async function getCoreData(schoolId: string) {
  const schoolYear = await prisma.schoolYear.findFirst({ where: { schoolId } });
  const term1 = await prisma.term.findFirst({ where: { schoolId, termNumber: 1 } });
  const yearLevels = await prisma.yearLevel.findMany({ where: { schoolId }, orderBy: { levelOrder: "asc" } });
  const periods = await prisma.period.findMany({ where: { schoolId }, orderBy: { name: "asc" } });
  const departments = await prisma.department.findMany({ where: { schoolId } });
  const subjects = await prisma.subject.findMany({ where: { schoolId } });
  const classrooms = await prisma.classroom.findMany({ where: { schoolId } });
  const rawTeachers = await prisma.teacher.findMany({ where: { schoolId } });
  const rawStudents = await prisma.student.findMany({ where: { schoolId } });
  const classes = await prisma.class.findMany({ where: { schoolId } });
  const terms = await prisma.term.findMany({ where: { schoolId } });
  const users = await prisma.user.findMany({ where: { schoolId } });

  // Map to seed types
  const teachers = rawTeachers.map(t => ({
    id: t.id,
    userId: t.userId || "",
    emailAddress: t.emailAddress || ""
  }));

  const students = rawStudents.map(s => ({
    id: s.id,
    userId: s.userId || ""
  }));

  return {
    schoolYear,
    term1,
    yearLevels: yearLevels.map(l => ({ id: l.id, levelName: l.levelName })),
    periods: periods.map(p => ({ id: p.id })),
    departments: departments.map(d => ({ id: d.id, departmentName: d.departmentName })),
    subjects: subjects.map(s => ({ id: s.id, subjectName: s.subjectName })),
    classrooms: classrooms.map(c => ({ id: c.id })),
    teachers,
    students,
    classes: classes.map(c => ({ id: c.id, name: c.name })),
    terms,
    users: users.map(u => ({ id: u.id, email: u.email || "", role: u.role }))
  };
}

async function runPhase(phase: string) {
  console.log(`\n${"=".repeat(50)}`);
  console.log(`  🚀 Running seed phase: ${phase.toUpperCase()}`);
  console.log(`${"=".repeat(50)}\n`);

  const startTime = Date.now();

  try {
    switch (phase) {
      case "cleanup": {
        await seedCleanup(prisma);
        console.log("✅ Cleanup complete - database cleared");
        break;
      }

      case "school": {
        const school = await seedSchool(prisma);
        console.log(`✅ School created: ${school.name} (domain: ${school.domain})`);
        break;
      }

      case "auth": {
        const school = await getSchool();
        const users = await seedAuth(prisma, school.id);
        console.log("✅ Auth users created:");
        console.log("   - dev@databayt.org (DEVELOPER)");
        console.log("   - admin@databayt.org (ADMIN)");
        console.log("   - accountant@databayt.org (ACCOUNTANT)");
        console.log("   - staff@databayt.org (STAFF)");
        console.log("   Password for all: 1234");
        break;
      }

      case "academic": {
        const school = await getSchool();
        const result = await seedAcademic(prisma, school.id);
        console.log("✅ Academic structure created:");
        console.log(`   - School Year: 2025-2026`);
        console.log(`   - Terms: Term 1, Term 2`);
        console.log(`   - Year Levels: ${result.yearLevels.length} (KG1 - Grade 12)`);
        console.log(`   - Periods: ${result.periods.length}`);
        break;
      }

      case "departments": {
        const school = await getSchool();
        const result = await seedDepartments(prisma, school.id);
        console.log("✅ Departments & Subjects created:");
        console.log(`   - Departments: ${result.departments.length}`);
        console.log(`   - Subjects: ${result.subjects.length} (with AR/EN names)`);
        break;
      }

      case "classrooms": {
        const school = await getSchool();
        const result = await seedClassrooms(prisma, school.id);
        console.log("✅ Classrooms created:");
        console.log(`   - Rooms: ${result.classrooms.length}`);
        break;
      }

      case "people": {
        const school = await getSchool();
        const { schoolYear, yearLevels, departments } = await getCoreData(school.id);
        if (!schoolYear) throw new Error("❌ Run 'academic' phase first");
        const result = await seedPeople(prisma, school.id, departments, yearLevels, schoolYear);
        console.log("✅ People created:");
        console.log(`   - Teachers: ${result.teachers.length}`);
        console.log(`   - Students: ${result.students.length}`);
        console.log(`   - Guardians: ${result.guardians.length}`);
        break;
      }

      case "classes": {
        const school = await getSchool();
        const { term1, periods, classrooms, subjects, teachers, students } = await getCoreData(school.id);
        if (!term1) throw new Error("❌ Run 'academic' phase first");
        const result = await seedClasses(prisma, school.id, term1.id, periods, classrooms, subjects, teachers, students);
        console.log("✅ Classes created:");
        console.log(`   - Classes: ${result.classes.length}`);
        break;
      }

      case "library": {
        const school = await getSchool();
        await seedLibrary(prisma, school.id);
        console.log("✅ Library seeded with books (AR/EN)");
        break;
      }

      case "announcements": {
        const school = await getSchool();
        const { classes } = await getCoreData(school.id);
        await seedAnnouncements(prisma, school.id, classes);
        console.log("✅ Announcements created");
        break;
      }

      case "events": {
        const school = await getSchool();
        await seedEvents(prisma, school.id);
        console.log("✅ Events created");
        break;
      }

      case "fees": {
        const school = await getSchool();
        const { classes, students } = await getCoreData(school.id);
        await seedFees(prisma, school.id, classes, students);
        console.log("✅ Fees structure created");
        break;
      }

      case "finance": {
        const school = await getSchool();
        const { teachers, students, users } = await getCoreData(school.id);
        const adminUsers = users.filter(u => ["DEVELOPER", "ADMIN", "ACCOUNTANT", "STAFF"].includes(u.role));
        await seedFinance(prisma, school.id, school.name, adminUsers, teachers, students);
        console.log("✅ Finance data created (accounts, transactions, payroll)");
        break;
      }

      case "exams": {
        const school = await getSchool();
        const { classes, subjects, students, teachers } = await getCoreData(school.id);
        await seedExams(prisma, school.id, classes, subjects, students, teachers);
        console.log("✅ Exams created");
        break;
      }

      case "grades": {
        const school = await getSchool();
        const { classes, subjects, students, teachers } = await getCoreData(school.id);
        await seedGrades(prisma, school.id, classes, subjects, students, teachers);
        console.log("✅ Grades created");
        break;
      }

      case "timetable": {
        const school = await getSchool();
        const { term1, periods, classes } = await getCoreData(school.id);
        if (!term1) throw new Error("❌ Run 'academic' phase first");
        await seedTimetable(prisma, school.id, term1.id, periods, classes);
        console.log("✅ Timetable created");
        break;
      }

      case "stream": {
        const school = await getSchool();
        const { teachers } = await getCoreData(school.id);
        await seedStream(prisma, school.id, teachers);
        console.log("✅ Stream/LMS data created");
        break;
      }

      case "lessons": {
        const school = await getSchool();
        const { classes } = await getCoreData(school.id);
        await seedLessons(prisma, school.id, classes);
        console.log("✅ Lessons created");
        break;
      }

      case "reports": {
        const school = await getSchool();
        const { terms, students, subjects } = await getCoreData(school.id);
        await seedReports(prisma, school.id, terms[0]?.id, students, subjects);
        console.log("✅ Reports created");
        break;
      }

      case "attendance": {
        const school = await getSchool();
        const { classes, students } = await getCoreData(school.id);
        await seedAttendance(prisma, school.id, classes, students);
        console.log("✅ Attendance records created");
        break;
      }

      case "admission": {
        const school = await getSchool();
        const { users } = await getCoreData(school.id);
        const admin = users.find(u => u.role === "ADMIN");
        if (!admin) throw new Error("❌ Run 'auth' phase first");
        await seedAdmission(prisma, school.id, school.name, admin);
        console.log("✅ Admission data created");
        break;
      }

      default:
        console.log(`❌ Unknown phase: ${phase}`);
        console.log("\nAvailable phases:");
        console.log("  1. cleanup      - Clear database");
        console.log("  2. school       - Demo school");
        console.log("  3. auth         - Admin users");
        console.log("  4. academic     - Year, terms, levels, periods");
        console.log("  5. departments  - Departments + subjects");
        console.log("  6. classrooms   - Physical rooms");
        console.log("  7. people       - Teachers, students, guardians");
        console.log("  8. classes      - Class sections");
        console.log("  9. library      - Books");
        console.log(" 10. announcements");
        console.log(" 11. events");
        console.log(" 12. fees");
        console.log(" 13. finance");
        console.log(" 14. exams");
        console.log(" 15. grades");
        console.log(" 16. timetable");
        console.log(" 17. stream       - LMS");
        console.log(" 18. lessons");
        console.log(" 19. reports");
        console.log(" 20. attendance");
        console.log(" 21. admission");
        process.exit(1);
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n⏱️  Completed in ${elapsed}s\n`);

  } catch (error) {
    console.error("\n❌ Seed failed:", error);
    throw error;
  }
}

// Main
const phase = process.argv[2];

if (!phase) {
  console.log("Usage: npx tsx prisma/seeds/run-single.ts <phase>");
  console.log("\nRun phases in order:");
  console.log("  npx tsx prisma/seeds/run-single.ts cleanup");
  console.log("  npx tsx prisma/seeds/run-single.ts school");
  console.log("  npx tsx prisma/seeds/run-single.ts auth");
  console.log("  npx tsx prisma/seeds/run-single.ts academic");
  console.log("  npx tsx prisma/seeds/run-single.ts departments");
  console.log("  npx tsx prisma/seeds/run-single.ts classrooms");
  console.log("  npx tsx prisma/seeds/run-single.ts people");
  console.log("  npx tsx prisma/seeds/run-single.ts classes");
  console.log("  ... and so on");
  process.exit(1);
}

runPhase(phase)
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
