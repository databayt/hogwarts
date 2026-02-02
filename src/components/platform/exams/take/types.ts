/**
 * Type definitions for the exam taking system with proctoring
 */

import type {
  ExamStatus,
  ProctorMode,
  SecurityFlag,
  SessionStatus,
} from "@prisma/client"

// Question type for exam taking
export interface ExamQuestion {
  id: string
  questionId: string
  order: number
  points: number
  question: {
    id: string
    questionText: string
    questionType: string
    options: QuestionOption[] | null
    imageUrl: string | null
  }
}

export interface QuestionOption {
  id?: string
  text: string
  isCorrect?: boolean
  explanation?: string
}

// Existing answer from previous session
export interface ExistingAnswer {
  questionId: string
  answerText: string | null
  selectedOptionIds: string[]
}

// Security flag event
export interface SecurityFlagEvent {
  flag: SecurityFlag
  timestamp: string
  details?: string
}

// Exam session data
export interface ExamSessionData {
  id: string
  examId: string
  studentId: string
  attemptNumber: number
  status: SessionStatus
  proctorMode: ProctorMode
  startedAt: string | null
  lastActivityAt: string | null
  flagCount: number
  focusLostCount: number
  tabSwitchCount: number
  copyAttempts: number
  questionOrder: string[] | null
  optionOrders: Record<string, number[]> | null
}

// Exam data for taking
export interface ExamData {
  id: string
  title: string
  description: string | null
  duration: number
  totalMarks: number
  passingMarks: number
  instructions: string | null
  status: ExamStatus
  proctorMode: ProctorMode
  shuffleQuestions: boolean
  shuffleOptions: boolean
  maxAttempts: number
  allowLateSubmit: boolean
  lateSubmitMinutes: number
}

// Props for exam taking content
export interface ExamTakingContentProps {
  exam: ExamData
  questions: ExamQuestion[]
  existingAnswers: ExistingAnswer[]
  session: ExamSessionData | null
  dictionary: Record<string, unknown>
  locale: string
}

// Answer state
export interface AnswerState {
  answerText?: string
  selectedOptionIds?: string[]
}

// Submit answer payload
export interface SubmitAnswerPayload {
  questionId: string
  answerText?: string
  selectedOptionIds?: string[]
}

// Auto-save payload
export interface AutoSavePayload {
  sessionId: string
  answers: SubmitAnswerPayload[]
  currentQuestionIndex: number
}

// Proctor event types
export type ProctorEventType =
  | "FOCUS_LOST"
  | "FOCUS_RESTORED"
  | "TAB_SWITCH"
  | "COPY_ATTEMPT"
  | "PASTE_ATTEMPT"
  | "CONTEXT_MENU"
  | "PRINT_ATTEMPT"
  | "SCREENSHOT_ATTEMPT"
  | "DEVTOOLS_OPEN"

// Proctor callback
export type ProctorCallback = (
  event: ProctorEventType,
  details?: string
) => void
