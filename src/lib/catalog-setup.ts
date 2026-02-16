"use server"

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
  const {
    country = "SD",
    system = "national",
    skipIfExists = true,
  } = options ?? {}

  // Skip if school already has academic structure
  if (skipIfExists) {
    const existingLevels = await db.academicLevel.count({
      where: { schoolId },
    })
    if (existingLevels > 0) {
      return { skipped: true, message: "School already has academic structure" }
    }
  }

  // Read school's level classification to filter applicable levels
  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: { schoolLevel: true },
  })
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
      // Map catalog levels to grade ranges, filtered by school's allowed levels
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

      const applicableGrades = subject.levels.flatMap(levelToGrades)

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
