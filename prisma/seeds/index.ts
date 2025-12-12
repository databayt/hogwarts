/**
 * Main Seed Orchestrator - Bilingual K-12 School (AR/EN)
 * Coordinates all seed modules and runs them in proper order
 *
 * Creates a complete demo school (demo.databayt.org) with:
 * - 100 students (K-12, 14 grade levels)
 * - 25 teachers (1:4 student ratio)
 * - 200 guardians (2 per student)
 * - Full bilingual curriculum (Arabic/English)
 * - Sudanese education system (KG1-2, Grades 1-12)
 * - SDG currency for finance
 * - Realistic Arabic names, vendors, and addresses
 *
 * All data is bilingual:
 * - Arabic (AR): Primary display language (RTL)
 * - English (EN): Database storage for API compatibility
 */

import { PrismaClient } from "@prisma/client";
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
  console.log("  🌱 ADDITIVE SEED MODE - Data is preserved");
  console.log("  🏫 BILINGUAL K-12 SCHOOL SEED (AR/EN)");
  console.log("  📍 demo.databayt.org | مدرسة دار بايت التجريبية");
  console.log("  🇸🇩 Sudanese Education System | النظام التعليمي السوداني");
  console.log("=".repeat(60) + "\n");

  const startTime = Date.now();

  try {
    // Phase 1: Core Setup (find or create school)
    console.log("PHASE 1: CORE SETUP");
    console.log("-".repeat(40));

    // Find existing school or create new one
    const existingSchool = await prisma.school.findFirst({ where: { domain: "demo" } });
    let schoolId: string;
    let schoolName: string;
    if (existingSchool) {
      console.log("   ✓ School already exists, using existing");
      schoolId = existingSchool.id;
      schoolName = existingSchool.name;
    } else {
      const newSchool = await seedSchool(prisma);
      schoolId = newSchool.id;
      schoolName = newSchool.name;
    }

    const { devUser, adminUser, accountantUser, staffUser } = await seedAuth(
      prisma,
      schoolId
    );

    // Phase 2: Academic Structure
    console.log("\nPHASE 2: ACADEMIC STRUCTURE");
    console.log("-".repeat(40));

    const { schoolYear, term1, term2, yearLevels, periods } = await seedAcademic(
      prisma,
      schoolId
    );
    const terms = [term1, term2];

    const { departments, subjects } = await seedDepartments(prisma, schoolId);

    const { classrooms } = await seedClassrooms(prisma, schoolId);

    // Phase 3: People (100 students, 25 teachers, 200 guardians)
    console.log("\nPHASE 3: PEOPLE");
    console.log("-".repeat(40));

    const { teachers, students, guardians } = await seedPeople(
      prisma,
      schoolId,
      departments,
      yearLevels,
      schoolYear
    );

    // Phase 4: Classes & Enrollments
    console.log("\nPHASE 4: CLASSES & ENROLLMENTS");
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

    // Phase 5: Resources
    console.log("\nPHASE 5: RESOURCES");
    console.log("-".repeat(40));

    await seedLibrary(prisma, schoolId);
    await seedAnnouncements(prisma, schoolId, classes);
    await seedEvents(prisma, schoolId);

    // Phase 6: Finance & Fees
    console.log("\nPHASE 6: FINANCE & FEES");
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

    // Phase 7: Assessments
    console.log("\nPHASE 7: ASSESSMENTS");
    console.log("-".repeat(40));

    await seedExams(prisma, schoolId, classes, subjects, students, teachers);
    await seedGrades(prisma, schoolId, classes, subjects, students, teachers);

    // Phase 8: Scheduling
    console.log("\nPHASE 8: SCHEDULING");
    console.log("-".repeat(40));

    await seedTimetable(prisma, schoolId, term1.id, periods, classes);

    // Phase 9: Learning Management
    console.log("\nPHASE 9: LEARNING MANAGEMENT");
    console.log("-".repeat(40));

    await seedStream(prisma, schoolId, teachers);
    await seedLessons(prisma, schoolId, classes);
    await seedReports(prisma, schoolId, terms[0].id, students, subjects);

    // Phase 10: Attendance
    console.log("\nPHASE 10: ATTENDANCE");
    console.log("-".repeat(40));

    await seedAttendance(prisma, schoolId, classes, students);

    // Phase 11: Admissions
    console.log("\nPHASE 11: ADMISSIONS");
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
