"use server";

// Results Block Server Actions

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";
import type {
  StudentResultDTO,
  ResultSummary,
  ResultAnalytics,
  PDFResultData,
} from "./types";
import {
  generateSinglePDFSchema,
  batchPDFRequestSchema,
  getResultsSchema,
  getAnalyticsSchema,
} from "./validation";
import {
  calculateMarkSummation,
  calculateRanks,
  calculateGradeDistribution,
  calculateClassAverage,
  calculateClassAveragePercentage,
  calculateHighestMarks,
  calculateLowestMarks,
  identifyTopPerformers,
  identifyNeedsAttention,
} from "./lib/calculator";
import { generatePDF, generatePDFFileName, applyPDFDefaults } from "./lib/pdf-generator";
import { renderTemplate } from "./lib/templates";

/**
 * Get results for an exam
 */
export async function getExamResults(input: z.infer<typeof getResultsSchema>) {
  try {
    const { schoolId } = await getTenantContext();
    if (!schoolId) throw new Error("Missing school context");

    const { examId, includeAbsent, includeQuestionBreakdown } =
      getResultsSchema.parse(input);

    // Fetch exam with results
    const exam = await db.exam.findFirst({
      where: { id: examId, schoolId },
      include: {
        class: { select: { name: true } },
        subject: { select: { subjectName: true } },
        examResults: {
          where: includeAbsent ? {} : { isAbsent: false },
          include: {
            student: {
              select: {
                id: true,
                studentId: true,
                givenName: true,
                middleName: true,
                surname: true,
              },
            },
          },
          orderBy: { marksObtained: "desc" },
        },
      },
    });

    if (!exam) {
      return { success: false, error: "Exam not found" };
    }

    // Get grade boundaries
    const boundaries = await db.gradeBoundary.findMany({
      where: { schoolId },
      orderBy: { minScore: "desc" },
    });

    // Transform results
    let results: StudentResultDTO[] = exam.examResults.map((result): StudentResultDTO => ({
      id: result.id,
      studentId: result.student.studentId || "",
      studentName: `${result.student.givenName} ${result.student.middleName || ""} ${result.student.surname}`.trim(),
      marksObtained: result.marksObtained,
      totalMarks: result.totalMarks,
      percentage: result.percentage,
      grade: result.grade,
      gpa: boundaries.length > 0
        ? Number(boundaries.find((b) =>
            result.percentage >= Number(b.minScore) &&
            result.percentage <= Number(b.maxScore)
          )?.gpaValue || 0)
        : null,
      rank: 0, // Will be calculated below
      isAbsent: result.isAbsent,
      remarks: result.remarks,
    }));

    // Calculate ranks
    results = calculateRanks(results);

    // Optionally include question breakdown
    if (includeQuestionBreakdown) {
      // Fetch marking results for each student
      const markingResults = await db.markingResult.findMany({
        where: {
          examId,
          schoolId,
          studentId: { in: results.map((r) => r.id) },
        },
        include: {
          question: {
            select: {
              questionText: true,
              questionType: true,
              points: true,
            },
          },
        },
        orderBy: { questionId: "asc" },
      });

      // Group by student
      const resultsByStudent = new Map(results.map((r) => [r.id, r]));

      markingResults.forEach((mr) => {
        const result = resultsByStudent.get(mr.studentId);
        if (result) {
          if (!result.questionBreakdown) {
            result.questionBreakdown = [];
          }

          result.questionBreakdown.push({
            questionNumber: result.questionBreakdown.length + 1,
            questionText: mr.question.questionText,
            questionType: mr.question.questionType,
            maxPoints: Number(mr.maxPoints),
            pointsAwarded: Number(mr.pointsAwarded),
            isCorrect: mr.pointsAwarded === mr.maxPoints,
            feedback: mr.feedback,
          });
        }
      });
    }

    return {
      success: true,
      data: results,
    };
  } catch (error) {
    console.error("Get exam results error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get analytics for an exam
 */
export async function getExamAnalytics(
  input: z.infer<typeof getAnalyticsSchema>
) {
  try {
    const { schoolId } = await getTenantContext();
    if (!schoolId) throw new Error("Missing school context");

    const { examId } = getAnalyticsSchema.parse(input);

    // Get results first
    const resultsResponse = await getExamResults({
      examId,
      includeAbsent: false,
      includeQuestionBreakdown: true,
    });

    if (!resultsResponse.success || !resultsResponse.data) {
      return { success: false, error: "Failed to fetch results" };
    }

    const results = resultsResponse.data;

    // Get exam details
    const exam = await db.exam.findFirst({
      where: { id: examId, schoolId },
      include: {
        class: { select: { name: true } },
        subject: { select: { subjectName: true } },
      },
    });

    if (!exam) {
      return { success: false, error: "Exam not found" };
    }

    // Get grade boundaries
    const boundaries = await db.gradeBoundary.findMany({
      where: { schoolId },
      orderBy: { minScore: "desc" },
    });

    // Calculate summary
    const summary: ResultSummary = {
      examId: exam.id,
      examTitle: exam.title,
      examDate: exam.examDate,
      className: exam.class.name,
      subjectName: exam.subject.subjectName,
      totalMarks: exam.totalMarks,
      passingMarks: exam.passingMarks,
      totalStudents: results.length,
      presentStudents: results.filter((r) => !r.isAbsent).length,
      absentStudents: results.filter((r) => r.isAbsent).length,
      passedStudents: results.filter(
        (r) => !r.isAbsent && r.marksObtained >= exam.passingMarks
      ).length,
      failedStudents: results.filter(
        (r) => !r.isAbsent && r.marksObtained < exam.passingMarks
      ).length,
      averageMarks: calculateClassAverage(results),
      averagePercentage: calculateClassAveragePercentage(results),
      highestMarks: calculateHighestMarks(results),
      lowestMarks: calculateLowestMarks(results),
      gradeDistribution: calculateGradeDistribution(results),
    };

    // Calculate grade distribution with details
    const gradeDistribution = Object.entries(summary.gradeDistribution).map(
      ([grade, count]) => {
        const boundary = boundaries.find((b) => b.grade === grade);
        return {
          grade,
          count,
          percentage: (count / summary.presentStudents) * 100,
          gpaValue: boundary ? Number(boundary.gpaValue) : 0,
          color: getGradeColor(grade),
        };
      }
    );

    // Calculate performance trends
    const performanceTrends = [
      {
        range: "90-100",
        count: results.filter((r) => r.percentage >= 90).length,
        percentage: 0,
      },
      {
        range: "80-89",
        count: results.filter((r) => r.percentage >= 80 && r.percentage < 90)
          .length,
        percentage: 0,
      },
      {
        range: "70-79",
        count: results.filter((r) => r.percentage >= 70 && r.percentage < 80)
          .length,
        percentage: 0,
      },
      {
        range: "60-69",
        count: results.filter((r) => r.percentage >= 60 && r.percentage < 70)
          .length,
        percentage: 0,
      },
      {
        range: "50-59",
        count: results.filter((r) => r.percentage >= 50 && r.percentage < 60)
          .length,
        percentage: 0,
      },
      {
        range: "0-49",
        count: results.filter((r) => r.percentage < 50).length,
        percentage: 0,
      },
    ].map((trend) => ({
      ...trend,
      percentage: (trend.count / summary.presentStudents) * 100,
    }));

    const analytics: ResultAnalytics = {
      examId,
      summary,
      gradeDistribution,
      performanceTrends,
      topPerformers: identifyTopPerformers(results, 5),
      needsAttention: identifyNeedsAttention(results, 50, 5),
      questionAnalytics: [], // TODO: Implement question analytics
    };

    return {
      success: true,
      data: analytics,
    };
  } catch (error) {
    console.error("Get exam analytics error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Generate single PDF for a student
 */
export async function generateStudentPDF(
  input: z.infer<typeof generateSinglePDFSchema>
) {
  try {
    const { schoolId } = await getTenantContext();
    if (!schoolId) throw new Error("Missing school context");

    const parsed = generateSinglePDFSchema.parse(input);
    const options = applyPDFDefaults(parsed.options);

    // Get student result
    const resultsResponse = await getExamResults({
      examId: parsed.examId,
      includeAbsent: true,
      includeQuestionBreakdown: options.includeQuestionBreakdown,
    });

    if (!resultsResponse.success || !resultsResponse.data) {
      return { success: false, error: "Failed to fetch results" };
    }

    const studentResult = resultsResponse.data.find(
      (r) => r.id === parsed.studentId
    );

    if (!studentResult) {
      return { success: false, error: "Student result not found" };
    }

    // Get exam and school data
    const [exam, school] = await Promise.all([
      db.exam.findFirst({
        where: { id: parsed.examId, schoolId },
        include: {
          class: { select: { name: true } },
          subject: { select: { subjectName: true } },
        },
      }),
      db.school.findFirst({
        where: { id: schoolId },
        include: {
          branding: true,
        },
      }),
    ]);

    if (!exam || !school) {
      return { success: false, error: "Data not found" };
    }

    // Get analytics if needed
    let analytics = undefined;
    if (options.includeClassAnalytics) {
      const analyticsResponse = await getExamAnalytics({
        examId: parsed.examId,
      });

      if (analyticsResponse.success && analyticsResponse.data) {
        analytics = {
          classAverage: analyticsResponse.data.summary.averagePercentage,
          classRank: studentResult.rank,
          totalStudents: analyticsResponse.data.summary.presentStudents,
          gradeDistribution: analyticsResponse.data.gradeDistribution,
        };
      }
    }

    // Prepare PDF data
    const pdfData: PDFResultData = {
      student: studentResult,
      exam: {
        title: exam.title,
        date: exam.examDate,
        className: exam.class.name,
        subjectName: exam.subject.subjectName,
        totalMarks: exam.totalMarks,
        passingMarks: exam.passingMarks,
      },
      school: {
        name: school.name,
        logo: school.logoUrl || undefined,
        address: school.address || undefined,
        phone: school.phoneNumber || undefined,
        email: school.email || undefined,
      },
      analytics,
      metadata: {
        generatedAt: new Date(),
        generatedBy: schoolId,
        schoolName: school.name,
        academicYear: new Date().getFullYear().toString(),
      },
    };

    // Generate PDF
    const templateComponent = renderTemplate(options.template, pdfData);
    const fileName = generatePDFFileName(
      studentResult.studentName,
      exam.title,
      options.template
    );

    const result = await generatePDF(templateComponent, fileName);

    return {
      success: result.success,
      data: result,
    };
  } catch (error) {
    console.error("Generate student PDF error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Helper function to get grade color
 */
function getGradeColor(grade: string): string {
  const colors: Record<string, string> = {
    "A+": "#10B981",
    A: "#34D399",
    "B+": "#60A5FA",
    B: "#3B82F6",
    "C+": "#FBBF24",
    C: "#F59E0B",
    D: "#F97316",
    F: "#EF4444",
  };

  return colors[grade] || "#6B7280";
}
