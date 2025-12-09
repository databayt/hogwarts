"use server";

import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import type { AnnouncementTemplateType, AnnouncementScope, AnnouncementPriority, UserRole } from "@prisma/client";

export interface TemplateInput {
  name: string;
  description?: string;
  type?: AnnouncementTemplateType;
  titleEn?: string;
  titleAr?: string;
  bodyEn?: string;
  bodyAr?: string;
  scope?: AnnouncementScope;
  priority?: AnnouncementPriority;
  classId?: string;
  role?: UserRole;
}

/**
 * Get all templates for the current school
 */
export async function getTemplates() {
  const { schoolId } = await getTenantContext();
  if (!schoolId) {
    return { success: false, error: "Missing school context", data: [] };
  }

  try {
    const templates = await db.announcementTemplate.findMany({
      where: { schoolId },
      orderBy: [
        { isSystem: 'desc' },  // System templates first
        { createdAt: 'desc' }, // Then by date
      ],
    });

    return { success: true, data: templates };
  } catch (error) {
    console.error("[getTemplates] Error:", error);
    return { success: false, error: "Failed to fetch templates", data: [] };
  }
}

/**
 * Get a single template by ID
 */
export async function getTemplate(id: string) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) {
    return { success: false, error: "Missing school context" };
  }

  try {
    const template = await db.announcementTemplate.findFirst({
      where: { id, schoolId },
    });

    if (!template) {
      return { success: false, error: "Template not found" };
    }

    return { success: true, data: template };
  } catch (error) {
    console.error("[getTemplate] Error:", error);
    return { success: false, error: "Failed to fetch template" };
  }
}

/**
 * Create a new template (user-created, not system)
 */
export async function createTemplate(input: TemplateInput) {
  const session = await auth();
  const { schoolId } = await getTenantContext();

  if (!session?.user) {
    return { success: false, error: "Not authenticated" };
  }

  if (!schoolId) {
    return { success: false, error: "Missing school context" };
  }

  try {
    const template = await db.announcementTemplate.create({
      data: {
        schoolId,
        name: input.name,
        description: input.description,
        type: input.type || "custom",
        titleEn: input.titleEn,
        titleAr: input.titleAr,
        bodyEn: input.bodyEn,
        bodyAr: input.bodyAr,
        scope: input.scope || "school",
        priority: input.priority || "normal",
        classId: input.classId,
        role: input.role,
        isSystem: false,
        createdBy: session.user.id,
      },
    });

    revalidatePath("/announcements");
    return { success: true, data: { id: template.id } };
  } catch (error) {
    console.error("[createTemplate] Error:", error);
    // Check for unique constraint violation
    if ((error as { code?: string }).code === "P2002") {
      return { success: false, error: "A template with this name already exists" };
    }
    return { success: false, error: "Failed to create template" };
  }
}

/**
 * Update an existing template (only user-created)
 */
export async function updateTemplate(id: string, input: Partial<TemplateInput>) {
  const { schoolId } = await getTenantContext();

  if (!schoolId) {
    return { success: false, error: "Missing school context" };
  }

  try {
    // Can only update non-system templates
    const existing = await db.announcementTemplate.findFirst({
      where: { id, schoolId, isSystem: false },
    });

    if (!existing) {
      return { success: false, error: "Template not found or cannot be modified" };
    }

    await db.announcementTemplate.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description,
        type: input.type,
        titleEn: input.titleEn,
        titleAr: input.titleAr,
        bodyEn: input.bodyEn,
        bodyAr: input.bodyAr,
        scope: input.scope,
        priority: input.priority,
        classId: input.classId,
        role: input.role,
      },
    });

    revalidatePath("/announcements");
    return { success: true };
  } catch (error) {
    console.error("[updateTemplate] Error:", error);
    return { success: false, error: "Failed to update template" };
  }
}

/**
 * Delete a template (only user-created, not system)
 */
export async function deleteTemplate(id: string) {
  const { schoolId } = await getTenantContext();

  if (!schoolId) {
    return { success: false, error: "Missing school context" };
  }

  try {
    // Can only delete non-system templates
    const deleted = await db.announcementTemplate.deleteMany({
      where: { id, schoolId, isSystem: false },
    });

    if (deleted.count === 0) {
      return { success: false, error: "Template not found or cannot be deleted" };
    }

    revalidatePath("/announcements");
    return { success: true };
  } catch (error) {
    console.error("[deleteTemplate] Error:", error);
    return { success: false, error: "Failed to delete template" };
  }
}
