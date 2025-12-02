/**
 * Seed Grades Only
 * Runs grades seed on existing database data
 */

import { PrismaClient } from "@prisma/client";
import { seedGrades } from "./grades";
import type { SeedPrisma, ClassRef, SubjectRef, StudentRef, TeacherRef } from "./types";

const prisma = new PrismaClient() as SeedPrisma;

async function main() {
  console.log("\n📝 SEEDING GRADES DATA...\n");

  try {
    // Get school
    const school = await prisma.school.findFirst();
    if (!school) {
      throw new Error("No school found. Run full seed first.");
    }
    const schoolId = school.id;
    console.log(`📍 School: ${school.name}`);

    // Get classes
    const classes = await prisma.class.findMany({
      where: { schoolId },
      select: { id: true, name: true },
    }) as ClassRef[];
    console.log(`📚 Classes: ${classes.length}`);

    // Get subjects
    const subjects = await prisma.subject.findMany({
      where: { schoolId },
      select: { id: true, subjectName: true },
    }) as SubjectRef[];
    console.log(`📖 Subjects: ${subjects.length}`);

    // Get students
    const students = await prisma.student.findMany({
      where: { schoolId },
      select: { id: true, userId: true },
    }) as StudentRef[];
    console.log(`👨‍🎓 Students: ${students.length}`);

    // Get teachers
    const teachers = await prisma.teacher.findMany({
      where: { schoolId },
      select: { id: true, userId: true, emailAddress: true },
    }) as TeacherRef[];
    console.log(`👨‍🏫 Teachers: ${teachers.length}`);

    // Run grades seed
    await seedGrades(prisma, schoolId, classes, subjects, students, teachers);

    console.log("\n✅ GRADES SEED COMPLETED\n");
  } catch (error) {
    console.error("\n❌ GRADES SEED FAILED:", error);
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
