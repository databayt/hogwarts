// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Catalog Assignments Seed
 *
 * The subject page's واجبات row reads the catalog `Assignment` model
 * (`catalog_assignments`), not the school's `SchoolAssignment` rows — and the
 * catalog held none, so every subject the demo student opened showed an empty
 * section. This pass authors a small, believable set for each subject the demo
 * student takes: a homework on the first lesson, a review sheet, a project, a
 * lab report (sciences) or an essay, and a presentation — each named after the
 * real chapter or lesson it hangs off.
 *
 * Rows are platform content: PUBLISHED, APPROVED, PUBLIC, no contributing
 * school — the same gate the subject page and the community page apply.
 * `assignmentType` is lowercase because the dictionary's
 * `subjects.catalog.assignmentTypes` keys are.
 *
 * Idempotent: guarded by (catalogSubjectId, title).
 */

import type { PrismaClient } from "@prisma/client"

import { logSuccess } from "./utils"

/** Subjects with practical work — they get a lab report instead of an essay. */
const LAB_SUBJECTS = [
  "biology",
  "chemistry",
  "physics",
  "agriculture",
  "engineering",
  "computer-science",
  "family-sciences",
]

type Anchor = {
  chapterId: string
  chapterName: string
  lessonId: string | null
  lessonName: string
}

type Template = {
  type: "homework" | "project" | "lab" | "essay" | "presentation"
  /** Which chapter it hangs off, by position (wraps on short books). */
  chapter: number
  /** Anchor the assignment to the chapter's first lesson, not the chapter. */
  onLesson: boolean
  title: (a: Anchor) => string
  description: (a: Anchor) => string
  points: number
  minutes: number
}

const TEMPLATES = (lab: boolean): Template[] => [
  {
    type: "homework",
    chapter: 0,
    onLesson: true,
    title: (a) => `واجب منزلي: ${a.lessonName}`,
    description: (a) =>
      `حل أسئلة التقويم في نهاية درس «${a.lessonName}» وأظهر خطوات الحل كاملة.`,
    points: 20,
    minutes: 30,
  },
  {
    type: "homework",
    chapter: 1,
    onLesson: false,
    title: (a) => `أسئلة مراجعة: ${a.chapterName}`,
    description: (a) =>
      `أجب عن أسئلة المراجعة في آخر فصل «${a.chapterName}» واكتب ملخصًا من خمسة أسطر لأهم أفكاره.`,
    points: 25,
    minutes: 45,
  },
  {
    type: "project",
    chapter: 2,
    onLesson: false,
    title: (a) => `مشروع: ${a.chapterName}`,
    description: (a) =>
      `أعدّ مع مجموعتك ملصقًا أو نموذجًا يشرح أفكار فصل «${a.chapterName}»، مع ثلاثة مراجع على الأقل.`,
    points: 100,
    minutes: 240,
  },
  lab
    ? {
        type: "lab",
        chapter: 3,
        onLesson: true,
        title: (a) => `تقرير مختبر: ${a.lessonName}`,
        description: (a) =>
          `نفّذ نشاط درس «${a.lessonName}» ووثّق الأدوات والخطوات والملاحظات والاستنتاج في تقرير.`,
        points: 40,
        minutes: 90,
      }
    : {
        type: "essay",
        chapter: 3,
        onLesson: false,
        title: (a) => `مقال: ${a.chapterName}`,
        description: (a) =>
          `اكتب مقالًا من 400 كلمة عن فصل «${a.chapterName}» تعرض فيه رأيك مدعومًا بأمثلة من الكتاب.`,
        points: 40,
        minutes: 60,
      },
  {
    type: "presentation",
    chapter: 4,
    onLesson: true,
    title: (a) => `عرض تقديمي: ${a.lessonName}`,
    description: (a) =>
      `قدّم عرضًا من خمس دقائق يشرح درس «${a.lessonName}» لزملائك، في ست شرائح على الأكثر.`,
    points: 50,
    minutes: 120,
  },
]

export async function seedCatalogAssignments(
  prisma: PrismaClient,
  schoolId: string
): Promise<number> {
  // The well-known demo student (see ./auth.ts); local part only, so a school
  // seeded on another mail domain still resolves.
  const account = await prisma.user.findFirst({
    where: { schoolId, role: "STUDENT", email: { startsWith: "student@" } },
    select: { id: true },
  })
  if (!account) {
    logSuccess("Catalog assignments", 0, "no demo student")
    return 0
  }

  const classes = await prisma.class.findMany({
    where: {
      schoolId,
      studentClasses: { some: { student: { userId: account.id } } },
    },
    select: { subjectId: true },
  })
  const subjectIds = [...new Set(classes.map((c) => c.subjectId))]

  const subjects = await prisma.subject.findMany({
    where: { id: { in: subjectIds } },
    select: {
      id: true,
      slug: true,
      lang: true,
      chapters: {
        where: { status: "PUBLISHED" },
        orderBy: { sequenceOrder: "asc" },
        select: {
          id: true,
          name: true,
          lessons: {
            where: { status: "PUBLISHED" },
            orderBy: { sequenceOrder: "asc" },
            take: 1,
            select: { id: true, name: true },
          },
        },
      },
    },
  })

  let created = 0
  for (const subject of subjects) {
    if (subject.chapters.length === 0) continue
    const lab = LAB_SUBJECTS.some((key) => subject.slug.includes(key))

    for (const template of TEMPLATES(lab)) {
      const chapter =
        subject.chapters[template.chapter % subject.chapters.length]
      const lesson = chapter.lessons[0] ?? null
      const anchor: Anchor = {
        chapterId: chapter.id,
        chapterName: chapter.name,
        lessonId: lesson?.id ?? null,
        lessonName: lesson?.name ?? chapter.name,
      }
      const title = template.title(anchor)

      const existing = await prisma.assignment.findFirst({
        where: { catalogSubjectId: subject.id, title },
        select: { id: true },
      })
      if (existing) continue

      await prisma.assignment.create({
        data: {
          catalogSubjectId: subject.id,
          catalogChapterId: anchor.chapterId,
          catalogLessonId: template.onLesson ? anchor.lessonId : null,
          title,
          description: template.description(anchor),
          lang: subject.lang ?? "ar",
          totalPoints: template.points,
          estimatedTime: template.minutes,
          assignmentType: template.type,
          status: "PUBLISHED",
          approvalStatus: "APPROVED",
          approvedAt: new Date(),
          visibility: "PUBLIC",
        },
      })
      created++
    }
  }

  logSuccess(
    "Catalog assignments",
    created,
    `across ${subjects.length} subjects the demo student takes`
  )
  return created
}
