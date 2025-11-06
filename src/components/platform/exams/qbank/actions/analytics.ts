"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import type {
  ActionResponse,
  AnalyticsUpdate,
  DashboardAnalytics,
} from "./types";

/**
 * Update question analytics after student attempt
 */
export async function updateQuestionAnalytics(
  data: AnalyticsUpdate
): Promise<ActionResponse> {
  try {
    const session = await auth();
    if (!session?.user?.schoolId) {
      return {
        success: false,
        error: "Unauthorized - No school context",
        code: "NO_SCHOOL_CONTEXT",
      };
    }

    const schoolId = session.user.schoolId;
    const { questionId, score, maxPoints, timeSpent } = data;

    // Get existing analytics
    const analytics = await db.questionAnalytics.findFirst({
      where: {
        questionId,
        schoolId, // CRITICAL: Multi-tenant scope
      },
    });

    if (!analytics) {
      // Create analytics if doesn't exist
      await db.questionAnalytics.create({
        data: {
          questionId,
          schoolId,
          timesUsed: 1,
          avgScore: score,
          successRate: (score / maxPoints) * 100,
          avgTimeSpent: timeSpent || 0,
          lastUsed: new Date(),
        },
      });
    } else {
      // Calculate new averages
      const timesUsed = analytics.timesUsed + 1;
      const currentAvgScore = analytics.avgScore?.toNumber() || 0;
      const newAvgScore =
        (currentAvgScore * analytics.timesUsed + score) / timesUsed;

      const successRate = (newAvgScore / maxPoints) * 100;

      const currentAvgTime = analytics.avgTimeSpent || 0;
      const newAvgTime = timeSpent
        ? (currentAvgTime * analytics.timesUsed + timeSpent) / timesUsed
        : currentAvgTime;

      // Update analytics
      await db.questionAnalytics.update({
        where: {
          id: analytics.id,
        },
        data: {
          timesUsed,
          avgScore: newAvgScore,
          successRate,
          avgTimeSpent: newAvgTime,
          lastUsed: new Date(),
        },
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Update analytics error:", error);
    return {
      success: false,
      error: "Failed to update analytics",
      code: "UPDATE_FAILED",
      details: error instanceof Error ? error.message : undefined,
    };
  }
}

/**
 * Batch update analytics for multiple questions
 */
export async function batchUpdateAnalytics(
  updates: AnalyticsUpdate[]
): Promise<ActionResponse> {
  try {
    const session = await auth();
    if (!session?.user?.schoolId) {
      return {
        success: false,
        error: "Unauthorized - No school context",
        code: "NO_SCHOOL_CONTEXT",
      };
    }

    const schoolId = session.user.schoolId;

    // Process updates in transaction
    await db.$transaction(async (tx) => {
      for (const update of updates) {
        const analytics = await tx.questionAnalytics.findFirst({
          where: {
            questionId: update.questionId,
            schoolId,
          },
        });

        if (!analytics) {
          await tx.questionAnalytics.create({
            data: {
              questionId: update.questionId,
              schoolId,
              timesUsed: 1,
              avgScore: update.score,
              successRate: (update.score / update.maxPoints) * 100,
              avgTimeSpent: update.timeSpent || 0,
              lastUsed: new Date(),
            },
          });
        } else {
          const timesUsed = analytics.timesUsed + 1;
          const currentAvgScore = analytics.avgScore?.toNumber() || 0;
          const newAvgScore =
            (currentAvgScore * analytics.timesUsed + update.score) /
            timesUsed;

          const successRate = (newAvgScore / update.maxPoints) * 100;

          const currentAvgTime = analytics.avgTimeSpent || 0;
          const newAvgTime = update.timeSpent
            ? (currentAvgTime * analytics.timesUsed + update.timeSpent) /
              timesUsed
            : currentAvgTime;

          await tx.questionAnalytics.update({
            where: { id: analytics.id },
            data: {
              timesUsed,
              avgScore: newAvgScore,
              successRate,
              avgTimeSpent: newAvgTime,
              lastUsed: new Date(),
            },
          });
        }
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Batch update analytics error:", error);
    return {
      success: false,
      error: "Failed to update analytics",
      code: "BATCH_UPDATE_FAILED",
      details: error instanceof Error ? error.message : undefined,
    };
  }
}

/**
 * Get analytics dashboard data
 */
export async function getAnalyticsDashboard(): Promise<
  ActionResponse<DashboardAnalytics>
> {
  try {
    const session = await auth();
    if (!session?.user?.schoolId) {
      return {
        success: false,
        error: "Unauthorized - No school context",
        code: "NO_SCHOOL_CONTEXT",
      };
    }

    const schoolId = session.user.schoolId;

    // Fetch all data in parallel
    const [
      totalQuestions,
      totalTemplates,
      totalGeneratedExams,
      questions,
      subjectStats,
      difficultyStats,
      typeStats,
    ] = await Promise.all([
      db.questionBank.count({ where: { schoolId } }),
      db.examTemplate.count({ where: { schoolId } }),
      db.generatedExam.count({ where: { schoolId } }),
      db.questionBank.findMany({
        where: { schoolId },
        include: {
          analytics: true,
          subject: {
            select: {
              id: true,
              subjectName: true,
            },
          },
        },
        take: 100, // Limit for performance
        orderBy: {
          createdAt: "desc",
        },
      }),
      // Subject breakdown
      db.questionBank.groupBy({
        by: ["subjectId"],
        where: { schoolId },
        _count: {
          id: true,
        },
      }),
      // Difficulty breakdown
      db.questionBank.groupBy({
        by: ["difficulty"],
        where: { schoolId },
        _count: {
          id: true,
        },
      }),
      // Type breakdown
      db.questionBank.groupBy({
        by: ["questionType"],
        where: { schoolId },
        _count: {
          id: true,
        },
      }),
    ]);

    // Transform breakdowns
    const subjectBreakdown: Record<string, number> = {};
    for (const stat of subjectStats) {
      if (stat.subjectId) {
        subjectBreakdown[stat.subjectId] = stat._count.id;
      }
    }

    const difficultyBreakdown: any = {};
    for (const stat of difficultyStats) {
      difficultyBreakdown[stat.difficulty] = stat._count.id;
    }

    const typeBreakdown: any = {};
    for (const stat of typeStats) {
      typeBreakdown[stat.questionType] = stat._count.id;
    }

    return {
      success: true,
      data: {
        totalQuestions,
        totalTemplates,
        totalGeneratedExams,
        questions,
        subjectBreakdown,
        difficultyBreakdown,
        typeBreakdown,
      },
    };
  } catch (error) {
    console.error("Get analytics error:", error);
    return {
      success: false,
      error: "Failed to get analytics",
      code: "FETCH_FAILED",
      details: error instanceof Error ? error.message : undefined,
    };
  }
}

/**
 * Get performance analytics for a specific question
 */
export async function getQuestionPerformance(
  questionId: string
): Promise<
  ActionResponse<{
    analytics: any;
    recentAttempts: Array<{
      studentId: string;
      score: number;
      attemptedAt: Date;
    }>;
    distribution: Record<string, number>;
  }>
> {
  try {
    const session = await auth();
    if (!session?.user?.schoolId) {
      return {
        success: false,
        error: "Unauthorized - No school context",
        code: "NO_SCHOOL_CONTEXT",
      };
    }

    const schoolId = session.user.schoolId;

    // Get analytics
    const analytics = await db.questionAnalytics.findFirst({
      where: {
        questionId,
        schoolId,
      },
    });

    if (!analytics) {
      return {
        success: false,
        error: "Analytics not found",
        code: "ANALYTICS_NOT_FOUND",
      };
    }

    // Get recent attempts from marking results
    const recentAttempts = await db.markingResult.findMany({
      where: {
        questionId,
        schoolId,
      },
      select: {
        studentId: true,
        pointsAwarded: true,
        gradedAt: true,
      },
      take: 10,
      orderBy: {
        gradedAt: "desc",
      },
    });

    // Calculate score distribution
    const allAttempts = await db.markingResult.findMany({
      where: {
        questionId,
        schoolId,
      },
      select: {
        pointsAwarded: true,
        maxPoints: true,
      },
    });

    const distribution: Record<string, number> = {
      "0-20": 0,
      "21-40": 0,
      "41-60": 0,
      "61-80": 0,
      "81-100": 0,
    };

    for (const attempt of allAttempts) {
      const percentage = (Number(attempt.pointsAwarded) / Number(attempt.maxPoints)) * 100;
      if (percentage <= 20) distribution["0-20"]++;
      else if (percentage <= 40) distribution["21-40"]++;
      else if (percentage <= 60) distribution["41-60"]++;
      else if (percentage <= 80) distribution["61-80"]++;
      else distribution["81-100"]++;
    }

    return {
      success: true,
      data: {
        analytics,
        recentAttempts: recentAttempts.map((a) => ({
          studentId: a.studentId,
          score: Number(a.pointsAwarded),
          attemptedAt: a.gradedAt || new Date(),
        })),
        distribution,
      },
    };
  } catch (error) {
    console.error("Get question performance error:", error);
    return {
      success: false,
      error: "Failed to get performance data",
      code: "FETCH_FAILED",
      details: error instanceof Error ? error.message : undefined,
    };
  }
}

/**
 * Reset analytics for a question
 */
export async function resetQuestionAnalytics(
  questionId: string
): Promise<ActionResponse> {
  try {
    const session = await auth();
    if (!session?.user?.schoolId) {
      return {
        success: false,
        error: "Unauthorized - No school context",
        code: "NO_SCHOOL_CONTEXT",
      };
    }

    // Check admin permission
    if (session.user.role !== "ADMIN") {
      return {
        success: false,
        error: "Only administrators can reset analytics",
        code: "ADMIN_ONLY",
      };
    }

    const schoolId = session.user.schoolId;

    await db.questionAnalytics.updateMany({
      where: {
        questionId,
        schoolId,
      },
      data: {
        timesUsed: 0,
        avgScore: 0,
        successRate: 0,
        avgTimeSpent: 0,
        lastUsed: null,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Reset analytics error:", error);
    return {
      success: false,
      error: "Failed to reset analytics",
      code: "RESET_FAILED",
      details: error instanceof Error ? error.message : undefined,
    };
  }
}