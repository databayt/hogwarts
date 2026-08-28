// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { QuestionType } from "@prisma/client"

import { db } from "@/lib/db"

import {
  formatDate,
  getResolverSchool,
  toLabelledOptions,
  type ResolverCtx,
} from "./util"

/**
 * EXAM_PAPER resolver — a `GeneratedExam` id → exam metadata plus two ways to
 * lay out the body:
 *
 * - `{{#questions}}…{{/questions}}` — one flat, continuously numbered list.
 * - `{{#sections}}…{{/sections}}` — the same questions grouped by type, which
 *   is how a real school paper reads ("Section 1: Multiple choice"). Each
 *   section carries its own mark total, and its questions keep the paper-wide
 *   `order` alongside a within-section number.
 *
 * `order` is the position on the PRINTED page, not the exam-wide order the
 * questions were selected in — those differ whenever selection order disagrees
 * with the pedagogical section order, which is the normal case. Both layouts
 * therefore read the questions in the same sequence and number them
 * identically; the persisted `GeneratedExamQuestion.order` (what the answer key
 * and the online session are keyed on) is untouched.
 *
 * Both are always present; a template uses whichever it needs and the unused
 * one costs nothing. Loop tags take the configured `{{ }}` delimiters — a
 * single-brace `{#questions}` is NOT recognized and prints literally.
 */

/** Section order on a paper: objective types first, written answers last. */
const SECTION_ORDER: QuestionType[] = [
  QuestionType.MULTIPLE_CHOICE,
  QuestionType.MULTI_SELECT,
  QuestionType.TRUE_FALSE,
  QuestionType.FILL_BLANK,
  QuestionType.MATCHING,
  QuestionType.ORDERING,
  QuestionType.SHORT_ANSWER,
  QuestionType.ESSAY,
]

const TYPE_LABELS: Record<QuestionType, { en: string; ar: string }> = {
  MULTIPLE_CHOICE: { en: "Multiple choice", ar: "اختيار من متعدد" },
  MULTI_SELECT: { en: "Select all that apply", ar: "اختيار متعدد الإجابات" },
  TRUE_FALSE: { en: "True or false", ar: "صواب أو خطأ" },
  FILL_BLANK: { en: "Fill in the blank", ar: "أكمل الفراغ" },
  MATCHING: { en: "Matching", ar: "توصيل" },
  ORDERING: { en: "Put in order", ar: "رتّب" },
  SHORT_ANSWER: { en: "Short answer", ar: "إجابة قصيرة" },
  ESSAY: { en: "Essay", ar: "مقال" },
}

/** Ruled writing space to reserve under a written-answer question. */
const ANSWER_LINES: Partial<Record<QuestionType, number>> = {
  SHORT_ANSWER: 3,
  ESSAY: 8,
  FILL_BLANK: 1,
}

/** One question as the template sees it. */
interface PaperQuestion {
  order: number
  numberInSection: number
  text: string
  marks: number | string
  type: string
  typeLabel: string
  isMcq: boolean
  hasOptions: boolean
  options: Array<{ label: string; text: string }>
  /** `[{n:1},{n:2},…]` — loop it to draw blank answer lines. */
  answerLines: Array<{ n: number }>
}

export async function resolveExamPaperData(
  generatedExamId: string,
  ctx: ResolverCtx
): Promise<Record<string, unknown>> {
  const gen = await db.generatedExam.findFirst({
    where: { id: generatedExamId, schoolId: ctx.schoolId },
    select: {
      exam: {
        select: {
          title: true,
          examDate: true,
          duration: true,
          totalMarks: true,
          startTime: true,
          endTime: true,
          instructions: true,
          subject: { select: { name: true } },
          class: { select: { name: true } },
        },
      },
      questions: {
        orderBy: { order: "asc" },
        select: {
          order: true,
          points: true,
          question: {
            select: {
              questionText: true,
              options: true,
              questionType: true,
            },
          },
        },
      },
    },
  })
  if (!gen) throw new Error("Generated exam not found")

  const school = await getResolverSchool(ctx.schoolId)

  const label = (t: QuestionType) =>
    TYPE_LABELS[t]?.[ctx.lang] ?? String(t).replace(/_/g, " ")

  const questions: PaperQuestion[] = gen.questions.map((q, i) => {
    const type = q.question.questionType
    const options = toLabelledOptions(q.question.options)
    return {
      order: q.order ?? i + 1,
      // Overwritten per section below; meaningful only inside `sections`.
      numberInSection: i + 1,
      text: q.question.questionText,
      marks: q.points == null ? "" : Number(q.points),
      type,
      typeLabel: label(type),
      isMcq:
        type === QuestionType.MULTIPLE_CHOICE ||
        type === QuestionType.MULTI_SELECT,
      hasOptions: options.length > 0,
      options,
      answerLines: Array.from({ length: ANSWER_LINES[type] ?? 0 }, (_, n) => ({
        n: n + 1,
      })),
    }
  })

  // Group into sections. This regrouping — not the order questions were
  // selected in — is the order the paper READS in, so it also decides the
  // printed numbers below.
  const byType = new Map<string, PaperQuestion[]>()
  for (const q of questions) {
    const bucket = byType.get(q.type)
    if (bucket) bucket.push(q)
    else byType.set(q.type, [q])
  }
  const orderedTypes = [
    ...SECTION_ORDER.filter((t) => byType.has(t)),
    // Any type not in the canonical order still gets a section rather than
    // vanishing from the paper.
    ...[...byType.keys()].filter(
      (t) => !SECTION_ORDER.includes(t as QuestionType)
    ),
  ]

  // Number by position on the page, continuously across sections. Selection
  // order walks the distribution object's keys, so it routinely disagrees with
  // SECTION_ORDER — leaving `order` alone printed papers reading
  // "4. 5. 6. 7. 8." followed by "1. 2. 3.".
  let printed = 0
  const sections = orderedTypes.map((type, i) => {
    const items = byType.get(type) ?? []
    return {
      number: i + 1,
      type,
      title: label(type as QuestionType),
      count: items.length,
      marks: items.reduce((sum, q) => sum + (Number(q.marks) || 0), 0),
      questions: items.map((q, n) => ({
        ...q,
        order: ++printed,
        numberInSection: n + 1,
      })),
    }
  })

  // The flat list is the sections flattened, so `{{#questions}}` and
  // `{{#sections}}` present the same questions in the same sequence with the
  // same numbers — which is what "both layouts number identically" requires.
  const orderedQuestions = sections.flatMap((s) => s.questions)

  return {
    examTitle: gen.exam?.title ?? "",
    subject: gen.exam?.subject?.name ?? "",
    className: gen.exam?.class?.name ?? "",
    duration: gen.exam?.duration ?? "",
    totalMarks: gen.exam?.totalMarks ? Number(gen.exam.totalMarks) : "",
    startTime: gen.exam?.startTime ?? "",
    endTime: gen.exam?.endTime ?? "",
    instructions: gen.exam?.instructions ?? "",
    date: formatDate(gen.exam?.examDate ?? null, ctx.lang),
    schoolName: school?.name ?? "",
    schoolNameEn: school?.nameEn ?? school?.name ?? "",
    schoolLogo: school?.logoUrl ?? "",
    questionCount: orderedQuestions.length,
    sectionCount: sections.length,
    questions: orderedQuestions,
    sections,
  }
}
