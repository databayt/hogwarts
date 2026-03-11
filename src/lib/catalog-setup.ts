// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { db } from "@/lib/db"

/**
 * Grade-to-level mapping for Sudanese education system.
 * Elementary: Grades 1-6, Middle: Grades 7-9, High: Grades 10-12
 */
const LEVEL_CONFIG = [
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

const GRADE_NAMES: Record<number, string> = {
  1: "الصف الأول",
  2: "الصف الثاني",
  3: "الصف الثالث",
  4: "الصف الرابع",
  5: "الصف الخامس",
  6: "الصف السادس",
  7: "الصف السابع",
  8: "الصف الثامن",
  9: "الصف التاسع",
  10: "الصف العاشر",
  11: "الصف الحادي عشر",
  12: "الصف الثاني عشر",
}

const HIGH_SCHOOL_STREAMS = [
  { name: "العلمي", slug: "science", streamType: "SCIENCE" as const },
  { name: "الأدبي", slug: "arts", streamType: "ARTS" as const },
]

/**
 * Subject name patterns that are stream-specific for grades 10-12.
 * Subjects matching SCIENCE_ONLY are assigned to science stream only.
 * Subjects matching ARTS_ONLY are assigned to arts stream only.
 * All other subjects remain shared (null streamId).
 */
const SCIENCE_ONLY_PATTERNS = [
  "physics",
  "chemistry",
  "biology",
  "calculus",
  "فيزياء",
  "كيمياء",
  "أحياء",
]
const ARTS_ONLY_PATTERNS = ["philosophy", "فلسفة"]

function getSubjectStreamType(subjectName: string): "SCIENCE" | "ARTS" | null {
  const lower = subjectName.toLowerCase()
  // Exclude "physical education" before checking "physics" pattern
  if (lower.includes("physical education") || lower.includes("تربية بدنية"))
    return null
  if (SCIENCE_ONLY_PATTERNS.some((p) => lower.includes(p))) return "SCIENCE"
  if (ARTS_ONLY_PATTERNS.some((p) => lower.includes(p))) return "ARTS"
  return null
}

/**
 * Get default weekly periods for a subject based on name and grade.
 * Core subjects get more periods; electives/specials get fewer.
 */
function getDefaultWeeklyPeriods(
  subjectName: string,
  gradeNumber: number
): number {
  const name = subjectName.toLowerCase()
  if (name.includes("math") || name.includes("رياضيات"))
    return gradeNumber <= 6 ? 5 : 4
  if (name.includes("arabic") || name.includes("عربي")) return 5
  if (name.includes("english") || name.includes("إنجليزي"))
    return gradeNumber <= 6 ? 4 : 5
  if (name.includes("science") || name.includes("علوم"))
    return gradeNumber <= 6 ? 3 : 4
  if (
    name.includes("pe") ||
    name.includes("بدني") ||
    name.includes("art") ||
    name.includes("فن") ||
    name.includes("music") ||
    name.includes("موسيقى")
  )
    return 2
  return 3
}

/** Map School.schoolLevel to catalog level names */
const SCHOOL_LEVEL_TO_CATALOG: Record<string, string[]> = {
  primary: ["ELEMENTARY"],
  secondary: ["MIDDLE", "HIGH"],
  both: ["ELEMENTARY", "MIDDLE", "HIGH"],
}

// ============================================================================
// Year Level defaults (filtered by schoolLevel)
// ============================================================================

const YEAR_LEVEL_DEFAULTS = [
  {
    name: "KG1",
    slug: "kg1",
    levelOrder: 1,
    schoolLevels: ["primary", "both"],
  },
  {
    name: "KG2",
    slug: "kg2",
    levelOrder: 2,
    schoolLevels: ["primary", "both"],
  },
  {
    name: "Grade 1",
    slug: "grade-1",
    levelOrder: 3,
    schoolLevels: ["primary", "both"],
  },
  {
    name: "Grade 2",
    slug: "grade-2",
    levelOrder: 4,
    schoolLevels: ["primary", "both"],
  },
  {
    name: "Grade 3",
    slug: "grade-3",
    levelOrder: 5,
    schoolLevels: ["primary", "both"],
  },
  {
    name: "Grade 4",
    slug: "grade-4",
    levelOrder: 6,
    schoolLevels: ["primary", "both"],
  },
  {
    name: "Grade 5",
    slug: "grade-5",
    levelOrder: 7,
    schoolLevels: ["primary", "both"],
  },
  {
    name: "Grade 6",
    slug: "grade-6",
    levelOrder: 8,
    schoolLevels: ["primary", "both"],
  },
  {
    name: "Grade 7",
    slug: "grade-7",
    levelOrder: 9,
    schoolLevels: ["secondary", "both"],
  },
  {
    name: "Grade 8",
    slug: "grade-8",
    levelOrder: 10,
    schoolLevels: ["secondary", "both"],
  },
  {
    name: "Grade 9",
    slug: "grade-9",
    levelOrder: 11,
    schoolLevels: ["secondary", "both"],
  },
  {
    name: "Grade 10",
    slug: "grade-10",
    levelOrder: 12,
    schoolLevels: ["secondary", "both"],
  },
  {
    name: "Grade 11",
    slug: "grade-11",
    levelOrder: 13,
    schoolLevels: ["secondary", "both"],
  },
  {
    name: "Grade 12",
    slug: "grade-12",
    levelOrder: 14,
    schoolLevels: ["secondary", "both"],
  },
]

// ============================================================================
// Department defaults (6 universal)
// ============================================================================

const DEPARTMENT_DEFAULTS = [
  { name: "Languages", slug: "languages" },
  { name: "Sciences", slug: "sciences" },
  { name: "Humanities", slug: "humanities" },
  { name: "Religion", slug: "religion" },
  { name: "ICT", slug: "ict" },
  { name: "Arts & Sports", slug: "arts-sports" },
]

// ============================================================================
// Score Range defaults (9 entries: A+ through F)
// ============================================================================

// gpa field is reserved for future use (ScoreRange schema does not yet have a gpa column)
const SCORE_RANGE_DEFAULTS = [
  { grade: "A+", minScore: 95, maxScore: 100, gpa: 4.0 },
  { grade: "A", minScore: 90, maxScore: 94, gpa: 3.75 },
  { grade: "B+", minScore: 85, maxScore: 89, gpa: 3.5 },
  { grade: "B", minScore: 80, maxScore: 84, gpa: 3.0 },
  { grade: "C+", minScore: 75, maxScore: 79, gpa: 2.5 },
  { grade: "C", minScore: 70, maxScore: 74, gpa: 2.0 },
  { grade: "D+", minScore: 65, maxScore: 69, gpa: 1.5 },
  { grade: "D", minScore: 60, maxScore: 64, gpa: 1.0 },
  { grade: "F", minScore: 0, maxScore: 59, gpa: 0.0 },
]

// ============================================================================
// Curriculum inference
// ============================================================================

/**
 * Infer curriculum from country + schoolType.
 * International schools always get us-k12.
 * Known countries get their national curriculum.
 * Unknown countries fall back to us-k12 as baseline.
 */
function inferCurriculum(country: string, schoolType?: string | null): string {
  if (schoolType === "international") return "us-k12"
  const map: Record<string, string> = {
    US: "us-k12",
    GB: "british",
    SD: "national",
    SA: "national",
    EG: "national",
    AE: "national",
    QA: "national",
    JO: "national",
  }
  return map[country] || "us-k12"
}

// ============================================================================
// setupDefaultsForSchool — YearLevels, Departments, ScoreRanges
// ============================================================================

/**
 * Auto-provision YearLevels, Departments, and ScoreRanges for a new school.
 * Idempotent — skips if records already exist.
 */
export async function setupDefaultsForSchool(
  schoolId: string,
  schoolLevel: string = "both"
) {
  // Idempotency reads outside transaction for performance
  const [existingYearLevels, existingDepts, existingRanges] = await Promise.all(
    [
      db.yearLevel.count({ where: { schoolId } }),
      db.department.count({ where: { schoolId } }),
      db.scoreRange.count({ where: { schoolId } }),
    ]
  )

  if (existingYearLevels > 0 && existingDepts > 0 && existingRanges > 0) {
    return { yearLevels: 0, departments: 0, scoreRanges: 0 }
  }

  return db.$transaction(
    async (tx) => {
      const results = { yearLevels: 0, departments: 0, scoreRanges: 0 }

      // 1. YearLevels (filtered by schoolLevel)
      if (existingYearLevels === 0) {
        const applicable = YEAR_LEVEL_DEFAULTS.filter((yl) =>
          yl.schoolLevels.includes(schoolLevel)
        )
        for (const yl of applicable) {
          await tx.yearLevel.create({
            data: {
              schoolId,
              levelName: yl.name,
              levelOrder: yl.levelOrder,
            },
          })
          results.yearLevels++
        }
      }

      // 2. Departments
      if (existingDepts === 0) {
        for (const dept of DEPARTMENT_DEFAULTS) {
          await tx.department.create({
            data: {
              schoolId,
              departmentName: dept.name,
            },
          })
          results.departments++
        }
      }

      // 3. ScoreRanges
      if (existingRanges === 0) {
        for (const range of SCORE_RANGE_DEFAULTS) {
          await tx.scoreRange.create({
            data: {
              schoolId,
              grade: range.grade,
              minScore: range.minScore,
              maxScore: range.maxScore,
            },
          })
          results.scoreRanges++
        }
      }

      return results
    },
    { timeout: 30000 }
  )
}

// ============================================================================
// setupCatalogForSchool — AcademicLevels, Grades, Streams, Subject Selections
// ============================================================================

/**
 * Auto-setup catalog for a new school.
 * Creates AcademicLevels, AcademicGrades, AcademicStreams, and
 * SchoolSubjectSelection records linking all applicable catalog subjects.
 *
 * Uses progressive fallback for catalog matching:
 * 1. country + curriculum + schoolType filter → exact match
 * 2. country + curriculum → broad match
 * 3. country="*" + curriculum → universal (IB, British worldwide)
 * 4. US + us-k12 → K-12 baseline fallback
 *
 * Respects School.schoolLevel to only create relevant levels/grades.
 * Called during school onboarding or manually from SaaS dashboard.
 */
export async function setupCatalogForSchool(
  schoolId: string,
  options?: {
    country?: string
    curriculum?: string
    schoolType?: string
    skipIfExists?: boolean
  }
) {
  const { skipIfExists = true } = options ?? {}

  // Skip if school already has academic structure
  if (skipIfExists) {
    const existingLevels = await db.academicLevel.count({
      where: { schoolId },
    })
    if (existingLevels > 0) {
      return { skipped: true, message: "School already has academic structure" }
    }
  }

  // Read school's actual country and level classification
  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: {
      schoolLevel: true,
      country: true,
      schoolType: true,
      curriculum: true,
    },
  })

  // Use school's country (ISO code), then options override, then fallback
  const country = school?.country || options?.country || "US"
  const schoolType = school?.schoolType || options?.schoolType || undefined
  // Infer curriculum from country+schoolType for catalog lookup
  // NOTE: school.curriculum stores the timetable structure slug (e.g. "us-standard"),
  // NOT the catalog curriculum. Only options override or inferCurriculum() are valid here.
  const curriculum = options?.curriculum || inferCurriculum(country, schoolType)
  const allowedLevels =
    SCHOOL_LEVEL_TO_CATALOG[school?.schoolLevel ?? "both"] ??
    SCHOOL_LEVEL_TO_CATALOG.both
  const applicableLevelConfig = LEVEL_CONFIG.filter((l) =>
    allowedLevels.includes(l.level)
  )

  // Progressive fallback for catalog subjects
  const catalogSubjects = await findCatalogSubjects(
    country,
    curriculum,
    schoolType
  )

  if (catalogSubjects.length === 0) {
    console.warn(
      `[setupCatalogForSchool] No catalog subjects found after all fallbacks for school ${schoolId} (country=${country}, curriculum=${curriculum})`
    )
    return {
      skipped: true,
      message: "No catalog subjects found after all fallback attempts",
    }
  }

  // Get existing YearLevels for linking
  const yearLevels = await db.yearLevel.findMany({
    where: { schoolId },
    select: { id: true, levelOrder: true },
    orderBy: { levelOrder: "asc" },
  })

  // Build grade-number-to-yearLevel map using YEAR_LEVEL_DEFAULTS slugs
  // (KG1=levelOrder 1, KG2=2, Grade 1=3, ..., so raw levelOrder != grade number)
  const yearLevelByOrder = new Map(
    yearLevels.map((yl) => [yl.levelOrder, yl.id])
  )
  const gradeNumberToYearLevel = new Map<number, string>()
  for (const ylDef of YEAR_LEVEL_DEFAULTS) {
    const match = ylDef.slug.match(/^grade-(\d+)$/)
    if (match) {
      const gradeNum = parseInt(match[1], 10)
      const ylId = yearLevelByOrder.get(ylDef.levelOrder)
      if (ylId) gradeNumberToYearLevel.set(gradeNum, ylId)
    }
  }

  const result = await db.$transaction(
    async (tx) => {
      // 1. Create academic levels (filtered by schoolLevel)
      const levelRecords: Array<{ id: string; level: string }> = []
      for (const levelConfig of applicableLevelConfig) {
        const level = await tx.academicLevel.create({
          data: {
            schoolId,
            name: levelConfig.name,
            slug: levelConfig.slug,
            level: levelConfig.level,
            levelOrder: levelConfig.levelOrder,
            startGrade: levelConfig.startGrade,
            endGrade: levelConfig.endGrade,
          },
        })
        levelRecords.push({ id: level.id, level: levelConfig.level })
      }

      // 2. Create academic grades (filtered by schoolLevel)
      const gradeRecords: Array<{
        id: string
        gradeNumber: number
        levelId: string
      }> = []

      for (const levelConfig of applicableLevelConfig) {
        const levelRecord = levelRecords.find(
          (l) => l.level === levelConfig.level
        )!

        for (
          let grade = levelConfig.startGrade;
          grade <= levelConfig.endGrade;
          grade++
        ) {
          const academicGrade = await tx.academicGrade.create({
            data: {
              schoolId,
              levelId: levelRecord.id,
              yearLevelId: gradeNumberToYearLevel.get(grade) ?? null,
              name: GRADE_NAMES[grade] ?? `الصف ${grade}`,
              slug: `grade-${grade}`,
              gradeNumber: grade,
            },
          })
          gradeRecords.push({
            id: academicGrade.id,
            gradeNumber: grade,
            levelId: levelRecord.id,
          })
        }
      }

      // 3. Create high school streams (Science + Arts for grades 10-12)
      const streamRecords: Array<{
        id: string
        gradeId: string
        streamType: string
      }> = []
      const highGrades = gradeRecords.filter((g) => g.gradeNumber >= 10)

      for (const grade of highGrades) {
        for (const streamDef of HIGH_SCHOOL_STREAMS) {
          const stream = await tx.academicStream.create({
            data: {
              schoolId,
              gradeId: grade.id,
              name: streamDef.name,
              slug: streamDef.slug,
              streamType: streamDef.streamType,
            },
          })
          streamRecords.push({
            id: stream.id,
            gradeId: grade.id,
            streamType: streamDef.streamType,
          })
        }
      }

      // 4. Create subject selections (link catalog subjects to grades)
      // Collect all selection data first, then bulk insert with createMany
      const selectionData: Array<{
        schoolId: string
        catalogSubjectId: string
        gradeId: string
        isRequired: boolean
        isActive: boolean
        weeklyPeriods: number
        streamId?: string
      }> = []

      const allowedGradeNumbers = new Set(
        gradeRecords.map((g) => g.gradeNumber)
      )

      for (const subject of catalogSubjects) {
        let applicableGrades: number[]

        if (subject.grades.length > 0) {
          applicableGrades = subject.grades.filter((g) =>
            allowedGradeNumbers.has(g)
          )
        } else {
          const levelToGrades = (level: string): number[] => {
            if (!allowedLevels.includes(level)) return []
            switch (level) {
              case "ELEMENTARY":
                return [1, 2, 3, 4, 5, 6]
              case "MIDDLE":
                return [7, 8, 9]
              case "HIGH":
                return [10, 11, 12]
              default:
                return []
            }
          }
          applicableGrades = subject.levels.flatMap(levelToGrades)
        }

        for (const gradeNumber of applicableGrades) {
          const gradeRecord = gradeRecords.find(
            (g) => g.gradeNumber === gradeNumber
          )
          if (!gradeRecord) continue

          const baseData = {
            schoolId,
            catalogSubjectId: subject.id,
            gradeId: gradeRecord.id,
            isRequired: true,
            isActive: true,
            weeklyPeriods: getDefaultWeeklyPeriods(subject.name, gradeNumber),
          }

          const subjectStreamType =
            gradeNumber >= 10 ? getSubjectStreamType(subject.name) : null
          const gradeStreams = streamRecords.filter(
            (s) => s.gradeId === gradeRecord.id
          )

          if (subjectStreamType && gradeStreams.length > 0) {
            const matchingStreams = gradeStreams.filter(
              (s) => s.streamType === subjectStreamType
            )
            for (const stream of matchingStreams) {
              selectionData.push({ ...baseData, streamId: stream.id })
            }
          } else {
            selectionData.push(baseData)
          }
        }
      }

      // Bulk insert all selections at once
      if (selectionData.length > 0) {
        await tx.schoolSubjectSelection.createMany({ data: selectionData })
      }
      const selectionCount = selectionData.length

      return {
        skipped: false,
        levels: levelRecords.length,
        grades: gradeRecords.length,
        streams: streamRecords.length,
        selections: selectionCount,
        subjects: catalogSubjects.length,
      }
    },
    { timeout: 60000 }
  )

  // Update usage counts outside the main transaction to avoid timeout
  // This is non-critical metadata so it's OK if it partially fails
  try {
    const subjectIds = catalogSubjects.map((s) => s.id)
    await db.$executeRawUnsafe(
      `UPDATE catalog_subjects SET "usageCount" = "usageCount" + 1 WHERE id = ANY($1::text[])`,
      subjectIds
    )
  } catch {
    // Non-critical: usage count is just metadata
  }

  return result
}

/**
 * Progressive fallback catalog subject finder.
 * Tries increasingly broad queries until subjects are found.
 */
async function findCatalogSubjects(
  country: string,
  curriculum: string,
  schoolType?: string
) {
  const selectFields = {
    id: true,
    name: true,
    levels: true,
    grades: true,
  } as const

  // Step 1: Exact match (country + curriculum + schoolType filter)
  if (schoolType) {
    const exact = await db.catalogSubject.findMany({
      where: {
        status: "PUBLISHED",
        country,
        curriculum,
        schoolTypes: { has: schoolType },
      },
      select: selectFields,
    })
    if (exact.length > 0) {
      console.log(
        `[setupCatalog] Exact match: ${exact.length} subjects (country=${country}, curriculum=${curriculum}, schoolType=${schoolType})`
      )
      return exact
    }
  }

  // Step 2: Broad match (country + curriculum, ignore schoolType)
  const broad = await db.catalogSubject.findMany({
    where: {
      status: "PUBLISHED",
      country,
      curriculum,
    },
    select: selectFields,
  })
  if (broad.length > 0) {
    console.log(
      `[setupCatalog] Broad match: ${broad.length} subjects (country=${country}, curriculum=${curriculum})`
    )
    return broad
  }

  // Step 3: Universal match (country="*" + curriculum, e.g. IB worldwide)
  const universal = await db.catalogSubject.findMany({
    where: {
      status: "PUBLISHED",
      country: "*",
      curriculum,
    },
    select: selectFields,
  })
  if (universal.length > 0) {
    console.log(
      `[setupCatalog] Universal match: ${universal.length} subjects (country=*, curriculum=${curriculum})`
    )
    return universal
  }

  // Step 4: Baseline fallback (US + us-k12)
  if (country !== "US" || curriculum !== "us-k12") {
    const fallback = await db.catalogSubject.findMany({
      where: {
        status: "PUBLISHED",
        country: "US",
        curriculum: "us-k12",
      },
      select: selectFields,
    })
    if (fallback.length > 0) {
      console.warn(
        `[setupCatalog] Fallback to US K-12: ${fallback.length} subjects (requested country=${country}, curriculum=${curriculum})`
      )
      return fallback
    }
  }

  return []
}

/**
 * Remove all catalog setup for a school.
 * Cascading deletes handle most cleanup via schema relations.
 */
export async function teardownCatalogForSchool(schoolId: string) {
  await db.$transaction(
    async (tx) => {
      // Delete bridge tables first
      await tx.schoolSubjectSelection.deleteMany({ where: { schoolId } })
      await tx.schoolContentOverride.deleteMany({ where: { schoolId } })

      // Delete academic structure
      await tx.academicStream.deleteMany({ where: { schoolId } })
      await tx.academicGrade.deleteMany({ where: { schoolId } })
      await tx.academicLevel.deleteMany({ where: { schoolId } })
    },
    { timeout: 30000 }
  )

  return { success: true }
}

/**
 * Create default school year + periods, then apply timetable structure for a newly onboarded school.
 * Called during onboarding completion when the school selected a schedule structure.
 */
export async function applyTimetableStructureForNewSchool(
  schoolId: string,
  structureSlug: string
) {
  // Create default school year if none exists
  const existingYear = await db.schoolYear.findFirst({
    where: { schoolId },
    select: { id: true },
  })

  let yearId: string

  if (existingYear) {
    yearId = existingYear.id
  } else {
    const now = new Date()
    const currentYear = now.getFullYear()
    const startMonth = now.getMonth() >= 8 ? currentYear : currentYear - 1

    const year = await db.schoolYear.create({
      data: {
        schoolId,
        yearName: `${startMonth}/${startMonth + 1}`,
        startDate: new Date(startMonth, 8, 1), // September 1
        endDate: new Date(startMonth + 1, 5, 30), // June 30
      },
    })
    yearId = year.id
  }

  // Import and call the timetable structure applier
  // This creates Period records from the structure definition
  const { getStructureBySlug, LEGACY_TEMPLATE_MAP } =
    await import("@/components/school-dashboard/timetable/structures")

  const slug = LEGACY_TEMPLATE_MAP[structureSlug] || structureSlug
  const structure = getStructureBySlug(slug)
  if (!structure)
    return { skipped: true, message: `Unknown structure: ${slug}` }

  // Wrap creation in transaction for atomicity
  const existingTerms = await db.term.count({ where: { schoolId, yearId } })

  return db.$transaction(
    async (tx) => {
      // Create periods
      let createdCount = 0
      for (const period of structure.periods) {
        const [startHour, startMin] = period.startTime.split(":").map(Number)
        const [endHour, endMin] = period.endTime.split(":").map(Number)

        await tx.period.create({
          data: {
            schoolId,
            yearId,
            name: period.name,
            startTime: new Date(Date.UTC(1970, 0, 1, startHour, startMin)),
            endTime: new Date(Date.UTC(1970, 0, 1, endHour, endMin)),
          },
        })
        createdCount++
      }

      // Create 2 default terms within the school year
      const now = new Date()
      const currentYear = now.getFullYear()
      const yearStart = now.getMonth() >= 8 ? currentYear : currentYear - 1

      let termId: string | undefined

      if (existingTerms === 0) {
        // Determine which term should be active based on current date
        const term1End = new Date(yearStart + 1, 0, 31) // Jan 31
        const isNowInTerm1 = now <= term1End

        const term1 = await tx.term.create({
          data: {
            schoolId,
            yearId,
            termNumber: 1,
            startDate: new Date(yearStart, 8, 1), // Sep 1
            endDate: term1End,
            isActive: isNowInTerm1,
          },
        })
        termId = term1.id

        const term2 = await tx.term.create({
          data: {
            schoolId,
            yearId,
            termNumber: 2,
            startDate: new Date(yearStart + 1, 1, 1), // Feb 1
            endDate: new Date(yearStart + 1, 5, 30), // Jun 30
            isActive: !isNowInTerm1,
          },
        })

        // Use Term 2 id if that's the active term
        if (!isNowInTerm1) termId = term2.id
      }

      // Resolve termId from existing terms if not freshly created
      if (!termId) {
        const activeTerm = await tx.term.findFirst({
          where: { schoolId, yearId, isActive: true },
          select: { id: true },
        })
        termId = activeTerm?.id
      }

      // Persist working days from structure definition
      if (termId) {
        const existingConfig = await tx.schoolWeekConfig.findFirst({
          where: { schoolId },
        })
        if (!existingConfig) {
          await tx.schoolWeekConfig.create({
            data: {
              schoolId,
              termId,
              workingDays: structure.workingDays,
              defaultLunchAfterPeriod: structure.lunchAfterPeriod,
            },
          })
        }
      }

      return { skipped: false, periods: createdCount, yearId, termId }
    },
    { timeout: 30000 }
  )
}

/**
 * Get ranked videos for a catalog lesson.
 * Ranking: featured first, then by engagement (views + rating).
 */
export async function getRankedLessonVideos(
  lessonId: string,
  schoolId: string | null,
  options?: { limit?: number; includeSchoolOnly?: boolean }
) {
  const { limit = 10, includeSchoolOnly = false } = options ?? {}

  const whereClause: Record<string, unknown> = {
    catalogLessonId: lessonId,
    approvalStatus: "APPROVED",
  }

  if (includeSchoolOnly && schoolId) {
    whereClause.schoolId = schoolId
  } else if (schoolId) {
    whereClause.OR = [{ schoolId }, { visibility: "PUBLIC" }]
  } else {
    whereClause.visibility = "PUBLIC"
  }

  const videos = await db.lessonVideo.findMany({
    where: whereClause,
    orderBy: [
      { isFeatured: "desc" },
      { viewCount: "desc" },
      { averageRating: "desc" },
    ],
    take: limit,
    select: {
      id: true,
      title: true,
      videoUrl: true,
      thumbnailUrl: true,
      durationSeconds: true,
      provider: true,
      visibility: true,
      isFeatured: true,
      viewCount: true,
      averageRating: true,
      ratingCount: true,
      user: {
        select: { username: true },
      },
      school: {
        select: { name: true },
      },
    },
  })

  return videos.map((v) => ({
    id: v.id,
    title: v.title,
    videoUrl: v.videoUrl,
    thumbnailUrl: v.thumbnailUrl,
    durationSeconds: v.durationSeconds,
    provider: v.provider,
    visibility: v.visibility,
    isFeatured: v.isFeatured,
    viewCount: v.viewCount,
    averageRating: v.averageRating,
    ratingCount: v.ratingCount,
    uploaderName: v.user?.username ?? null,
    schoolName: v.school?.name ?? null,
  }))
}

/**
 * Record a video view for engagement tracking.
 */
export async function recordVideoView(videoId: string) {
  await db.lessonVideo.update({
    where: { id: videoId },
    data: { viewCount: { increment: 1 } },
  })
}

/**
 * Auto-provision classrooms and sections based on the school's capacity settings
 * and academic grades. Called after onboarding to create default classroom/section
 * records for each grade.
 */
export async function autoProvisionSections(schoolId: string) {
  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: { sectionsPerGrade: true, studentsPerSection: true },
  })

  const sectionsPerGrade = school?.sectionsPerGrade || 2
  const studentsPerSection = school?.studentsPerSection || 30

  const grades = await db.academicGrade.findMany({
    where: { schoolId },
    orderBy: { gradeNumber: "asc" },
  })

  const classroomType = await db.classroomType.findFirst({
    where: { schoolId },
  })

  if (!classroomType || grades.length === 0) {
    return { classrooms: 0, sections: 0 }
  }

  const letters = "ABCDEFGHIJ".split("")

  // Batch all upserts in a single transaction to reduce connection overhead
  return db.$transaction(
    async (tx) => {
      let classroomCount = 0
      let sectionCount = 0

      for (const grade of grades) {
        for (let i = 0; i < sectionsPerGrade; i++) {
          const letter = letters[i]
          const roomName = `Grade ${grade.gradeNumber}-${letter}`

          const classroom = await tx.classroom.upsert({
            where: { schoolId_roomName: { schoolId, roomName } },
            create: {
              schoolId,
              roomName,
              capacity: studentsPerSection,
              typeId: classroomType.id,
              gradeId: grade.id,
            },
            update: {},
          })
          classroomCount++

          await tx.section.upsert({
            where: {
              schoolId_gradeId_letter: { schoolId, gradeId: grade.id, letter },
            },
            create: {
              schoolId,
              gradeId: grade.id,
              name: roomName,
              letter,
              classroomId: classroom.id,
              maxCapacity: studentsPerSection,
            },
            update: {},
          })
          sectionCount++
        }
      }

      return { classrooms: classroomCount, sections: sectionCount }
    },
    { timeout: 30000 }
  )
}

/** @internal Exported for testing only */
export const _testing = {
  inferCurriculum,
  getSubjectStreamType,
  getDefaultWeeklyPeriods,
  findCatalogSubjects,
  YEAR_LEVEL_DEFAULTS,
  DEPARTMENT_DEFAULTS,
  SCORE_RANGE_DEFAULTS,
}
