// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Sync Sudan Curriculum — Single Source of Truth
 *
 * Reads the curriculum/sd/ directory structure and syncs subjects, chapters,
 * and lessons into the database. This is the AUTHORITATIVE seed for SD
 * curriculum data — it CREATES subjects that don't exist yet and replaces
 * stale chapters/lessons.
 *
 * Also sets:
 * - `concept`, `thumbnail`, `banner` on subjects/chapters/lessons
 * - Arabic/English names from curriculum.json metadata
 * - `pdf` field pointing to S3 textbook path (if textbook.pdf exists locally)
 *
 * S3 key pattern: catalog/concepts/g{grade}-{concept}/thumbnail
 *
 * Usage: pnpm db:seed:single sd
 */

import fs from "fs"
import path from "path"
import type { PrismaClient, SchoolLevel } from "@prisma/client"

import {
  clickviewConceptKey,
  gradeToLevel as cvGradeToLevel,
} from "../../../src/components/catalog/clickview-key"
import {
  nearestConcept,
  SUBJECT_CONCEPT_BY_SLUG as SUBJECT_CONCEPT_MAP,
  CONCEPT_POOL as SUBJECT_CONCEPT_POOL,
} from "../../../src/components/catalog/concepts-data"
import { logPhase, logSuccess } from "../utils"

/**
 * Flag-gated cutover to the flat `clickview/` CDN key scheme (default OFF keeps
 * the legacy `catalog/concepts/g{grade}-{concept}/...` keys). Flip with CLICKVIEW_KEYS=1.
 */
const USE_CLICKVIEW =
  process.env.CLICKVIEW_KEYS === "1" || process.env.CLICKVIEW_KEYS === "true"

const CURRICULUM_DIR = path.resolve(__dirname, "../../../curriculum/sd")
const CURRICULUM_JSON = path.join(CURRICULUM_DIR, "curriculum.json")

// ============================================================================
// Curriculum metadata (loaded from curriculum.json)
// ============================================================================

interface CurriculumMeta {
  grades: Record<string, Record<string, { ar: string; en: string }>>
}

function loadCurriculumMeta(): CurriculumMeta {
  if (!fs.existsSync(CURRICULUM_JSON)) {
    return { grades: {} }
  }
  return JSON.parse(fs.readFileSync(CURRICULUM_JSON, "utf-8")) as CurriculumMeta
}

// Grade number → school level
function gradeToLevel(grade: number): SchoolLevel {
  if (grade <= 6) return "ELEMENTARY"
  if (grade <= 9) return "MIDDLE"
  return "HIGH"
}

// Grade number → department
function gradeToDepartment(grade: number): string {
  if (grade <= 6) return "Elementary"
  if (grade <= 9) return "Middle School"
  return "Sciences" // default for secondary
}

// ============================================================================
// Directory subject name → DB subject slug suffix mapping
// Some directory names don't match DB slugs exactly
// ============================================================================

const DIR_TO_SLUG_OVERRIDES: Record<string, string> = {
  // islamic variants (default for most grades)
  islamic: "islamic-studies",
  "islamic-studies": "islamic-studies",

  // ICT variants (default)
  ict: "computer",

  // commercial → commerce
  "commercial-studies": "commerce",

  // military-science → military-sciences (plural)
  "military-science": "military-sciences",

  // arabic-specialized → arabic-advanced
  "arabic-specialized": "arabic-advanced",

  // quran → quran-studies
  quran: "quran-studies",

  // arabic sub-disciplines → short DB names
  "arabic-literature": "literature",
  "arabic-rhetoric": "rhetoric",
  "arabic-grammar": "grammar",

  // home-economics → family-sciences (default)
  "home-economics": "family-sciences",
}

// Per-grade slug overrides (directory subject → DB slug suffix)
// These take priority over the global overrides above
const GRADE_SLUG_OVERRIDES: Record<string, Record<string, string>> = {
  g2: {
    art: "arts", // DB uses plural "arts" for elementary
  },
  g4: {
    art: "arts",
    english: "english-v2",
  },
  g5: {
    art: "arts",
    "home-economics": "home-economics", // g5 has no family-sciences slug in DB
    technology: "technology",
  },
  g6: {
    islamic: "islamic-studies",
    arabic: "arabic-v2",
    ict: "technology",
    technology: "technology",
  },
  g7: {
    islamic: "islamic-education",
    ict: "ict", // g7 uses "ict" slug directly
  },
  g8: {
    islamic: "islamic-education",
    technology: "technology",
  },
  g9: {
    islamic: "islamic-studies",
    ict: "communication-tech",
    "technical-education": "technical-education",
  },
  g10: {
    art: "art",
    english: "english-v2",
    "home-economics": "home-economics",
    quran: "quran",
  },
  g11: {
    art: "arts-design",
    arabic: "arabic-advanced", // g11 only has arabic-advanced in DB
    "home-economics": "family-sciences",
  },
  g12: {
    islamic: "islamic-studies",
    arabic: "arabic-advanced", // g12 only has arabic-advanced in DB
    math: "basic-math", // g12 DB uses "basic-math" slug
    "home-economics": "family-sciences",
  },
}

// ============================================================================
// Subject concept mapping (directory subject name → concept)
// Used for subjects missing concept field
// ============================================================================

// ============================================================================
// Lesson-type → concept mapping (for subjects with repeating lesson types)
// ============================================================================

const LESSON_TYPE_CONCEPT: Record<string, string> = {
  // Arabic lesson types (g1-g8)
  reading: "english",
  literature: "languages",
  dictation: "languages",
  expression: "arts",
  grammar: "psychology",
  // Arabic lesson types (g9+)
  spelling: "english",
  writing: "arts",
  // French lesson types
  decouverte: "geography",
  "ecouter-et-comprendre": "languages",
  ecrire: "arts",
  lire: "english",
  ouverture: "celebrations",
  parler: "sociology",
  bilan: "economics",
}

// ============================================================================
// Subject concept → rotation pool (for chapter visual differentiation)
// Each chapter rotates through the pool by sequenceOrder
// ============================================================================

// ============================================================================
// Helpers
// ============================================================================

/** Convert slug to a readable Arabic-friendly name */
function slugToName(slug: string): string {
  // Remove leading sequence number (e.g., "01-reading" → "reading")
  const cleaned = slug.replace(/^\d+-/, "")
  // Convert kebab-case to title case
  return cleaned
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

/** Get sorted chapter directories from a subject path */
function getChapterDirs(subjectPath: string): string[] {
  const chaptersDir = path.join(subjectPath, "chapters")
  if (!fs.existsSync(chaptersDir)) return []

  return fs
    .readdirSync(chaptersDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort((a, b) => {
      // Sort by leading number if present, then alphabetically
      const numA = parseInt(a.match(/^(?:unit-)?(\d+)/)?.[1] ?? "999")
      const numB = parseInt(b.match(/^(?:unit-)?(\d+)/)?.[1] ?? "999")
      if (numA !== numB) return numA - numB
      return a.localeCompare(b)
    })
}

/** Get sorted lesson directories from a chapter path */
function getLessonDirs(chapterPath: string): string[] {
  const lessonsDir = path.join(chapterPath, "lessons")
  if (!fs.existsSync(lessonsDir)) return []

  return fs
    .readdirSync(lessonsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort((a, b) => {
      const numA = parseInt(a.match(/^(\d+)/)?.[1] ?? "999")
      const numB = parseInt(b.match(/^(\d+)/)?.[1] ?? "999")
      if (numA !== numB) return numA - numB
      return a.localeCompare(b)
    })
}

/** Resolve directory subject name to DB slug suffix */
function resolveSlugSuffix(grade: string, dirSubject: string): string {
  // Check grade-specific overrides first
  const gradeOverrides = GRADE_SLUG_OVERRIDES[grade]
  if (gradeOverrides?.[dirSubject]) return gradeOverrides[dirSubject]

  // Then global overrides
  if (DIR_TO_SLUG_OVERRIDES[dirSubject])
    return DIR_TO_SLUG_OVERRIDES[dirSubject]

  // Default: use directory name as-is
  return dirSubject
}

// ============================================================================
// Main
// ============================================================================

export async function seedSdCurriculum(prisma: PrismaClient): Promise<void> {
  if (!fs.existsSync(CURRICULUM_DIR)) {
    console.log("  curriculum/sd/ not found, skipping")
    return
  }

  // Phase 1: Build inventory from directory
  logPhase(1, "SCANNING DIRECTORY", "Reading curriculum/sd/ structure")

  const grades = fs
    .readdirSync(CURRICULUM_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name.startsWith("g"))
    .map((d) => d.name)
    .sort((a, b) => {
      const numA = parseInt(a.replace("g", ""))
      const numB = parseInt(b.replace("g", ""))
      return numA - numB
    })

  interface DirLesson {
    slug: string
    name: string
    sequenceOrder: number
  }

  interface DirChapter {
    slug: string
    name: string
    sequenceOrder: number
    lessons: DirLesson[]
  }

  interface DirSubject {
    grade: string
    gradeNum: number
    dirName: string
    dbSlug: string
    concept: string | null
    chapters: DirChapter[]
  }

  const inventory: DirSubject[] = []

  for (const grade of grades) {
    const gradeNum = parseInt(grade.replace("g", ""))
    const gradePath = path.join(CURRICULUM_DIR, grade)

    const subjects = fs
      .readdirSync(gradePath, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort()

    for (const dirSubject of subjects) {
      const subjectPath = path.join(gradePath, dirSubject)
      const slugSuffix = resolveSlugSuffix(grade, dirSubject)
      const dbSlug = `sd-${grade}-${slugSuffix}`
      const concept =
        SUBJECT_CONCEPT_MAP[dirSubject] ?? nearestConcept(dirSubject)

      const chapterDirs = getChapterDirs(subjectPath)
      const chapters: DirChapter[] = chapterDirs.map((chDir, idx) => {
        const chapterPath = path.join(subjectPath, "chapters", chDir)
        const lessonDirs = getLessonDirs(chapterPath)

        return {
          slug: chDir,
          name: slugToName(chDir),
          sequenceOrder: idx + 1,
          lessons: lessonDirs.map((lDir, lIdx) => ({
            slug: lDir,
            name: slugToName(lDir),
            sequenceOrder: lIdx + 1,
          })),
        }
      })

      inventory.push({
        grade,
        gradeNum,
        dirName: dirSubject,
        dbSlug,
        concept,
        chapters,
      })
    }
  }

  const totalChapters = inventory.reduce((sum, s) => sum + s.chapters.length, 0)
  const totalLessons = inventory.reduce(
    (sum, s) => sum + s.chapters.reduce((s2, c) => s2 + c.lessons.length, 0),
    0
  )

  console.log(
    `  Found ${inventory.length} subjects across ${grades.length} grades`
  )
  console.log(`  Total: ${totalChapters} chapters, ${totalLessons} lessons`)

  // Load curriculum.json for Arabic/English names
  const meta = loadCurriculumMeta()

  // Phase 2: Match + create DB subjects
  logPhase(
    2,
    "MATCHING & CREATING SUBJECTS",
    "Finding DB subjects, creating missing ones"
  )

  // Look up Curriculum record for SD-national
  const sdCurriculum = await prisma.curriculum.findUnique({
    where: { country_code: { country: "SD", code: "SD" } },
    select: { id: true },
  })

  const allDbSubjects = await prisma.subject.findMany({
    where: { country: "SD" },
    select: {
      id: true,
      slug: true,
      concept: true,
      thumbnail: true,
      banner: true,
      cover: true,
      pdf: true,
      grades: true,
    },
  })

  const slugToDb = new Map(allDbSubjects.map((s) => [s.slug, s]))

  let matched = 0
  let created = 0
  let sortIdx = 2000 // high offset to avoid collision with existing subjects

  for (const entry of inventory) {
    let dbSubject = slugToDb.get(entry.dbSlug)

    if (dbSubject) {
      matched++
    } else {
      // CREATE the missing subject
      const gradeMeta = meta.grades[entry.grade]
      const subjectMeta = gradeMeta?.[entry.dirName]
      const name = subjectMeta?.ar ?? slugToName(entry.dirName)
      const concept = entry.concept
      const gradeConceptPrefix = concept
        ? `catalog/concepts/g${entry.gradeNum}-${concept}`
        : null
      const cvLevel = cvGradeToLevel(entry.gradeNum)
      const subjThumb = USE_CLICKVIEW
        ? clickviewConceptKey(cvLevel, concept, "thumbnail")
        : gradeConceptPrefix
          ? `${gradeConceptPrefix}/thumbnail`
          : null
      const subjBanner = USE_CLICKVIEW
        ? clickviewConceptKey(cvLevel, concept, "banner")
        : gradeConceptPrefix
          ? `${gradeConceptPrefix}/banner`
          : null

      // Check if textbook.pdf exists locally
      const textbookPath = path.join(
        CURRICULUM_DIR,
        entry.grade,
        entry.dirName,
        "textbook.pdf"
      )
      const hasTextbook = fs.existsSync(textbookPath)
      const pdfKey = hasTextbook
        ? `catalog/textbooks/${entry.dbSlug}/textbook.pdf`
        : null

      const newSubject = await prisma.subject.create({
        data: {
          name,
          slug: entry.dbSlug,
          lang: "ar",
          department: gradeToDepartment(entry.gradeNum),
          levels: [gradeToLevel(entry.gradeNum)],
          grades: [entry.gradeNum],
          gradeRange: String(entry.gradeNum),
          country: "SD",
          curriculum: "SD",
          curriculumId: sdCurriculum?.id,
          concept,
          color: null,
          thumbnail: subjThumb,
          banner: subjBanner,
          cover: concept ? `catalog/concepts/${concept}/cover` : null,
          pdf: pdfKey,
          sortOrder: sortIdx++,
          status: "PUBLISHED",
        },
      })

      // Add to map so Phase 3 can use it
      slugToDb.set(entry.dbSlug, {
        id: newSubject.id,
        slug: newSubject.slug,
        concept: newSubject.concept,
        thumbnail: newSubject.thumbnail,
        banner: newSubject.banner,
        cover: newSubject.cover,
        pdf: newSubject.pdf,
        grades: newSubject.grades,
      })

      console.log(`    + Created ${entry.dbSlug} (${name})`)
      created++
    }
  }

  console.log(`  Matched: ${matched}, Created: ${created}`)

  // Phase 3: Update ALL subjects (concept/thumbnail/banner/pdf)
  logPhase(
    3,
    "UPDATING SUBJECTS",
    "Setting concept/thumbnail/banner/pdf on all subjects"
  )

  let subjectUpdateCount = 0
  for (const entry of inventory) {
    const dbSubject = slugToDb.get(entry.dbSlug)
    if (!dbSubject || !entry.concept) continue

    const updates: Record<string, string | null> = {}

    const expectedThumb = `catalog/concepts/g${entry.gradeNum}-${entry.concept}/thumbnail`
    const expectedBanner = `catalog/concepts/g${entry.gradeNum}-${entry.concept}/banner`
    const expectedCover = `catalog/concepts/${entry.concept}/cover`

    if (!dbSubject.concept) updates.concept = entry.concept
    if (!dbSubject.thumbnail) updates.thumbnail = expectedThumb
    if (!dbSubject.banner) updates.banner = expectedBanner
    if (!dbSubject.cover) updates.cover = expectedCover

    // Set pdf path if textbook exists locally and not already set
    const textbookPath = path.join(
      CURRICULUM_DIR,
      entry.grade,
      entry.dirName,
      "textbook.pdf"
    )
    if (!dbSubject.pdf && fs.existsSync(textbookPath)) {
      updates.pdf = `catalog/textbooks/${entry.dbSlug}/textbook.pdf`
    }

    // Update Arabic name from curriculum.json if available
    const gradeMeta = meta.grades[entry.grade]
    const subjectMeta = gradeMeta?.[entry.dirName]
    if (subjectMeta) {
      updates.name = subjectMeta.ar
    }

    if (Object.keys(updates).length > 0) {
      await prisma.subject.update({
        where: { id: dbSubject.id },
        data: updates,
      })
      subjectUpdateCount++
    }
  }

  logSuccess(
    "Subject Updates",
    subjectUpdateCount,
    "subjects updated with metadata"
  )

  // Phase 4: Sync chapters and lessons
  logPhase(
    4,
    "SYNCING CHAPTERS & LESSONS",
    "Replacing stale data with curriculum directory structure"
  )

  let chaptersCreated = 0
  let lessonsCreated = 0
  let chaptersDeleted = 0
  let lessonsDeleted = 0
  let subjectsProcessed = 0

  for (const entry of inventory) {
    const dbSubject = slugToDb.get(entry.dbSlug)
    if (!dbSubject) continue
    if (entry.chapters.length === 0) continue

    const subjectConcept = dbSubject.concept ?? entry.concept
    const gradeNum = entry.gradeNum

    // Load structure.json for real Arabic titles
    const structurePath = path.join(
      CURRICULUM_DIR,
      entry.grade,
      entry.dirName,
      "structure.json"
    )
    let structureData: {
      chapters?: Array<{
        slug: string
        title: string
        lessons?: Array<{ slug: string; title: string }>
      }>
    } | null = null
    if (fs.existsSync(structurePath)) {
      try {
        structureData = JSON.parse(fs.readFileSync(structurePath, "utf-8"))
      } catch {
        // ignore parse errors, fall back to slug-based names
      }
    }
    const structChapterMap = new Map(
      (structureData?.chapters ?? []).map((c) => [c.slug, c])
    )

    // Wrap entire subject sync in a transaction to reduce round-trips
    await prisma.$transaction(
      async (tx) => {
        // Delete existing chapters/lessons for this subject
        // Delete lessons first (child), then chapters (parent)
        await tx.lesson.deleteMany({
          where: { chapter: { subjectId: dbSubject.id } },
        })
        const deletedChapters = await tx.chapter.deleteMany({
          where: { subjectId: dbSubject.id },
        })
        chaptersDeleted += deletedChapters.count

        // Create new chapters with lessons
        // Chapter thumbnails rotate through a pool of related concepts
        const pool =
          SUBJECT_CONCEPT_POOL[subjectConcept ?? ""] ??
          (subjectConcept ? [subjectConcept] : [])

        for (const ch of entry.chapters) {
          const structChapter = structChapterMap.get(ch.slug)
          const chapterName = structChapter?.title ?? ch.name

          // Rotate chapter concept through the pool by sequenceOrder
          const chapterConcept =
            pool.length > 0
              ? pool[(ch.sequenceOrder - 1) % pool.length]
              : subjectConcept
          const chapterThumbnail = USE_CLICKVIEW
            ? clickviewConceptKey(
                cvGradeToLevel(gradeNum),
                chapterConcept,
                "thumbnail"
              )
            : chapterConcept
              ? `catalog/concepts/g${gradeNum}-${chapterConcept}/thumbnail`
              : null

          const structLessonMap = new Map(
            (structChapter?.lessons ?? []).map((l) => [l.slug, l.title])
          )

          const chapter = await tx.chapter.create({
            data: {
              subjectId: dbSubject.id,
              name: chapterName,
              slug: ch.slug,
              lang: "ar",
              sequenceOrder: ch.sequenceOrder,
              concept: chapterConcept,
              thumbnail: chapterThumbnail,
              color: null,
              totalLessons: ch.lessons.length,
              status: "PUBLISHED",
            },
          })
          chaptersCreated++

          if (ch.lessons.length > 0) {
            await tx.lesson.createMany({
              data: ch.lessons.map((l) => {
                // Strip leading number prefix: "01-reading" → "reading"
                const lessonType = l.slug.replace(/^\d+-/, "")
                const lessonConcept =
                  LESSON_TYPE_CONCEPT[lessonType] ??
                  chapterConcept ??
                  subjectConcept
                const lessonThumbnail = USE_CLICKVIEW
                  ? clickviewConceptKey(
                      cvGradeToLevel(gradeNum),
                      lessonConcept,
                      "thumbnail"
                    )
                  : lessonConcept
                    ? `catalog/concepts/g${gradeNum}-${lessonConcept}/thumbnail`
                    : null

                return {
                  chapterId: chapter.id,
                  name: structLessonMap.get(l.slug) ?? l.name,
                  slug: l.slug,
                  lang: "ar",
                  sequenceOrder: l.sequenceOrder,
                  concept: lessonConcept,
                  thumbnail: lessonThumbnail,
                  status: "PUBLISHED",
                }
              }),
            })
            lessonsCreated += ch.lessons.length
          }
        }

        // Update subject counts
        const totalLessonsForSubject = entry.chapters.reduce(
          (sum, c) => sum + c.lessons.length,
          0
        )
        await tx.subject.update({
          where: { id: dbSubject.id },
          data: {
            totalChapters: entry.chapters.length,
            totalLessons: totalLessonsForSubject,
            totalContent: totalLessonsForSubject,
          },
        })
      },
      { timeout: 60000, maxWait: 30000 }
    )

    subjectsProcessed++
  }

  logSuccess(
    "Deleted",
    chaptersDeleted,
    `old chapters + ${lessonsDeleted} old lessons`
  )
  logSuccess("Created", chaptersCreated, `chapters + ${lessonsCreated} lessons`)
  logSuccess(
    "Subjects Processed",
    subjectsProcessed,
    "subjects synced from directory"
  )

  console.log(
    "\n  Done! Chapters and lessons now match curriculum/sd/ directory."
  )
  console.log(
    "  Thumbnails use concept-based S3 paths: catalog/concepts/g{N}-{concept}/thumbnail"
  )
}
