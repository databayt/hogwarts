// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { db } from "@/lib/db"

import { formatDate, toLabelledOptions, type ResolverCtx } from "./util"

/**
 * EXAM_PAPER resolver — a `GeneratedExam` id → exam metadata + a `questions`
 * loop. The school's `.docx` uses `{#questions}{order}. {text}{#options}{label})
 * {text}{/options}{/questions}` to render the paper body.
 */
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
          subject: { select: { name: true } },
          class: { select: { name: true } },
        },
      },
      questions: {
        orderBy: { order: "asc" },
        select: {
          order: true,
          points: true,
          question: { select: { questionText: true, options: true } },
        },
      },
    },
  })
  if (!gen) throw new Error("Generated exam not found")

  const school = await db.school.findUnique({
    where: { id: ctx.schoolId },
    select: { name: true, nameEn: true, logoUrl: true },
  })

  const questions = gen.questions.map((q, i) => ({
    order: q.order ?? i + 1,
    text: q.question.questionText,
    marks: q.points ?? "",
    options: toLabelledOptions(q.question.options),
  }))

  return {
    examTitle: gen.exam?.title ?? "",
    subject: gen.exam?.subject?.name ?? "",
    className: gen.exam?.class?.name ?? "",
    duration: gen.exam?.duration ?? "",
    totalMarks: gen.exam?.totalMarks ? Number(gen.exam.totalMarks) : "",
    date: formatDate(gen.exam?.examDate ?? null, ctx.lang),
    schoolName: school?.name ?? "",
    schoolNameEn: school?.nameEn ?? school?.name ?? "",
    schoolLogo: school?.logoUrl ?? "",
    questions,
  }
}
