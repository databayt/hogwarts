// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The ONE definition of a lesson's practice quiz.
 *
 * Two surfaces need the same set of questions: `getLessonContent` (what the
 * lesson player renders) and `submitLessonQuiz` (what the server grades and
 * writes to the gradebook). They used to build that set independently and
 * disagreed on every axis — the render side took 10 questions with a
 * visibility gate, an `orderBy` and the per-school `hideQuiz` check; the grade
 * side took 20 with none of them. A student answered the 10 they saw and was
 * scored out of up to 20, and the missing gate let another school's questions
 * into the denominator. Same discipline as `shared/url-validators.ts`: one
 * module, imported by both sides, so they cannot drift.
 *
 * NOT a "use server" module — these are plain helpers imported by a server
 * component's fetcher and by a server action. A directive here would compile
 * each export into a browser-reachable POST stub.
 */
import { db } from "@/lib/db"

/** Practice quizzes are short on purpose; both sides read the same cap. */
export const LESSON_QUIZ_LIMIT = 10

/**
 * How many candidates to pull per wanted question. The answer key lives in a
 * JSON column, so key-less rows can only be dropped after the query — this is
 * the slack that keeps a quiz full when some are.
 */
const ANSWER_KEY_OVERFETCH = 3

/**
 * The only question types this quiz can auto-grade AND render an input for.
 * SHORT_ANSWER/ESSAY/MATCHING are excluded at the query, not hidden in the UI:
 * they used to render as a bare stem with no way to answer and were silently
 * dropped by the grader.
 */
export const GRADEABLE_QUESTION_TYPES = [
  "MULTIPLE_CHOICE",
  "TRUE_FALSE",
  "FILL_BLANK",
] as const

/** MULTIPLE_CHOICE / TRUE_FALSE store `[{ text, isCorrect }]`. */
interface ChoiceOption {
  text?: string
  /**
   * The generated demo filler (`prisma/seeds/catalog/content.ts`) writes
   * `label` where the verified curriculum writes `text`. Read both here, once,
   * so no client ever has to know.
   */
  label?: string
  isCorrect?: boolean
}

/** FILL_BLANK stores `{ acceptedAnswers, caseSensitive }`. */
interface FillBlankOptions {
  acceptedAnswers?: string[]
  caseSensitive?: boolean
}

/** A row as stored — carries the answer key, never leaves the server. */
export interface LessonQuizRow {
  id: string
  questionText: string
  questionType: string
  options: unknown
  sampleAnswer: string | null
  explanation: string | null
}

/**
 * What the browser is allowed to see BEFORE answering. Deliberately has no
 * `isCorrect`, no `acceptedAnswers` and no `sampleAnswer`: the score reaches
 * the gradebook and report cards, so shipping the answer key alongside the
 * question made every quiz self-scoring for anyone who opened devtools.
 */
export interface LessonQuizQuestion {
  id: string
  questionText: string
  questionType: string
  /**
   * Choice labels in the SAME index order the server grades on — the client
   * answers with an index, never with text. `null` means free-text input
   * (FILL_BLANK).
   */
  choices: string[] | null
}

/** Per-question verdict, returned only in the graded response. */
export interface LessonQuizVerdict {
  questionId: string
  isCorrect: boolean
  /** Index of the correct choice, for the post-submit reveal. */
  correctIndex: number | null
  /** Accepted answers for a free-text question, for the post-submit reveal. */
  correctAnswers: string[] | null
  explanation: string | null
  sampleAnswer: string | null
}

/** The graded response the lesson player renders. */
export interface LessonQuizResult {
  score: number
  total: number
  percentage: number
  /** Per-question verdict + the correct answer, revealed only after grading. */
  verdicts: LessonQuizVerdict[]
  /**
   * True when this attempt was written to the gradebook. Only the FIRST
   * attempt counts — see the write in `submitLessonQuiz`.
   */
  recorded: boolean
}

export interface LessonQuizAnswer {
  questionId: string
  selectedOptionIndex?: number
  answerText?: string
}

/**
 * Does this row carry a usable answer key?
 *
 * Not academic. The verified SD curriculum stores FILL_BLANK questions with
 * `options: null` — no `acceptedAnswers` at all — so they are unanswerable by
 * construction: every student gets them wrong forever. A choice question with
 * no option flagged `isCorrect` is the same thing. Counting either toward the
 * denominator silently caps a lesson's whole cohort (the sd-g12-commerce
 * "Consolidation" lesson would top out at 70%), and the score reaches report
 * cards. They are dropped from the SET, not just from the grading, so the
 * student is never asked to answer something that cannot be right.
 */
function hasAnswerKey(row: LessonQuizRow): boolean {
  if (row.questionType === "FILL_BLANK") {
    const opts = (row.options ?? null) as FillBlankOptions | null
    return (
      Array.isArray(opts?.acceptedAnswers) &&
      opts.acceptedAnswers.some((a) => typeof a === "string" && a.trim() !== "")
    )
  }
  const opts = Array.isArray(row.options) ? (row.options as ChoiceOption[]) : []
  return opts.length > 0 && opts.some((o) => o?.isCorrect === true)
}

/**
 * Load a lesson's practice quiz.
 *
 * Gates, in order: the school's per-lesson `hideQuiz` override, then approved +
 * published questions that are either PUBLIC or contributed by this school,
 * then — in JS, because the answer key lives in a JSON column — anything with
 * no usable key. Ordering carries an `id` tiebreaker: bulk-seeded questions
 * share a `createdAt` to the millisecond, and without it the render and the
 * grade could take two different 10.
 *
 * The over-fetch exists so dropping key-less rows still fills a quiz. Both
 * callers run THIS function, so whatever it returns is what gets rendered AND
 * what gets graded — the multiplier can change without either side drifting.
 */
export async function fetchLessonQuizQuestions(
  catalogLessonId: string,
  schoolId: string | null
): Promise<LessonQuizRow[]> {
  if (schoolId) {
    const quizHidden = await db.contentOverride.findFirst({
      where: { schoolId, catalogLessonId, hideQuiz: true },
      select: { id: true },
    })
    if (quizHidden) return []
  }

  const candidates = await db.question.findMany({
    where: {
      catalogLessonId,
      approvalStatus: "APPROVED",
      status: "PUBLISHED",
      questionType: { in: [...GRADEABLE_QUESTION_TYPES] },
      OR: [
        { visibility: "PUBLIC" },
        ...(schoolId ? [{ contributedSchoolId: schoolId }] : []),
      ],
    },
    select: {
      id: true,
      questionText: true,
      questionType: true,
      options: true,
      sampleAnswer: true,
      explanation: true,
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: LESSON_QUIZ_LIMIT * ANSWER_KEY_OVERFETCH,
  })

  return candidates.filter(hasAnswerKey).slice(0, LESSON_QUIZ_LIMIT)
}

/** Strip the answer key. Index order is preserved — grading depends on it. */
export function toClientQuestion(row: LessonQuizRow): LessonQuizQuestion {
  return {
    id: row.id,
    questionText: row.questionText,
    questionType: row.questionType,
    choices: row.questionType === "FILL_BLANK" ? null : choiceLabels(row),
  }
}

function choiceLabels(row: LessonQuizRow): string[] {
  const opts = Array.isArray(row.options) ? (row.options as ChoiceOption[]) : []
  return opts.map((opt) =>
    typeof opt === "string" ? opt : (opt?.text ?? opt?.label ?? "")
  )
}

/**
 * Grade one answer and describe the correct one.
 *
 * Every question the fetcher returned counts toward the denominator, answered
 * or not — skipping unanswered questions used to score "answered 1 of 10
 * correctly, left the rest blank" as 100%.
 */
export function gradeQuestion(
  row: LessonQuizRow,
  answer: LessonQuizAnswer | undefined
): LessonQuizVerdict {
  if (row.questionType === "FILL_BLANK") {
    const opts = (row.options ?? null) as FillBlankOptions | null
    const accepted = Array.isArray(opts?.acceptedAnswers)
      ? opts.acceptedAnswers
      : []
    const caseSensitive = opts?.caseSensitive === true
    const normalize = (v: string) =>
      caseSensitive ? v.trim() : v.trim().toLowerCase()
    const given = normalize(answer?.answerText ?? "")
    const isCorrect =
      given.length > 0 && accepted.some((a) => normalize(a) === given)

    return {
      questionId: row.id,
      isCorrect,
      correctIndex: null,
      correctAnswers: accepted.length > 0 ? accepted : null,
      explanation: row.explanation,
      sampleAnswer: row.sampleAnswer,
    }
  }

  const opts = Array.isArray(row.options) ? (row.options as ChoiceOption[]) : []
  const correctIndex = opts.findIndex((opt) => opt?.isCorrect === true)
  const idx = answer?.selectedOptionIndex

  return {
    questionId: row.id,
    isCorrect:
      idx !== undefined &&
      idx >= 0 &&
      idx < opts.length &&
      opts[idx]?.isCorrect === true,
    correctIndex: correctIndex >= 0 ? correctIndex : null,
    correctAnswers: null,
    explanation: row.explanation,
    sampleAnswer: row.sampleAnswer,
  }
}
