"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { db } from "@/lib/db"

// ============================================================================
// Authorization helper — DEVELOPER only, NO schoolId needed
// ============================================================================

async function requireDeveloper() {
  const session = await auth()
  if (session?.user?.role !== "DEVELOPER") {
    throw new Error("Unauthorized: DEVELOPER role required")
  }
  return session
}

// ============================================================================
// Types
// ============================================================================

type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

export type ProposalReviewItem = {
  id: string
  type: string
  status: string
  data: any
  schoolId: string
  schoolName: string
  proposedBy: string
  createdAt: string
  parentSubjectId: string | null
  parentChapterId: string | null
}

// ============================================================================
// Get all proposals for review (SaaS operators)
// ============================================================================

export async function getProposalsForReview(
  statusFilter?: string
): Promise<ActionResponse<ProposalReviewItem[]>> {
  try {
    await requireDeveloper()

    const where: any = {}
    if (statusFilter) {
      where.status = statusFilter
    }

    const proposals = await db.catalogProposal.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        school: {
          select: { name: true },
        },
      },
    })

    return {
      success: true,
      data: proposals.map((p) => ({
        id: p.id,
        type: p.type,
        status: p.status,
        data: p.data,
        schoolId: p.schoolId,
        schoolName: p.school.name,
        proposedBy: p.proposedBy,
        createdAt: p.createdAt.toISOString(),
        parentSubjectId: p.parentSubjectId,
        parentChapterId: p.parentChapterId,
      })),
    }
  } catch (error) {
    console.error("[getProposalsForReview] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch proposals",
    }
  }
}

// ============================================================================
// Approve proposal — creates catalog entity + auto-bridges to school
// ============================================================================

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80)
}

export async function approveProposal(
  id: string,
  reviewNotes?: string
): Promise<ActionResponse<{ catalogEntityId: string }>> {
  try {
    const session = await requireDeveloper()
    const userId = session.user?.id

    const proposal = await db.catalogProposal.findUnique({
      where: { id },
    })

    if (!proposal) {
      return { success: false, error: "Proposal not found" }
    }

    if (proposal.status !== "SUBMITTED" && proposal.status !== "IN_REVIEW") {
      return {
        success: false,
        error: `Cannot approve a proposal with status: ${proposal.status}`,
      }
    }

    const data = proposal.data as Record<string, any>
    let catalogEntityId: string

    switch (proposal.type) {
      case "SUBJECT": {
        const baseSlug = generateSlug(data.name || "untitled")
        // Ensure slug uniqueness
        let slug = baseSlug
        let attempt = 0
        while (await db.catalogSubject.findUnique({ where: { slug } })) {
          attempt++
          slug = `${baseSlug}-${attempt}`
        }

        const subject = await db.catalogSubject.create({
          data: {
            name: data.name,
            slug,
            department: data.department || "",
            description: data.description || null,
            grades: data.grades || [],
            levels: data.levels || [],
            country: data.country || "SD",
            status: "PUBLISHED",
          },
        })
        catalogEntityId = subject.id

        // Auto-bridge: create SchoolSubjectSelection for the proposing school
        // Find a grade to link (use first available grade in the school)
        const firstGrade = await db.academicGrade.findFirst({
          where: { schoolId: proposal.schoolId },
          select: { id: true },
        })

        if (firstGrade) {
          await db.schoolSubjectSelection.create({
            data: {
              schoolId: proposal.schoolId,
              catalogSubjectId: catalogEntityId,
              gradeId: firstGrade.id,
              isRequired: false,
              isActive: true,
            },
          })
        }

        // Auto-create school Subject with catalogSubjectId FK
        // Find school's first department (or create if none)
        const schoolDept = await db.department.findFirst({
          where: { schoolId: proposal.schoolId },
          select: { id: true },
        })

        if (schoolDept) {
          await db.subject.create({
            data: {
              schoolId: proposal.schoolId,
              subjectName: data.name,
              departmentId: schoolDept.id,
              catalogSubjectId: catalogEntityId,
            },
          })
        }

        break
      }
      case "CHAPTER": {
        if (!proposal.parentSubjectId) {
          return {
            success: false,
            error: "Chapter proposal missing parent subject",
          }
        }

        const baseSlug = generateSlug(data.name || "untitled")
        let slug = baseSlug
        let attempt = 0
        while (
          await db.catalogChapter.findFirst({
            where: {
              subjectId: proposal.parentSubjectId,
              slug,
            },
          })
        ) {
          attempt++
          slug = `${baseSlug}-${attempt}`
        }

        const chapter = await db.catalogChapter.create({
          data: {
            subjectId: proposal.parentSubjectId,
            name: data.name,
            slug,
            description: data.description || null,
            sequenceOrder: data.sequenceOrder || 0,
            status: "PUBLISHED",
          },
        })
        catalogEntityId = chapter.id
        break
      }
      case "LESSON": {
        if (!proposal.parentChapterId) {
          return {
            success: false,
            error: "Lesson proposal missing parent chapter",
          }
        }

        const baseSlug = generateSlug(data.name || "untitled")
        let slug = baseSlug
        let attempt = 0
        while (
          await db.catalogLesson.findFirst({
            where: {
              chapterId: proposal.parentChapterId,
              slug,
            },
          })
        ) {
          attempt++
          slug = `${baseSlug}-${attempt}`
        }

        const lesson = await db.catalogLesson.create({
          data: {
            chapterId: proposal.parentChapterId,
            name: data.name,
            slug,
            description: data.description || null,
            sequenceOrder: data.sequenceOrder || 0,
            durationMinutes: data.durationMinutes || null,
            status: "PUBLISHED",
          },
        })
        catalogEntityId = lesson.id
        break
      }
      default:
        return {
          success: false,
          error: `Unknown proposal type: ${proposal.type}`,
        }
    }

    // Update proposal status
    await db.catalogProposal.update({
      where: { id },
      data: {
        status: "PUBLISHED",
        reviewedBy: userId,
        reviewedAt: new Date(),
        reviewNotes: reviewNotes || null,
        catalogEntityId,
      },
    })

    revalidatePath("/catalog")
    revalidatePath("/catalog/proposals")
    return { success: true, data: { catalogEntityId } }
  } catch (error) {
    console.error("[approveProposal] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to approve proposal",
    }
  }
}

// ============================================================================
// Reject proposal
// ============================================================================

export async function rejectProposal(
  id: string,
  rejectionReason: string
): Promise<ActionResponse<void>> {
  try {
    const session = await requireDeveloper()
    const userId = session.user?.id

    if (!rejectionReason.trim()) {
      return { success: false, error: "Rejection reason is required" }
    }

    const proposal = await db.catalogProposal.findUnique({
      where: { id },
      select: { status: true },
    })

    if (!proposal) {
      return { success: false, error: "Proposal not found" }
    }

    if (proposal.status !== "SUBMITTED" && proposal.status !== "IN_REVIEW") {
      return {
        success: false,
        error: `Cannot reject a proposal with status: ${proposal.status}`,
      }
    }

    await db.catalogProposal.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewedBy: userId,
        reviewedAt: new Date(),
        rejectionReason,
      },
    })

    revalidatePath("/catalog/proposals")
    return { success: true, data: undefined }
  } catch (error) {
    console.error("[rejectProposal] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to reject proposal",
    }
  }
}
