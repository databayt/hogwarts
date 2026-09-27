// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Catalog tree seed — the ONE reader of `databayt/catalog`.
 *
 * The curriculum content lives in its own repository (github.com/databayt/catalog,
 * cloned beside this repo as `../catalog`), which mirrors the CDN:
 *
 *   ../catalog/sd/g12/biology/structure.json   ==  cdn.databayt.org/catalog/sd/g12/biology/structure.json
 *
 * Every curriculum has the same shape, so one seed replaces the old per-tree
 * seeds (sd.ts, sd-content.ts and the engine.ts callers gb/cbse/ib/caie-igcse).
 * Per subject it reads `structure.json` (identity, titles, chapters `c<N>` →
 * lessons `l<N>`) and every `qbank.json` / `exams.json` at the level where it
 * sits (subject, `c<N>/`, `c<N>/l<N>/`) — no id parsing: a question's folder
 * IS its scope.
 *
 * Identity is preserved. Tenant rows point at catalog chapters and lessons
 * (147 live-class sessions, lesson progress), so chapters and lessons are
 * ADOPTED and renamed in place, never deleted and recreated:
 *   - a subject is found by its catalog id, else by its pre-catalog slug
 *     (`scripts/migrate/renames.json` in the catalog clone) and renamed;
 *   - a chapter/lesson is found by its pre-catalog slug (same file; `unit-1`
 *     and `unit-01` are one chapter) or by its current `c<N>`/`l<N>` slug, and
 *     renamed to its position;
 *   - rows the catalog no longer has are ARCHIVED (PUBLISHED is the
 *     visibility floor), never deleted — their references stay intact.
 * Questions and exams carry no tenant references (school mirrors SetNull), so
 * they are rebuilt per subject from the catalog files, like sd-content did.
 *
 * Safe at deploy time: without a catalog clone it does nothing and deletes
 * nothing. `CATALOG_DIR` points elsewhere; `CATALOG_CURRICULA=sd,gb` narrows.
 *
 * Usage: pnpm db:seed:single catalog-tree
 */

import { randomUUID } from "crypto"
import fs from "fs"
import path from "path"
import type {
  Prisma,
  PrismaClient,
  QuestionType,
  SchoolLevel,
} from "@prisma/client"

import {
  clickviewConceptKey,
  gradeToLevel as cvGradeToLevel,
} from "../../../src/components/catalog/clickview-key"
import {
  CONCEPT_POOL,
  CONCEPTS,
  nearestConcept,
  SUBJECT_CONCEPT_BY_SLUG,
} from "../../../src/components/catalog/concepts-data"
import { logPhase, logSuccess } from "../utils"

const USE_CLICKVIEW =
  process.env.CLICKVIEW_KEYS === "1" || process.env.CLICKVIEW_KEYS === "true"

export const CATALOG_DIR = process.env.CATALOG_DIR
  ? path.resolve(process.env.CATALOG_DIR)
  : path.resolve(__dirname, "../../../../catalog")

/**
 * Catalog curricula this app seeds, with the Curriculum row they belong to.
 * `us` is deliberately absent: the catalog's `us` tree is the Aldar American
 * variant, while hogwarts' `us-*` subjects come from `us.ts` (US K-12) — the
 * same slugs, different content. Adopt it only after that decision.
 */
const CURRICULA: Record<
  string,
  { country: string; code: string; sortBase: number }
> = {
  sd: { country: "SD", code: "SD", sortBase: 1000 },
  gb: { country: "GB", code: "GB", sortBase: 2000 },
  cbse: { country: "IN", code: "CBSE", sortBase: 3100 },
  "ib-dp": { country: "*", code: "IB-DP", sortBase: 3200 },
  "caie-igcse": { country: "*", code: "CAIE-IGCSE", sortBase: 3300 },
}

// ---------------------------------------------------------------- catalog shapes

type Title = { ar?: string; en?: string; fr?: string }
type Lang = "ar" | "en" | "fr"

interface CLesson {
  slug: string
  title: Title
  page?: number
  image?: string
  concept?: string
  description?: string
  objectives?: string[]
  durationMinutes?: number
}
interface CChapter {
  slug: string
  title: Title
  concept?: string
  image?: string
  description?: string
  lessons: CLesson[]
}
interface CStructure {
  id: string
  curriculum: string
  grade: string
  subject: string
  title: Title
  lang: Lang
  concept?: string
  about?: {
    description?: string
    objectives?: string[]
    prerequisites?: string
    audience?: string
  }
  chapters: CChapter[]
}
interface CQuestion {
  id: string
  type: "mcq" | "true_false" | "fill_blank" | "short_answer"
  question: string
  options?: string[]
  answer: string | number | boolean | string[]
  explanation?: string
}
interface CExam {
  id: string
  title: string
  type: string
  description?: string
  durationMinutes?: number
  totalMarks?: number
  passingMarks?: number
  questions?: CQuestion[]
}
interface Renames {
  subjects: {
    from: string
    to: string
    dbSlugFrom?: string
    dbSlugTo: string
  }[]
  chapters: { subject: string; from: string; to: string }[]
  lessons: { subject: string; chapter: string; from: string; to: string }[]
}

const readJson = <T>(file: string): T | null =>
  fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, "utf-8")) as T) : null

// ---------------------------------------------------------------- vocabulary

const CONCEPT_SET = new Set<string>(CONCEPTS)
const pick = (t: Title, lang: Lang) => t[lang] ?? t.en ?? t.ar ?? t.fr ?? ""

function gradeToLevel(grade: number): SchoolLevel {
  if (grade <= 6) return "ELEMENTARY"
  if (grade <= 9) return "MIDDLE"
  return "HIGH"
}

/** Unchanged from sd.ts for SD; the engine.ts map for the rest. */
function departmentFor(
  curriculum: string,
  grade: number,
  subject: string
): string {
  if (curriculum === "sd")
    return grade <= 6 ? "Elementary" : grade <= 9 ? "Middle School" : "Sciences"
  const base = subject.replace(/-(specialized|optional)$/, "")
  const map: Record<string, string> = {
    english: "Languages",
    "english-literature": "Languages",
    arabic: "Languages",
    french: "Languages",
    math: "Mathematics",
    "further-math": "Mathematics",
    science: "Sciences",
    biology: "Sciences",
    chemistry: "Sciences",
    physics: "Sciences",
    "environmental-science": "Sciences",
    history: "Humanities",
    geography: "Humanities",
    "social-studies": "Humanities",
    "moral-education": "Humanities",
    citizenship: "Humanities",
    civics: "Humanities",
    economics: "Commerce",
    business: "Commerce",
    art: "Arts",
    music: "Arts",
    "computer-science": "Technology",
    ict: "Technology",
    "design-technology": "Technology",
    "physical-education": "Physical Education",
    "islamic-studies": "Religious Studies",
  }
  return map[base] ?? "General"
}

/** A concept-art key, in whichever scheme is live (see clickview-key.ts). */
function conceptKey(
  grade: number,
  concept: string | null,
  kind: "thumbnail" | "banner"
): string | null {
  if (!concept) return null
  return USE_CLICKVIEW
    ? clickviewConceptKey(cvGradeToLevel(grade), concept, kind)
    : `catalog/concepts/g${grade}-${concept}/${kind}`
}

// ---------------------------------------------------------------- SD description (from sd.ts)

const ORD_AR = [
  "",
  "الأول",
  "الثاني",
  "الثالث",
  "الرابع",
  "الخامس",
  "السادس",
  "السابع",
  "الثامن",
  "التاسع",
  "العاشر",
  "الحادي عشر",
  "الثاني عشر",
]
const stageAr = (g: number) =>
  g <= 6
    ? "المرحلة الابتدائية"
    : g <= 9
      ? "المرحلة المتوسطة"
      : "المرحلة الثانوية"
const stageEn = (g: number) =>
  g <= 6 ? "primary stage" : g <= 9 ? "intermediate stage" : "secondary stage"
const gradeLabelAr = (g: number) =>
  g <= 6
    ? `الصف ${ORD_AR[g]}`
    : g <= 9
      ? `الصف ${ORD_AR[g - 6]} المتوسط`
      : `الصف ${ORD_AR[g - 9]} الثانوي`

/** Factual "about" text: the book's own summary + the verified unit list. Never invented. */
function composeSdDescription(s: CStructure, grade: number): string | null {
  const intro = s.about?.description ? `${s.about.description.trim()} ` : ""
  if (s.chapters.length === 0 && !intro) return null
  const cap = (x: string) => (x.length > 1200 ? x.slice(0, 1199) + "…" : x)
  if (s.lang === "ar") {
    const titles = s.chapters.map((c) =>
      pick(c.title, "ar")
        .replace(/^\s*الوحدة\s+\S+\s*[:：-]\s*/, "")
        .trim()
    )
    const units = titles.length
      ? ` يتناول ${titles.length} وحدات: ${titles.join("، ")}.`
      : ""
    return cap(
      `${intro}كتاب ${pick(s.title, "ar")} — ${stageAr(grade)}، ${gradeLabelAr(grade)}.${units}`
    )
  }
  const titles = s.chapters.map((c) => pick(c.title, "en").trim())
  const units = titles.length
    ? ` ${titles.length} units: ${titles.join("; ")}.`
    : ""
  return cap(
    `${intro}${pick(s.title, "en")} textbook — Sudan ${stageEn(grade)}, grade ${grade}.${units}`
  )
}

// ---------------------------------------------------------------- questions

const TF_LABELS: Record<Lang, [string, string]> = {
  ar: ["صح", "خطأ"],
  en: ["True", "False"],
  fr: ["Vrai", "Faux"],
}

function mapType(t: CQuestion["type"]): QuestionType {
  return t === "mcq"
    ? "MULTIPLE_CHOICE"
    : t === "true_false"
      ? "TRUE_FALSE"
      : t === "fill_blank"
        ? "FILL_BLANK"
        : "SHORT_ANSWER"
}

function buildOptions(
  q: CQuestion,
  lang: Lang
): Prisma.InputJsonValue | undefined {
  if (q.type === "mcq" && q.options?.length) {
    const answer = String(q.answer)
    return q.options.map((o) => ({ text: o, isCorrect: o === answer }))
  }
  if (q.type === "true_false") {
    const isTrue = q.answer === true || q.answer === "true"
    const [yes, no] = TF_LABELS[lang]
    return [
      { text: yes, isCorrect: isTrue },
      { text: no, isCorrect: !isTrue },
    ]
  }
  return undefined
}

// ---------------------------------------------------------------- adoption helpers

/** `unit-1`, `unit-01`, `chapter-1` → one key, so a folder/structure drift still adopts. */
const normalizeLegacy = (slug: string) =>
  slug.replace(/^(unit|chapter|module)-0*(\d+)$/, "$1-$2")
const TMP = "~"
const ARCHIVED = "archived-"

function loadRenames(): Renames {
  return (
    readJson<Renames>(
      path.join(CATALOG_DIR, "scripts", "migrate", "renames.json")
    ) ?? {
      subjects: [],
      chapters: [],
      lessons: [],
    }
  )
}

interface Stats {
  subjects: number
  created: number
  renamed: number
  chapters: number
  lessons: number
  archivedChapters: number
  archivedLessons: number
  questions: number
  exams: number
}

// ---------------------------------------------------------------- main

export async function seedCatalogTree(
  prisma: PrismaClient,
  opts: { curricula?: string[] } = {}
): Promise<void> {
  if (!fs.existsSync(path.join(CATALOG_DIR, "index.json"))) {
    console.log(
      `  catalog clone not found at ${CATALOG_DIR} — skipping (nothing deleted)`
    )
    return
  }
  const wanted = (
    opts.curricula ??
    process.env.CATALOG_CURRICULA?.split(",") ??
    Object.keys(CURRICULA)
  )
    .map((c) => c.trim())
    .filter((c) => c in CURRICULA && fs.existsSync(path.join(CATALOG_DIR, c)))

  const renames = loadRenames()
  // subject id -> pre-catalog DB slugs that should become it
  const legacySubject = new Map<string, string[]>()
  for (const r of renames.subjects)
    if (r.dbSlugFrom && r.dbSlugFrom !== r.dbSlugTo)
      legacySubject.set(r.dbSlugTo, [
        ...(legacySubject.get(r.dbSlugTo) ?? []),
        r.dbSlugFrom,
      ])
  // `${subjectId}` -> legacy chapter slug -> cN
  const legacyChapter = new Map<string, Map<string, string>>()
  for (const r of renames.chapters) {
    const m = legacyChapter.get(r.subject) ?? new Map<string, string>()
    m.set(r.from, r.to)
    m.set(normalizeLegacy(r.from), r.to)
    legacyChapter.set(r.subject, m)
  }
  // `${subjectId}/${cN}` -> legacy lesson slug -> lN
  const legacyLesson = new Map<string, Map<string, string>>()
  for (const r of renames.lessons) {
    const k = `${r.subject}/${r.chapter}`
    const m = legacyLesson.get(k) ?? new Map<string, string>()
    m.set(r.from, r.to)
    legacyLesson.set(k, m)
  }

  const stats: Stats = {
    subjects: 0,
    created: 0,
    renamed: 0,
    chapters: 0,
    lessons: 0,
    archivedChapters: 0,
    archivedLessons: 0,
    questions: 0,
    exams: 0,
  }

  for (const cur of wanted) {
    const cfg = CURRICULA[cur]!
    logPhase(
      1,
      `CATALOG ${cur.toUpperCase()}`,
      `Reading ${path.join(CATALOG_DIR, cur)}`
    )
    const curriculumRow = await prisma.curriculum.findUnique({
      where: { country_code: { country: cfg.country, code: cfg.code } },
      select: { id: true },
    })
    const lockKeys = new Set(
      Object.keys(
        readJson<{ assets: Record<string, unknown> }>(
          path.join(CATALOG_DIR, "assets.lock.json")
        )?.assets ?? {}
      )
    )
    let sortIdx = cfg.sortBase
    const grades = fs
      .readdirSync(path.join(CATALOG_DIR, cur))
      .filter((g) => /^g\d+$/.test(g))
      .sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)))

    // Subjects are independent (own rows, own transaction), and the seed is
    // round-trip bound, so a few run at once. CATALOG_CONCURRENCY overrides.
    const tasks: SubjectCtx[] = []
    for (const gradeId of grades) {
      const grade = parseInt(gradeId.slice(1))
      for (const folder of fs
        .readdirSync(path.join(CATALOG_DIR, cur, gradeId))
        .sort()) {
        const dir = path.join(CATALOG_DIR, cur, gradeId, folder)
        const s = readJson<CStructure>(path.join(dir, "structure.json"))
        if (!s) continue
        tasks.push({
          cur,
          cfg,
          grade,
          dir,
          s,
          curriculumId: curriculumRow?.id ?? null,
          lockKeys,
          sortOrder: sortIdx++,
          legacySubject,
          legacyChapter,
          legacyLesson,
          stats,
        })
      }
    }
    const width = Math.max(1, Number(process.env.CATALOG_CONCURRENCY ?? 6))
    let next = 0
    await Promise.all(
      Array.from({ length: Math.min(width, tasks.length) }, async () => {
        while (next < tasks.length) await seedSubject(prisma, tasks[next++]!)
      })
    )
  }

  logSuccess(
    "Catalog subjects",
    stats.subjects,
    `${stats.created} created · ${stats.renamed} renamed to catalog ids`
  )
  logSuccess(
    "Catalog tree",
    stats.chapters,
    `chapters + ${stats.lessons} lessons (ids preserved)`
  )
  if (stats.archivedChapters || stats.archivedLessons)
    logSuccess(
      "Archived",
      stats.archivedChapters,
      `chapters + ${stats.archivedLessons} lessons the catalog no longer has`
    )
  logSuccess(
    "Catalog content",
    stats.questions,
    `questions + ${stats.exams} exams`
  )
}

interface SubjectCtx {
  cur: string
  cfg: { country: string; code: string }
  grade: number
  dir: string
  s: CStructure
  curriculumId: string | null
  lockKeys: Set<string>
  sortOrder: number
  legacySubject: Map<string, string[]>
  legacyChapter: Map<string, Map<string, string>>
  legacyLesson: Map<string, Map<string, string>>
  stats: Stats
}

async function seedSubject(
  prisma: PrismaClient,
  ctx: SubjectCtx
): Promise<void> {
  const { cur, cfg, grade, s, lockKeys, stats } = ctx
  const base = `catalog/${s.curriculum}/${s.grade}/${s.subject}`
  const locked = (f: string) =>
    lockKeys.has(`${base}/${f}`) ? `${base}/${f}` : null
  const lang = s.lang

  // ---- subject: find by catalog id, else adopt the pre-catalog slug
  let subject = await prisma.subject.findUnique({
    where: { slug: s.id },
    select: {
      id: true,
      concept: true,
      thumbnail: true,
      banner: true,
      cover: true,
      pdf: true,
    },
  })
  if (!subject) {
    for (const old of ctx.legacySubject.get(s.id) ?? []) {
      const found = await prisma.subject.findUnique({
        where: { slug: old },
        select: { id: true },
      })
      if (!found) continue
      await prisma.subject.update({
        where: { id: found.id },
        data: { slug: s.id },
      })
      console.log(`   ~ ${old} → ${s.id}`)
      stats.renamed++
      subject = await prisma.subject.findUnique({
        where: { slug: s.id },
        select: {
          id: true,
          concept: true,
          thumbnail: true,
          banner: true,
          cover: true,
          pdf: true,
        },
      })
      break
    }
  }

  const concept =
    (s.concept && CONCEPT_SET.has(s.concept) ? s.concept : null) ??
    SUBJECT_CONCEPT_BY_SLUG[s.subject] ??
    nearestConcept(s.subject)
  const totalLessons = s.chapters.reduce((n, c) => n + c.lessons.length, 0)
  const fields = {
    name: pick(s.title, cur === "sd" ? "ar" : lang),
    lang,
    // undefined = leave the column alone; the catalog only ever adds facts.
    pdf: locked("textbook.pdf") ?? subject?.pdf ?? undefined,
    description:
      (cur === "sd" ? composeSdDescription(s, grade) : s.about?.description) ??
      undefined,
    objectives: s.about?.objectives?.length ? s.about.objectives : undefined,
    prerequisites: s.about?.prerequisites ?? undefined,
    targetAudience: s.about?.audience ?? undefined,
    totalChapters: s.chapters.length,
    totalLessons,
    totalContent: totalLessons,
    status: "PUBLISHED" as const,
  }

  if (!subject) {
    const created = await prisma.subject.create({
      data: {
        ...fields,
        slug: s.id,
        department: departmentFor(cur, grade, s.subject),
        levels: [gradeToLevel(grade)],
        grades: [grade],
        gradeRange: String(grade),
        country: cfg.country,
        curriculum: cfg.code,
        curriculumId: ctx.curriculumId,
        concept,
        thumbnail:
          locked("thumbnail.jpg") ?? conceptKey(grade, concept, "thumbnail"),
        banner: locked("banner.jpg") ?? conceptKey(grade, concept, "banner"),
        cover: locked("cover.jpg") ?? `catalog/concepts/${concept}/cover`,
        sortOrder: ctx.sortOrder,
      },
      select: {
        id: true,
        concept: true,
        thumbnail: true,
        banner: true,
        cover: true,
        pdf: true,
      },
    })
    console.log(`   + ${s.id}`)
    stats.created++
    subject = created
  } else {
    // Real per-subject art (locked on the CDN) always wins; concept art only
    // fills an empty field. An authored concept is refreshed; a guess never
    // overwrites.
    await prisma.subject.update({
      where: { id: subject.id },
      data: {
        ...fields,
        concept:
          s.concept && CONCEPT_SET.has(s.concept)
            ? s.concept
            : (subject.concept ?? concept),
        thumbnail:
          locked("thumbnail.jpg") ??
          subject.thumbnail ??
          conceptKey(grade, concept, "thumbnail"),
        banner:
          locked("banner.jpg") ??
          subject.banner ??
          conceptKey(grade, concept, "banner"),
        cover:
          locked("cover.jpg") ??
          subject.cover ??
          `catalog/concepts/${concept}/cover`,
        ...(ctx.curriculumId ? { curriculumId: ctx.curriculumId } : {}),
      },
    })
  }
  stats.subjects++
  const subjectId = subject.id
  const subjectConcept =
    (s.concept && CONCEPT_SET.has(s.concept) ? s.concept : subject.concept) ??
    concept

  // ---- chapters + lessons: adopt, rename to position, archive the rest
  const legacyCh = ctx.legacyChapter.get(s.id) ?? new Map<string, string>()
  const pool =
    CONCEPT_POOL[subjectConcept ?? ""] ??
    (subjectConcept ? [subjectConcept] : [])

  const chapterIds = await prisma.$transaction(
    async (tx) => {
      // Rows archived by an earlier run keep their `archived-` slug and are
      // left alone, so re-runs converge instead of re-archiving.
      const existing = await tx.chapter.findMany({
        where: { subjectId, NOT: { slug: { startsWith: ARCHIVED } } },
        orderBy: { sequenceOrder: "asc" },
        select: {
          id: true,
          slug: true,
          lessons: {
            where: { NOT: { slug: { startsWith: ARCHIVED } } },
            select: { id: true, slug: true },
          },
        },
      })
      const target = new Map<string, (typeof existing)[number]>() // cN -> row
      const leftovers: (typeof existing)[number][] = []
      for (const row of existing) {
        const to = /^c\d+$/.test(row.slug)
          ? row.slug
          : (legacyCh.get(row.slug) ?? legacyCh.get(normalizeLegacy(row.slug)))
        if (to && !target.has(to) && s.chapters.some((c) => c.slug === to))
          target.set(to, row)
        else leftovers.push(row)
      }
      // Two-phase rename: park every live slug first so positions can move
      // freely — one statement per table, not one round trip per row.
      await tx.$executeRaw`
        UPDATE catalog_chapters SET slug = ${TMP} || id
        WHERE "subjectId" = ${subjectId} AND slug NOT LIKE ${ARCHIVED + "%"}`
      await tx.$executeRaw`
        UPDATE catalog_lessons SET slug = ${TMP} || id
        WHERE slug NOT LIKE ${ARCHIVED + "%"}
          AND "chapterId" IN (SELECT id FROM catalog_chapters WHERE "subjectId" = ${subjectId})`

      const ids = new Map<string, string>()
      for (const [ci, c] of s.chapters.entries()) {
        const chapterConcept =
          (c.concept && CONCEPT_SET.has(c.concept) ? c.concept : null) ??
          (pool.length ? pool[ci % pool.length]! : subjectConcept)
        const data = {
          name: pick(c.title, lang),
          slug: c.slug,
          lang,
          description: c.description ?? null,
          sequenceOrder: ci + 1,
          concept: chapterConcept,
          thumbnail: c.image ?? conceptKey(grade, chapterConcept, "thumbnail"),
          totalLessons: c.lessons.length,
          status: "PUBLISHED" as const,
        }
        const row = target.get(c.slug)
        const id = row
          ? (
              await tx.chapter.update({
                where: { id: row.id },
                data,
                select: { id: true },
              })
            ).id
          : (
              await tx.chapter.create({
                data: { ...data, subjectId },
                select: { id: true },
              })
            ).id
        ids.set(c.slug, id)
        stats.chapters++

        // lessons of this chapter: adopt from the adopted chapter's rows
        const legacyL =
          ctx.legacyLesson.get(`${s.id}/${c.slug}`) ?? new Map<string, string>()
        const lessonRows = row?.lessons ?? []
        const lTarget = new Map<string, { id: string }>()
        const lLeft: { id: string; slug: string }[] = []
        for (const l of lessonRows) {
          const to = /^l\d+$/.test(l.slug) ? l.slug : legacyL.get(l.slug)
          if (to && !lTarget.has(to) && c.lessons.some((x) => x.slug === to))
            lTarget.set(to, l)
          else lLeft.push(l)
        }
        for (const [li, l] of c.lessons.entries()) {
          const lessonConcept =
            (l.concept && CONCEPT_SET.has(l.concept) ? l.concept : null) ??
            chapterConcept
          const ldata = {
            name: pick(l.title, lang),
            slug: l.slug,
            lang,
            description: l.description ?? null,
            sequenceOrder: li + 1,
            concept: lessonConcept,
            thumbnail:
              l.image ??
              c.image ??
              conceptKey(grade, lessonConcept, "thumbnail"),
            objectives: l.objectives?.length ? l.objectives.join("\n") : null,
            durationMinutes: l.durationMinutes ?? null,
            status: "PUBLISHED" as const,
          }
          const hit = lTarget.get(l.slug)
          if (hit)
            await tx.lesson.update({ where: { id: hit.id }, data: ldata })
          else await tx.lesson.create({ data: { ...ldata, chapterId: id } })
          stats.lessons++
        }
        for (const l of lLeft) {
          await tx.lesson.update({
            where: { id: l.id },
            data: {
              slug: `${ARCHIVED}${l.slug}`.slice(0, 180),
              status: "ARCHIVED",
            },
          })
          stats.archivedLessons++
        }
      }
      for (const row of leftovers) {
        await tx.chapter.update({
          where: { id: row.id },
          data: {
            slug: `${ARCHIVED}${row.slug}`.slice(0, 180),
            status: "ARCHIVED",
          },
        })
        await tx.lesson.updateMany({
          where: { chapterId: row.id },
          data: { status: "ARCHIVED" },
        })
        for (const l of row.lessons)
          await tx.lesson.update({
            where: { id: l.id },
            data: { slug: `${ARCHIVED}${l.slug}`.slice(0, 180) },
          })
        stats.archivedChapters++
        stats.archivedLessons += row.lessons.length
      }
      return ids
    },
    { timeout: 120000, maxWait: 30000 }
  )

  await seedAssessments(prisma, { ...ctx, subjectId, chapterIds })
}

// ---------------------------------------------------------------- questions + exams

async function seedAssessments(
  prisma: PrismaClient,
  ctx: SubjectCtx & { subjectId: string; chapterIds: Map<string, string> }
): Promise<void> {
  const { s, dir, grade, subjectId, stats } = ctx
  const lang = s.lang

  // Every assessment file, with the scope its folder gives it.
  type Scope = { chapter?: string; lesson?: string }
  const files: { scope: Scope; folder: string }[] = [{ scope: {}, folder: dir }]
  for (const c of s.chapters) {
    files.push({ scope: { chapter: c.slug }, folder: path.join(dir, c.slug) })
    for (const l of c.lessons)
      files.push({
        scope: { chapter: c.slug, lesson: l.slug },
        folder: path.join(dir, c.slug, l.slug),
      })
  }
  const banks = files.map((f) => ({
    ...f,
    qs:
      readJson<{ questions: CQuestion[] }>(path.join(f.folder, "qbank.json"))
        ?.questions ?? [],
  }))
  const exams = files.map((f) => ({
    ...f,
    exams:
      readJson<{ exams: CExam[] }>(path.join(f.folder, "exams.json"))?.exams ??
      [],
  }))
  // No source files: skip WITHOUT deleting (a partial clone never wipes content).
  if (!banks.some((b) => b.qs.length) && !exams.some((e) => e.exams.length))
    return

  // Resolve lesson/chapter ids once.
  const tree = await prisma.chapter.findMany({
    where: { subjectId, status: "PUBLISHED" },
    select: {
      id: true,
      slug: true,
      lessons: {
        where: { status: "PUBLISHED" },
        orderBy: { sequenceOrder: "asc" },
        select: { id: true, slug: true },
      },
    },
  })
  const chapterBySlug = new Map(tree.map((c) => [c.slug, c]))
  const ids = (sc: Scope) => {
    const ch = sc.chapter ? chapterBySlug.get(sc.chapter) : undefined
    return {
      chapterId: ch?.id ?? null,
      lessonId: sc.lesson
        ? (ch?.lessons.find((l) => l.slug === sc.lesson)?.id ?? null)
        : null,
    }
  }

  // One row per question text; qbank placement first, exam-only questions at their exam's scope.
  const byText = new Map<string, { q: CQuestion; scope: Scope }>()
  for (const b of banks)
    for (const q of b.qs)
      if (!byText.has(q.question)) byText.set(q.question, { q, scope: b.scope })
  for (const e of exams)
    for (const x of e.exams)
      for (const q of x.questions ?? [])
        if (!byText.has(q.question))
          byText.set(q.question, { q, scope: e.scope })

  // Lesson practice quizzes read Question.catalogLessonId: a chapter-level
  // question is spread round-robin over that chapter's own lessons (as
  // sd-content did), never across chapters.
  const cursor = new Map<string, number>()
  const spread = (chapterId: string) => {
    const lessons = tree.find((c) => c.id === chapterId)?.lessons ?? []
    if (!lessons.length) return null
    const i = cursor.get(chapterId) ?? 0
    cursor.set(chapterId, i + 1)
    return lessons[i % lessons.length]!.id
  }

  await prisma.exam.deleteMany({ where: { subjectId } })
  await prisma.question.deleteMany({ where: { catalogSubjectId: subjectId } })

  const difficulty = grade <= 6 ? "EASY" : "MEDIUM"
  const rows: Prisma.QuestionCreateManyInput[] = []
  for (const { q, scope } of byText.values()) {
    const { chapterId, lessonId } = ids(scope)
    const type = mapType(q.type)
    rows.push({
      catalogSubjectId: subjectId,
      catalogChapterId: chapterId,
      catalogLessonId: lessonId ?? (chapterId ? spread(chapterId) : null),
      questionText: q.question,
      questionType: type,
      difficulty,
      bloomLevel: type === "SHORT_ANSWER" ? "UNDERSTAND" : "REMEMBER",
      points: 1,
      options: buildOptions(q, lang),
      sampleAnswer:
        type === "FILL_BLANK" || type === "SHORT_ANSWER"
          ? String(q.answer)
          : undefined,
      explanation: q.explanation,
      tags: [s.curriculum, s.grade, s.subject],
      approvalStatus: "APPROVED",
      visibility: "PUBLIC",
      status: "PUBLISHED",
    })
  }
  if (rows.length) await prisma.question.createMany({ data: rows })
  stats.questions += rows.length

  const created = await prisma.question.findMany({
    where: { catalogSubjectId: subjectId },
    select: { id: true, questionText: true },
  })
  const idByText = new Map(created.map((c) => [c.questionText, c.id]))

  // Two statements for all of a subject's exams: ids are minted here so the
  // question links can be written in the same batch.
  const examRows: Prisma.ExamCreateManyInput[] = []
  const links: Prisma.ExamQuestionCreateManyInput[] = []
  for (const e of exams) {
    const { chapterId, lessonId } = ids(e.scope)
    for (const x of e.exams) {
      const qids = [
        ...new Set(
          (x.questions ?? [])
            .map((q) => idByText.get(q.question))
            .filter((v): v is string => !!v)
        ),
      ]
      if (!qids.length) continue
      const id = `cat${randomUUID().replace(/-/g, "").slice(0, 22)}`
      examRows.push({
        id,
        subjectId,
        chapterId,
        lessonId,
        title: x.title,
        description: x.description ?? null,
        examType: x.type,
        durationMinutes: x.durationMinutes ?? null,
        totalMarks: x.totalMarks ? Math.round(x.totalMarks) : qids.length,
        passingMarks:
          x.passingMarks != null ? Math.round(x.passingMarks) : null,
        totalQuestions: qids.length,
        lang,
        tags: [s.curriculum, s.grade, s.subject],
        status: "PUBLISHED",
        approvalStatus: "APPROVED",
        visibility: "PUBLIC",
      })
      qids.forEach((qid, i) =>
        links.push({
          catalogExamId: id,
          catalogQuestionId: qid,
          order: i + 1,
          points: 1,
        })
      )
    }
  }
  if (examRows.length) {
    await prisma.exam.createMany({ data: examRows })
    await prisma.examQuestion.createMany({ data: links, skipDuplicates: true })
  }
  stats.exams += examRows.length
}
