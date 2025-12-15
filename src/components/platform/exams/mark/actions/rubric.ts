"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { db } from "@/lib/db"

import { createRubricSchema } from "../validation"
import type { ActionResponse, CreateRubricInput } from "./types"

/**
 * Create a grading rubric for a question
 */
export async function createRubric(
  data: FormData
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return {
        success: false,
        error: "Unauthorized - No school context",
        code: "NO_SCHOOL_CONTEXT",
      }
    }

    const formData = Object.fromEntries(data)

    // Parse criteria JSON if needed
    if (formData.criteria && typeof formData.criteria === "string") {
      formData.criteria = JSON.parse(formData.criteria)
    }

    const validated = createRubricSchema.parse(formData)

    // Verify question exists and belongs to school
    const question = await db.questionBank.findFirst({
      where: {
        id: validated.questionId,
        schoolId,
      },
    })

    if (!question) {
      return {
        success: false,
        error: "Question not found",
        code: "QUESTION_NOT_FOUND",
      }
    }

    // Check if rubric already exists for this question
    const existingRubric = await db.rubric.findFirst({
      where: {
        questionId: validated.questionId,
        schoolId,
      },
    })

    if (existingRubric) {
      return {
        success: false,
        error: "Rubric already exists for this question",
        code: "RUBRIC_EXISTS",
      }
    }

    // Calculate total points from criteria
    const totalPoints = validated.criteria.reduce(
      (sum, c) => sum + c.maxPoints,
      0
    )

    // Create rubric with criteria in a transaction
    const rubric = await db.$transaction(async (tx) => {
      const newRubric = await tx.rubric.create({
        data: {
          schoolId,
          questionId: validated.questionId,
          title: validated.title,
          description: validated.description,
          totalPoints,
        },
      })

      // Create all criteria
      await tx.rubricCriterion.createMany({
        data: validated.criteria.map((criterion) => ({
          schoolId,
          rubricId: newRubric.id,
          criterion: criterion.criterion,
          description: criterion.description,
          maxPoints: criterion.maxPoints,
          order: criterion.order,
        })),
      })

      return newRubric
    })

    revalidatePath("/exams/mark")
    revalidatePath(`/exams/qbank/${validated.questionId}`)

    return {
      success: true,
      data: { id: rubric.id },
    }
  } catch (error) {
    console.error("Create rubric error:", error)

    if (error instanceof Error && error.message.includes("validation")) {
      return {
        success: false,
        error: "Invalid rubric data",
        code: "VALIDATION_ERROR",
        details: error.message,
      }
    }

    return {
      success: false,
      error: "Failed to create rubric",
      code: "CREATE_FAILED",
      details: error instanceof Error ? error.message : undefined,
    }
  }
}

/**
 * Update an existing rubric
 */
export async function updateRubric(
  id: string,
  data: FormData
): Promise<ActionResponse> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return {
        success: false,
        error: "Unauthorized - No school context",
        code: "NO_SCHOOL_CONTEXT",
      }
    }

    const formData = Object.fromEntries(data)

    // Parse criteria JSON if needed
    if (formData.criteria && typeof formData.criteria === "string") {
      formData.criteria = JSON.parse(formData.criteria)
    }

    const validated = createRubricSchema.parse(formData)

    // Verify rubric exists and belongs to school
    const existingRubric = await db.rubric.findFirst({
      where: { id, schoolId },
    })

    if (!existingRubric) {
      return {
        success: false,
        error: "Rubric not found",
        code: "RUBRIC_NOT_FOUND",
      }
    }

    // Calculate total points from criteria
    const totalPoints = validated.criteria.reduce(
      (sum, c) => sum + c.maxPoints,
      0
    )

    // Update rubric and criteria in a transaction
    await db.$transaction(async (tx) => {
      // Update rubric
      await tx.rubric.update({
        where: { id },
        data: {
          title: validated.title,
          description: validated.description,
          totalPoints,
        },
      })

      // Delete existing criteria
      await tx.rubricCriterion.deleteMany({
        where: { rubricId: id },
      })

      // Create new criteria
      await tx.rubricCriterion.createMany({
        data: validated.criteria.map((criterion) => ({
          schoolId,
          rubricId: id,
          criterion: criterion.criterion,
          description: criterion.description,
          maxPoints: criterion.maxPoints,
          order: criterion.order,
        })),
      })
    })

    revalidatePath("/exams/mark")
    revalidatePath(`/exams/qbank/${existingRubric.questionId}`)

    return { success: true }
  } catch (error) {
    console.error("Update rubric error:", error)
    return {
      success: false,
      error: "Failed to update rubric",
      code: "UPDATE_FAILED",
      details: error instanceof Error ? error.message : undefined,
    }
  }
}

/**
 * Delete a rubric
 */
export async function deleteRubric(id: string): Promise<ActionResponse> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return {
        success: false,
        error: "Unauthorized - No school context",
        code: "NO_SCHOOL_CONTEXT",
      }
    }

    // Delete rubric and criteria in a transaction
    const deleted = await db.$transaction(async (tx) => {
      // Delete criteria first
      await tx.rubricCriterion.deleteMany({
        where: {
          rubric: {
            id,
            schoolId,
          },
        },
      })

      // Delete rubric
      return await tx.rubric.deleteMany({
        where: { id, schoolId },
      })
    })

    if (deleted.count === 0) {
      return {
        success: false,
        error: "Rubric not found",
        code: "RUBRIC_NOT_FOUND",
      }
    }

    revalidatePath("/exams/mark")
    revalidatePath("/exams/qbank")

    return { success: true }
  } catch (error) {
    console.error("Delete rubric error:", error)
    return {
      success: false,
      error: "Failed to delete rubric",
      code: "DELETE_FAILED",
      details: error instanceof Error ? error.message : undefined,
    }
  }
}
