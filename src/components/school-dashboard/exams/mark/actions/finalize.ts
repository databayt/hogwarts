"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Close the exam loop: submit → auto-mark → result → grade → notify.
 *
 * Runs objective auto-marking (and optionally AI subjective grading), then
 * aggregates each student's MarkingResult into an ExamResult AND a unified
 * gradebook Result, and (when publishing) notifies students. This is the single
 * "make it count" entry point used by the mark screen and by instant grading
 * on submit for fully-objective exams.
 */
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { ACTION_ERRORS } from "@/lib/action-errors"
import { db } from "@/lib/db"
import { dispatchNotification } from "@/lib/dispatch-notification"
import {
  getGradeBoundaries,
  upsertExamResult,
  upsertGradebookResult,
} from "@/components/school-dashboard/grades/lib/gradebook"

import { batchAIGrade } from "./ai-grade"
import {
  autoGradeWithKey,
  batchAutoGradeWithKey,
  getOrCreateAnswerKey,
} from "./auto-mark-with-key"
import type { ActionResponse } from "./types"

const OBJECTIVE_TYPES = ["MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_BLANK"] as const

export interface FinalizeResult {
  studentsGraded: number
  objectiveGraded: number
  objectiveFailed: number
  totalMarks: number
  published: boolean
}

export interface FinalizeOptions {
  /** Mark results as published and notify students. */
  publish?: boolean
  /** Also run AI grading for ESSAY/SHORT_ANSWER before aggregating. */
  aiGradeSubjective?: boolean
  /** Suppress notifications even when publishing. */
  silent?: boolean
}

export async function finalizeExamResults(
  examId: string,
  opts: FinalizeOptions = {}
): Promise<ActionResponse<FinalizeResult>> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId
    const userId = session?.user?.id
    if (!schoolId || !userId) {
      return {
        success: false,
        error: ACTION_ERRORS.UNAUTHORIZED,
        code: "UNAUTHORIZED",
      }
    }

    const exam = await db.schoolExam.findFirst({
      where: { id: examId, schoolId },
      select: {
        id: true,
        title: true,
        classId: true,
        subjectId: true,
        totalMarks: true,
        school: { select: { preferredLanguage: true } },
        generatedExam: {
          select: {
            id: true,
            questions: { select: { points: true } },
          },
        },
      },
    })
    if (!exam) {
      return {
        success: false,
        error: ACTION_ERRORS.NOT_FOUND,
        code: "NOT_FOUND",
      }
    }

    const generatedExamId = exam.generatedExam?.id

    // 1. Auto-grade objective questions (MCQ / TF / FILL) via the answer key.
    let objectiveGraded = 0
    let objectiveFailed = 0
    const objective = await batchAutoGradeWithKey(examId, generatedExamId)
    if (objective.success && objective.data) {
      objectiveGraded = objective.data.graded
      objectiveFailed = objective.data.failed
    }

    // 2. Optionally AI-grade subjective questions before aggregating.
    if (opts.aiGradeSubjective) {
      try {
        await batchAIGrade(examId)
      } catch (err) {
        console.error("[finalizeExamResults] AI grading error:", err)
      }
    }

    // 3. Paper total = sum of generated-question points (full paper), so an
    //    ungraded subjective question simply scores 0 until it is graded.
    const paperTotal =
      exam.generatedExam?.questions.reduce(
        (sum, q) => sum + Number(q.points),
        0
      ) ?? 0
    const totalMarks = paperTotal > 0 ? paperTotal : exam.totalMarks

    // 4. Aggregate per-student awarded points.
    const marking = await db.markingResult.findMany({
      where: { schoolId, examId },
      select: { studentId: true, pointsAwarded: true },
    })
    const awardedByStudent = new Map<string, number>()
    for (const m of marking) {
      awardedByStudent.set(
        m.studentId,
        (awardedByStudent.get(m.studentId) ?? 0) + Number(m.pointsAwarded)
      )
    }

    // Include everyone who answered (even if all their answers are ungraded).
    const answered = await db.studentAnswer.findMany({
      where: { schoolId, examId },
      distinct: ["studentId"],
      select: { studentId: true },
    })
    const studentIds = new Set<string>([
      ...awardedByStudent.keys(),
      ...answered.map((a) => a.studentId),
    ])

    const boundaries = await getGradeBoundaries(schoolId)

    let studentsGraded = 0
    for (const studentId of studentIds) {
      const marksObtained = Math.round(awardedByStudent.get(studentId) ?? 0)
      await upsertExamResult({
        schoolId,
        examId,
        studentId,
        marksObtained,
        totalMarks,
        boundaries,
      })
      await upsertGradebookResult({
        schoolId,
        studentId,
        classId: exam.classId,
        subjectId: exam.subjectId,
        examId,
        score: marksObtained,
        maxScore: totalMarks,
        title: exam.title,
        gradedBy: userId,
        boundaries,
      })
      studentsGraded++
    }

    // 5. Notify students when publishing.
    if (opts.publish && !opts.silent && studentIds.size > 0) {
      await notifyResultsPublished(
        schoolId,
        examId,
        exam.title,
        Array.from(studentIds),
        exam.school?.preferredLanguage ?? "ar"
      )
    }

    revalidatePath("/exams/mark")
    revalidatePath(`/exams/${examId}/results`)

    return {
      success: true,
      data: {
        studentsGraded,
        objectiveGraded,
        objectiveFailed,
        totalMarks,
        published: !!opts.publish,
      },
    }
  } catch (error) {
    console.error("[finalizeExamResults] error:", error)
    return {
      success: false,
      error: ACTION_ERRORS.SAVE_FAILED,
      code: "FINALIZE_FAILED",
    }
  }
}

/**
 * Instant-grade and publish a SINGLE student's submission. Called on submit for
 * fully-objective exams so the student sees their score immediately. Grades only
 * this student's answers (permission-safe to run from the student's session).
 */
export async function finalizeStudentExam(
  examId: string,
  studentId: string,
  opts: { notify?: boolean } = {}
): Promise<ActionResponse<{ marksObtained: number; totalMarks: number }>> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId
    const userId = session?.user?.id
    if (!schoolId || !userId) {
      return {
        success: false,
        error: ACTION_ERRORS.UNAUTHORIZED,
        code: "UNAUTHORIZED",
      }
    }

    const exam = await db.schoolExam.findFirst({
      where: { id: examId, schoolId },
      select: {
        id: true,
        title: true,
        classId: true,
        subjectId: true,
        totalMarks: true,
        school: { select: { preferredLanguage: true } },
        generatedExam: {
          select: { id: true, questions: { select: { points: true } } },
        },
      },
    })
    if (!exam) {
      return {
        success: false,
        error: ACTION_ERRORS.NOT_FOUND,
        code: "NOT_FOUND",
      }
    }

    const generatedExamId = exam.generatedExam?.id
    let answerKey
    if (generatedExamId) {
      const key = await getOrCreateAnswerKey(generatedExamId)
      if (key.success) answerKey = key.data
    }

    const answers = await db.studentAnswer.findMany({
      where: {
        schoolId,
        examId,
        studentId,
        question: { questionType: { in: [...OBJECTIVE_TYPES] } },
      },
      select: { id: true },
    })
    for (const a of answers) {
      try {
        await autoGradeWithKey(a.id, answerKey)
      } catch (err) {
        console.error("[finalizeStudentExam] grade error:", err)
      }
    }

    const marking = await db.markingResult.findMany({
      where: { schoolId, examId, studentId },
      select: { pointsAwarded: true },
    })
    const marksObtained = Math.round(
      marking.reduce((sum, m) => sum + Number(m.pointsAwarded), 0)
    )
    const paperTotal =
      exam.generatedExam?.questions.reduce(
        (sum, q) => sum + Number(q.points),
        0
      ) ?? 0
    const totalMarks = paperTotal > 0 ? paperTotal : exam.totalMarks

    const boundaries = await getGradeBoundaries(schoolId)
    await upsertExamResult({
      schoolId,
      examId,
      studentId,
      marksObtained,
      totalMarks,
      boundaries,
    })
    await upsertGradebookResult({
      schoolId,
      studentId,
      classId: exam.classId,
      subjectId: exam.subjectId,
      examId,
      score: marksObtained,
      maxScore: totalMarks,
      title: exam.title,
      gradedBy: userId,
      boundaries,
    })

    if (opts.notify) {
      await notifyResultsPublished(
        schoolId,
        examId,
        exam.title,
        [studentId],
        exam.school?.preferredLanguage ?? "ar"
      )
    }

    return { success: true, data: { marksObtained, totalMarks } }
  } catch (error) {
    console.error("[finalizeStudentExam] error:", error)
    return {
      success: false,
      error: ACTION_ERRORS.SAVE_FAILED,
      code: "FINALIZE_FAILED",
    }
  }
}

async function notifyResultsPublished(
  schoolId: string,
  examId: string,
  examTitle: string,
  studentIds: string[],
  lang: string
): Promise<void> {
  const students = await db.student.findMany({
    where: { schoolId, id: { in: studentIds } },
    select: { id: true, userId: true },
  })

  const title =
    lang === "ar" ? "تم نشر نتيجة الاختبار" : "Exam results published"
  const body =
    lang === "ar"
      ? `نتيجة "${examTitle}" أصبحت متاحة الآن`
      : `Your result for "${examTitle}" is now available`

  await Promise.all(
    students
      .filter((s) => s.userId)
      .map((s) =>
        dispatchNotification({
          schoolId,
          userId: s.userId!,
          type: "grade_posted",
          title,
          body,
          lang,
          priority: "normal",
          channels: ["in_app", "email"],
          metadata: {
            entityType: "exam",
            entityId: examId,
            url: `/exams/${examId}/results`,
          },
        }).catch((err) =>
          console.error("[notifyResultsPublished] dispatch error:", err)
        )
      )
  )
}
