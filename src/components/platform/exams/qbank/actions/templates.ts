"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { examTemplateSchema } from "../validation";
import type {
  ActionResponse,
  CreateTemplateData,
  TemplateWithStats,
  TemplateFilters,
} from "./types";

/**
 * Create a new exam template
 */
export async function createTemplate(
  formData: FormData
): Promise<ActionResponse<{ id: string }>> {
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
    if (typeof data.distribution === "string") {
      data.distribution = JSON.parse(data.distribution);
    }
    if (typeof data.bloomDistribution === "string" && data.bloomDistribution) {
      data.bloomDistribution = JSON.parse(data.bloomDistribution);
    }

    const validated = examTemplateSchema.parse(data);

    // Verify subject exists and belongs to school
    const subject = await db.subject.findFirst({
      where: {
        id: validated.subjectId,
        schoolId,
      },
    });

    if (!subject) {
      return {
        success: false,
        error: "Subject not found",
        code: "SUBJECT_NOT_FOUND",
      };
    }

    const template = await db.examTemplate.create({
      data: {
        ...validated,
        schoolId,
        createdBy: userId,
      },
    });

    revalidatePath("/exams/templates");
    revalidatePath("/exams/generate");

    return {
      success: true,
      data: { id: template.id },
    };
  } catch (error) {
    console.error("Create template error:", error);

    if (error instanceof Error && error.message.includes("validation")) {
      return {
        success: false,
        error: "Invalid template data",
        code: "VALIDATION_ERROR",
        details: error.message,
      };
    }

    return {
      success: false,
      error: "Failed to create template",
      code: "CREATE_FAILED",
      details: error instanceof Error ? error.message : undefined,
    };
  }
}

/**
 * Update an existing template
 */
export async function updateTemplate(
  templateId: string,
  formData: FormData
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
    const data = Object.fromEntries(formData);

    // Parse JSON fields
    if (typeof data.distribution === "string") {
      data.distribution = JSON.parse(data.distribution);
    }
    if (typeof data.bloomDistribution === "string" && data.bloomDistribution) {
      data.bloomDistribution = JSON.parse(data.bloomDistribution);
    }

    const validated = examTemplateSchema.parse(data);

    // Update with schoolId scope
    await db.examTemplate.update({
      where: {
        id: templateId,
        schoolId, // CRITICAL: Multi-tenant scope
      },
      data: {
        ...validated,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/exams/templates");
    revalidatePath(`/exams/templates/${templateId}`);
    revalidatePath("/exams/generate");

    return { success: true };
  } catch (error) {
    console.error("Update template error:", error);
    return {
      success: false,
      error: "Failed to update template",
      code: "UPDATE_FAILED",
      details: error instanceof Error ? error.message : undefined,
    };
  }
}

/**
 * Delete an exam template
 */
export async function deleteTemplate(
  templateId: string
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

    // Check if template is used in any generated exams
    const usageCount = await db.generatedExam.count({
      where: {
        templateId,
        schoolId,
      },
    });

    if (usageCount > 0) {
      return {
        success: false,
        error: `Cannot delete: template is used in ${usageCount} exam(s)`,
        code: "TEMPLATE_IN_USE",
      };
    }

    // Delete with schoolId scope
    const deleted = await db.examTemplate.deleteMany({
      where: {
        id: templateId,
        schoolId, // CRITICAL: Multi-tenant scope
      },
    });

    if (deleted.count === 0) {
      return {
        success: false,
        error: "Template not found",
        code: "TEMPLATE_NOT_FOUND",
      };
    }

    revalidatePath("/exams/templates");
    revalidatePath("/exams/generate");

    return { success: true };
  } catch (error) {
    console.error("Delete template error:", error);
    return {
      success: false,
      error: "Failed to delete template",
      code: "DELETE_FAILED",
      details: error instanceof Error ? error.message : undefined,
    };
  }
}

/**
 * Get templates with filters
 */
export async function getTemplates(
  filters?: TemplateFilters
): Promise<TemplateWithStats[]> {
  try {
    const session = await auth();
    if (!session?.user?.schoolId) {
      throw new Error("Unauthorized - No school context");
    }

    const schoolId = session.user.schoolId;

    const templates = await db.examTemplate.findMany({
      where: {
        schoolId, // CRITICAL: Multi-tenant scope
        ...(filters?.subjectId && { subjectId: filters.subjectId }),
        ...(filters?.isActive !== undefined && {
          isActive: filters.isActive,
        }),
        ...(filters?.search && {
          OR: [
            {
              name: {
                contains: filters.search,
                mode: "insensitive",
              },
            },
            {
              description: {
                contains: filters.search,
                mode: "insensitive",
              },
            },
          ],
        }),
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

/**
 * Get a single template by ID
 */
export async function getTemplateById(
  templateId: string
): Promise<TemplateWithStats | null> {
  try {
    const session = await auth();
    if (!session?.user?.schoolId) {
      throw new Error("Unauthorized - No school context");
    }

    const schoolId = session.user.schoolId;

    const template = await db.examTemplate.findFirst({
      where: {
        id: templateId,
        schoolId, // CRITICAL: Multi-tenant scope
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
    });

    return template;
  } catch (error) {
    console.error("Get template error:", error);
    throw error;
  }
}

/**
 * Toggle template active status
 */
export async function toggleTemplateStatus(
  templateId: string
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

    // Get current status
    const template = await db.examTemplate.findFirst({
      where: {
        id: templateId,
        schoolId,
      },
      select: {
        isActive: true,
      },
    });

    if (!template) {
      return {
        success: false,
        error: "Template not found",
        code: "TEMPLATE_NOT_FOUND",
      };
    }

    // Toggle status
    await db.examTemplate.update({
      where: {
        id: templateId,
      },
      data: {
        isActive: !template.isActive,
      },
    });

    revalidatePath("/exams/templates");
    revalidatePath("/exams/generate");

    return { success: true };
  } catch (error) {
    console.error("Toggle template status error:", error);
    return {
      success: false,
      error: "Failed to update template status",
      code: "STATUS_UPDATE_FAILED",
      details: error instanceof Error ? error.message : undefined,
    };
  }
}

/**
 * Duplicate a template
 */
export async function duplicateTemplate(
  templateId: string
): Promise<ActionResponse<{ id: string }>> {
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

    // Get original template
    const original = await db.examTemplate.findFirst({
      where: {
        id: templateId,
        schoolId,
      },
    });

    if (!original) {
      return {
        success: false,
        error: "Template not found",
        code: "TEMPLATE_NOT_FOUND",
      };
    }

    // Destructure to exclude id and relation fields
    const {
      id,
      school,
      subject,
      generatedExams,
      ...templateData
    } = original as any;

    // Create duplicate
    const duplicate = await db.examTemplate.create({
      data: {
        ...templateData,
        name: `${original.name} (Copy)`,
        isActive: false, // Start as inactive
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        // Keep same school context
        schoolId,
      },
    });

    revalidatePath("/exams/templates");

    return {
      success: true,
      data: { id: duplicate.id },
    };
  } catch (error) {
    console.error("Duplicate template error:", error);
    return {
      success: false,
      error: "Failed to duplicate template",
      code: "DUPLICATE_FAILED",
      details: error instanceof Error ? error.message : undefined,
    };
  }
}