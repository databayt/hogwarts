/**
 * Secured CRUD Operations for Exam Management
 *
 * Example implementation showing how to apply the permission layer
 * to existing exam management actions.
 */

"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";
import { examCreateSchema, examUpdateSchema } from "../validation";
import type { ActionResponse } from "./types";
import { checkExamConflicts } from "./conflict-detection";
import {
  secureExamAction,
  secureResultAction,
} from "../../lib/secure-actions";
import {
  getPermissionContext,
  canAccessExam,
  canModifyExam,
  applyPermissionFilters,
} from "../../lib/permissions";

/**
 * Creates a new exam with permission check
 */
export const createExamSecured = secureExamAction.create(
  async function createExam(
    input: z.infer<typeof examCreateSchema>
  ): Promise<ActionResponse<{ id: string }>> {
    try {
      const context = await getPermissionContext();
      if (!context) {
        return {
          success: false,
          error: "Not authenticated",
          code: "UNAUTHORIZED",
        };
      }

      const { schoolId } = context;
      const parsed = examCreateSchema.parse(input);

      // Additional permission check: Teacher can only create exams for their classes
      if (context.isTeacher && context.teacherId) {
        const teacherClass = await db.class.findFirst({
          where: {
            id: parsed.classId,
            teacherId: context.teacherId,
            schoolId,
          },
        });

        if (!teacherClass) {
          return {
            success: false,
            error: "You can only create exams for classes you teach",
            code: "FORBIDDEN",
          };
        }
      }

      // Check if class exists and belongs to school
      const classExists = await db.class.findFirst({
        where: {
          id: parsed.classId,
          schoolId,
        },
      });

      if (!classExists) {
        return {
          success: false,
          error: "Class not found or does not belong to your school",
          code: "INVALID_CLASS",
        };
      }

      // Check if subject exists and belongs to school
      const subjectExists = await db.subject.findFirst({
        where: {
          id: parsed.subjectId,
          schoolId,
        },
      });

      if (!subjectExists) {
        return {
          success: false,
          error: "Subject not found or does not belong to your school",
          code: "INVALID_SUBJECT",
        };
      }

      // Check for timetable conflicts
      const conflictCheck = await checkExamConflicts({
        examDate: parsed.examDate,
        startTime: parsed.startTime,
        endTime: parsed.endTime,
        classId: parsed.classId,
      });

      if (!conflictCheck.success) {
        return {
          success: false,
          error: conflictCheck.error || "Failed to check conflicts",
          code: "CONFLICT_CHECK_FAILED",
        };
      }

      // Warn about conflicts but allow creation (with suggestions)
      if (conflictCheck.data?.hasConflicts) {
        const highSeverityConflicts = conflictCheck.data.conflicts.filter(
          (c) => c.severity === "high"
        );

        if (highSeverityConflicts.length > 0 && !parsed.forceCreate) {
          return {
            success: false,
            error: "Exam conflicts with existing schedule",
            code: "SCHEDULE_CONFLICT",
            details: {
              conflicts: conflictCheck.data.conflicts,
              suggestions: conflictCheck.data.suggestions,
              message: "Set forceCreate=true to create despite conflicts",
            },
          };
        }
      }

      const exam = await db.exam.create({
        data: {
          schoolId,
          title: parsed.title,
          description: parsed.description || null,
          classId: parsed.classId,
          subjectId: parsed.subjectId,
          examDate: parsed.examDate,
          startTime: parsed.startTime,
          endTime: parsed.endTime,
          duration: parsed.duration,
          totalMarks: parsed.totalMarks,
          passingMarks: parsed.passingMarks,
          examType: parsed.examType,
          instructions: parsed.instructions || null,
          status: "PLANNED",
        },
      });

      revalidatePath("/exams");
      return {
        success: true,
        data: { id: exam.id },
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: "Invalid input data",
          code: "VALIDATION_ERROR",
          details: error.issues,
        };
      }

      console.error("Error creating exam:", error);
      return {
        success: false,
        error: "Failed to create exam",
        code: "CREATE_FAILED",
      };
    }
  }
);

/**
 * Updates an exam with permission check
 */
export const updateExamSecured = secureExamAction.update(
  async function updateExam(
    input: z.infer<typeof examUpdateSchema>
  ): Promise<ActionResponse> {
    try {
      const context = await getPermissionContext();
      if (!context) {
        return {
          success: false,
          error: "Not authenticated",
          code: "UNAUTHORIZED",
        };
      }

      const { schoolId } = context;
      const parsed = examUpdateSchema.parse(input);
      const { id, ...rest } = parsed;

      // Check if user can modify this exam
      const canModify = await canModifyExam(context, id);
      if (!canModify) {
        return {
          success: false,
          error: "You do not have permission to modify this exam",
          code: "FORBIDDEN",
        };
      }

      // Check if exam exists and belongs to school
      const examExists = await db.exam.findFirst({
        where: {
          id,
          schoolId,
        },
      });

      if (!examExists) {
        return {
          success: false,
          error: "Exam not found or does not belong to your school",
          code: "EXAM_NOT_FOUND",
        };
      }

      // Check if exam is not in COMPLETED status
      if (examExists.status === "COMPLETED") {
        return {
          success: false,
          error: "Cannot update a completed exam",
          code: "EXAM_COMPLETED",
        };
      }

      // Build update data object
      const data: Record<string, unknown> = {};

      if (typeof rest.title !== "undefined") data.title = rest.title;
      if (typeof rest.description !== "undefined")
        data.description = rest.description || null;
      if (typeof rest.classId !== "undefined") data.classId = rest.classId;
      if (typeof rest.subjectId !== "undefined") data.subjectId = rest.subjectId;
      if (typeof rest.examDate !== "undefined") data.examDate = rest.examDate;
      if (typeof rest.startTime !== "undefined") data.startTime = rest.startTime;
      if (typeof rest.endTime !== "undefined") data.endTime = rest.endTime;
      if (typeof rest.duration !== "undefined") data.duration = rest.duration;
      if (typeof rest.totalMarks !== "undefined") data.totalMarks = rest.totalMarks;
      if (typeof rest.passingMarks !== "undefined")
        data.passingMarks = rest.passingMarks;
      if (typeof rest.examType !== "undefined") data.examType = rest.examType;
      if (typeof rest.instructions !== "undefined")
        data.instructions = rest.instructions || null;

      await db.exam.update({
        where: { id },
        data,
      });

      revalidatePath("/exams");
      return {
        success: true,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: "Invalid input data",
          code: "VALIDATION_ERROR",
          details: error.issues,
        };
      }

      console.error("Error updating exam:", error);
      return {
        success: false,
        error: "Failed to update exam",
        code: "UPDATE_FAILED",
      };
    }
  }
);

/**
 * Deletes an exam with permission check
 */
export const deleteExamSecured = secureExamAction.delete(
  async function deleteExam(examId: string): Promise<ActionResponse> {
    try {
      const context = await getPermissionContext();
      if (!context) {
        return {
          success: false,
          error: "Not authenticated",
          code: "UNAUTHORIZED",
        };
      }

      const { schoolId } = context;

      // Check if user can modify this exam
      const canModify = await canModifyExam(context, examId);
      if (!canModify) {
        return {
          success: false,
          error: "You do not have permission to delete this exam",
          code: "FORBIDDEN",
        };
      }

      // Check if exam exists
      const exam = await db.exam.findFirst({
        where: {
          id: examId,
          schoolId,
        },
      });

      if (!exam) {
        return {
          success: false,
          error: "Exam not found",
          code: "EXAM_NOT_FOUND",
        };
      }

      // Check if exam has results
      const hasResults = await db.examResult.findFirst({
        where: {
          examId,
          schoolId,
        },
      });

      if (hasResults) {
        return {
          success: false,
          error: "Cannot delete exam with existing results",
          code: "HAS_RESULTS",
        };
      }

      await db.exam.delete({
        where: { id: examId },
      });

      revalidatePath("/exams");
      return { success: true };
    } catch (error) {
      console.error("Error deleting exam:", error);
      return {
        success: false,
        error: "Failed to delete exam",
        code: "DELETE_FAILED",
      };
    }
  }
);

/**
 * Get exams with permission-based filtering
 */
export const getExamsSecured = secureExamAction.read(
  async function getExams(params: any) {
    try {
      const context = await getPermissionContext();
      if (!context) {
        return {
          success: false,
          error: "Not authenticated",
          code: "UNAUTHORIZED",
        };
      }

      // Apply permission filters
      const filters = await applyPermissionFilters(context, "exam");

      const exams = await db.exam.findMany({
        where: {
          ...filters,
          ...(params.where || {}),
        },
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
              examResults: true,
            },
          },
        },
        orderBy: params.orderBy || { examDate: "desc" },
        skip: params.skip || 0,
        take: params.take || 20,
      });

      return {
        success: true,
        data: exams,
      };
    } catch (error) {
      console.error("Error fetching exams:", error);
      return {
        success: false,
        error: "Failed to fetch exams",
        code: "FETCH_FAILED",
      };
    }
  }
);

/**
 * Get exam results with permission check
 */
export const getExamResultsSecured = secureResultAction.read(
  async function getExamResults(examId: string) {
    try {
      const context = await getPermissionContext();
      if (!context) {
        return {
          success: false,
          error: "Not authenticated",
          code: "UNAUTHORIZED",
        };
      }

      // Check if user can access this exam
      const canAccess = await canAccessExam(context, examId);
      if (!canAccess) {
        return {
          success: false,
          error: "You do not have permission to view these results",
          code: "FORBIDDEN",
        };
      }

      // Build query based on user role
      let whereClause: any = {
        examId,
        schoolId: context.schoolId,
      };

      // Students can only see their own results
      if (context.isStudent && context.studentId) {
        whereClause.studentId = context.studentId;
      }

      // Guardians can only see their children's results
      if (context.isGuardian && context.guardianId) {
        whereClause.student = {
          guardians: {
            some: {
              guardianId: context.guardianId,
            },
          },
        };
      }

      const results = await db.examResult.findMany({
        where: whereClause,
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
      });

      return {
        success: true,
        data: results,
      };
    } catch (error) {
      console.error("Error fetching exam results:", error);
      return {
        success: false,
        error: "Failed to fetch results",
        code: "FETCH_FAILED",
      };
    }
  }
);