// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import "server-only"

import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { parseQuestionOptions } from "../mark/utils"

/** Who may open the review page — the quick-check author roles. */
const REVIEW_ROLES = ["DEVELOPER", "ADMIN", "TEACHER"]

export interface ReviewQuestion {
  id: string
  text: string
  type: string
  difficulty: string
  bloom: string
  explanation: string | null
  /** From the AI lesson-draft lane. */
  ai: boolean
  options: { text: string; isCorrect: boolean }[]
}

export interface ReviewAssessment {
  id: string
  title: string
  status: string
  duration: number
  showResults: boolean
  /** Draft, and the viewer's own (or an admin): the controls are live. */
  canEdit: boolean
  questions: ReviewQuestion[]
}

/**
 * One quick check for its review page, with the answer key — for the author
 * roles only. null for anyone else (a student, a guardian), for another
 * school's id, and for a missing one: the page answers all three with 404.
 */
export async function loadQuickReview(
  id: string
): Promise<ReviewAssessment | null> {
  const [session, { schoolId }] = await Promise.all([auth(), getTenantContext()])
  const userId = session?.user?.id
  const role = session?.user?.role
  if (!userId || !role || !schoolId || !REVIEW_ROLES.includes(role)) return null

  const assessment = await db.quickAssessment.findFirst({
    where: { id, schoolId },
    select: {
      id: true,
      title: true,
      status: true,
      duration: true,
      showResults: true,
      createdBy: true,
      questionIds: true,
    },
  })
  if (!assessment) return null

  const bank = await db.questionBank.findMany({
    where: { schoolId, id: { in: assessment.questionIds } },
    select: {
      id: true,
      questionText: true,
      questionType: true,
      difficulty: true,
      bloomLevel: true,
      explanation: true,
      options: true,
      source: true,
    },
  })
  const byId = new Map(bank.map((q) => [q.id, q]))
  const questions = assessment.questionIds.flatMap((qid): ReviewQuestion[] => {
    const q = byId.get(qid)
    if (!q) return []
    return [
      {
        id: q.id,
        text: q.questionText,
        type: String(q.questionType),
        difficulty: String(q.difficulty),
        bloom: String(q.bloomLevel),
        explanation: q.explanation,
        ai: String(q.source) === "AI",
        options: parseQuestionOptions(q.options).map((o) => ({
          text: o.text,
          isCorrect: Boolean(o.isCorrect),
        })),
      },
    ]
  })

  const isAdmin = role === "ADMIN" || role === "DEVELOPER"
  return {
    id: assessment.id,
    title: assessment.title,
    status: assessment.status,
    duration: assessment.duration,
    showResults: assessment.showResults,
    canEdit:
      assessment.status === "DRAFT" &&
      (isAdmin || assessment.createdBy === userId),
    questions,
  }
}
