/**
 * Academic Structure + Catalog Bridge Seed
 *
 * Creates for the demo school:
 *   - 3 AcademicLevels (Elementary, Middle, High)
 *   - 14 AcademicGrades (KG1-KG2, Grade 1-12)
 *   - 2 AcademicStreams (Science, Arts for grades 10-12)
 *   - SchoolSubjectSelections (bridge: demo school → catalog subjects)
 */

import type { PrismaClient } from "@prisma/client"

import { SUBJECTS, YEAR_LEVELS } from "./constants"
import type { CatalogSubjectRef, YearLevelRef } from "./types"
import { logSuccess } from "./utils"

// ============================================================================
// Level definitions
// ============================================================================

const LEVELS = [
  {
    name: "المرحلة الابتدائية",
    slug: "elementary",
    level: "ELEMENTARY" as const,
    levelOrder: 1,
    startGrade: 1,
    endGrade: 6,
  },
  {
    name: "المرحلة المتوسطة",
    slug: "middle",
    level: "MIDDLE" as const,
    levelOrder: 2,
    startGrade: 7,
    endGrade: 9,
  },
  {
    name: "المرحلة الثانوية",
    slug: "high",
    level: "HIGH" as const,
    levelOrder: 3,
    startGrade: 10,
    endGrade: 12,
  },
]

// Grade definitions: KG1-KG2 (gradeNumber -1, 0) + Grade 1-12
const GRADES = [
  { name: "الروضة الأولى", slug: "kg1", gradeNumber: -1, yearLevelOrder: 1 },
  { name: "الروضة الثانية", slug: "kg2", gradeNumber: 0, yearLevelOrder: 2 },
  { name: "الصف الأول", slug: "grade-1", gradeNumber: 1, yearLevelOrder: 3 },
  { name: "الصف الثاني", slug: "grade-2", gradeNumber: 2, yearLevelOrder: 4 },
  { name: "الصف الثالث", slug: "grade-3", gradeNumber: 3, yearLevelOrder: 5 },
  { name: "الصف الرابع", slug: "grade-4", gradeNumber: 4, yearLevelOrder: 6 },
  {
    name: "الصف الخامس",
    slug: "grade-5",
    gradeNumber: 5,
    yearLevelOrder: 7,
  },
  {
    name: "الصف السادس",
    slug: "grade-6",
    gradeNumber: 6,
    yearLevelOrder: 8,
  },
  {
    name: "الصف السابع",
    slug: "grade-7",
    gradeNumber: 7,
    yearLevelOrder: 9,
  },
  {
    name: "الصف الثامن",
    slug: "grade-8",
    gradeNumber: 8,
    yearLevelOrder: 10,
  },
  {
    name: "الصف التاسع",
    slug: "grade-9",
    gradeNumber: 9,
    yearLevelOrder: 11,
  },
  {
    name: "الصف العاشر",
    slug: "grade-10",
    gradeNumber: 10,
    yearLevelOrder: 12,
  },
  {
    name: "الصف الحادي عشر",
    slug: "grade-11",
    gradeNumber: 11,
    yearLevelOrder: 13,
  },
  {
    name: "الصف الثاني عشر",
    slug: "grade-12",
    gradeNumber: 12,
    yearLevelOrder: 14,
  },
]

// Streams for grades 10-12
const STREAMS = [
  { name: "العلمي", slug: "science", streamType: "SCIENCE" as const },
  { name: "الأدبي", slug: "arts", streamType: "ARTS" as const },
]

// ============================================================================
// Level → gradeNumber mapping
// ============================================================================

function getLevelForGrade(
  gradeNumber: number
): "ELEMENTARY" | "MIDDLE" | "HIGH" | null {
  if (gradeNumber >= 1 && gradeNumber <= 6) return "ELEMENTARY"
  if (gradeNumber >= 7 && gradeNumber <= 9) return "MIDDLE"
  if (gradeNumber >= 10 && gradeNumber <= 12) return "HIGH"
  return null // KG
}

// Map subject levels to grade ranges
function subjectAppliesToGrade(
  subjectLevels: string[],
  gradeNumber: number
): boolean {
  const gradeLevel = getLevelForGrade(gradeNumber)
  if (!gradeLevel) return false
  return subjectLevels.includes(gradeLevel.toLowerCase())
}

// ============================================================================
// Main seed function
// ============================================================================

/** Map School.schoolLevel to catalog level names */
const SCHOOL_LEVEL_TO_CATALOG: Record<string, string[]> = {
  primary: ["ELEMENTARY"],
  secondary: ["MIDDLE", "HIGH"],
  both: ["ELEMENTARY", "MIDDLE", "HIGH"],
}

export async function seedAcademicStructureCatalog(
  prisma: PrismaClient,
  schoolId: string,
  yearLevels: YearLevelRef[],
  catalogSubjects?: CatalogSubjectRef[],
  schoolLevel?: string | null
): Promise<void> {
  // Filter levels/grades/streams based on schoolLevel
  const allowedLevels =
    SCHOOL_LEVEL_TO_CATALOG[schoolLevel ?? "both"] ??
    SCHOOL_LEVEL_TO_CATALOG.both

  const filteredLevels = LEVELS.filter((l) => allowedLevels.includes(l.level))
  const filteredGrades = GRADES.filter((g) => {
    const level = getLevelForGrade(g.gradeNumber)
    // KG grades always included when ELEMENTARY is allowed
    return level === null
      ? allowedLevels.includes("ELEMENTARY")
      : allowedLevels.includes(level)
  })
  const filteredStreamGrades = allowedLevels.includes("HIGH")
    ? [10, 11, 12]
    : []

  // Build yearLevel lookup by order
  const yearLevelByOrder = new Map(yearLevels.map((yl) => [yl.levelOrder, yl]))

  // ======================================================================
  // Step 1: Create AcademicLevels
  // ======================================================================

  const levelIds = new Map<string, string>() // slug → id

  for (const lvl of filteredLevels) {
    const record = await prisma.academicLevel.upsert({
      where: {
        schoolId_slug: { schoolId, slug: lvl.slug },
      },
      update: {
        name: lvl.name,
        level: lvl.level,
        levelOrder: lvl.levelOrder,
        startGrade: lvl.startGrade,
        endGrade: lvl.endGrade,
      },
      create: {
        schoolId,
        name: lvl.name,
        slug: lvl.slug,
        lang: "ar",
        level: lvl.level,
        levelOrder: lvl.levelOrder,
        startGrade: lvl.startGrade,
        endGrade: lvl.endGrade,
      },
    })
    levelIds.set(lvl.slug, record.id)
  }

  logSuccess(
    "AcademicLevels",
    filteredLevels.length,
    `${filteredLevels.length} levels`
  )

  // ======================================================================
  // Step 2: Create AcademicGrades
  // ======================================================================

  const gradeIds = new Map<number, string>() // gradeNumber → id

  for (const g of filteredGrades) {
    // Determine which level this grade belongs to
    const levelSlug =
      g.gradeNumber >= 1 && g.gradeNumber <= 6
        ? "elementary"
        : g.gradeNumber >= 7 && g.gradeNumber <= 9
          ? "middle"
          : g.gradeNumber >= 10 && g.gradeNumber <= 12
            ? "high"
            : "elementary" // KG → elementary

    const levelId = levelIds.get(levelSlug)!

    // Link to existing YearLevel
    const yearLevel = yearLevelByOrder.get(g.yearLevelOrder)

    const record = await prisma.academicGrade.upsert({
      where: {
        schoolId_gradeNumber: { schoolId, gradeNumber: g.gradeNumber },
      },
      update: {
        name: g.name,
        slug: g.slug,
        levelId,
        yearLevelId: yearLevel?.id ?? null,
      },
      create: {
        schoolId,
        levelId,
        yearLevelId: yearLevel?.id ?? null,
        name: g.name,
        slug: g.slug,
        lang: "ar",
        gradeNumber: g.gradeNumber,
        maxStudents: 40,
      },
    })
    gradeIds.set(g.gradeNumber, record.id)
  }

  logSuccess(
    "AcademicGrades",
    filteredGrades.length,
    `${filteredGrades.length} grades`
  )

  // ======================================================================
  // Step 3: Create AcademicStreams (Science + Arts for grades 10-12)
  // ======================================================================

  let streamCount = 0
  for (const gradeNum of filteredStreamGrades) {
    const gradeId = gradeIds.get(gradeNum)
    if (!gradeId) continue

    for (const s of STREAMS) {
      await prisma.academicStream.upsert({
        where: {
          schoolId_gradeId_slug: { schoolId, gradeId, slug: s.slug },
        },
        update: {
          name: s.name,
          streamType: s.streamType,
        },
        create: {
          schoolId,
          gradeId,
          name: s.name,
          slug: s.slug,
          lang: "ar",
          streamType: s.streamType,
        },
      })
      streamCount++
    }
  }

  logSuccess("AcademicStreams", streamCount, "Science + Arts")

  // ======================================================================
  // Step 4: Create SchoolSubjectSelections (bridge records)
  // ======================================================================

  if (!catalogSubjects) {
    // Load from DB if not passed
    const subjects = await prisma.catalogSubject.findMany({
      where: { status: "PUBLISHED", country: "SD" },
      select: { id: true, name: true, slug: true, levels: true },
    })
    catalogSubjects = subjects.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
    }))
  }

  // Load full catalog subjects with levels for matching
  const fullSubjects = await prisma.catalogSubject.findMany({
    where: { status: "PUBLISHED", country: "SD" },
    select: { id: true, name: true, levels: true },
  })

  const subjectLevelMap = new Map(
    fullSubjects.map((s) => [s.id, s.levels.map((l) => l.toLowerCase())])
  )

  let selectionCount = 0

  for (const cs of catalogSubjects) {
    const levels = subjectLevelMap.get(cs.id) ?? []

    // For each grade where this subject applies, create a selection
    for (const g of GRADES) {
      if (!subjectAppliesToGrade(levels, g.gradeNumber)) continue

      const gradeId = gradeIds.get(g.gradeNumber)
      if (!gradeId) continue

      // Use findFirst + create instead of upsert for nullable streamId
      const existing = await prisma.schoolSubjectSelection.findFirst({
        where: {
          schoolId,
          catalogSubjectId: cs.id,
          gradeId,
          streamId: null,
        },
      })

      if (!existing) {
        await prisma.schoolSubjectSelection.create({
          data: {
            schoolId,
            catalogSubjectId: cs.id,
            gradeId,
            streamId: null,
            isRequired: true,
            isActive: true,
          },
        })
        selectionCount++
      }
    }
  }

  logSuccess(
    "SchoolSubjectSelections",
    selectionCount,
    "demo school bridge records"
  )
}
