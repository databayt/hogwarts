// Auto-Marking System Configuration

import type {
  QuestionType,
  DifficultyLevel,
  BloomLevel,
  GradingMethod,
  SubmissionType,
  MarkingStatus,
} from "@prisma/client"

// Question Type Configurations
export const QUESTION_TYPES: Record<
  QuestionType,
  { label: string; description: string; icon: string; autoGradable: boolean }
> = {
  MULTIPLE_CHOICE: {
    label: "Multiple Choice",
    description: "Single or multiple correct answers from a list of options",
    icon: "CheckSquare",
    autoGradable: true,
  },
  TRUE_FALSE: {
    label: "True/False",
    description: "Binary choice question",
    icon: "ToggleLeft",
    autoGradable: true,
  },
  SHORT_ANSWER: {
    label: "Short Answer",
    description: "1-2 sentence response, AI-assisted grading",
    icon: "Type",
    autoGradable: false,
  },
  ESSAY: {
    label: "Essay",
    description: "Long-form answer with rubric-based grading",
    icon: "FileText",
    autoGradable: false,
  },
  FILL_IN_BLANK: {
    label: "Fill in the Blank",
    description: "Complete the missing words or phrases",
    icon: "Pencil",
    autoGradable: true,
  },
  MATCHING: {
    label: "Matching",
    description: "Match items from two lists",
    icon: "Link",
    autoGradable: true,
  },
}

// Difficulty Level Configurations
export const DIFFICULTY_LEVELS: Record<
  DifficultyLevel,
  { label: string; color: string; icon: string }
> = {
  EASY: {
    label: "Easy",
    color: "text-green-600",
    icon: "TrendingDown",
  },
  MEDIUM: {
    label: "Medium",
    color: "text-yellow-600",
    icon: "Minus",
  },
  HARD: {
    label: "Hard",
    color: "text-red-600",
    icon: "TrendingUp",
  },
}

// Bloom's Taxonomy Level Configurations
export const BLOOM_LEVELS: Record<
  BloomLevel,
  { label: string; description: string; level: number }
> = {
  REMEMBER: {
    label: "Remember",
    description: "Recall facts and basic concepts",
    level: 1,
  },
  UNDERSTAND: {
    label: "Understand",
    description: "Explain ideas or concepts",
    level: 2,
  },
  APPLY: {
    label: "Apply",
    description: "Use information in new situations",
    level: 3,
  },
  ANALYZE: {
    label: "Analyze",
    description: "Draw connections among ideas",
    level: 4,
  },
  EVALUATE: {
    label: "Evaluate",
    description: "Justify a stand or decision",
    level: 5,
  },
  CREATE: {
    label: "Create",
    description: "Produce new or original work",
    level: 6,
  },
}

// Grading Method Configurations
export const GRADING_METHODS: Record<
  GradingMethod,
  { label: string; description: string; icon: string }
> = {
  AUTO: {
    label: "Automatic",
    description: "Fully automated grading (MCQ, T/F, Fill Blank)",
    icon: "Zap",
  },
  AI_ASSISTED: {
    label: "AI Assisted",
    description: "AI grading with teacher review (Short Answer, Essay)",
    icon: "Brain",
  },
  MANUAL: {
    label: "Manual",
    description: "Teacher grades manually",
    icon: "User",
  },
}

// Submission Type Configurations
export const SUBMISSION_TYPES: Record<
  SubmissionType,
  { label: string; description: string; icon: string }
> = {
  DIGITAL: {
    label: "Digital",
    description: "Answered directly in platform",
    icon: "Monitor",
  },
  UPLOAD: {
    label: "Upload",
    description: "Uploaded file (PDF/image)",
    icon: "Upload",
  },
  OCR: {
    label: "OCR Processed",
    description: "Scanned and processed via OCR",
    icon: "Scan",
  },
}

// Marking Status Configurations
export const MARKING_STATUS: Record<
  MarkingStatus,
  { label: string; color: string; icon: string }
> = {
  NOT_STARTED: {
    label: "Not Started",
    color: "text-gray-500",
    icon: "Circle",
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "text-blue-500",
    icon: "Clock",
  },
  AUTO_GRADED: {
    label: "Auto-Graded",
    color: "text-purple-500",
    icon: "Zap",
  },
  AI_GRADED: {
    label: "AI Graded",
    color: "text-indigo-500",
    icon: "Brain",
  },
  REVIEWED: {
    label: "Reviewed",
    color: "text-orange-500",
    icon: "Eye",
  },
  COMPLETED: {
    label: "Completed",
    color: "text-green-500",
    icon: "CheckCircle",
  },
}

// OCR Confidence Thresholds
export const OCR_CONFIDENCE = {
  HIGH: 0.9, // > 90% confidence
  MEDIUM: 0.7, // 70-90% confidence
  LOW: 0.5, // 50-70% confidence
  POOR: 0.0, // < 50% confidence
} as const

// AI Grading Confidence Thresholds
export const AI_CONFIDENCE = {
  HIGH: 0.85, // > 85% confidence - auto-accept
  MEDIUM: 0.65, // 65-85% confidence - suggest review
  LOW: 0.4, // 40-65% confidence - require review
  POOR: 0.0, // < 40% confidence - manual grading
} as const

// File Upload Limits
export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/pdf",
  ],
  ALLOWED_EXTENSIONS: [".jpg", ".jpeg", ".png", ".webp", ".pdf"],
} as const

// Grading Configuration
export const GRADING_CONFIG = {
  PASSING_PERCENTAGE: 50, // Default passing percentage
  MAX_POINTS_PER_QUESTION: 100,
  MIN_POINTS_PER_QUESTION: 1,
  PARTIAL_CREDIT_ENABLED: true,
  ALLOW_NEGATIVE_MARKING: false,
} as const

// Export arrays for dropdowns
export const QUESTION_TYPE_OPTIONS = Object.entries(QUESTION_TYPES).map(
  ([value, config]) => ({
    value: value as QuestionType,
    label: config.label,
    description: config.description,
  })
)

export const DIFFICULTY_OPTIONS = Object.entries(DIFFICULTY_LEVELS).map(
  ([value, config]) => ({
    value: value as DifficultyLevel,
    label: config.label,
  })
)

export const BLOOM_LEVEL_OPTIONS = Object.entries(BLOOM_LEVELS).map(
  ([value, config]) => ({
    value: value as BloomLevel,
    label: config.label,
    description: config.description,
    level: config.level,
  })
)
