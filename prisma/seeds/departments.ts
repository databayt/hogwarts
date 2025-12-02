/**
 * Departments Seed Module
 * Creates departments and subjects (Sudanese National Curriculum)
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
  console.log("📖 Creating departments and subjects (Sudanese Curriculum)...");

  const departments: DepartmentRef[] = [];
  const subjects: SubjectRef[] = [];

  for (const dept of DEPARTMENTS) {
    const department = await prisma.department.create({
      data: {
        schoolId,
        departmentName: dept.nameEn,
        departmentNameAr: dept.name,  // Arabic name for bilingual support
      },
    });
    departments.push({ id: department.id, departmentName: department.departmentName });

    for (const subject of dept.subjects) {
      const subjectRecord = await prisma.subject.create({
        data: {
          schoolId,
          departmentId: department.id,
          subjectName: subject.en,
          subjectNameAr: subject.ar,  // Arabic name for bilingual support
        },
      });
      subjects.push({ id: subjectRecord.id, subjectName: subjectRecord.subjectName });
    }
  }

  console.log(`   ✅ Created: ${departments.length} departments, ${subjects.length} subjects\n`);

  return { departments, subjects };
}
