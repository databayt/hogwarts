// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Publish question banks and lesson quizzes to the catalog CDN.
 *
 *   catalog/<cur>/<grade>/<subjectDir>/qbank.json                       subject
 *   catalog/<cur>/<grade>/<subjectDir>/<chapterSlug>/qbank.json         chapter
 *   catalog/<cur>/<grade>/<subjectDir>/<chapterSlug>/<lessonSlug>/quiz.json   lesson
 *
 * Postgres is the source for ALL THREE levels. The authored
 * `curriculum/.../qbank.json` is an ingest INPUT with a different schema
 * (`question`/`answer` vs `questionText`/`sampleAnswer`/`options`) and a
 * different id space (`g12-bio-u01-l01-q001` vs the DB cuid). Publishing both
 * would put two incompatible shapes behind the same filename at different
 * levels of one tree.
 *
 * EVERY chapter and lesson gets an object, including those with no questions.
 * This is not cosmetic: the bucket withholds `s3:ListBucket`, so a missing key
 * answers **403**, not 404 — which reads like a permissions fault rather than
 * "nothing here yet". The empty envelope is identical to the populated one
 * (`count: 0`, `questions: []`), so a consumer needs no special case.
 *
 * Usage (dry run is the DEFAULT — writes require --apply):
 *
 *   npx tsx scripts/catalog/publish-qbank.ts --bucket=databayt-cdn --only=sd-g12-biology
 *   npx tsx scripts/catalog/publish-qbank.ts --bucket=databayt-cdn --only=sd-g12-biology --apply
 *
 * Flags:
 *   --bucket=<name>     REQUIRED, no default (AWS_S3_BUCKET is the uploads
 *                       bucket, not the CDN origin).
 *   --apply             actually write.
 *   --only=<slug,...>   restrict to these subjects.
 *   --concurrency=<n>   in-flight PutObject (default 24).
 */

import { createHash } from "node:crypto"

import "dotenv/config"

import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { PrismaClient } from "@prisma/client"

import manifest from "../../prisma/seeds/catalog/sd-subject-dirs.json"
import {
  catalogBase,
  catalogKey,
  type CatalogScope,
} from "../../src/components/catalog/catalog-key"

interface SubjectDirEntry extends CatalogScope {
  slug: string
  source: string
}

function argValue(flag: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`${flag}=`))
  return hit?.slice(flag.length + 1)
}

const BUCKET = argValue("--bucket")
const APPLY = process.argv.includes("--apply")
const ONLY = argValue("--only")
  ?.split(",")
  .map((s) => s.trim())
  .filter(Boolean)
const CONCURRENCY = Number(argValue("--concurrency") ?? 24)

if (!BUCKET) {
  console.error("--bucket=<name> is required")
  process.exit(1)
}

/**
 * NOT `immutable`. These objects are regenerated as questions are authored, and
 * a year-long immutable cache on a file we intend to rewrite is exactly the
 * failure scripts/upload-textbooks-all.ts:20-23 warns about. One hour also
 * matches the reader's own `next: { revalidate: 3600 }`.
 */
const CACHE_CONTROL = "public, max-age=3600"
const CONTENT_TYPE = "application/json; charset=utf-8"

const prisma = new PrismaClient()
const s3 = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      }
    : {}),
})

/**
 * The publish filter, mirroring src/components/lumos/lib/lesson-quiz.ts.
 *
 * This data goes to a PUBLIC CDN with its answer keys. `contributedSchoolId`
 * must be null: a school's contributed bank is that tenant's, and the CDN has
 * no way to scope it. Every row passes this filter today (31,862 of 31,862),
 * so it removes nothing now — it is the guard for the first contribution.
 */
const PUBLISHABLE = {
  approvalStatus: "APPROVED",
  status: "PUBLISHED",
  visibility: "PUBLIC",
  contributedSchoolId: null,
} as const

interface PublishedQuestion {
  id: string
  type: string
  text: string
  /** Raw jsonb, UNTRANSFORMED — three shapes exist in the corpus. */
  options: unknown
  sampleAnswer: string | null
  explanation: string | null
  difficulty: string
  bloomLevel: string
  points: number
  tags: string[]
}

async function pooled<T>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<void>
): Promise<void> {
  let cursor = 0
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () =>
      (async () => {
        while (cursor < items.length) await fn(items[cursor++])
      })()
    )
  )
}

interface PutTask {
  key: string
  body: string
}

/**
 * Skip when the stored object is byte-identical.
 *
 * Here ETag comparison is CORRECT, unlike the copy script: these bodies are
 * written with a single-part PutObject, and a single-part ETag is the MD5 of
 * the content. The copy script cannot do this because its sources may be
 * multipart. The asymmetry is intentional.
 */
async function needsWrite(task: PutTask): Promise<boolean> {
  try {
    const head = await s3.send(
      new HeadObjectCommand({ Bucket: BUCKET, Key: task.key })
    )
    const remote = (head.ETag ?? "").replace(/"/g, "")
    const local = createHash("md5").update(task.body, "utf8").digest("hex")
    return remote !== local
  } catch {
    return true
  }
}

async function main() {
  const all = manifest as SubjectDirEntry[]
  const entries = ONLY ? all.filter((e) => ONLY.includes(e.slug)) : all
  if (ONLY) {
    const unknown = ONLY.filter((s) => !all.some((e) => e.slug === s))
    if (unknown.length) {
      console.error(`unknown slug(s): ${unknown.join(", ")}`)
      process.exit(1)
    }
  }

  console.log(
    `\n${APPLY ? "APPLY" : "DRY RUN"} — bucket=${BUCKET} subjects=${entries.length}\n`
  )

  let totals = { objects: 0, written: 0, unchanged: 0, questions: 0, empty: 0 }

  for (const entry of entries) {
    const subject = await prisma.subject.findUnique({
      where: { slug: entry.slug },
      select: { id: true, slug: true, name: true, lang: true },
    })
    if (!subject) {
      console.log(`  SKIP     ${entry.slug.padEnd(30)} no DB row`)
      continue
    }

    // One batch per subject — never one query per lesson.
    const chapters = await prisma.chapter.findMany({
      where: { subjectId: subject.id },
      select: {
        id: true,
        slug: true,
        name: true,
        sequenceOrder: true,
        lessons: {
          select: { id: true, slug: true, name: true, sequenceOrder: true },
          orderBy: { sequenceOrder: "asc" },
        },
      },
      orderBy: { sequenceOrder: "asc" },
    })

    const rows = await prisma.question.findMany({
      where: { catalogSubjectId: subject.id, ...PUBLISHABLE },
      select: {
        id: true,
        catalogChapterId: true,
        catalogLessonId: true,
        questionText: true,
        questionType: true,
        options: true,
        sampleAnswer: true,
        explanation: true,
        difficulty: true,
        bloomLevel: true,
        points: true,
        tags: true,
      },
      orderBy: { id: "asc" },
    })

    // A question's chapter is its own FK when set, else its lesson's chapter.
    // 15,972 rows org-wide carry a lesson with a NULL chapter FK; grouping on
    // the chapter FK alone would drop them from their chapter's bank. (Zero of
    // those are SD today — this is the guard for when US is published.)
    const lessonToChapter = new Map<string, string>()
    for (const ch of chapters)
      for (const l of ch.lessons) lessonToChapter.set(l.id, ch.id)

    const shape = (r: (typeof rows)[number]): PublishedQuestion => ({
      id: r.id,
      type: r.questionType,
      text: r.questionText,
      options: r.options ?? null,
      sampleAnswer: r.sampleAnswer,
      explanation: r.explanation,
      difficulty: r.difficulty,
      bloomLevel: r.bloomLevel,
      points: Number(r.points),
      tags: r.tags,
    })

    const byChapter = new Map<string, PublishedQuestion[]>()
    const byLesson = new Map<string, PublishedQuestion[]>()
    for (const r of rows) {
      const q = shape(r)
      const chapterId =
        r.catalogChapterId ??
        (r.catalogLessonId ? lessonToChapter.get(r.catalogLessonId) : undefined)
      if (chapterId) {
        const list = byChapter.get(chapterId) ?? []
        list.push(q)
        byChapter.set(chapterId, list)
      }
      if (r.catalogLessonId) {
        const list = byLesson.get(r.catalogLessonId) ?? []
        list.push(q)
        byLesson.set(r.catalogLessonId, list)
      }
    }

    // Deliberately NO `generatedAt`. A wall-clock stamp makes the body differ
    // on every run, so the ETag check never matches and all 5,652 objects
    // rewrite — churning the edge cache for no content change. S3's own
    // LastModified already answers "when was this written", authoritatively and
    // for free. The body stays a pure function of the data.
    const envelope = (
      schema: string,
      scope: CatalogScope & { chapterSlug?: string; lessonSlug?: string },
      extra: Record<string, unknown>,
      questions: PublishedQuestion[]
    ) =>
      `${JSON.stringify(
        {
          schema,
          scope: {
            curriculum: scope.curriculum,
            grade: scope.grade,
            subjectDir: scope.subjectDir,
            subjectSlug: subject.slug,
            ...(scope.chapterSlug ? { chapterSlug: scope.chapterSlug } : {}),
            ...(scope.lessonSlug ? { lessonSlug: scope.lessonSlug } : {}),
          },
          lang: subject.lang,
          ...extra,
          count: questions.length,
          questions,
        },
        null,
        2
      )}\n`

    const tasks: PutTask[] = [
      {
        key: catalogKey(entry, "qbank.json"),
        body: envelope(
          "catalog.qbank/1",
          entry,
          { title: subject.name },
          rows.map(shape)
        ),
      },
    ]

    for (const ch of chapters) {
      const chapterScope = { ...entry, chapterSlug: ch.slug }
      tasks.push({
        key: catalogKey(chapterScope, "qbank.json"),
        body: envelope(
          "catalog.qbank/1",
          chapterScope,
          { title: ch.name, sequenceOrder: ch.sequenceOrder },
          byChapter.get(ch.id) ?? []
        ),
      })
      for (const l of ch.lessons) {
        const lessonScope = { ...chapterScope, lessonSlug: l.slug }
        tasks.push({
          key: catalogKey(lessonScope, "quiz.json"),
          body: envelope(
            "catalog.quiz/1",
            lessonScope,
            { title: l.name, sequenceOrder: l.sequenceOrder },
            byLesson.get(l.id) ?? []
          ),
        })
      }
    }

    let written = 0
    let unchanged = 0
    await pooled(tasks, CONCURRENCY, async (task) => {
      if (!(await needsWrite(task))) {
        unchanged++
        return
      }
      if (!APPLY) {
        written++
        return
      }
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: task.key,
          Body: task.body,
          ContentType: CONTENT_TYPE,
          CacheControl: CACHE_CONTROL,
        })
      )
      written++
    })

    const emptyCount = tasks.filter((t) => t.body.includes('"count": 0')).length
    totals = {
      objects: totals.objects + tasks.length,
      written: totals.written + written,
      unchanged: totals.unchanged + unchanged,
      questions: totals.questions + rows.length,
      empty: totals.empty + emptyCount,
    }

    console.log(
      `  ok       ${entry.slug.padEnd(30)} ${catalogBase(entry).padEnd(34)} ` +
        `${chapters.length} ch / ${chapters.reduce((a, c) => a + c.lessons.length, 0)} le / ` +
        `${rows.length} q -> ${tasks.length} objects (${written} ${APPLY ? "written" : "to write"}, ${unchanged} unchanged, ${emptyCount} empty)`
    )
  }

  console.log(
    `\n${APPLY ? "APPLY" : "DRY RUN"} summary: ${totals.objects} objects · ` +
      `${totals.written} ${APPLY ? "written" : "to write"} · ${totals.unchanged} unchanged · ` +
      `${totals.questions} questions · ${totals.empty} empty-but-valid`
  )
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
