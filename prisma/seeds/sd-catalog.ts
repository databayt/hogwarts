// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Sudan National Curriculum Catalog Seed
 *
 * Creates grade-specific Sudanese subjects from sudan-curriculum.json.
 * Each subject+grade combination becomes one Subject with its own
 * chapters and lessons extracted from the actual textbook PDFs.
 *
 * Grade 1 pilot: 4 subjects, ~17 chapters, ~120 lessons
 * Full curriculum: ~26 subjects across grades 1-12
 *
 * Slug convention: sd-g{N}-{subject} (e.g., sd-g1-math)
 *
 * Usage: pnpm db:seed:single sd-catalog
 */

import fs from "fs"
import path from "path"
import type { PrismaClient, SchoolLevel } from "@prisma/client"

import { logSuccess } from "./utils"

// ============================================================================
// Types for sudan-curriculum.json
// ============================================================================

interface SudanLesson {
  nameAr: string
  name: string
  slug: string
  sequenceOrder: number
}

interface SudanChapter {
  nameAr: string
  name: string
  slug: string
  sequenceOrder: number
  lessons?: SudanLesson[]
}

interface SudanGradeData {
  level: string
  publisher: string
  edition: string
  chapters: SudanChapter[]
}

interface SudanSubject {
  name: string
  slug: string
  department: string
  concept: string
  color: string
  gradeChapters: Record<string, SudanGradeData>
}

interface SudanCurriculum {
  version: string
  country: string
  curriculum: string
  lang: string
  subjects: SudanSubject[]
}

// ============================================================================
// Helpers
// ============================================================================

function levelToSchoolLevel(level: string): SchoolLevel {
  switch (level) {
    case "elementary":
      return "ELEMENTARY"
    case "middle":
      return "MIDDLE"
    case "secondary":
      return "HIGH"
    default:
      return "ELEMENTARY"
  }
}

// ============================================================================
// Main seed function
// ============================================================================

export async function seedSudanCatalog(prisma: PrismaClient): Promise<void> {
  console.log("  Loading sudan-curriculum.json...")
  const dataPath = path.resolve(
    __dirname,
    "../../scripts/sudan-data/sudan-curriculum.json"
  )

  if (!fs.existsSync(dataPath)) {
    console.log("  sudan-curriculum.json not found, skipping Sudan seed")
    return
  }

  const raw = fs.readFileSync(dataPath, "utf-8")
  const curriculum: SudanCurriculum = JSON.parse(raw)
  console.log(`  Loaded ${curriculum.subjects.length} Sudan subjects`)

  // Look up Curriculum record for SD-national (set curriculumId on subjects)
  const sdCurriculum = await prisma.curriculum.findUnique({
    where: { country_code: { country: "SD", code: "national" } },
    select: { id: true },
  })
  if (sdCurriculum) {
    console.log(`  Linked to Curriculum record: ${sdCurriculum.id}`)
  }

  let subjectCount = 0
  let chapterCount = 0
  let lessonCount = 0
  let sortIdx = 1000 // Start after ClickView subjects to avoid collision

  for (const entry of curriculum.subjects) {
    const gradeKeys = Object.keys(entry.gradeChapters).sort(
      (a, b) => Number(a) - Number(b)
    )

    for (const gradeStr of gradeKeys) {
      const grade = Number(gradeStr)
      const gradeData = entry.gradeChapters[gradeStr]
      const schoolLevel = levelToSchoolLevel(gradeData.level)
      const slug = `sd-g${grade}-${entry.slug}`
      const currentSort = sortIdx++

      // Upsert the Subject
      const gradeConceptPrefix = `catalog/concepts/g${grade}-${entry.concept}`
      const subject = await prisma.subject.upsert({
        where: { slug },
        update: {
          name: entry.name,
          department: entry.department,
          concept: entry.concept,
          color: entry.color,
          levels: [schoolLevel],
          grades: [grade],
          gradeRange: String(grade),
          sortOrder: currentSort,
          thumbnail: `${gradeConceptPrefix}/thumbnail`,
          banner: `${gradeConceptPrefix}/banner`,
          cover: `catalog/concepts/${entry.concept}/cover`,
          ...(sdCurriculum ? { curriculumId: sdCurriculum.id } : {}),
        },
        create: {
          name: entry.name,
          slug,
          lang: "ar",
          department: entry.department,
          levels: [schoolLevel],
          grades: [grade],
          gradeRange: String(grade),
          country: "SD",
          curriculum: "national",
          curriculumId: sdCurriculum?.id,
          concept: entry.concept,
          color: entry.color,
          thumbnail: `${gradeConceptPrefix}/thumbnail`,
          banner: `${gradeConceptPrefix}/banner`,
          cover: `catalog/concepts/${entry.concept}/cover`,
          sortOrder: currentSort,
          status: "PUBLISHED",
        },
      })
      subjectCount++

      // Create chapters
      for (const ch of gradeData.chapters) {
        const chapter = await prisma.chapter.upsert({
          where: {
            subjectId_slug: {
              subjectId: subject.id,
              slug: ch.slug,
            },
          },
          update: {
            name: ch.nameAr,
            sequenceOrder: ch.sequenceOrder,
            color: entry.color,
            grades: [grade],
          },
          create: {
            subjectId: subject.id,
            name: ch.nameAr,
            slug: ch.slug,
            lang: "ar",
            sequenceOrder: ch.sequenceOrder,
            color: entry.color,
            grades: [grade],
            levels: [schoolLevel],
            status: "PUBLISHED",
          },
        })
        chapterCount++

        // Create lessons
        const lessons = ch.lessons ?? []
        for (const ls of lessons) {
          await prisma.lesson.upsert({
            where: {
              chapterId_slug: {
                chapterId: chapter.id,
                slug: ls.slug,
              },
            },
            update: {
              name: ls.nameAr,
              sequenceOrder: ls.sequenceOrder,
              color: entry.color,
              grades: [grade],
            },
            create: {
              chapterId: chapter.id,
              name: ls.nameAr,
              slug: ls.slug,
              lang: "ar",
              sequenceOrder: ls.sequenceOrder,
              color: entry.color,
              grades: [grade],
              levels: [schoolLevel],
              status: "PUBLISHED",
            },
          })
          lessonCount++
        }
      }
    }

    console.log(
      `  ${entry.name} (${entry.slug}): ${gradeKeys.length} grade(s) done`
    )
  }

  logSuccess("Sudan Subjects", subjectCount, "SD national curriculum")
  logSuccess("Sudan Chapters", chapterCount, "SD national curriculum")
  logSuccess("Sudan Lessons", lessonCount, "SD national curriculum")

  // Update denormalized counts
  console.log("  Updating denormalized counts...")

  const allSubjects = await prisma.subject.findMany({
    where: { country: "SD", curriculum: "national", status: "PUBLISHED" },
    select: { id: true },
  })

  for (const s of allSubjects) {
    const chapters = await prisma.chapter.findMany({
      where: { subjectId: s.id },
      select: { id: true },
    })

    const totalLessons = await prisma.lesson.count({
      where: { chapter: { subjectId: s.id } },
    })

    await prisma.subject.update({
      where: { id: s.id },
      data: {
        totalChapters: chapters.length,
        totalLessons,
        totalContent: totalLessons,
      },
    })

    for (const ch of chapters) {
      const count = await prisma.lesson.count({
        where: { chapterId: ch.id },
      })
      await prisma.chapter.update({
        where: { id: ch.id },
        data: { totalLessons: count, totalContent: count },
      })
    }
  }

  console.log("  Denormalized counts updated.")
}
