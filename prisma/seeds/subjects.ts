/**
 * Subjects Seed
 * Creates subjects with single-language names linked to departments
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

  // Create a lookup map for departments by name (Arabic)
  const deptMap = new Map(departments.map((d) => [d.departmentName, d]))

  for (const subjectData of SUBJECTS) {
    const department = deptMap.get(subjectData.department)
    if (!department) {
      console.log(
        `   Department ${subjectData.department} not found for ${subjectData.name}`
      )
      continue
    }

    const subject = await prisma.subject.upsert({
      where: {
        schoolId_departmentId_subjectName: {
          schoolId,
          departmentId: department.id,
          subjectName: subjectData.name,
        },
      },
      update: {
        lang: "ar",
      },
      create: {
        schoolId,
        departmentId: department.id,
        subjectName: subjectData.name,
        lang: "ar",
      },
    })

    subjects.push({
      id: subject.id,
      subjectName: subject.subjectName,
      lang: "ar",
      departmentId: subject.departmentId,
    })
  }

  logSuccess("Subjects", subjects.length, "Arabic primary")

  return subjects
}
