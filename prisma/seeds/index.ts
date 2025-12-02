/**
 * Main Seed Orchestrator - Realistic K-12 School (100 Students)
 * Coordinates all seed modules and runs them in proper order
 *
 * Creates a complete demo school with:
 * - 100 students (K-12, 14 grade levels)
 * - 25 teachers (1:4 student ratio)
 * - 200 guardians (2 per student)
 * - Full curriculum (7-13 subjects per grade)
 * - Realistic class schedules
 * - Sample grades, attendance, assignments
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

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("  🏫 REALISTIC K-12 SCHOOL SEED");
  console.log("  📍 demo.databayt.org");
  console.log("=".repeat(60) + "\n");

  const startTime = Date.now();

  try {
    // Phase 1: Cleanup
    console.log("PHASE 1: DATABASE CLEANUP");
    console.log("-".repeat(40));
    await seedCleanup(prisma);

    // Phase 2: Core Setup
    console.log("\nPHASE 2: CORE SETUP");
    console.log("-".repeat(40));

    const school = await seedSchool(prisma);
    const schoolId = school.id;
    const schoolName = school.name;

    const { devUser, adminUser, accountantUser, staffUser } = await seedAuth(
      prisma,
      schoolId
    );

    // Phase 3: Academic Structure
    console.log("\nPHASE 3: ACADEMIC STRUCTURE");
    console.log("-".repeat(40));

    const { schoolYear, term1, term2, yearLevels, periods } = await seedAcademic(
      prisma,
      schoolId
    );
    const terms = [term1, term2];

    const { departments, subjects } = await seedDepartments(prisma, schoolId);

    const { classrooms } = await seedClassrooms(prisma, schoolId);

    // Phase 4: People (100 students, 25 teachers, 200 guardians)
    console.log("\nPHASE 4: PEOPLE");
    console.log("-".repeat(40));

    const { teachers, students, guardians } = await seedPeople(
      prisma,
      schoolId,
      departments,
      yearLevels,
      schoolYear
    );

    // Phase 5: Classes & Enrollments
    console.log("\nPHASE 5: CLASSES & ENROLLMENTS");
    console.log("-".repeat(40));

    const { classes } = await seedClasses(
      prisma,
      schoolId,
      term1.id,
      periods,
      classrooms,
      subjects,
      teachers,
      students
    );

    // Phase 6: Resources
    console.log("\nPHASE 6: RESOURCES");
    console.log("-".repeat(40));

    await seedLibrary(prisma, schoolId);
    await seedAnnouncements(prisma, schoolId, classes);
    await seedEvents(prisma, schoolId);

    // Phase 7: Finance & Fees
    console.log("\nPHASE 7: FINANCE & FEES");
    console.log("-".repeat(40));

    await seedFees(prisma, schoolId, classes, students);
    await seedFinance(
      prisma,
      schoolId,
      schoolName,
      [devUser, adminUser, accountantUser, staffUser],
      teachers,
      students
    );

    // Phase 8: Assessments
    console.log("\nPHASE 8: ASSESSMENTS");
    console.log("-".repeat(40));

    await seedExams(prisma, schoolId, classes, subjects, students, teachers);
    await seedGrades(prisma, schoolId, classes, subjects, students, teachers);

    // Phase 9: Scheduling
    console.log("\nPHASE 9: SCHEDULING");
    console.log("-".repeat(40));

    await seedTimetable(prisma, schoolId, term1.id, periods, classes);

    // Phase 10: Learning Management
    console.log("\nPHASE 10: LEARNING MANAGEMENT");
    console.log("-".repeat(40));

    await seedStream(prisma, schoolId, teachers);
    await seedLessons(prisma, schoolId, classes);
    await seedReports(prisma, schoolId, terms[0].id, students, subjects);

    // Phase 11: Attendance
    console.log("\nPHASE 11: ATTENDANCE");
    console.log("-".repeat(40));

    await seedAttendance(prisma, schoolId, classes, students);

    // Phase 12: Admissions
    console.log("\nPHASE 12: ADMISSIONS");
    console.log("-".repeat(40));

    await seedAdmission(prisma, schoolId, schoolName, adminUser);

    // Summary
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log("\n" + "=".repeat(60));
    console.log("  ✅ SEED COMPLETED SUCCESSFULLY");
    console.log("=".repeat(60));
    console.log(`
  🏫 School: ${schoolName}
  🌐 Domain: demo.databayt.org

  📋 Login Credentials (password: 1234):
  ┌─────────────────────────────────────────────┐
  │ Role        │ Email                         │
  ├─────────────────────────────────────────────┤
  │ Developer   │ dev@databayt.org              │
  │ Admin       │ admin@databayt.org            │
  │ Accountant  │ accountant@databayt.org       │
  │ Staff       │ staff@databayt.org            │
  │ Teacher     │ teacher1@demo.databayt.org    │
  │ Student     │ student1@demo.databayt.org    │
  │ Guardian    │ father1@demo.databayt.org     │
  └─────────────────────────────────────────────┘

  📊 Data Summary:
  ┌─────────────────────────────────────────────┐
  │ Entity          │ Count                     │
  ├─────────────────────────────────────────────┤
  │ Students        │ ${String(students.length).padStart(3)}  (K-12)               │
  │ Teachers        │ ${String(teachers.length).padStart(3)}  (1:${Math.round(students.length/teachers.length)} ratio)           │
  │ Guardians       │ ${String(guardians.length).padStart(3)}  (2 per student)       │
  │ Classes         │ ${String(classes.length).padStart(3)}  (subjects × levels)  │
  │ Subjects        │ ${String(subjects.length).padStart(3)}  (curriculum)         │
  │ Classrooms      │ ${String(classrooms.length).padStart(3)}  (rooms)              │
  │ Departments     │ ${String(departments.length).padStart(3)}  (academic)           │
  │ Year Levels     │ ${String(yearLevels.length).padStart(3)}  (KG1 - Grade 12)    │
  └─────────────────────────────────────────────┘

  ⏱️  Time: ${elapsed}s
`);
    console.log("=".repeat(60) + "\n");
  } catch (error) {
    console.error("\n❌ SEED FAILED:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
