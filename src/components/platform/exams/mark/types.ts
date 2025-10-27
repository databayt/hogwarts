// Auto-Marking System TypeScript Types

import type {
  QuestionBank,
  Rubric,
  RubricCriterion,
  StudentAnswer,
  MarkingResult,
  GradeOverride,
  Exam,
  Student,
  Subject,
  QuestionType,
  DifficultyLevel,
  BloomLevel,
  GradingMethod,
  SubmissionType,
  MarkingStatus,
  GeneratedExam,
  GeneratedExamQuestion,
} from "@prisma/client"

// ========== Extended Types with Relations ==========

export type QuestionBankWithRelations = QuestionBank & {
  subject: Subject
  rubric?: RubricWithCriteria | null
  examQuestions?: GeneratedExamQuestion[]
  analytics?: QuestionAnalytics | null
}

export type RubricWithCriteria = Rubric & {
  criteria: RubricCriterion[]
}

export type StudentAnswerWithRelations = StudentAnswer & {
  student: Student
  question: QuestionBank
  exam: Exam
  markingResult?: MarkingResultWithOverrides | null
}

export type MarkingResultWithOverrides = MarkingResult & {
  overrides: GradeOverride[]
  studentAnswer: StudentAnswer
  question: QuestionBank
}

export type ExamWithQuestions = Exam & {
  generatedExam?: (GeneratedExam & {
    questions: (GeneratedExamQuestion & {
      question: QuestionBank
    })[]
  }) | null
  studentAnswers?: StudentAnswer[]
  markingResults?: MarkingResult[]
}

// ========== Form Data Types ==========

export interface CreateQuestionFormData {
  subjectId: string
  questionText: string
  questionType: QuestionType
  difficulty: DifficultyLevel
  bloomLevel: BloomLevel
  points: number
  timeEstimate?: number
  options?: QuestionOption[] // For MCQ/T-F
  acceptedAnswers?: string[] // For Fill in Blank
  sampleAnswer?: string // For Short Answer/Essay
  tags?: string[]
  explanation?: string
  imageUrl?: string
}

export interface QuestionOption {
  text: string
  isCorrect: boolean
  explanation?: string
}

export interface CreateRubricFormData {
  questionId: string
  title: string
  description?: string
  criteria: RubricCriterionData[]
}

export interface RubricCriterionData {
  criterion: string
  description?: string
  maxPoints: number
  order: number
}

export interface SubmitAnswerFormData {
  examId: string
  questionId: string
  submissionType: SubmissionType
  answerText?: string
  selectedOptionIds?: string[]
  uploadUrl?: string
}

export interface GradeOverrideFormData {
  markingResultId: string
  newScore: number
  reason: string
}

// ========== Auto-Grading Types ==========

export interface AutoGradeResult {
  success: boolean
  pointsAwarded: number
  maxPoints: number
  isCorrect: boolean
  feedback?: string
  error?: string
}

export interface AIGradeResult extends AutoGradeResult {
  aiScore: number
  aiConfidence: number
  aiReasoning: string
  suggestedFeedback: string
  needsReview: boolean
}

export interface OCRProcessResult {
  success: boolean
  extractedText: string
  confidence: number
  error?: string
  processingTime?: number
}

// ========== Bulk Operations ==========

export interface BulkGradeRequest {
  examId: string
  studentIds?: string[] // If not provided, grade all students
  questionIds?: string[] // If not provided, grade all questions
  autoGradeOnly?: boolean // Only grade auto-gradable questions
}

export interface BulkGradeProgress {
  total: number
  completed: number
  failed: number
  inProgress: number
  percentage: number
}

// ========== Analytics Types ==========

export interface QuestionAnalytics {
  id: string
  questionId: string
  timesUsed: number
  avgScore: number | null
  successRate: number | null // Percentage
  avgTimeSpent: number | null
  perceivedDifficulty: DifficultyLevel | null
  lastUsed: Date | null
}

export interface ExamMarkingAnalytics {
  examId: string
  totalStudents: number
  totalQuestions: number

  // Grading Progress
  graded: number
  pending: number
  inProgress: number
  needsReview: number

  // Performance Stats
  averageScore: number
  highestScore: number
  lowestScore: number
  medianScore: number
  passingRate: number // Percentage

  // Time Stats
  avgGradingTime: number | null // In minutes
  totalGradingTime: number | null

  // By Question Type
  byQuestionType: Record<QuestionType, {
    total: number
    graded: number
    avgScore: number
  }>

  // By Grading Method
  byGradingMethod: Record<GradingMethod, {
    total: number
    completed: number
  }>
}

export interface StudentExamProgress {
  examId: string
  studentId: string
  totalQuestions: number
  answered: number
  remaining: number
  percentage: number
  estimatedTimeRemaining: number | null // In minutes
}

// ========== Display Types ==========

export interface MarkingQueueItem {
  id: string
  studentName: string
  questionText: string
  submittedAt: Date | null
  status: MarkingStatus
  gradingMethod: GradingMethod
  priority: "high" | "medium" | "low"
  estimatedTime: number | null
}

export interface GradeDistribution {
  grade: string
  count: number
  percentage: number
}

// ========== Filter Types ==========

export interface MarkingFilters {
  examId?: string
  studentId?: string
  questionType?: QuestionType
  difficulty?: DifficultyLevel
  status?: MarkingStatus
  gradingMethod?: GradingMethod
  needsReview?: boolean
  searchQuery?: string
}

export interface QuestionBankFilters {
  subjectId?: string
  questionType?: QuestionType
  difficulty?: DifficultyLevel
  bloomLevel?: BloomLevel
  tags?: string[]
  createdBy?: string
  searchQuery?: string
}

// ========== API Response Types ==========

export interface APIResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ========== Confidence Levels ==========

export type ConfidenceLevel = "high" | "medium" | "low" | "poor"

export interface ConfidenceIndicator {
  level: ConfidenceLevel
  value: number
  message: string
  color: string
}

// ========== Export Types ==========

export interface ExportMarkingData {
  examTitle: string
  className: string
  subjectName: string
  exportDate: Date
  students: {
    studentName: string
    studentId: string
    answers: {
      questionNumber: number
      questionText: string
      answer: string
      pointsAwarded: number
      maxPoints: number
      feedback: string
    }[]
    totalScore: number
    percentage: number
    grade: string
  }[]
}
