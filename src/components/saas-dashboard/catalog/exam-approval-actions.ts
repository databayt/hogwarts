"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { db } from "@/lib/db"

// ============================================================================
// Authorization helper -- DEVELOPER only, NO schoolId
// ============================================================================

async function requireDeveloper() {
  const session = await auth()
  if (session?.user?.role !== "DEVELOPER") {
    throw new Error("Unauthorized: DEVELOPER role required")
  }
  return session
}

// ============================================================================
// Pending CatalogExam list with pagination
// ============================================================================

const PAGE_SIZE = 20

export interface PendingCatalogExamItem {
  id: string
  title: string
  examType: string
  subjectName: string
  contributedSchoolName: string | null
  contributedBy: string | null
  createdAt: Date
  questionCount: number
  totalMarks: number | null
}

export interface PendingExamListResult {
  items: PendingCatalogExamItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export async function getPendingCatalogExams(
  page: number = 1
): Promise<PendingExamListResult> {
  await requireDeveloper()

  const skip = (page - 1) * PAGE_SIZE

  const [items, total] = await Promise.all([
    db.catalogExam.findMany({
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
    db.catalogExam.count({ where: { approvalStatus: "PENDING" } }),
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

  const mapped: PendingCatalogExamItem[] = items.map((item) => ({
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
}

// ============================================================================
// Approve a CatalogExam
// ============================================================================

export async function approveCatalogExam(catalogExamId: string) {
  const session = await requireDeveloper()
  const userId = session.user?.id

  await db.catalogExam.update({
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
}

// ============================================================================
// Reject a CatalogExam
// ============================================================================

export async function rejectCatalogExam(catalogExamId: string, reason: string) {
  const session = await requireDeveloper()
  const userId = session.user?.id

  if (!reason || reason.trim().length === 0) {
    throw new Error("Rejection reason is required")
  }

  await db.catalogExam.update({
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
}

// ============================================================================
// Pending CatalogExamTemplate list with pagination
// ============================================================================

export interface PendingCatalogExamTemplateItem {
  id: string
  name: string
  examType: string
  subjectName: string
  contributedSchoolName: string | null
  contributedBy: string | null
  createdAt: Date
  duration: number
  totalMarks: number
}

export interface PendingTemplateListResult {
  items: PendingCatalogExamTemplateItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export async function getPendingCatalogExamTemplates(
  page: number = 1
): Promise<PendingTemplateListResult> {
  await requireDeveloper()

  const skip = (page - 1) * PAGE_SIZE

  const [items, total] = await Promise.all([
    db.catalogExamTemplate.findMany({
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
    db.catalogExamTemplate.count({ where: { approvalStatus: "PENDING" } }),
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

  const mapped: PendingCatalogExamTemplateItem[] = items.map((item) => ({
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
}

// ============================================================================
// Approve a CatalogExamTemplate
// ============================================================================

export async function approveCatalogExamTemplate(id: string) {
  const session = await requireDeveloper()
  const userId = session.user?.id

  await db.catalogExamTemplate.update({
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
}

// ============================================================================
// Reject a CatalogExamTemplate
// ============================================================================

export async function rejectCatalogExamTemplate(id: string, reason: string) {
  const session = await requireDeveloper()
  const userId = session.user?.id

  if (!reason || reason.trim().length === 0) {
    throw new Error("Rejection reason is required")
  }

  await db.catalogExamTemplate.update({
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
}
