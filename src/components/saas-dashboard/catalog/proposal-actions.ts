"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"

import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import {
  dispatchNotification,
  dispatchNotificationsToAudience,
  resolveSchoolLang,
} from "@/lib/dispatch-notification"
import { requireDeveloper } from "@/components/saas-dashboard/lib/operator-auth"

// ============================================================================
// Types
// ============================================================================

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

    const proposals = await db.proposal.findMany({
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
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch proposals",
    }
  }
}

// ============================================================================
// Approve proposal — publishes to the global catalog (opt-in: the school is
// notified and adds the subject from its catalog picker; no auto-bridge)
// ============================================================================

function generateSlug(name: string): string {
  // First try ASCII-friendly slug
  const ascii = name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80)

  // If name is non-ASCII (e.g. Arabic), the ascii slug will be empty/meaningless
  // Use a short random suffix to ensure uniqueness
  if (!ascii || ascii === "-") {
    const rand = Math.random().toString(36).slice(2, 10)
    return `subject-${rand}`
  }
  return ascii
}

export async function approveProposal(
  id: string,
  reviewNotes?: string
): Promise<ActionResponse<{ catalogEntityId: string }>> {
  try {
    const session = await requireDeveloper()
    const userId = session.user?.id

    // Entire approve flow in one transaction for atomicity + race protection
    const approved = await db.$transaction(
      async (tx) => {
        // Optimistic locking: fetch + check status inside transaction
        const proposal = await tx.proposal.findUnique({
          where: { id },
        })

        if (!proposal) {
          throw new Error("proposal_not_found")
        }

        if (
          proposal.status !== "SUBMITTED" &&
          proposal.status !== "IN_REVIEW"
        ) {
          throw new Error(
            `Cannot approve a proposal with status: ${proposal.status}`
          )
        }

        const data = proposal.data as Record<string, any>
        let entityId: string

        switch (proposal.type) {
          case "SUBJECT": {
            const baseSlug = generateSlug(data.name || "untitled")
            let slug = baseSlug
            let attempt = 0
            while (await tx.subject.findUnique({ where: { slug } })) {
              attempt++
              slug = `${baseSlug}-${attempt}`
            }

            const subject = await tx.subject.create({
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

            // Opt-in flow: no auto-bridge. The requesting school is notified
            // and adds the subject from its catalog picker (pinned on top).
            entityId = subject.id
            break
          }
          case "CHAPTER": {
            if (!proposal.parentSubjectId) {
              throw new Error("Chapter proposal missing parent subject")
            }

            const baseSlug = generateSlug(data.name || "untitled")
            let slug = baseSlug
            let attempt = 0
            while (
              await tx.chapter.findFirst({
                where: {
                  subjectId: proposal.parentSubjectId,
                  slug,
                },
              })
            ) {
              attempt++
              slug = `${baseSlug}-${attempt}`
            }

            const chapter = await tx.chapter.create({
              data: {
                subjectId: proposal.parentSubjectId,
                name: data.name,
                slug,
                description: data.description || null,
                sequenceOrder: data.sequenceOrder || 0,
                status: "PUBLISHED",
              },
            })
            entityId = chapter.id
            break
          }
          case "LESSON": {
            if (!proposal.parentChapterId) {
              throw new Error("Lesson proposal missing parent chapter")
            }

            const baseSlug = generateSlug(data.name || "untitled")
            let slug = baseSlug
            let attempt = 0
            while (
              await tx.lesson.findFirst({
                where: {
                  chapterId: proposal.parentChapterId,
                  slug,
                },
              })
            ) {
              attempt++
              slug = `${baseSlug}-${attempt}`
            }

            const lesson = await tx.lesson.create({
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
            entityId = lesson.id
            break
          }
          default:
            throw new Error(`Unknown proposal type: ${proposal.type}`)
        }

        // Update proposal status INSIDE the same transaction
        await tx.proposal.update({
          where: { id },
          data: {
            status: "PUBLISHED",
            reviewedBy: userId,
            reviewedAt: new Date(),
            reviewNotes: reviewNotes || null,
            catalogEntityId: entityId,
          },
        })

        return {
          entityId,
          schoolId: proposal.schoolId,
          proposedBy: proposal.proposedBy,
          name: (data.name as string) || "",
        }
      },
      { timeout: 30000 }
    )

    // Notify the requesting school (proposer + admins) AFTER the transaction —
    // a notification failure must never roll back or fail the approval.
    try {
      const lang = await resolveSchoolLang(approved.schoolId)
      const isAr = lang === "ar"
      const title = isAr
        ? "تمت الموافقة على طلب المادة"
        : "Subject request approved"
      const body = isAr
        ? `"${approved.name}" أصبحت متاحة الآن في الكتالوج — أضفها إلى مدرستك`
        : `"${approved.name}" is now available in the catalog — add it to your school`
      const common = {
        schoolId: approved.schoolId,
        type: "document_shared" as const,
        title,
        body,
        lang,
        priority: "normal" as const,
        actorId: userId ?? undefined,
        channels: ["in_app", "email"] as ("in_app" | "email")[],
        metadata: {
          entityType: "proposal",
          entityId: id,
          catalogEntityId: approved.entityId,
          kind: "proposal_approved",
          url: "/subjects/catalog",
        },
      }
      // Skip the individual dispatch when the proposer is an ADMIN — the
      // role-audience dispatch below already covers them (avoids duplicates).
      const proposer = await db.user.findFirst({
        where: { id: approved.proposedBy },
        select: { role: true },
      })
      if (proposer && proposer.role !== "ADMIN") {
        await dispatchNotification({ ...common, userId: approved.proposedBy })
      }
      await dispatchNotificationsToAudience({
        ...common,
        targetScope: "role",
        targetRole: "ADMIN",
      })
    } catch (notifError) {
      console.error("[approveProposal] Notification failed:", notifError)
    }

    revalidatePath("/catalog")
    revalidatePath("/catalog/proposals")
    return { success: true, data: { catalogEntityId: approved.entityId } }
  } catch (error) {
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
): Promise<ActionResponse> {
  try {
    const session = await requireDeveloper()
    const userId = session.user?.id

    if (!rejectionReason || !rejectionReason.trim()) {
      return { success: false, error: "rejection_reason_required" }
    }

    const proposal = await db.proposal.findUnique({
      where: { id },
      select: { status: true, schoolId: true, proposedBy: true, data: true },
    })

    if (!proposal) {
      return { success: false, error: "proposal_not_found" }
    }

    if (proposal.status !== "SUBMITTED" && proposal.status !== "IN_REVIEW") {
      return {
        success: false,
        error: `Cannot reject a proposal with status: ${proposal.status}`,
      }
    }

    await db.proposal.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewedBy: userId,
        reviewedAt: new Date(),
        rejectionReason,
      },
    })

    // Notify the requesting school — failure must never fail the rejection.
    try {
      const name =
        ((proposal.data as Record<string, unknown>)?.name as string) || ""
      const lang = await resolveSchoolLang(proposal.schoolId)
      const isAr = lang === "ar"
      const title = isAr ? "تم رفض طلب المادة" : "Subject request rejected"
      const body = isAr
        ? `تم رفض طلب "${name}": ${rejectionReason}`
        : `Your request "${name}" was rejected: ${rejectionReason}`
      const common = {
        schoolId: proposal.schoolId,
        type: "system_alert" as const,
        title,
        body,
        lang,
        priority: "high" as const,
        actorId: userId ?? undefined,
        channels: ["in_app", "email"] as ("in_app" | "email")[],
        metadata: {
          entityType: "proposal",
          entityId: id,
          kind: "proposal_rejected",
          rejectionReason,
          url: "/subjects/catalog",
        },
      }
      const proposer = await db.user.findFirst({
        where: { id: proposal.proposedBy },
        select: { role: true },
      })
      if (proposer && proposer.role !== "ADMIN") {
        await dispatchNotification({ ...common, userId: proposal.proposedBy })
      }
      await dispatchNotificationsToAudience({
        ...common,
        targetScope: "role",
        targetRole: "ADMIN",
      })
    } catch (notifError) {
      console.error("[rejectProposal] Notification failed:", notifError)
    }

    revalidatePath("/catalog/proposals")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to reject proposal",
    }
  }
}
