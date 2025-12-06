/**
 * Departments Seed Module - Bilingual (AR/EN)
 * Creates departments and subjects (Sudanese National Curriculum)
 */

import type { SeedPrisma, DepartmentRef, SubjectRef } from "./types";
import { DEPARTMENTS, SUBJECTS } from "./constants";

export async function seedDepartments(
  prisma: SeedPrisma,
  schoolId: string
): Promise<{
  departments: DepartmentRef[];
  subjects: SubjectRef[];
}> {
  console.log("📖 Creating departments and subjects (Sudanese Curriculum, Bilingual AR/EN)...");

  const departments: DepartmentRef[] = [];
  const subjects: SubjectRef[] = [];

  // Upsert all departments first
  for (const dept of DEPARTMENTS) {
    const department = await prisma.department.upsert({
      where: { schoolId_departmentName: { schoolId, departmentName: dept.en } },
      update: {
        departmentNameAr: dept.ar,
      },
      create: {
        schoolId,
        departmentName: dept.en,
        departmentNameAr: dept.ar,
      },
    });
    departments.push({ id: department.id, departmentName: department.departmentName });
  }

  // Upsert subjects and link to their departments
  for (const subj of SUBJECTS) {
    const dept = departments.find(d => d.departmentName === subj.departmentEn);
    if (!dept) {
      console.warn(`   ⚠️ Department not found for subject: ${subj.en}`);
      continue;
    }

    const subjectRecord = await prisma.subject.upsert({
      where: { schoolId_departmentId_subjectName: { schoolId, departmentId: dept.id, subjectName: subj.en } },
      update: {
        subjectNameAr: subj.ar,
      },
      create: {
        schoolId,
        departmentId: dept.id,
        subjectName: subj.en,
        subjectNameAr: subj.ar,
      },
    });
    subjects.push({ id: subjectRecord.id, subjectName: subjectRecord.subjectName });
  }

  console.log(`   ✅ Created: ${departments.length} departments, ${subjects.length} subjects\n`);

  return { departments, subjects };
}
