"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

export interface AnalyticsData {
  totalCourses: number
  totalEnrollments: number
  totalRevenue: number
  activeStudents: number
  enrollmentTrend: Array<{ date: string; count: number }>
  topCourses: Array<{
    id: string
    title: string
    enrollments: number
    revenue: number
  }>
  revenueByMonth: Array<{ month: string; revenue: number }>
}

/**
 * Stream analytics using catalog-based models (Enrollment + SchoolSubjectSelection).
 * Migrated from legacy StreamCourse/StreamEnrollment queries.
 */
export async function getStreamAnalytics(): Promise<AnalyticsData | null> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()

    if (!session?.user) {
      throw new Error("Authentication required")
    }

    if (!["ADMIN", "TEACHER", "DEVELOPER"].includes(session.user.role || "")) {
      throw new Error("Insufficient permissions")
    }

    if (!schoolId && session.user.role !== "DEVELOPER") {
      throw new Error("School context required")
    }

    const schoolFilter = schoolId ? { schoolId } : {}

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    // Parallel aggregate queries — no full-table loads
    const [
      totalCourses,
      totalEnrollments,
      activeStudentsResult,
      revenueResult,
      topSubjects,
      recentEnrollments,
      revenueEnrollments,
    ] = await Promise.all([
      db.schoolSubjectSelection.count({
        where: { ...schoolFilter, isActive: true },
      }),
      db.enrollment.count({
        where: { ...schoolFilter, isActive: true },
      }),
      // Distinct active user count
      db.enrollment.groupBy({
        by: ["userId"],
        where: { ...schoolFilter, isActive: true },
      }),
      // Sum revenue via subject prices (aggregate on enrollment → subject)
      db.enrollment.findMany({
        where: { ...schoolFilter, isActive: true },
        select: { subject: { select: { price: true } } },
      }),
      // Top 5 subjects by enrollment count
      db.enrollment.groupBy({
        by: ["catalogSubjectId"],
        where: { ...schoolFilter, isActive: true },
        _count: { catalogSubjectId: true },
      }),
      // Last 7 days — just dates
      db.enrollment.findMany({
        where: { ...schoolFilter, createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true },
      }),
      // Last 6 months — dates + subject price
      db.enrollment.findMany({
        where: { ...schoolFilter, createdAt: { gte: sixMonthsAgo } },
        select: { createdAt: true, subject: { select: { price: true } } },
      }),
    ])

    const activeStudents = activeStudentsResult.length
    const totalRevenue = revenueResult.reduce(
      (sum, e) => sum + (Number(e.subject.price) || 0),
      0
    )

    // Resolve top subject names
    const catalogSubjectIds = topSubjects.map((s) => s.catalogSubjectId)
    const subjects =
      catalogSubjectIds.length > 0
        ? await db.catalogSubject.findMany({
            where: { id: { in: catalogSubjectIds } },
            select: { id: true, name: true, price: true },
          })
        : []
    const subjectMap = new Map(subjects.map((s) => [s.id, s]))

    const topCourses = topSubjects
      .map((s) => {
        const sub = subjectMap.get(s.catalogSubjectId)
        const count = s._count.catalogSubjectId
        return {
          id: s.catalogSubjectId,
          title: sub?.name ?? "Unknown",
          enrollments: count,
          revenue: (sub?.price ? Number(sub.price) : 0) * count,
        }
      })
      .sort((a, b) => b.enrollments - a.enrollments)
      .slice(0, 5)

    // Enrollment trend (last 7 days)
    const enrollmentTrend = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      const dateStr = date.toISOString().split("T")[0]
      const count = recentEnrollments.filter(
        (e) => e.createdAt.toISOString().split("T")[0] === dateStr
      ).length
      return { date: dateStr, count }
    })

    // Revenue by month (last 6 months)
    const revenueByMonth = Array.from({ length: 6 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - (5 - i))
      const monthStr = date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
      const monthRevenue = revenueEnrollments
        .filter(
          (e) =>
            e.createdAt.toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            }) === monthStr
        )
        .reduce((sum, e) => sum + (Number(e.subject.price) || 0), 0)
      return { month: monthStr, revenue: monthRevenue }
    })

    return {
      totalCourses,
      totalEnrollments,
      totalRevenue,
      activeStudents,
      enrollmentTrend,
      topCourses,
      revenueByMonth,
    }
  } catch (error) {
    console.error("Analytics error:", error)
    return null
  }
}
