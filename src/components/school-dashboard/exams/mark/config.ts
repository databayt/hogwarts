// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Auto-Marking System Configuration

import type {
  BloomLevel,
  DifficultyLevel,
  GradingMethod,
  MarkingStatus,
  QuestionType,
  SubmissionType,
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
  FILL_BLANK: {
    label: "Fill in the Blank",
    description: "Complete the missing words or phrases",
    icon: "Pencil",
    autoGradable: true,
  },
  MATCHING: {
    label: "Matching",
    description: "Match items from two columns",
    icon: "ArrowLeftRight",
    autoGradable: true,
  },
  ORDERING: {
    label: "Ordering",
    description: "Arrange items in the correct sequence",
    icon: "ListOrdered",
    autoGradable: true,
  },
  MULTI_SELECT: {
    label: "Multi Select",
    description: "Select all correct answers from a list",
    icon: "CheckCheck",
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
    description: "Answered directly in school-dashboard",
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

// --- Dictionary-based factory functions ---
// These accept the exams dictionary section (Record<string, any>)
// and fall back to English defaults when dictionary is not yet loaded.

type ExamsDict = Record<string, any> | undefined

export const getQuestionTypeOptionsDynamic = (d?: ExamsDict) => {
  const qt = d?.config?.questionTypes as Record<string, string> | undefined
  return [
    {
      value: "MULTIPLE_CHOICE" as QuestionType,
      label: qt?.mcq || "Multiple Choice",
      description: "Single or multiple correct answers from a list of options",
    },
    {
      value: "TRUE_FALSE" as QuestionType,
      label: qt?.trueFalse || "True/False",
      description: "Binary choice question",
    },
    {
      value: "SHORT_ANSWER" as QuestionType,
      label: qt?.shortAnswer || "Short Answer",
      description: "1-2 sentence response, AI-assisted grading",
    },
    {
      value: "ESSAY" as QuestionType,
      label: qt?.essay || "Essay",
      description: "Long-form answer with rubric-based grading",
    },
    {
      value: "FILL_BLANK" as QuestionType,
      label: qt?.fillBlank || "Fill in the Blank",
      description: "Complete the missing words or phrases",
    },
    {
      value: "MATCHING" as QuestionType,
      label: qt?.matching || "Matching",
      description: "Match items from two columns",
    },
    {
      value: "ORDERING" as QuestionType,
      label: qt?.ordering || "Ordering",
      description: "Arrange items in the correct sequence",
    },
    {
      value: "MULTI_SELECT" as QuestionType,
      label: qt?.multiSelect || "Multi Select",
      description: "Select all correct answers from a list",
    },
  ]
}

export const getDifficultyOptionsDynamic = (d?: ExamsDict) => {
  const dl = d?.config?.difficulty as Record<string, string> | undefined
  return [
    { value: "EASY" as DifficultyLevel, label: dl?.easy || "Easy" },
    { value: "MEDIUM" as DifficultyLevel, label: dl?.medium || "Medium" },
    { value: "HARD" as DifficultyLevel, label: dl?.hard || "Hard" },
  ]
}

export const getBloomLevelOptionsDynamic = (d?: ExamsDict) => {
  const bl = d?.config?.bloomLevels as Record<string, string> | undefined
  return [
    {
      value: "REMEMBER" as BloomLevel,
      label: bl?.remember || "Remember",
      level: 1,
    },
    {
      value: "UNDERSTAND" as BloomLevel,
      label: bl?.understand || "Understand",
      level: 2,
    },
    { value: "APPLY" as BloomLevel, label: bl?.apply || "Apply", level: 3 },
    {
      value: "ANALYZE" as BloomLevel,
      label: bl?.analyze || "Analyze",
      level: 4,
    },
    {
      value: "EVALUATE" as BloomLevel,
      label: bl?.evaluate || "Evaluate",
      level: 5,
    },
    { value: "CREATE" as BloomLevel, label: bl?.create || "Create", level: 6 },
  ]
}

export const getGradingMethodOptions = (d?: ExamsDict) => {
  const gm = d?.mark?.gradingMethods as Record<string, string> | undefined
  return [
    {
      value: "AUTO" as GradingMethod,
      label: gm?.auto || "Automatic",
      description: "Fully automated grading (MCQ, T/F, Fill Blank)",
      icon: "Zap",
    },
    {
      value: "AI_ASSISTED" as GradingMethod,
      label: gm?.aiAssisted || "AI Assisted",
      description: "AI grading with teacher review (Short Answer, Essay)",
      icon: "Brain",
    },
    {
      value: "MANUAL" as GradingMethod,
      label: gm?.manual || "Manual",
      description: "Teacher grades manually",
      icon: "User",
    },
  ]
}

export const getSubmissionTypeOptions = (d?: ExamsDict) => {
  const st = d?.mark?.submissionTypes as Record<string, string> | undefined
  return [
    {
      value: "DIGITAL" as SubmissionType,
      label: st?.digital || "Digital",
      description: "Answered directly in school-dashboard",
      icon: "Monitor",
    },
    {
      value: "UPLOAD" as SubmissionType,
      label: st?.upload || "Upload",
      description: "Uploaded file (PDF/image)",
      icon: "Upload",
    },
    {
      value: "OCR" as SubmissionType,
      label: st?.ocr || "OCR Processed",
      description: "Scanned and processed via OCR",
      icon: "Scan",
    },
  ]
}

export const getMarkingStatusOptions = (d?: ExamsDict) => {
  const ms = d?.mark?.markingStatuses as Record<string, string> | undefined
  return [
    {
      value: "NOT_STARTED" as MarkingStatus,
      label: ms?.notStarted || "Not Started",
      color: "text-gray-500",
      icon: "Circle",
    },
    {
      value: "IN_PROGRESS" as MarkingStatus,
      label: ms?.inProgress || "In Progress",
      color: "text-blue-500",
      icon: "Clock",
    },
    {
      value: "AUTO_GRADED" as MarkingStatus,
      label: ms?.autoGraded || "Auto-Graded",
      color: "text-purple-500",
      icon: "Zap",
    },
    {
      value: "AI_GRADED" as MarkingStatus,
      label: ms?.aiGraded || "AI Graded",
      color: "text-indigo-500",
      icon: "Brain",
    },
    {
      value: "REVIEWED" as MarkingStatus,
      label: ms?.reviewed || "Reviewed",
      color: "text-orange-500",
      icon: "Eye",
    },
    {
      value: "COMPLETED" as MarkingStatus,
      label: ms?.completed || "Completed",
      color: "text-green-500",
      icon: "CheckCircle",
    },
  ]
}

/** Get question type labels map for display */
export const getQuestionTypeLabels = (
  d?: ExamsDict
): Record<string, string> => {
  const qt = d?.config?.questionTypes as Record<string, string> | undefined
  return {
    MULTIPLE_CHOICE: qt?.mcq || "Multiple Choice",
    TRUE_FALSE: qt?.trueFalse || "True/False",
    SHORT_ANSWER: qt?.shortAnswer || "Short Answer",
    ESSAY: qt?.essay || "Essay",
    FILL_BLANK: qt?.fillBlank || "Fill in the Blank",
    MATCHING: qt?.matching || "Matching",
    ORDERING: qt?.ordering || "Ordering",
    MULTI_SELECT: qt?.multiSelect || "Multi Select",
  }
}

/** Get difficulty labels map for display */
export const getDifficultyLabels = (d?: ExamsDict): Record<string, string> => {
  const dl = d?.config?.difficulty as Record<string, string> | undefined
  return {
    EASY: dl?.easy || "Easy",
    MEDIUM: dl?.medium || "Medium",
    HARD: dl?.hard || "Hard",
  }
}

/** Get marking status labels map for display */
export const getMarkingStatusLabels = (
  d?: ExamsDict
): Record<string, string> => {
  const ms = d?.mark?.markingStatuses as Record<string, string> | undefined
  return {
    NOT_STARTED: ms?.notStarted || "Not Started",
    IN_PROGRESS: ms?.inProgress || "In Progress",
    AUTO_GRADED: ms?.autoGraded || "Auto-Graded",
    AI_GRADED: ms?.aiGraded || "AI Graded",
    REVIEWED: ms?.reviewed || "Reviewed",
    COMPLETED: ms?.completed || "Completed",
  }
}

/** Get grading method labels map for display */
export const getGradingMethodLabels = (
  d?: ExamsDict
): Record<string, string> => {
  const gm = d?.mark?.gradingMethods as Record<string, string> | undefined
  return {
    AUTO: gm?.auto || "Automatic",
    AI_ASSISTED: gm?.aiAssisted || "AI Assisted",
    MANUAL: gm?.manual || "Manual",
  }
}
