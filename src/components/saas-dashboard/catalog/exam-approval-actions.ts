"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"

import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { requireDeveloper } from "@/components/saas-dashboard/lib/operator-auth"

import type {
  PendingExamItem,
  PendingExamListResult,
  PendingExamTemplateItem,
  PendingTemplateListResult,
} from "./exam-approval-types"

// Re-export types for consumers
export type {
  PendingExamItem,
  PendingExamTemplateItem,
  PendingExamListResult,
  PendingTemplateListResult,
}

// ============================================================================
// Pending Exam list with pagination
// ============================================================================

const PAGE_SIZE = 20

export async function getPendingExams(
  page: number = 1
): Promise<PendingExamListResult> {
  try {
    await requireDeveloper()

    const skip = (page - 1) * PAGE_SIZE

    const [items, total] = await Promise.all([
      db.exam.findMany({
        where: { approvalStatus: "PENDING" },
        select: {
          id: true,
          title: true,
          examType: true,
          totalMarks: true,
          contributedBy: true,
          createdAt: true,
          subject: {
            select: { name: true },
          },
          contributedSchoolId: true,
          examQuestions: {
            select: { id: true },
          },
        },
        orderBy: { createdAt: "asc" },
        skip,
        take: PAGE_SIZE,
      }),
      db.exam.count({ where: { approvalStatus: "PENDING" } }),
    ])

    // Batch-fetch contributed school names
    const schoolIds = [
      ...new Set(
        items.map((i) => i.contributedSchoolId).filter(Boolean) as string[]
      ),
    ]
    const schools =
      schoolIds.length > 0
        ? await db.school.findMany({
            where: { id: { in: schoolIds } },
            select: { id: true, name: true },
          })
        : []
    const schoolMap = new Map(schools.map((s) => [s.id, s.name]))

    const mapped: PendingExamItem[] = items.map((item) => ({
      id: item.id,
      title: item.title,
      examType: item.examType,
      subjectName: item.subject.name,
      contributedSchoolName: item.contributedSchoolId
        ? (schoolMap.get(item.contributedSchoolId) ?? null)
        : null,
      contributedBy: item.contributedBy,
      createdAt: item.createdAt,
      questionCount: item.examQuestions.length,
      totalMarks: item.totalMarks,
    }))

    return {
      items: mapped,
      total,
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.ceil(total / PAGE_SIZE),
    }
  } catch {
    return { items: [], total: 0, page: 1, pageSize: PAGE_SIZE, totalPages: 0 }
  }
}

// ============================================================================
// Approve a Exam
// ============================================================================

export async function approveExam(
  catalogExamId: string
): Promise<ActionResponse> {
  try {
    const session = await requireDeveloper()
    const userId = session.user?.id

    const existing = await db.exam.findUnique({
      where: { id: catalogExamId },
    })
    if (!existing) {
      return { success: false, error: "Exam not found" }
    }

    await db.exam.update({
      where: { id: catalogExamId },
      data: {
        approvalStatus: "APPROVED",
        approvedBy: userId,
        approvedAt: new Date(),
        rejectionReason: null,
        status: "PUBLISHED",
      },
    })

    revalidatePath("/catalog/approvals")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to approve exam",
    }
  }
}

// ============================================================================
// Reject a Exam
// ============================================================================

export async function rejectExam(
  catalogExamId: string,
  reason: string
): Promise<ActionResponse> {
  try {
    const session = await requireDeveloper()
    const userId = session.user?.id

    if (!reason || reason.trim().length === 0) {
      return { success: false, error: "Rejection reason is required" }
    }

    const existing = await db.exam.findUnique({
      where: { id: catalogExamId },
    })
    if (!existing) {
      return { success: false, error: "Exam not found" }
    }

    await db.exam.update({
      where: { id: catalogExamId },
      data: {
        approvalStatus: "REJECTED",
        approvedBy: userId,
        approvedAt: new Date(),
        rejectionReason: reason,
      },
    })

    revalidatePath("/catalog/approvals")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reject exam",
    }
  }
}

// ============================================================================
// Pending ExamTemplate list with pagination
// ============================================================================

export async function getPendingExamTemplates(
  page: number = 1
): Promise<PendingTemplateListResult> {
  try {
    await requireDeveloper()

    const skip = (page - 1) * PAGE_SIZE

    const [items, total] = await Promise.all([
      db.examTemplate.findMany({
        where: { approvalStatus: "PENDING" },
        select: {
          id: true,
          name: true,
          examType: true,
          duration: true,
          totalMarks: true,
          contributedBy: true,
          contributedSchoolId: true,
          createdAt: true,
          catalogSubject: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: "asc" },
        skip,
        take: PAGE_SIZE,
      }),
      db.examTemplate.count({
        where: { approvalStatus: "PENDING" },
      }),
    ])

    // Batch-fetch contributed school names
    const schoolIds = [
      ...new Set(
        items.map((i) => i.contributedSchoolId).filter(Boolean) as string[]
      ),
    ]
    const schools =
      schoolIds.length > 0
        ? await db.school.findMany({
            where: { id: { in: schoolIds } },
            select: { id: true, name: true },
          })
        : []
    const schoolMap = new Map(schools.map((s) => [s.id, s.name]))

    const mapped: PendingExamTemplateItem[] = items.map((item) => ({
      id: item.id,
      name: item.name,
      examType: item.examType,
      subjectName: item.catalogSubject.name,
      contributedSchoolName: item.contributedSchoolId
        ? (schoolMap.get(item.contributedSchoolId) ?? null)
        : null,
      contributedBy: item.contributedBy,
      createdAt: item.createdAt,
      duration: item.duration,
      totalMarks: Number(item.totalMarks),
    }))

    return {
      items: mapped,
      total,
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.ceil(total / PAGE_SIZE),
    }
  } catch {
    return { items: [], total: 0, page: 1, pageSize: PAGE_SIZE, totalPages: 0 }
  }
}

// ============================================================================
// Approve a ExamTemplate
// ============================================================================

export async function approveExamTemplate(id: string): Promise<ActionResponse> {
  try {
    const session = await requireDeveloper()
    const userId = session.user?.id

    const existing = await db.examTemplate.findUnique({
      where: { id },
    })
    if (!existing) {
      return { success: false, error: "Template not found" }
    }

    await db.examTemplate.update({
      where: { id },
      data: {
        approvalStatus: "APPROVED",
        approvedBy: userId,
        approvedAt: new Date(),
        rejectionReason: null,
        status: "PUBLISHED",
      },
    })

    revalidatePath("/catalog/approvals")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to approve exam template",
    }
  }
}

// ============================================================================
// Reject a ExamTemplate
// ============================================================================

export async function rejectExamTemplate(
  id: string,
  reason: string
): Promise<ActionResponse> {
  try {
    const session = await requireDeveloper()
    const userId = session.user?.id

    if (!reason || reason.trim().length === 0) {
      return { success: false, error: "Rejection reason is required" }
    }

    const existing = await db.examTemplate.findUnique({
      where: { id },
    })
    if (!existing) {
      return { success: false, error: "Template not found" }
    }

    await db.examTemplate.update({
      where: { id },
      data: {
        approvalStatus: "REJECTED",
        approvedBy: userId,
        approvedAt: new Date(),
        rejectionReason: reason,
      },
    })

    revalidatePath("/catalog/approvals")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to reject exam template",
    }
  }
}
