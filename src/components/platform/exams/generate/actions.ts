"use server";

/**
 * Exam Generation Server Actions
 *
 * This module handles the question bank CRUD operations and exam generation algorithm.
 *
 * KEY CONCEPTS:
 *
 * 1. QUESTION BANK:
 *    - Questions stored with metadata (type, difficulty, Bloom level, subject, tags)
 *    - Each question has paired QuestionAnalytics record for usage tracking
 *    - Source field distinguishes MANUAL vs IMPORTED questions
 *
 * 2. EXAM TEMPLATES:
 *    - Define distribution of questions (e.g., 10 easy MCQ, 5 medium short answer)
 *    - Can be reused across multiple exam generations
 *    - Store points per question type/difficulty combo
 *
 * 3. EXAM GENERATION ALGORITHM:
 *    - Takes template or custom distribution
 *    - Selects questions matching constraints (subject, type, difficulty, Bloom)
 *    - Applies randomization (optional seeding for reproducibility)
 *    - Validates enough questions exist before generating
 *    - See: ./utils.ts generateExamQuestions() for algorithm details
 *
 * 4. ANALYTICS TRACKING:
 *    - Updates question usage statistics after generation
 *    - Tracks average scores, pass rates, discrimination index
 *    - Used to improve question selection over time
 *
 * MULTI-TENANT: All operations scoped by schoolId from session
 */

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { QuestionType, DifficultyLevel, BloomLevel } from "@prisma/client";
import type {
  CreateQuestionResult,
  UpdateQuestionResult,
  DeleteQuestionResult,
  CreateTemplateResult,
  GenerateExamResult,
  ActionResult,
} from "./types";
import {
  questionBankSchema,
  examTemplateSchema,
  examGeneratorSchema,
  updateAnalyticsSchema,
} from "./validation";
import { generateExamQuestions, generateExamPreview } from "./utils";

// ========== Question Bank Actions ==========

export async function createQuestion(
  formData: FormData
): Promise<CreateQuestionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.schoolId) {
      return { success: false, error: "Unauthorized" };
    }

    const schoolId = session.user.schoolId;
    const userId = session.user.id;

    // Parse and validate
    const data = Object.fromEntries(formData);

    // Parse JSON fields
    if (typeof data.tags === "string") {
      data.tags = JSON.parse(data.tags);
    }
    if (typeof data.options === "string" && data.options) {
      data.options = JSON.parse(data.options);
    }
    if (typeof data.acceptedAnswers === "string" && data.acceptedAnswers) {
      data.acceptedAnswers = JSON.parse(data.acceptedAnswers);
    }

    const validated = questionBankSchema.parse(data);

    // Create question
    const question = await db.questionBank.create({
      data: {
        ...validated,
        schoolId,
        createdBy: userId,
        source: "MANUAL",
      },
    });

    // Create analytics record
    await db.questionAnalytics.create({
      data: {
        questionId: question.id,
        schoolId,
      },
    });

    revalidatePath("/exams/qbank");
    return { success: true, data: { id: question.id } };
  } catch (error) {
    console.error("Create question error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create question",
    };
  }
}

export async function updateQuestion(
  formData: FormData
): Promise<UpdateQuestionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.schoolId) {
      return { success: false, error: "Unauthorized" };
    }

    const schoolId = session.user.schoolId;
    const data = Object.fromEntries(formData);
    const questionId = data.id as string;

    // Parse JSON fields
    if (typeof data.tags === "string") {
      data.tags = JSON.parse(data.tags);
    }
    if (typeof data.options === "string" && data.options) {
      data.options = JSON.parse(data.options);
    }
    if (typeof data.acceptedAnswers === "string" && data.acceptedAnswers) {
      data.acceptedAnswers = JSON.parse(data.acceptedAnswers);
    }

    const validated = questionBankSchema.parse(data);

    // Update with schoolId scope
    const question = await db.questionBank.update({
      where: {
        id: questionId,
        schoolId, // CRITICAL: Multi-tenant scope
      },
      data: validated,
    });

    revalidatePath("/exams/qbank");
    revalidatePath(`/exams/qbank/${questionId}`);
    return { success: true, data: { id: question.id } };
  } catch (error) {
    console.error("Update question error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update question",
    };
  }
}

export async function deleteQuestion(
  questionId: string
): Promise<DeleteQuestionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.schoolId) {
      return { success: false, error: "Unauthorized" };
    }

    const schoolId = session.user.schoolId;

    // Check if question is used in any generated exams
    const usageCount = await db.generatedExamQuestion.count({
      where: {
        questionId,
        schoolId,
      },
    });

    if (usageCount > 0) {
      return {
        success: false,
        error: `Cannot delete: question is used in ${usageCount} exam(s)`,
      };
    }

    // Delete with schoolId scope
    await db.questionBank.delete({
      where: {
        id: questionId,
        schoolId, // CRITICAL: Multi-tenant scope
      },
    });

    revalidatePath("/exams/qbank");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Delete question error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete question",
    };
  }
}

export async function getQuestions(filters?: {
  subjectId?: string;
  questionType?: string;
  difficulty?: string;
  bloomLevel?: string;
  search?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.schoolId) {
      throw new Error("Unauthorized");
    }

    const schoolId = session.user.schoolId;

    const questions = await db.questionBank.findMany({
      where: {
        schoolId, // CRITICAL: Multi-tenant scope
        ...(filters?.subjectId && { subjectId: filters.subjectId }),
        ...(filters?.questionType && { questionType: filters.questionType as QuestionType }),
        ...(filters?.difficulty && { difficulty: filters.difficulty as DifficultyLevel }),
        ...(filters?.bloomLevel && { bloomLevel: filters.bloomLevel as BloomLevel }),
        ...(filters?.search && {
          questionText: {
            contains: filters.search,
            mode: "insensitive",
          },
        }),
      },
      include: {
        subject: {
          select: {
            id: true,
            subjectName: true,
          },
        },
        analytics: true,
        _count: {
          select: {
            generatedExamQuestions: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return questions;
  } catch (error) {
    console.error("Get questions error:", error);
    throw error;
  }
}

export async function getQuestionById(questionId: string) {
  try {
    const session = await auth();
    if (!session?.user?.schoolId) {
      throw new Error("Unauthorized");
    }

    const schoolId = session.user.schoolId;

    const question = await db.questionBank.findUnique({
      where: {
        id: questionId,
        schoolId, // CRITICAL: Multi-tenant scope
      },
      include: {
        subject: {
          select: {
            id: true,
            subjectName: true,
          },
        },
        analytics: true,
      },
    });

    return question;
  } catch (error) {
    console.error("Get question error:", error);
    throw error;
  }
}

// ========== Exam Template Actions ==========

export async function createTemplate(
  formData: FormData
): Promise<CreateTemplateResult> {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.schoolId) {
      return { success: false, error: "Unauthorized" };
    }

    const schoolId = session.user.schoolId;
    const userId = session.user.id;

    const data = Object.fromEntries(formData);

    // Parse JSON fields
    if (typeof data.distribution === "string") {
      data.distribution = JSON.parse(data.distribution);
    }
    if (typeof data.bloomDistribution === "string" && data.bloomDistribution) {
      data.bloomDistribution = JSON.parse(data.bloomDistribution);
    }

    const validated = examTemplateSchema.parse(data);

    const template = await db.examTemplate.create({
      data: {
        ...validated,
        schoolId,
        createdBy: userId,
      },
    });

    revalidatePath("/exams/generate/templates");
    return { success: true, data: { id: template.id } };
  } catch (error) {
    console.error("Create template error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create template",
    };
  }
}

export async function getTemplates(filters?: {
  subjectId?: string;
  isActive?: boolean;
}) {
  try {
    const session = await auth();
    if (!session?.user?.schoolId) {
      throw new Error("Unauthorized");
    }

    const schoolId = session.user.schoolId;

    const templates = await db.examTemplate.findMany({
      where: {
        schoolId, // CRITICAL: Multi-tenant scope
        ...(filters?.subjectId && { subjectId: filters.subjectId }),
        ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
      },
      include: {
        subject: {
          select: {
            id: true,
            subjectName: true,
          },
        },
        _count: {
          select: {
            generatedExams: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return templates;
  } catch (error) {
    console.error("Get templates error:", error);
    throw error;
  }
}

// ========== Exam Generation Actions ==========

export async function generateExam(
  formData: FormData
): Promise<GenerateExamResult> {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.schoolId) {
      return { success: false, error: "Unauthorized" };
    }

    const schoolId = session.user.schoolId;
    const userId = session.user.id;

    const data = Object.fromEntries(formData);

    if (typeof data.customDistribution === "string" && data.customDistribution) {
      data.customDistribution = JSON.parse(data.customDistribution);
    }
    if (typeof data.questionIds === "string" && data.questionIds) {
      data.questionIds = JSON.parse(data.questionIds);
    }

    const validated = examGeneratorSchema.parse(data);

    // Get template if specified
    let distribution = validated.customDistribution;
    if (validated.templateId && !distribution) {
      const template = await db.examTemplate.findUnique({
        where: {
          id: validated.templateId,
          schoolId,
        },
      });

      if (!template) {
        return { success: false, error: "Template not found" };
      }

      distribution = template.distribution as Record<string, Record<string, number>>;
    }

    if (!distribution) {
      return { success: false, error: "No distribution provided" };
    }

    // Get available questions
    const exam = await db.exam.findUnique({
      where: { id: validated.examId, schoolId },
    });

    if (!exam) {
      return { success: false, error: "Exam not found" };
    }

    const availableQuestions = await db.questionBank.findMany({
      where: {
        schoolId,
        subjectId: exam.subjectId,
      },
      include: {
        analytics: true,
      },
    });

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
        error: `Cannot generate exam: ${result.metadata.missingCategories.join(", ")}`,
      };
    }

    // Create generated exam
    const generatedExam = await db.generatedExam.create({
      data: {
        schoolId,
        examId: validated.examId,
        templateId: validated.templateId,
        isRandomized: validated.isRandomized,
        seed: validated.seed,
        totalQuestions: result.selectedQuestions.length,
        generationNotes: validated.generationNotes,
        generatedBy: userId,
      },
    });

    // Create question associations
    await db.generatedExamQuestion.createMany({
      data: result.selectedQuestions.map((q, index) => ({
        schoolId,
        generatedExamId: generatedExam.id,
        questionId: q.id,
        order: index + 1,
        points: q.points,
      })),
    });

    revalidatePath("/exams");
    revalidatePath("/exams/generate");
    return { success: true, data: { generatedExamId: generatedExam.id } };
  } catch (error) {
    console.error("Generate exam error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate exam",
    };
  }
}

// ========== Analytics Actions ==========

export async function updateQuestionAnalytics(
  questionId: string,
  score: number,
  maxPoints: number,
  timeSpent?: number
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.schoolId) {
      return { success: false, error: "Unauthorized" };
    }

    const schoolId = session.user.schoolId;

    const analytics = await db.questionAnalytics.findUnique({
      where: {
        questionId,
        schoolId, // CRITICAL: Multi-tenant scope
      },
    });

    if (!analytics) {
      return { success: false, error: "Analytics not found" };
    }

    // Calculate new averages
    const timesUsed = analytics.timesUsed + 1;
    const currentAvgScore = analytics.avgScore?.toNumber() || 0;
    const newAvgScore =
      (currentAvgScore * analytics.timesUsed + score) / timesUsed;

    const successRate = (newAvgScore / maxPoints) * 100;

    const currentAvgTime = analytics.avgTimeSpent || 0;
    const newAvgTime = timeSpent
      ? (currentAvgTime * analytics.timesUsed + timeSpent) / timesUsed
      : currentAvgTime;

    // Update analytics
    await db.questionAnalytics.update({
      where: {
        questionId,
      },
      data: {
        timesUsed,
        avgScore: newAvgScore,
        successRate,
        avgTimeSpent: newAvgTime,
        lastUsed: new Date(),
      },
    });

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Update analytics error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update analytics",
    };
  }
}

export async function getAnalyticsDashboard() {
  try {
    const session = await auth();
    if (!session?.user?.schoolId) {
      throw new Error("Unauthorized");
    }

    const schoolId = session.user.schoolId;

    const [totalQuestions, totalTemplates, totalGeneratedExams, questions] =
      await Promise.all([
        db.questionBank.count({ where: { schoolId } }),
        db.examTemplate.count({ where: { schoolId } }),
        db.generatedExam.count({ where: { schoolId } }),
        db.questionBank.findMany({
          where: { schoolId },
          include: {
            analytics: true,
            subject: {
              select: {
                subjectName: true,
              },
            },
          },
        }),
      ]);

    return {
      totalQuestions,
      totalTemplates,
      totalGeneratedExams,
      questions,
    };
  } catch (error) {
    console.error("Get analytics error:", error);
    throw error;
  }
}
