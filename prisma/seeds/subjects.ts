/**
 * Subjects Seed
 * Creates subjects with bilingual names linked to departments
 *
 * Phase 2: Academic Structure - Subjects
 */

import type { PrismaClient } from "@prisma/client"

import { SUBJECTS } from "./constants"
import type { DepartmentRef, SubjectRef } from "./types"
import { logSuccess } from "./utils"

// ============================================================================
// SUBJECTS SEEDING
// ============================================================================

/**
 * Seed subjects (19 subjects linked to departments)
 */
export async function seedSubjects(
  prisma: PrismaClient,
  schoolId: string,
  departments: DepartmentRef[]
): Promise<SubjectRef[]> {
  const subjects: SubjectRef[] = []

  // Create a lookup map for departments
  const deptMap = new Map(departments.map((d) => [d.departmentName, d]))

  for (const subjectData of SUBJECTS) {
    const department = deptMap.get(subjectData.departmentEn)
    if (!department) {
      console.log(
        `   ⚠️ Department ${subjectData.departmentEn} not found for ${subjectData.nameEn}`
      )
      continue
    }

    const subject = await prisma.subject.upsert({
      where: {
        schoolId_departmentId_subjectName: {
          schoolId,
          departmentId: department.id,
          subjectName: subjectData.nameEn,
        },
      },
      update: {
        subjectNameAr: subjectData.nameAr,
      },
      create: {
        schoolId,
        departmentId: department.id,
        subjectName: subjectData.nameEn,
        subjectNameAr: subjectData.nameAr,
      },
    })

    subjects.push({
      id: subject.id,
      subjectName: subject.subjectName,
      subjectNameAr: subject.subjectNameAr || "",
      departmentId: subject.departmentId,
    })
  }

  logSuccess("Subjects", subjects.length, "bilingual AR+EN")

  return subjects
}
