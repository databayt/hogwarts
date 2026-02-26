// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * QBank (Question Bank) Seed
 * Creates real Arabic educational questions from data/questions.ts
 *
 * Phase 10: Exams, QBank & Grades
 */

import type { PrismaClient } from "@prisma/client"

import {
  GENERIC_QUESTIONS,
  SUBJECT_QUESTIONS,
  type QuestionData,
} from "./data/questions"
import type { SubjectRef, UserRef } from "./types"
import { logSuccess, processBatch } from "./utils"

// Map English catalog subject names → Arabic SUBJECT_QUESTIONS keys
const ENGLISH_TO_ARABIC_SUBJECT: Record<string, string> = {
  Math: "الرياضيات",
  Physics: "الفيزياء",
  "Physical Science": "الفيزياء",
  "English Language Arts": "اللغة العربية",
  "Life Science": "العلوم",
  "Life Sciences": "العلوم",
  "Chemical Science": "العلوم",
  Chemistry: "العلوم",
  "Earth and Space Science": "العلوم",
  "Religion and Ethics": "التربية الإسلامية",
  "Religion and Philosophy": "التربية الإسلامية",
  Religion: "القرآن الكريم",
}

// ============================================================================
// QBANK SEEDING
// ============================================================================

export async function seedQBank(
  prisma: PrismaClient,
  schoolId: string,
  subjects: SubjectRef[],
  adminUsers: UserRef[]
): Promise<number> {
  let questionCount = 0

  const creator =
    adminUsers.find((u) => u.role === "TEACHER" || u.role === "ADMIN") ||
    adminUsers[0]
  if (!creator) {
    logSuccess("QBank Questions", 0, "no creator found")
    return 0
  }

  await processBatch(subjects, 5, async (subject) => {
    // Get real questions for this subject, or fall back to generic
    const arabicKey = ENGLISH_TO_ARABIC_SUBJECT[subject.subjectName]
    const questions: QuestionData[] =
      (arabicKey
        ? SUBJECT_QUESTIONS[arabicKey]
        : SUBJECT_QUESTIONS[subject.subjectName]) || GENERIC_QUESTIONS

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      const uniqueQuestion = `${q.questionText} (${subject.subjectName} Q${i + 1})`

      try {
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
              questionType: q.questionType,
              difficulty: q.difficulty,
              bloomLevel: q.bloomLevel,
              points: q.points,
              options: q.options || undefined,
              sampleAnswer: q.sampleAnswer || null,
              explanation: `سؤال في مادة ${subject.subjectName}`,
              tags: [
                subject.subjectName.toLowerCase(),
                q.questionType.toLowerCase(),
                q.difficulty.toLowerCase(),
              ],
              createdBy: creator.id,
            },
          })
          questionCount++
        }
      } catch {
        // Skip duplicates
      }
    }
  })

  logSuccess(
    "QBank Questions",
    questionCount,
    "real Arabic educational content"
  )

  return questionCount
}
