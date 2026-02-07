"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import type { CurriculumStandard } from "@prisma/client"

import { db } from "@/lib/db"

import {
  curriculumStandardSchema,
  linkQuestionToStandardsSchema,
  updateCurriculumStandardSchema,
  type StandardFiltersSchema,
} from "../validation-standards"
import type { ActionResponse } from "./types"

// ========== Create Curriculum Standard ==========

/**
 * Create a new curriculum standard
 */
export async function createCurriculumStandard(
  formData: FormData
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return {
        success: false,
        error: "Unauthorized - No school context",
        code: "NO_SCHOOL_CONTEXT",
      }
    }

    const schoolId = session.user.schoolId
    const data = Object.fromEntries(formData)

    // Parse boolean field
    if (typeof data.isActive === "string") {
      ;(data as any).isActive = data.isActive === "true"
    }

    const validated = curriculumStandardSchema.parse(data)

    // Check for duplicate code within school
    const existing = await db.curriculumStandard.findFirst({
      where: {
        schoolId,
        code: validated.code,
      },
    })

    if (existing) {
      return {
        success: false,
        error: `Standard with code "${validated.code}" already exists`,
        code: "DUPLICATE_CODE",
      }
    }

    // Verify parent exists if provided
    if (validated.parentId) {
      const parent = await db.curriculumStandard.findFirst({
        where: {
          id: validated.parentId,
          schoolId,
        },
      })

      if (!parent) {
        return {
          success: false,
          error: "Parent standard not found",
          code: "PARENT_NOT_FOUND",
        }
      }
    }

    const standard = await db.curriculumStandard.create({
      data: {
        ...validated,
        schoolId,
      },
    })

    revalidatePath("/exams/qbank")
    revalidatePath("/exams/standards")

    return {
      success: true,
      data: { id: standard.id },
    }
  } catch (error) {
    console.error("Create curriculum standard error:", error)

    if (error instanceof Error && error.message.includes("validation")) {
      return {
        success: false,
        error: "Invalid standard data",
        code: "VALIDATION_ERROR",
        details: error.message,
      }
    }

    return {
      success: false,
      error: "Failed to create curriculum standard",
      code: "CREATE_FAILED",
      details: error instanceof Error ? error.message : undefined,
    }
  }
}

// ========== Get Curriculum Standards ==========

/**
 * Get curriculum standards with optional filters
 */
export async function getCurriculumStandards(
  filters?: StandardFiltersSchema
): Promise<CurriculumStandard[]> {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      throw new Error("Unauthorized - No school context")
    }

    const schoolId = session.user.schoolId

    const standards = await db.curriculumStandard.findMany({
      where: {
        schoolId, // CRITICAL: Multi-tenant scope
        ...(filters?.subjectArea && { subjectArea: filters.subjectArea }),
        ...(filters?.gradeLevel && { gradeLevel: filters.gradeLevel }),
        ...(filters?.framework && { framework: filters.framework }),
        ...(filters?.parentId !== undefined && { parentId: filters.parentId }),
        ...(filters?.domain && { domain: filters.domain }),
        ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
        ...(filters?.search && {
          OR: [
            {
              code: {
                contains: filters.search,
                mode: "insensitive",
              },
            },
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
        parent: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        _count: {
          select: {
            children: true,
            questions: true,
          },
        },
      },
      orderBy: [{ code: "asc" }],
    })

    return standards
  } catch (error) {
    console.error("Get curriculum standards error:", error)
    throw error
  }
}

// ========== Update Curriculum Standard ==========

/**
 * Update an existing curriculum standard
 */
export async function updateCurriculumStandard(
  formData: FormData
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return {
        success: false,
        error: "Unauthorized - No school context",
        code: "NO_SCHOOL_CONTEXT",
      }
    }

    const schoolId = session.user.schoolId
    const data = Object.fromEntries(formData)
    const standardId = data.id as string

    if (!standardId) {
      return {
        success: false,
        error: "Standard ID is required",
        code: "MISSING_ID",
      }
    }

    // Parse boolean field
    if (typeof data.isActive === "string") {
      ;(data as any).isActive = data.isActive === "true"
    }

    // Remove id from data before validation
    delete data.id

    const validated = updateCurriculumStandardSchema.parse({
      id: standardId,
      ...data,
    })

    // Check if standard exists
    const existing = await db.curriculumStandard.findFirst({
      where: {
        id: standardId,
        schoolId,
      },
    })

    if (!existing) {
      return {
        success: false,
        error: "Standard not found",
        code: "STANDARD_NOT_FOUND",
      }
    }

    // Check for duplicate code if code is being changed
    if (validated.code && validated.code !== existing.code) {
      const duplicate = await db.curriculumStandard.findFirst({
        where: {
          schoolId,
          code: validated.code,
          id: { not: standardId },
        },
      })

      if (duplicate) {
        return {
          success: false,
          error: `Standard with code "${validated.code}" already exists`,
          code: "DUPLICATE_CODE",
        }
      }
    }

    // Verify parent exists if being changed
    if (validated.parentId && validated.parentId !== existing.parentId) {
      // Prevent self-reference
      if (validated.parentId === standardId) {
        return {
          success: false,
          error: "A standard cannot be its own parent",
          code: "SELF_REFERENCE",
        }
      }

      const parent = await db.curriculumStandard.findFirst({
        where: {
          id: validated.parentId,
          schoolId,
        },
      })

      if (!parent) {
        return {
          success: false,
          error: "Parent standard not found",
          code: "PARENT_NOT_FOUND",
        }
      }

      // Prevent circular reference (check if new parent is a descendant)
      const descendants = await getDescendants(standardId, schoolId)
      if (descendants.some((d) => d.id === validated.parentId)) {
        return {
          success: false,
          error: "Cannot set a descendant as parent (circular reference)",
          code: "CIRCULAR_REFERENCE",
        }
      }
    }

    const { id, ...updateData } = validated

    const standard = await db.curriculumStandard.update({
      where: {
        id: standardId,
        schoolId, // CRITICAL: Multi-tenant scope
      },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    })

    revalidatePath("/exams/qbank")
    revalidatePath("/exams/standards")

    return {
      success: true,
      data: { id: standard.id },
    }
  } catch (error) {
    console.error("Update curriculum standard error:", error)

    if (error instanceof Error && error.message.includes("validation")) {
      return {
        success: false,
        error: "Invalid standard data",
        code: "VALIDATION_ERROR",
        details: error.message,
      }
    }

    return {
      success: false,
      error: "Failed to update curriculum standard",
      code: "UPDATE_FAILED",
      details: error instanceof Error ? error.message : undefined,
    }
  }
}

// ========== Delete Curriculum Standard ==========

/**
 * Delete a curriculum standard (only if no linked questions)
 */
export async function deleteCurriculumStandard(
  standardId: string
): Promise<ActionResponse> {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return {
        success: false,
        error: "Unauthorized - No school context",
        code: "NO_SCHOOL_CONTEXT",
      }
    }

    const schoolId = session.user.schoolId

    // Check if standard has linked questions
    const questionCount = await db.questionStandard.count({
      where: {
        standardId,
        schoolId,
      },
    })

    if (questionCount > 0) {
      return {
        success: false,
        error: `Cannot delete: standard is linked to ${questionCount} question(s)`,
        code: "STANDARD_IN_USE",
      }
    }

    // Check if standard has children
    const childCount = await db.curriculumStandard.count({
      where: {
        parentId: standardId,
        schoolId,
      },
    })

    if (childCount > 0) {
      return {
        success: false,
        error: `Cannot delete: standard has ${childCount} child standard(s)`,
        code: "HAS_CHILDREN",
      }
    }

    await db.curriculumStandard.delete({
      where: {
        id: standardId,
        schoolId, // CRITICAL: Multi-tenant scope
      },
    })

    revalidatePath("/exams/qbank")
    revalidatePath("/exams/standards")

    return { success: true }
  } catch (error) {
    console.error("Delete curriculum standard error:", error)
    return {
      success: false,
      error: "Failed to delete curriculum standard",
      code: "DELETE_FAILED",
      details: error instanceof Error ? error.message : undefined,
    }
  }
}

// ========== Link Question to Standards ==========

/**
 * Link a question to curriculum standards (replaces existing links)
 */
export async function linkQuestionToStandards(data: {
  questionId: string
  standardIds: string[]
}): Promise<ActionResponse> {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return {
        success: false,
        error: "Unauthorized - No school context",
        code: "NO_SCHOOL_CONTEXT",
      }
    }

    const schoolId = session.user.schoolId
    const validated = linkQuestionToStandardsSchema.parse(data)

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

    // Verify all standards exist and belong to school
    if (validated.standardIds.length > 0) {
      const standards = await db.curriculumStandard.findMany({
        where: {
          id: { in: validated.standardIds },
          schoolId,
        },
      })

      if (standards.length !== validated.standardIds.length) {
        return {
          success: false,
          error: "One or more standards not found",
          code: "STANDARDS_NOT_FOUND",
        }
      }
    }

    // Replace existing links with new ones in transaction
    await db.$transaction(async (tx) => {
      // Delete existing links
      await tx.questionStandard.deleteMany({
        where: {
          questionId: validated.questionId,
          schoolId,
        },
      })

      // Create new links
      if (validated.standardIds.length > 0) {
        await tx.questionStandard.createMany({
          data: validated.standardIds.map((standardId) => ({
            questionId: validated.questionId,
            standardId,
            schoolId,
          })),
        })
      }
    })

    revalidatePath("/exams/qbank")
    revalidatePath(`/exams/qbank/${validated.questionId}`)

    return { success: true }
  } catch (error) {
    console.error("Link question to standards error:", error)

    if (error instanceof Error && error.message.includes("validation")) {
      return {
        success: false,
        error: "Invalid link data",
        code: "VALIDATION_ERROR",
        details: error.message,
      }
    }

    return {
      success: false,
      error: "Failed to link question to standards",
      code: "LINK_FAILED",
      details: error instanceof Error ? error.message : undefined,
    }
  }
}

// ========== Get Question Standards ==========

/**
 * Get all standards linked to a question
 */
export async function getQuestionStandards(
  questionId: string
): Promise<CurriculumStandard[]> {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      throw new Error("Unauthorized - No school context")
    }

    const schoolId = session.user.schoolId

    const questionStandards = await db.questionStandard.findMany({
      where: {
        questionId,
        schoolId, // CRITICAL: Multi-tenant scope
      },
      include: {
        standard: {
          include: {
            parent: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        standard: {
          code: "asc",
        },
      },
    })

    return questionStandards.map((qs) => qs.standard)
  } catch (error) {
    console.error("Get question standards error:", error)
    throw error
  }
}

// ========== Get Standard Questions ==========

/**
 * Get all questions linked to a standard
 */
export async function getStandardQuestions(standardId: string): Promise<
  Array<{
    id: string
    questionText: string
    questionType: string
    difficulty: string
    bloomLevel: string
    points: number
  }>
> {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      throw new Error("Unauthorized - No school context")
    }

    const schoolId = session.user.schoolId

    const questionStandards = await db.questionStandard.findMany({
      where: {
        standardId,
        schoolId, // CRITICAL: Multi-tenant scope
      },
      include: {
        question: {
          select: {
            id: true,
            questionText: true,
            questionType: true,
            difficulty: true,
            bloomLevel: true,
            points: true,
          },
        },
      },
      orderBy: {
        question: {
          questionText: "asc",
        },
      },
    })

    return questionStandards.map((qs) => ({
      ...qs.question,
      points: Number(qs.question.points),
    }))
  } catch (error) {
    console.error("Get standard questions error:", error)
    throw error
  }
}

// ========== Helper Functions ==========

/**
 * Get all descendants of a standard (for circular reference prevention)
 */
async function getDescendants(
  standardId: string,
  schoolId: string
): Promise<CurriculumStandard[]> {
  const children = await db.curriculumStandard.findMany({
    where: {
      parentId: standardId,
      schoolId,
    },
  })

  const allDescendants: CurriculumStandard[] = [...children]

  for (const child of children) {
    const childDescendants = await getDescendants(child.id, schoolId)
    allDescendants.push(...childDescendants)
  }

  return allDescendants
}
