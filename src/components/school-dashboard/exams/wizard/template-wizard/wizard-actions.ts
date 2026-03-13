"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import type { Prisma } from "@prisma/client"

import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  DEFAULT_DECORATIONS,
  DEFAULT_GRADE_BOUNDARIES,
  INITIAL_STATE,
  type QuestionTypeConfig,
} from "../types"
import type { TemplateWizardData } from "./use-template-wizard"

/** Parse JSON fields from ExamTemplate into flat wizard data */
function parseTemplateToWizardData(template: {
  id: string
  schoolId: string
  name: string
  description: string | null
  subjectId: string
  duration: number
  totalMarks: number | { toNumber: () => number }
  wizardStep: string | null
  gradeIds: string[]
  sectionIds: string[]
  classroomIds: string[]
  distribution: Prisma.JsonValue
  blockConfig: Prisma.JsonValue
  scoringConfig: Prisma.JsonValue
  printConfig: Prisma.JsonValue
}): TemplateWizardData {
  const distribution =
    (template.distribution as Record<string, Record<string, number>>) || {}
  const blockConfig = (template.blockConfig as Record<string, unknown>) || {}
  const scoringConfig =
    (template.scoringConfig as Record<string, unknown>) || {}
  const printConfig = (template.printConfig as Record<string, unknown>) || {}

  const slots = (blockConfig.slots as Record<string, string>) || {}
  const decorations =
    (blockConfig.decorations as typeof DEFAULT_DECORATIONS) ||
    DEFAULT_DECORATIONS

  // Convert distribution to QuestionTypeConfig[]
  const questionTypes: QuestionTypeConfig[] = Object.entries(distribution).map(
    ([type, difficulties]) => ({
      type: type as QuestionTypeConfig["type"],
      count: Object.values(difficulties).reduce((a, b) => a + b, 0),
      difficulty: {
        EASY: difficulties.EASY || 0,
        MEDIUM: difficulties.MEDIUM || 0,
        HARD: difficulties.HARD || 0,
      },
    })
  )

  return {
    id: template.id,
    schoolId: template.schoolId,
    name: template.name,
    description: template.description,
    subjectId: template.subjectId,
    duration: template.duration,
    totalMarks:
      typeof template.totalMarks === "object"
        ? template.totalMarks.toNumber()
        : Number(template.totalMarks),
    wizardStep: template.wizardStep,
    gradeIds: template.gradeIds,
    sectionIds: template.sectionIds,
    classroomIds: template.classroomIds,
    distribution,
    questionTypes,
    examType: "MIDTERM",
    headerVariant: slots.header || "standard",
    footerVariant: slots.footer || "standard",
    studentInfoVariant: slots.studentInfo || "standard",
    instructionsVariant: slots.instructions || "standard",
    answerSheetVariant: slots.answerSheet || "standard",
    coverVariant: slots.cover || "standard",
    decorations,
    passingScore: (scoringConfig.passingScore as number) || 50,
    gradeBoundaries:
      (scoringConfig.gradeBoundaries as typeof DEFAULT_GRADE_BOUNDARIES) ||
      DEFAULT_GRADE_BOUNDARIES,
    pageSize: (printConfig.pageSize as "A4" | "LETTER") || "A4",
    orientation:
      (printConfig.orientation as "portrait" | "landscape") || "portrait",
    answerSheetType:
      (printConfig.answerSheetType as "NONE" | "SEPARATE" | "BUBBLE") ||
      "SEPARATE",
    layout:
      (printConfig.layout as "SINGLE_COLUMN" | "TWO_COLUMN" | "BOOKLET") ||
      "SINGLE_COLUMN",
    selectedPresetId: (blockConfig.selectedPresetId as string) || null,
  }
}

/** Fetch template data for the wizard */
export async function getTemplateForWizard(
  templateId: string
): Promise<
  | { success: true; data: TemplateWizardData }
  | { success: false; error: string }
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const template = await db.examTemplate.findFirst({
      where: { id: templateId, schoolId },
    })

    if (!template) return { success: false, error: "Template not found" }

    return {
      success: true,
      data: parseTemplateToWizardData(template),
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load template",
    }
  }
}

/** Create a draft template to start the wizard */
export async function createDraftTemplate(): Promise<
  ActionResponse<{ id: string }>
> {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    // Find the first available subject
    const firstSubject = await db.subject.findFirst({
      where: { schoolId },
      select: { id: true },
    })

    if (!firstSubject) {
      return {
        success: false,
        error: "No subjects found. Create a subject first.",
      }
    }

    const template = await db.examTemplate.create({
      data: {
        schoolId,
        name: "",
        subjectId: firstSubject.id,
        duration: INITIAL_STATE.duration,
        totalMarks: INITIAL_STATE.totalMarks,
        distribution: {},
        wizardStep: "gallery",
        createdBy: session.user.id!,
      },
    })

    return { success: true, data: { id: template.id } }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create template",
    }
  }
}

/** Mark the template wizard as complete */
export async function completeTemplateWizard(
  templateId: string
): Promise<ActionResponse> {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const template = await db.examTemplate.findFirst({
      where: { id: templateId, schoolId },
      select: { name: true },
    })

    if (!template) {
      return { success: false, error: "Template not found" }
    }

    if (!template.name?.trim()) {
      return {
        success: false,
        error: "Name is required before completing",
      }
    }

    await db.examTemplate.updateMany({
      where: { id: templateId, schoolId },
      data: { wizardStep: null },
    })

    revalidatePath("/exams/generate")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to complete template wizard",
    }
  }
}

/** Update the current wizard step for resumability */
export async function updateTemplateWizardStep(
  templateId: string,
  step: string
): Promise<void> {
  try {
    const session = await auth()
    if (!session?.user) return

    const { schoolId } = await getTenantContext()
    if (!schoolId) return

    await db.examTemplate.updateMany({
      where: { id: templateId, schoolId },
      data: { wizardStep: step },
    })
  } catch {
    // Non-critical, don't throw
  }
}

/** Delete an abandoned draft template */
export async function deleteDraftTemplate(
  templateId: string
): Promise<ActionResponse> {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const { count } = await db.examTemplate.deleteMany({
      where: { id: templateId, schoolId, wizardStep: { not: null } },
    })

    if (count === 0) {
      return { success: false, error: "Draft template not found" }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete draft template",
    }
  }
}
