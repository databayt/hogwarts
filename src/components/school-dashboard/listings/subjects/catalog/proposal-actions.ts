"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { z } from "zod"

import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

// ============================================================================
// Authorization helper — ADMIN or DEVELOPER with schoolId
// ============================================================================

async function requireProposer() {
  const session = await auth()
  const userId = session?.user?.id
  const role = session?.user?.role

  if (!userId) {
    throw new Error("Unauthorized: must be logged in")
  }

  const allowedRoles = ["ADMIN", "DEVELOPER"]
  if (!role || !allowedRoles.includes(role)) {
    throw new Error("Unauthorized: ADMIN or DEVELOPER role required")
  }

  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    throw new Error("Missing school context")
  }

  return { userId, schoolId }
}

// ============================================================================
// Validation schemas
// ============================================================================

const subjectProposalDataSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
  department: z.string().min(1, "Department is required"),
  description: z.string().optional(),
  grades: z.array(z.number().int()).optional().default([]),
  levels: z.array(z.string()).optional().default([]),
  country: z.string().optional().default("SD"),
})

const chapterProposalDataSchema = z.object({
  name: z.string().min(1, "Chapter name is required"),
  description: z.string().optional(),
  sequenceOrder: z.number().int().optional().default(0),
})

const lessonProposalDataSchema = z.object({
  name: z.string().min(1, "Lesson name is required"),
  description: z.string().optional(),
  sequenceOrder: z.number().int().optional().default(0),
  durationMinutes: z.number().int().optional(),
})

const proposalSchemaByType: Record<string, z.ZodSchema> = {
  SUBJECT: subjectProposalDataSchema,
  CHAPTER: chapterProposalDataSchema,
  LESSON: lessonProposalDataSchema,
}

// ============================================================================
// Submit subject proposal
// ============================================================================

export async function submitSubjectProposal(
  data: z.infer<typeof subjectProposalDataSchema>
): Promise<ActionResponse<{ id: string }>> {
  try {
    const { userId, schoolId } = await requireProposer()
    const parsed = subjectProposalDataSchema.parse(data)

    const proposal = await db.catalogProposal.create({
      data: {
        schoolId,
        proposedBy: userId,
        type: "SUBJECT",
        status: "SUBMITTED",
        data: parsed as any,
      },
    })

    revalidatePath("/subjects")
    return { success: true, data: { id: proposal.id } }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to submit subject proposal",
    }
  }
}

// ============================================================================
// Submit chapter proposal
// ============================================================================

export async function submitChapterProposal(
  parentSubjectId: string,
  data: z.infer<typeof chapterProposalDataSchema>
): Promise<ActionResponse<{ id: string }>> {
  try {
    const { userId, schoolId } = await requireProposer()
    const parsed = chapterProposalDataSchema.parse(data)

    const proposal = await db.catalogProposal.create({
      data: {
        schoolId,
        proposedBy: userId,
        type: "CHAPTER",
        status: "SUBMITTED",
        parentSubjectId,
        data: parsed as any,
      },
    })

    revalidatePath("/subjects")
    return { success: true, data: { id: proposal.id } }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to submit chapter proposal",
    }
  }
}

// ============================================================================
// Submit lesson proposal
// ============================================================================

export async function submitLessonProposal(
  parentChapterId: string,
  data: z.infer<typeof lessonProposalDataSchema>
): Promise<ActionResponse<{ id: string }>> {
  try {
    const { userId, schoolId } = await requireProposer()
    const parsed = lessonProposalDataSchema.parse(data)

    const proposal = await db.catalogProposal.create({
      data: {
        schoolId,
        proposedBy: userId,
        type: "LESSON",
        status: "SUBMITTED",
        parentChapterId,
        data: parsed as any,
      },
    })

    revalidatePath("/subjects")
    return { success: true, data: { id: proposal.id } }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to submit lesson proposal",
    }
  }
}

// ============================================================================
// Get my school's proposals
// ============================================================================

export type ProposalListItem = {
  id: string
  type: string
  status: string
  data: any
  createdAt: string
  reviewNotes: string | null
  rejectionReason: string | null
}

export async function getMyProposals(): Promise<
  ActionResponse<ProposalListItem[]>
> {
  try {
    const { schoolId } = await requireProposer()

    const proposals = await db.catalogProposal.findMany({
      where: { schoolId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        type: true,
        status: true,
        data: true,
        createdAt: true,
        reviewNotes: true,
        rejectionReason: true,
      },
    })

    return {
      success: true,
      data: proposals.map((p) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
      })),
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch proposals",
    }
  }
}

// ============================================================================
// Update a draft proposal (only DRAFT or REJECTED can be edited)
// ============================================================================

export async function updateProposal(
  id: string,
  data: Record<string, unknown>
): Promise<ActionResponse> {
  try {
    const { schoolId } = await requireProposer()

    const proposal = await db.catalogProposal.findFirst({
      where: { id, schoolId },
      select: { status: true, type: true },
    })

    if (!proposal) {
      return { success: false, error: "Proposal not found" }
    }

    if (proposal.status !== "DRAFT" && proposal.status !== "REJECTED") {
      return {
        success: false,
        error: "Only DRAFT or REJECTED proposals can be edited",
      }
    }

    // Validate data against the appropriate schema for this proposal type
    const schema = proposalSchemaByType[proposal.type]
    if (!schema) {
      return {
        success: false,
        error: `Unknown proposal type: ${proposal.type}`,
      }
    }
    const parsed = schema.parse(data)

    await db.catalogProposal.update({
      where: { id },
      data: {
        data: parsed as any,
        status: "SUBMITTED",
        rejectionReason: null,
        reviewNotes: null,
      },
    })

    revalidatePath("/subjects")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update proposal",
    }
  }
}
