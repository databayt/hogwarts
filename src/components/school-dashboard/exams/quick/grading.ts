// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Quick-assessment grading and the student-safe question payload.
 *
 * The answer key never leaves the server: the take screen gets option texts
 * only, and correctness is worked out here from the question bank — never
 * read from what the browser sends. A choice answer is the option's index as
 * a string (what the take screen's RadioGroup submits). Open questions carry
 * no key, so they are recorded but not scored.
 */

import { parseQuestionOptions } from "../mark/utils"

export interface QuickBankQuestion {
  id: string
  questionText: string
  questionType: string
  options: unknown
}

export interface QuickTakeQuestion {
  id: string
  questionText: string
  questionType: string
  options: { text: string }[] | null
}

export interface GradedQuickResponse {
  questionId: string
  answer: unknown
  isCorrect?: boolean
}

const CHOICE_TYPES = new Set(["MULTIPLE_CHOICE", "TRUE_FALSE"])

/** Bank rows in the assessment's own order, options stripped to their text. */
export function toTakeQuestions(
  questionIds: string[],
  bank: QuickBankQuestion[]
): QuickTakeQuestion[] {
  const byId = new Map(bank.map((q) => [q.id, q]))
  return questionIds.flatMap((id) => {
    const q = byId.get(id)
    if (!q) return []
    const options = parseQuestionOptions(q.options)
    return [
      {
        id: q.id,
        questionText: q.questionText,
        questionType: q.questionType,
        options: options.length ? options.map((o) => ({ text: o.text })) : null,
      },
    ]
  })
}

/**
 * Marks each answer against the bank. Only questions of the assessment count;
 * `gradable` is how many of its questions have a key, so an unanswered choice
 * question still costs the student its point.
 */
export function gradeQuickResponses(
  questionIds: string[],
  bank: QuickBankQuestion[],
  responses: { questionId: string; answer: unknown }[]
): { graded: GradedQuickResponse[]; correct: number; gradable: number } {
  const allowed = new Set(questionIds)
  const byId = new Map(bank.map((q) => [q.id, q]))

  const graded: GradedQuickResponse[] = responses
    .filter((r) => allowed.has(r.questionId))
    .map((r) => {
      const q = byId.get(r.questionId)
      if (!q || !CHOICE_TYPES.has(q.questionType)) {
        return { questionId: r.questionId, answer: r.answer }
      }
      const options = parseQuestionOptions(q.options)
      const picked = Number.parseInt(String(r.answer), 10)
      const isCorrect = Number.isInteger(picked)
        ? options[picked]?.isCorrect === true
        : false
      return { questionId: r.questionId, answer: r.answer, isCorrect }
    })

  const gradable = questionIds.filter((id) => {
    const q = byId.get(id)
    return (
      q &&
      CHOICE_TYPES.has(q.questionType) &&
      parseQuestionOptions(q.options).some((o) => o.isCorrect)
    )
  }).length
  const correct = graded.filter((r) => r.isCorrect === true).length

  return { graded, correct, gradable }
}
