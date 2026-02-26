"use server"

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

/**
 * Auto-setup catalog for a new school.
 * Creates AcademicLevels, AcademicGrades, AcademicStreams, and
 * SchoolSubjectSelection records linking all applicable catalog subjects.
 *
 * Respects School.schoolLevel to only create relevant levels/grades.
 * Called during school onboarding or manually from SaaS dashboard.
 */
export async function setupCatalogForSchool(
  schoolId: string,
  options?: {
    country?: string
    system?: string
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
    select: { schoolLevel: true, country: true },
  })

  // Use school's country (ISO code), then options override, then fallback
  const country = school?.country || options?.country || "US"
  // Default to ClickView US K-12 curriculum; other curricula can be specified via options
  const system = options?.system || "clickview"
  const allowedLevels =
    SCHOOL_LEVEL_TO_CATALOG[school?.schoolLevel ?? "both"] ??
    SCHOOL_LEVEL_TO_CATALOG.both
  const applicableLevelConfig = LEVEL_CONFIG.filter((l) =>
    allowedLevels.includes(l.level)
  )

  // Get all published catalog subjects for this country/system
  const catalogSubjects = await db.catalogSubject.findMany({
    where: {
      status: "PUBLISHED",
      country,
      system,
    },
    select: {
      id: true,
      name: true,
      levels: true,
      grades: true,
    },
  })

  if (catalogSubjects.length === 0) {
    return {
      skipped: true,
      message: "No catalog subjects found for this country/system",
    }
  }

  // Get existing YearLevels for linking
  const yearLevels = await db.yearLevel.findMany({
    where: { schoolId },
    select: { id: true, levelOrder: true },
    orderBy: { levelOrder: "asc" },
  })

  const yearLevelMap = new Map(yearLevels.map((yl) => [yl.levelOrder, yl.id]))

  const result = await db.$transaction(async (tx) => {
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
            yearLevelId: yearLevelMap.get(grade) ?? null,
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
    const streamRecords: Array<{ id: string; gradeId: string }> = []
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
        streamRecords.push({ id: stream.id, gradeId: grade.id })
      }
    }

    // 4. Create subject selections (link catalog subjects to grades)
    let selectionCount = 0

    for (const subject of catalogSubjects) {
      // Grade-specific subjects have explicit grades (e.g., [3] for "Math Grade 3")
      // Level-based subjects use levels to derive grade ranges
      let applicableGrades: number[]

      if (subject.grades.length > 0) {
        // Grade-specific: use exact grades, filtered by school's allowed levels
        const allowedGradeNumbers = new Set(
          gradeRecords.map((g) => g.gradeNumber)
        )
        applicableGrades = subject.grades.filter((g) =>
          allowedGradeNumbers.has(g)
        )
      } else {
        // Level-based fallback: map levels to grade ranges
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

        await tx.schoolSubjectSelection.create({
          data: {
            schoolId,
            catalogSubjectId: subject.id,
            gradeId: gradeRecord.id,
            isRequired: true,
            isActive: true,
            weeklyPeriods: getDefaultWeeklyPeriods(subject.name, gradeNumber),
          },
        })
        selectionCount++
      }
    }

    // 5. Update usage counts on catalog subjects
    for (const subject of catalogSubjects) {
      await tx.catalogSubject.update({
        where: { id: subject.id },
        data: { usageCount: { increment: 1 } },
      })
    }

    return {
      skipped: false,
      levels: levelRecords.length,
      grades: gradeRecords.length,
      streams: streamRecords.length,
      selections: selectionCount,
      subjects: catalogSubjects.length,
    }
  })

  return result
}

/**
 * Remove all catalog setup for a school.
 * Cascading deletes handle most cleanup via schema relations.
 */
export async function teardownCatalogForSchool(schoolId: string) {
  await db.$transaction(async (tx) => {
    // Delete bridge tables first
    await tx.schoolSubjectSelection.deleteMany({ where: { schoolId } })
    await tx.schoolContentOverride.deleteMany({ where: { schoolId } })

    // Delete academic structure
    await tx.academicStream.deleteMany({ where: { schoolId } })
    await tx.academicGrade.deleteMany({ where: { schoolId } })
    await tx.academicLevel.deleteMany({ where: { schoolId } })
  })

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

  // Create periods
  let createdCount = 0
  for (const period of structure.periods) {
    const [startHour, startMin] = period.startTime.split(":").map(Number)
    const [endHour, endMin] = period.endTime.split(":").map(Number)

    await db.period.create({
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

  const existingTerms = await db.term.count({ where: { schoolId, yearId } })
  let termId: string | undefined

  if (existingTerms === 0) {
    const term1 = await db.term.create({
      data: {
        schoolId,
        yearId,
        termNumber: 1,
        startDate: new Date(yearStart, 8, 1), // Sep 1
        endDate: new Date(yearStart + 1, 0, 31), // Jan 31
        isActive: true,
      },
    })
    termId = term1.id

    await db.term.create({
      data: {
        schoolId,
        yearId,
        termNumber: 2,
        startDate: new Date(yearStart + 1, 1, 1), // Feb 1
        endDate: new Date(yearStart + 1, 5, 30), // Jun 30
        isActive: false,
      },
    })
  }

  // Persist working days from structure definition
  if (termId) {
    const existingConfig = await db.schoolWeekConfig.findFirst({
      where: { schoolId },
    })
    if (!existingConfig) {
      await db.schoolWeekConfig.create({
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
    whereClause.OR = [{ schoolId }, { visibility: "PUBLIC" }]
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
