// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Students Server Actions Module
 *
 * RESPONSIBILITY: Student lifecycle management - create, update, enroll, link guardians
 *
 * WHAT IT HANDLES:
 * - Student records: Create, update, delete basic info (name, DOB, gender, enrollment date)
 * - Class enrollment: Assign students to classes (delegated to classes/actions.ts)
 * - Guardian linking: Associate parents/guardians with students
 * - Data validation: Email uniqueness per school, phone normalization
 * - Bulk operations: Export student lists as CSV
 * - Search & filter: Find students by name, enrollment status, class
 *
 * KEY ALGORITHMS:
 * 1. createStudent(): Validates userId uniqueness globally, normalizes strings
 * 2. getStudents(): Supports filtering by name, class, year level with pagination
 * 3. linkGuardian(): Creates many-to-many relationship between student and guardian
 * 4. Email deduplication: UNIQUE constraint per school prevents duplicates within tenant
 *
 * MULTI-TENANT SAFETY (CRITICAL):
 * - ALL student records must have schoolId (required field in schema)
 * - Email uniqueness constraint is scoped: @@unique([email, schoolId])
 *   (Same email allowed across different schools)
 * - Guardian linking validates both student and guardian are in same school
 * - Search/filter always includes { where: { schoolId } } clause
 * - Cross-tenant access prevented by middleware auth layer
 *
 * GOTCHAS & NON-OBVIOUS BEHAVIOR:
 * 1. userId field is optional but global-unique when present (one user → many students)
 *    (Rationale: Student might use different auth identity, or multi-school student)
 * 2. Email deduplication is PER SCHOOL - not school-dashboard-wide
 * 3. Deleting student doesn't cascade to enrollments (manual cleanup may be needed)
 * 4. Guardian linking allows same person to be linked multiple times (no dedup check)
 * 5. Mobile/phone normalization removes spaces/dashes (design decision for storage)
 *
 * VALIDATION RULES:
 * - Email: Must be unique within school
 * - Name fields: Trim and validate presence
 * - Date fields: Optional but must be valid dates if provided
 * - Gender: Enum constraint (MALE | FEMALE | OTHER)
 * - Phone: Normalized but not validated against real carriers
 *
 * EXPORT FUNCTIONALITY:
 * - arrayToCSV() handles encoding (prevents Excel corruption with special chars)
 * - Exports full student list with basic demographic data
 * - Consider filtering by year level for large exports
 *
 * PERFORMANCE NOTES:
 * - getStudents() includes multiple optional filters - ensure indexes on (schoolId, email) and (schoolId, name)
 * - CSV export loads all students into memory - could be problematic for 10K+ students
 * - Consider streaming export or pagination for very large schools
 * - Guardian queries use include (eager load) - monitor N+1 if accessed frequently
 *
 * PERMISSION NOTES:
 * - Teachers can view only their class students (enforce in UI)
 * - Parents can view only their children (enforce via linkage query)
 * - Students can view own profile (enforce in route guards)
 * - Admins can view all students in school
 *
 * FUTURE IMPROVEMENTS:
 * - Add student status tracking (active, graduated, transferred, suspended)
 * - Implement bulk student import from CSV
 * - Add student photo/profile image support
 * - Support multiple email addresses per student
 * - Add student ID card generation/printing
 * - Implement student transfer between schools
 * - Add medical/allergy information management
 * - Support emergency contact management (separate from guardians)
 * - Implement student activity tracking (attendance, grades, behavior)
 */

"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { auth } from "@/auth"
import { z } from "zod"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { withArchiveScope } from "@/lib/archive-scope"
import { mintTempPassword } from "@/lib/credentials"
import { deliverStudentCredentials } from "@/lib/credentials-delivery"
import { db } from "@/lib/db"
import { ensureStudentFeeAssignments } from "@/lib/fee-auto-assign"
import { getGradeLabel } from "@/lib/grade-label"
import { getModelOrThrow } from "@/lib/prisma-guards"
import { revalidateSpotlight } from "@/lib/spotlight-cache"
import { generateStudentUsername } from "@/lib/student-username"
import { syncStudentGrades } from "@/lib/sync-student-grades"
import { getTenantContext } from "@/lib/tenant-context"
import { arrayToCSV } from "@/components/file"
import {
  assertStudentPermission,
  getAuthContext,
} from "@/components/school-dashboard/listings/students/authorization"
import {
  getStudentsSchema,
  studentCreateSchema,
  studentUpdateSchema,
} from "@/components/school-dashboard/listings/students/validation"
import { getLabels, getNames } from "@/components/translation/person"
import { search } from "@/components/translation/search"
import { fullName } from "@/components/translation/util"

// ============================================================================
// Status Helpers
// ============================================================================

/** Derive display status from DB status + data completeness */
function deriveStudentDisplayStatus(s: any): string {
  if (s.status === "SUSPENDED") return "suspended"
  if (s.status === "GRADUATED") return "graduated"
  if (s.status === "TRANSFERRED") return "transferred"
  if (s.status === "DROPPED_OUT") return "dropped_out"
  if (s.status === "INACTIVE") return "inactive"
  if (!s.academicGradeId && !s.sectionId) return "unassigned"
  if (!s._count?.studentGuardians) return "incomplete"
  return "active"
}

/** Build Prisma WHERE filter for a display status value */
function buildStudentStatusFilter(status: string): Record<string, any> {
  switch (status) {
    case "active":
      return {
        status: "ACTIVE",
        OR: [{ academicGradeId: { not: null } }, { sectionId: { not: null } }],
      }
    case "unassigned":
      return { status: "ACTIVE", academicGradeId: null, sectionId: null }
    case "incomplete":
      return { status: "ACTIVE" }
    case "inactive":
      return { status: "INACTIVE" }
    case "suspended":
      return { status: "SUSPENDED" }
    case "graduated":
      return { status: "GRADUATED" }
    case "transferred":
      return { status: "TRANSFERRED" }
    case "dropped_out":
      return { status: "DROPPED_OUT" }
    default:
      return {}
  }
}

// ============================================================================
// Constants
// ============================================================================

const STUDENTS_PATH = "/students"

// ============================================================================
// Grade + Section Queries
// ============================================================================

/**
 * Fetch academic grades and sections for the school (used by student form).
 * Sections include student count for capacity display.
 */
export async function getGradesAndSections(): Promise<
  ActionResponse<{
    grades: Array<{
      id: string
      name: string
      gradeNumber: number
      level: { id: string; name: string; level: string } | null
    }>
    sections: Array<{
      id: string
      name: string
      gradeId: string
      maxCapacity: number
      currentCount: number
    }>
  }>
> {
  try {
    const session = await auth()
    if (!session?.user) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    const [grades, sections] = await Promise.all([
      db.academicGrade.findMany({
        where: { schoolId },
        orderBy: { gradeNumber: "asc" },
        select: {
          id: true,
          name: true,
          gradeNumber: true,
          level: { select: { id: true, name: true, level: true } },
        },
      }),
      db.section.findMany({
        where: { schoolId },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          gradeId: true,
          maxCapacity: true,
          _count: { select: { students: true } },
        },
      }),
    ])

    return {
      success: true,
      data: {
        grades,
        sections: sections.map((s) => ({
          id: s.id,
          name: s.name,
          gradeId: s.gradeId,
          maxCapacity: s.maxCapacity,
          currentCount: s._count.students,
        })),
      },
    }
  } catch (error) {
    console.error("[getGradesAndSections] Error:", error)
    return actionError(
      ACTION_ERRORS.LOAD_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}

// ============================================================================
// Auto-Enrollment Helper
// ============================================================================

/**
 * Auto-enroll a student in all classes for their grade.
 * Uses upsert so it's safe to call multiple times (idempotent).
 */
async function autoEnrollStudentInClasses(
  studentId: string,
  gradeId: string,
  schoolId: string
): Promise<void> {
  try {
    const gradeClasses = await db.class.findMany({
      where: { schoolId, gradeId },
      select: { id: true },
    })

    if (gradeClasses.length === 0) return

    await Promise.all(
      gradeClasses.map((cls) =>
        db.studentClass.upsert({
          where: {
            schoolId_studentId_classId: {
              schoolId,
              studentId,
              classId: cls.id,
            },
          },
          create: {
            schoolId,
            studentId,
            classId: cls.id,
          },
          update: {},
        })
      )
    )
  } catch (error) {
    // Non-blocking: log but don't fail the parent operation
    console.error("[autoEnrollStudentInClasses] Error:", error)
  }
}

// ============================================================================
// Mutations
// ============================================================================

/**
 * Create a new student
 * @param input - Student data
 * @returns Action response with student ID
 */
export async function createStudent(
  input: z.infer<typeof studentCreateSchema>
): Promise<ActionResponse<{ id: string }>> {
  try {
    // Get authentication context
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    // Get tenant context
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    // Check permission
    try {
      assertStudentPermission(authContext, "create", { schoolId })
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : ACTION_ERRORS.UNAUTHORIZED,
      }
    }

    // Parse and validate input
    const parsed = studentCreateSchema.parse(input)

    let normalizedUserId: string | null =
      parsed.userId && parsed.userId.trim().length > 0
        ? parsed.userId.trim()
        : null

    if (normalizedUserId) {
      // Ensure the referenced user exists to avoid FK violation
      const userModel = getModelOrThrow("user")
      const user = await userModel.findFirst({
        where: { id: normalizedUserId },
      })
      if (!user) {
        normalizedUserId = null
      } else {
        // Check if this userId is already being used by ANY student (global unique constraint)
        const studentModel = getModelOrThrow("student")
        const existingStudent = await studentModel.findFirst({
          where: {
            userId: normalizedUserId,
          },
        })
        if (existingStudent) {
          normalizedUserId = null // Don't use this userId if it's already taken
        }
      }
    }

    // Pre-generate the per-school student code (YYGGNNNN) so username and
    // Student.studentId stay in sync from creation — avoids a second update.
    const generatedCode = await generateStudentUsername({
      schoolId,
      academicGradeId: parsed.academicGradeId || null,
    })

    // Create student record
    const studentModel = getModelOrThrow("student")
    const row = await studentModel.create({
      data: {
        schoolId,
        studentId: generatedCode,
        firstName: parsed.firstName ?? "",
        middleName: parsed.middleName ?? null,
        lastName: parsed.lastName ?? "",
        // Persist contact fields so fee-due / reminder channels have a target
        // (previously dropped at create — see fee-overdue cron recipient logic).
        email: parsed.email || null,
        mobileNumber: parsed.mobileNumber || null,
        dateOfBirth: parsed.dateOfBirth
          ? new Date(parsed.dateOfBirth)
          : new Date(),
        gender: parsed.gender ?? "male",
        profilePhotoUrl: parsed.profilePhotoUrl || null,
        ...(parsed.enrollmentDate
          ? { enrollmentDate: new Date(parsed.enrollmentDate) }
          : {}),
        userId: normalizedUserId,
        academicGradeId: parsed.academicGradeId || null,
        sectionId: parsed.sectionId || null,
      },
    })

    // Auto-enroll in classes if grade is set
    if (parsed.academicGradeId) {
      await autoEnrollStudentInClasses(row.id, parsed.academicGradeId, schoolId)

      // Founder contract: every student-create path with a known grade
      // ends with FeeAssignment rows. Idempotent + transactional.
      try {
        await ensureStudentFeeAssignments({
          schoolId,
          studentId: row.id,
          academicGradeId: parsed.academicGradeId,
        })
      } catch (err) {
        console.error(
          "[createStudent] ensureStudentFeeAssignments failed:",
          err
        )
      }
    }

    // Revalidate cache
    revalidatePath(STUDENTS_PATH)
    revalidateSpotlight(schoolId)

    return { success: true, data: { id: row.id } }
  } catch (error) {
    console.error("[createStudent] Error:", error, {
      input,
      timestamp: new Date().toISOString(),
    })

    if (error instanceof z.ZodError) {
      return actionError(
        ACTION_ERRORS.VALIDATION_ERROR,
        error.issues.map((e) => e.message).join(", ")
      )
    }

    return actionError(
      ACTION_ERRORS.STUDENT_CREATE_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}

/**
 * Update an existing student
 * @param input - Student update data
 * @returns Action response
 */
export async function updateStudent(
  input: z.infer<typeof studentUpdateSchema>
): Promise<ActionResponse<void>> {
  try {
    // Get authentication context
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    // Get tenant context
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    // Check permission
    try {
      assertStudentPermission(authContext, "update", { schoolId })
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : ACTION_ERRORS.UNAUTHORIZED,
      }
    }

    // Parse and validate input
    const parsed = studentUpdateSchema.parse(input)
    const { id, ...rest } = parsed

    // Build update data object
    const data: Record<string, unknown> = {}
    if (typeof rest.firstName !== "undefined") data.firstName = rest.firstName
    if (typeof rest.middleName !== "undefined")
      data.middleName = rest.middleName ?? null
    if (typeof rest.lastName !== "undefined") data.lastName = rest.lastName
    if (typeof rest.gender !== "undefined") data.gender = rest.gender
    if (typeof rest.userId !== "undefined") {
      const trimmed = rest.userId?.trim()
      if (trimmed) {
        const userModel = getModelOrThrow("user")
        const user = await userModel.findFirst({
          where: { id: trimmed },
        })
        if (user) {
          // Check if this userId is already being used by ANY other student (global unique constraint)
          const studentModel = getModelOrThrow("student")
          const existingStudent = await studentModel.findFirst({
            where: {
              userId: trimmed,
              NOT: { id }, // Exclude current student
            },
          })
          data.userId = existingStudent ? null : trimmed
        } else {
          data.userId = null
        }
      } else {
        data.userId = null
      }
    }
    if (typeof rest.dateOfBirth !== "undefined") {
      data.dateOfBirth = rest.dateOfBirth ? new Date(rest.dateOfBirth) : null
    }
    if (typeof rest.enrollmentDate !== "undefined") {
      data.enrollmentDate = rest.enrollmentDate
        ? new Date(rest.enrollmentDate)
        : null
    }
    if (typeof rest.profilePhotoUrl !== "undefined")
      data.profilePhotoUrl = rest.profilePhotoUrl || null
    // Contact fields are editable for fine-tuning reminder channels.
    if (typeof rest.email !== "undefined") data.email = rest.email || null
    if (typeof rest.mobileNumber !== "undefined")
      data.mobileNumber = rest.mobileNumber || null
    if (typeof rest.academicGradeId !== "undefined") {
      data.academicGradeId = rest.academicGradeId || null
    }
    if (typeof rest.sectionId !== "undefined") {
      data.sectionId = rest.sectionId || null
    }

    // Update student (using updateMany for tenant safety)
    const studentModel = getModelOrThrow("student")
    await studentModel.updateMany({ where: { id, schoolId }, data })

    // Auto-enroll in classes if grade is set
    const gradeId = rest.academicGradeId ?? undefined
    if (gradeId) {
      await autoEnrollStudentInClasses(id, gradeId, schoolId)

      // Grade change → re-run fee auto-assign so any new grade-specific
      // structures attach. Existing assignments (admin discounts,
      // scholarships) are left alone — the helper only inserts missing rows.
      try {
        await ensureStudentFeeAssignments({
          schoolId,
          studentId: id,
          academicGradeId: gradeId,
        })
      } catch (err) {
        console.error(
          "[updateStudent] ensureStudentFeeAssignments failed:",
          err
        )
      }
    }

    // Revalidate cache
    revalidatePath(STUDENTS_PATH)
    revalidateSpotlight(schoolId)

    return { success: true, data: undefined }
  } catch (error) {
    console.error("[updateStudent] Error:", error, {
      input,
      timestamp: new Date().toISOString(),
    })

    if (error instanceof z.ZodError) {
      return actionError(
        ACTION_ERRORS.VALIDATION_ERROR,
        error.issues.map((e) => e.message).join(", ")
      )
    }

    return actionError(
      ACTION_ERRORS.STUDENT_UPDATE_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}

/**
 * Delete a student
 * @param input - Student ID
 * @returns Action response
 */
export async function deleteStudent(input: {
  id: string
}): Promise<ActionResponse<void>> {
  try {
    // Get authentication context
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    // Get tenant context
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    // Check permission
    try {
      assertStudentPermission(authContext, "delete", { schoolId })
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : ACTION_ERRORS.UNAUTHORIZED,
      }
    }

    // Parse and validate input
    const { id } = z.object({ id: z.string().min(1) }).parse(input)

    // Cascade validation: check for dependencies before deletion
    const [
      attendanceCount,
      examResultCount,
      feeAssignmentCount,
      submissionCount,
    ] = await Promise.all([
      db.attendance.count({ where: { studentId: id, schoolId } }),
      db.examResult.count({ where: { studentId: id, schoolId } }),
      db.feeAssignment.count({ where: { studentId: id, schoolId } }),
      db.assignmentSubmission.count({ where: { studentId: id, schoolId } }),
    ])

    if (attendanceCount > 0) {
      return {
        success: false,
        code: "STUDENT_HAS_ATTENDANCE",
      }
    }
    if (examResultCount > 0) {
      return {
        success: false,
        code: "STUDENT_HAS_RESULTS",
      }
    }
    if (feeAssignmentCount > 0) {
      return {
        success: false,
        code: "STUDENT_HAS_FEES",
      }
    }
    if (submissionCount > 0) {
      return {
        success: false,
        code: "STUDENT_HAS_SUBMISSIONS",
      }
    }

    // Auto-clean safe-to-delete dependent records in a transaction
    const studentModel = getModelOrThrow("student")
    await db.$transaction(async (tx) => {
      // Clean up non-critical bridge/tracking records
      await tx.studentClass.deleteMany({
        where: { studentId: id, schoolId },
      })
      await tx.studentYearLevel.deleteMany({
        where: { studentId: id, schoolId },
      })
      await tx.studentGuardian.deleteMany({
        where: { studentId: id, schoolId },
      })
      await tx.studentBatch.deleteMany({ where: { studentId: id, schoolId } })
      await tx.studentDocument.deleteMany({
        where: { studentId: id, schoolId },
      })
      await tx.healthRecord.deleteMany({ where: { studentId: id, schoolId } })
      await tx.achievement.deleteMany({ where: { studentId: id, schoolId } })
      await tx.disciplinaryRecord.deleteMany({
        where: { studentId: id, schoolId },
      })
      await tx.libraryRecord.deleteMany({ where: { studentId: id, schoolId } })
      await tx.feeRecord.deleteMany({ where: { studentId: id, schoolId } })
      // Delete the student
      await studentModel.deleteMany({ where: { id, schoolId } })
    })

    // Revalidate cache
    revalidatePath(STUDENTS_PATH)
    revalidateSpotlight(schoolId)

    return { success: true, data: undefined }
  } catch (error) {
    console.error("[deleteStudent] Error:", error, {
      input,
      timestamp: new Date().toISOString(),
    })

    if (error instanceof z.ZodError) {
      return actionError(
        ACTION_ERRORS.VALIDATION_ERROR,
        error.issues.map((e) => e.message).join(", ")
      )
    }

    return actionError(
      ACTION_ERRORS.STUDENT_DELETE_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}

// ============================================================================
// Archive / Restore / Purge
// ============================================================================

/**
 * Archive a student — hides from active list without touching child records.
 * Reversible via `restoreStudent`. Does NOT cascade to attendance/fees/etc.
 */
export async function archiveStudent(input: {
  id: string
}): Promise<ActionResponse<void>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)

    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    try {
      assertStudentPermission(authContext, "archive", { schoolId })
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : ACTION_ERRORS.UNAUTHORIZED,
      }
    }

    const { id } = z.object({ id: z.string().min(1) }).parse(input)

    await db.student.update({
      where: { id, schoolId },
      data: { archivedAt: new Date(), archivedBy: authContext.userId },
    })

    revalidatePath(STUDENTS_PATH)
    return { success: true, data: undefined }
  } catch (error) {
    console.error("[archiveStudent] Error:", error, { input })
    if (error instanceof z.ZodError) {
      return actionError(
        ACTION_ERRORS.VALIDATION_ERROR,
        error.issues.map((e) => e.message).join(", ")
      )
    }
    return actionError(
      ACTION_ERRORS.STUDENT_ARCHIVE_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}

/**
 * Restore an archived student. Guards against unique-tuple collisions
 * (another active student took the studentId/grNumber/admissionNumber
 * while this one was archived).
 */
export async function restoreStudent(input: {
  id: string
}): Promise<ActionResponse<void>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)

    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    try {
      assertStudentPermission(authContext, "restore", { schoolId })
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : ACTION_ERRORS.UNAUTHORIZED,
      }
    }

    const { id } = z.object({ id: z.string().min(1) }).parse(input)

    const target = await db.student.findFirst({
      where: { id, schoolId },
      select: {
        studentId: true,
        grNumber: true,
        admissionNumber: true,
      },
    })
    if (!target) return actionError(ACTION_ERRORS.STUDENT_NOT_FOUND)

    const conflictOr: Array<Record<string, unknown>> = []
    if (target.studentId) conflictOr.push({ studentId: target.studentId })
    if (target.grNumber) conflictOr.push({ grNumber: target.grNumber })
    if (target.admissionNumber)
      conflictOr.push({ admissionNumber: target.admissionNumber })

    if (conflictOr.length > 0) {
      const conflict = await db.student.findFirst({
        where: {
          schoolId,
          archivedAt: null,
          id: { not: id },
          OR: conflictOr,
        },
        select: { studentId: true, grNumber: true, admissionNumber: true },
      })
      if (conflict) {
        return { success: false, code: "STUDENT_RESTORE_CONFLICT" }
      }
    }

    await db.student.update({
      where: { id, schoolId },
      data: { archivedAt: null, archivedBy: null },
    })

    revalidatePath(STUDENTS_PATH)
    return { success: true, data: undefined }
  } catch (error) {
    console.error("[restoreStudent] Error:", error, { input })
    if (error instanceof z.ZodError) {
      return actionError(
        ACTION_ERRORS.VALIDATION_ERROR,
        error.issues.map((e) => e.message).join(", ")
      )
    }
    return actionError(
      ACTION_ERRORS.STUDENT_RESTORE_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}

/**
 * Build a JSON export of a student + every cascadable child record, and issue
 * a short-lived purge token. The caller must pass the returned token back to
 * `purgeStudent` to prove the data was exported before irreversible deletion.
 */
export async function exportStudentForPurge(input: { id: string }): Promise<
  ActionResponse<{
    token: string
    expiresAt: string
    payload: Record<string, unknown>
  }>
> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)

    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    try {
      assertStudentPermission(authContext, "purge", { schoolId })
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : ACTION_ERRORS.UNAUTHORIZED,
      }
    }

    const { id } = z.object({ id: z.string().min(1) }).parse(input)

    const [
      student,
      attendances,
      examResults,
      feeAssignments,
      submissions,
      studentGuardians,
      studentClasses,
      studentYearLevels,
      studentBatches,
      studentDocuments,
      healthRecords,
      achievements,
      disciplinaryRecords,
      libraryRecords,
      feeRecords,
    ] = await Promise.all([
      db.student.findFirst({ where: { id, schoolId } }),
      db.attendance.findMany({ where: { studentId: id, schoolId } }),
      db.examResult.findMany({ where: { studentId: id, schoolId } }),
      db.feeAssignment.findMany({ where: { studentId: id, schoolId } }),
      db.assignmentSubmission.findMany({ where: { studentId: id, schoolId } }),
      db.studentGuardian.findMany({ where: { studentId: id, schoolId } }),
      db.studentClass.findMany({ where: { studentId: id, schoolId } }),
      db.studentYearLevel.findMany({ where: { studentId: id, schoolId } }),
      db.studentBatch.findMany({ where: { studentId: id, schoolId } }),
      db.studentDocument.findMany({ where: { studentId: id, schoolId } }),
      db.healthRecord.findMany({ where: { studentId: id, schoolId } }),
      db.achievement.findMany({ where: { studentId: id, schoolId } }),
      db.disciplinaryRecord.findMany({ where: { studentId: id, schoolId } }),
      db.libraryRecord.findMany({ where: { studentId: id, schoolId } }),
      db.feeRecord.findMany({ where: { studentId: id, schoolId } }),
    ])
    if (!student) return actionError(ACTION_ERRORS.STUDENT_NOT_FOUND)

    const token = await db.purgeExportToken.create({
      data: {
        userId: authContext.userId,
        schoolId,
        modelName: "Student",
        recordId: id,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
      select: { id: true, expiresAt: true },
    })

    const payload = {
      exportedAt: new Date().toISOString(),
      schoolId,
      model: "Student",
      student,
      children: {
        attendances,
        examResults,
        feeAssignments,
        submissions,
        studentGuardians,
        studentClasses,
        studentYearLevels,
        studentBatches,
        studentDocuments,
        healthRecords,
        achievements,
        disciplinaryRecords,
        libraryRecords,
        feeRecords,
      },
    }

    return {
      success: true,
      data: {
        token: token.id,
        expiresAt: token.expiresAt.toISOString(),
        payload: JSON.parse(JSON.stringify(payload)),
      },
    }
  } catch (error) {
    console.error("[exportStudentForPurge] Error:", error, { input })
    if (error instanceof z.ZodError) {
      return actionError(
        ACTION_ERRORS.VALIDATION_ERROR,
        error.issues.map((e) => e.message).join(", ")
      )
    }
    return actionError(
      ACTION_ERRORS.STUDENT_PURGE_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}

/**
 * Permanently delete a student + all child records. Requires a valid
 * unexpired purge token from `exportStudentForPurge` bound to the same
 * user + student + school. Irreversible.
 */
export async function purgeStudent(input: {
  id: string
  token: string
}): Promise<ActionResponse<void>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)

    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    try {
      assertStudentPermission(authContext, "purge", { schoolId })
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : ACTION_ERRORS.UNAUTHORIZED,
      }
    }

    const { id, token } = z
      .object({ id: z.string().min(1), token: z.string().min(1) })
      .parse(input)

    const tokenRow = await db.purgeExportToken.findUnique({
      where: { id: token },
    })
    if (
      !tokenRow ||
      tokenRow.userId !== authContext.userId ||
      tokenRow.schoolId !== schoolId ||
      tokenRow.modelName !== "Student" ||
      tokenRow.recordId !== id
    ) {
      return { success: false, code: "PURGE_TOKEN_INVALID" }
    }
    if (tokenRow.expiresAt.getTime() < Date.now()) {
      return { success: false, code: "PURGE_TOKEN_EXPIRED" }
    }

    const studentModel = getModelOrThrow("student")
    await db.$transaction(async (tx) => {
      // Bridge/tracking rows that don't cascade automatically
      await tx.studentClass.deleteMany({ where: { studentId: id, schoolId } })
      await tx.studentYearLevel.deleteMany({
        where: { studentId: id, schoolId },
      })
      await tx.studentGuardian.deleteMany({
        where: { studentId: id, schoolId },
      })
      await tx.studentBatch.deleteMany({ where: { studentId: id, schoolId } })
      await tx.studentDocument.deleteMany({
        where: { studentId: id, schoolId },
      })
      await tx.healthRecord.deleteMany({ where: { studentId: id, schoolId } })
      await tx.achievement.deleteMany({ where: { studentId: id, schoolId } })
      await tx.disciplinaryRecord.deleteMany({
        where: { studentId: id, schoolId },
      })
      await tx.libraryRecord.deleteMany({ where: { studentId: id, schoolId } })
      await tx.feeRecord.deleteMany({ where: { studentId: id, schoolId } })
      // Hard-deletable children blocked by deleteStudent; purge includes them
      await tx.attendance.deleteMany({ where: { studentId: id, schoolId } })
      await tx.examResult.deleteMany({ where: { studentId: id, schoolId } })
      await tx.feeAssignment.deleteMany({ where: { studentId: id, schoolId } })
      await tx.assignmentSubmission.deleteMany({
        where: { studentId: id, schoolId },
      })
      // Finally the student
      await studentModel.deleteMany({ where: { id, schoolId } })
      // Burn the token
      await tx.purgeExportToken.delete({ where: { id: tokenRow.id } })
    })

    revalidatePath(STUDENTS_PATH)
    return { success: true, data: undefined }
  } catch (error) {
    console.error("[purgeStudent] Error:", error, { input: { id: input.id } })
    if (error instanceof z.ZodError) {
      return actionError(
        ACTION_ERRORS.VALIDATION_ERROR,
        error.issues.map((e) => e.message).join(", ")
      )
    }
    return actionError(
      ACTION_ERRORS.STUDENT_PURGE_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}

// ============================================================================
// Queries
// ============================================================================

/**
 * Get a single student by ID
 * @param input - Student ID
 * @returns Action response with student data
 */
export async function getStudent(input: {
  id: string
}): Promise<ActionResponse<Record<string, unknown> | null>> {
  try {
    // Get authentication context
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    // Get tenant context
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    // Check permission
    try {
      assertStudentPermission(authContext, "read", { schoolId })
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : ACTION_ERRORS.UNAUTHORIZED,
      }
    }

    // Parse and validate input
    const { id } = z.object({ id: z.string().min(1) }).parse(input)

    // Fetch student record
    const studentModel = getModelOrThrow("student")
    const student = await studentModel.findFirst({
      where: { id, schoolId },
      select: {
        id: true,
        schoolId: true,
        firstName: true,
        middleName: true,
        lastName: true,
        dateOfBirth: true,
        gender: true,
        enrollmentDate: true,
        userId: true,
        academicGradeId: true,
        sectionId: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return { success: true, data: student }
  } catch (error) {
    console.error("[getStudent] Error:", error, {
      input,
      timestamp: new Date().toISOString(),
    })

    if (error instanceof z.ZodError) {
      return actionError(
        ACTION_ERRORS.VALIDATION_ERROR,
        error.issues.map((e) => e.message).join(", ")
      )
    }

    return actionError(
      ACTION_ERRORS.LOAD_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}

/**
 * Get students list with filtering and pagination
 * @param input - Query parameters
 * @returns Action response with students and total count
 */
// Transliterate Latin letters to Arabic in room codes (Google Translate skips these)
const LATIN_TO_AR: Record<string, string> = {
  A: "أ",
  B: "ب",
  C: "ج",
  D: "د",
  E: "هـ",
  F: "و",
  G: "ز",
  H: "ح",
}

function transliterateRoomCode(code: string, lang: string): string {
  if (lang !== "ar") return code
  return code.replace(/^[A-Z]/g, (ch) => LATIN_TO_AR[ch] || ch)
}

const hasLatin = (s: string) => /[a-zA-Z]/.test(s)

export async function getStudents(
  input: Partial<z.infer<typeof getStudentsSchema>>
): Promise<
  ActionResponse<{
    rows: Array<{
      id: string
      userId: string | null
      name: string
      studentId: string | null
      classroom: string | null
      gradeName: string | null
      status: string
      createdAt: string
      email: string | null
      dateOfBirth: string | null
      enrollmentDate: string | null
      wizardStep: string | null
      profilePhotoUrl: string | null
    }>
    total: number
  }>
> {
  try {
    // Get authentication context
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    // Get tenant context
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    // Check permission
    try {
      assertStudentPermission(authContext, "read", { schoolId })
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : ACTION_ERRORS.UNAUTHORIZED,
      }
    }

    // Parse and validate input
    const sp = getStudentsSchema.parse(input ?? {})

    // Display language: the ROUTE [lang] (passed by the client table) is the source
    // of truth. The NEXT_LOCALE cookie is only a fallback for non-routed callers — it
    // is global and can disagree with the URL, which is what regressed search/load-more
    // back to Arabic on /en even after a correct initial render.
    let displayLang: "ar" | "en" = "ar"
    if (sp.lang) {
      displayLang = sp.lang
    } else {
      try {
        const cookieStore = await cookies()
        displayLang =
          cookieStore.get("NEXT_LOCALE")?.value === "en" ? "en" : "ar"
      } catch {
        displayLang = "ar"
      }
    }
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { preferredLanguage: true },
    })
    const storageLang = school?.preferredLanguage || "ar"

    let nameFilter = {}
    if (sp.name) {
      const nameConditions = await search(
        sp.name,
        ["firstName", "lastName"],
        schoolId,
        storageLang,
        displayLang
      )
      // Also search by studentId directly
      nameFilter = {
        OR: [
          ...nameConditions,
          { studentId: { contains: sp.name, mode: "insensitive" } },
        ],
      }
    }

    const where: any = withArchiveScope(
      {
        schoolId,
        ...nameFilter,
        ...(sp.status ? buildStudentStatusFilter(sp.status) : {}),
      },
      sp.scope
    )

    // Build pagination
    const skip = (sp.page - 1) * sp.perPage
    const take = sp.perPage

    // Build order by clause
    const orderBy =
      sp.sort && Array.isArray(sp.sort) && sp.sort.length
        ? sp.sort.map((s) => ({ [s.id]: s.desc ? "desc" : "asc" }))
        : [{ createdAt: "desc" }]

    // Execute queries in parallel
    const studentModel = getModelOrThrow("student")
    const [rows, count] = await Promise.all([
      studentModel.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          _count: {
            select: {
              studentClasses: true,
              results: true,
              studentGuardians: true,
            },
          },
          section: {
            select: {
              name: true,
              classroom: {
                select: { roomName: true, lang: true },
              },
            },
          },
          academicGrade: {
            select: { name: true, lang: true, gradeNumber: true },
          },
        },
      }),
      studentModel.count({ where }),
    ])

    // Translate student names for current locale (canonical helper — must match the
    // initial server render in content.tsx: display = first + last, no middle).
    const nameOf = (s: any) => ({
      firstName: s.firstName,
      lastName: s.lastName,
    })
    // Classrooms: room codes (B102) transliterate directly; real names go
    // through ONE batched, deduped getLabels pass (script-detected source).
    const uniqueClassrooms = new Set<string>()
    for (const s of rows as Array<any>) {
      const roomName = s.section?.classroom?.roomName
      if (roomName) uniqueClassrooms.add(roomName)
    }
    const roomCodes: string[] = []
    const roomNames: string[] = []
    for (const room of uniqueClassrooms) {
      if (/^[A-Z]\d/.test(room)) roomCodes.push(room)
      else roomNames.push(room)
    }
    const [nameTranslations, classroomTranslations] = await Promise.all([
      getNames(rows as Array<any>, nameOf, displayLang, schoolId),
      getLabels(roomNames, displayLang, schoolId),
    ])
    for (const code of roomCodes) {
      classroomTranslations.set(code, transliterateRoomCode(code, displayLang))
    }

    // Map results
    const mapped = (rows as Array<any>).map((s) => {
      const gradeName =
        s.academicGrade?.gradeNumber != null
          ? getGradeLabel(s.academicGrade.gradeNumber, displayLang)
          : null

      const rawName = fullName(nameOf(s))
      const name = nameTranslations.get(rawName) || rawName

      const rawClassroom = (s.section?.classroom?.roomName as string) || null
      const classroom = rawClassroom
        ? classroomTranslations.get(rawClassroom) || rawClassroom
        : null

      return {
        id: s.id as string,
        userId: s.userId as string | null,
        name,
        studentId: (s.studentId as string | null) || null,
        classroom,
        gradeName,
        status: deriveStudentDisplayStatus(s),
        createdAt: (s.createdAt as Date).toISOString(),
        email: (s.email as string | null) || null,
        dateOfBirth: s.dateOfBirth
          ? (s.dateOfBirth as Date).toISOString()
          : null,
        enrollmentDate: s.enrollmentDate
          ? (s.enrollmentDate as Date).toISOString()
          : null,
        wizardStep: (s.wizardStep as string | null) || null,
        profilePhotoUrl: (s.profilePhotoUrl as string | null) || null,
      }
    })

    return { success: true, data: { rows: mapped, total: count as number } }
  } catch (error) {
    console.error("[getStudents] Error:", error, {
      input,
      timestamp: new Date().toISOString(),
    })

    if (error instanceof z.ZodError) {
      return actionError(
        ACTION_ERRORS.VALIDATION_ERROR,
        error.issues.map((e) => e.message).join(", ")
      )
    }

    return actionError(
      ACTION_ERRORS.LOAD_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}

/**
 * Export students to CSV format
 * @param input - Query parameters
 * @returns CSV string
 */
export async function getStudentsCSV(
  input?: Partial<z.infer<typeof getStudentsSchema>>
): Promise<ActionResponse<string>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    try {
      assertStudentPermission(authContext, "export", { schoolId })
    } catch {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    // Parse and validate input
    const sp = getStudentsSchema.parse(input ?? {})

    // Build where clause with filters
    const where: any = withArchiveScope(
      {
        schoolId,
        ...(sp.name
          ? {
              OR: [
                { firstName: { contains: sp.name, mode: "insensitive" } },
                { lastName: { contains: sp.name, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(sp.status
          ? sp.status === "active"
            ? { NOT: { userId: null } }
            : sp.status === "inactive"
              ? { userId: null }
              : {}
          : {}),
      },
      sp.scope
    )

    // Determine display language for translation
    const cookieStore = await cookies()
    const csvDisplayLang = cookieStore.get("NEXT_LOCALE")?.value || "ar"

    // Fetch ALL students matching filters (no pagination for export)
    const studentModel = getModelOrThrow("student")
    const students = await studentModel.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
          },
        },
        section: {
          select: { name: true },
        },
        academicGrade: {
          select: { name: true },
        },
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    })

    // Translate names for current locale
    const csvUniqueNames = new Map<string, string>()
    for (const s of students as Array<any>) {
      const rawName = [s.firstName, s.middleName, s.lastName]
        .filter(Boolean)
        .join(" ")
      // Override lang field when text clearly doesn't match
      const rawTextLang = hasLatin(rawName) ? "en" : "ar"
      const contentLang =
        rawTextLang !== s.lang ? rawTextLang : s.lang || rawTextLang
      if (contentLang !== csvDisplayLang) {
        csvUniqueNames.set(rawName, contentLang)
        // Also add individual name parts for translated columns
        if (s.firstName) {
          const givenTextLang = hasLatin(s.firstName) ? "en" : "ar"
          const partLang =
            givenTextLang !== s.lang ? givenTextLang : s.lang || givenTextLang
          if (partLang !== csvDisplayLang)
            csvUniqueNames.set(s.firstName, partLang)
        }
        if (s.middleName) {
          const midTextLang = hasLatin(s.middleName) ? "en" : "ar"
          const partLang =
            midTextLang !== s.lang ? midTextLang : s.lang || midTextLang
          if (partLang !== csvDisplayLang)
            csvUniqueNames.set(s.middleName, partLang)
        }
        if (s.lastName) {
          const surTextLang = hasLatin(s.lastName) ? "en" : "ar"
          const partLang =
            surTextLang !== s.lang ? surTextLang : s.lang || surTextLang
          if (partLang !== csvDisplayLang)
            csvUniqueNames.set(s.lastName, partLang)
        }
      }
    }
    // ONE batched, deduped resolution for every candidate value (full names +
    // individual parts) — replaces the per-value getText fan-out.
    const csvNameTranslations = await getLabels(
      Array.from(csvUniqueNames.keys()),
      csvDisplayLang as "ar" | "en",
      schoolId
    )

    // Transform data for CSV export
    const exportData = students.map((student: any) => {
      const rawFull = [student.firstName, student.middleName, student.lastName]
        .filter(Boolean)
        .join(" ")
      const fullTextLang = hasLatin(rawFull) ? "en" : "ar"
      const contentLang =
        fullTextLang !== student.lang
          ? fullTextLang
          : student.lang || fullTextLang
      const needsTranslation = contentLang !== csvDisplayLang

      return {
        studentId: student.id,
        firstName: needsTranslation
          ? csvNameTranslations.get(student.firstName) ||
            student.firstName ||
            ""
          : student.firstName || "",
        middleName: needsTranslation
          ? csvNameTranslations.get(student.middleName) ||
            student.middleName ||
            ""
          : student.middleName || "",
        lastName: needsTranslation
          ? csvNameTranslations.get(student.lastName) || student.lastName || ""
          : student.lastName || "",
        fullName: needsTranslation
          ? csvNameTranslations.get(rawFull) || rawFull
          : rawFull,
        dateOfBirth: student.dateOfBirth
          ? new Date(student.dateOfBirth).toISOString().split("T")[0]
          : "",
        gender: student.gender || "",
        email: student.user?.email || "",
        enrollmentDate: student.enrollmentDate
          ? new Date(student.enrollmentDate).toISOString().split("T")[0]
          : "",
        status: student.userId ? "Active" : "Inactive",
        sectionName: student.section?.name || student.academicGrade?.name || "",
        createdAt: new Date(student.createdAt).toISOString().split("T")[0],
      }
    })

    // Define CSV columns
    const columns = [
      { key: "studentId", label: "Student ID" },
      { key: "firstName", label: "First Name" },
      { key: "middleName", label: "Middle Name" },
      { key: "lastName", label: "Last Name" },
      { key: "fullName", label: "Full Name" },
      { key: "dateOfBirth", label: "Date of Birth" },
      { key: "gender", label: "Gender" },
      { key: "email", label: "Email" },
      { key: "enrollmentDate", label: "Enrollment Date" },
      { key: "status", label: "Status" },
      { key: "sectionName", label: "Section" },
      { key: "createdAt", label: "Created Date" },
    ]

    const csv = arrayToCSV(exportData, { columns })

    return { success: true, data: csv }
  } catch (error) {
    console.error("[getStudentsCSV] Error:", error, {
      input,
      timestamp: new Date().toISOString(),
    })

    if (error instanceof z.ZodError) {
      return actionError(
        ACTION_ERRORS.VALIDATION_ERROR,
        error.issues.map((e) => e.message).join(", ")
      )
    }

    return actionError(
      ACTION_ERRORS.EXPORT_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}

/**
 * Get students data for export (used by File Block ExportButton)
 * Returns raw data for client-side export generation
 * @param input - Query parameters
 * @returns Array of student export data
 */
export async function getStudentsExportData(
  input?: Partial<z.infer<typeof getStudentsSchema>>
): Promise<
  ActionResponse<
    Array<{
      id: string
      studentId: string | null
      grNumber: string | null
      firstName: string
      middleName: string | null
      lastName: string
      fullName: string
      dateOfBirth: Date | null
      gender: string
      email: string | null
      mobileNumber: string | null
      status: string
      studentType: string
      enrollmentDate: Date
      admissionNumber: string | null
      nationality: string | null
      sectionName: string | null
      yearLevel: string | null
      guardianName: string | null
      guardianPhone: string | null
      createdAt: Date
    }>
  >
> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    try {
      assertStudentPermission(authContext, "export", { schoolId })
    } catch {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    // Parse and validate input
    const sp = getStudentsSchema.parse(input ?? {})

    // Build where clause with filters
    const where: any = withArchiveScope(
      {
        schoolId,
        ...(sp.name
          ? {
              OR: [
                { firstName: { contains: sp.name, mode: "insensitive" } },
                { lastName: { contains: sp.name, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(sp.status
          ? sp.status === "active"
            ? { status: "ACTIVE" }
            : sp.status === "inactive"
              ? { status: "INACTIVE" }
              : {}
          : {}),
      },
      sp.scope
    )

    // Fetch ALL students matching filters (no pagination for export)
    const studentModel = getModelOrThrow("student")
    const students = await studentModel.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
          },
        },
        section: {
          select: { name: true },
        },
        academicGrade: {
          select: { name: true },
        },
        studentYearLevels: {
          include: {
            yearLevel: {
              select: {
                name: true,
              },
            },
          },
          take: 1,
        },
        studentGuardians: {
          where: { isPrimary: true },
          include: {
            guardian: {
              include: {
                phoneNumbers: {
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
          },
          take: 1,
        },
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    })

    // Transform data for export
    const exportData = students.map((student: any) => ({
      id: student.id,
      studentId: student.studentId || null,
      grNumber: student.grNumber || null,
      firstName: student.firstName || "",
      middleName: student.middleName || null,
      lastName: student.lastName || "",
      fullName: [student.firstName, student.middleName, student.lastName]
        .filter(Boolean)
        .join(" "),
      dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth) : null,
      gender: student.gender || "",
      email: student.user?.email || null,
      mobileNumber: student.mobileNumber || null,
      status: student.status || "ACTIVE",
      studentType: student.studentType || "REGULAR",
      enrollmentDate: new Date(student.enrollmentDate),
      admissionNumber: student.admissionNumber || null,
      nationality: student.nationality || null,
      sectionName: student.section?.name || student.academicGrade?.name || null,
      yearLevel: student.studentYearLevels?.[0]?.yearLevel?.name || null,
      guardianName: student.studentGuardians?.[0]?.guardian
        ? [
            student.studentGuardians[0].guardian.firstName,
            student.studentGuardians[0].guardian.lastName,
          ]
            .filter(Boolean)
            .join(" ")
        : null,
      guardianPhone:
        student.studentGuardians?.[0]?.guardian?.phoneNumbers?.[0]
          ?.phoneNumber || null,
      createdAt: new Date(student.createdAt),
    }))

    return { success: true, data: exportData }
  } catch (error) {
    console.error("[getStudentsExportData] Error:", error, {
      input,
      timestamp: new Date().toISOString(),
    })

    if (error instanceof z.ZodError) {
      return actionError(
        ACTION_ERRORS.VALIDATION_ERROR,
        error.issues.map((e) => e.message).join(", ")
      )
    }

    return actionError(
      ACTION_ERRORS.EXPORT_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}

/**
 * Register a new student with comprehensive information
 * @param input - Complete student registration data
 * @returns Action response with student data
 */
export async function registerStudent(
  input: Record<string, unknown>
): Promise<ActionResponse<any>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    try {
      assertStudentPermission(authContext, "create", { schoolId })
    } catch {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    // Validate required fields
    const registrationSchema = z
      .object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        dateOfBirth: z.string().min(1),
        gender: z.string().min(1),
        middleName: z.string().optional().nullable(),
        bloodGroup: z.string().optional().nullable(),
        nationality: z.string().optional().nullable(),
        passportNumber: z.string().optional().nullable(),
        email: z.string().email().optional().nullable(),
        mobileNumber: z.string().optional().nullable(),
        guardians: z
          .array(
            z.object({
              firstName: z.string().min(1),
              lastName: z.string().min(1),
              email: z.string().optional().nullable(),
              mobileNumber: z.string().optional().nullable(),
              relation: z.string().optional().nullable(),
              isPrimary: z.boolean().optional(),
            })
          )
          .optional(),
      })
      .passthrough()

    const parsed = registrationSchema.parse(input)
    // Use parsed data from here on
    const validatedInput = parsed as Record<string, any>

    // Process guardian data first if provided
    const guardianIds = []
    if (validatedInput.guardians && validatedInput.guardians.length > 0) {
      const guardianModel = getModelOrThrow("guardian")
      const guardianPhoneNumberModel = getModelOrThrow("guardianPhoneNumber")

      for (const guardian of validatedInput.guardians) {
        // Check if guardian already exists by email
        let guardianRecord = await guardianModel.findFirst({
          where: {
            schoolId,
            emailAddress: guardian.email,
          },
        })

        if (!guardianRecord) {
          // Create new guardian
          guardianRecord = await guardianModel.create({
            data: {
              schoolId,
              firstName: guardian.firstName,
              lastName: guardian.lastName,
              emailAddress: guardian.email,
            },
          })

          // Add phone number if provided
          if (guardian.mobileNumber) {
            await guardianPhoneNumberModel.create({
              data: {
                schoolId,
                guardianId: guardianRecord.id,
                phoneNumber: guardian.mobileNumber,
                phoneType: "mobile",
                isPrimary: true,
              },
            })
          }
        }

        guardianIds.push({
          id: guardianRecord.id,
          relation: guardian.relation,
          isPrimary: guardian.isPrimary || false,
        })
      }
    }

    // Prepare student data
    const studentData: any = {
      schoolId,
      firstName: validatedInput.firstName,
      middleName: validatedInput.middleName || null,
      lastName: validatedInput.lastName,
      dateOfBirth: new Date(validatedInput.dateOfBirth),
      gender: validatedInput.gender,
      bloodGroup: validatedInput.bloodGroup || null,
      nationality: validatedInput.nationality || "Saudi Arabia",
      passportNumber: validatedInput.passportNumber || null,
      visaStatus: validatedInput.visaStatus || null,
      visaExpiryDate: validatedInput.visaExpiryDate
        ? new Date(validatedInput.visaExpiryDate as string)
        : null,

      // Contact Information
      email: validatedInput.email || null,
      mobileNumber: validatedInput.mobileNumber || null,
      alternatePhone: validatedInput.alternatePhone || null,

      // Address
      currentAddress: validatedInput.currentAddress || null,
      permanentAddress: validatedInput.sameAsPermanent
        ? validatedInput.currentAddress
        : validatedInput.permanentAddress || null,
      city: validatedInput.city || null,
      state: validatedInput.state || null,
      postalCode: validatedInput.postalCode || null,
      country: validatedInput.country || "Saudi Arabia",

      // Emergency Contact
      emergencyContactName: validatedInput.emergencyContactName || null,
      emergencyContactPhone: validatedInput.emergencyContactPhone || null,
      emergencyContactRelation: validatedInput.emergencyContactRelation || null,

      // Status and Enrollment
      status: validatedInput.status || "ACTIVE",
      enrollmentDate: validatedInput.enrollmentDate
        ? new Date(validatedInput.enrollmentDate as string)
        : new Date(),
      admissionNumber: validatedInput.admissionNumber || null,
      admissionDate: validatedInput.admissionDate
        ? new Date(validatedInput.admissionDate as string)
        : new Date(),

      // Academic
      category: validatedInput.category || null,
      studentType: validatedInput.studentType || "REGULAR",
      academicGradeId: validatedInput.academicGradeId || null,

      // Health Information
      medicalConditions: validatedInput.medicalConditions || null,
      allergies: validatedInput.allergies || null,
      medicationRequired: validatedInput.medicationRequired || null,
      doctorName: validatedInput.doctorName || null,
      doctorContact: validatedInput.doctorContact || null,
      insuranceProvider: validatedInput.insuranceProvider || null,
      insuranceNumber: validatedInput.insuranceNumber || null,

      // Previous Education
      previousSchoolName: validatedInput.previousSchoolName || null,
      previousSchoolAddress: validatedInput.previousSchoolAddress || null,
      previousGrade: validatedInput.previousGrade || null,
      transferCertificateNo: validatedInput.transferCertificateNo || null,
      transferDate: validatedInput.transferDate
        ? new Date(validatedInput.transferDate as string)
        : null,
      previousAcademicRecord: validatedInput.previousAcademicRecord || null,

      // Photo
      profilePhotoUrl: validatedInput.profilePhotoUrl || null,

      // GR Number - Auto-generate if not provided
      grNumber: validatedInput.grNumber || null,
    }

    // Generate GR Number if not provided
    const studentModel = getModelOrThrow("student")
    if (!studentData.grNumber) {
      const lastStudent = await studentModel.findFirst({
        where: { schoolId },
        orderBy: { createdAt: "desc" },
        select: { grNumber: true },
      })

      let nextGRNumber = 1
      if (lastStudent?.grNumber) {
        const match = lastStudent.grNumber.match(/\d+/)
        if (match) {
          nextGRNumber = parseInt(match[0]) + 1
        }
      }

      const year = new Date().getFullYear()
      studentData.grNumber = `GR${year}${nextGRNumber.toString().padStart(4, "0")}`
    }

    // Create the student record
    const student = await studentModel.create({
      data: studentData,
    })

    // Create guardian relationships
    if (guardianIds.length > 0) {
      // Get or create guardian type
      const guardianTypeModel = getModelOrThrow("guardianType")
      let guardianType = await guardianTypeModel.findFirst({
        where: {
          schoolId,
          name: "Parent",
        },
      })

      if (!guardianType) {
        guardianType = await guardianTypeModel.create({
          data: {
            schoolId,
            name: "Parent",
          },
        })
      }

      // Create student-guardian relationships
      const studentGuardianModel = getModelOrThrow("studentGuardian")
      for (const guardian of guardianIds) {
        await studentGuardianModel.create({
          data: {
            schoolId,
            studentId: student.id,
            guardianId: guardian.id,
            guardianTypeId: guardianType.id,
            isPrimary: guardian.isPrimary,
          },
        })
      }
    }

    // Save documents if provided
    if (validatedInput.documents && validatedInput.documents.length > 0) {
      const studentDocumentModel = getModelOrThrow("studentDocument")
      for (const doc of validatedInput.documents) {
        if (doc.fileUrl) {
          await studentDocumentModel.create({
            data: {
              schoolId,
              studentId: student.id,
              documentType: doc.documentType,
              documentName: doc.documentName,
              description: doc.description || null,
              fileUrl: doc.fileUrl,
              fileSize: doc.fileSize || null,
              mimeType: doc.mimeType || null,
              tags: doc.tags || [],
            },
          })
        }
      }
    }

    // Save health records/vaccinations if provided
    if (validatedInput.vaccinations && validatedInput.vaccinations.length > 0) {
      const healthRecordModel = getModelOrThrow("healthRecord")
      for (const vaccination of validatedInput.vaccinations) {
        if (vaccination.name) {
          await healthRecordModel.create({
            data: {
              schoolId,
              studentId: student.id,
              recordDate: new Date(vaccination.date),
              recordType: "VACCINATION",
              title: vaccination.name,
              description: `Vaccination record for ${vaccination.name}`,
              followUpDate: vaccination.nextDueDate
                ? new Date(vaccination.nextDueDate)
                : null,
              recordedBy: "System",
            },
          })
        }
      }
    }

    // Enroll in class/batch if provided
    if (input.classId) {
      // Capacity validation - check if class has available spots
      const classModel = getModelOrThrow("class")
      const classData = await classModel.findFirst({
        where: { id: input.classId, schoolId },
        select: {
          id: true,
          name: true,
          maxCapacity: true,
          _count: {
            select: { studentClasses: true },
          },
        },
      })

      if (!classData) {
        return actionError(ACTION_ERRORS.CLASS_NOT_FOUND)
      }

      const maxCapacity = classData.maxCapacity || 50 // Default to 50 if not set
      const currentEnrollment = classData._count.studentClasses

      if (currentEnrollment >= maxCapacity) {
        // Detail string is for logs/debugging; the client maps the CODE to a
        // localized message (never surface raw English to the user).
        return actionError(
          ACTION_ERRORS.CLASS_AT_CAPACITY,
          `${classData.name}: ${currentEnrollment}/${maxCapacity}`
        )
      }

      const studentClassModel = getModelOrThrow("studentClass")
      await studentClassModel.create({
        data: {
          schoolId,
          studentId: student.id,
          classId: input.classId,
          dateJoined: new Date(),
          isActive: true,
        },
      })
    }

    if (input.batchId) {
      const studentBatchModel = getModelOrThrow("studentBatch")
      await studentBatchModel.create({
        data: {
          schoolId,
          studentId: student.id,
          batchId: input.batchId,
          startDate: new Date(),
          isActive: true,
        },
      })
    }

    // Founder contract: the registration form path must provision fees +
    // invoices like every other student-creation entrypoint (createStudent,
    // wizard, enroll, CSV import). Idempotent; existing admin discounts /
    // scholarships are preserved (helper only inserts missing assignments).
    if (validatedInput.academicGradeId) {
      try {
        await ensureStudentFeeAssignments({
          schoolId,
          studentId: student.id,
          academicGradeId: validatedInput.academicGradeId,
        })
      } catch (err) {
        console.error(
          "[registerStudent] ensureStudentFeeAssignments failed:",
          err
        )
      }
    }

    // Revalidate cache
    revalidatePath(STUDENTS_PATH)

    return {
      success: true,
      data: student,
    }
  } catch (error) {
    console.error("[registerStudent] Error:", error, {
      input,
      timestamp: new Date().toISOString(),
    })

    if (error instanceof z.ZodError) {
      return actionError(
        ACTION_ERRORS.VALIDATION_ERROR,
        error.issues.map((e) => e.message).join(", ")
      )
    }

    return actionError(
      ACTION_ERRORS.STUDENT_CREATE_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}

/**
 * Bulk delete students
 * @param input - Array of student IDs
 * @returns Action response with count of deleted students
 */
export async function bulkDeleteStudents(input: {
  ids: string[]
}): Promise<ActionResponse<{ count: number }>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    try {
      assertStudentPermission(authContext, "bulk_action", { schoolId })
    } catch {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    const { ids } = z
      .object({ ids: z.array(z.string().min(1)).min(1) })
      .parse(input)

    const studentModel = getModelOrThrow("student")

    // Verify all students belong to this school
    const existing = await studentModel.findMany({
      where: { id: { in: ids }, schoolId },
      select: { id: true },
    })

    const validIds = existing.map((s: any) => s.id as string)
    if (validIds.length === 0) {
      return actionError(ACTION_ERRORS.UNKNOWN)
    }

    // Cascade validation: check for dependencies before bulk deletion
    const [
      classCount,
      attendanceCount,
      examResultCount,
      feeAssignmentCount,
      submissionCount,
    ] = await Promise.all([
      db.studentClass.count({
        where: { studentId: { in: validIds }, schoolId },
      }),
      db.attendance.count({
        where: { studentId: { in: validIds }, schoolId },
      }),
      db.examResult.count({
        where: { studentId: { in: validIds }, schoolId },
      }),
      db.feeAssignment.count({
        where: { studentId: { in: validIds }, schoolId },
      }),
      db.assignmentSubmission.count({
        where: { studentId: { in: validIds }, schoolId },
      }),
    ])

    const blockers: string[] = []
    if (classCount > 0) blockers.push(`${classCount} class enrollment(s)`)
    if (attendanceCount > 0)
      blockers.push(`${attendanceCount} attendance record(s)`)
    if (examResultCount > 0) blockers.push(`${examResultCount} exam result(s)`)
    if (feeAssignmentCount > 0)
      blockers.push(`${feeAssignmentCount} fee assignment(s)`)
    if (submissionCount > 0)
      blockers.push(`${submissionCount} assignment submission(s)`)

    if (blockers.length > 0) {
      return {
        success: false,
        error: `Cannot bulk delete: ${blockers.join(", ")} exist across selected students. Resolve dependencies first.`,
      }
    }

    // Auto-clean safe-to-delete dependent records in a transaction
    const result = await db.$transaction(async (tx) => {
      await tx.studentYearLevel.deleteMany({
        where: { studentId: { in: validIds }, schoolId },
      })
      await tx.studentGuardian.deleteMany({
        where: { studentId: { in: validIds }, schoolId },
      })
      await tx.studentBatch.deleteMany({
        where: { studentId: { in: validIds }, schoolId },
      })
      await tx.studentDocument.deleteMany({
        where: { studentId: { in: validIds }, schoolId },
      })
      await tx.healthRecord.deleteMany({
        where: { studentId: { in: validIds }, schoolId },
      })
      await tx.achievement.deleteMany({
        where: { studentId: { in: validIds }, schoolId },
      })
      await tx.disciplinaryRecord.deleteMany({
        where: { studentId: { in: validIds }, schoolId },
      })
      await tx.libraryRecord.deleteMany({
        where: { studentId: { in: validIds }, schoolId },
      })
      await tx.feeRecord.deleteMany({
        where: { studentId: { in: validIds }, schoolId },
      })
      return studentModel.deleteMany({
        where: { id: { in: validIds }, schoolId },
      })
    })

    revalidatePath("/students")
    return { success: true, data: { count: result.count as number } }
  } catch (error) {
    console.error("[bulkDeleteStudents] Error:", error)
    if (error instanceof z.ZodError) {
      return actionError(
        ACTION_ERRORS.VALIDATION_ERROR,
        error.issues.map((e) => e.message).join(", ")
      )
    }
    return actionError(
      ACTION_ERRORS.STUDENT_DELETE_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}

// ============================================================================
// Access Code Management
// ============================================================================

/**
 * Generate access codes for one or more students.
 * Returns generated codes with student IDs and expiry dates.
 */
export async function generateStudentAccessCodes(input: {
  studentIds: string[]
}): Promise<
  ActionResponse<Array<{ studentId: string; code: string; expiresAt: string }>>
> {
  try {
    const session = await auth()
    if (!session?.user) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    const parsed = z
      .object({ studentIds: z.array(z.string().min(1)).min(1).max(100) })
      .parse(input)

    // Verify all students belong to this school
    const students = await db.student.findMany({
      where: { id: { in: parsed.studentIds }, schoolId },
      select: { id: true },
    })

    const validIds = new Set(students.map((s) => s.id))
    const invalidIds = parsed.studentIds.filter((id) => !validIds.has(id))

    if (invalidIds.length > 0) {
      return {
        success: false,
        error: `${invalidIds.length} student(s) not found in this school`,
      }
    }

    const { generateAccessCodesForStudents } =
      await import("@/lib/student-access-code")
    const codes = await generateAccessCodesForStudents(
      schoolId,
      parsed.studentIds
    )

    return {
      success: true,
      data: codes.map((c) => ({
        studentId: c.studentId,
        code: c.code,
        expiresAt: c.expiresAt.toISOString(),
      })),
    }
  } catch (error) {
    console.error("[generateStudentAccessCodes] Error:", error)
    return actionError(
      ACTION_ERRORS.CREATE_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}

/**
 * Get existing access codes for a student.
 */
export async function getStudentAccessCodes(input: {
  studentId: string
}): Promise<
  ActionResponse<
    Array<{
      id: string
      code: string
      expiresAt: string | null
      usedAt: string | null
      createdAt: string
    }>
  >
> {
  try {
    const session = await auth()
    if (!session?.user) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    const { studentId } = z
      .object({ studentId: z.string().min(1) })
      .parse(input)

    // Verify student belongs to this school
    const student = await db.student.findFirst({
      where: { id: studentId, schoolId },
      select: { id: true },
    })

    if (!student) {
      return actionError(ACTION_ERRORS.NOT_FOUND, "Student not found")
    }

    const codes = await db.studentAccessCode.findMany({
      where: { studentId, schoolId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        code: true,
        expiresAt: true,
        usedAt: true,
        createdAt: true,
      },
    })

    return {
      success: true,
      data: codes.map((c) => ({
        id: c.id,
        code: c.code,
        expiresAt: c.expiresAt?.toISOString() ?? null,
        usedAt: c.usedAt?.toISOString() ?? null,
        createdAt: c.createdAt.toISOString(),
      })),
    }
  } catch (error) {
    console.error("[getStudentAccessCodes] Error:", error)
    return actionError(
      ACTION_ERRORS.LOAD_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}

// ============================================================================
// Bulk Grade Sync
// ============================================================================

/**
 * Re-resolve yearLevel → academicGradeId for students imported before grades existed.
 */
export async function bulkSyncStudentGrades(): Promise<
  ActionResponse<{ updated: number }>
> {
  try {
    const session = await auth()
    if (!session?.user) return actionError(ACTION_ERRORS.UNAUTHORIZED)

    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const result = await syncStudentGrades(schoolId)

    revalidatePath(STUDENTS_PATH)

    return { success: true, data: result }
  } catch (error) {
    console.error("[bulkSyncStudentGrades] Error:", error)
    return actionError(
      ACTION_ERRORS.UPDATE_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}

// ============================================================================
// Student Credentials
// ============================================================================

interface StudentCredentialsPayload {
  username: string
  /** Null for manually-added students who never provided an email. Self-onboarded students and CSV rows with email populated have this set. */
  email: string | null
  /** Plaintext only when we just created a User here. Null for pre-existing Users — admin must click "Reset Password" to mint a new one. */
  password: string | null
  /** True the first time a User is minted for this student on this call. */
  isNew: boolean
  /** True when the student has a real applicant email (signed up themselves). Password stays under their control; admin shouldn't auto-reset it. */
  isSelfOnboarded: boolean
}

type StudentContext = {
  id: string
  firstName: string | null
  lastName: string | null
  email: string | null
  userId: string | null
  studentId: string | null
  academicGradeId: string | null
  applicationId: string | null
}

/**
 * Mint a fresh temp password for a student User. Delegates to the shared
 * crypto-secure generator (`@/lib/credentials`) — the previous
 * name-prefix + 4-digit `Math.random()` scheme was only ~13 bits and the
 * name prefix is public, so a temp password could be guessed before the
 * student first logged in (and `mustChangePassword` means whoever logs in
 * first wins). Kept as a thin wrapper so the two call sites stay readable.
 */
async function mintPlainPassword(): Promise<{
  plain: string
  hashed: string
}> {
  return mintTempPassword()
}

async function loadStudentForCredentials(
  studentId: string,
  schoolId: string
): Promise<StudentContext | null> {
  return db.student.findFirst({
    where: { id: studentId, schoolId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      userId: true,
      studentId: true,
      academicGradeId: true,
      applicationId: true,
    },
  })
}

async function ensureStudentCode(
  student: StudentContext,
  schoolId: string
): Promise<string> {
  if (student.studentId) return student.studentId

  const code = await generateStudentUsername({
    schoolId,
    academicGradeId: student.academicGradeId,
  })
  await db.student.update({
    where: { id: student.id },
    data: { studentId: code },
  })
  return code
}

function deriveIsSelfOnboarded(student: StudentContext): boolean {
  // Self-onboarded = came through the public admission flow (has applicationId)
  // AND supplied their own email during application. Manually-added students
  // have no email at all and no applicationId — they log in with username.
  return !!student.applicationId && !!student.email
}

/**
 * Read credentials for the credentials dialog. Creates a User on first open for
 * admin-created students (they need SOMETHING to log in with) but never
 * rewrites the password of a pre-existing User — self-onboarded students keep
 * the password they chose during registration. Admin must click "Reset Password"
 * explicitly to mint a new one.
 */
export async function getStudentCredentials(input: {
  studentId: string
}): Promise<ActionResponse<StudentCredentialsPayload>> {
  try {
    const session = await auth()
    if (!session?.user) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    const { studentId } = z
      .object({ studentId: z.string().min(1) })
      .parse(input)

    const student = await loadStudentForCredentials(studentId, schoolId)
    if (!student) return actionError(ACTION_ERRORS.STUDENT_NOT_FOUND)

    const studentCode = await ensureStudentCode(student, schoolId)
    const isSelfOnboarded = deriveIsSelfOnboarded(student)

    // Path 1: existing User — read-only, don't touch password.
    if (student.userId) {
      const existingUser = await db.user.findUnique({
        where: { id: student.userId },
        select: { email: true, username: true },
      })

      // Stamp code onto username only if the user never had one (e.g., guest
      // created during admin enrollment without a chosen handle). Self-onboarded
      // users keep their registered username.
      if (existingUser && !existingUser.username) {
        await db.user.update({
          where: { id: student.userId },
          data: { username: studentCode },
        })
      }

      // Legacy cleanup: previous versions stamped a synthetic `@school.local`
      // email onto manually-added Users. Null it out so the email row hides
      // in the dialog and the verification gate doesn't chase a dead address.
      if (existingUser?.email?.endsWith("@school.local")) {
        await db.user.update({
          where: { id: student.userId },
          data: { email: null, emailVerified: new Date() },
        })
      }

      const resolvedEmail =
        existingUser?.email && !existingUser.email.endsWith("@school.local")
          ? existingUser.email
          : (student.email ?? null)

      return {
        success: true,
        data: {
          username: studentCode,
          email: resolvedEmail,
          password: null,
          isNew: false,
          isSelfOnboarded,
        },
      }
    }

    // Path 2: no User yet — mint one with a fresh password so admin has
    // something to share with the student on first open. Only populate email
    // if the student record carries a real one (self-onboarded or CSV import
    // with email column); otherwise leave User.email null so login isn't
    // gated by unverifiable fake addresses.
    const { plain, hashed } = await mintPlainPassword()
    const email = student.email ?? null

    const newUser = await db.user.create({
      data: {
        email,
        // Admin added this student manually, so email verification is moot —
        // timestamp it so the login verification gate never stalls the student.
        emailVerified: new Date(),
        password: hashed,
        role: "STUDENT",
        schoolId,
        username: studentCode,
        mustChangePassword: true,
      },
    })

    await db.student.update({
      where: { id: studentId },
      data: { userId: newUser.id },
    })

    // Auto-deliver credentials over notification channels (issue: admin had
    // to manually copy/paste from the dialog into WhatsApp). Non-fatal —
    // the dialog still shows the credentials so admin can fall back to
    // manual share if delivery fails.
    try {
      await deliverStudentCredentials({
        schoolId,
        studentUserId: newUser.id,
        username: studentCode,
        tempPassword: plain,
        isFirstTime: true,
      })
    } catch (deliveryErr) {
      console.error(
        "[getStudentCredentials] credentials delivery failed:",
        deliveryErr
      )
    }

    // NOTE: no revalidatePath — it remounts the parent server tree and resets
    // the dialog's open state, closing it before the admin can copy anything.
    // The dialog triggers router.refresh() on close instead.

    return {
      success: true,
      data: {
        username: studentCode,
        email,
        password: plain,
        isNew: true,
        isSelfOnboarded,
      },
    }
  } catch (error) {
    console.error("[getStudentCredentials] Error:", error)
    return actionError(
      ACTION_ERRORS.CREATE_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}

/**
 * Explicit admin action — forces a new password for an existing student User.
 * Use when the student forgot their password or the admin needs to share a
 * fresh one. Separate from getStudentCredentials to avoid silent password
 * wipes for self-onboarded students.
 */
export async function resetStudentPassword(input: {
  studentId: string
}): Promise<ActionResponse<StudentCredentialsPayload>> {
  try {
    const session = await auth()
    if (!session?.user) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    const { studentId } = z
      .object({ studentId: z.string().min(1) })
      .parse(input)

    const student = await loadStudentForCredentials(studentId, schoolId)
    if (!student) return actionError(ACTION_ERRORS.STUDENT_NOT_FOUND)

    if (!student.userId) {
      // Delegate first-time creation to getStudentCredentials so the logic
      // stays in one place.
      return getStudentCredentials({ studentId })
    }

    const studentCode = await ensureStudentCode(student, schoolId)
    const isSelfOnboarded = deriveIsSelfOnboarded(student)
    const { plain, hashed } = await mintPlainPassword()

    await db.user.update({
      where: { id: student.userId },
      data: { password: hashed, mustChangePassword: true },
    })

    // Same auto-delivery as first-time creation — the admin re-shared a new
    // password, so push it through the student's notification channels.
    try {
      await deliverStudentCredentials({
        schoolId,
        studentUserId: student.userId,
        username: studentCode,
        tempPassword: plain,
        isFirstTime: false,
      })
    } catch (deliveryErr) {
      console.error(
        "[resetStudentPassword] credentials delivery failed:",
        deliveryErr
      )
    }

    const existingUser = await db.user.findUnique({
      where: { id: student.userId },
      select: { email: true },
    })

    const resolvedEmail =
      existingUser?.email && !existingUser.email.endsWith("@school.local")
        ? existingUser.email
        : (student.email ?? null)

    return {
      success: true,
      data: {
        username: studentCode,
        email: resolvedEmail,
        password: plain,
        isNew: false,
        isSelfOnboarded,
      },
    }
  } catch (error) {
    console.error("[resetStudentPassword] Error:", error)
    return actionError(
      ACTION_ERRORS.UPDATE_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}
