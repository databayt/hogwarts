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

    // Get total counts using catalog models
    const [totalCourses, totalEnrollments, enrollments] = await Promise.all([
      // Active subjects for this school (via bridge table)
      db.schoolSubjectSelection.count({
        where: {
          ...schoolFilter,
          isActive: true,
        },
      }),
      // Active enrollments (catalog-based)
      db.enrollment.count({
        where: {
          ...schoolFilter,
          isActive: true,
        },
      }),
      // All active enrollments with subject details
      db.enrollment.findMany({
        where: {
          ...schoolFilter,
          isActive: true,
        },
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              price: true,
            },
          },
          user: {
            select: {
              id: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ])

    // Calculate total revenue from subject prices
    const totalRevenue = enrollments.reduce(
      (sum, enrollment) => sum + (Number(enrollment.subject.price) || 0),
      0
    )

    // Get unique active students
    const activeStudents = new Set(enrollments.map((e) => e.userId)).size

    // Calculate enrollment trend (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentEnrollments = await db.enrollment.findMany({
      where: {
        ...schoolFilter,
        createdAt: { gte: sevenDaysAgo },
      },
      select: { createdAt: true },
    })

    const enrollmentTrend = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      const dateStr = date.toISOString().split("T")[0]

      const count = recentEnrollments.filter((e) => {
        const enrollDate = e.createdAt.toISOString().split("T")[0]
        return enrollDate === dateStr
      }).length

      return { date: dateStr, count }
    })

    // Get top subjects by enrollment
    const subjectCounts = enrollments.reduce(
      (acc, enrollment) => {
        const subjectId = enrollment.subject.id
        if (!acc[subjectId]) {
          acc[subjectId] = {
            id: subjectId,
            title: enrollment.subject.name,
            enrollments: 0,
            revenue: 0,
          }
        }
        acc[subjectId].enrollments++
        acc[subjectId].revenue += Number(enrollment.subject.price) || 0
        return acc
      },
      {} as Record<
        string,
        { id: string; title: string; enrollments: number; revenue: number }
      >
    )

    const topCourses = Object.values(subjectCounts)
      .sort((a, b) => b.enrollments - a.enrollments)
      .slice(0, 5)

    // Calculate revenue by month (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const revenueData = await db.enrollment.findMany({
      where: {
        ...schoolFilter,
        createdAt: { gte: sixMonthsAgo },
      },
      include: {
        subject: {
          select: { price: true },
        },
      },
    })

    const revenueByMonth = Array.from({ length: 6 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - (5 - i))
      const monthStr = date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })

      const monthRevenue = revenueData
        .filter((e) => {
          const enrollMonth = e.createdAt.toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          })
          return enrollMonth === monthStr
        })
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
