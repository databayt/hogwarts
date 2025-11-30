/**
 * Departments Seed Module
 * Creates departments and subjects
 */

import type { SeedPrisma, DepartmentRef, SubjectRef } from "./types";
import { DEPARTMENTS } from "./constants";

export async function seedDepartments(
  prisma: SeedPrisma,
  schoolId: string
): Promise<{
  departments: DepartmentRef[];
  subjects: SubjectRef[];
}> {
  console.log("📖 Creating departments and subjects...");

  const departments: DepartmentRef[] = [];
  const subjects: SubjectRef[] = [];

  for (const dept of DEPARTMENTS) {
    const department = await prisma.department.create({
      data: { schoolId, departmentName: dept.name },
    });
    departments.push({ id: department.id, departmentName: department.departmentName });

    for (const subjectName of dept.subjects) {
      const subject = await prisma.subject.create({
        data: { schoolId, departmentId: department.id, subjectName },
      });
      subjects.push({ id: subject.id, subjectName: subject.subjectName });
    }
  }

  console.log(`   ✅ Created: ${departments.length} departments, ${subjects.length} subjects\n`);

  return { departments, subjects };
}
