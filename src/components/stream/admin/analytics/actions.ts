"use server";

import { auth } from "@/auth";
import { getTenantContext } from "@/lib/tenant-context";
import { db } from "@/lib/db";

export interface AnalyticsData {
  totalCourses: number;
  totalEnrollments: number;
  totalRevenue: number;
  activeStudents: number;
  enrollmentTrend: Array<{ date: string; count: number }>;
  topCourses: Array<{
    id: string;
    title: string;
    enrollments: number;
    revenue: number;
  }>;
  revenueByMonth: Array<{ month: string; revenue: number }>;
}

export async function getStreamAnalytics(): Promise<AnalyticsData | null> {
  try {
    const session = await auth();
    const { schoolId } = await getTenantContext();

    if (!session?.user) {
      throw new Error("Authentication required");
    }

    if (!["ADMIN", "TEACHER", "DEVELOPER"].includes(session.user.role || "")) {
      throw new Error("Insufficient permissions");
    }

    if (!schoolId && session.user.role !== "DEVELOPER") {
      throw new Error("School context required");
    }

    // Get total counts
    const [totalCourses, totalEnrollments, enrollments] = await Promise.all([
      db.streamCourse.count({
        where: {
          schoolId: schoolId || undefined,
          isPublished: true,
        },
      }),
      db.streamEnrollment.count({
        where: {
          schoolId: schoolId || undefined,
          isActive: true,
        },
      }),
      db.streamEnrollment.findMany({
        where: {
          schoolId: schoolId || undefined,
          isActive: true,
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
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
    ]);

    // Calculate total revenue
    const totalRevenue = enrollments.reduce(
      (sum, enrollment) => sum + (enrollment.course.price || 0),
      0
    );

    // Get unique active students
    const activeStudents = new Set(enrollments.map((e) => e.userId)).size;

    // Calculate enrollment trend (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentEnrollments = await db.streamEnrollment.groupBy({
      by: ["createdAt"],
      where: {
        schoolId: schoolId || undefined,
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      _count: true,
    });

    const enrollmentTrend = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dateStr = date.toISOString().split("T")[0];

      const count = recentEnrollments.filter((e) => {
        const enrollDate = e.createdAt.toISOString().split("T")[0];
        return enrollDate === dateStr;
      }).length;

      return {
        date: dateStr,
        count,
      };
    });

    // Get top courses by enrollment
    const courseCounts = enrollments.reduce(
      (acc, enrollment) => {
        const courseId = enrollment.course.id;
        if (!acc[courseId]) {
          acc[courseId] = {
            id: courseId,
            title: enrollment.course.title,
            enrollments: 0,
            revenue: 0,
          };
        }
        acc[courseId].enrollments++;
        acc[courseId].revenue += enrollment.course.price || 0;
        return acc;
      },
      {} as Record<
        string,
        { id: string; title: string; enrollments: number; revenue: number }
      >
    );

    const topCourses = Object.values(courseCounts)
      .sort((a, b) => b.enrollments - a.enrollments)
      .slice(0, 5);

    // Calculate revenue by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const revenueData = await db.streamEnrollment.findMany({
      where: {
        schoolId: schoolId || undefined,
        createdAt: {
          gte: sixMonthsAgo,
        },
      },
      include: {
        course: {
          select: {
            price: true,
          },
        },
      },
    });

    const revenueByMonth = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      const monthStr = date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });

      const monthRevenue = revenueData
        .filter((e) => {
          const enrollMonth = e.createdAt.toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          });
          return enrollMonth === monthStr;
        })
        .reduce((sum, e) => sum + (e.course.price || 0), 0);

      return {
        month: monthStr,
        revenue: monthRevenue,
      };
    });

    return {
      totalCourses,
      totalEnrollments,
      totalRevenue,
      activeStudents,
      enrollmentTrend,
      topCourses,
      revenueByMonth,
    };
  } catch (error) {
    console.error("Analytics error:", error);
    return null;
  }
}
