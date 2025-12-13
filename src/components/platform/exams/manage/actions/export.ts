"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";
import { getExamsSchema } from "../validation";
import { arrayToCSV } from "@/components/file";
import type { ExamExportData, ActionResponse } from "./types";

/**
 * Export exams to CSV format
 */
export async function getExamsCSV(
  input?: Partial<z.infer<typeof getExamsSchema>>
): Promise<string> {
  try {
    const { schoolId } = await getTenantContext();
    if (!schoolId) {
      throw new Error("Missing school context");
    }

    const searchParams = getExamsSchema.parse(input ?? {});

    // Build where clause with filters
    const where: Record<string, unknown> = {
      schoolId,
      ...(searchParams.title
        ? { title: { contains: searchParams.title, mode: "insensitive" } }
        : {}),
      ...(searchParams.classId ? { classId: searchParams.classId } : {}),
      ...(searchParams.subjectId ? { subjectId: searchParams.subjectId } : {}),
      ...(searchParams.examType ? { examType: searchParams.examType } : {}),
      ...(searchParams.status ? { status: searchParams.status } : {}),
      ...(searchParams.examDate
        ? { examDate: new Date(searchParams.examDate) }
        : {}),
    };

    // Fetch ALL exams matching filters (no pagination for export)
    const exams = await db.exam.findMany({
      where,
      include: {
        class: {
          select: {
            name: true,
          },
        },
        subject: {
          select: {
            subjectName: true,
          },
        },
        _count: {
          select: {
            results: true,
          },
        },
      },
      orderBy: [{ examDate: "desc" }, { startTime: "asc" }],
    });

    // Transform data for CSV export
    const exportData: ExamExportData[] = exams.map((exam) => ({
      examId: exam.id,
      title: exam.title || "",
      description: exam.description || "",
      class: exam.class?.name || "",
      subject: exam.subject?.subjectName || "",
      examDate: exam.examDate
        ? new Date(exam.examDate).toISOString().split("T")[0]
        : "",
      startTime: exam.startTime || "",
      endTime: exam.endTime || "",
      duration: exam.duration || 0,
      totalMarks: exam.totalMarks || 0,
      passingMarks: exam.passingMarks || 0,
      examType: exam.examType || "",
      status: exam.status || "",
      resultsEntered: exam._count.results,
      createdAt: new Date(exam.createdAt).toISOString().split("T")[0],
    }));

    // Define CSV columns
    const columns = [
      { key: "examId" as const, label: "Exam ID" },
      { key: "title" as const, label: "Title" },
      { key: "description" as const, label: "Description" },
      { key: "class" as const, label: "Class" },
      { key: "subject" as const, label: "Subject" },
      { key: "examDate" as const, label: "Exam Date" },
      { key: "startTime" as const, label: "Start Time" },
      { key: "endTime" as const, label: "End Time" },
      { key: "duration" as const, label: "Duration (min)" },
      { key: "totalMarks" as const, label: "Total Marks" },
      { key: "passingMarks" as const, label: "Passing Marks" },
      { key: "examType" as const, label: "Exam Type" },
      { key: "status" as const, label: "Status" },
      { key: "resultsEntered" as const, label: "Results Entered" },
      { key: "createdAt" as const, label: "Created Date" },
    ];

    return arrayToCSV(exportData as unknown as Record<string, unknown>[], { columns });
  } catch (error) {
    console.error("Error exporting exams to CSV:", error);
    throw error;
  }
}

/**
 * Export exam results to CSV
 */
export async function getExamResultsCSV(input: {
  examId: string;
}): Promise<ActionResponse<string>> {
  try {
    const { schoolId } = await getTenantContext();
    if (!schoolId) {
      return {
        success: false,
        error: "Missing school context",
        code: "NO_SCHOOL_CONTEXT",
      };
    }

    const { examId } = z.object({ examId: z.string().min(1) }).parse(input);

    // Get exam details
    const exam = await db.exam.findFirst({
      where: { id: examId, schoolId },
      select: {
        title: true,
        class: { select: { name: true } },
        subject: { select: { subjectName: true } },
      },
    });

    if (!exam) {
      return {
        success: false,
        error: "Exam not found",
        code: "EXAM_NOT_FOUND",
      };
    }

    // Get results
    const results = await db.examResult.findMany({
      where: { examId, schoolId },
      include: {
        student: {
          select: {
            studentId: true,
            givenName: true,
            middleName: true,
            surname: true,
          },
        },
      },
      orderBy: { marksObtained: "desc" },
    });

    // Calculate ranks
    const resultsWithRank = results.map((result, index) => ({
      rank: result.isAbsent ? "Absent" : String(index + 1),
      studentId: result.student.studentId,
      studentName: `${result.student.givenName} ${
        result.student.middleName || ""
      } ${result.student.surname}`.trim(),
      marksObtained: result.marksObtained,
      totalMarks: result.totalMarks,
      percentage: result.percentage.toFixed(2),
      grade: result.grade || "",
      isAbsent: result.isAbsent ? "Yes" : "No",
      remarks: result.remarks || "",
    }));

    // Define columns
    const columns = [
      { key: "rank" as const, label: "Rank" },
      { key: "studentId" as const, label: "Student ID" },
      { key: "studentName" as const, label: "Student Name" },
      { key: "marksObtained" as const, label: "Marks Obtained" },
      { key: "totalMarks" as const, label: "Total Marks" },
      { key: "percentage" as const, label: "Percentage (%)" },
      { key: "grade" as const, label: "Grade" },
      { key: "isAbsent" as const, label: "Absent" },
      { key: "remarks" as const, label: "Remarks" },
    ];

    const csv = arrayToCSV(resultsWithRank, { columns });

    // Add header with exam details
    const header = `Exam Results Export\n` +
      `Exam: ${exam.title}\n` +
      `Class: ${exam.class?.name || ""}\n` +
      `Subject: ${exam.subject?.subjectName || ""}\n` +
      `Date: ${new Date().toISOString().split("T")[0]}\n\n`;

    return {
      success: true,
      data: header + csv,
    };
  } catch (error) {
    console.error("Error exporting exam results:", error);
    return {
      success: false,
      error: "Failed to export results",
      code: "EXPORT_FAILED",
    };
  }
}

/**
 * Export analytics summary to CSV
 */
export async function getAnalyticsCSV(input: {
  examId?: string;
  classId?: string;
  termId?: string;
}): Promise<ActionResponse<string>> {
  try {
    const { schoolId } = await getTenantContext();
    if (!schoolId) {
      return {
        success: false,
        error: "Missing school context",
        code: "NO_SCHOOL_CONTEXT",
      };
    }

    // Build query based on filters
    const where: Record<string, unknown> = {
      schoolId,
      status: "COMPLETED",
    };

    if (input.examId) {
      where.id = input.examId;
    }

    if (input.classId) {
      where.classId = input.classId;
    }

    if (input.termId) {
      where.termId = input.termId;
    }

    // Get exams with results
    const exams = await db.exam.findMany({
      where,
      include: {
        class: { select: { name: true } },
        subject: { select: { subjectName: true } },
        examResults: {
          select: {
            marksObtained: true,
            totalMarks: true,
            isAbsent: true,
          },
        },
      },
    });

    // Calculate analytics for each exam
    const analyticsData = exams.map((exam) => {
      const results = exam.examResults.filter((r) => !r.isAbsent);
      const totalStudents = exam.examResults.length;
      const presentStudents = results.length;
      const absentStudents = totalStudents - presentStudents;

      const passedStudents = results.filter(
        (r) => r.marksObtained >= exam.passingMarks
      ).length;

      const averageMarks =
        results.length > 0
          ? results.reduce((sum, r) => sum + r.marksObtained, 0) / results.length
          : 0;

      const passPercentage =
        presentStudents > 0 ? (passedStudents / presentStudents) * 100 : 0;

      return {
        examTitle: exam.title,
        className: exam.class?.name || "",
        subjectName: exam.subject?.subjectName || "",
        examDate: exam.examDate
          ? new Date(exam.examDate).toISOString().split("T")[0]
          : "",
        totalStudents,
        presentStudents,
        absentStudents,
        passedStudents,
        failedStudents: presentStudents - passedStudents,
        averageMarks: averageMarks.toFixed(2),
        passPercentage: passPercentage.toFixed(2),
      };
    });

    // Define columns
    const columns = [
      { key: "examTitle" as const, label: "Exam Title" },
      { key: "className" as const, label: "Class" },
      { key: "subjectName" as const, label: "Subject" },
      { key: "examDate" as const, label: "Exam Date" },
      { key: "totalStudents" as const, label: "Total Students" },
      { key: "presentStudents" as const, label: "Present" },
      { key: "absentStudents" as const, label: "Absent" },
      { key: "passedStudents" as const, label: "Passed" },
      { key: "failedStudents" as const, label: "Failed" },
      { key: "averageMarks" as const, label: "Average Marks" },
      { key: "passPercentage" as const, label: "Pass %" },
    ];

    const csv = arrayToCSV(analyticsData, { columns });

    return {
      success: true,
      data: csv,
    };
  } catch (error) {
    console.error("Error exporting analytics:", error);
    return {
      success: false,
      error: "Failed to export analytics",
      code: "EXPORT_FAILED",
    };
  }
}

/**
 * Get exams data for unified File Block export
 * Returns typed array for multi-format export (CSV, Excel, PDF)
 */
export async function getExamsExportData(
  input?: Partial<z.infer<typeof getExamsSchema>>
): Promise<ActionResponse<Array<{
  id: string;
  title: string;
  description: string | null;
  subjectName: string | null;
  className: string | null;
  examDate: Date;
  startTime: string;
  endTime: string;
  duration: number;
  totalMarks: number;
  passingMarks: number;
  examType: string;
  status: string;
  studentCount: number;
  averageScore: number | null;
  createdAt: Date;
}>>> {
  try {
    const { schoolId } = await getTenantContext();
    if (!schoolId) {
      return { success: false, error: "Missing school context" };
    }

    const searchParams = getExamsSchema.parse(input ?? {});

    // Build where clause with filters
    const where: Record<string, unknown> = {
      schoolId,
      ...(searchParams.title
        ? { title: { contains: searchParams.title, mode: "insensitive" } }
        : {}),
      ...(searchParams.classId ? { classId: searchParams.classId } : {}),
      ...(searchParams.subjectId ? { subjectId: searchParams.subjectId } : {}),
      ...(searchParams.examType ? { examType: searchParams.examType } : {}),
      ...(searchParams.status ? { status: searchParams.status } : {}),
      ...(searchParams.examDate
        ? { examDate: new Date(searchParams.examDate) }
        : {}),
    };

    // Fetch ALL exams matching filters (no pagination for export)
    const exams = await db.exam.findMany({
      where,
      include: {
        class: {
          select: {
            name: true,
          },
        },
        subject: {
          select: {
            subjectName: true,
          },
        },
        examResults: {
          select: {
            marksObtained: true,
            isAbsent: true,
          },
        },
      },
      orderBy: [{ examDate: "desc" }, { startTime: "asc" }],
    });

    // Transform data for export
    const exportData = exams.map((exam) => {
      // Calculate average score from results
      const presentResults = exam.examResults.filter((r: { marksObtained: number; isAbsent: boolean }) => !r.isAbsent);
      const averageScore = presentResults.length > 0
        ? (presentResults.reduce((sum: number, r: { marksObtained: number }) => sum + r.marksObtained, 0) / presentResults.length / (exam.totalMarks || 100)) * 100
        : null;

      return {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        subjectName: exam.subject?.subjectName || null,
        className: exam.class?.name || null,
        examDate: exam.examDate,
        startTime: exam.startTime,
        endTime: exam.endTime,
        duration: exam.duration,
        totalMarks: exam.totalMarks,
        passingMarks: exam.passingMarks,
        examType: exam.examType,
        status: exam.status,
        studentCount: exam.examResults.length,
        averageScore,
        createdAt: exam.createdAt,
      };
    });

    return { success: true, data: exportData };
  } catch (error) {
    console.error("[getExamsExportData] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch exam export data",
    };
  }
}