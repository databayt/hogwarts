"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import type { Prisma } from "@prisma/client"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

interface SaveTemplateInput {
  id?: string
  name: string
  description?: string
  subjectId: string
  duration: number
  totalMarks: number
  distribution: Record<string, Record<string, number>>
  blockConfig?: Prisma.InputJsonValue
  scoringConfig?: Prisma.InputJsonValue
  printConfig?: Prisma.InputJsonValue
}

export async function saveTemplate(
  input: SaveTemplateInput
): Promise<{ success: boolean; error?: string; templateId?: string }> {
  try {
    const session = await auth()
    if (!session?.user) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    const role = session.user.role
    if (
      !role ||
      ["STUDENT", "GUARDIAN", "ACCOUNTANT", "STAFF"].includes(role)
    ) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    if (!input.name || !input.subjectId) {
      return actionError(ACTION_ERRORS.EXAM_UPDATE_FAILED)
    }

    // Calculate total marks from distribution if not provided
    const totalQuestions = Object.values(input.distribution).reduce(
      (sum, difficulties) =>
        sum + Object.values(difficulties).reduce((a, b) => a + b, 0),
      0
    )

    if (input.id) {
      // Update existing template
      const existing = await db.schoolExamTemplate.findUnique({
        where: { id: input.id, schoolId },
      })
      if (!existing) {
        return actionError(ACTION_ERRORS.NOT_FOUND)
      }

      await db.schoolExamTemplate.update({
        where: { id: input.id },
        data: {
          name: input.name,
          description: input.description || null,
          subjectId: input.subjectId,
          duration: input.duration,
          totalMarks: input.totalMarks,
          distribution: input.distribution,
          blockConfig: input.blockConfig ?? undefined,
          scoringConfig: input.scoringConfig ?? undefined,
          printConfig: input.printConfig ?? undefined,
        },
      })

      revalidatePath("/exams/generate")
      return { success: true, templateId: input.id }
    }

    // Create new template
    const template = await db.schoolExamTemplate.create({
      data: {
        schoolId,
        name: input.name,
        description: input.description || null,
        subjectId: input.subjectId,
        duration: input.duration,
        totalMarks: input.totalMarks,
        distribution: input.distribution,
        blockConfig: input.blockConfig ?? undefined,
        scoringConfig: input.scoringConfig ?? undefined,
        printConfig: input.printConfig ?? undefined,
        createdBy: session.user.id!,
      },
    })

    revalidatePath("/exams/generate")
    return { success: true, templateId: template.id }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save template",
    }
  }
}
