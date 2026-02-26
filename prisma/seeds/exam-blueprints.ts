// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Exam Blueprints for ClickView K-12 Subjects
 *
 * Maps 62 subjects into 8 pedagogical categories, each with:
 * - Question type distribution (what % MCQ vs Essay vs Short Answer etc.)
 * - Bloom's taxonomy alignment (STEM = Apply/Analyze, Humanities = Remember/Evaluate)
 * - Difficulty curves by school level (Elementary=easy-heavy, High=balanced)
 * - Exam type configs (final, midterm, chapter_test, quiz, practice, diagnostic)
 * - Subject-specific question text templates
 *
 * Usage: imported by catalog-content.ts for rich exam/question seeding
 */

// ============================================================================
// SUBJECT CATEGORIES
// ============================================================================

export type SubjectCategory =
  | "STEM_MATH"
  | "STEM_SCIENCE"
  | "LANGUAGE_ARTS"
  | "SOCIAL_STUDIES"
  | "ARTS_HUMANITIES"
  | "HEALTH_PE"
  | "PRACTICAL_SKILLS"
  | "WORLD_LANGUAGES"

/**
 * Maps subject name keywords to pedagogical categories.
 * Checked in order — first match wins.
 */
const CATEGORY_RULES: {
  test: (name: string) => boolean
  category: SubjectCategory
}[] = [
  { test: (n) => /^math$/i.test(n), category: "STEM_MATH" },
  {
    test: (n) =>
      /physics|chemistry|chemical|biology|life science|earth.*space|physical science|science.*engineering/i.test(
        n
      ),
    category: "STEM_SCIENCE",
  },
  {
    test: (n) => /computer science|technology/i.test(n),
    category: "STEM_SCIENCE",
  },
  { test: (n) => /^science$/i.test(n), category: "STEM_SCIENCE" },
  { test: (n) => /english language/i.test(n), category: "LANGUAGE_ARTS" },
  {
    test: (n) => /^languages$|world languages/i.test(n),
    category: "WORLD_LANGUAGES",
  },
  {
    test: (n) =>
      /history|civics|government|geography|economics|social studies|sociology|psychology/i.test(
        n
      ),
    category: "SOCIAL_STUDIES",
  },
  { test: (n) => /business/i.test(n), category: "SOCIAL_STUDIES" },
  { test: (n) => /arts|music/i.test(n), category: "ARTS_HUMANITIES" },
  {
    test: (n) =>
      /religion|philosophy|ethics|celebration|commemoration|festival/i.test(n),
    category: "ARTS_HUMANITIES",
  },
  { test: (n) => /health|physical education/i.test(n), category: "HEALTH_PE" },
  {
    test: (n) =>
      /life skills|career|technical education|professional development/i.test(
        n
      ),
    category: "PRACTICAL_SKILLS",
  },
]

export function getSubjectCategory(subjectName: string): SubjectCategory {
  for (const rule of CATEGORY_RULES) {
    if (rule.test(subjectName)) return rule.category
  }
  return "SOCIAL_STUDIES" // safe default
}

// ============================================================================
// EXAM TYPE DEFINITIONS
// ============================================================================

export type ExamType =
  | "final"
  | "midterm"
  | "chapter_test"
  | "quiz"
  | "practice"
  | "diagnostic"

export interface ExamTypeConfig {
  examType: ExamType
  durationRange: [number, number] // [min, max] minutes
  totalMarksRange: [number, number]
  passingPercent: number
  questionCountRange: [number, number]
}

const EXAM_TYPES: Record<ExamType, ExamTypeConfig> = {
  final: {
    examType: "final",
    durationRange: [90, 150],
    totalMarksRange: [80, 100],
    passingPercent: 50,
    questionCountRange: [30, 60],
  },
  midterm: {
    examType: "midterm",
    durationRange: [60, 90],
    totalMarksRange: [50, 80],
    passingPercent: 50,
    questionCountRange: [20, 40],
  },
  chapter_test: {
    examType: "chapter_test",
    durationRange: [30, 60],
    totalMarksRange: [30, 60],
    passingPercent: 50,
    questionCountRange: [15, 30],
  },
  quiz: {
    examType: "quiz",
    durationRange: [10, 25],
    totalMarksRange: [10, 30],
    passingPercent: 50,
    questionCountRange: [5, 15],
  },
  practice: {
    examType: "practice",
    durationRange: [20, 45],
    totalMarksRange: [20, 50],
    passingPercent: 0, // no pass/fail for practice
    questionCountRange: [10, 25],
  },
  diagnostic: {
    examType: "diagnostic",
    durationRange: [30, 60],
    totalMarksRange: [30, 60],
    passingPercent: 0, // diagnostic = assessment only
    questionCountRange: [15, 30],
  },
}

export function getExamTypeConfig(examType: ExamType): ExamTypeConfig {
  return EXAM_TYPES[examType]
}

// ============================================================================
// QUESTION TYPE DISTRIBUTIONS BY CATEGORY
// ============================================================================

/**
 * Distribution weights for question types per category.
 * Values are relative weights (will be normalized to question counts).
 */
interface QuestionTypeWeights {
  MULTIPLE_CHOICE: number
  TRUE_FALSE: number
  FILL_BLANK: number
  SHORT_ANSWER: number
  ESSAY: number
  MATCHING: number
  ORDERING: number
  MULTI_SELECT: number
}

const CATEGORY_QUESTION_WEIGHTS: Record<SubjectCategory, QuestionTypeWeights> =
  {
    STEM_MATH: {
      MULTIPLE_CHOICE: 25,
      TRUE_FALSE: 5,
      FILL_BLANK: 20,
      SHORT_ANSWER: 20,
      ESSAY: 5,
      MATCHING: 5,
      ORDERING: 10,
      MULTI_SELECT: 10,
    },
    STEM_SCIENCE: {
      MULTIPLE_CHOICE: 30,
      TRUE_FALSE: 10,
      FILL_BLANK: 10,
      SHORT_ANSWER: 15,
      ESSAY: 10,
      MATCHING: 10,
      ORDERING: 5,
      MULTI_SELECT: 10,
    },
    LANGUAGE_ARTS: {
      MULTIPLE_CHOICE: 15,
      TRUE_FALSE: 5,
      FILL_BLANK: 15,
      SHORT_ANSWER: 25,
      ESSAY: 25,
      MATCHING: 5,
      ORDERING: 5,
      MULTI_SELECT: 5,
    },
    SOCIAL_STUDIES: {
      MULTIPLE_CHOICE: 25,
      TRUE_FALSE: 10,
      FILL_BLANK: 10,
      SHORT_ANSWER: 20,
      ESSAY: 15,
      MATCHING: 10,
      ORDERING: 5,
      MULTI_SELECT: 5,
    },
    ARTS_HUMANITIES: {
      MULTIPLE_CHOICE: 15,
      TRUE_FALSE: 10,
      FILL_BLANK: 5,
      SHORT_ANSWER: 25,
      ESSAY: 30,
      MATCHING: 5,
      ORDERING: 5,
      MULTI_SELECT: 5,
    },
    HEALTH_PE: {
      MULTIPLE_CHOICE: 30,
      TRUE_FALSE: 15,
      FILL_BLANK: 10,
      SHORT_ANSWER: 15,
      ESSAY: 5,
      MATCHING: 10,
      ORDERING: 5,
      MULTI_SELECT: 10,
    },
    PRACTICAL_SKILLS: {
      MULTIPLE_CHOICE: 25,
      TRUE_FALSE: 10,
      FILL_BLANK: 10,
      SHORT_ANSWER: 20,
      ESSAY: 10,
      MATCHING: 10,
      ORDERING: 10,
      MULTI_SELECT: 5,
    },
    WORLD_LANGUAGES: {
      MULTIPLE_CHOICE: 20,
      TRUE_FALSE: 10,
      FILL_BLANK: 25,
      SHORT_ANSWER: 15,
      ESSAY: 5,
      MATCHING: 15,
      ORDERING: 5,
      MULTI_SELECT: 5,
    },
  }

// ============================================================================
// BLOOM'S DISTRIBUTION BY CATEGORY
// ============================================================================

interface BloomWeights {
  REMEMBER: number
  UNDERSTAND: number
  APPLY: number
  ANALYZE: number
  EVALUATE: number
  CREATE: number
}

const CATEGORY_BLOOM_WEIGHTS: Record<SubjectCategory, BloomWeights> = {
  STEM_MATH: {
    REMEMBER: 10,
    UNDERSTAND: 15,
    APPLY: 35,
    ANALYZE: 20,
    EVALUATE: 10,
    CREATE: 10,
  },
  STEM_SCIENCE: {
    REMEMBER: 15,
    UNDERSTAND: 20,
    APPLY: 25,
    ANALYZE: 20,
    EVALUATE: 10,
    CREATE: 10,
  },
  LANGUAGE_ARTS: {
    REMEMBER: 10,
    UNDERSTAND: 20,
    APPLY: 15,
    ANALYZE: 25,
    EVALUATE: 20,
    CREATE: 10,
  },
  SOCIAL_STUDIES: {
    REMEMBER: 20,
    UNDERSTAND: 25,
    APPLY: 15,
    ANALYZE: 20,
    EVALUATE: 15,
    CREATE: 5,
  },
  ARTS_HUMANITIES: {
    REMEMBER: 10,
    UNDERSTAND: 15,
    APPLY: 15,
    ANALYZE: 20,
    EVALUATE: 20,
    CREATE: 20,
  },
  HEALTH_PE: {
    REMEMBER: 20,
    UNDERSTAND: 25,
    APPLY: 25,
    ANALYZE: 15,
    EVALUATE: 10,
    CREATE: 5,
  },
  PRACTICAL_SKILLS: {
    REMEMBER: 10,
    UNDERSTAND: 15,
    APPLY: 35,
    ANALYZE: 15,
    EVALUATE: 15,
    CREATE: 10,
  },
  WORLD_LANGUAGES: {
    REMEMBER: 25,
    UNDERSTAND: 25,
    APPLY: 25,
    ANALYZE: 10,
    EVALUATE: 10,
    CREATE: 5,
  },
}

// ============================================================================
// DIFFICULTY CURVES BY SCHOOL LEVEL
// ============================================================================

interface DifficultyWeights {
  EASY: number
  MEDIUM: number
  HARD: number
}

type SchoolLevel = "elementary" | "middle" | "high"

const LEVEL_DIFFICULTY_WEIGHTS: Record<SchoolLevel, DifficultyWeights> = {
  elementary: { EASY: 50, MEDIUM: 35, HARD: 15 },
  middle: { EASY: 30, MEDIUM: 45, HARD: 25 },
  high: { EASY: 20, MEDIUM: 40, HARD: 40 },
}

// ============================================================================
// DISTRIBUTION BUILDER
// ============================================================================

type QuestionTypeKey =
  | "MULTIPLE_CHOICE"
  | "TRUE_FALSE"
  | "FILL_BLANK"
  | "SHORT_ANSWER"
  | "ESSAY"
  | "MATCHING"
  | "ORDERING"
  | "MULTI_SELECT"

type DifficultyKey = "EASY" | "MEDIUM" | "HARD"

type BloomKey =
  | "REMEMBER"
  | "UNDERSTAND"
  | "APPLY"
  | "ANALYZE"
  | "EVALUATE"
  | "CREATE"

export type ExamDistribution = Record<
  QuestionTypeKey,
  Record<DifficultyKey, number>
>
export type BloomDistribution = Record<BloomKey, number>

/**
 * Builds a concrete question distribution given total question count,
 * subject category, and school level.
 */
export function buildDistribution(
  totalQuestions: number,
  category: SubjectCategory,
  level: SchoolLevel
): ExamDistribution {
  const typeWeights = CATEGORY_QUESTION_WEIGHTS[category]
  const diffWeights = LEVEL_DIFFICULTY_WEIGHTS[level]

  const typeTotal = Object.values(typeWeights).reduce((a, b) => a + b, 0)
  const diffTotal = Object.values(diffWeights).reduce((a, b) => a + b, 0)

  const distribution: ExamDistribution = {
    MULTIPLE_CHOICE: { EASY: 0, MEDIUM: 0, HARD: 0 },
    TRUE_FALSE: { EASY: 0, MEDIUM: 0, HARD: 0 },
    FILL_BLANK: { EASY: 0, MEDIUM: 0, HARD: 0 },
    SHORT_ANSWER: { EASY: 0, MEDIUM: 0, HARD: 0 },
    ESSAY: { EASY: 0, MEDIUM: 0, HARD: 0 },
    MATCHING: { EASY: 0, MEDIUM: 0, HARD: 0 },
    ORDERING: { EASY: 0, MEDIUM: 0, HARD: 0 },
    MULTI_SELECT: { EASY: 0, MEDIUM: 0, HARD: 0 },
  }

  // First pass: distribute by type proportionally
  let remaining = totalQuestions
  const typeKeys = Object.keys(typeWeights) as QuestionTypeKey[]
  const typeCounts: Record<QuestionTypeKey, number> = {} as Record<
    QuestionTypeKey,
    number
  >

  for (let i = 0; i < typeKeys.length; i++) {
    const key = typeKeys[i]
    if (i === typeKeys.length - 1) {
      typeCounts[key] = remaining
    } else {
      typeCounts[key] = Math.round(
        (typeWeights[key] / typeTotal) * totalQuestions
      )
      remaining -= typeCounts[key]
    }
  }

  // Second pass: distribute each type across difficulties
  const diffKeys: DifficultyKey[] = ["EASY", "MEDIUM", "HARD"]
  for (const type of typeKeys) {
    const count = typeCounts[type]
    if (count <= 0) continue

    let diffRemaining = count
    for (let i = 0; i < diffKeys.length; i++) {
      const diff = diffKeys[i]
      if (i === diffKeys.length - 1) {
        distribution[type][diff] = diffRemaining
      } else {
        const allocated = Math.round((diffWeights[diff] / diffTotal) * count)
        distribution[type][diff] = allocated
        diffRemaining -= allocated
      }
    }
  }

  // Remove zero entries (keep only types with questions)
  for (const type of typeKeys) {
    const total =
      distribution[type].EASY +
      distribution[type].MEDIUM +
      distribution[type].HARD
    if (total === 0) {
      delete (distribution as Record<string, unknown>)[type]
    }
  }

  return distribution
}

/**
 * Builds Bloom's distribution for a given total question count and category.
 */
export function buildBloomDistribution(
  totalQuestions: number,
  category: SubjectCategory
): BloomDistribution {
  const weights = CATEGORY_BLOOM_WEIGHTS[category]
  const total = Object.values(weights).reduce((a, b) => a + b, 0)

  const bloomKeys: BloomKey[] = [
    "REMEMBER",
    "UNDERSTAND",
    "APPLY",
    "ANALYZE",
    "EVALUATE",
    "CREATE",
  ]

  const result: BloomDistribution = {} as BloomDistribution
  let remaining = totalQuestions

  for (let i = 0; i < bloomKeys.length; i++) {
    const key = bloomKeys[i]
    if (i === bloomKeys.length - 1) {
      result[key] = remaining
    } else {
      const allocated = Math.round((weights[key] / total) * totalQuestions)
      result[key] = allocated
      remaining -= allocated
    }
  }

  return result
}

// ============================================================================
// SUBJECT-SPECIFIC QUESTION TEMPLATES
// ============================================================================

interface QuestionTemplate {
  /** Bloom-appropriate verb prefix */
  prefix: string
  /** Template with {topic} and {chapter} placeholders */
  text: string
  /** Bloom level this template targets */
  bloom: BloomKey
}

const CATEGORY_QUESTION_TEMPLATES: Record<SubjectCategory, QuestionTemplate[]> =
  {
    STEM_MATH: [
      {
        prefix: "Calculate",
        text: "Calculate the result when {topic} is applied to the following problem.",
        bloom: "APPLY",
      },
      {
        prefix: "Solve",
        text: "Solve the following problem using {topic}. Show your work.",
        bloom: "APPLY",
      },
      {
        prefix: "Identify",
        text: "Identify the correct formula for {topic}.",
        bloom: "REMEMBER",
      },
      {
        prefix: "Explain",
        text: "Explain how {topic} relates to {chapter}.",
        bloom: "UNDERSTAND",
      },
      {
        prefix: "Analyze",
        text: "Analyze the following data set and determine the pattern using {topic}.",
        bloom: "ANALYZE",
      },
      {
        prefix: "Compare",
        text: "Compare and contrast the two methods for solving problems in {topic}.",
        bloom: "ANALYZE",
      },
      {
        prefix: "Evaluate",
        text: "Evaluate which approach is most efficient for {topic} and justify your reasoning.",
        bloom: "EVALUATE",
      },
      {
        prefix: "Design",
        text: "Design a real-world scenario where {topic} would be essential.",
        bloom: "CREATE",
      },
      {
        prefix: "Determine",
        text: "Determine the value of x in the following {topic} equation.",
        bloom: "APPLY",
      },
      {
        prefix: "Prove",
        text: "Prove the following statement about {topic} is true.",
        bloom: "EVALUATE",
      },
    ],
    STEM_SCIENCE: [
      {
        prefix: "Describe",
        text: "Describe the process of {topic} and its role in {chapter}.",
        bloom: "UNDERSTAND",
      },
      {
        prefix: "Predict",
        text: "Predict what would happen if conditions for {topic} were changed.",
        bloom: "ANALYZE",
      },
      {
        prefix: "Identify",
        text: "Identify the key components involved in {topic}.",
        bloom: "REMEMBER",
      },
      {
        prefix: "Explain",
        text: "Explain the relationship between {topic} and {chapter}.",
        bloom: "UNDERSTAND",
      },
      {
        prefix: "Design",
        text: "Design an experiment to test a hypothesis about {topic}.",
        bloom: "CREATE",
      },
      {
        prefix: "Classify",
        text: "Classify the following examples based on their connection to {topic}.",
        bloom: "ANALYZE",
      },
      {
        prefix: "Compare",
        text: "Compare the effects of {topic} in different environments.",
        bloom: "ANALYZE",
      },
      {
        prefix: "Evaluate",
        text: "Evaluate the evidence supporting the theory of {topic}.",
        bloom: "EVALUATE",
      },
      {
        prefix: "Apply",
        text: "Apply the principles of {topic} to solve the following scenario.",
        bloom: "APPLY",
      },
      {
        prefix: "Investigate",
        text: "Investigate how {topic} influences outcomes in {chapter}.",
        bloom: "ANALYZE",
      },
    ],
    LANGUAGE_ARTS: [
      {
        prefix: "Analyze",
        text: "Analyze the author's use of {topic} in the passage.",
        bloom: "ANALYZE",
      },
      {
        prefix: "Identify",
        text: "Identify the literary device used in the following excerpt about {topic}.",
        bloom: "REMEMBER",
      },
      {
        prefix: "Write",
        text: "Write a paragraph demonstrating proper use of {topic}.",
        bloom: "CREATE",
      },
      {
        prefix: "Explain",
        text: "Explain how {topic} contributes to the text's overall meaning.",
        bloom: "UNDERSTAND",
      },
      {
        prefix: "Compare",
        text: "Compare how {topic} is used differently in two texts.",
        bloom: "ANALYZE",
      },
      {
        prefix: "Evaluate",
        text: "Evaluate the effectiveness of {topic} in communicating the author's message.",
        bloom: "EVALUATE",
      },
      {
        prefix: "Summarize",
        text: "Summarize the key points about {topic} from the reading.",
        bloom: "UNDERSTAND",
      },
      {
        prefix: "Critique",
        text: "Critique the argument presented about {topic}, identifying strengths and weaknesses.",
        bloom: "EVALUATE",
      },
      {
        prefix: "Create",
        text: "Create an original piece of writing that demonstrates {topic}.",
        bloom: "CREATE",
      },
      {
        prefix: "Infer",
        text: "Infer the meaning of {topic} from the context of the passage.",
        bloom: "UNDERSTAND",
      },
    ],
    SOCIAL_STUDIES: [
      {
        prefix: "Describe",
        text: "Describe the significance of {topic} in {chapter}.",
        bloom: "UNDERSTAND",
      },
      {
        prefix: "Identify",
        text: "Identify the causes and effects of {topic}.",
        bloom: "REMEMBER",
      },
      {
        prefix: "Explain",
        text: "Explain how {topic} influenced the development of {chapter}.",
        bloom: "UNDERSTAND",
      },
      {
        prefix: "Compare",
        text: "Compare {topic} across different time periods or regions.",
        bloom: "ANALYZE",
      },
      {
        prefix: "Evaluate",
        text: "Evaluate the impact of {topic} on modern society.",
        bloom: "EVALUATE",
      },
      {
        prefix: "Analyze",
        text: "Analyze the relationship between {topic} and {chapter}.",
        bloom: "ANALYZE",
      },
      {
        prefix: "Argue",
        text: "Argue for or against the proposition that {topic} was a turning point.",
        bloom: "EVALUATE",
      },
      {
        prefix: "Map",
        text: "Map the key events related to {topic} in chronological order.",
        bloom: "APPLY",
      },
      {
        prefix: "Examine",
        text: "Examine primary sources related to {topic} and draw conclusions.",
        bloom: "ANALYZE",
      },
      {
        prefix: "Construct",
        text: "Construct a timeline showing the development of {topic}.",
        bloom: "CREATE",
      },
    ],
    ARTS_HUMANITIES: [
      {
        prefix: "Describe",
        text: "Describe the artistic techniques used in {topic}.",
        bloom: "UNDERSTAND",
      },
      {
        prefix: "Identify",
        text: "Identify the cultural significance of {topic} in {chapter}.",
        bloom: "REMEMBER",
      },
      {
        prefix: "Create",
        text: "Create an original concept inspired by {topic}.",
        bloom: "CREATE",
      },
      {
        prefix: "Evaluate",
        text: "Evaluate the artistic merit of a work related to {topic}.",
        bloom: "EVALUATE",
      },
      {
        prefix: "Compare",
        text: "Compare different artistic approaches to {topic}.",
        bloom: "ANALYZE",
      },
      {
        prefix: "Interpret",
        text: "Interpret the meaning and symbolism in {topic}.",
        bloom: "UNDERSTAND",
      },
      {
        prefix: "Analyze",
        text: "Analyze how {topic} reflects the cultural context of {chapter}.",
        bloom: "ANALYZE",
      },
      {
        prefix: "Critique",
        text: "Critique a performance or work related to {topic}.",
        bloom: "EVALUATE",
      },
      {
        prefix: "Design",
        text: "Design a project that demonstrates the principles of {topic}.",
        bloom: "CREATE",
      },
      {
        prefix: "Reflect",
        text: "Reflect on how {topic} connects to your personal experience.",
        bloom: "EVALUATE",
      },
    ],
    HEALTH_PE: [
      {
        prefix: "Explain",
        text: "Explain the health benefits of {topic}.",
        bloom: "UNDERSTAND",
      },
      {
        prefix: "Identify",
        text: "Identify the key components of {topic} in a wellness plan.",
        bloom: "REMEMBER",
      },
      {
        prefix: "Apply",
        text: "Apply the principles of {topic} to create a personal fitness plan.",
        bloom: "APPLY",
      },
      {
        prefix: "Describe",
        text: "Describe the relationship between {topic} and overall well-being.",
        bloom: "UNDERSTAND",
      },
      {
        prefix: "Analyze",
        text: "Analyze how {topic} affects physical and mental health.",
        bloom: "ANALYZE",
      },
      {
        prefix: "Evaluate",
        text: "Evaluate the effectiveness of different approaches to {topic}.",
        bloom: "EVALUATE",
      },
      {
        prefix: "List",
        text: "List the safety guidelines for {topic}.",
        bloom: "REMEMBER",
      },
      {
        prefix: "Demonstrate",
        text: "Demonstrate proper technique for {topic}.",
        bloom: "APPLY",
      },
      {
        prefix: "Compare",
        text: "Compare the nutritional requirements for different {topic} activities.",
        bloom: "ANALYZE",
      },
      {
        prefix: "Plan",
        text: "Plan a weekly routine that incorporates {topic}.",
        bloom: "CREATE",
      },
    ],
    PRACTICAL_SKILLS: [
      {
        prefix: "Apply",
        text: "Apply {topic} techniques to solve the following practical scenario.",
        bloom: "APPLY",
      },
      {
        prefix: "Identify",
        text: "Identify the tools and resources needed for {topic}.",
        bloom: "REMEMBER",
      },
      {
        prefix: "Explain",
        text: "Explain the step-by-step process for {topic}.",
        bloom: "UNDERSTAND",
      },
      {
        prefix: "Evaluate",
        text: "Evaluate the best approach to handle a {topic} situation.",
        bloom: "EVALUATE",
      },
      {
        prefix: "Design",
        text: "Design a solution using {topic} for a real-world problem.",
        bloom: "CREATE",
      },
      {
        prefix: "Analyze",
        text: "Analyze the risks and benefits associated with {topic}.",
        bloom: "ANALYZE",
      },
      {
        prefix: "Demonstrate",
        text: "Demonstrate your understanding of {topic} by completing the task.",
        bloom: "APPLY",
      },
      {
        prefix: "Compare",
        text: "Compare professional standards for {topic} across industries.",
        bloom: "ANALYZE",
      },
      {
        prefix: "Develop",
        text: "Develop a plan that uses {topic} to improve workplace efficiency.",
        bloom: "CREATE",
      },
      {
        prefix: "Describe",
        text: "Describe how {topic} is applied in a professional setting.",
        bloom: "UNDERSTAND",
      },
    ],
    WORLD_LANGUAGES: [
      {
        prefix: "Translate",
        text: "Translate the following sentence using correct {topic} grammar.",
        bloom: "APPLY",
      },
      {
        prefix: "Identify",
        text: "Identify the correct usage of {topic} in the sentence.",
        bloom: "REMEMBER",
      },
      {
        prefix: "Complete",
        text: "Complete the blank with the correct form of {topic}.",
        bloom: "APPLY",
      },
      {
        prefix: "Describe",
        text: "Describe a scene using vocabulary from {topic}.",
        bloom: "UNDERSTAND",
      },
      {
        prefix: "Compare",
        text: "Compare how {topic} differs between the two languages.",
        bloom: "ANALYZE",
      },
      {
        prefix: "Write",
        text: "Write a short paragraph using {topic} vocabulary and grammar.",
        bloom: "CREATE",
      },
      {
        prefix: "Match",
        text: "Match the {topic} terms with their correct definitions.",
        bloom: "REMEMBER",
      },
      {
        prefix: "Conjugate",
        text: "Conjugate the verbs according to the rules of {topic}.",
        bloom: "APPLY",
      },
      {
        prefix: "Explain",
        text: "Explain the cultural context behind {topic}.",
        bloom: "UNDERSTAND",
      },
      {
        prefix: "Respond",
        text: "Respond to the following prompt using {topic} vocabulary.",
        bloom: "APPLY",
      },
    ],
  }

// ============================================================================
// MCQ OPTION GENERATORS (subject-aware)
// ============================================================================

interface McqOptionSet {
  correct: string
  distractors: string[]
}

const CATEGORY_MCQ_PATTERNS: Record<
  SubjectCategory,
  (topic: string) => McqOptionSet
> = {
  STEM_MATH: (topic) => ({
    correct: `The correct mathematical expression for ${topic}`,
    distractors: [
      `An expression with an incorrect operator`,
      `A formula missing a key variable`,
      `A reversed version of the correct expression`,
    ],
  }),
  STEM_SCIENCE: (topic) => ({
    correct: `The scientifically accurate description of ${topic}`,
    distractors: [
      `A common misconception about ${topic}`,
      `A related but incorrect process`,
      `A description that confuses cause and effect`,
    ],
  }),
  LANGUAGE_ARTS: (topic) => ({
    correct: `The correct identification of ${topic} in the text`,
    distractors: [
      `A similar but incorrect literary device`,
      `An unrelated textual feature`,
      `A misinterpretation of the author's intent`,
    ],
  }),
  SOCIAL_STUDIES: (topic) => ({
    correct: `The historically accurate fact about ${topic}`,
    distractors: [
      `A commonly confused date or event`,
      `An event from a different historical period`,
      `A fact about a related but different topic`,
    ],
  }),
  ARTS_HUMANITIES: (topic) => ({
    correct: `The accurate description of ${topic}'s cultural significance`,
    distractors: [
      `A description of a different artistic movement`,
      `A misattributed artistic technique`,
      `A generalization that oversimplifies the concept`,
    ],
  }),
  HEALTH_PE: (topic) => ({
    correct: `The evidence-based recommendation for ${topic}`,
    distractors: [
      `A common myth about ${topic}`,
      `An outdated health guideline`,
      `A recommendation for a different health concern`,
    ],
  }),
  PRACTICAL_SKILLS: (topic) => ({
    correct: `The correct procedure for ${topic}`,
    distractors: [
      `A procedure with steps in wrong order`,
      `A method that skips a safety requirement`,
      `A technique for a different but similar task`,
    ],
  }),
  WORLD_LANGUAGES: (topic) => ({
    correct: `The grammatically correct form for ${topic}`,
    distractors: [
      `An incorrect conjugation or declension`,
      `A false cognate or false friend`,
      `A form that applies a different grammar rule`,
    ],
  }),
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Gets a question template for the given category, cycling by index.
 */
export function getQuestionTemplate(
  category: SubjectCategory,
  index: number
): QuestionTemplate {
  const templates = CATEGORY_QUESTION_TEMPLATES[category]
  return templates[index % templates.length]
}

/**
 * Gets MCQ options tailored to the subject category.
 */
export function getMcqOptions(
  category: SubjectCategory,
  topic: string
): object[] {
  const pattern = CATEGORY_MCQ_PATTERNS[category](topic)
  const options = [
    { label: pattern.correct, isCorrect: true },
    ...pattern.distractors.map((d) => ({ label: d, isCorrect: false })),
  ]
  // Deterministic shuffle: rotate by topic length
  const rotate = topic.length % options.length
  return [...options.slice(rotate), ...options.slice(0, rotate)]
}

/**
 * Generates a complete question text using subject-aware templates.
 */
export function generateQuestionText(
  category: SubjectCategory,
  topic: string,
  chapter: string,
  difficulty: "EASY" | "MEDIUM" | "HARD",
  index: number
): string {
  const template = getQuestionTemplate(category, index)
  return template.text
    .replace(/\{topic\}/g, topic)
    .replace(/\{chapter\}/g, chapter)
}

/**
 * Gets the Bloom level from a question template by index.
 */
export function getBloomFromTemplate(
  category: SubjectCategory,
  index: number
): BloomKey {
  return getQuestionTemplate(category, index).bloom
}

/**
 * Extracts the school level from a subject slug.
 */
export function extractSchoolLevel(slug: string): SchoolLevel {
  // Legacy level-based slugs
  if (slug.startsWith("elementary-")) return "elementary"
  if (slug.startsWith("middle-")) return "middle"
  if (slug.startsWith("high-")) return "high"

  // New grade-based slugs: us-math-grade-3
  const gradeMatch = slug.match(/-grade-(\d+)$/)
  if (gradeMatch) {
    const grade = parseInt(gradeMatch[1], 10)
    if (grade <= 6) return "elementary"
    if (grade <= 9) return "middle"
    return "high"
  }

  return "middle"
}

/**
 * All exam types to generate for each catalog level.
 */
export const SUBJECT_LEVEL_EXAM_TYPES: ExamType[] = ["final", "midterm"]
export const CHAPTER_LEVEL_EXAM_TYPES: ExamType[] = ["chapter_test", "practice"]
export const LESSON_LEVEL_EXAM_TYPES: ExamType[] = ["quiz", "diagnostic"]

/**
 * Questions per level per difficulty.
 * Used when seeding CatalogQuestions.
 */
export const QUESTIONS_PER_SUBJECT = 10 // per subject (spread across difficulties)
export const QUESTIONS_PER_CHAPTER = 6 // per chapter
export const QUESTIONS_PER_LESSON = 4 // per lesson (ALL lessons, not just first 3)
