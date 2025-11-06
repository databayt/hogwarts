"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { createQuestionSchema } from "../validation";
import type { ActionResponse, CreateQuestionInput } from "./types";

/**
 * Create a new question in the question bank
 */
export async function createQuestion(
  data: FormData
): Promise<ActionResponse<{ id: string }>> {
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

    const formData = Object.fromEntries(data);

    // Parse JSON fields
    if (formData.options && typeof formData.options === "string") {
      formData.options = JSON.parse(formData.options);
    }
    if (formData.tags && typeof formData.tags === "string") {
      formData.tags = JSON.parse(formData.tags);
    }
    if (formData.acceptedAnswers && typeof formData.acceptedAnswers === "string") {
      formData.acceptedAnswers = JSON.parse(formData.acceptedAnswers);
    }

    const validated = createQuestionSchema.parse(formData);

    const question = await db.questionBank.create({
      data: {
        schoolId,
        subjectId: validated.subjectId,
        questionText: validated.questionText,
        questionType: validated.questionType,
        difficulty: validated.difficulty,
        bloomLevel: validated.bloomLevel,
        points: validated.points,
        timeEstimate: validated.timeEstimate,
        options: validated.options,
        sampleAnswer: validated.sampleAnswer,
        tags: validated.tags || [],
        explanation: validated.explanation,
        imageUrl: validated.imageUrl,
        source: "MANUAL",
        createdBy: session.user.id!,
      },
    });

    revalidatePath("/exams/mark");
    revalidatePath("/exams/qbank");

    return {
      success: true,
      data: { id: question.id }
    };
  } catch (error) {
    console.error("Create question error:", error);

    if (error instanceof Error && error.message.includes("validation")) {
      return {
        success: false,
        error: "Invalid question data",
        code: "VALIDATION_ERROR",
        details: error.message,
      };
    }

    return {
      success: false,
      error: "Failed to create question",
      code: "CREATE_FAILED",
      details: error instanceof Error ? error.message : undefined,
    };
  }
}

/**
 * Update an existing question in the question bank
 */
export async function updateQuestion(
  id: string,
  data: FormData
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

    // Verify question exists and belongs to school
    const existingQuestion = await db.questionBank.findFirst({
      where: { id, schoolId },
    });

    if (!existingQuestion) {
      return {
        success: false,
        error: "Question not found",
        code: "QUESTION_NOT_FOUND",
      };
    }

    const formData = Object.fromEntries(data);

    // Parse JSON fields
    if (formData.options && typeof formData.options === "string") {
      formData.options = JSON.parse(formData.options);
    }
    if (formData.tags && typeof formData.tags === "string") {
      formData.tags = JSON.parse(formData.tags);
    }
    if (formData.acceptedAnswers && typeof formData.acceptedAnswers === "string") {
      formData.acceptedAnswers = JSON.parse(formData.acceptedAnswers);
    }

    // Update the question
    await db.questionBank.update({
      where: { id },
      data: {
        ...formData,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/exams/mark");
    revalidatePath("/exams/qbank");
    revalidatePath(`/exams/qbank/${id}`);

    return { success: true };
  } catch (error) {
    console.error("Update question error:", error);
    return {
      success: false,
      error: "Failed to update question",
      code: "UPDATE_FAILED",
      details: error instanceof Error ? error.message : undefined,
    };
  }
}

/**
 * Delete a question from the question bank
 * Note: This will fail if the question is used in any exams
 */
export async function deleteQuestion(id: string): Promise<ActionResponse> {
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

    // Check if question is used in any exams
    const usageCount = await db.generatedExamQuestion.count({
      where: {
        questionId: id,
        generatedExam: { schoolId },
      },
    });

    if (usageCount > 0) {
      return {
        success: false,
        error: `Cannot delete - question is used in ${usageCount} exam(s)`,
        code: "QUESTION_IN_USE",
      };
    }

    // Check if question has any student answers
    const answerCount = await db.studentAnswer.count({
      where: {
        questionId: id,
        schoolId,
      },
    });

    if (answerCount > 0) {
      return {
        success: false,
        error: `Cannot delete - question has ${answerCount} student answer(s)`,
        code: "HAS_STUDENT_ANSWERS",
      };
    }

    // Delete associated rubrics first
    await db.rubricCriterion.deleteMany({
      where: {
        rubric: {
          questionId: id,
          schoolId,
        },
      },
    });

    await db.rubric.deleteMany({
      where: {
        questionId: id,
        schoolId,
      },
    });

    // Delete the question
    const deleted = await db.questionBank.deleteMany({
      where: { id, schoolId },
    });

    if (deleted.count === 0) {
      return {
        success: false,
        error: "Question not found",
        code: "QUESTION_NOT_FOUND",
      };
    }

    revalidatePath("/exams/mark");
    revalidatePath("/exams/qbank");

    return { success: true };
  } catch (error) {
    console.error("Delete question error:", error);
    return {
      success: false,
      error: "Failed to delete question",
      code: "DELETE_FAILED",
      details: error instanceof Error ? error.message : undefined,
    };
  }
}