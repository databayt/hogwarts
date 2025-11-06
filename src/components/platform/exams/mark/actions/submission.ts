"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { submitAnswerSchema } from "../validation";
import type { ActionResponse, SubmitAnswerInput } from "./types";

/**
 * Submit a student answer for an exam question
 */
export async function submitAnswer(
  data: FormData
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await auth();
    const schoolId = session?.user?.schoolId;
    const studentId = session?.user?.id;

    if (!schoolId || !studentId) {
      return {
        success: false,
        error: "Unauthorized - Missing school or user context",
        code: "NO_CONTEXT",
      };
    }

    const formData = Object.fromEntries(data);

    // Parse selectedOptionIds if it's a JSON string
    if (
      formData.selectedOptionIds &&
      typeof formData.selectedOptionIds === "string"
    ) {
      formData.selectedOptionIds = JSON.parse(formData.selectedOptionIds);
    }

    const validated = submitAnswerSchema.parse(formData);

    // Verify exam exists and belongs to school
    const exam = await db.exam.findFirst({
      where: {
        id: validated.examId,
        schoolId,
      },
      select: {
        id: true,
        status: true,
        examDate: true,
        startTime: true,
        endTime: true,
      },
    });

    if (!exam) {
      return {
        success: false,
        error: "Exam not found",
        code: "EXAM_NOT_FOUND",
      };
    }

    // Check if exam is in progress
    if (exam.status !== "IN_PROGRESS") {
      return {
        success: false,
        error: "Exam is not in progress",
        code: "EXAM_NOT_ACTIVE",
      };
    }

    // Verify question belongs to exam (through generatedExam)
    const examQuestion = await db.generatedExamQuestion.findFirst({
      where: {
        questionId: validated.questionId,
        generatedExam: {
          examId: validated.examId,
        },
      },
    });

    if (!examQuestion) {
      return {
        success: false,
        error: "Question not part of this exam",
        code: "INVALID_QUESTION",
      };
    }

    // Check if answer already exists
    const existing = await db.studentAnswer.findUnique({
      where: {
        examId_questionId_studentId: {
          examId: validated.examId,
          questionId: validated.questionId,
          studentId,
        },
      },
    });

    let answerId: string;

    if (existing) {
      // Update existing answer
      const updated = await db.studentAnswer.update({
        where: { id: existing.id },
        data: {
          submissionType: validated.submissionType,
          answerText: validated.answerText,
          selectedOptionIds: validated.selectedOptionIds || [],
          uploadUrl: validated.uploadUrl,
          submittedAt: new Date(),
        },
      });
      answerId = updated.id;
    } else {
      // Create new answer
      const created = await db.studentAnswer.create({
        data: {
          schoolId,
          examId: validated.examId,
          questionId: validated.questionId,
          studentId,
          submissionType: validated.submissionType,
          answerText: validated.answerText,
          selectedOptionIds: validated.selectedOptionIds || [],
          uploadUrl: validated.uploadUrl,
          submittedAt: new Date(),
        },
      });
      answerId = created.id;
    }

    revalidatePath(`/exams/${validated.examId}`);
    revalidatePath(`/exams/${validated.examId}/take`);

    return {
      success: true,
      data: { id: answerId },
    };
  } catch (error) {
    console.error("Submit answer error:", error);

    if (error instanceof Error && error.message.includes("validation")) {
      return {
        success: false,
        error: "Invalid answer data",
        code: "VALIDATION_ERROR",
        details: error.message,
      };
    }

    return {
      success: false,
      error: "Failed to submit answer",
      code: "SUBMIT_FAILED",
      details: error instanceof Error ? error.message : undefined,
    };
  }
}

/**
 * Get student's answers for an exam
 */
export async function getStudentAnswers(
  examId: string
): Promise<
  ActionResponse<
    Array<{
      id: string;
      questionId: string;
      answerText: string | null;
      selectedOptionIds: string[];
      uploadUrl: string | null;
      submittedAt: Date | null;
    }>
  >
> {
  try {
    const session = await auth();
    const schoolId = session?.user?.schoolId;
    const studentId = session?.user?.id;

    if (!schoolId || !studentId) {
      return {
        success: false,
        error: "Unauthorized - Missing school or user context",
        code: "NO_CONTEXT",
      };
    }

    const answers = await db.studentAnswer.findMany({
      where: {
        examId,
        studentId,
        schoolId,
      },
      select: {
        id: true,
        questionId: true,
        answerText: true,
        selectedOptionIds: true,
        uploadUrl: true,
        submittedAt: true,
      },
      orderBy: {
        submittedAt: "desc",
      },
    });

    return {
      success: true,
      data: answers,
    };
  } catch (error) {
    console.error("Get student answers error:", error);
    return {
      success: false,
      error: "Failed to retrieve answers",
      code: "FETCH_FAILED",
      details: error instanceof Error ? error.message : undefined,
    };
  }
}

/**
 * Clear a student's answer (admin only)
 */
export async function clearStudentAnswer(
  answerId: string
): Promise<ActionResponse> {
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

    // Check if user has admin/teacher role
    if (!["ADMIN", "TEACHER"].includes(session?.user?.role || "")) {
      return {
        success: false,
        error: "Insufficient permissions",
        code: "PERMISSION_DENIED",
      };
    }

    // Delete associated marking result first
    await db.markingResult.deleteMany({
      where: {
        studentAnswerId: answerId,
        schoolId,
      },
    });

    // Delete the answer
    const deleted = await db.studentAnswer.deleteMany({
      where: {
        id: answerId,
        schoolId,
      },
    });

    if (deleted.count === 0) {
      return {
        success: false,
        error: "Answer not found",
        code: "ANSWER_NOT_FOUND",
      };
    }

    revalidatePath("/exams/mark");

    return { success: true };
  } catch (error) {
    console.error("Clear student answer error:", error);
    return {
      success: false,
      error: "Failed to clear answer",
      code: "DELETE_FAILED",
      details: error instanceof Error ? error.message : undefined,
    };
  }
}