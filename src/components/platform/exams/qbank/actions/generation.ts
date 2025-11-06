"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { examGeneratorSchema } from "../validation";
import { generateExamQuestions, generateExamPreview } from "../../generate/utils";
import type {
  ActionResponse,
  GenerateExamData,
  GenerationResult,
} from "./types";

/**
 * Generate an exam using a template or custom distribution
 */
export async function generateExam(
  formData: FormData
): Promise<ActionResponse<GenerationResult>> {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.schoolId) {
      return {
        success: false,
        error: "Unauthorized - No school context",
        code: "NO_SCHOOL_CONTEXT",
      };
    }

    const schoolId = session.user.schoolId;
    const userId = session.user.id;

    const data = Object.fromEntries(formData);

    // Parse JSON fields
    if (
      typeof data.customDistribution === "string" &&
      data.customDistribution
    ) {
      data.customDistribution = JSON.parse(data.customDistribution);
    }
    if (typeof data.questionIds === "string" && data.questionIds) {
      data.questionIds = JSON.parse(data.questionIds);
    }

    const validated = examGeneratorSchema.parse(data);

    // Verify exam exists and belongs to school
    const exam = await db.exam.findFirst({
      where: {
        id: validated.examId,
        schoolId,
      },
      select: {
        id: true,
        subjectId: true,
        title: true,
      },
    });

    if (!exam) {
      return {
        success: false,
        error: "Exam not found",
        code: "EXAM_NOT_FOUND",
      };
    }

    // Get distribution from template or use custom
    let distribution = validated.customDistribution;
    let templateId = validated.templateId;

    if (templateId && !distribution) {
      const template = await db.examTemplate.findFirst({
        where: {
          id: templateId,
          schoolId,
        },
      });

      if (!template) {
        return {
          success: false,
          error: "Template not found",
          code: "TEMPLATE_NOT_FOUND",
        };
      }

      distribution = template.distribution as Record<
        string,
        Record<string, number>
      >;
    }

    if (!distribution) {
      return {
        success: false,
        error: "No distribution provided",
        code: "MISSING_DISTRIBUTION",
      };
    }

    // Get available questions for the subject
    const availableQuestions = await db.questionBank.findMany({
      where: {
        schoolId,
        subjectId: exam.subjectId,
        ...(validated.questionIds && {
          id: {
            in: validated.questionIds,
          },
        }),
      },
      include: {
        analytics: true,
      },
    });

    if (availableQuestions.length === 0) {
      return {
        success: false,
        error: "No questions available for this subject",
        code: "NO_QUESTIONS",
      };
    }

    // Generate exam using algorithm
    const result = generateExamQuestions(
      availableQuestions,
      distribution,
      undefined,
      validated.isRandomized,
      validated.seed
    );

    if (!result.metadata.distributionMet) {
      return {
        success: false,
        error: `Cannot generate exam: Missing questions for ${result.metadata.missingCategories.join(
          ", "
        )}`,
        code: "DISTRIBUTION_NOT_MET",
        details: {
          missingCategories: result.metadata.missingCategories,
        },
      };
    }

    // Create generated exam with questions in transaction
    const generatedExam = await db.$transaction(async (tx) => {
      // Create generated exam record
      const exam = await tx.generatedExam.create({
        data: {
          schoolId,
          examId: validated.examId,
          templateId,
          isRandomized: validated.isRandomized || false,
          seed: validated.seed,
          totalQuestions: result.selectedQuestions.length,
          generationNotes: validated.generationNotes,
          generatedBy: userId,
        },
      });

      // Create question associations
      await tx.generatedExamQuestion.createMany({
        data: result.selectedQuestions.map((q, index) => ({
          schoolId,
          generatedExamId: exam.id,
          questionId: q.id,
          order: index + 1,
          points: q.points,
        })),
      });

      return exam;
    });

    revalidatePath("/exams");
    revalidatePath("/exams/generate");
    revalidatePath(`/exams/${validated.examId}`);

    return {
      success: true,
      data: {
        generatedExamId: generatedExam.id,
        totalQuestions: generatedExam.totalQuestions,
        metadata: result.metadata,
      },
    };
  } catch (error) {
    console.error("Generate exam error:", error);

    if (error instanceof Error && error.message.includes("validation")) {
      return {
        success: false,
        error: "Invalid generation data",
        code: "VALIDATION_ERROR",
        details: error.message,
      };
    }

    return {
      success: false,
      error: "Failed to generate exam",
      code: "GENERATION_FAILED",
      details: error instanceof Error ? error.message : undefined,
    };
  }
}

/**
 * Preview exam generation without saving
 */
export async function previewExamGeneration(
  formData: FormData
): Promise<ActionResponse<any>> {
  try {
    const session = await auth();
    if (!session?.user?.schoolId) {
      return {
        success: false,
        error: "Unauthorized - No school context",
        code: "NO_SCHOOL_CONTEXT",
      };
    }

    const schoolId = session.user.schoolId;
    const data = Object.fromEntries(formData);

    // Parse JSON fields
    if (
      typeof data.customDistribution === "string" &&
      data.customDistribution
    ) {
      data.customDistribution = JSON.parse(data.customDistribution);
    }

    const distribution = data.customDistribution as unknown as Record<
      string,
      Record<string, number>
    >;

    if (!distribution) {
      return {
        success: false,
        error: "No distribution provided",
        code: "MISSING_DISTRIBUTION",
      };
    }

    const subjectId = data.subjectId as string;
    if (!subjectId) {
      return {
        success: false,
        error: "Subject ID is required",
        code: "MISSING_SUBJECT",
      };
    }

    // Get available questions
    const availableQuestions = await db.questionBank.findMany({
      where: {
        schoolId,
        subjectId,
      },
      include: {
        analytics: true,
      },
    });

    // Generate preview
    const preview = generateExamPreview(availableQuestions);

    return {
      success: true,
      data: preview,
    };
  } catch (error) {
    console.error("Preview generation error:", error);
    return {
      success: false,
      error: "Failed to generate preview",
      code: "PREVIEW_FAILED",
      details: error instanceof Error ? error.message : undefined,
    };
  }
}

/**
 * Regenerate an exam with the same template but different randomization
 */
export async function regenerateExam(
  generatedExamId: string,
  newSeed?: string
): Promise<ActionResponse<GenerationResult>> {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.schoolId) {
      return {
        success: false,
        error: "Unauthorized - No school context",
        code: "NO_SCHOOL_CONTEXT",
      };
    }

    const schoolId = session.user.schoolId;
    const userId = session.user.id;

    // Get existing generated exam
    const existingExam = await db.generatedExam.findFirst({
      where: {
        id: generatedExamId,
        schoolId,
      },
      include: {
        template: true,
        exam: true,
      },
    });

    if (!existingExam) {
      return {
        success: false,
        error: "Generated exam not found",
        code: "EXAM_NOT_FOUND",
      };
    }

    // Use template distribution or fetch from existing questions
    let distribution: Record<string, Record<string, number>>;

    if (existingExam.template) {
      distribution = existingExam.template.distribution as any;
    } else {
      // Reconstruct distribution from existing questions
      const existingQuestions = await db.generatedExamQuestion.findMany({
        where: {
          generatedExamId,
          schoolId,
        },
        include: {
          question: true,
        },
      });

      distribution = {};
      for (const eq of existingQuestions) {
        const type = eq.question.questionType;
        const difficulty = eq.question.difficulty;

        if (!distribution[type]) distribution[type] = {};
        if (!distribution[type][difficulty]) distribution[type][difficulty] = 0;
        distribution[type][difficulty]++;
      }
    }

    // Get available questions
    const availableQuestions = await db.questionBank.findMany({
      where: {
        schoolId,
        subjectId: existingExam.exam.subjectId,
      },
      include: {
        analytics: true,
      },
    });

    // Generate new exam
    const result = generateExamQuestions(
      availableQuestions,
      distribution,
      undefined,
      true, // Always randomize for regeneration
      newSeed || undefined
    );

    if (!result.metadata.distributionMet) {
      return {
        success: false,
        error: `Cannot regenerate exam: Missing questions for ${result.metadata.missingCategories.join(
          ", "
        )}`,
        code: "DISTRIBUTION_NOT_MET",
      };
    }

    // Create new generated exam in transaction
    const newGeneratedExam = await db.$transaction(async (tx) => {
      const exam = await tx.generatedExam.create({
        data: {
          schoolId,
          examId: existingExam.examId,
          templateId: existingExam.templateId,
          isRandomized: true,
          seed: newSeed,
          totalQuestions: result.selectedQuestions.length,
          generationNotes: `Regenerated from exam ${generatedExamId}`,
          generatedBy: userId,
        },
      });

      await tx.generatedExamQuestion.createMany({
        data: result.selectedQuestions.map((q, index) => ({
          schoolId,
          generatedExamId: exam.id,
          questionId: q.id,
          order: index + 1,
          points: q.points,
        })),
      });

      return exam;
    });

    revalidatePath("/exams");
    revalidatePath("/exams/generate");

    return {
      success: true,
      data: {
        generatedExamId: newGeneratedExam.id,
        totalQuestions: newGeneratedExam.totalQuestions,
        metadata: result.metadata,
      },
    };
  } catch (error) {
    console.error("Regenerate exam error:", error);
    return {
      success: false,
      error: "Failed to regenerate exam",
      code: "REGENERATION_FAILED",
      details: error instanceof Error ? error.message : undefined,
    };
  }
}

/**
 * Delete a generated exam
 */
export async function deleteGeneratedExam(
  generatedExamId: string
): Promise<ActionResponse> {
  try {
    const session = await auth();
    if (!session?.user?.schoolId) {
      return {
        success: false,
        error: "Unauthorized - No school context",
        code: "NO_SCHOOL_CONTEXT",
      };
    }

    const schoolId = session.user.schoolId;

    // Delete in transaction
    await db.$transaction(async (tx) => {
      // Delete question associations first
      await tx.generatedExamQuestion.deleteMany({
        where: {
          generatedExamId,
          schoolId,
        },
      });

      // Delete generated exam
      await tx.generatedExam.delete({
        where: {
          id: generatedExamId,
          schoolId,
        },
      });
    });

    revalidatePath("/exams");
    revalidatePath("/exams/generate");

    return { success: true };
  } catch (error) {
    console.error("Delete generated exam error:", error);
    return {
      success: false,
      error: "Failed to delete generated exam",
      code: "DELETE_FAILED",
      details: error instanceof Error ? error.message : undefined,
    };
  }
}