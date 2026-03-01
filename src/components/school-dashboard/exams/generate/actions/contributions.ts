"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

// ============================================================================
// Contributor Dashboard -- My Exam Contributions
// ============================================================================

export interface ExamContributionItem {
  id: string
  title: string
  examType: string
  subjectName: string
  approvalStatus: string
  rejectionReason: string | null
  totalMarks: number | null
  questionCount: number
  adoptedCount: number
  createdAt: Date
}

export interface ContributionStats {
  total: number
  approved: number
  pending: number
  rejected: number
  adoptedCount: number
}

export interface ExamContributionsResult {
  items: ExamContributionItem[]
  stats: ContributionStats
}

/**
 * Returns contributed CatalogExam records for the current school.
 * MUST include schoolId for multi-tenant isolation.
 */
export async function getMyExamContributions(): Promise<ExamContributionsResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return {
      items: [],
      stats: {
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        adoptedCount: 0,
      },
    }
  }

  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return {
      items: [],
      stats: {
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        adoptedCount: 0,
      },
    }
  }

  const contributions = await db.catalogExam.findMany({
    where: { contributedSchoolId: schoolId },
    select: {
      id: true,
      title: true,
      examType: true,
      approvalStatus: true,
      rejectionReason: true,
      totalMarks: true,
      createdAt: true,
      usageCount: true,
      subject: {
        select: { name: true },
      },
      examQuestions: {
        select: { id: true },
      },
      schoolExams: {
        select: { id: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const items: ExamContributionItem[] = contributions.map((c) => ({
    id: c.id,
    title: c.title,
    examType: c.examType,
    subjectName: c.subject.name,
    approvalStatus: c.approvalStatus,
    rejectionReason: c.rejectionReason,
    totalMarks: c.totalMarks,
    questionCount: c.examQuestions.length,
    adoptedCount: c.schoolExams.length,
    createdAt: c.createdAt,
  }))

  const stats: ContributionStats = {
    total: items.length,
    approved: items.filter((i) => i.approvalStatus === "APPROVED").length,
    pending: items.filter((i) => i.approvalStatus === "PENDING").length,
    rejected: items.filter((i) => i.approvalStatus === "REJECTED").length,
    adoptedCount: items.reduce((sum, i) => sum + i.adoptedCount, 0),
  }

  return { items, stats }
}

// ============================================================================
// Contributor Dashboard -- My Template Contributions
// ============================================================================

export interface TemplateContributionItem {
  id: string
  name: string
  examType: string
  subjectName: string
  approvalStatus: string
  rejectionReason: string | null
  duration: number
  totalMarks: number
  adoptedCount: number
  createdAt: Date
}

export interface TemplateContributionsResult {
  items: TemplateContributionItem[]
  stats: ContributionStats
}

/**
 * Returns contributed CatalogExamTemplate records for the current school.
 * MUST include schoolId for multi-tenant isolation.
 */
export async function getMyTemplateContributions(): Promise<TemplateContributionsResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return {
      items: [],
      stats: {
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        adoptedCount: 0,
      },
    }
  }

  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return {
      items: [],
      stats: {
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        adoptedCount: 0,
      },
    }
  }

  const contributions = await db.catalogExamTemplate.findMany({
    where: { contributedSchoolId: schoolId },
    select: {
      id: true,
      name: true,
      examType: true,
      approvalStatus: true,
      rejectionReason: true,
      duration: true,
      totalMarks: true,
      usageCount: true,
      createdAt: true,
      catalogSubject: {
        select: { name: true },
      },
      schoolMirrors: {
        select: { id: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const items: TemplateContributionItem[] = contributions.map((c) => ({
    id: c.id,
    name: c.name,
    examType: c.examType,
    subjectName: c.catalogSubject.name,
    approvalStatus: c.approvalStatus,
    rejectionReason: c.rejectionReason,
    duration: c.duration,
    totalMarks: Number(c.totalMarks),
    adoptedCount: c.schoolMirrors.length,
    createdAt: c.createdAt,
  }))

  const stats: ContributionStats = {
    total: items.length,
    approved: items.filter((i) => i.approvalStatus === "APPROVED").length,
    pending: items.filter((i) => i.approvalStatus === "PENDING").length,
    rejected: items.filter((i) => i.approvalStatus === "REJECTED").length,
    adoptedCount: items.reduce((sum, i) => sum + i.adoptedCount, 0),
  }

  return { items, stats }
}
