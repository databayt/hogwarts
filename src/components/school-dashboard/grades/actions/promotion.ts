"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { Prisma } from "@prisma/client"

import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

// ============================================================================
// PROMOTION POLICY CRUD
// ============================================================================

export async function getPromotionPolicy(gradeId: string) {
  const session = await auth()
  if (!session?.user) return null
  const { schoolId } = await getTenantContext()
  if (!schoolId) return null

  return db.promotionPolicy.findUnique({
    where: { schoolId_gradeId: { schoolId, gradeId } },
  })
}

export async function upsertPromotionPolicy(input: {
  gradeId: string
  minOverallGPA?: number
  minOverallPercentage?: number
  maxFailedSubjects?: number
  minAttendancePercent?: number
  requiredSubjectIds?: string[]
  autoPromote?: boolean
}): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await auth()
    if (!session?.user) return { success: false, error: "Not authenticated" }
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const reqIds = input.requiredSubjectIds?.length
      ? (input.requiredSubjectIds as Prisma.InputJsonValue)
      : Prisma.JsonNull

    const policy = await db.promotionPolicy.upsert({
      where: { schoolId_gradeId: { schoolId, gradeId: input.gradeId } },
      create: {
        schoolId,
        gradeId: input.gradeId,
        minOverallGPA: input.minOverallGPA,
        minOverallPercentage: input.minOverallPercentage,
        maxFailedSubjects: input.maxFailedSubjects ?? 2,
        minAttendancePercent: input.minAttendancePercent ?? 75,
        requiredSubjectIds: reqIds,
        autoPromote: input.autoPromote ?? false,
      },
      update: {
        minOverallGPA: input.minOverallGPA,
        minOverallPercentage: input.minOverallPercentage,
        maxFailedSubjects: input.maxFailedSubjects,
        minAttendancePercent: input.minAttendancePercent,
        requiredSubjectIds: reqIds,
        autoPromote: input.autoPromote,
      },
    })

    revalidatePath("/grades/promotion")
    return { success: true, data: { id: policy.id } }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to save promotion policy",
    }
  }
}

// ============================================================================
// EVALUATE PROMOTION CANDIDATES
// ============================================================================

export async function evaluatePromotionCandidates(input: {
  yearId: string
  gradeId: string
}): Promise<ActionResponse<{ batchId: string; total: number }>> {
  try {
    const session = await auth()
    if (!session?.user) return { success: false, error: "Not authenticated" }
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    // Check for existing batch
    const existing = await db.promotionBatch.findUnique({
      where: {
        schoolId_yearId_gradeId: {
          schoolId,
          yearId: input.yearId,
          gradeId: input.gradeId,
        },
      },
    })
    if (
      existing &&
      existing.status !== "DRAFT" &&
      existing.status !== "CANCELLED"
    ) {
      return {
        success: false,
        error: "A promotion batch already exists for this year and grade",
      }
    }

    // Create or reset batch
    const batch = existing
      ? await db.promotionBatch.update({
          where: { id: existing.id },
          data: {
            status: "EVALUATING",
            totalStudents: 0,
            promotedCount: 0,
            retainedCount: 0,
            conditionalCount: 0,
            graduatedCount: 0,
            manualReviewCount: 0,
          },
        })
      : await db.promotionBatch.create({
          data: {
            schoolId,
            yearId: input.yearId,
            gradeId: input.gradeId,
            status: "EVALUATING",
            createdBy: session.user.id || "",
          },
        })

    // Delete old candidates if resetting
    if (existing) {
      await db.promotionCandidate.deleteMany({ where: { batchId: batch.id } })
    }

    // Fetch promotion policy
    const policy = await db.promotionPolicy.findUnique({
      where: { schoolId_gradeId: { schoolId, gradeId: input.gradeId } },
    })

    // Fetch students in this grade
    const students = await db.student.findMany({
      where: { schoolId, academicGradeId: input.gradeId, status: "ACTIVE" },
      select: { id: true },
    })

    // Fetch the year's terms
    const terms = await db.term.findMany({
      where: { schoolId, yearId: input.yearId },
      select: { id: true },
    })
    const termIds = terms.map((t) => t.id)

    // Check if this is the final grade (for graduation)
    const currentGrade = await db.academicGrade.findUnique({
      where: { id: input.gradeId },
      include: {
        level: {
          include: { grades: { orderBy: { gradeNumber: "desc" }, take: 1 } },
        },
      },
    })
    const isLastGrade = currentGrade?.level?.grades?.[0]?.id === input.gradeId

    // Find next grade
    const nextGrade = !isLastGrade
      ? await db.academicGrade.findFirst({
          where: {
            schoolId,
            gradeNumber: (currentGrade?.gradeNumber ?? 0) + 1,
          },
        })
      : null

    let promotedCount = 0
    let retainedCount = 0
    let conditionalCount = 0
    let graduatedCount = 0
    let manualReviewCount = 0

    for (const student of students) {
      // Fetch report cards for all terms in this year
      const reportCards = await db.reportCard.findMany({
        where: { schoolId, studentId: student.id, termId: { in: termIds } },
        include: { grades: true },
      })

      // Calculate cumulative GPA
      const gpas = reportCards
        .map((rc) => (rc.overallGPA ? Number(rc.overallGPA) : null))
        .filter((g): g is number => g !== null)
      const overallGPA =
        gpas.length > 0 ? gpas.reduce((a, b) => a + b, 0) / gpas.length : null

      // Calculate overall percentage
      const allGrades = reportCards.flatMap((rc) => rc.grades)
      const avgPct =
        allGrades.length > 0
          ? allGrades.reduce((sum, g) => sum + (g.percentage ?? 0), 0) /
            allGrades.length
          : null

      // Count failed subjects (grade F or below passing threshold)
      const failedSubjects = allGrades.filter(
        (g) => g.grade === "F" || (g.percentage != null && g.percentage < 60)
      ).length

      // Check required subjects
      const requiredIds = policy?.requiredSubjectIds
        ? (policy.requiredSubjectIds as string[])
        : []
      const failedRequired = requiredIds.some((reqId) => {
        const subjectGrades = allGrades.filter((g) => g.subjectId === reqId)
        return subjectGrades.some(
          (g) => g.grade === "F" || (g.percentage != null && g.percentage < 60)
        )
      })

      // Fetch attendance percentage
      const year = await db.schoolYear.findUnique({
        where: { id: input.yearId },
        select: { startDate: true, endDate: true },
      })
      let attendancePercent: number | null = null
      if (year) {
        const totalDays = await db.attendance.count({
          where: {
            schoolId,
            studentId: student.id,
            date: { gte: year.startDate, lte: year.endDate },
          },
        })
        const presentDays = await db.attendance.count({
          where: {
            schoolId,
            studentId: student.id,
            date: { gte: year.startDate, lte: year.endDate },
            status: { in: ["PRESENT", "LATE"] },
          },
        })
        attendancePercent =
          totalDays > 0 ? (presentDays / totalDays) * 100 : null
      }

      // Determine decision
      let decision:
        | "PROMOTE"
        | "RETAIN"
        | "CONDITIONAL"
        | "GRADUATE"
        | "MANUAL_REVIEW"

      if (
        isLastGrade &&
        overallGPA != null &&
        (policy?.minOverallGPA == null ||
          overallGPA >= Number(policy.minOverallGPA))
      ) {
        decision = "GRADUATE"
      } else if (!overallGPA && !avgPct) {
        decision = "MANUAL_REVIEW"
      } else {
        const meetsGPA =
          !policy?.minOverallGPA ||
          (overallGPA != null && overallGPA >= Number(policy.minOverallGPA))
        const meetsPct =
          !policy?.minOverallPercentage ||
          (avgPct != null && avgPct >= policy.minOverallPercentage)
        const meetsFailedSubjects =
          failedSubjects <= (policy?.maxFailedSubjects ?? 2)
        const meetsAttendance =
          !policy?.minAttendancePercent ||
          (attendancePercent != null &&
            attendancePercent >= policy.minAttendancePercent)
        const meetsRequired = !failedRequired

        if (
          meetsGPA &&
          meetsPct &&
          meetsFailedSubjects &&
          meetsAttendance &&
          meetsRequired
        ) {
          decision = "PROMOTE"
        } else if (
          meetsGPA &&
          meetsPct &&
          (!meetsAttendance || !meetsRequired)
        ) {
          decision = "CONDITIONAL"
        } else {
          decision = "RETAIN"
        }
      }

      await db.promotionCandidate.create({
        data: {
          schoolId,
          batchId: batch.id,
          studentId: student.id,
          overallGPA:
            overallGPA != null ? Math.round(overallGPA * 100) / 100 : null,
          overallPercentage:
            avgPct != null ? Math.round(avgPct * 100) / 100 : null,
          failedSubjects,
          attendancePercent:
            attendancePercent != null
              ? Math.round(attendancePercent * 100) / 100
              : null,
          autoDecision: decision,
          finalDecision: decision,
          newGradeId:
            decision === "PROMOTE"
              ? nextGrade?.id
              : decision === "GRADUATE"
                ? null
                : null,
        },
      })

      switch (decision) {
        case "PROMOTE":
          promotedCount++
          break
        case "RETAIN":
          retainedCount++
          break
        case "CONDITIONAL":
          conditionalCount++
          break
        case "GRADUATE":
          graduatedCount++
          break
        case "MANUAL_REVIEW":
          manualReviewCount++
          break
      }
    }

    await db.promotionBatch.update({
      where: { id: batch.id },
      data: {
        status: "READY_FOR_REVIEW",
        totalStudents: students.length,
        promotedCount,
        retainedCount,
        conditionalCount,
        graduatedCount,
        manualReviewCount,
      },
    })

    revalidatePath("/grades/promotion")
    return {
      success: true,
      data: { batchId: batch.id, total: students.length },
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to evaluate promotions",
    }
  }
}

// ============================================================================
// OVERRIDE PROMOTION DECISION
// ============================================================================

export async function overridePromotionDecision(input: {
  candidateId: string
  decision: "PROMOTE" | "RETAIN" | "CONDITIONAL" | "GRADUATE" | "MANUAL_REVIEW"
  reason: string
}): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await auth()
    if (!session?.user) return { success: false, error: "Not authenticated" }
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const candidate = await db.promotionCandidate.findFirst({
      where: { id: input.candidateId, schoolId },
      include: { batch: true },
    })
    if (!candidate) return { success: false, error: "Candidate not found" }
    if (candidate.batch.status !== "READY_FOR_REVIEW") {
      return { success: false, error: "Batch is not in review status" }
    }

    await db.promotionCandidate.update({
      where: { id: input.candidateId },
      data: {
        finalDecision: input.decision,
        overrideReason: input.reason,
        overriddenBy: session.user.id,
      },
    })

    revalidatePath("/grades/promotion")
    return { success: true, data: { id: input.candidateId } }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to override decision",
    }
  }
}

// ============================================================================
// APPROVE PROMOTION BATCH
// ============================================================================

export async function approvePromotionBatch(
  batchId: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await auth()
    if (!session?.user) return { success: false, error: "Not authenticated" }
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const batch = await db.promotionBatch.findFirst({
      where: { id: batchId, schoolId },
    })
    if (!batch) return { success: false, error: "Batch not found" }
    if (batch.status !== "READY_FOR_REVIEW") {
      return {
        success: false,
        error: "Batch must be in review status to approve",
      }
    }

    // Check for unresolved manual reviews
    const manualReview = await db.promotionCandidate.count({
      where: { batchId, finalDecision: "MANUAL_REVIEW" },
    })
    if (manualReview > 0) {
      return {
        success: false,
        error: `${manualReview} candidates still need manual review`,
      }
    }

    await db.promotionBatch.update({
      where: { id: batchId },
      data: {
        status: "APPROVED",
        approvedBy: session.user.id,
        approvedAt: new Date(),
      },
    })

    revalidatePath("/grades/promotion")
    return { success: true, data: { id: batchId } }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to approve batch",
    }
  }
}

// ============================================================================
// EXECUTE PROMOTIONS
// ============================================================================

export async function executePromotions(
  batchId: string
): Promise<ActionResponse<{ executed: number }>> {
  try {
    const session = await auth()
    if (!session?.user) return { success: false, error: "Not authenticated" }
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const batch = await db.promotionBatch.findFirst({
      where: { id: batchId, schoolId },
    })
    if (!batch) return { success: false, error: "Batch not found" }
    if (batch.status !== "APPROVED") {
      return {
        success: false,
        error: "Batch must be approved before execution",
      }
    }

    await db.promotionBatch.update({
      where: { id: batchId },
      data: { status: "EXECUTING" },
    })

    const candidates = await db.promotionCandidate.findMany({
      where: { batchId, isExecuted: false },
    })

    // Resolve YearLevel IDs from AcademicGrade IDs
    const gradeIds = [
      batch.gradeId,
      ...candidates.map((c) => c.newGradeId).filter((id): id is string => !!id),
    ]
    const grades = await db.academicGrade.findMany({
      where: { id: { in: gradeIds } },
      select: { id: true, yearLevelId: true },
    })
    const gradeToYearLevel = new Map(
      grades
        .filter((g) => g.yearLevelId)
        .map((g) => [g.id, g.yearLevelId as string])
    )

    let executed = 0

    for (const candidate of candidates) {
      try {
        if (candidate.finalDecision === "PROMOTE" && candidate.newGradeId) {
          // Move student to next grade
          await db.student.update({
            where: { id: candidate.studentId },
            data: { academicGradeId: candidate.newGradeId },
          })

          // Create StudentYearLevel record
          const levelId = gradeToYearLevel.get(candidate.newGradeId)
          if (levelId) {
            await db.studentYearLevel.create({
              data: {
                schoolId,
                studentId: candidate.studentId,
                yearId: batch.yearId,
                levelId,
                score: candidate.overallPercentage,
              },
            })
          }
        } else if (candidate.finalDecision === "RETAIN") {
          // Create StudentYearLevel with retained grade
          const levelId = gradeToYearLevel.get(batch.gradeId)
          if (levelId) {
            await db.studentYearLevel.create({
              data: {
                schoolId,
                studentId: candidate.studentId,
                yearId: batch.yearId,
                levelId,
                score: candidate.overallPercentage,
              },
            })
          }
        } else if (candidate.finalDecision === "GRADUATE") {
          await db.student.update({
            where: { id: candidate.studentId },
            data: { status: "GRADUATED" },
          })

          const levelId = gradeToYearLevel.get(batch.gradeId)
          if (levelId) {
            await db.studentYearLevel.create({
              data: {
                schoolId,
                studentId: candidate.studentId,
                yearId: batch.yearId,
                levelId,
                score: candidate.overallPercentage,
              },
            })
          }
        }

        await db.promotionCandidate.update({
          where: { id: candidate.id },
          data: { isExecuted: true, executedAt: new Date() },
        })
        executed++
      } catch (e) {
        console.error(
          `Failed to execute promotion for ${candidate.studentId}:`,
          e
        )
      }
    }

    await db.promotionBatch.update({
      where: { id: batchId },
      data: {
        status: "COMPLETED",
        executedAt: new Date(),
      },
    })

    revalidatePath("/grades/promotion")
    return { success: true, data: { executed } }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to execute promotions",
    }
  }
}

// ============================================================================
// GET PROMOTION BATCHES
// ============================================================================

export async function getPromotionBatches() {
  const session = await auth()
  if (!session?.user) return []
  const { schoolId } = await getTenantContext()
  if (!schoolId) return []

  return db.promotionBatch.findMany({
    where: { schoolId },
    include: {
      year: { select: { yearName: true } },
      grade: { select: { name: true, gradeNumber: true } },
    },
    orderBy: { createdAt: "desc" },
  })
}

// ============================================================================
// GET PROMOTION CANDIDATES
// ============================================================================

export async function getPromotionCandidates(batchId: string) {
  const session = await auth()
  if (!session?.user) return []
  const { schoolId } = await getTenantContext()
  if (!schoolId) return []

  return db.promotionCandidate.findMany({
    where: { batchId, schoolId },
    include: {
      student: {
        select: {
          id: true,
          givenName: true,
          surname: true,
          studentId: true,
        },
      },
    },
    orderBy: [{ finalDecision: "asc" }, { overallGPA: "desc" }],
  })
}
