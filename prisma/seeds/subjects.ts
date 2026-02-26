// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Subjects Seed
 * Creates school-level Subject records from the ClickView catalog.
 *
 * Phase 2: Academic Structure - Subjects
 */

import type { PrismaClient } from "@prisma/client"

import type { DepartmentRef, SubjectRef } from "./types"
import { logSuccess } from "./utils"

// Map ClickView subject names to Arabic department names
const SUBJECT_TO_DEPT: Record<string, string> = {
  "English Language Arts": "اللغات",
  "World Languages": "اللغات",

  Math: "العلوم",
  "Physical Science": "العلوم",
  "Chemical Science": "العلوم",
  Chemistry: "العلوم",
  Physics: "العلوم",
  "Life Science": "العلوم",
  "Life Sciences": "العلوم",
  "Earth and Space Science": "العلوم",
  "Computer Science and Technology": "العلوم",
  "Science and Engineering Practices": "العلوم",

  History: "العلوم الإنسانية",
  "U.S. History": "العلوم الإنسانية",
  "World History": "العلوم الإنسانية",
  Geography: "العلوم الإنسانية",
  "Civics and Government": "العلوم الإنسانية",
  Economics: "العلوم الإنسانية",
  "Business and Economics": "العلوم الإنسانية",
  Psychology: "العلوم الإنسانية",
  Sociology: "العلوم الإنسانية",
  "Life Skills": "العلوم الإنسانية",
  "Celebrations, Commemorations, and Festivals": "العلوم الإنسانية",

  "Religion and Ethics": "الدين",
  "Religion and Philosophy": "الدين",
  Religion: "الدين",

  Arts: "الفنون والرياضة",
  "Physical Education": "الفنون والرياضة",
  Health: "الفنون والرياضة",

  "Careers and Technical Education": "تقنية المعلومات",
  "Career and Technical Education": "تقنية المعلومات",
  "Teacher Professional Development": "العلوم الإنسانية",
}

// ============================================================================
// SUBJECTS SEEDING
// ============================================================================

/**
 * Seed school-level subjects from ClickView catalog subjects.
 * Creates a Subject record per catalog subject, linked to a department.
 */
export async function seedSubjects(
  prisma: PrismaClient,
  schoolId: string,
  departments: DepartmentRef[]
): Promise<SubjectRef[]> {
  const subjects: SubjectRef[] = []
  const deptMap = new Map(departments.map((d) => [d.departmentName, d]))

  // Get all published ClickView catalog subjects
  const catalogSubjects = await prisma.catalogSubject.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true, name: true, slug: true },
    orderBy: { sortOrder: "asc" },
  })

  for (const cs of catalogSubjects) {
    const deptName = SUBJECT_TO_DEPT[cs.name] ?? "العلوم"
    const department = deptMap.get(deptName)
    if (!department) continue

    const subject = await prisma.subject.upsert({
      where: {
        schoolId_departmentId_subjectName: {
          schoolId,
          departmentId: department.id,
          subjectName: cs.name,
        },
      },
      update: { lang: "en", catalogSubjectId: cs.id },
      create: {
        schoolId,
        departmentId: department.id,
        subjectName: cs.name,
        lang: "en",
        catalogSubjectId: cs.id,
      },
    })

    subjects.push({
      id: subject.id,
      subjectName: subject.subjectName,
      lang: "en",
      departmentId: subject.departmentId,
    })
  }

  logSuccess("Subjects", subjects.length, "from ClickView catalog")

  return subjects
}
