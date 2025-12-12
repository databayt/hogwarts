/**
 * Shared query builders and utilities for grades/results
 * Consolidates query logic to eliminate duplication and improve maintainability
 *
 * Pattern follows announcements module for consistency:
 * - Centralized query builders
 * - Type-safe Prisma queries
 * - Multi-tenant filtering (schoolId)
 * - Pagination and sorting utilities
 */

import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

// ============================================================================
// Types
// ============================================================================

export type ResultListFilters = {
  studentId?: string;
  classId?: string;
  assignmentId?: string;
  examId?: string;
  subjectId?: string;
  grade?: string;
  search?: string; // Search by student name or assignment title
};

export type PaginationParams = {
  page: number;
  perPage: number;
};

export type SortParam = {
  id: string;
  desc?: boolean;
};

export type ResultSortParams = {
  sort?: SortParam[];
};

export type ResultQueryParams = ResultListFilters &
  PaginationParams &
  ResultSortParams;

// Select types for different query contexts
export const resultListSelect = {
  id: true,
  schoolId: true,
  studentId: true,
  classId: true,
  assignmentId: true,
  examId: true,
  subjectId: true,
  score: true,
  maxScore: true,
  percentage: true,
  grade: true,
  feedback: true,
  gradedAt: true,
  createdAt: true,
  student: {
    select: {
      id: true,
      givenName: true,
      surname: true,
    },
  },
  class: {
    select: {
      id: true,
      name: true,
    },
  },
  assignment: {
    select: {
      id: true,
      title: true,
      totalPoints: true,
    },
  },
  exam: {
    select: {
      id: true,
      title: true,
      totalMarks: true,
    },
  },
  subject: {
    select: {
      id: true,
      subjectName: true,
    },
  },
} as const;

export const resultDetailSelect = {
  id: true,
  schoolId: true,
  studentId: true,
  classId: true,
  assignmentId: true,
  examId: true,
  subjectId: true,
  score: true,
  maxScore: true,
  percentage: true,
  grade: true,
  title: true,
  description: true,
  feedback: true,
  submittedAt: true,
  gradedAt: true,
  gradedBy: true,
  createdAt: true,
  updatedAt: true,
  student: {
    select: {
      id: true,
      givenName: true,
      surname: true,
      email: true,
      studentId: true,
    },
  },
  class: {
    select: {
      id: true,
      name: true,
    },
  },
  assignment: {
    select: {
      id: true,
      title: true,
      description: true,
      totalPoints: true,
      dueDate: true,
    },
  },
  exam: {
    select: {
      id: true,
      title: true,
      description: true,
      totalMarks: true,
      examDate: true,
    },
  },
  subject: {
    select: {
      id: true,
      subjectName: true,
    },
  },
} as const;

// ============================================================================
// Query Builders
// ============================================================================

/**
 * Build where clause for result queries
 * @param schoolId - School ID for multi-tenant filtering
 * @param filters - Additional filters
 * @returns Prisma where input
 */
export function buildResultWhere(
  schoolId: string,
  filters: ResultListFilters = {}
): Prisma.ResultWhereInput {
  const where: Prisma.ResultWhereInput = {
    schoolId,
  };

  // ID filters
  if (filters.studentId) {
    where.studentId = filters.studentId;
  }

  if (filters.classId) {
    where.classId = filters.classId;
  }

  if (filters.assignmentId) {
    where.assignmentId = filters.assignmentId;
  }

  if (filters.examId) {
    where.examId = filters.examId;
  }

  if (filters.subjectId) {
    where.subjectId = filters.subjectId;
  }

  // Grade filter
  if (filters.grade) {
    where.grade = filters.grade;
  }

  // Text search - search by student name or assignment title
  if (filters.search) {
    where.OR = [
      {
        student: {
          givenName: {
            contains: filters.search,
            mode: Prisma.QueryMode.insensitive,
          },
        },
      },
      {
        student: {
          surname: {
            contains: filters.search,
            mode: Prisma.QueryMode.insensitive,
          },
        },
      },
      {
        assignment: {
          title: {
            contains: filters.search,
            mode: Prisma.QueryMode.insensitive,
          },
        },
      },
      {
        exam: {
          title: {
            contains: filters.search,
            mode: Prisma.QueryMode.insensitive,
          },
        },
      },
    ];
  }

  return where;
}

/**
 * Build order by clause for result queries
 * @param sortParams - Sort parameters
 * @returns Prisma order by input
 */
export function buildResultOrderBy(
  sortParams?: SortParam[]
): Prisma.ResultOrderByWithRelationInput[] {
  if (sortParams && Array.isArray(sortParams) && sortParams.length > 0) {
    return sortParams.map((s) => ({
      [s.id]: s.desc === true ? Prisma.SortOrder.desc : Prisma.SortOrder.asc,
    }));
  }

  // Default: most recent first
  return [{ gradedAt: Prisma.SortOrder.desc }];
}

/**
 * Build pagination params
 * @param page - Page number (1-indexed)
 * @param perPage - Items per page
 * @returns Object with skip and take
 */
export function buildPagination(page: number, perPage: number) {
  return {
    skip: (page - 1) * perPage,
    take: perPage,
  };
}

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Get results list with filtering, sorting, and pagination
 * @param schoolId - School ID for multi-tenant filtering
 * @param params - Query parameters
 * @returns Promise with results and total count
 */
export async function getResultsList(
  schoolId: string,
  params: Partial<ResultQueryParams> = {}
) {
  const where = buildResultWhere(schoolId, params);
  const orderBy = buildResultOrderBy(params.sort);
  const { skip, take } = buildPagination(
    params.page ?? 1,
    params.perPage ?? 10
  );

  // Execute queries in parallel for better performance
  const [rows, count] = await Promise.all([
    db.result.findMany({
      where,
      orderBy,
      skip,
      take,
      select: resultListSelect,
    }),
    db.result.count({ where }),
  ]);

  return { rows, count };
}

/**
 * Get a single result by ID with full details
 * @param schoolId - School ID for multi-tenant filtering
 * @param resultId - Result ID
 * @returns Promise with result or null
 */
export async function getResultDetail(schoolId: string, resultId: string) {
  return db.result.findFirst({
    where: {
      id: resultId,
      schoolId,
    },
    select: resultDetailSelect,
  });
}

/**
 * Get results for a specific student
 * @param schoolId - School ID
 * @param studentId - Student ID
 * @returns Promise with student results
 */
export async function getStudentResults(schoolId: string, studentId: string) {
  return db.result.findMany({
    where: {
      schoolId,
      studentId,
    },
    orderBy: buildResultOrderBy(),
    select: resultListSelect,
  });
}

/**
 * Get results for a specific class
 * @param schoolId - School ID
 * @param classId - Class ID
 * @returns Promise with class results
 */
export async function getClassResults(schoolId: string, classId: string) {
  return db.result.findMany({
    where: {
      schoolId,
      classId,
    },
    orderBy: buildResultOrderBy(),
    select: resultListSelect,
  });
}

/**
 * Get results for a specific assignment
 * @param schoolId - School ID
 * @param assignmentId - Assignment ID
 * @returns Promise with assignment results
 */
export async function getAssignmentResults(
  schoolId: string,
  assignmentId: string
) {
  return db.result.findMany({
    where: {
      schoolId,
      assignmentId,
    },
    orderBy: [{ percentage: Prisma.SortOrder.desc }],
    select: resultListSelect,
  });
}

/**
 * Get results for a specific exam
 * @param schoolId - School ID
 * @param examId - Exam ID
 * @returns Promise with exam results
 */
export async function getExamResults(schoolId: string, examId: string) {
  return db.result.findMany({
    where: {
      schoolId,
      examId,
    },
    orderBy: [{ percentage: Prisma.SortOrder.desc }],
    select: resultListSelect,
  });
}

/**
 * Get results for a specific subject
 * @param schoolId - School ID
 * @param subjectId - Subject ID
 * @returns Promise with subject results
 */
export async function getSubjectResults(schoolId: string, subjectId: string) {
  return db.result.findMany({
    where: {
      schoolId,
      subjectId,
    },
    orderBy: buildResultOrderBy(),
    select: resultListSelect,
  });
}

/**
 * Get result statistics for a school
 * @param schoolId - School ID
 * @returns Promise with statistics
 */
export async function getResultStats(schoolId: string) {
  const [
    total,
    gradeDistribution,
    avgPercentage,
    recentCount,
  ] = await Promise.all([
    db.result.count({ where: { schoolId } }),
    db.result.groupBy({
      by: ["grade"],
      where: { schoolId },
      _count: { grade: true },
    }),
    db.result.aggregate({
      where: { schoolId },
      _avg: { percentage: true },
    }),
    db.result.count({
      where: {
        schoolId,
        gradedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
    }),
  ]);

  return {
    total,
    gradeDistribution: gradeDistribution.reduce((acc, item) => {
      acc[item.grade] = item._count.grade;
      return acc;
    }, {} as Record<string, number>),
    averagePercentage: avgPercentage._avg.percentage ?? 0,
    recentCount,
  };
}

/**
 * Get student performance summary
 * @param schoolId - School ID
 * @param studentId - Student ID
 * @returns Promise with performance summary
 */
export async function getStudentPerformanceSummary(
  schoolId: string,
  studentId: string
) {
  const results = await db.result.findMany({
    where: { schoolId, studentId },
    select: {
      percentage: true,
      grade: true,
      subject: { select: { subjectName: true } },
    },
  });

  const avgPercentage =
    results.length > 0
      ? results.reduce((sum, r) => sum + r.percentage, 0) / results.length
      : 0;

  const bySubject: Record<string, { count: number; avgPercentage: number }> = {};
  results.forEach((r) => {
    const subject = r.subject?.subjectName || "Unknown";
    if (!bySubject[subject]) {
      bySubject[subject] = { count: 0, avgPercentage: 0 };
    }
    bySubject[subject].count++;
    bySubject[subject].avgPercentage += r.percentage;
  });

  Object.keys(bySubject).forEach((subject) => {
    bySubject[subject].avgPercentage /= bySubject[subject].count;
  });

  return {
    totalResults: results.length,
    averagePercentage: avgPercentage,
    bySubject,
  };
}

// ============================================================================
// Bulk Query Functions
// ============================================================================

/**
 * Check if multiple results exist and belong to school
 * @param schoolId - School ID
 * @param resultIds - Array of result IDs
 * @returns Promise with array of found IDs
 */
export async function verifyResultOwnership(
  schoolId: string,
  resultIds: string[]
) {
  const results = await db.result.findMany({
    where: {
      id: { in: resultIds },
      schoolId,
    },
    select: {
      id: true,
    },
  });

  return results.map((r) => r.id);
}

/**
 * Get results by multiple IDs
 * @param schoolId - School ID
 * @param resultIds - Array of result IDs
 * @returns Promise with results
 */
export async function getResultsByIds(schoolId: string, resultIds: string[]) {
  return db.result.findMany({
    where: {
      id: { in: resultIds },
      schoolId,
    },
    select: resultDetailSelect,
  });
}

// ============================================================================
// Analytics Functions (for Detail Page)
// ============================================================================

/**
 * Get student's grade history for sparkline/trend visualization
 * @param schoolId - School ID
 * @param studentId - Student ID
 * @param limit - Number of recent grades to fetch (default 10)
 * @returns Promise with recent grades ordered by date
 */
export async function getStudentGradeHistory(
  schoolId: string,
  studentId: string,
  limit = 10
) {
  const results = await db.result.findMany({
    where: {
      schoolId,
      studentId,
    },
    orderBy: { gradedAt: Prisma.SortOrder.desc },
    take: limit,
    select: {
      id: true,
      percentage: true,
      grade: true,
      gradedAt: true,
      assignment: { select: { title: true } },
      exam: { select: { title: true } },
      subject: { select: { subjectName: true } },
    },
  });

  // Calculate trend
  if (results.length < 2) {
    return { results: results.reverse(), trend: "stable" as const, average: results[0]?.percentage || 0 };
  }

  const reversed = [...results].reverse(); // Oldest to newest
  const avgPercentage = reversed.reduce((sum, r) => sum + r.percentage, 0) / reversed.length;

  // Compare first half to second half for trend
  const midpoint = Math.floor(reversed.length / 2);
  const firstHalf = reversed.slice(0, midpoint);
  const secondHalf = reversed.slice(midpoint);

  const firstAvg = firstHalf.reduce((sum, r) => sum + r.percentage, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, r) => sum + r.percentage, 0) / secondHalf.length;

  let trend: "improving" | "declining" | "stable" = "stable";
  if (secondAvg - firstAvg > 5) trend = "improving";
  else if (firstAvg - secondAvg > 5) trend = "declining";

  return { results: reversed, trend, average: avgPercentage };
}

/**
 * Get class grade statistics for comparison
 * @param schoolId - School ID
 * @param classId - Class ID
 * @param assignmentId - Optional assignment ID for specific assignment stats
 * @param examId - Optional exam ID for specific exam stats
 * @returns Promise with class statistics
 */
export async function getClassGradeStats(
  schoolId: string,
  classId: string,
  assignmentId?: string | null,
  examId?: string | null
) {
  const where: Prisma.ResultWhereInput = {
    schoolId,
    classId,
  };

  // Filter by specific assignment or exam if provided
  if (assignmentId) {
    where.assignmentId = assignmentId;
  } else if (examId) {
    where.examId = examId;
  }

  const [results, gradeDistribution] = await Promise.all([
    db.result.findMany({
      where,
      select: {
        id: true,
        studentId: true,
        percentage: true,
        grade: true,
      },
      orderBy: { percentage: Prisma.SortOrder.desc },
    }),
    db.result.groupBy({
      by: ["grade"],
      where,
      _count: { grade: true },
    }),
  ]);

  if (results.length === 0) {
    return {
      classAverage: 0,
      highestScore: 0,
      lowestScore: 0,
      totalStudents: 0,
      gradeDistribution: {} as Record<string, number>,
      rankings: [] as Array<{ studentId: string; percentage: number; rank: number }>,
    };
  }

  const percentages = results.map((r) => r.percentage);
  const classAverage = percentages.reduce((sum, p) => sum + p, 0) / percentages.length;
  const highestScore = Math.max(...percentages);
  const lowestScore = Math.min(...percentages);

  // Build grade distribution
  const distribution: Record<string, number> = {};
  gradeDistribution.forEach((item) => {
    distribution[item.grade] = item._count.grade;
  });

  // Build rankings (already sorted by percentage desc)
  const rankings = results.map((r, index) => ({
    studentId: r.studentId,
    percentage: r.percentage,
    rank: index + 1,
  }));

  return {
    classAverage,
    highestScore,
    lowestScore,
    totalStudents: results.length,
    gradeDistribution: distribution,
    rankings,
  };
}

/**
 * Get student's rank in class for a specific result
 * @param schoolId - School ID
 * @param studentId - Student ID
 * @param classStats - Pre-fetched class stats
 * @returns Rank and percentile
 */
export function getStudentRank(
  studentId: string,
  classStats: Awaited<ReturnType<typeof getClassGradeStats>>
) {
  const studentRanking = classStats.rankings.find((r) => r.studentId === studentId);
  if (!studentRanking) {
    return { rank: 0, percentile: 0, totalStudents: classStats.totalStudents };
  }

  const percentile = Math.round(
    ((classStats.totalStudents - studentRanking.rank + 1) / classStats.totalStudents) * 100
  );

  return {
    rank: studentRanking.rank,
    percentile,
    totalStudents: classStats.totalStudents,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format student name from result
 * @param result - Result with student relation
 * @returns Formatted student name
 */
export function formatStudentName(result: {
  student: { givenName: string; surname: string } | null;
}): string {
  if (!result.student) return "Unknown";
  return `${result.student.givenName} ${result.student.surname}`;
}

/**
 * Calculate grade from percentage
 * @param percentage - Score percentage
 * @returns Letter grade
 */
export function calculateGrade(percentage: number): string {
  if (percentage >= 90) return "A+";
  if (percentage >= 85) return "A";
  if (percentage >= 80) return "B+";
  if (percentage >= 75) return "B";
  if (percentage >= 70) return "C+";
  if (percentage >= 65) return "C";
  if (percentage >= 60) return "D+";
  if (percentage >= 50) return "D";
  return "F";
}

/**
 * Format result for display in table row
 * @param result - Result from query
 * @returns Formatted result row
 */
export function formatResultRow(result: Awaited<ReturnType<typeof getResultsList>>["rows"][number]) {
  return {
    id: result.id,
    studentName: formatStudentName(result),
    assignmentTitle: result.assignment?.title || result.exam?.title || "Unknown",
    className: result.class?.name || "Unknown",
    score: Number(result.score),
    maxScore: Number(result.maxScore),
    percentage: result.percentage,
    grade: result.grade,
    createdAt: result.createdAt.toISOString(),
  };
}
