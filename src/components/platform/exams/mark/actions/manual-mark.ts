"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { gradeOverrideSchema } from "../validation";
import type { ActionResponse, GradeOverrideInput } from "./types";
import type { GradingMethod, MarkingStatus } from "@prisma/client";

/**
 * Manually grade a student answer
 */
export async function manualGrade(
  studentAnswerId: string,
  pointsAwarded: number,
  feedback?: string
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

    // Check if user has grading permissions
    if (!["ADMIN", "TEACHER"].includes(session?.user?.role || "")) {
      return {
        success: false,
        error: "Insufficient permissions to grade",
        code: "PERMISSION_DENIED",
      };
    }

    // Get student answer with question details
    const studentAnswer = await db.studentAnswer.findFirst({
      where: { id: studentAnswerId, schoolId },
      include: { question: true },
    });

    if (!studentAnswer) {
      return {
        success: false,
        error: "Answer not found",
        code: "ANSWER_NOT_FOUND",
      };
    }

    // Validate points awarded
    const maxPoints = Number(studentAnswer.question.points);
    if (pointsAwarded < 0 || pointsAwarded > maxPoints) {
      return {
        success: false,
        error: `Points must be between 0 and ${maxPoints}`,
        code: "INVALID_POINTS",
      };
    }

    // Check for existing result
    const existingResult = await db.markingResult.findUnique({
      where: { studentAnswerId },
    });

    const markingData = {
      schoolId,
      examId: studentAnswer.examId,
      questionId: studentAnswer.questionId,
      studentId: studentAnswer.studentId,
      gradingMethod: "MANUAL" as GradingMethod,
      status: "COMPLETED" as MarkingStatus,
      pointsAwarded,
      maxPoints,
      feedback,
      gradedBy: session.user.id!,
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
          studentAnswerId,
        },
      });
    }

    revalidatePath("/exams/mark");
    revalidatePath(`/exams/${studentAnswer.examId}/results`);

    return { success: true };
  } catch (error) {
    console.error("Manual grade error:", error);
    return {
      success: false,
      error: "Manual grading failed",
      code: "MANUAL_GRADE_FAILED",
      details: error instanceof Error ? error.message : undefined,
    };
  }
}

/**
 * Override an existing grade with justification
 */
export async function overrideGrade(
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

    // Check if user has override permissions
    if (!["ADMIN", "TEACHER"].includes(session?.user?.role || "")) {
      return {
        success: false,
        error: "Insufficient permissions to override grades",
        code: "PERMISSION_DENIED",
      };
    }

    const validated = gradeOverrideSchema.parse(Object.fromEntries(data));

    // Get marking result with question details
    const markingResult = await db.markingResult.findFirst({
      where: { id: validated.markingResultId, schoolId },
      include: {
        studentAnswer: {
          include: { question: true },
        },
      },
    });

    if (!markingResult) {
      return {
        success: false,
        error: "Marking result not found",
        code: "RESULT_NOT_FOUND",
      };
    }

    // Validate new score
    const maxPoints = Number(markingResult.maxPoints);
    if (validated.newScore < 0 || validated.newScore > maxPoints) {
      return {
        success: false,
        error: `Score must be between 0 and ${maxPoints}`,
        code: "INVALID_SCORE",
      };
    }

    // Create override record and update marking result in transaction
    await db.$transaction(async (tx) => {
      // Create override record for audit trail
      await tx.gradeOverride.create({
        data: {
          schoolId,
          markingResultId: validated.markingResultId,
          previousScore: markingResult.pointsAwarded,
          newScore: validated.newScore,
          reason: validated.reason,
          overriddenBy: session.user.id!,
        },
      });

      // Update marking result
      await tx.markingResult.update({
        where: { id: validated.markingResultId },
        data: {
          pointsAwarded: validated.newScore,
          wasOverridden: true,
          status: "COMPLETED",
          gradedBy: session.user.id!,
          gradedAt: new Date(),
          feedback: markingResult.feedback
            ? `${markingResult.feedback}\n\n[Override Reason: ${validated.reason}]`
            : `[Override Reason: ${validated.reason}]`,
        },
      });
    });

    revalidatePath("/exams/mark");
    revalidatePath(`/exams/${markingResult.examId}/results`);

    return { success: true };
  } catch (error) {
    console.error("Override grade error:", error);

    if (error instanceof Error && error.message.includes("validation")) {
      return {
        success: false,
        error: "Invalid override data",
        code: "VALIDATION_ERROR",
        details: error.message,
      };
    }

    return {
      success: false,
      error: "Grade override failed",
      code: "OVERRIDE_FAILED",
      details: error instanceof Error ? error.message : undefined,
    };
  }
}

/**
 * Review and finalize AI-graded answers
 */
export async function reviewAIGrade(
  markingResultId: string,
  approved: boolean,
  adjustedScore?: number,
  reviewNotes?: string
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

    // Check permissions
    if (!["ADMIN", "TEACHER"].includes(session?.user?.role || "")) {
      return {
        success: false,
        error: "Insufficient permissions to review grades",
        code: "PERMISSION_DENIED",
      };
    }

    // Get marking result
    const markingResult = await db.markingResult.findFirst({
      where: {
        id: markingResultId,
        schoolId,
        gradingMethod: "AI_ASSISTED",
      },
    });

    if (!markingResult) {
      return {
        success: false,
        error: "AI-graded result not found",
        code: "RESULT_NOT_FOUND",
      };
    }

    const updateData: any = {
      status: "COMPLETED",
      needsReview: false,
      reviewedBy: session.user.id!,
      reviewedAt: new Date(),
    };

    if (reviewNotes) {
      updateData.reviewNotes = reviewNotes;
    }

    // If not approved or score adjusted, create override
    if (!approved || adjustedScore !== undefined) {
      const newScore = adjustedScore ?? Number(markingResult.pointsAwarded);

      // Validate adjusted score
      if (newScore < 0 || newScore > Number(markingResult.maxPoints)) {
        return {
          success: false,
          error: `Score must be between 0 and ${markingResult.maxPoints}`,
          code: "INVALID_SCORE",
        };
      }

      // Create override record
      await db.gradeOverride.create({
        data: {
          schoolId,
          markingResultId,
          previousScore: markingResult.pointsAwarded,
          newScore,
          reason: reviewNotes || "AI grade review adjustment",
          overriddenBy: session.user.id!,
        },
      });

      updateData.pointsAwarded = newScore;
      updateData.wasOverridden = true;
    }

    // Update marking result
    await db.markingResult.update({
      where: { id: markingResultId },
      data: updateData,
    });

    revalidatePath("/exams/mark");
    revalidatePath(`/exams/${markingResult.examId}/results`);

    return { success: true };
  } catch (error) {
    console.error("Review AI grade error:", error);
    return {
      success: false,
      error: "Failed to review AI grade",
      code: "REVIEW_FAILED",
      details: error instanceof Error ? error.message : undefined,
    };
  }
}

/**
 * Get grade override history for a marking result
 */
export async function getGradeOverrides(
  markingResultId: string
): Promise<
  ActionResponse<
    Array<{
      id: string;
      previousScore: number;
      newScore: number;
      reason: string;
      overriddenBy: string;
      overriddenAt: Date;
    }>
  >
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

    const overrides = await db.gradeOverride.findMany({
      where: {
        markingResultId,
        schoolId,
      },
      orderBy: { overriddenAt: "desc" },
      select: {
        id: true,
        previousScore: true,
        newScore: true,
        reason: true,
        overriddenBy: true,
        overriddenAt: true,
      },
    });

    return {
      success: true,
      data: overrides.map(o => ({
        ...o,
        previousScore: Number(o.previousScore),
        newScore: Number(o.newScore),
      })),
    };
  } catch (error) {
    console.error("Get grade overrides error:", error);
    return {
      success: false,
      error: "Failed to retrieve override history",
      code: "FETCH_FAILED",
      details: error instanceof Error ? error.message : undefined,
    };
  }
}