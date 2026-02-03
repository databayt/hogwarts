import type {
  BloomLevel,
  DifficultyLevel,
  ExamTemplate,
  GeneratedExam,
  GeneratedExamQuestion,
  QuestionAnalytics,
  QuestionBank,
  QuestionSource,
  QuestionType,
} from "@prisma/client"

// ========== Question Bank Types ==========

export type QuestionBankDTO = QuestionBank & {
  subject?: {
    id: string
    subjectName: string
  } | null
  analytics?: QuestionAnalytics | null
  _count?: {
    generatedExamQuestions: number
  }
}

export type QuestionBankRow = {
  id: string
  questionText: string
  questionType: string
  difficulty: string
  bloomLevel: string
  subjectName: string
  points: number
  source: string
  timesUsed: number
  successRate: number | null
  createdAt: string
}

export type QuestionBankFormData = {
  subjectId: string
  questionText: string
  questionType: QuestionType
  difficulty: DifficultyLevel
  bloomLevel: BloomLevel
  points: number
  timeEstimate?: number
  options?: QuestionOption[]
  acceptedAnswers?: string[]
  caseSensitive?: boolean
  sampleAnswer?: string
  gradingRubric?: string
  tags: string[]
  explanation?: string
  imageUrl?: string
}

export type QuestionOption = {
  text: string
  isCorrect: boolean
  explanation?: string
}

export type QuestionBankFilters = {
  subjectId?: string
  questionType?: QuestionType
  difficulty?: DifficultyLevel
  bloomLevel?: BloomLevel
  source?: QuestionSource
  tags?: string[]
  search?: string
}

// ========== AI Generation Types ==========

export type AIGenerationFormData = {
  subjectId: string
  topic: string
  questionType: QuestionType
  difficulty: DifficultyLevel
  bloomLevel: BloomLevel
  numberOfQuestions: number
  additionalInstructions?: string
  tags: string[]
}

export type AIGeneratedQuestion = {
  questionText: string
  questionType: QuestionType
  difficulty: DifficultyLevel
  bloomLevel: BloomLevel
  points: number
  options?: QuestionOption[]
  acceptedAnswers?: string[]
  caseSensitive?: boolean
  sampleAnswer?: string
  gradingRubric?: string
  explanation?: string
}

export type AIGenerationResponse = {
  questions: AIGeneratedQuestion[]
  metadata: {
    model: string
    tokensUsed: number
    generatedAt: string
  }
}

// ========== Exam Template Types ==========

export type ExamTemplateDTO = ExamTemplate & {
  subject?: {
    id: string
    subjectName: string
  } | null
  _count?: {
    generatedExams: number
  }
}

export type ExamTemplateRow = {
  id: string
  name: string
  subjectName: string
  duration: number
  totalMarks: number
  totalQuestions: number
  isActive: boolean
  timesUsed: number
  createdAt: string
}

export type TemplateDistribution = {
  [key in QuestionType]?: {
    [key in DifficultyLevel]?: number
  }
}

export type BloomDistribution = {
  [key in BloomLevel]?: number
}

export type ExamTemplateFormData = {
  name: string
  description?: string
  subjectId: string
  duration: number
  totalMarks: number
  distribution: TemplateDistribution
  bloomDistribution?: BloomDistribution
}

export type DistributionCell = {
  questionType: QuestionType
  difficulty: DifficultyLevel
  count: number
  points: number
}

// ========== Generated Exam Types ==========

export type GeneratedExamDTO = GeneratedExam & {
  exam?: {
    id: string
    title: string
    classId: string
    subjectId: string
  } | null
  template?: {
    id: string
    name: string
  } | null
  questions: (GeneratedExamQuestion & {
    question: QuestionBankDTO
  })[]
}

export type GeneratedExamRow = {
  id: string
  examTitle: string
  templateName: string | null
  totalQuestions: number
  isRandomized: boolean
  generatedBy: string
  createdAt: string
}

export type ExamGeneratorFormData = {
  examId: string
  templateId?: string
  isRandomized: boolean
  seed?: string
  customDistribution?: TemplateDistribution
  questionIds?: string[] // For manual selection
  generationNotes?: string
}

export type ExamPreviewData = {
  totalQuestions: number
  totalMarks: number
  estimatedDuration: number
  distribution: {
    byType: Record<QuestionType, number>
    byDifficulty: Record<DifficultyLevel, number>
    byBloom: Record<BloomLevel, number>
  }
  questions: {
    id: string
    order: number
    questionText: string
    type: QuestionType
    difficulty: DifficultyLevel
    bloomLevel: BloomLevel
    points: number
  }[]
}

// ========== Analytics Types ==========

export type QuestionAnalyticsDTO = QuestionAnalytics & {
  question?: QuestionBankDTO | null
}

export type QuestionStatsData = {
  questionId: string
  questionText: string
  timesUsed: number
  avgScore: number | null
  successRate: number | null
  avgTimeSpent: number | null
  perceivedDifficulty: DifficultyLevel | null
  assignedDifficulty: DifficultyLevel
  lastUsed: Date | null
}

export type AnalyticsDashboardData = {
  totalQuestions: number
  totalTemplates: number
  totalGeneratedExams: number
  questionsByType: Record<QuestionType, number>
  questionsByDifficulty: Record<DifficultyLevel, number>
  questionsByBloom: Record<BloomLevel, number>
  questionsBySource: Record<QuestionSource, number>
  topPerformingQuestions: QuestionStatsData[]
  underperformingQuestions: QuestionStatsData[]
  recentlyAdded: QuestionBankRow[]
  mostUsedQuestions: QuestionStatsData[]
}

export type DifficultyChartData = {
  difficulty: DifficultyLevel
  assigned: number
  perceived: number
  successRate: number
}

// ========== Utility Types ==========

export type GenerationAlgorithmResult = {
  selectedQuestions: QuestionBankDTO[]
  metadata: {
    requestedCount: number
    actualCount: number
    distributionMet: boolean
    missingCategories: string[]
  }
}

export type ValidationResult = {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export type BulkImportData = {
  questions: Omit<QuestionBankFormData, "subjectId">[]
  subjectId: string
  source: QuestionSource
}

export type BulkImportResult = {
  successful: number
  failed: number
  errors: {
    row: number
    error: string
  }[]
}

// ========== UI Component Props ==========

export type QuestionFormProps = {
  initialData?: QuestionBankDTO
  subjectId?: string
  isView?: boolean
  onSuccess?: () => void
}

export type AIGenerationFormProps = {
  subjectId?: string
  onQuestionsGenerated?: (questions: AIGeneratedQuestion[]) => void
}

export type TemplateFormProps = {
  initialData?: ExamTemplateDTO
  subjectId?: string
  isView?: boolean
  onSuccess?: () => void
}

export type DistributionEditorProps = {
  distribution: TemplateDistribution
  onChange: (distribution: TemplateDistribution) => void
  totalMarks?: number
}

export type ExamPreviewProps = {
  previewData: ExamPreviewData
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

export type QuestionStatsCardProps = {
  stats: QuestionStatsData
  showActions?: boolean
}

export type DifficultyChartProps = {
  data: DifficultyChartData[]
}

// ========== Server Action Return Types ==========

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

export type CreateQuestionResult = ActionResult<{ id: string }>
export type UpdateQuestionResult = ActionResult<{ id: string }>
export type DeleteQuestionResult = ActionResult
export type GenerateQuestionsAIResult = ActionResult<AIGeneratedQuestion[]>
export type CreateTemplateResult = ActionResult<{ id: string }>
export type GenerateExamResult = ActionResult<{ generatedExamId: string }>
export type UpdateAnalyticsResult = ActionResult
