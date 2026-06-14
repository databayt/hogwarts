"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Read/write the school's report-card (grade) template. The template is stored
 * as JSON on SchoolGradingConfig.reportCardTemplate; report-card PDF rendering
 * reads it to lay out the printable/shareable card.
 */
import { revalidatePath } from "next/cache"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { DEFAULT_REPORT_CARD_TEMPLATE, type ReportCardTemplate } from "./types"
import { reportCardTemplateSchema } from "./validation"

export async function getReportCardTemplate(): Promise<
  ActionResponse<ReportCardTemplate>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const config = await db.schoolGradingConfig.findUnique({
      where: { schoolId },
      select: { reportCardTemplate: true },
    })

    const stored = config?.reportCardTemplate as ReportCardTemplate | null
    return {
      success: true,
      data: stored ?? DEFAULT_REPORT_CARD_TEMPLATE,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load template",
    }
  }
}

export async function saveReportCardTemplate(
  input: unknown
): Promise<ActionResponse<{ saved: true }>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const parsed = reportCardTemplateSchema.safeParse(input)
    if (!parsed.success) return actionError(ACTION_ERRORS.VALIDATION_ERROR)

    await db.schoolGradingConfig.upsert({
      where: { schoolId },
      create: {
        schoolId,
        reportCardTemplate: parsed.data as object,
      },
      update: {
        reportCardTemplate: parsed.data as object,
      },
    })

    revalidatePath("/grades/templates")
    return { success: true, data: { saved: true } }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save template",
    }
  }
}
