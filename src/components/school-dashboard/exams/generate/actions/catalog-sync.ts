"use server"

import { auth } from "@/auth"

import { db } from "@/lib/db"

// ============================================================================
// Sync-back: when contributor school updates their template, sync to catalog
// ============================================================================

/**
 * Sync school ExamTemplate changes back to its CatalogExamTemplate.
 * Only syncs if the school is the original contributor.
 */
export async function syncTemplateBackToCatalog(
  templateId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return { success: false, error: "Unauthorized" }
    }

    const schoolId = session.user.schoolId

    const template = await db.examTemplate.findFirst({
      where: { id: templateId, schoolId },
    })

    if (!template?.catalogExamTemplateId) {
      return { success: false, error: "No catalog link" }
    }

    // Only sync if we're the contributor
    const catalogTemplate = await db.catalogExamTemplate.findFirst({
      where: {
        id: template.catalogExamTemplateId,
        contributedSchoolId: schoolId,
      },
    })

    if (!catalogTemplate) {
      return { success: false, error: "Not the original contributor" }
    }

    await db.catalogExamTemplate.update({
      where: { id: catalogTemplate.id },
      data: {
        name: template.name,
        description: template.description,
        duration: template.duration,
        totalMarks: template.totalMarks,
        distribution: template.distribution as any,
        bloomDistribution: template.bloomDistribution ?? undefined,
      },
    })

    return { success: true }
  } catch (error) {
    console.error("Sync template back to catalog error:", error)
    return { success: false, error: "Sync failed" }
  }
}

/**
 * Handle template deletion: preserve catalog if other adopters exist.
 */
export async function handleTemplateDeletion(
  templateId: string
): Promise<{ success: boolean; catalogPreserved?: boolean }> {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return { success: false }
    }

    const schoolId = session.user.schoolId

    const template = await db.examTemplate.findFirst({
      where: { id: templateId, schoolId },
    })

    if (!template?.catalogExamTemplateId) {
      return { success: true, catalogPreserved: false }
    }

    // Check if other schools have adopted this catalog template
    const otherAdopters = await db.examTemplate.count({
      where: {
        catalogExamTemplateId: template.catalogExamTemplateId,
        id: { not: templateId },
      },
    })

    if (otherAdopters === 0) {
      // No other adopters and we're the contributor - can delete catalog too
      const catalogTemplate = await db.catalogExamTemplate.findFirst({
        where: {
          id: template.catalogExamTemplateId,
          contributedSchoolId: schoolId,
        },
      })

      if (catalogTemplate) {
        await db.catalogExamTemplate.delete({
          where: { id: catalogTemplate.id },
        })
        return { success: true, catalogPreserved: false }
      }
    }

    // Other adopters exist - preserve catalog, just unlink
    return { success: true, catalogPreserved: true }
  } catch (error) {
    console.error("Handle template deletion error:", error)
    return { success: false }
  }
}
