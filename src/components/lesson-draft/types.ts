// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Shared types for the lesson-draft block. No server-only imports here: the
 * client button reads the same error codes the server throws.
 */

export const LESSON_DRAFT_ERRORS = [
  "LESSON_DRAFT_DISABLED",
  "LESSON_DRAFT_CAP",
  "LESSON_DRAFT_TEACHER_LIMIT",
  "LESSON_DRAFT_NO_LESSON",
  "LESSON_DRAFT_NO_TEXT",
  "LESSON_DRAFT_INCOMPLETE",
  "LESSON_DRAFT_TIMEOUT",
  // The repo's existing codes this block also returns (src/lib/action-errors.ts)
  "NOT_AUTHENTICATED",
  "MISSING_SCHOOL",
  "UNAUTHORIZED",
  "NOT_FOUND",
  "VALIDATION_ERROR",
  "UNKNOWN",
] as const

export type LessonDraftErrorCode = (typeof LESSON_DRAFT_ERRORS)[number]

export class LessonDraftError extends Error {
  constructor(readonly code: LessonDraftErrorCode) {
    super(code)
    this.name = "LessonDraftError"
  }
}

/**
 * Who may ask for a draft — the quick-check AUTHOR_ROLES
 * (exams/quick/actions/index.ts, a "use server" file that cannot export it).
 */
export const DRAFT_AUTHOR_ROLES: readonly string[] = [
  "DEVELOPER",
  "ADMIN",
  "TEACHER",
]

export type DraftStage = "reading" | "writing" | "saving"

export interface DraftActor {
  userId: string
  role: string
  schoolId: string
}

export interface DraftInput {
  /** The live class the drafts are for. */
  sessionId?: string
  /** Defaults to the class's saved lesson. */
  lessonId?: string
  /** 40–500 chars: used only when the book has no text for the lesson. */
  topic?: string
  /** A DRAFT homework row to fill in (the wizard's), instead of creating one. */
  assignmentId?: string
  /** Delete the class's existing drafts and write new ones. */
  replace?: boolean
  /** Homework only: no quick check, no questions (the wizard). */
  homeworkOnly?: boolean
}

export interface DraftResult {
  /** null in homework-only mode. */
  quickAssessmentId: string | null
  assignmentId: string
  /** The class already had drafts and `replace` was not set. */
  existing?: boolean
}

export type QuestionType = "MULTIPLE_CHOICE" | "TRUE_FALSE"
export type Difficulty = "EASY" | "MEDIUM" | "HARD"
export type Bloom = "REMEMBER" | "UNDERSTAND" | "APPLY" | "ANALYZE"

export interface DraftOption {
  text: string
  isCorrect: boolean
}

export interface DraftQuestion {
  type: QuestionType
  text: string
  options: DraftOption[]
  explanation: string
  difficulty: Difficulty
  bloom: Bloom
}

export interface DraftHomework {
  title: string
  instructions: string
  /** 1..20 */
  points: number
  /** 1..7 */
  dueInDays: number
}

export interface ValidDraft {
  lang: "ar" | "en"
  questions: DraftQuestion[]
  homework: DraftHomework
  /** Questions the validator threw away. */
  dropped: number
}
