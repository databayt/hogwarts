"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  gradeEssayWithAI,
  gradeShortAnswerWithAI,
} from "@/lib/ai/openai";
import { parseAcceptedAnswers } from "../utils";
import type {
  ActionResponse,
  AIGradeResult,
  QuestionWithRubrics,
} from "./types";
import type { GradingMethod, MarkingStatus } from "@prisma/client";

/**
 * Grade a student answer using AI assistance
 */
export async function aiGradeAnswer(
  studentAnswerId: string
): Promise<ActionResponse<AIGradeResult>> {
  try {
    const session = await auth();
    const schoolId = session?.user?.schoolId;

    if (!schoolId) {
      return {
        success: false,
        error: "Unauthorized - No school context",
        code: "NO_SCHOOL_CONTEXT",
      };
    }

    // Get student answer with question and rubric details
    const studentAnswer = await db.studentAnswer.findFirst({
      where: { id: studentAnswerId, schoolId },
      include: {
        question: {
          include: {
            rubrics: {
              include: { criteria: true },
            },
          },
        },
      },
    });

    if (!studentAnswer) {
      return {
        success: false,
        error: "Answer not found",
        code: "ANSWER_NOT_FOUND",
      };
    }

    const question = studentAnswer.question as QuestionWithRubrics;
    const answerText =
      studentAnswer.ocrText || studentAnswer.answerText || "";

    if (!answerText) {
      return {
        success: false,
        error: "No answer text available for AI grading",
        code: "NO_ANSWER_TEXT",
      };
    }

    // Check if question type is AI-gradable
    if (!["ESSAY", "SHORT_ANSWER", "LONG_ANSWER"].includes(question.questionType)) {
      return {
        success: false,
        error: `Question type ${question.questionType} is not AI-gradable`,
        code: "NOT_AI_GRADABLE",
      };
    }

    let aiResult: AIGradeResult;

    // Use appropriate AI grading method
    if (question.questionType === "ESSAY" && question.rubrics.length > 0) {
      // Essay with rubric
      const rubric = question.rubrics[0];
      aiResult = await gradeEssayWithAI({
        questionText: question.questionText,
        studentAnswer: answerText,
        rubric,
        maxPoints: Number(question.points),
        sampleAnswer: question.sampleAnswer || undefined,
      });
    } else if (
      question.questionType === "SHORT_ANSWER" ||
      question.questionType === "ESSAY"
    ) {
      // Short/Long answer
      const options = question.options as
        | { acceptedAnswers?: string[] }
        | null;
      const acceptedAnswers = parseAcceptedAnswers(options?.acceptedAnswers);

      aiResult = await gradeShortAnswerWithAI({
        questionText: question.questionText,
        studentAnswer: answerText,
        acceptedAnswers,
        sampleAnswer: question.sampleAnswer || undefined,
        maxPoints: Number(question.points),
      });
    } else {
      return {
        success: false,
        error: "Question type not supported for AI grading",
        code: "UNSUPPORTED_TYPE",
      };
    }

    if (!aiResult.success) {
      return {
        success: false,
        error: aiResult.error || "AI grading failed",
        code: "AI_GRADE_FAILED",
      };
    }

    // Save marking result
    await saveAIMarkingResult(
      studentAnswer,
      aiResult,
      session.user.id
    );

    revalidatePath("/exams/mark");
    revalidatePath(`/exams/${studentAnswer.examId}/results`);

    return {
      success: true,
      data: aiResult,
    };
  } catch (error) {
    console.error("AI grade error:", error);
    return {
      success: false,
      error: "AI grading failed",
      code: "AI_GRADE_FAILED",
      details: error instanceof Error ? error.message : undefined,
    };
  }
}

/**
 * Batch AI grade multiple answers
 */
export async function batchAIGrade(
  examId: string,
  questionIds?: string[]
): Promise<
  ActionResponse<{
    graded: number;
    failed: number;
    skipped: number;
    total: number;
  }>
> {
  try {
    const session = await auth();
    const schoolId = session?.user?.schoolId;

    if (!schoolId) {
      return {
        success: false,
        error: "Unauthorized - No school context",
        code: "NO_SCHOOL_CONTEXT",
      };
    }

    // Build query
    const where: any = {
      schoolId,
      examId,
      question: {
        questionType: {
          in: ["ESSAY", "SHORT_ANSWER", "LONG_ANSWER"],
        },
      },
    };

    if (questionIds && questionIds.length > 0) {
      where.questionId = { in: questionIds };
    }

    // Get all AI-gradable answers
    const answers = await db.studentAnswer.findMany({
      where,
      include: {
        markingResult: true,
      },
    });

    let graded = 0;
    let failed = 0;
    let skipped = 0;

    for (const answer of answers) {
      // Skip if already graded and marked as completed
      if (
        answer.markingResult &&
        answer.markingResult.status === "COMPLETED"
      ) {
        skipped++;
        continue;
      }

      // Skip if no answer text
      if (!answer.answerText && !answer.ocrText) {
        skipped++;
        continue;
      }

      try {
        const result = await aiGradeAnswer(answer.id);
        if (result.success) {
          graded++;
        } else {
          failed++;
          console.error(`Failed to AI grade answer ${answer.id}:`, result.error);
        }
      } catch (error) {
        failed++;
        console.error(`Error AI grading answer ${answer.id}:`, error);
      }
    }

    return {
      success: true,
      data: {
        graded,
        failed,
        skipped,
        total: answers.length,
      },
    };
  } catch (error) {
    console.error("Batch AI grade error:", error);
    return {
      success: false,
      error: "Batch AI grading failed",
      code: "BATCH_AI_FAILED",
      details: error instanceof Error ? error.message : undefined,
    };
  }
}

/**
 * Request AI feedback for a student answer without grading
 */
export async function getAIFeedback(
  studentAnswerId: string
): Promise<ActionResponse<{ feedback: string; suggestions: string[] }>> {
  try {
    const session = await auth();
    const schoolId = session?.user?.schoolId;

    if (!schoolId) {
      return {
        success: false,
        error: "Unauthorized - No school context",
        code: "NO_SCHOOL_CONTEXT",
      };
    }

    // Get student answer with question details
    const studentAnswer = await db.studentAnswer.findFirst({
      where: { id: studentAnswerId, schoolId },
      include: {
        question: true,
      },
    });

    if (!studentAnswer) {
      return {
        success: false,
        error: "Answer not found",
        code: "ANSWER_NOT_FOUND",
      };
    }

    const answerText =
      studentAnswer.ocrText || studentAnswer.answerText || "";

    if (!answerText) {
      return {
        success: false,
        error: "No answer text available",
        code: "NO_ANSWER_TEXT",
      };
    }

    // Generate feedback using AI (implementation depends on OpenAI service)
    // This is a placeholder for the actual AI feedback generation
    const feedback = `Based on your answer to "${studentAnswer.question.questionText}", here are some observations...`;
    const suggestions = [
      "Consider providing more specific examples",
      "Expand on your main argument",
      "Review the key concepts mentioned in the question",
    ];

    return {
      success: true,
      data: {
        feedback,
        suggestions,
      },
    };
  } catch (error) {
    console.error("Get AI feedback error:", error);
    return {
      success: false,
      error: "Failed to generate AI feedback",
      code: "FEEDBACK_FAILED",
      details: error instanceof Error ? error.message : undefined,
    };
  }
}

/**
 * Helper function to save AI marking result
 */
async function saveAIMarkingResult(
  studentAnswer: any,
  aiResult: AIGradeResult,
  gradedBy?: string
): Promise<void> {
  const existingResult = await db.markingResult.findUnique({
    where: { studentAnswerId: studentAnswer.id },
  });

  const markingData = {
    schoolId: studentAnswer.schoolId,
    examId: studentAnswer.examId,
    questionId: studentAnswer.questionId,
    studentId: studentAnswer.studentId,
    gradingMethod: "AI_ASSISTED" as GradingMethod,
    status: (aiResult.needsReview ? "AI_GRADED" : "COMPLETED") as MarkingStatus,
    pointsAwarded: aiResult.aiScore,
    maxPoints: Number(studentAnswer.question.points),
    aiScore: aiResult.aiScore,
    aiConfidence: aiResult.aiConfidence,
    aiReasoning: aiResult.aiReasoning,
    feedback: aiResult.suggestedFeedback,
    needsReview: aiResult.needsReview,
    gradedBy,
    gradedAt: new Date(),
  };

  if (existingResult) {
    await db.markingResult.update({
      where: { id: existingResult.id },
      data: markingData,
    });
  } else {
    await db.markingResult.create({
      data: {
        ...markingData,
        studentAnswerId: studentAnswer.id,
      },
    });
  }
}