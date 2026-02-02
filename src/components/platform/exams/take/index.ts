// Main components
export { ExamPlayer } from "./exam-player"
export { ProctorGuard } from "./proctor-guard"
export { ExamTimer, CompactTimer } from "./timer"
export { QuestionNav, MobileQuestionNav } from "./question-nav"

// Hooks
export { useExamSession, useProctor } from "./hooks"

// Server actions
export {
  startExamSession,
  autoSaveAnswers,
  reportSecurityFlag,
  submitExamSession,
  getExamSession,
} from "./actions"

// Types
export type {
  ExamQuestion,
  QuestionOption,
  ExistingAnswer,
  SecurityFlagEvent,
  ExamSessionData,
  ExamData,
  ExamTakingContentProps,
  AnswerState,
  SubmitAnswerPayload,
  AutoSavePayload,
  ProctorEventType,
  ProctorCallback,
} from "./types"

// Validation schemas
export {
  submitExamAnswersSchema,
  startExamSessionSchema,
  autoSaveAnswersSchema,
  reportSecurityFlagSchema,
  updateSessionActivitySchema,
} from "./validation"
