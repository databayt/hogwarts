// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Sudan REAL content ingester — ALL grades (g1–g12).
 *
 * Ingests the authored Arabic/English questions + final exams that live as
 * `curriculum/sd/g{N}/<subject>/{qbank.json,exams.json}` into the global
 * catalog (`Question` + `Exam` + `ExamQuestion`), scoped to the SD subjects,
 * their chapters AND lessons. This REPLACES the synthetic placeholder rows
 * that `content.ts` would otherwise generate — `content.ts` skips synthetic
 * exams/questions for any subject that already has questions tagged `"sd"`.
 *
 * Quality gate: a slice of the g11/g12 files is template junk ("Which concept
 * is most important in unit-01?", options "A) Concept 1"…). Any file where
 * >50% of questions match the placeholder markers is skipped WHOLE (no
 * delete, no ingest — `content.ts` keeps its synthetic content there), and
 * placeholder rows inside otherwise-real files are dropped individually.
 *
 * Scope resolution (id → chapter/lesson) tolerates every authored id scheme:
 *   g1–g4        sd-…-u03-q012            → unit only
 *   g5/g9/g10    …-unit-01-02-<slug>-q01  → unit + lesson index + lesson slug
 *   g6 ict       …-unit-1-<ch>-02-<l>-q01 → unit + lesson index + lesson slug
 *   g7/g8        …-unit01-q001            → unit only
 *   g7 islamic   …-unittajweed-q001       → named unit → chapter-slug match
 *   g10 various  …-chapter-1-lesson-1-q01 | …-module-1-unit-1-q01 |
 *                …-introduction-lesson-1-q01 | …-lessons-1-11-lesson-2-q01
 *   g11/g12      …-u01-l01-q001           → unit + lesson
 *   g12 military …-chap12-q001            → unit only
 * A boundary-safe chapter/lesson SLUG scan over the id runs first (so
 * `chapter-1` lands on the chapter whose slug IS `chapter-1`, even when an
 * `introduction` chapter shifts positions); units then map to chapters by
 * sequenceOrder (single-chapter subjects absorb everything); lessons match by
 * slug, then position. Questions whose unit is out of range stay
 * subject-level (NULL chapter) — never mis-filed. g1 math/islamic keep
 * hand-verified maps (files predate the g1 rebuild).
 *
 * Lesson mapping is what feeds the lesson-page practice quiz
 * (`get-lesson-content.ts` queries `Question.catalogLessonId`). Authored ids
 * that only encode a unit (no lesson number — g1-g4, g7/g8, g12 military)
 * resolve a chapter but not a lesson; those questions are distributed
 * round-robin across that chapter's own lessons (see `fallbackLessonId`
 * below) instead of being left lesson-less. That gap is what left every
 * sd-g1-* lesson with zero quiz questions despite ~298 verified questions
 * existing for the g1 subjects (psql-verified 2026-07-17).
 *
 * Videos are deliberately NOT seeded for SD lessons: the stream lesson player
 * falls back to the marketing story clip (`asset("/media/story.mp4")`) when a
 * lesson has zero Video rows — that fallback is the intended surface for the
 * whole SD tree (see stream/CLAUDE.md).
 *
 * Delete-and-recreate (like `sd.ts` does for chapters): `seedSdCurriculum`
 * rebuilds chapters/lessons every run with fresh ids, which would orphan
 * question scope FKs (SetNull) and duplicate on re-ingest. So we clear each
 * ingested subject's catalog questions/exams first, then rebuild against the
 * current chapter/lesson ids. Deleting catalog Question/Exam is safe: the
 * school mirrors (`QuestionBank`, `SchoolExam`) reference them onDelete: SetNull.
 *
 * Runs as part of `seedCatalog` (every deploy) right after `seedSdCurriculum`,
 * and standalone via `pnpm db:seed:single sd-content`. curriculum/ is
 * .vercelignore'd — on Vercel this is a no-op (skip, never delete).
 */

import fs from "fs"
import path from "path"
import type { Prisma, PrismaClient, QuestionType } from "@prisma/client"

import { logPhase, logSuccess } from "../utils"
import { resolveSdDbSlug } from "./sd"

const CURRICULUM_DIR = path.resolve(__dirname, "../../../curriculum/sd")

// ============================================================================
// Source file shapes
// ============================================================================

interface RawQuestion {
  id: string
  type: string
  question: string
  options?: string[]
  answer: string | boolean
  explanation?: string
}

interface RawExam {
  title?: string
  duration?: number
  total_marks?: number
  total_questions?: number
  questions?: RawQuestion[]
}

/** exams.json is either `{ exams: [...] }` (most grades), one flat exam
 *  object `{ type, duration, questions }` (g7/g8 + g12 physics), or the
 *  hybrid `{ exams: [meta-only], questions: [...] }` (g12 biology/chemistry)
 *  where the single exam's questions live at the top level. */
function parseExamsFile(file: string): RawExam[] {
  const raw = readJson<Record<string, unknown>>(file)
  if (!raw) return []
  if (Array.isArray(raw.exams)) {
    const exams = raw.exams as RawExam[]
    if (
      exams.length === 1 &&
      !Array.isArray(exams[0].questions) &&
      Array.isArray(raw.questions)
    ) {
      return [{ ...exams[0], questions: raw.questions as RawQuestion[] }]
    }
    return exams
  }
  if (Array.isArray(raw.questions)) return [raw as RawExam]
  return []
}

function readJson<T>(file: string): T | null {
  if (!fs.existsSync(file)) return null
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8")) as T
  } catch {
    return null
  }
}

// ============================================================================
// Quality gate — template-generated filler must never reach the catalog
// ============================================================================

/** Markers of the placeholder generator found in ~22 g11/g12 files. */
function isPlaceholder(q: RawQuestion): boolean {
  const text = String(q.question ?? "")
  const explanation = String(q.explanation ?? "")
  const options = Array.isArray(q.options) ? q.options.map(String) : []
  return (
    (/unit-?\d+/i.test(text) && /concept/i.test(text)) ||
    /Important concepts from unit/i.test(text) ||
    /^Explain the main topics covered in/i.test(text) ||
    options.some((o) => /^[A-D]\)\s*(Concept|Option)\s*\d/i.test(o)) ||
    /^Based on the curriculum/i.test(explanation)
  )
}

// ============================================================================
// Question-id → scope resolution
// ============================================================================

interface ParsedId {
  unit?: number
  lessonNum?: number
  lessonSlug?: string
  unitName?: string
}

function parseQuestionId(id: string): ParsedId {
  let m: RegExpMatchArray | null
  // g11/g12 sciences: g12-phy-u01-l01-q001
  if ((m = id.match(/-u0*(\d{1,2})-l0*(\d{1,2})-l?q\d+$/)))
    return { unit: +m[1], lessonNum: +m[2] }
  // g10 islamic: g10-isl-chapter-1-lesson-1-q01
  if ((m = id.match(/-chapter-0*(\d{1,2})-lesson-0*(\d{1,2})-l?q\d+$/)))
    return { unit: +m[1], lessonNum: +m[2] }
  // g10 computer-science: g10-com-chapter-01-01-overview-computer-technology-q01
  if ((m = id.match(/-chapter-0*(\d{1,2})-0*(\d{1,2})-(.+?)-l?q\d+$/)))
    return { unit: +m[1], lessonNum: +m[2], lessonSlug: m[3] }
  // g10 french: g10-fre-module-1-unit-1-q01 (module = chapter, unit = lesson)
  if ((m = id.match(/-module-0*(\d{1,2})-unit-0*(\d{1,2})-l?q\d+$/)))
    return { unit: +m[1], lessonNum: +m[2] }
  // g5/g9/g10 (+g11 arabic "-lq02"): g5-mat-unit-01-02-divisibility-by-9-q01
  if ((m = id.match(/-unit-0*(\d{1,2})-0*(\d{1,2})-(.+?)-l?q\d+$/)))
    return { unit: +m[1], lessonNum: +m[2], lessonSlug: m[3] }
  // g6 ict: g6-ict-unit-1-networks-and-communication-02-types-of-networks-q01
  if ((m = id.match(/-unit-0*(\d{1,2})-.+?-0*(\d{1,2})-(.+?)-l?q\d+$/)))
    return { unit: +m[1], lessonNum: +m[2], lessonSlug: m[3] }
  // g12 military: g12-mil-chap12-q001
  if ((m = id.match(/-chap0*(\d{1,2})-l?q\d+$/))) return { unit: +m[1] }
  // g1–g4 "u03" / g7–g8 "unit01" / bare "unit-3" / g2–g4 "u6ge" (unit 6 +
  // chapter-name prefix, e.g. u6ge = unit-6-GEometry)
  if ((m = id.match(/-u(?:nit)?-?0*(\d{1,2})[a-z]{0,3}(?:\b|-)/)))
    return { unit: +m[1] }
  // g7 islamic named units: g7-is-unittajweed-q001
  if ((m = id.match(/-unit([a-z][a-z-]*?)-l?q\d+$/))) return { unitName: m[1] }
  // named chapter + lesson: g10-mil-introduction-lesson-1-q01
  if ((m = id.match(/-([a-z][a-z0-9-]*?)-lesson-0*(\d{1,2})-l?q\d+$/)))
    return { unitName: m[1], lessonNum: +m[2] }
  return {}
}

/**
 * g1 files were authored against the PRE-rebuild unit counts; the content is
 * genuine grade-1 but units need hand-verified chapter maps (see the g1
 * rebuild notes in scripts/sudan-data/rebuild-g1.mjs). unit (1-based) →
 * chapter index (0-based).
 */
const G1_UNIT_TO_CHAPTER: Record<string, Record<number, number>> = {
  // u1 numbers, u2 add, u3 sub, u4-6 numbers 10-99, u7-8 measurement
  math: { 1: 0, 2: 1, 3: 2, 4: 3, 5: 3, 6: 3, 7: 4, 8: 4 },
  // u1 Basmala + u2 Fatiha → quran; u3 hadith; u4 pillars + u8 religion →
  // faith; u5 wudu → purification; u6 Prophet → seerah; u7 elders → manners
  islamic: { 1: 0, 2: 0, 3: 1, 4: 2, 5: 3, 6: 5, 7: 4, 8: 2 },
}

interface DbLesson {
  id: string
  slug: string
}

interface DbChapter {
  id: string
  slug: string
  lessons: DbLesson[]
}

const stripSeq = (slug: string) => slug.replace(/^\d+-/, "")

/**
 * Boundary-safe slug scan: does `-<slug>-` occur inside `-<id>-`? Prevents
 * `chapter-1` matching inside `chapter-10` while letting arbitrary authored
 * slugs (`introduction`, `lessons-1-11`, `module-2`) resolve exactly.
 */
function idContainsSlug(id: string, slug: string): boolean {
  return `-${id}-`.includes(`-${slug}-`)
}

/** Resolve a question id to { chapterId, lessonId } against the DB tree. */
function resolveScope(
  id: string,
  grade: string,
  dir: string,
  chapters: DbChapter[]
): { chapterId: string | null; lessonId: string | null } {
  const parsed = parseQuestionId(id)

  let unit = parsed.unit
  if (grade === "g1" && unit != null) {
    const handMap = G1_UNIT_TO_CHAPTER[dir]
    if (handMap) {
      const mapped = handMap[unit]
      unit = mapped != null ? mapped + 1 : unit
    }
  }

  // Chapter: literal slug occurrence in the id beats positional counting —
  // g10 military's chapters are [introduction, chapter-1, …], so the id
  // `…-chapter-1-lesson-2-…` must land on the `chapter-1` SLUG (index 1),
  // not on unit position 1 (index 0). Longest matching slug wins.
  let chapterIdx: number | null = null
  let bestLen = 0
  for (const [i, c] of chapters.entries()) {
    const slug = stripSeq(c.slug)
    if (slug.length > bestLen && idContainsSlug(id, slug)) {
      chapterIdx = i
      bestLen = slug.length
    }
  }

  if (chapterIdx == null) {
    if (chapters.length === 1) {
      // Single-chapter subjects absorb every question regardless of unit.
      chapterIdx = 0
    } else if (unit != null && unit - 1 < chapters.length) {
      chapterIdx = unit - 1
    } else if (parsed.unitName) {
      const wanted = parsed.unitName.replace(/-/g, "")
      chapterIdx = chapters.findIndex((c) => {
        const have = stripSeq(c.slug).replace(/-/g, "")
        return have.includes(wanted) || wanted.includes(have)
      })
      if (chapterIdx < 0) chapterIdx = null
    }
  }

  if (chapterIdx == null) return { chapterId: null, lessonId: null }
  const chapter = chapters[chapterIdx]

  // Lesson within the chapter: slug scan → parsed slug → position.
  let lessonIdx: number | null = null
  let bestLessonLen = 0
  for (const [i, l] of chapter.lessons.entries()) {
    const slug = stripSeq(l.slug)
    if (slug.length > bestLessonLen && idContainsSlug(id, slug)) {
      lessonIdx = i
      bestLessonLen = slug.length
    }
  }
  if (lessonIdx == null && parsed.lessonSlug) {
    lessonIdx = chapter.lessons.findIndex(
      (l) => stripSeq(l.slug) === parsed.lessonSlug
    )
    if (lessonIdx < 0) lessonIdx = null
  }
  if (
    lessonIdx == null &&
    parsed.lessonNum != null &&
    parsed.lessonNum - 1 < chapter.lessons.length
  ) {
    lessonIdx = parsed.lessonNum - 1
  }

  return {
    chapterId: chapter.id,
    lessonId:
      lessonIdx != null ? (chapter.lessons[lessonIdx]?.id ?? null) : null,
  }
}

// ============================================================================
// Row builders
// ============================================================================

function mapType(t: string): QuestionType {
  switch (t) {
    case "mcq":
      return "MULTIPLE_CHOICE"
    case "true_false":
      return "TRUE_FALSE"
    case "fill_blank":
      return "FILL_BLANK"
    default:
      return "SHORT_ANSWER"
  }
}

function buildOptions(
  q: RawQuestion,
  lang: "ar" | "en"
): Prisma.InputJsonValue | undefined {
  if (q.type === "mcq" && Array.isArray(q.options)) {
    const answer = String(q.answer)
    return q.options.map((o) => ({
      text: String(o),
      isCorrect: String(o) === answer,
    }))
  }
  if (q.type === "true_false") {
    const isTrue = q.answer === true || q.answer === "true"
    const yes = lang === "ar" ? "صح" : "True"
    const no = lang === "ar" ? "خطأ" : "False"
    return [
      { text: yes, isCorrect: isTrue },
      { text: no, isCorrect: !isTrue },
    ]
  }
  return undefined
}

// ============================================================================
// Main
// ============================================================================

export async function seedSdContent(prisma: PrismaClient): Promise<void> {
  logPhase(
    5,
    "SD REAL CONTENT (g1–g12)",
    "Ingesting authored qbank + exams into the catalog"
  )

  // curriculum/ is .vercelignore'd — absent on Vercel builds. Skip entirely
  // (never delete) when the source tree isn't here; SD content is seeded from
  // a local run, and a deploy-time seed must not wipe it.
  if (!fs.existsSync(CURRICULUM_DIR)) {
    console.log("   curriculum/sd/ not found, skipping SD content")
    return
  }

  const grades = fs
    .readdirSync(CURRICULUM_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^g\d+$/.test(d.name))
    .map((d) => d.name)
    .sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)))

  // Keyed by DB slug so a second dir resolving to the same subject (g6 ict/ +
  // technology/ → sd-g6-technology) replaces the first's counts instead of
  // double-counting — mirroring the delete-and-recreate the DB actually does.
  interface SlugStats {
    dir: string
    questions: number
    chapterMapped: number
    lessonMapped: number
    lessonFallbackMapped: number
    exams: number
    links: number
  }
  const bySlug = new Map<string, SlugStats>()
  const junkSkipped: string[] = []
  const missingSubjects: string[] = []

  for (const grade of grades) {
    const gradeNum = parseInt(grade.slice(1))
    const gradePath = path.join(CURRICULUM_DIR, grade)
    const subjectDirs = fs
      .readdirSync(gradePath, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort()

    for (const dir of subjectDirs) {
      const subjectPath = path.join(gradePath, dir)
      const qbank = readJson<{ questions?: RawQuestion[] }>(
        path.join(subjectPath, "qbank.json")
      )
      const exams = parseExamsFile(path.join(subjectPath, "exams.json"))

      // No source files — skip WITHOUT deleting, so a partial tree never
      // wipes already-ingested content.
      if (!qbank && exams.length === 0) continue

      // ---- Quality gate ----------------------------------------------------
      const bankQuestions = qbank?.questions ?? []
      const junkCount = bankQuestions.filter(isPlaceholder).length
      if (bankQuestions.length > 0 && junkCount / bankQuestions.length > 0.5) {
        junkSkipped.push(
          `${grade}/${dir} (${junkCount}/${bankQuestions.length})`
        )
        continue
      }

      const dbSlug = resolveSdDbSlug(grade, dir)
      const subject = await prisma.subject.findUnique({
        where: { slug: dbSlug },
        select: {
          id: true,
          name: true,
          chapters: {
            orderBy: { sequenceOrder: "asc" },
            select: {
              id: true,
              slug: true,
              lessons: {
                orderBy: { sequenceOrder: "asc" },
                select: { id: true, slug: true },
              },
            },
          },
        },
      })
      if (!subject) {
        missingSubjects.push(dbSlug)
        continue
      }

      const prior = bySlug.get(dbSlug)
      if (prior) {
        console.log(
          `   [re-ingest] ${grade}/${dir} replaces ${prior.dir} on ${dbSlug} — two dirs share one DB subject; last dir wins, matching sd.ts chapter builds`
        )
      }

      const lang: "ar" | "en" = dir === "english" ? "en" : "ar"
      const difficulty = gradeNum <= 6 ? "EASY" : "MEDIUM"

      // Collect every question (qbank ∪ exams), deduped by text — the
      // authoring copies identical rows across units, and exam questions are
      // a subset of the qbank. FIRST occurrence wins scope attribution
      // (earliest unit), so the map must never overwrite.
      const byText = new Map<string, RawQuestion>()
      for (const q of bankQuestions) {
        if (!byText.has(q.question) && !isPlaceholder(q))
          byText.set(q.question, q)
      }
      for (const ex of exams) {
        for (const q of ex.questions ?? []) {
          if (!byText.has(q.question) && !isPlaceholder(q))
            byText.set(q.question, q)
        }
      }
      if (byText.size === 0) continue

      // Delete-and-recreate: clear this subject's catalog content (safe —
      // school mirrors are onDelete: SetNull), then rebuild against current
      // chapter/lesson ids. Also clears content.ts synthetic rows, which the
      // real content supersedes.
      await prisma.exam.deleteMany({ where: { subjectId: subject.id } })
      await prisma.question.deleteMany({
        where: { catalogSubjectId: subject.id },
      })

      // Round-robin fallback: when resolveScope finds a chapter but no
      // lesson (unit-only ids — see parseQuestionId), spread those questions
      // evenly across the RESOLVED chapter's own lessons rather than leaving
      // them lesson-less. Chapter-scoped (never crosses into another
      // chapter's lessons) and deterministic (stable ordering across
      // re-ingests — the outer loop always walks `byText` in the same
      // qbank-then-exams order). Never overrides a real, source-derived
      // lessonId.
      const chaptersById = new Map(subject.chapters.map((c) => [c.id, c]))
      const fallbackLessonCursor = new Map<string, number>()
      function fallbackLessonId(chapterId: string): string | null {
        const chapter = chaptersById.get(chapterId)
        if (!chapter || chapter.lessons.length === 0) return null
        const cursor = fallbackLessonCursor.get(chapterId) ?? 0
        fallbackLessonCursor.set(chapterId, cursor + 1)
        return chapter.lessons[cursor % chapter.lessons.length].id
      }

      const questionData: Prisma.QuestionCreateManyInput[] = []
      let chapterMapped = 0
      let lessonMapped = 0
      let lessonFallbackMapped = 0
      for (const q of byText.values()) {
        const type = mapType(q.type)
        const needsSampleAnswer =
          type === "FILL_BLANK" || type === "SHORT_ANSWER"
        const scope = resolveScope(
          String(q.id ?? ""),
          grade,
          dir,
          subject.chapters
        )
        if (scope.chapterId) chapterMapped++
        if (scope.lessonId) lessonMapped++

        let lessonId = scope.lessonId
        if (scope.chapterId && !lessonId) {
          lessonId = fallbackLessonId(scope.chapterId)
          if (lessonId) lessonFallbackMapped++
        }

        questionData.push({
          catalogSubjectId: subject.id,
          catalogChapterId: scope.chapterId,
          catalogLessonId: lessonId,
          questionText: q.question,
          questionType: type,
          difficulty,
          bloomLevel: type === "SHORT_ANSWER" ? "UNDERSTAND" : "REMEMBER",
          points: 1,
          options: buildOptions(q, lang),
          sampleAnswer: needsSampleAnswer ? String(q.answer) : undefined,
          explanation: q.explanation,
          tags: ["sd", grade, dir],
          approvalStatus: "APPROVED",
          visibility: "PUBLIC",
          status: "PUBLISHED",
        })
      }

      await prisma.question.createMany({ data: questionData })

      // Map question text → id for exam junctions.
      const created = await prisma.question.findMany({
        where: { catalogSubjectId: subject.id },
        select: { id: true, questionText: true, points: true },
      })
      const idByText = new Map(created.map((c) => [c.questionText, c]))

      let examCount = 0
      let linkCount = 0
      for (const ex of exams) {
        const links: Prisma.ExamQuestionCreateManyInput[] = []
        const usedQuestionIds = new Set<string>()
        for (const q of ex.questions ?? []) {
          const match = idByText.get(q.question)
          if (!match || usedQuestionIds.has(match.id)) continue
          usedQuestionIds.add(match.id)
          links.push({
            catalogExamId: "", // set after exam create
            catalogQuestionId: match.id,
            order: links.length + 1,
            points: Number(match.points) || 1,
          })
        }
        if (links.length === 0) continue

        const title =
          ex.title?.trim() ||
          (lang === "en"
            ? `Final Exam — ${subject.name}`
            : `الامتحان النهائي — ${subject.name}`)

        const examRow = await prisma.exam.create({
          data: {
            subjectId: subject.id,
            title,
            examType: "final",
            durationMinutes: ex.duration ?? null,
            totalMarks: ex.total_marks ?? links.length,
            totalQuestions: links.length,
            lang,
            status: "PUBLISHED",
            approvalStatus: "APPROVED",
            visibility: "PUBLIC",
          },
          select: { id: true },
        })
        examCount++

        await prisma.examQuestion.createMany({
          data: links.map((l) => ({ ...l, catalogExamId: examRow.id })),
          skipDuplicates: true,
        })
        linkCount += links.length
      }

      const totalLessonMapped = lessonMapped + lessonFallbackMapped
      bySlug.set(dbSlug, {
        dir: `${grade}/${dir}`,
        questions: questionData.length,
        chapterMapped,
        lessonMapped: totalLessonMapped,
        lessonFallbackMapped,
        exams: examCount,
        links: linkCount,
      })
      console.log(
        `   ${dbSlug}: ${questionData.length} questions (${chapterMapped} chapter-mapped, ${totalLessonMapped} lesson-mapped${lessonFallbackMapped ? ` [${lessonFallbackMapped} via fallback]` : ""}), ${examCount} exam(s)`
      )
    }
  }

  if (junkSkipped.length > 0) {
    console.log(
      `\n   [junk-skip] ${junkSkipped.length} template-generated files left to synthetic content:\n   ${junkSkipped.join(", ")}`
    )
  }
  if (missingSubjects.length > 0) {
    console.log(
      `   [no-subject] ${missingSubjects.length} dirs with no DB subject (run \`db:seed:single sd\` first): ${missingSubjects.join(", ")}`
    )
  }

  const stats = [...bySlug.values()]
  const sum = (f: (s: SlugStats) => number) =>
    stats.reduce((n, s) => n + f(s), 0)
  logSuccess("SD subjects", stats.length, "with real content")
  logSuccess(
    "SD questions",
    sum((s) => s.questions),
    `${sum((s) => s.chapterMapped)} chapter-mapped, ${sum((s) => s.lessonMapped)} lesson-mapped (${sum((s) => s.lessonFallbackMapped)} via fallback)`
  )
  logSuccess(
    "SD exams",
    sum((s) => s.exams),
    `with ${sum((s) => s.links)} question links`
  )
}
