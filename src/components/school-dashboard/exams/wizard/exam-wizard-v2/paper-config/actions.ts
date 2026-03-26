"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { paperConfigSchema, type PaperConfigFormData } from "./validation"

/** Create or update paper config for a generated exam */
export async function updatePaperConfig(
  generatedExamId: string,
  input: PaperConfigFormData
): Promise<ActionResponse> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const parsed = paperConfigSchema.parse(input)

    // Verify generated exam belongs to school
    const genExam = await db.generatedExam.findFirst({
      where: { id: generatedExamId, schoolId },
      select: { id: true },
    })

    if (!genExam) {
      return actionError(ACTION_ERRORS.EXAM_NOT_FOUND)
    }

    // Upsert paper config
    await db.examPaperConfig.upsert({
      where: { generatedExamId },
      create: {
        schoolId,
        generatedExamId,
        template: parsed.template,
        pageSize: parsed.pageSize,
        shuffleQuestions: parsed.shuffleQuestions,
        shuffleOptions: parsed.shuffleOptions,
        versionCount: parsed.versionCount,
        showSchoolLogo: parsed.showSchoolLogo,
        showInstructions: parsed.showInstructions,
        showPointsPerQuestion: parsed.showPointsPerQuestion,
      },
      update: {
        template: parsed.template,
        pageSize: parsed.pageSize,
        shuffleQuestions: parsed.shuffleQuestions,
        shuffleOptions: parsed.shuffleOptions,
        versionCount: parsed.versionCount,
        showSchoolLogo: parsed.showSchoolLogo,
        showInstructions: parsed.showInstructions,
        showPointsPerQuestion: parsed.showPointsPerQuestion,
      },
    })

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save",
    }
  }
}
