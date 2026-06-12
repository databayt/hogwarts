// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { db } from "@/lib/db"
import { getReferenceWeeklyPeriods } from "@/lib/timetable-reference"
import {
  getAcademicConfig,
  getStreamTypeForSubject,
  gradesForLevel,
} from "@/components/catalog/academic-config"

// Academic structure (levels / grade names / streams) is per-curriculum —
// see academic-config.ts. The SD config preserves the original Sudanese
// constants byte-for-byte; US/GB/CBSE provision their own structures.

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
 * Infer a school's canonical curriculum code from country + schoolType.
 * National curricula use a bare ISO 3166-1 country code (US, SD, GB, …);
 * transnational programmes use `{body}-{programme}` (IB-DP, CAIE-IGCSE).
 * International schools and unknown countries fall back to US as baseline.
 */
function inferCurriculum(country: string, schoolType?: string | null): string {
  if (schoolType === "international") return "US"
  const map: Record<string, string> = {
    US: "US",
    GB: "GB",
    SD: "SD",
    SA: "SA",
    EG: "EG",
    AE: "AE",
    QA: "QA",
    KW: "KW",
    JO: "JO",
    IN: "CBSE",
  }
  return map[country] || "US"
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
  return db.$transaction(
    async (tx) => {
      const results = { yearLevels: 0, departments: 0, scoreRanges: 0 }

      // Idempotency checks INSIDE transaction to prevent race conditions
      const [existingYearLevels, existingDepts, existingRanges] =
        await Promise.all([
          tx.yearLevel.count({ where: { schoolId } }),
          tx.department.count({ where: { schoolId } }),
          tx.scoreRange.count({ where: { schoolId } }),
        ])

      if (existingYearLevels > 0 && existingDepts > 0 && existingRanges > 0) {
        return results
      }

      // 1. YearLevels (filtered by schoolLevel) — batch insert
      if (existingYearLevels === 0) {
        const applicable = YEAR_LEVEL_DEFAULTS.filter((yl) =>
          yl.schoolLevels.includes(schoolLevel)
        )
        const { count } = await tx.yearLevel.createMany({
          data: applicable.map((yl) => ({
            schoolId,
            levelName: yl.name,
            levelOrder: yl.levelOrder,
          })),
          skipDuplicates: true,
        })
        results.yearLevels = count
      }

      // 2. Departments — batch insert
      if (existingDepts === 0) {
        const { count } = await tx.department.createMany({
          data: DEPARTMENT_DEFAULTS.map((dept) => ({
            schoolId,
            departmentName: dept.name,
          })),
          skipDuplicates: true,
        })
        results.departments = count
      }

      // 3. ScoreRanges — batch insert
      if (existingRanges === 0) {
        const { count } = await tx.scoreRange.createMany({
          data: SCORE_RANGE_DEFAULTS.map((range) => ({
            schoolId,
            grade: range.grade,
            minScore: range.minScore,
            maxScore: range.maxScore,
          })),
          skipDuplicates: true,
        })
        results.scoreRanges = count
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
 * SubjectSelection records linking all applicable catalog subjects.
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

  // Read school's actual country and level classification
  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: {
      schoolLevel: true,
      country: true,
      schoolType: true,
      timetableStructure: true,
    },
  })

  // Use school's country (ISO code), then options override, then fallback
  const country = school?.country || options?.country || "US"
  const schoolType = school?.schoolType || options?.schoolType || undefined
  const curriculum = options?.curriculum || inferCurriculum(country, schoolType)
  const academicConfig = getAcademicConfig(curriculum)
  const allowedLevels =
    SCHOOL_LEVEL_TO_CATALOG[school?.schoolLevel ?? "both"] ??
    SCHOOL_LEVEL_TO_CATALOG.both
  const applicableLevelConfig = academicConfig.levels.filter((l) =>
    allowedLevels.includes(l.level)
  )

  // Progressive fallback for catalog subjects
  const catalogSubjects = await findSubjects(country, curriculum, schoolType)

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
      // Idempotency check INSIDE transaction to prevent race conditions
      if (skipIfExists) {
        const existingLevels = await tx.academicLevel.count({
          where: { schoolId },
        })
        if (existingLevels > 0) {
          return {
            skipped: true as const,
            message: "School already has academic structure",
          }
        }
      }

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
              name: academicConfig.gradeName(grade),
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

      // 3. Create high school streams (per-curriculum; SD = Science + Arts
      // from streamStartGrade up, US/GB/CBSE provision none)
      const streamRecords: Array<{
        id: string
        gradeId: string
        streamType: string
      }> = []
      const highGrades = gradeRecords.filter(
        (g) => g.gradeNumber >= academicConfig.streamStartGrade
      )

      for (const grade of highGrades) {
        for (const streamDef of academicConfig.streams) {
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
          applicableGrades = subject.levels.flatMap((level) =>
            allowedLevels.includes(level)
              ? gradesForLevel(academicConfig, level)
              : []
          )
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
            weeklyPeriods: getReferenceWeeklyPeriods(
              subject.name,
              gradeNumber,
              {
                country,
                curriculum,
                schoolType,
              }
            ),
          }

          const subjectStreamType =
            gradeNumber >= academicConfig.streamStartGrade
              ? getStreamTypeForSubject(academicConfig, subject.name)
              : null
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
        await tx.subjectSelection.createMany({ data: selectionData })
      }
      const selectionCount = selectionData.length

      return {
        skipped: false,
        levels: levelRecords.length,
        grades: gradeRecords.length,
        streams: streamRecords.length,
        selections: selectionCount,
        subjects: catalogSubjects.length,
        catalogSubjectIds: [
          ...new Set(selectionData.map((s) => s.catalogSubjectId)),
        ],
      }
    },
    { timeout: 60000 }
  )

  // Create default instructor preferences outside the critical transaction
  // Non-critical: should never crash grade/level creation
  if (!("skipped" in result && result.skipped)) {
    const subjectIds = (result as { catalogSubjectIds: string[] })
      .catalogSubjectIds
    if (subjectIds?.length > 0) {
      try {
        await db.instructorPreference.createMany({
          data: subjectIds.map((catalogSubjectId) => ({
            schoolId,
            catalogSubjectId,
            preferredSchoolId: null,
            preferredUserId: null,
          })),
          skipDuplicates: true,
        })
      } catch (err) {
        console.error(
          `[setupCatalog] Instructor preferences failed (non-critical):`,
          err
        )
      }
    }
  }

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
async function findSubjects(
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
    const exact = await db.subject.findMany({
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
  const broad = await db.subject.findMany({
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
  const universal = await db.subject.findMany({
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

  // Step 4: Baseline fallback (US)
  if (country !== "US" || curriculum !== "US") {
    const fallback = await db.subject.findMany({
      where: {
        status: "PUBLISHED",
        country: "US",
        curriculum: "US",
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
  // Collect affected subject IDs before deletion for usage count decrement
  const selections = await db.subjectSelection.findMany({
    where: { schoolId },
    select: { catalogSubjectId: true },
    distinct: ["catalogSubjectId"],
  })
  const affectedSubjectIds = selections.map((s) => s.catalogSubjectId)

  // Delete instructor preferences first (non-critical, outside transaction)
  try {
    await db.instructorPreference.deleteMany({ where: { schoolId } })
  } catch (err) {
    console.error(
      `[teardownCatalog] Instructor preferences cleanup failed (non-critical):`,
      err
    )
  }

  await db.$transaction(
    async (tx) => {
      // Delete bridge tables first
      await tx.subjectSelection.deleteMany({ where: { schoolId } })
      await tx.contentOverride.deleteMany({ where: { schoolId } })

      // Delete academic structure
      await tx.academicStream.deleteMany({ where: { schoolId } })
      await tx.academicGrade.deleteMany({ where: { schoolId } })
      await tx.academicLevel.deleteMany({ where: { schoolId } })
    },
    { timeout: 30000 }
  )

  // Decrement usage counts (non-critical metadata)
  if (affectedSubjectIds.length > 0) {
    try {
      await db.$executeRawUnsafe(
        `UPDATE catalog_subjects SET "usageCount" = GREATEST("usageCount" - 1, 0) WHERE id = ANY($1::text[])`,
        affectedSubjectIds
      )
    } catch {
      // Non-critical: usage count is just metadata
    }
  }

  return { success: true }
}

/**
 * Get ranked videos for a catalog lesson.
 * Ranking: featured first, then by engagement (views + rating).
 *
 * Tenancy: PUBLIC and PAID videos surface to every school; SCHOOL-scoped
 * videos surface only to their own school. PAID videos include
 * `requiresPayment` — the client decides whether to gate playback based on
 * whether the current user has a VideoPurchase row.
 */
export async function getRankedVideos(
  lessonId: string,
  schoolId: string | null,
  options?: {
    limit?: number
    includeSchoolOnly?: boolean
    currentUserId?: string | null
  }
) {
  const {
    limit = 10,
    includeSchoolOnly = false,
    currentUserId = null,
  } = options ?? {}

  const whereClause: Record<string, unknown> = {
    catalogLessonId: lessonId,
    approvalStatus: "APPROVED",
  }

  if (includeSchoolOnly && schoolId) {
    whereClause.schoolId = schoolId
  } else if (schoolId) {
    whereClause.OR = [
      { schoolId },
      { visibility: "PUBLIC" },
      { visibility: "PAID" },
    ]
  } else {
    whereClause.OR = [{ visibility: "PUBLIC" }, { visibility: "PAID" }]
  }

  const videos = await db.video.findMany({
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
      price: true,
      currency: true,
      userId: true,
      user: {
        select: { id: true, username: true, role: true },
      },
      school: {
        select: { name: true },
      },
    },
  })

  // Resolve ownership for the current user so PAID videos can be unlocked
  // without hitting Stripe on every render. One batched query for all paid
  // videos in the list keeps this cheap regardless of list length.
  const paidVideoIds = videos
    .filter((v) => v.visibility === "PAID")
    .map((v) => v.id)

  const purchasedIds = new Set<string>()
  if (currentUserId && paidVideoIds.length > 0) {
    const purchases = await db.videoPurchase.findMany({
      where: {
        userId: currentUserId,
        videoId: { in: paidVideoIds },
        status: "SUCCESS",
      },
      select: { videoId: true },
    })
    for (const p of purchases) purchasedIds.add(p.videoId)
  }

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
    owner: {
      id: v.userId,
      name: v.user?.username ?? null,
      role: v.user?.role ?? null,
      schoolName: v.school?.name ?? null,
    },
    price: v.price,
    currency: v.currency,
    requiresPayment: v.visibility === "PAID",
    hasPurchased: purchasedIds.has(v.id),
  }))
}

/**
 * Record a video view for engagement tracking.
 */
export async function recordVideoView(videoId: string) {
  await db.video.update({
    where: { id: videoId },
    data: { viewCount: { increment: 1 } },
  })
}

// ============================================================================
// ensureSubjectSelections — Lazy provisioning for the subjects page
// ============================================================================

/**
 * Ensure a school has subject selections. If the school already has academic
 * grades but no SubjectSelection records (e.g. `after()` timed out during
 * onboarding), this provisions just the selections without recreating the
 * entire academic structure.
 *
 * If no academic structure exists at all, falls back to the full
 * `setupCatalogForSchool` pipeline (which also runs `setupDefaultsForSchool`
 * as a prerequisite).
 *
 * Idempotent — returns early if selections already exist.
 */
export async function ensureSubjectSelections(
  schoolId: string
): Promise<{ provisioned: boolean; selections: number }> {
  // Already have selections → nothing to do
  const existing = await db.subjectSelection.count({
    where: { schoolId, isActive: true },
  })
  if (existing > 0) return { provisioned: false, selections: existing }

  // Check if academic structure exists
  const gradeCount = await db.academicGrade.count({ where: { schoolId } })

  if (gradeCount === 0) {
    // No structure at all — need the full pipeline.
    // Ensure year levels/departments exist first (setupCatalogForSchool needs them).
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { schoolLevel: true, country: true, schoolType: true },
    })

    await setupDefaultsForSchool(schoolId, school?.schoolLevel || "both")
    const result = await setupCatalogForSchool(schoolId, {
      country: school?.country || undefined,
      schoolType: school?.schoolType || undefined,
    })

    const count =
      result && "selections" in result ? (result.selections as number) : 0
    return { provisioned: count > 0, selections: count }
  }

  // Structure exists but no selections — provision only the bridge records.
  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: { country: true, schoolType: true, schoolLevel: true },
  })
  const country = school?.country || "US"
  const schoolType = school?.schoolType || undefined
  const curriculum = inferCurriculum(country, schoolType ?? null)
  const academicConfig = getAcademicConfig(curriculum)
  const allowedLevels =
    SCHOOL_LEVEL_TO_CATALOG[school?.schoolLevel ?? "both"] ??
    SCHOOL_LEVEL_TO_CATALOG.both

  const catalogSubjects = await findSubjects(country, curriculum, schoolType)
  if (catalogSubjects.length === 0) {
    return { provisioned: false, selections: 0 }
  }

  // Load existing grades and streams
  const grades = await db.academicGrade.findMany({
    where: { schoolId },
    select: { id: true, gradeNumber: true },
  })
  const streams = await db.academicStream.findMany({
    where: { schoolId },
    select: { id: true, gradeId: true, streamType: true },
  })

  const allowedGradeNumbers = new Set(grades.map((g) => g.gradeNumber))
  const selectionData: Array<{
    schoolId: string
    catalogSubjectId: string
    gradeId: string
    isRequired: boolean
    isActive: boolean
    weeklyPeriods: number
    streamId?: string
  }> = []

  for (const subject of catalogSubjects) {
    let applicableGrades: number[]

    if (subject.grades.length > 0) {
      applicableGrades = subject.grades.filter((g) =>
        allowedGradeNumbers.has(g)
      )
    } else {
      applicableGrades = subject.levels.flatMap((level) =>
        allowedLevels.includes(level)
          ? gradesForLevel(academicConfig, level)
          : []
      )
    }

    for (const gradeNumber of applicableGrades) {
      const gradeRecord = grades.find((g) => g.gradeNumber === gradeNumber)
      if (!gradeRecord) continue

      const baseData = {
        schoolId,
        catalogSubjectId: subject.id,
        gradeId: gradeRecord.id,
        isRequired: true,
        isActive: true,
        weeklyPeriods: getReferenceWeeklyPeriods(subject.name, gradeNumber, {
          country,
          curriculum,
          schoolType,
        }),
      }

      const subjectStreamType =
        gradeNumber >= academicConfig.streamStartGrade
          ? getStreamTypeForSubject(academicConfig, subject.name)
          : null
      const gradeStreams = streams.filter((s) => s.gradeId === gradeRecord.id)

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

  if (selectionData.length > 0) {
    await db.subjectSelection.createMany({
      data: selectionData,
      skipDuplicates: true,
    })
  }

  return {
    provisioned: selectionData.length > 0,
    selections: selectionData.length,
  }
}

/** @internal Exported for testing only */
export const _testing = {
  inferCurriculum,
  findSubjects,
  YEAR_LEVEL_DEFAULTS,
  DEPARTMENT_DEFAULTS,
  SCORE_RANGE_DEFAULTS,
}
