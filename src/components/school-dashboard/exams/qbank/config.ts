// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import {
  BloomLevel,
  DifficultyLevel,
  QuestionSource,
  QuestionType,
} from "@prisma/client"

// Question Types Configuration
// Labels and descriptions live in the dictionary (exams.qbank.config) — use
// getQuestionTypeOptions(t) etc. below; these constants carry only values.
export const QUESTION_TYPES = [
  {
    value: QuestionType.MULTIPLE_CHOICE,
    icon: "CircleDot",
    supportsAutoGrading: true,
  },
  {
    value: QuestionType.TRUE_FALSE,
    icon: "ToggleLeft",
    supportsAutoGrading: true,
  },
  {
    value: QuestionType.FILL_BLANK,
    icon: "Type",
    supportsAutoGrading: true,
  },
  {
    value: QuestionType.SHORT_ANSWER,
    icon: "FileText",
    supportsAutoGrading: false,
  },
  {
    value: QuestionType.ESSAY,
    icon: "BookOpen",
    supportsAutoGrading: false,
  },
  {
    value: QuestionType.MATCHING,
    icon: "ArrowLeftRight",
    supportsAutoGrading: true,
  },
  {
    value: QuestionType.ORDERING,
    icon: "ListOrdered",
    supportsAutoGrading: true,
  },
  {
    value: QuestionType.MULTI_SELECT,
    icon: "CheckCheck",
    supportsAutoGrading: true,
  },
] as const

// Difficulty Levels Configuration
export const DIFFICULTY_LEVELS = [
  {
    value: DifficultyLevel.EASY,
    color: "green" as const,
    points: 1,
  },
  {
    value: DifficultyLevel.MEDIUM,
    color: "yellow" as const,
    points: 2,
  },
  {
    value: DifficultyLevel.HARD,
    color: "red" as const,
    points: 3,
  },
] as const

// Bloom's Taxonomy Levels Configuration
export const BLOOM_LEVELS = [
  {
    value: BloomLevel.REMEMBER,
    level: 1,
    color: "#E3F2FD" as const,
  },
  {
    value: BloomLevel.UNDERSTAND,
    level: 2,
    color: "#BBDEFB" as const,
  },
  {
    value: BloomLevel.APPLY,
    level: 3,
    color: "#90CAF9" as const,
  },
  {
    value: BloomLevel.ANALYZE,
    level: 4,
    color: "#64B5F6" as const,
  },
  {
    value: BloomLevel.EVALUATE,
    level: 5,
    color: "#42A5F5" as const,
  },
  {
    value: BloomLevel.CREATE,
    level: 6,
    color: "#2196F3" as const,
  },
] as const

// Question Source Configuration
export const QUESTION_SOURCES = [
  {
    value: QuestionSource.MANUAL,
    icon: "User",
  },
  {
    value: QuestionSource.AI,
    icon: "Sparkles",
  },
  {
    value: QuestionSource.IMPORTED,
    icon: "Upload",
  },
] as const

// Default Points by Difficulty
export const DEFAULT_POINTS_BY_DIFFICULTY = {
  [DifficultyLevel.EASY]: 1,
  [DifficultyLevel.MEDIUM]: 2,
  [DifficultyLevel.HARD]: 3,
} as const

// Default Points by Question Type
export const DEFAULT_POINTS_BY_TYPE = {
  [QuestionType.MULTIPLE_CHOICE]: 1,
  [QuestionType.TRUE_FALSE]: 1,
  [QuestionType.FILL_BLANK]: 2,
  [QuestionType.SHORT_ANSWER]: 3,
  [QuestionType.ESSAY]: 5,
  [QuestionType.MATCHING]: 2,
  [QuestionType.ORDERING]: 2,
  [QuestionType.MULTI_SELECT]: 1.5,
} as const

// Time Estimates (in minutes)
export const DEFAULT_TIME_ESTIMATES = {
  [QuestionType.MULTIPLE_CHOICE]: 1.5,
  [QuestionType.TRUE_FALSE]: 0.5,
  [QuestionType.FILL_BLANK]: 2,
  [QuestionType.SHORT_ANSWER]: 5,
  [QuestionType.ESSAY]: 15,
  [QuestionType.MATCHING]: 3,
  [QuestionType.ORDERING]: 2,
  [QuestionType.MULTI_SELECT]: 2,
} as const

// Template Distribution Defaults
export const DEFAULT_TEMPLATE_DISTRIBUTION = {
  [QuestionType.MULTIPLE_CHOICE]: {
    [DifficultyLevel.EASY]: 5,
    [DifficultyLevel.MEDIUM]: 3,
    [DifficultyLevel.HARD]: 2,
  },
  [QuestionType.TRUE_FALSE]: {
    [DifficultyLevel.EASY]: 3,
    [DifficultyLevel.MEDIUM]: 2,
    [DifficultyLevel.HARD]: 0,
  },
} as const

// Template Bloom Distribution Defaults
export const DEFAULT_BLOOM_DISTRIBUTION = {
  [BloomLevel.REMEMBER]: 4,
  [BloomLevel.UNDERSTAND]: 3,
  [BloomLevel.APPLY]: 2,
  [BloomLevel.ANALYZE]: 1,
  [BloomLevel.EVALUATE]: 0,
  [BloomLevel.CREATE]: 0,
} as const

// AI Generation Prompts
export const AI_GENERATION_PROMPTS = {
  contextTemplate: `You are an expert educator creating exam questions for {subject} at {level} level.

Topic: {topic}
Difficulty: {difficulty}
Bloom's Level: {bloomLevel}

Generate a {questionType} question that:
- Tests {bloomLevel} level thinking
- Is appropriate for {difficulty} difficulty
- Focuses on {topic}
- Is clear and unambiguous
{additionalInstructions}`,

  mcqFormat: `
Return the question in this exact JSON format:
{
  "questionText": "The question text here",
  "options": [
    {"text": "Option 1", "isCorrect": false, "explanation": "Why this is wrong"},
    {"text": "Option 2", "isCorrect": true, "explanation": "Why this is correct"},
    {"text": "Option 3", "isCorrect": false, "explanation": "Why this is wrong"},
    {"text": "Option 4", "isCorrect": false, "explanation": "Why this is wrong"}
  ],
  "explanation": "Detailed explanation of the concept"
}`,

  trueFalseFormat: `
Return the question in this exact JSON format:
{
  "questionText": "The statement to evaluate",
  "options": [
    {"text": "True", "isCorrect": true, "explanation": "Explanation if true"},
    {"text": "False", "isCorrect": false, "explanation": "Explanation if false"}
  ],
  "explanation": "Detailed explanation"
}`,

  fillBlankFormat: `
Return the question in this exact JSON format:
{
  "questionText": "The question with a _____ blank",
  "acceptedAnswers": ["answer1", "answer2", "synonym"],
  "caseSensitive": false,
  "explanation": "Detailed explanation"
}`,

  shortAnswerFormat: `
Return the question in this exact JSON format:
{
  "questionText": "The question here",
  "sampleAnswer": "A good sample answer showing key points",
  "gradingRubric": "Key points that should be included: 1)..., 2)..., 3)...",
  "explanation": "Detailed explanation of the concept"
}`,

  essayFormat: `
Return the question in this exact JSON format:
{
  "questionText": "The essay prompt here",
  "sampleAnswer": "A comprehensive sample answer",
  "gradingRubric": "Rubric with criteria: Structure (20%), Content (40%), Analysis (30%), Conclusion (10%)",
  "explanation": "What the essay should address"
}`,
} as const

// Exam Generation Settings
export const EXAM_GENERATION_SETTINGS = {
  minQuestionsPerExam: 1,
  maxQuestionsPerExam: 100,
  defaultDuration: 60, // minutes
  minDuration: 15,
  maxDuration: 480, // 8 hours
  allowDuplicateQuestions: false,
  defaultRandomization: false,
} as const

// Analytics Settings
export const ANALYTICS_SETTINGS = {
  minUsesForReliableStats: 3,
  successRateThresholds: {
    low: 50, // Below 50% = too hard
    high: 90, // Above 90% = too easy
  },
  perceivedDifficultyMapping: {
    [DifficultyLevel.EASY]: { min: 80, max: 100 },
    [DifficultyLevel.MEDIUM]: { min: 50, max: 79 },
    [DifficultyLevel.HARD]: { min: 0, max: 49 },
  },
} as const

// Helper Functions
export function getQuestionTypeConfig(type: QuestionType) {
  return QUESTION_TYPES.find((qt) => qt.value === type)
}

export function getDifficultyLevelConfig(difficulty: DifficultyLevel) {
  return DIFFICULTY_LEVELS.find((dl) => dl.value === difficulty)
}

export function getBloomLevelConfig(bloomLevel: BloomLevel) {
  return BLOOM_LEVELS.find((bl) => bl.value === bloomLevel)
}

export function getQuestionSourceConfig(source: QuestionSource) {
  return QUESTION_SOURCES.find((qs) => qs.value === source)
}

// --- Dictionary-based factory functions ---
// These take the `exams.qbank` dictionary subtree (see ./t.ts `qbankT`).
// No English fallbacks: a missing key renders empty, never the wrong language.

type QbankDict = Record<string, any> | undefined

const typeKeys = {
  MULTIPLE_CHOICE: "mcq",
  TRUE_FALSE: "trueFalse",
  FILL_BLANK: "fillBlank",
  SHORT_ANSWER: "shortAnswer",
  ESSAY: "essay",
  MATCHING: "matching",
  ORDERING: "ordering",
  MULTI_SELECT: "multiSelect",
} as const

export const getQuestionTypeOptions = (t?: QbankDict) =>
  QUESTION_TYPES.map((qt) => ({
    ...qt,
    label: (t?.config?.questionTypes?.[typeKeys[qt.value]] ?? "") as string,
    description: (t?.config?.typeDescriptions?.[typeKeys[qt.value]] ??
      "") as string,
  }))

export const getDifficultyLevelOptions = (t?: QbankDict) =>
  DIFFICULTY_LEVELS.map((dl) => {
    const key = dl.value.toLowerCase()
    return {
      ...dl,
      label: (t?.config?.difficulty?.[key] ?? "") as string,
      description: (t?.config?.difficultyDescriptions?.[key] ?? "") as string,
    }
  })

export const getBloomLevelOptions = (t?: QbankDict) =>
  BLOOM_LEVELS.map((bl) => {
    const key = bl.value.toLowerCase()
    return {
      ...bl,
      label: (t?.config?.bloomLevels?.[key] ?? "") as string,
      description: (t?.config?.bloomDescriptions?.[key] ?? "") as string,
    }
  })

export const getQuestionSourceOptions = (t?: QbankDict) =>
  QUESTION_SOURCES.map((qs) => {
    const key = qs.value === "AI" ? "aiGenerated" : qs.value.toLowerCase()
    return {
      ...qs,
      label: (t?.config?.sources?.[key] ?? "") as string,
      description: (t?.config?.sourceDescriptions?.[key] ?? "") as string,
    }
  })

/** Question type labels map for display */
export const getQuestionTypeLabels = (t?: QbankDict): Record<string, string> =>
  Object.fromEntries(
    Object.entries(typeKeys).map(([value, key]) => [
      value,
      (t?.config?.questionTypes?.[key] ?? "") as string,
    ])
  )

/** Difficulty labels map for display */
export const getDifficultyLabels = (t?: QbankDict): Record<string, string> => ({
  EASY: t?.config?.difficulty?.easy ?? "",
  MEDIUM: t?.config?.difficulty?.medium ?? "",
  HARD: t?.config?.difficulty?.hard ?? "",
})

/** Bloom level labels map for display */
export const getBloomLabels = (t?: QbankDict): Record<string, string> =>
  Object.fromEntries(
    BLOOM_LEVELS.map((bl) => [
      bl.value,
      (t?.config?.bloomLevels?.[bl.value.toLowerCase()] ?? "") as string,
    ])
  )

/** Question source labels map for display */
export const getSourceLabels = (t?: QbankDict): Record<string, string> => ({
  MANUAL: t?.config?.sources?.manual ?? "",
  AI: t?.config?.sources?.aiGenerated ?? "",
  IMPORTED: t?.config?.sources?.imported ?? "",
})

export function calculateDefaultPoints(
  type: QuestionType,
  difficulty: DifficultyLevel
) {
  const basePoints = DEFAULT_POINTS_BY_TYPE[type]
  const difficultyMultiplier =
    difficulty === DifficultyLevel.EASY
      ? 1
      : difficulty === DifficultyLevel.MEDIUM
        ? 1.5
        : 2
  return Math.round(basePoints * difficultyMultiplier)
}

export function estimateExamDuration(
  questions: {
    questionType: QuestionType
    difficulty: DifficultyLevel
  }[]
) {
  return questions.reduce((total, q) => {
    const baseTime = DEFAULT_TIME_ESTIMATES[q.questionType]
    const difficultyMultiplier =
      q.difficulty === DifficultyLevel.EASY
        ? 1
        : q.difficulty === DifficultyLevel.MEDIUM
          ? 1.2
          : 1.5
    return total + baseTime * difficultyMultiplier
  }, 0)
}
