// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Curriculum tree engine — seeds ANY `curriculum/<dir>/` tree built in the
 * `structure.json` shape (the one `_build_tools/engine.py` produces for uk/us,
 * mirroring sd/). Generalizes the proven sd.ts walk so each curriculum is just
 * a small config.
 *
 * Per subject it reads `curriculum/<dir>/g{N}/<subject>/structure.json`:
 *   { subject, grade, subject_name, chapters: [{ slug, title, lessons: [{slug,title}] }] }
 * and upserts Subject + Chapter + Lesson with canonical code/country, a textbook
 * `pdf` S3 key (when `textbook.pdf` is present), and shared concept-CDN keys
 * (thumbnail/banner/cover), rotating concepts across chapters for visual variety.
 *
 * The specialized `sd.ts` keeps its own Arabic slug-overrides + dir-walking + PDF
 * handling; this engine serves uk (GB), us, and every future generated tree.
 */

import fs from "fs"
import path from "path"
import type { PrismaClient, SchoolLevel } from "@prisma/client"

import {
  colorFor,
  nearestConcept,
} from "../../../src/components/catalog/concepts-data"
import { logPhase, logSuccess } from "../utils"

// Re-exported so the national source files keep importing `colorFor` from here.
export { colorFor }

// ----------------------------------------------------------------------------
// Subject → concept (exact match) + concept → chapter rotation pool. Colors and
// the nearest-concept fallback live in src/components/catalog/concepts-data.ts;
// this map is the precise overrides for the uk/us subject-folder names.
// ----------------------------------------------------------------------------

const SUBJECT_CONCEPT: Record<string, string> = {
  english: "english",
  "english-language": "english",
  "english-literature": "english",
  ela: "english",
  math: "math",
  mathematics: "math",
  science: "science",
  biology: "biology",
  chemistry: "chemistry",
  physics: "physics",
  "environmental-science": "earth-science",
  "earth-science": "earth-science",
  history: "history",
  geography: "geography",
  "social-studies": "civics",
  "uae-social-studies": "civics",
  "moral-education": "civics",
  civics: "civics",
  economics: "economics",
  business: "economics",
  "business-studies": "economics",
  accounting: "economics",
  art: "arts",
  "art-design": "arts",
  arts: "arts",
  music: "arts",
  computing: "computer-science",
  "computer-science": "computer-science",
  ict: "computer-science",
  "design-technology": "career-tech",
  "physical-education": "pe",
  pe: "pe",
  pshe: "life-skills",
  "life-skills": "life-skills",
  arabic: "languages",
  french: "languages",
  spanish: "languages",
  languages: "languages",
  islamic: "religion",
  "islamic-studies": "religion",
  religion: "religion",
  psychology: "psychology",
  sociology: "sociology",
  "global-perspectives": "civics",
}

const SUBJECT_CONCEPT_POOL: Record<string, string[]> = {
  languages: ["languages", "english", "arts", "history", "geography"],
  math: ["math", "science", "computer-science", "physics", "economics"],
  english: ["english", "languages", "arts", "history", "sociology"],
  religion: ["religion", "history", "languages", "life-skills", "psychology"],
  science: ["science", "biology", "chemistry", "physics", "earth-science"],
  history: ["history", "geography", "civics", "sociology", "economics"],
  geography: ["geography", "earth-science", "science", "history", "biology"],
  arts: ["arts", "life-skills", "celebrations", "languages", "psychology"],
  "computer-science": [
    "computer-science",
    "math",
    "science",
    "career-tech",
    "economics",
  ],
  physics: ["physics", "math", "science", "computer-science", "earth-science"],
  chemistry: ["chemistry", "science", "biology", "physics", "health"],
  biology: ["biology", "science", "health", "chemistry", "earth-science"],
  health: ["health", "life-skills", "biology", "science", "economics"],
  civics: ["civics", "history", "pe", "life-skills", "geography"],
  economics: [
    "economics",
    "math",
    "computer-science",
    "career-tech",
    "sociology",
  ],
  "career-tech": [
    "career-tech",
    "computer-science",
    "science",
    "math",
    "economics",
  ],
  "earth-science": [
    "earth-science",
    "science",
    "biology",
    "geography",
    "chemistry",
  ],
  "life-skills": ["life-skills", "health", "arts", "economics", "sociology"],
  pe: ["pe", "health", "life-skills", "science", "psychology"],
  psychology: ["psychology", "sociology", "health", "life-skills", "science"],
  sociology: ["sociology", "psychology", "history", "economics", "civics"],
}

const SUBJECT_DEPARTMENT: Record<string, string> = {
  english: "Languages",
  arabic: "Languages",
  french: "Languages",
  languages: "Languages",
  math: "Mathematics",
  mathematics: "Mathematics",
  science: "Sciences",
  biology: "Sciences",
  chemistry: "Sciences",
  physics: "Sciences",
  "environmental-science": "Sciences",
  history: "Humanities",
  geography: "Humanities",
  "social-studies": "Humanities",
  "uae-social-studies": "Humanities",
  "moral-education": "Humanities",
  economics: "Commerce",
  business: "Commerce",
  "business-studies": "Commerce",
  accounting: "Commerce",
  art: "Arts",
  arts: "Arts",
  music: "Arts",
  computing: "Technology",
  "computer-science": "Technology",
  "design-technology": "Technology",
  "physical-education": "Physical Education",
  pe: "Physical Education",
  islamic: "Religious Studies",
  "islamic-studies": "Religious Studies",
}

// ----------------------------------------------------------------------------

interface StructureJson {
  subject: string
  grade: string
  subject_name?: string
  chapters: Array<{
    slug: string
    title: string
    lessons?: Array<{ slug: string; title: string }>
  }>
}

// The Curriculum record (name, slug, organization, gradeRange, …) is owned by
// registry.ts — the engine only needs what it writes onto subjects + the tree
// location. Keep curriculum metadata in registry.ts, not here.
export interface CurriculumTreeConfig {
  /** Folder under `curriculum/` to read, e.g. "uk". */
  dir: string
  /** Canonical country (ISO or "*"). */
  country: string
  /** Canonical curriculum code, e.g. "GB". */
  code: string
  /** Subject slug prefix, e.g. "gb" → `gb-g1-math`. */
  slugPrefix: string
  /** Display name, used only for seed logging. */
  name: string
  lang: string
  /** Sort-order base so curricula don't interleave. */
  sortBase: number
}

function gradeToLevel(grade: number): SchoolLevel {
  if (grade <= 6) return "ELEMENTARY"
  if (grade <= 9) return "MIDDLE"
  return "HIGH"
}

function slugToTitle(slug: string): string {
  return slug
    .replace(/^\d+-/, "")
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

/** List numeric-sorted grade dirs (g1..g12) under a curriculum tree. */
function gradeDirs(dir: string): string[] {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^g\d+$/.test(d.name))
    .map((d) => d.name)
    .sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)))
}

/**
 * Seed one `curriculum/<dir>/` tree (structure.json shape). Self-contained:
 * upserts its own Curriculum row, then Subject/Chapter/Lesson per grade.
 * Idempotent — subjects upsert by slug; chapters/lessons are replaced.
 */
export async function syncCurriculumTree(
  prisma: PrismaClient,
  config: CurriculumTreeConfig
): Promise<{ subjects: number; chapters: number; lessons: number }> {
  const root = path.resolve(__dirname, `../../../curriculum/${config.dir}`)
  if (!fs.existsSync(root)) {
    console.warn(
      `  [syncCurriculumTree] curriculum/${config.dir}/ not found — skipping`
    )
    return { subjects: 0, chapters: 0, lessons: 0 }
  }

  logPhase(1, config.name, `Reading curriculum/${config.dir}/`)

  // The Curriculum record is owned by registry.ts (the single registry of all
  // 12 curricula). The engine only writes the `curriculum` code onto subjects;
  // registry.ts backfills `curriculumId` once both exist.

  let subjectCount = 0
  let chapterCount = 0
  let lessonCount = 0
  let sortIdx = config.sortBase

  for (const gradeName of gradeDirs(root)) {
    const grade = parseInt(gradeName.slice(1))
    const gradePath = path.join(root, gradeName)
    const subjectDirs = fs
      .readdirSync(gradePath, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort()

    for (const subjectDir of subjectDirs) {
      const structPath = path.join(gradePath, subjectDir, "structure.json")
      if (!fs.existsSync(structPath)) continue

      let struct: StructureJson
      try {
        struct = JSON.parse(fs.readFileSync(structPath, "utf-8"))
      } catch {
        continue // skip malformed structure.json
      }

      const concept = SUBJECT_CONCEPT[subjectDir] ?? nearestConcept(subjectDir)
      const slug = `${config.slugPrefix}-g${grade}-${subjectDir}`
      const conceptPrefix = concept
        ? `catalog/concepts/g${grade}-${concept}`
        : null
      const hasTextbook = fs.existsSync(
        path.join(gradePath, subjectDir, "textbook.pdf")
      )
      const name =
        struct.subject_name?.split(" / ")[0]?.trim() || slugToTitle(subjectDir)
      const department = SUBJECT_DEPARTMENT[subjectDir] ?? "General"

      const subject = await prisma.subject.upsert({
        where: { slug },
        create: {
          name,
          slug,
          lang: config.lang,
          department,
          levels: [gradeToLevel(grade)],
          grades: [grade],
          gradeRange: String(grade),
          country: config.country,
          curriculum: config.code,
          concept,
          thumbnail: conceptPrefix ? `${conceptPrefix}/thumbnail` : null,
          banner: conceptPrefix ? `${conceptPrefix}/banner` : null,
          cover: concept ? `catalog/concepts/${concept}/cover` : null,
          pdf: hasTextbook ? `catalog/textbooks/${slug}/textbook.pdf` : null,
          sortOrder: sortIdx++,
          status: "PUBLISHED",
        },
        update: {
          name,
          department,
          concept,
          thumbnail: conceptPrefix ? `${conceptPrefix}/thumbnail` : null,
          banner: conceptPrefix ? `${conceptPrefix}/banner` : null,
          cover: concept ? `catalog/concepts/${concept}/cover` : null,
          pdf: hasTextbook ? `catalog/textbooks/${slug}/textbook.pdf` : null,
        },
      })
      subjectCount++

      // Replace chapters/lessons (idempotent) — lessons first (FK).
      await prisma.lesson.deleteMany({
        where: { chapter: { subjectId: subject.id } },
      })
      await prisma.chapter.deleteMany({ where: { subjectId: subject.id } })

      const pool =
        SUBJECT_CONCEPT_POOL[concept ?? ""] ?? (concept ? [concept] : [])

      for (const [chIdx, ch] of struct.chapters.entries()) {
        const lessons = ch.lessons ?? []
        const chapterConcept =
          pool.length > 0 ? pool[chIdx % pool.length] : concept
        const chapterThumb = chapterConcept
          ? `catalog/concepts/g${grade}-${chapterConcept}/thumbnail`
          : null

        const chapter = await prisma.chapter.create({
          data: {
            subjectId: subject.id,
            name: ch.title || slugToTitle(ch.slug),
            slug: ch.slug,
            lang: config.lang,
            sequenceOrder: chIdx + 1,
            concept: chapterConcept,
            thumbnail: chapterThumb,
            totalLessons: lessons.length,
            status: "PUBLISHED",
          },
        })
        chapterCount++

        if (lessons.length > 0) {
          await prisma.lesson.createMany({
            data: lessons.map((l, lIdx) => ({
              chapterId: chapter.id,
              name: l.title || slugToTitle(l.slug),
              slug: l.slug,
              lang: config.lang,
              sequenceOrder: lIdx + 1,
              concept: chapterConcept,
              thumbnail: chapterThumb,
              status: "PUBLISHED" as const,
            })),
          })
          lessonCount += lessons.length
        }
      }

      const totalLessons = struct.chapters.reduce(
        (s, c) => s + (c.lessons?.length ?? 0),
        0
      )
      await prisma.subject.update({
        where: { id: subject.id },
        data: {
          totalChapters: struct.chapters.length,
          totalLessons,
          totalContent: totalLessons,
        },
      })
    }
  }

  logSuccess(`${config.name} subjects`, subjectCount, config.code)
  logSuccess(`${config.name} chapters`, chapterCount, config.code)
  logSuccess(`${config.name} lessons`, lessonCount, config.code)

  return {
    subjects: subjectCount,
    chapters: chapterCount,
    lessons: lessonCount,
  }
}

// ============================================================================
// Shallow nationals (subjects-only)
// ----------------------------------------------------------------------------
// Used by the per-national source files (sa.ts, eg.ts, …). These curricula
// have grade-spanning subjects but no authored chapter/lesson tree yet, so they
// share the concept thumbnails and skip the hierarchy. Each graduates to a full
// `syncCurriculumTree` caller once its curriculum/<cc>/ tree is authored.
// Like the deep engine, this does NOT create the Curriculum record — registry.ts
// owns all 12 and backfills curriculumId.
// ============================================================================

export interface CurriculumDef {
  country: string
  code: string
  slug: string
  name: string
  lang: string
  organization?: string
  website?: string
  gradeRange?: string
  structure?: string
  description?: string
}

export interface SubjectDef {
  name: string
  slug: string
  department: string
  concept: string
  color: string
  grades: number[]
}

export interface CurriculumWithSubjects {
  curriculum: CurriculumDef
  subjects: SubjectDef[]
}

// CONCEPT_COLORS + colorFor now live in concepts-data.ts (imported above).

// Sort-order base per country (1000-wide bands) to keep slugs/order stable.
const NATIONAL_SORT_BASE: Record<string, number> = {
  US: 0,
  SD: 1000,
  GB: 2000,
  "*": 3000,
  SA: 4000,
  EG: 5000,
  AE: 6000,
  QA: 7000,
  KW: 8000,
  JO: 9000,
}

export async function seedSubjectsOnly(
  prisma: PrismaClient,
  entry: CurriculumWithSubjects
): Promise<void> {
  const { curriculum: cur, subjects } = entry
  let sortIdx = NATIONAL_SORT_BASE[cur.country] ?? 10000
  let created = 0
  let skipped = 0

  for (const subj of subjects) {
    for (const grade of subj.grades) {
      const slug = `${cur.slug}-g${grade}-${subj.slug}`
      const existing = await prisma.subject.findUnique({
        where: { slug },
        select: { id: true },
      })
      if (existing) {
        skipped++
        continue
      }

      const prefix = `catalog/concepts/g${grade}-${subj.concept}`
      await prisma.subject.create({
        data: {
          name: subj.name,
          slug,
          lang: cur.lang,
          department: subj.department,
          country: cur.country,
          curriculum: cur.code,
          concept: subj.concept,
          color: subj.color,
          levels: [gradeToLevel(grade)],
          grades: [grade],
          thumbnail: `${prefix}/thumbnail`,
          banner: `${prefix}/banner`,
          cover: `catalog/concepts/${subj.concept}/cover`,
          status: "PUBLISHED",
          sortOrder: sortIdx++,
        },
      })
      created++
    }
  }

  logSuccess(cur.name, created, "subjects")
  if (skipped > 0) logSuccess("Skipped", skipped, "existing")
}
