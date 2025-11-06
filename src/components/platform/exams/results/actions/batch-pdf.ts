/**
 * Batch PDF Generation with ZIP Download
 *
 * Server actions for:
 * - Generating multiple PDFs in batch
 * - Creating ZIP archives of PDFs
 * - Progress tracking for long operations
 * - Streaming large files to client
 */

"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";
import { generatePDF } from "../lib/pdf-generator";
import { renderTemplate } from "../lib/templates";
import {
  gradeBoundaryCache,
  schoolBrandingCache,
  schoolCache,
  cacheKeys,
} from "@/lib/cache/exam-cache";
import type { ActionResponse } from "../../manage/actions/types";

// Note: Install jszip with: pnpm add jszip @types/jszip
// For now, we'll use a mock implementation

// Validation schemas
const batchPDFSchema = z.object({
  examId: z.string().min(1, "Exam ID is required"),
  studentIds: z.array(z.string()).optional(), // If not provided, generate for all
  template: z.enum(["classic", "modern", "minimal"]).optional().default("modern"),
  options: z.object({
    includeQuestionBreakdown: z.boolean().optional().default(false),
    includeGradeDistribution: z.boolean().optional().default(true),
    includeClassRank: z.boolean().optional().default(true),
    includeFeedback: z.boolean().optional().default(false),
    includeSchoolLogo: z.boolean().optional().default(true),
    includeSignatures: z.boolean().optional().default(false),
  }).optional(),
});

const termReportCardSchema = z.object({
  termId: z.string().min(1, "Term ID is required"),
  classId: z.string().optional(),
  studentIds: z.array(z.string()).optional(),
  template: z.enum(["classic", "modern", "minimal"]).optional().default("modern"),
  includeAttendance: z.boolean().optional().default(true),
  includeRemarks: z.boolean().optional().default(true),
});

// Types
export interface BatchPDFResult {
  totalRequested: number;
  successCount: number;
  failureCount: number;
  files: Array<{
    studentId: string;
    studentName: string;
    filename: string;
    pdf?: Buffer;
    error?: string;
  }>;
  zipData?: Buffer; // Base64 encoded ZIP file
  zipFilename?: string;
}

export interface BatchProgress {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  current: number;
  total: number;
  message: string;
  startedAt: Date;
  completedAt?: Date;
  result?: BatchPDFResult;
}

// In-memory progress tracking (in production, use Redis or database)
const batchProgressMap = new Map<string, BatchProgress>();

/**
 * Generate PDFs for multiple students in an exam
 */
export async function generateBatchExamPDFs(
  input: z.infer<typeof batchPDFSchema>
): Promise<ActionResponse<{ batchId: string }>> {
  try {
    const { schoolId } = await getTenantContext();
    if (!schoolId) {
      return { success: false, error: "Missing school context" };
    }

    const parsed = batchPDFSchema.parse(input);

    // Verify exam exists
    const exam = await db.exam.findFirst({
      where: {
        id: parsed.examId,
        schoolId,
      },
      include: {
        class: {
          select: { name: true },
        },
        subject: {
          select: { subjectName: true },
        },
      },
    });

    if (!exam) {
      return { success: false, error: "Exam not found" };
    }

    // Get students to generate PDFs for
    let studentIds = parsed.studentIds;

    if (!studentIds || studentIds.length === 0) {
      // Get all students who took the exam
      const examResults = await db.examResult.findMany({
        where: {
          examId: exam.id,
          schoolId,
        },
        select: {
          studentId: true,
        },
      });
      studentIds = examResults.map((r) => r.studentId);
    }

    if (studentIds.length === 0) {
      return { success: false, error: "No students found for this exam" };
    }

    // Create batch job
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const batchProgress: BatchProgress = {
      id: batchId,
      status: "pending",
      current: 0,
      total: studentIds.length,
      message: "Initializing batch PDF generation...",
      startedAt: new Date(),
    };

    batchProgressMap.set(batchId, batchProgress);

    // Start async processing (in production, use a job queue)
    processBatchPDFGeneration(batchId, exam, studentIds, parsed.options, schoolId).catch(
      (error) => {
        const progress = batchProgressMap.get(batchId);
        if (progress) {
          progress.status = "failed";
          progress.message = `Failed: ${error.message}`;
          progress.completedAt = new Date();
        }
      }
    );

    return {
      success: true,
      data: { batchId },
    };
  } catch (error) {
    console.error("Error starting batch PDF generation:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Invalid batch parameters",
        details: error.issues,
      };
    }

    return {
      success: false,
      error: "Failed to start batch PDF generation",
      details: error,
    };
  }
}

/**
 * Process batch PDF generation asynchronously
 */
async function processBatchPDFGeneration(
  batchId: string,
  exam: any,
  studentIds: string[],
  options: any,
  schoolId: string
) {
  const progress = batchProgressMap.get(batchId);
  if (!progress) return;

  progress.status = "processing";
  progress.message = "Fetching school information...";

  // Get cached school data
  const schoolCacheKey = cacheKeys.school(schoolId);
  const brandingCacheKey = cacheKeys.schoolBranding(schoolId);
  const boundariesCacheKey = cacheKeys.gradeBoundaries(schoolId);

  let school = schoolCache.get(schoolCacheKey);
  let branding = schoolBrandingCache.get(brandingCacheKey);
  let boundaries = gradeBoundaryCache.get(boundariesCacheKey);

  // Fetch if not cached
  if (!school) {
    school = await db.school.findUnique({
      where: { id: schoolId },
    });
    if (school) schoolCache.set(schoolCacheKey, school);
  }

  if (!branding) {
    branding = await db.schoolBranding.findUnique({
      where: { schoolId },
    });
    if (branding) schoolBrandingCache.set(brandingCacheKey, branding);
  }

  if (!boundaries) {
    boundaries = await db.gradeBoundary.findMany({
      where: { schoolId },
      orderBy: { minScore: "desc" },
    });
    if (boundaries.length > 0) {
      gradeBoundaryCache.set(boundariesCacheKey, boundaries);
    }
  }

  const result: BatchPDFResult = {
    totalRequested: studentIds.length,
    successCount: 0,
    failureCount: 0,
    files: [],
  };

  // Generate PDF for each student
  for (let i = 0; i < studentIds.length; i++) {
    const studentId = studentIds[i];
    progress.current = i + 1;
    progress.message = `Generating PDF ${i + 1} of ${studentIds.length}...`;

    try {
      // Get student's exam result
      const examResult = await db.examResult.findFirst({
        where: {
          examId: exam.id,
          studentId,
          schoolId,
        },
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
      });

      if (!examResult) {
        result.files.push({
          studentId,
          studentName: "Unknown",
          filename: "",
          error: "No exam result found",
        });
        result.failureCount++;
        continue;
      }

      const studentName = `${examResult.student.givenName} ${
        examResult.student.middleName || ""
      } ${examResult.student.surname}`.trim();

      // Find grade boundary for GPA
      const boundary = boundaries?.find(
        (b) =>
          examResult.percentage >= Number(b.minScore) &&
          examResult.percentage <= Number(b.maxScore)
      );

      // Prepare PDF data
      const pdfData = {
        exam: {
          title: exam.title,
          date: exam.examDate,
          className: exam.class.name,
          subjectName: exam.subject.subjectName,
          totalMarks: exam.totalMarks,
          passingMarks: exam.passingMarks,
        },
        student: {
          id: examResult.studentId,
          studentId: examResult.student.studentId || "",
          studentName: studentName,
          marksObtained: examResult.marksObtained,
          totalMarks: examResult.totalMarks,
          percentage: examResult.percentage,
          grade: examResult.grade || "",
          gpa: boundary ? Number(boundary.gpaValue) : null,
          rank: 0,
          isAbsent: examResult.isAbsent,
          remarks: examResult.remarks,
        },
        school: {
          name: school?.name || "School",
          logo: school?.logoUrl || undefined,
          address: school?.address || undefined,
        },
      };

      // Generate PDF HTML
      const html = renderTemplate("modern", pdfData as any);

      // Generate PDF buffer (mock implementation)
      // In production, use puppeteer or similar to generate actual PDF
      const pdfBuffer = Buffer.from(`PDF content for ${studentName}`, "utf-8");

      const filename = `${exam.title.replace(/[^a-z0-9]/gi, "_")}_${
        examResult.student.studentId || "student"
      }.pdf`;

      result.files.push({
        studentId,
        studentName,
        filename,
        pdf: pdfBuffer,
      });
      result.successCount++;
    } catch (error) {
      result.files.push({
        studentId,
        studentName: "Unknown",
        filename: "",
        error: `Failed to generate PDF: ${error}`,
      });
      result.failureCount++;
    }
  }

  // Create ZIP file (mock implementation)
  // In production, use jszip or archiver library
  if (result.successCount > 0) {
    progress.message = "Creating ZIP archive...";

    try {
      // Mock ZIP creation
      const zipBuffer = Buffer.from("ZIP archive content", "utf-8");
      result.zipData = zipBuffer;
      result.zipFilename = `exam_results_${exam.title.replace(
        /[^a-z0-9]/gi,
        "_"
      )}_${Date.now()}.zip`;
    } catch (error) {
      console.error("Error creating ZIP:", error);
    }
  }

  // Update progress
  progress.status = "completed";
  progress.message = `Generated ${result.successCount} PDFs successfully`;
  progress.completedAt = new Date();
  progress.result = result;
}

/**
 * Get batch generation progress
 */
export async function getBatchProgress(
  batchId: string
): Promise<ActionResponse<BatchProgress | null>> {
  try {
    const progress = batchProgressMap.get(batchId);

    if (!progress) {
      return {
        success: false,
        error: "Batch job not found",
      };
    }

    return {
      success: true,
      data: progress,
    };
  } catch (error) {
    console.error("Error getting batch progress:", error);
    return {
      success: false,
      error: "Failed to get batch progress",
      details: error,
    };
  }
}

/**
 * Download batch ZIP file
 */
export async function downloadBatchZIP(
  batchId: string
): Promise<ActionResponse<{ zipData: string; filename: string }>> {
  try {
    const progress = batchProgressMap.get(batchId);

    if (!progress) {
      return {
        success: false,
        error: "Batch job not found",
      };
    }

    if (progress.status !== "completed") {
      return {
        success: false,
        error: "Batch job is not completed yet",
      };
    }

    if (!progress.result?.zipData || !progress.result?.zipFilename) {
      return {
        success: false,
        error: "No ZIP file available",
      };
    }

    // Convert buffer to base64 for transmission
    const zipData = progress.result.zipData.toString("base64");

    return {
      success: true,
      data: {
        zipData,
        filename: progress.result.zipFilename,
      },
    };
  } catch (error) {
    console.error("Error downloading batch ZIP:", error);
    return {
      success: false,
      error: "Failed to download ZIP file",
      details: error,
    };
  }
}

/**
 * Generate term report cards in batch
 */
export async function generateBatchReportCards(
  input: z.infer<typeof termReportCardSchema>
): Promise<ActionResponse<{ batchId: string }>> {
  try {
    const { schoolId } = await getTenantContext();
    if (!schoolId) {
      return { success: false, error: "Missing school context" };
    }

    const parsed = termReportCardSchema.parse(input);

    // Verify term exists
    const term = await db.term.findFirst({
      where: {
        id: parsed.termId,
        schoolId,
      },
      include: {
        schoolYear: true,
      },
    });

    if (!term) {
      return { success: false, error: "Term not found" };
    }

    // Build student filter
    const studentFilter: any = { schoolId };
    if (parsed.studentIds && parsed.studentIds.length > 0) {
      studentFilter.id = { in: parsed.studentIds };
    }
    if (parsed.classId) {
      studentFilter.studentClasses = {
        some: {
          classId: parsed.classId,
        },
      };
    }

    // Get students
    const students = await db.student.findMany({
      where: studentFilter,
      select: {
        id: true,
        studentId: true,
        givenName: true,
        middleName: true,
        surname: true,
      },
    });

    if (students.length === 0) {
      return { success: false, error: "No students found" };
    }

    // Create batch job
    const batchId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const batchProgress: BatchProgress = {
      id: batchId,
      status: "pending",
      current: 0,
      total: students.length,
      message: "Initializing report card generation...",
      startedAt: new Date(),
    };

    batchProgressMap.set(batchId, batchProgress);

    // Start async processing
    processReportCardGeneration(
      batchId,
      term,
      students,
      parsed,
      schoolId
    ).catch((error) => {
      const progress = batchProgressMap.get(batchId);
      if (progress) {
        progress.status = "failed";
        progress.message = `Failed: ${error.message}`;
        progress.completedAt = new Date();
      }
    });

    return {
      success: true,
      data: { batchId },
    };
  } catch (error) {
    console.error("Error starting report card generation:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Invalid parameters",
        details: error.issues,
      };
    }

    return {
      success: false,
      error: "Failed to start report card generation",
      details: error,
    };
  }
}

/**
 * Process report card generation asynchronously
 */
async function processReportCardGeneration(
  batchId: string,
  term: any,
  students: any[],
  options: any,
  schoolId: string
) {
  const progress = batchProgressMap.get(batchId);
  if (!progress) return;

  progress.status = "processing";

  const result: BatchPDFResult = {
    totalRequested: students.length,
    successCount: 0,
    failureCount: 0,
    files: [],
  };

  // Process each student
  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    progress.current = i + 1;
    progress.message = `Generating report card ${i + 1} of ${students.length}...`;

    try {
      // Get or create report card
      let reportCard = await db.reportCard.findFirst({
        where: {
          schoolId,
          studentId: student.id,
          termId: term.id,
        },
        include: {
          grades: {
            include: {
              subject: true,
            },
          },
        },
      });

      if (!reportCard) {
        // Create placeholder report card
        reportCard = await db.reportCard.create({
          data: {
            schoolId,
            studentId: student.id,
            termId: term.id,
            isPublished: false,
          },
          include: {
            grades: {
              include: {
                subject: true,
              },
            },
          },
        });
      }

      const studentName = `${student.givenName} ${student.middleName || ""} ${
        student.surname
      }`.trim();

      // Generate report card PDF (mock)
      const pdfBuffer = Buffer.from(
        `Report card for ${studentName} - ${term.name}`,
        "utf-8"
      );

      const filename = `report_card_${student.studentId || student.id}_${
        term.name
      }.pdf`;

      result.files.push({
        studentId: student.id,
        studentName,
        filename,
        pdf: pdfBuffer,
      });
      result.successCount++;
    } catch (error) {
      result.files.push({
        studentId: student.id,
        studentName: `${student.givenName} ${student.surname}`,
        filename: "",
        error: `Failed: ${error}`,
      });
      result.failureCount++;
    }
  }

  // Create ZIP (mock)
  if (result.successCount > 0) {
    progress.message = "Creating ZIP archive...";
    const zipBuffer = Buffer.from("Report cards ZIP", "utf-8");
    result.zipData = zipBuffer;
    result.zipFilename = `report_cards_${term.name.replace(
      /[^a-z0-9]/gi,
      "_"
    )}_${Date.now()}.zip`;
  }

  progress.status = "completed";
  progress.message = `Generated ${result.successCount} report cards`;
  progress.completedAt = new Date();
  progress.result = result;
}

/**
 * Cancel batch job
 */
export async function cancelBatchJob(
  batchId: string
): Promise<ActionResponse<void>> {
  try {
    const progress = batchProgressMap.get(batchId);

    if (!progress) {
      return {
        success: false,
        error: "Batch job not found",
      };
    }

    if (progress.status === "completed") {
      return {
        success: false,
        error: "Cannot cancel completed job",
      };
    }

    progress.status = "failed";
    progress.message = "Cancelled by user";
    progress.completedAt = new Date();

    return { success: true };
  } catch (error) {
    console.error("Error cancelling batch job:", error);
    return {
      success: false,
      error: "Failed to cancel job",
      details: error,
    };
  }
}

/**
 * Clean up old batch jobs (run periodically)
 */
export async function cleanupBatchJobs(): Promise<void> {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours

  for (const [batchId, progress] of batchProgressMap.entries()) {
    if (progress.completedAt) {
      const age = now - progress.completedAt.getTime();
      if (age > maxAge) {
        batchProgressMap.delete(batchId);
      }
    }
  }
}