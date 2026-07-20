"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"
import { z } from "zod"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { autoGenerateExamQuestions } from "../exams/wizard/exam-wizard-v2/questions/auto-generate"
import { generateDocument } from "./generate"

// Same gate as the rest of the fill engine: creating exam records and pulling
// question text is a staff operation.
const MANAGER_ROLES = ["ADMIN", "DEVELOPER", "TEACHER"]

/** A generated exam that already has questions — fillable as-is. */
export interface ExamOption {
  id: string
  title: string
  subjectName: string
  className: string
  examDate: string
  questionCount: number
}

/** A question blueprint (SchoolExamTemplate) the paper can be built from. */
export interface BlueprintOption {
  id: string
  name: string
  subjectId: string
  subjectName: string
  duration: number
  totalMarks: number
}

export interface ClassOption {
  id: string
  name: string
}

type Guard =
  | { ok: false; response: ReturnType<typeof actionError> }
  | { ok: true; schoolId: string; userId: string }

async function guard(): Promise<Guard> {
  const session = await auth()
  if (!session?.user) {
    return { ok: false, response: actionError(ACTION_ERRORS.NOT_AUTHENTICATED) }
  }

  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return { ok: false, response: actionError(ACTION_ERRORS.MISSING_SCHOOL) }
  }

  const role = session.user.role
  if (!role || !MANAGER_ROLES.includes(role)) {
    return { ok: false, response: actionError(ACTION_ERRORS.UNAUTHORIZED) }
  }
  return { ok: true, schoolId, userId: session.user.id as string }
}

/** Existing generated exams that already have questions attached. */
export async function listExamOptions(): Promise<ActionResponse<ExamOption[]>> {
  const ctx = await guard()
  if (!ctx.ok) return ctx.response

  const rows = await db.generatedExam.findMany({
    where: { schoolId: ctx.schoolId, totalQuestions: { gt: 0 } },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      totalQuestions: true,
      exam: {
        select: {
          title: true,
          examDate: true,
          subject: { select: { name: true } },
          class: { select: { name: true } },
        },
      },
    },
  })

  return {
    success: true,
    data: rows.map((r) => ({
      id: r.id,
      title: r.exam.title,
      subjectName: r.exam.subject?.name ?? "",
      className: r.exam.class?.name ?? "",
      examDate: r.exam.examDate.toISOString(),
      questionCount: r.totalQuestions,
    })),
  }
}

/** Blueprints (question distributions) the school can build a paper from. */
export async function listBlueprintOptions(): Promise<
  ActionResponse<BlueprintOption[]>
> {
  const ctx = await guard()
  if (!ctx.ok) return ctx.response

  const rows = await db.schoolExamTemplate.findMany({
    where: { schoolId: ctx.schoolId, isActive: true, wizardStep: null },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      duration: true,
      totalMarks: true,
      subjectId: true,
      subject: { select: { name: true } },
    },
  })

  return {
    success: true,
    data: rows.map((r) => ({
      id: r.id,
      name: r.name,
      subjectId: r.subjectId,
      subjectName: r.subject?.name ?? "",
      duration: r.duration,
      totalMarks: Number(r.totalMarks),
    })),
  }
}

export async function listClassOptions(): Promise<
  ActionResponse<ClassOption[]>
> {
  const ctx = await guard()
  if (!ctx.ok) return ctx.response

  const rows = await db.class.findMany({
    where: { schoolId: ctx.schoolId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  })
  return { success: true, data: rows }
}

const schema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("existing"),
    documentTemplateId: z.string().min(1),
    generatedExamId: z.string().min(1),
  }),
  z.object({
    mode: z.literal("blueprint"),
    documentTemplateId: z.string().min(1),
    blueprintId: z.string().min(1),
    classId: z.string().min(1),
    title: z.string().min(1).max(200),
    examDate: z.string().min(1),
    examType: z
      .enum(["MIDTERM", "FINAL", "QUIZ", "TEST", "PRACTICAL"])
      .default("TEST"),
  }),
])

export type GenerateExamPaperInput = z.input<typeof schema>

/**
 * The coupling step: bind an uploaded `.docx` layout to the exam data that
 * fills it. Either point at an exam that already exists, or build one now from
 * a blueprint (creates SchoolExam → GeneratedExam → auto-selects questions),
 * then fill the template and stream the document back.
 */
export async function generateExamPaperFromTemplate(
  raw: GenerateExamPaperInput
): Promise<ActionResponse<{ filename: string; base64: string; mime: string }>> {
  const ctx = await guard()
  if (!ctx.ok) return ctx.response
  const { schoolId, userId } = ctx

  const parsed = schema.safeParse(raw)
  if (!parsed.success) return actionError(ACTION_ERRORS.VALIDATION_ERROR)
  const input = parsed.data

  if (input.mode === "existing") {
    // Confirm the exam belongs to this tenant before handing the id onward.
    const exists = await db.generatedExam.findFirst({
      where: { id: input.generatedExamId, schoolId },
      select: { id: true },
    })
    if (!exists) return actionError(ACTION_ERRORS.EXAM_NOT_FOUND)
    return generateDocument(input.documentTemplateId, input.generatedExamId)
  }

  const blueprint = await db.schoolExamTemplate.findFirst({
    where: { id: input.blueprintId, schoolId, isActive: true },
    select: { id: true, subjectId: true, duration: true, totalMarks: true },
  })
  if (!blueprint) return actionError(ACTION_ERRORS.TEMPLATE_NOT_FOUND)

  const klass = await db.class.findFirst({
    where: { id: input.classId, schoolId },
    select: { id: true },
  })
  if (!klass) return actionError(ACTION_ERRORS.CLASS_NOT_FOUND)

  const totalMarks = Math.round(Number(blueprint.totalMarks)) || 100

  // SchoolExam is a required parent of GeneratedExam, so the pair is created
  // together. Question selection cannot join this transaction —
  // autoGenerateExamQuestions opens its own — so the pair is rolled back by
  // hand below if selection fails, otherwise a failed generate would leave an
  // empty exam sitting on the school's schedule.
  const { examId, generatedExamId } = await db.$transaction(async (tx) => {
    const exam = await tx.schoolExam.create({
      data: {
        schoolId,
        title: input.title,
        classId: input.classId,
        subjectId: blueprint.subjectId,
        examDate: new Date(input.examDate),
        startTime: "08:00",
        endTime: "09:00",
        duration: blueprint.duration,
        totalMarks,
        passingMarks: Math.round(totalMarks * 0.5),
        examType: input.examType,
      },
      select: { id: true },
    })

    const generated = await tx.generatedExam.create({
      data: {
        schoolId,
        examId: exam.id,
        templateId: blueprint.id,
        generatedBy: userId,
      },
      select: { id: true },
    })

    return { examId: exam.id, generatedExamId: generated.id }
  })

  // Selects questions from the bank per the blueprint's distribution. Fails
  // when the bank has nothing matching the blueprint for that subject.
  const selected = await autoGenerateExamQuestions(generatedExamId)
  if (!selected.success) {
    // Deleting the exam cascades to the GeneratedExam (onDelete: Cascade).
    await db.schoolExam.deleteMany({ where: { id: examId, schoolId } })
    return { success: false, error: selected.error }
  }

  const doc = await generateDocument(input.documentTemplateId, generatedExamId)
  if (!doc.success) {
    await db.schoolExam.deleteMany({ where: { id: examId, schoolId } })
  }
  return doc
}
