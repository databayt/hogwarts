/**
 * QBank (Question Bank) Seed
 * Creates Questions (MCQ, True/False, Short Answer, Essay)
 *
 * Phase 8: Exams, QBank & Grades
 *
 * Note: QuestionBank model has NO unique constraint - uses findFirst + create
 * - QuestionType enum: MULTIPLE_CHOICE (not MCQ), TRUE_FALSE, SHORT_ANSWER, ESSAY, FILL_BLANK
 * - Uses `sampleAnswer` (not modelAnswer), NO Arabic version
 * - Required fields: bloomLevel, createdBy
 * - NO questionTextAr, isActive, usageCount fields
 */

import type { PrismaClient } from "@prisma/client"

import type { SubjectRef, UserRef } from "./types"
import { logSuccess, processBatch, randomElement, randomNumber } from "./utils"

// ============================================================================
// QUESTION TYPES
// ============================================================================

// Map seed types to schema enum values
const QUESTION_TYPE_MAP = {
  MCQ: "MULTIPLE_CHOICE",
  TRUE_FALSE: "TRUE_FALSE",
  SHORT_ANSWER: "SHORT_ANSWER",
  ESSAY: "ESSAY",
} as const

const QUESTION_TEMPLATES = {
  MCQ: [
    { templateEn: "What is the correct answer for {topic}?" },
    { templateEn: "Which of the following best describes {topic}?" },
    { templateEn: "Select the correct statement about {topic}:" },
  ],
  TRUE_FALSE: [
    { templateEn: "{topic} is a fundamental concept in this subject." },
    { templateEn: "The statement about {topic} is correct." },
  ],
  SHORT_ANSWER: [
    { templateEn: "Briefly explain {topic}." },
    { templateEn: "Define {topic} in your own words." },
  ],
  ESSAY: [
    { templateEn: "Discuss the importance of {topic} in detail." },
    { templateEn: "Analyze the concept of {topic} and its applications." },
  ],
}

const TOPICS = [
  { en: "the main concept" },
  { en: "the fundamental principle" },
  { en: "the key theory" },
  { en: "the basic formula" },
  { en: "the core definition" },
  { en: "the primary rule" },
  { en: "the essential method" },
  { en: "the critical process" },
]

const DIFFICULTY_LEVELS = ["EASY", "MEDIUM", "HARD"] as const
const BLOOM_LEVELS = [
  "REMEMBER",
  "UNDERSTAND",
  "APPLY",
  "ANALYZE",
  "EVALUATE",
  "CREATE",
] as const

// ============================================================================
// QBANK SEEDING
// ============================================================================

/**
 * Seed question bank (1000+ questions)
 * Note: QuestionBank has NO unique constraint - uses findFirst + create
 */
export async function seedQBank(
  prisma: PrismaClient,
  schoolId: string,
  subjects: SubjectRef[],
  adminUsers: UserRef[]
): Promise<number> {
  let questionCount = 0

  // Get an admin/teacher for createdBy field
  const creator =
    adminUsers.find((u) => u.role === "TEACHER" || u.role === "ADMIN") ||
    adminUsers[0]
  if (!creator) {
    logSuccess("QBank Questions", 0, "no creator found")
    return 0
  }

  // Create questions for each subject
  await processBatch(subjects, 5, async (subject) => {
    // Create 50 questions per subject (mix of types)
    const questionTypes = [
      "MCQ",
      "TRUE_FALSE",
      "SHORT_ANSWER",
      "ESSAY",
    ] as const

    for (let i = 0; i < 50; i++) {
      const type = questionTypes[i % questionTypes.length]
      const templates = QUESTION_TEMPLATES[type]
      const template = randomElement(templates)
      const topic = randomElement(TOPICS)

      const questionText = template.templateEn.replace("{topic}", topic.en)
      const difficulty = randomElement([...DIFFICULTY_LEVELS])
      const bloomLevel = randomElement([...BLOOM_LEVELS])
      const points = type === "ESSAY" ? 20 : type === "SHORT_ANSWER" ? 10 : 5

      // Unique question identifier
      const uniqueQuestion = `${questionText} (${subject.subjectName} Q${i + 1})`

      try {
        // Check if question exists (no unique constraint)
        const existing = await prisma.questionBank.findFirst({
          where: {
            schoolId,
            subjectId: subject.id,
            questionText: uniqueQuestion,
          },
        })

        if (!existing) {
          await prisma.questionBank.create({
            data: {
              schoolId,
              subjectId: subject.id,
              questionText: uniqueQuestion,
              questionType: QUESTION_TYPE_MAP[type],
              difficulty,
              bloomLevel, // Required field
              points,
              options:
                type === "MCQ"
                  ? [
                      { text: "Option A", isCorrect: true },
                      { text: "Option B", isCorrect: false },
                      { text: "Option C", isCorrect: false },
                      { text: "Option D", isCorrect: false },
                    ]
                  : type === "TRUE_FALSE"
                    ? [
                        { text: "True", isCorrect: randomNumber(0, 1) === 1 },
                        { text: "False", isCorrect: randomNumber(0, 1) === 0 },
                      ]
                    : undefined,
              sampleAnswer:
                type === "SHORT_ANSWER" || type === "ESSAY"
                  ? `Sample answer for ${topic.en}`
                  : null,
              explanation: `This question tests understanding of ${topic.en}`,
              tags: [subject.subjectName.toLowerCase(), type.toLowerCase()],
              createdBy: creator.id, // Required field
            },
          })
          questionCount++
        }
      } catch {
        // Skip if question already exists
      }
    }
  })

  logSuccess("QBank Questions", questionCount, "MCQ, T/F, Short Answer, Essay")

  return questionCount
}
