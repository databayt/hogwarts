// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Deliberately NOT "use server": these are server-only modules imported by
// server components and by the GET route handler that backs the propose
// dialog's lesson search. A directive here would compile every export into a
// browser-reachable POST stub — and a search action would then pay auth()'s
// session-cookie rotation, which makes Next ship a full RSC re-render of the
// page with every keystroke (see notifications/CLAUDE.md).
import { auth } from "@/auth"
import { Prisma } from "@prisma/client"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { getLabels } from "@/components/translation/person"
import type { Lang } from "@/components/translation/types"

const PROPOSER_ROLES = ["DEVELOPER", "ADMIN", "TEACHER"] as const

/**
 * Hard ceiling on one page of lessons. Sized so a single subject fits whole
 * (a school subject runs ~30-60 lessons), because the dialog filters that page
 * CLIENT-side: the catalog stores one language and the picker displays another,
 * so a database `contains` would match text the user cannot see. Whoever
 * restores cross-subject search must use the cache-backed bilingual `search()`
 * helper in `translation/search.ts`, not a raw `contains`.
 */
export const MAX_PROPOSABLE_RESULTS = 200

/** Most subject ids one search may narrow to (a grade's worth, with slack). */
export const MAX_PROPOSABLE_SUBJECT_IDS = 100

export type ProposableLesson = {
  id: string
  name: string
  chapterName: string
  subjectId: string
  subjectName: string
  subjectSlug: string
}

export type ProposableSubject = {
  id: string
  name: string
  slug: string
  lessonCount: number
}

export type ProposableChapter = {
  id: string
  name: string
  lessonCount: number
}

export type ProposableGrade = {
  /** AcademicGrade id for a school, `grade:<n>` for the platform catalog. */
  id: string
  /**
   * The label is DERIVED, not stored: the dialog renders
   * "Grade 01"/"الصف 01" from this number (0 = ungraded). School grade names
   * are prose ("الصف الحادي عشر") and translate inconsistently — a uniform
   * numbered label reads the same in both locales and sorts visually.
   */
  gradeNumber: number
  subjects: ProposableSubject[]
}

export type ProposableLessonSearch = {
  lessons: ProposableLesson[]
  /** True when the catalog holds more matches than this page returned. */
  hasMore: boolean
}

type SchoolSelection = {
  catalogSubjectId: string
  customName: string | null
  grade: { id: string; gradeNumber: number }
}

type ProposableScope = {
  subjectWhere: Prisma.SubjectWhereInput
  /**
   * The school's LMS-side hides (ContentOverride, isHidden rows). The bridge
   * says what the school teaches; these say what it has switched off for
   * Lumos specifically — and nobody should propose a video for content the
   * school's own LMS will never show. Empty for the platform scope.
   */
  hiddenChapterIds: string[]
  hiddenLessonIds: string[]
} & (
  | { kind: "platform" }
  | { kind: "school"; schoolId: string; selections: SchoolSelection[] }
)

/**
 * What this caller may propose videos within — or `null` when they may not
 * propose at all.
 *
 * Catalog (Lesson/Chapter/Subject) is platform-global, but school roles may
 * only propose for subjects their school has actually SELECTED (active
 * SubjectSelection). DEVELOPER (platform, no school) may enumerate everything.
 *
 * Every public entry point in this module goes through here, so the role gate
 * and the tenant scope can never drift apart between the picker and its search.
 */
async function resolveProposableScope(): Promise<ProposableScope | null> {
  const session = await auth()
  const role = session?.user?.role
  if (!session?.user?.id || !role) return null
  if (!PROPOSER_ROLES.includes(role as (typeof PROPOSER_ROLES)[number])) {
    return null
  }

  if (role === "DEVELOPER") {
    return {
      kind: "platform",
      subjectWhere: { status: "PUBLISHED" },
      hiddenChapterIds: [],
      hiddenLessonIds: [],
    }
  }

  const { schoolId } = await getTenantContext()
  if (!schoolId) return null
  // The selection rows carry the grade the school teaches each subject in —
  // the catalog seeds one Subject per grade and does NOT put the grade in the
  // name, so "Mathematics" is meaningless to a picker without its grade.
  const [selections, overrides] = await Promise.all([
    db.subjectSelection.findMany({
      where: { schoolId, isActive: true },
      select: {
        catalogSubjectId: true,
        customName: true,
        grade: { select: { id: true, gradeNumber: true } },
      },
    }),
    // Same rows get-course.ts filters the student catalog by. Video-level and
    // hideQuiz-only rows carry null chapter/lesson ids and fall out below.
    db.contentOverride.findMany({
      where: { schoolId, isHidden: true },
      select: { catalogChapterId: true, catalogLessonId: true },
    }),
  ])
  if (selections.length === 0) return null

  const hiddenChapterIds: string[] = []
  const hiddenLessonIds: string[] = []
  for (const override of overrides) {
    if (override.catalogChapterId)
      hiddenChapterIds.push(override.catalogChapterId)
    if (override.catalogLessonId) hiddenLessonIds.push(override.catalogLessonId)
  }

  return {
    kind: "school",
    schoolId,
    subjectWhere: {
      status: "PUBLISHED",
      id: { in: [...new Set(selections.map((s) => s.catalogSubjectId))] },
    },
    selections,
    hiddenChapterIds,
    hiddenLessonIds,
  }
}

/**
 * Batched name translation for whatever the picker is about to show.
 *
 * Catalog content is stored in ONE language (usually Arabic); the picker must
 * read naturally on either locale. `getLabels` is string-keyed and cached, so
 * "الرياضيات" costs one translation for all twelve grades that carry it, and a
 * provider failure falls back to the source text — never blocks. Platform
 * scope (DEVELOPER, no school) keeps raw names: that audience manages the
 * source content, and the cache is school-scoped.
 */
async function labelMap(
  scope: ProposableScope,
  lang: string | undefined,
  values: Array<string | null | undefined>
): Promise<Map<string, string>> {
  if (!lang || scope.kind !== "school") return new Map()
  const displayLang: Lang = lang === "ar" ? "ar" : "en"
  return getLabels(values, displayLang, scope.schoolId)
}

/** Lesson counts per subject, rolled up through chapters minus LMS hides. */
async function countLessonsBySubject(
  scope: ProposableScope
): Promise<Map<string, number>> {
  // Subject.totalLessons is denormalized and not maintained by every writer,
  // so count for real. One row per chapter, ids and counts only. `notIn: []`
  // matches everything, so the platform scope costs nothing extra.
  const chapters = await db.chapter.findMany({
    where: {
      subject: scope.subjectWhere,
      id: { notIn: scope.hiddenChapterIds },
    },
    select: {
      subjectId: true,
      _count: {
        select: {
          lessons: { where: { id: { notIn: scope.hiddenLessonIds } } },
        },
      },
    },
  })
  const counts = new Map<string, number>()
  for (const chapter of chapters) {
    counts.set(
      chapter.subjectId,
      (counts.get(chapter.subjectId) ?? 0) + chapter._count.lessons
    )
  }
  return counts
}

/**
 * The grade → subject tree the caller may contribute to.
 *
 * This is what the pages ship to the client. It carries subjects, never
 * lessons: a school's selections run to ~120 subjects where the lessons under
 * them run to thousands. Subjects with no lessons are dropped, and so are
 * grades left empty by that — a non-empty result always means the propose
 * dialog has something to pick, which is what gates the upload button.
 */
export async function getProposableCatalog(
  lang?: string
): Promise<ProposableGrade[]> {
  const scope = await resolveProposableScope()
  if (!scope) return []

  const [subjects, lessonCounts] = await Promise.all([
    db.subject.findMany({
      where: scope.subjectWhere,
      select: { id: true, name: true, slug: true, grades: true },
      orderBy: { name: "asc" },
    }),
    countLessonsBySubject(scope),
  ])
  const byId = new Map(subjects.map((s) => [s.id, s]))

  const grades = new Map<string, ProposableGrade>()
  const push = (
    key: string,
    grade: Omit<ProposableGrade, "subjects">,
    subject: ProposableSubject
  ) => {
    const bucket = grades.get(key)
    if (!bucket) grades.set(key, { ...grade, subjects: [subject] })
    else if (!bucket.subjects.some((s) => s.id === subject.id)) {
      bucket.subjects.push(subject)
    }
  }

  if (scope.kind === "school") {
    for (const selection of scope.selections) {
      const subject = byId.get(selection.catalogSubjectId)
      if (!subject) continue // unpublished since it was selected
      const lessonCount = lessonCounts.get(subject.id) ?? 0
      if (lessonCount === 0) continue
      // A subject can be selected several times per grade (one row per
      // academic stream) — `push` dedupes on subject id.
      push(
        selection.grade.id,
        {
          id: selection.grade.id,
          gradeNumber: selection.grade.gradeNumber,
        },
        {
          id: subject.id,
          // The school's own rename wins over the catalog name.
          name: selection.customName ?? subject.name,
          slug: subject.slug,
          lessonCount,
        }
      )
    }
  } else {
    for (const subject of subjects) {
      const lessonCount = lessonCounts.get(subject.id) ?? 0
      if (lessonCount === 0) continue
      const entry = {
        id: subject.id,
        name: subject.name,
        slug: subject.slug,
        lessonCount,
      }
      // Platform catalog has no AcademicGrade rows — bucket by the subject's
      // own grade numbers, and keep ungraded subjects reachable under 0.
      const numbers = subject.grades.length > 0 ? subject.grades : [0]
      for (const gradeNumber of numbers) {
        push(
          `grade:${gradeNumber}`,
          { id: `grade:${gradeNumber}`, gradeNumber },
          entry
        )
      }
    }
  }

  const tree = [...grades.values()]
    .map((grade) => ({
      ...grade,
      subjects: grade.subjects.sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.gradeNumber - b.gradeNumber)

  // Grade labels are numeric-derived client-side — only subject names need
  // the translation cache.
  const labels = await labelMap(
    scope,
    lang,
    tree.flatMap((grade) => grade.subjects.map((subject) => subject.name))
  )
  if (labels.size === 0) return tree
  return tree.map((grade) => ({
    ...grade,
    subjects: grade.subjects.map((subject) => ({
      ...subject,
      name: labels.get(subject.name) ?? subject.name,
    })),
  }))
}

/**
 * The chapters of one subject — the third tier of the picker.
 *
 * Fetched on demand once a subject is chosen (a school's subjects carry ~8
 * chapters each; shipping every subject's chapters up front would be the flat
 * list again, one level down). The subject is re-checked against the caller's
 * scope here, so a chapter id can only ever come from a subject they may
 * contribute to.
 */
export async function getProposableChapters(
  subjectId: string,
  lang?: string
): Promise<ProposableChapter[]> {
  const scope = await resolveProposableScope()
  if (!scope || !subjectId) return []

  const chapters = await db.chapter.findMany({
    where: {
      subjectId,
      subject: scope.subjectWhere,
      id: { notIn: scope.hiddenChapterIds },
    },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          lessons: { where: { id: { notIn: scope.hiddenLessonIds } } },
        },
      },
    },
    orderBy: { sequenceOrder: "asc" },
  })

  const visible = chapters
    .filter((c) => c._count.lessons > 0)
    .map((c) => ({ id: c.id, name: c.name, lessonCount: c._count.lessons }))

  const labels = await labelMap(
    scope,
    lang,
    visible.map((c) => c.name)
  )
  if (labels.size === 0) return visible
  return visible.map((c) => ({ ...c, name: labels.get(c.name) ?? c.name }))
}

/**
 * One bounded page of lessons the caller may propose a video for.
 *
 * `subjectIds` is intersected with the caller's own scope rather than trusted —
 * this is reachable from the browser through
 * `GET /api/stream/proposable-lessons`, so ids belonging to another school's
 * selections must come back empty.
 */
export async function searchProposableLessons({
  subjectIds,
  chapterId,
  take = MAX_PROPOSABLE_RESULTS,
  lang,
}: {
  subjectIds?: string[]
  chapterId?: string
  take?: number
  lang?: string
} = {}): Promise<ProposableLessonSearch> {
  const scope = await resolveProposableScope()
  if (!scope) return { lessons: [], hasMore: false }

  // Narrow to the requested subjects only where they survive the caller's own
  // scope. The two filters are AND-ed, never merged: spreading `{ id: ... }`
  // over the scope would OVERWRITE its `id: { in: selectedSubjectIds }` and
  // hand the caller any published subject they name.
  let subjectWhere = scope.subjectWhere
  if (subjectIds && subjectIds.length > 0) {
    const requested = subjectIds.slice(0, MAX_PROPOSABLE_SUBJECT_IDS)
    const allowed = await db.subject.findMany({
      where: { AND: [scope.subjectWhere, { id: { in: requested } }] },
      select: { id: true },
    })
    if (allowed.length === 0) return { lessons: [], hasMore: false }
    subjectWhere = {
      AND: [scope.subjectWhere, { id: { in: allowed.map((s) => s.id) } }],
    }
  }

  const pageSize = Math.min(Math.max(1, take), MAX_PROPOSABLE_RESULTS)

  // `chapterId` needs no permission probe of its own: it rides inside the same
  // `chapter` clause as the subject scope, so a chapter hanging off a subject
  // the caller can't reach simply matches nothing. The id conditions travel in
  // an AND — a requested id and the hidden-ids exclusion would clobber each
  // other as object keys, and a hidden chapter must stay unreachable even when
  // named directly.
  const where: Prisma.LessonWhereInput = {
    ...(scope.hiddenLessonIds.length > 0
      ? { id: { notIn: scope.hiddenLessonIds } }
      : {}),
    chapter: {
      subject: subjectWhere,
      AND: [
        ...(chapterId ? [{ id: chapterId }] : []),
        ...(scope.hiddenChapterIds.length > 0
          ? [{ id: { notIn: scope.hiddenChapterIds } }]
          : []),
      ],
    },
  }

  const lessons = await db.lesson.findMany({
    where,
    select: {
      id: true,
      name: true,
      chapter: {
        select: {
          name: true,
          subject: { select: { id: true, name: true, slug: true } },
        },
      },
    },
    orderBy: [
      { chapter: { subject: { name: "asc" } } },
      { chapter: { sequenceOrder: "asc" } },
      { sequenceOrder: "asc" },
    ],
    // One over the page so the dialog can say "refine your search" without a
    // second count query.
    take: pageSize + 1,
  })

  const page = lessons.slice(0, pageSize).map((l) => ({
    id: l.id,
    name: l.name,
    chapterName: l.chapter.name,
    subjectId: l.chapter.subject.id,
    subjectName: l.chapter.subject.name,
    subjectSlug: l.chapter.subject.slug,
  }))

  const labels = await labelMap(scope, lang, [
    ...page.map((l) => l.name),
    ...page.map((l) => l.chapterName),
    ...page.map((l) => l.subjectName),
  ])
  return {
    lessons:
      labels.size === 0
        ? page
        : page.map((l) => ({
            ...l,
            name: labels.get(l.name) ?? l.name,
            chapterName: labels.get(l.chapterName) ?? l.chapterName,
            subjectName: labels.get(l.subjectName) ?? l.subjectName,
          })),
    hasMore: lessons.length > pageSize,
  }
}
