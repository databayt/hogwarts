"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

interface TemplateOption {
  id: string
  name: string
  subjectName: string
  duration: number
  totalMarks: number
  questionCount: number
}

/** List active templates for the school */
export async function getAvailableTemplates(): Promise<
  ActionResponse<TemplateOption[]>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const templates = await db.examTemplate.findMany({
      where: { schoolId, isActive: true, wizardStep: null },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        duration: true,
        totalMarks: true,
        distribution: true,
        subject: { select: { subjectName: true } },
      },
    })

    const data: TemplateOption[] = templates.map((t) => {
      // Calculate total questions from distribution JSON
      let questionCount = 0
      if (t.distribution && typeof t.distribution === "object") {
        const dist = t.distribution as Record<
          string,
          Record<string, number> | number
        >
        for (const typeKey of Object.keys(dist)) {
          const val = dist[typeKey]
          if (typeof val === "number") {
            questionCount += val
          } else if (typeof val === "object" && val !== null) {
            for (const diffKey of Object.keys(val)) {
              questionCount += val[diffKey] || 0
            }
          }
        }
      }

      return {
        id: t.id,
        name: t.name,
        subjectName: t.subject?.subjectName || "Unknown",
        duration: t.duration,
        totalMarks: Number(t.totalMarks),
        questionCount,
      }
    })

    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to load templates",
    }
  }
}

/** Select a template for the generated exam */
export async function selectTemplate(
  generatedExamId: string,
  templateId: string
): Promise<ActionResponse> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    // Verify template belongs to school
    const template = await db.examTemplate.findFirst({
      where: { id: templateId, schoolId, isActive: true },
      select: { id: true, subjectId: true },
    })

    if (!template) {
      return { success: false, error: "Template not found" }
    }

    await db.generatedExam.updateMany({
      where: { id: generatedExamId, schoolId },
      data: { templateId },
    })

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to select template",
    }
  }
}
