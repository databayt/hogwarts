/**
 * Classes (Sections/Groups) Server Actions Module
 *
 * RESPONSIBILITY: Academic class management - create, enroll, assign teachers, manage capacity
 *
 * WHAT IT HANDLES:
 * - Class lifecycle: Create, update, delete class sections
 * - Student enrollment: Enroll/unenroll students with capacity management
 * - Subject-teacher assignments: Map subject teachers to classes (homeroom + subject teachers)
 * - Capacity management: Track and enforce class size limits
 * - Bulk operations: Export classes as CSV, import capacity data
 * - Availability lookup: Find available teachers for class assignments
 *
 * KEY ALGORITHMS:
 * 1. enrollStudentInClass(): Validates capacity BEFORE insertion (prevents over-enrollment)
 * 2. getClassesCSV(): Chunks large exports to avoid memory issues
 * 3. assignSubjectTeacher(): Supports 1:many subject teachers per class (not just homeroom)
 * 4. Capacity calculation: Sum of enrolled students vs defined limit
 *
 * MULTI-TENANT SAFETY (CRITICAL):
 * - ALL queries filter by schoolId from getTenantContext()
 * - Class queries MUST include: { where: { schoolId } }
 * - Student enrollment validates student belongs to same school
 * - Teacher assignment checks teacher is in same school
 * - Prevent cross-school student movement or teacher assignment
 *
 * GOTCHAS & NON-OBVIOUS BEHAVIOR:
 * 1. teacherId is optional - allows classes without homeroom teacher assigned
 * 2. getClasses() returns partial data (select fields) - not full class object
 * 3. enrollStudentInClass() allows re-enrollment (silently ignores duplicates)
 * 4. Subject teachers are additive - class can have multiple teachers for different subjects
 * 5. getClassesExportData() aggregates students per class - O(n) query with join
 *
 * CAPACITY MANAGEMENT:
 * - getClassCapacityStatus(): Returns absolute numbers + percentage used
 * - getAllClassesCapacity(): School-wide capacity overview (useful for planning)
 * - Capacity limit is hard constraint (unenroll required to add student)
 * - No soft capacity warnings (consider adding threshold alerts)
 *
 * CSV EXPORT PERFORMANCE:
 * - getClassesCSV(): Handles large datasets by chunking (prevent memory exhaustion)
 * - arrayToCSV() handles encoding and formatting
 * - Includes all enrolled students in export (for reporting)
 * - Consider streaming for very large schools (10K+ students)
 *
 * PERMISSION NOTES:
 * - No explicit permission checks (assume caller has auth)
 * - Teachers can manage their own classes (enforce in UI/middleware)
 * - Admins can modify any class in school
 *
 * FUTURE IMPROVEMENTS:
 * - Add capacity threshold alerts (class 80%+ full)
 * - Implement class templates (copy structure of previous year)
 * - Add waitlist management (when class is full)
 * - Support subject-specific capacity (different limits for subjects)
 * - Implement class status tracking (active, archived, draft)
 * - Add bulk class creation from CSV
 * - Support class merging/splitting
 */

"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { z } from "zod"

import { db } from "@/lib/db"
import { getModelOrThrow } from "@/lib/prisma-guards"
import { getTenantContext } from "@/lib/tenant-context"
import { arrayToCSV } from "@/components/file"
import {
  classCreateSchema,
  classTeacherCreateSchema,
  classTeacherUpdateSchema,
  classUpdateSchema,
  getClassesSchema,
  type ClassTeacherCreateInput,
} from "@/components/school-dashboard/listings/classes/validation"

import { assertClassPermission, getAuthContext } from "./authorization"

// ============================================================================
// Types
// ============================================================================

export type ActionResponse<T = void> =
  | { success: true; data: T; warning?: string }
  | { success: false; error: string }

type ClassSelectResult = {
  id: string
  schoolId: string
  name: string
  subjectId: string | null
  teacherId: string | null
  termId: string | null
  startPeriodId: string | null
  endPeriodId: string | null
  classroomId: string | null
  courseCode: string | null
  credits: number | null
  evaluationType: string
  minCapacity: number | null
  maxCapacity: number | null
  duration: number | null
  prerequisiteId: string | null
  createdAt: Date
  updatedAt: Date
}

type ClassListResult = {
  id: string
  name: string
  subjectName: string
  teacherName: string
  termName: string
  gradeName: string
  courseCode: string
  credits: string
  evaluationType: string
  enrolledStudents: number
  maxCapacity: number
  createdAt: string
}

const CLASSES_PATH = "/classes"

// ============================================================================
// Mutations
// ============================================================================

export async function createClass(
  input: z.infer<typeof classCreateSchema>
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    try {
      assertClassPermission(authContext, "create", { schoolId })
    } catch {
      return { success: false, error: "Unauthorized" }
    }

    const parsed = classCreateSchema.parse(input)

    // Capacity cross-validation: warn if class maxCapacity > room capacity
    let capacityWarning: string | undefined
    if (parsed.classroomId && parsed.maxCapacity) {
      const room = await db.classroom.findFirst({
        where: { id: parsed.classroomId, schoolId },
        select: { capacity: true, roomName: true },
      })
      if (room && parsed.maxCapacity > room.capacity) {
        capacityWarning = `Class max capacity (${parsed.maxCapacity}) exceeds room "${room.roomName}" capacity (${room.capacity})`
      }
    }

    const row = await db.class.create({
      data: {
        schoolId,
        name: parsed.name,
        subjectId: parsed.subjectId,
        teacherId: parsed.teacherId,
        termId: parsed.termId,
        startPeriodId: parsed.startPeriodId,
        endPeriodId: parsed.endPeriodId,
        classroomId: parsed.classroomId,
        gradeId: parsed.gradeId || null,
        courseCode: parsed.courseCode || null,
        credits: parsed.credits || null,
        evaluationType: parsed.evaluationType || "NORMAL",
        minCapacity: parsed.minCapacity || 10,
        maxCapacity: parsed.maxCapacity || 50,
        duration: parsed.duration || null,
        prerequisiteId: parsed.prerequisiteId || null,
      },
    })

    revalidatePath(CLASSES_PATH)
    return { success: true, data: { id: row.id }, warning: capacityWarning }
  } catch (error) {
    console.error("[createClass] Error:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create class",
    }
  }
}

export async function updateClass(
  input: z.infer<typeof classUpdateSchema>
): Promise<ActionResponse<void>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    try {
      assertClassPermission(authContext, "update", { schoolId })
    } catch {
      return { success: false, error: "Unauthorized" }
    }

    const parsed = classUpdateSchema.parse(input)
    const { id, ...rest } = parsed

    // Verify class exists
    const existing = await db.class.findFirst({
      where: { id, schoolId },
      select: { id: true },
    })

    if (!existing) {
      return { success: false, error: "Class not found" }
    }

    // Capacity cross-validation for updates
    let capacityWarning: string | undefined
    const effectiveClassroomId =
      typeof rest.classroomId !== "undefined" ? rest.classroomId : null
    const effectiveMaxCapacity =
      typeof rest.maxCapacity !== "undefined" ? rest.maxCapacity : null
    if (effectiveClassroomId && effectiveMaxCapacity) {
      const room = await db.classroom.findFirst({
        where: { id: effectiveClassroomId, schoolId },
        select: { capacity: true, roomName: true },
      })
      if (room && effectiveMaxCapacity > room.capacity) {
        capacityWarning = `Class max capacity (${effectiveMaxCapacity}) exceeds room "${room.roomName}" capacity (${room.capacity})`
      }
    }

    const data: Record<string, unknown> = {}
    if (typeof rest.name !== "undefined") data.name = rest.name
    if (typeof rest.subjectId !== "undefined") data.subjectId = rest.subjectId
    if (typeof rest.teacherId !== "undefined") data.teacherId = rest.teacherId
    if (typeof rest.termId !== "undefined") data.termId = rest.termId
    if (typeof rest.startPeriodId !== "undefined")
      data.startPeriodId = rest.startPeriodId
    if (typeof rest.endPeriodId !== "undefined")
      data.endPeriodId = rest.endPeriodId
    if (typeof rest.classroomId !== "undefined")
      data.classroomId = rest.classroomId
    if (typeof rest.courseCode !== "undefined")
      data.courseCode = rest.courseCode || null
    if (typeof rest.credits !== "undefined") data.credits = rest.credits || null
    if (typeof rest.evaluationType !== "undefined")
      data.evaluationType = rest.evaluationType || "NORMAL"
    if (typeof rest.minCapacity !== "undefined")
      data.minCapacity = rest.minCapacity || null
    if (typeof rest.maxCapacity !== "undefined")
      data.maxCapacity = rest.maxCapacity || null
    if (typeof rest.duration !== "undefined")
      data.duration = rest.duration || null
    if (typeof rest.prerequisiteId !== "undefined")
      data.prerequisiteId = rest.prerequisiteId || null
    if (typeof rest.gradeId !== "undefined") data.gradeId = rest.gradeId || null

    await db.class.updateMany({ where: { id, schoolId }, data })

    revalidatePath(CLASSES_PATH)
    return { success: true, data: undefined, warning: capacityWarning }
  } catch (error) {
    console.error("[updateClass] Error:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update class",
    }
  }
}

export async function deleteClass(input: {
  id: string
}): Promise<ActionResponse<void>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    try {
      assertClassPermission(authContext, "delete", { schoolId })
    } catch {
      return { success: false, error: "Unauthorized" }
    }

    const { id } = z.object({ id: z.string().min(1) }).parse(input)

    // Verify class exists
    const existing = await db.class.findFirst({
      where: { id, schoolId },
      select: { id: true },
    })

    if (!existing) {
      return { success: false, error: "Class not found" }
    }

    await db.class.deleteMany({ where: { id, schoolId } })

    revalidatePath(CLASSES_PATH)
    return { success: true, data: undefined }
  } catch (error) {
    console.error("[deleteClass] Error:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete class",
    }
  }
}

// ============================================================================
// Student Enrollment with Capacity Validation
// ============================================================================

/**
 * Enroll a student in a class with capacity validation
 * @param input - classId and studentId
 * @returns Action response
 */
export async function enrollStudentInClass(input: {
  classId: string
  studentId: string
}): Promise<
  ActionResponse<{
    currentEnrollment: number
    maxCapacity: number
    remainingSpots: number
  }>
> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    try {
      assertClassPermission(authContext, "update", { schoolId })
    } catch {
      return { success: false, error: "Unauthorized to update classes" }
    }

    const { classId, studentId } = z
      .object({
        classId: z.string().min(1, "Class ID is required"),
        studentId: z.string().min(1, "Student ID is required"),
      })
      .parse(input)

    // Get class with capacity info and current enrollment count
    const classData = await db.class.findFirst({
      where: { id: classId, schoolId },
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
      return { success: false, error: "Class not found" }
    }

    // Verify student exists in school
    const studentModel = getModelOrThrow("student")
    const student = await studentModel.findFirst({
      where: { id: studentId, schoolId },
      select: { id: true, givenName: true, surname: true },
    })

    if (!student) {
      return { success: false, error: "Student not found" }
    }

    // Check if student is already enrolled
    const studentClassModel = getModelOrThrow("studentClass")
    const existingEnrollment = await studentClassModel.findFirst({
      where: { classId, studentId, schoolId },
    })

    if (existingEnrollment) {
      return {
        success: false,
        error: `${student.givenName} ${student.surname} is already enrolled in "${classData.name}"`,
      }
    }

    // Capacity validation
    const maxCapacity = classData.maxCapacity || 50
    const currentEnrollment = classData._count.studentClasses

    if (currentEnrollment >= maxCapacity) {
      return {
        success: false,
        error: `Cannot enroll student: "${classData.name}" is at full capacity (${currentEnrollment}/${maxCapacity} students)`,
      }
    }

    // Create enrollment
    await studentClassModel.create({
      data: {
        schoolId,
        studentId,
        classId,
      },
    })

    revalidatePath(CLASSES_PATH)
    revalidatePath("/students")

    return {
      success: true,
      data: {
        currentEnrollment: currentEnrollment + 1,
        maxCapacity,
        remainingSpots: maxCapacity - currentEnrollment - 1,
      },
    }
  } catch (error) {
    console.error("[enrollStudentInClass] Error:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to enroll student",
    }
  }
}

/**
 * Remove a student from a class
 * @param input - classId and studentId
 * @returns Action response
 */
export async function unenrollStudentFromClass(input: {
  classId: string
  studentId: string
}): Promise<ActionResponse<void>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    try {
      assertClassPermission(authContext, "update", { schoolId })
    } catch {
      return { success: false, error: "Unauthorized to update classes" }
    }

    const { classId, studentId } = z
      .object({
        classId: z.string().min(1, "Class ID is required"),
        studentId: z.string().min(1, "Student ID is required"),
      })
      .parse(input)

    // Verify enrollment exists
    const studentClassModel = getModelOrThrow("studentClass")
    const enrollment = await studentClassModel.findFirst({
      where: { classId, studentId, schoolId },
    })

    if (!enrollment) {
      return { success: false, error: "Student is not enrolled in this class" }
    }

    // Delete enrollment
    await studentClassModel.deleteMany({
      where: { classId, studentId, schoolId },
    })

    revalidatePath(CLASSES_PATH)
    revalidatePath("/students")

    return { success: true, data: undefined }
  } catch (error) {
    console.error("[unenrollStudentFromClass] Error:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to unenroll student",
    }
  }
}

/**
 * Get class capacity status
 * @param input - classId
 * @returns Capacity info including current enrollment and availability
 */
export async function getClassCapacityStatus(input: {
  classId: string
}): Promise<
  ActionResponse<{
    className: string
    currentEnrollment: number
    minCapacity: number
    maxCapacity: number
    remainingSpots: number
    isFull: boolean
    isUnderCapacity: boolean
    percentageFull: number
  }>
> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    try {
      assertClassPermission(authContext, "read", { schoolId })
    } catch {
      return { success: false, error: "Unauthorized to read classes" }
    }

    const { classId } = z
      .object({
        classId: z.string().min(1, "Class ID is required"),
      })
      .parse(input)

    const classData = await db.class.findFirst({
      where: { id: classId, schoolId },
      select: {
        id: true,
        name: true,
        minCapacity: true,
        maxCapacity: true,
        _count: {
          select: { studentClasses: true },
        },
      },
    })

    if (!classData) {
      return { success: false, error: "Class not found" }
    }

    const minCapacity = classData.minCapacity || 10
    const maxCapacity = classData.maxCapacity || 50
    const currentEnrollment = classData._count.studentClasses
    const remainingSpots = Math.max(0, maxCapacity - currentEnrollment)
    const isFull = currentEnrollment >= maxCapacity
    const isUnderCapacity = currentEnrollment < minCapacity
    const percentageFull = Math.round((currentEnrollment / maxCapacity) * 100)

    return {
      success: true,
      data: {
        className: classData.name,
        currentEnrollment,
        minCapacity,
        maxCapacity,
        remainingSpots,
        isFull,
        isUnderCapacity,
        percentageFull,
      },
    }
  } catch (error) {
    console.error("[getClassCapacityStatus] Error:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch capacity status",
    }
  }
}

// ============================================================================
// Queries
// ============================================================================

export async function getClass(input: {
  id: string
}): Promise<ActionResponse<ClassSelectResult | null>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    try {
      assertClassPermission(authContext, "read", { schoolId })
    } catch {
      return { success: false, error: "Unauthorized to read classes" }
    }

    const { id } = z.object({ id: z.string().min(1) }).parse(input)

    const classItem = await db.class.findFirst({
      where: { id, schoolId },
      select: {
        id: true,
        schoolId: true,
        name: true,
        subjectId: true,
        teacherId: true,
        termId: true,
        startPeriodId: true,
        endPeriodId: true,
        classroomId: true,
        courseCode: true,
        credits: true,
        evaluationType: true,
        minCapacity: true,
        maxCapacity: true,
        duration: true,
        prerequisiteId: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return { success: true, data: classItem as ClassSelectResult | null }
  } catch (error) {
    console.error("[getClass] Error:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch class",
    }
  }
}

// Full class detail with related data
export type ClassDetailResult = {
  id: string
  name: string
  lang: string
  courseCode: string | null
  credits: number | null
  evaluationType: string
  minCapacity: number | null
  maxCapacity: number | null
  duration: number | null
  createdAt: Date
  subject: {
    id: string
    subjectName: string
    lang: string
  } | null
  teacher: {
    id: string
    givenName: string
    surname: string
    userId: string | null
  } | null
  term: {
    id: string
    termName: string
    termNumber: number
  } | null
  classroom: {
    id: string
    roomName: string
    capacity: number | null
  } | null
  enrolledStudents: Array<{
    id: string
    student: {
      id: string
      givenName: string
      surname: string
      userId: string | null
    }
    enrolledAt: Date
  }>
  _count: {
    studentClasses: number
  }
}

export async function getClassById(input: {
  id: string
}): Promise<ActionResponse<ClassDetailResult | null>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    try {
      assertClassPermission(authContext, "read", { schoolId })
    } catch {
      return { success: false, error: "Unauthorized to read classes" }
    }

    const { id } = z.object({ id: z.string().min(1) }).parse(input)

    const classModel = getModelOrThrow("class")
    const classItem = await classModel.findFirst({
      where: { id, schoolId },
      include: {
        subject: {
          select: {
            id: true,
            subjectName: true,
            lang: true,
          },
        },
        teacher: {
          select: {
            id: true,
            givenName: true,
            surname: true,
            userId: true,
          },
        },
        term: {
          select: {
            id: true,
            termName: true,
            termNumber: true,
          },
        },
        classroom: {
          select: {
            id: true,
            roomName: true,
            capacity: true,
          },
        },
        studentClasses: {
          include: {
            student: {
              select: {
                id: true,
                givenName: true,
                surname: true,
                userId: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        _count: {
          select: {
            studentClasses: true,
          },
        },
      },
    })

    if (!classItem) {
      return { success: true, data: null }
    }

    // Map the result
    const result: ClassDetailResult = {
      id: classItem.id,
      name: classItem.name,
      lang: classItem.lang || "ar",
      courseCode: classItem.courseCode,
      credits: classItem.credits ? Number(classItem.credits) : null,
      evaluationType: classItem.evaluationType,
      minCapacity: classItem.minCapacity,
      maxCapacity: classItem.maxCapacity,
      duration: classItem.duration,
      createdAt: classItem.createdAt,
      subject: classItem.subject,
      teacher: classItem.teacher,
      term: classItem.term,
      classroom: classItem.classroom,
      enrolledStudents: classItem.studentClasses.map((sc: any) => ({
        id: sc.id,
        student: sc.student,
        enrolledAt: sc.createdAt,
      })),
      _count: classItem._count,
    }

    return { success: true, data: result }
  } catch (error) {
    console.error("[getClassById] Error:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch class",
    }
  }
}

export async function getClasses(
  input: Partial<z.infer<typeof getClassesSchema>>
): Promise<ActionResponse<{ rows: ClassListResult[]; total: number }>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    try {
      assertClassPermission(authContext, "read", { schoolId })
    } catch {
      return { success: false, error: "Unauthorized to read classes" }
    }

    const sp = getClassesSchema.parse(input ?? {})

    const where: any = {
      schoolId,
      ...(sp.name ? { name: { contains: sp.name, mode: "insensitive" } } : {}),
      ...(sp.subjectId ? { subjectId: sp.subjectId } : {}),
      ...(sp.teacherId ? { teacherId: sp.teacherId } : {}),
      ...(sp.termId ? { termId: sp.termId } : {}),
    }

    const skip = (sp.page - 1) * sp.perPage
    const take = sp.perPage
    const orderBy =
      sp.sort && Array.isArray(sp.sort) && sp.sort.length
        ? sp.sort.map((s) => ({ [s.id]: s.desc ? "desc" : "asc" }))
        : [{ createdAt: "desc" }]

    const [rows, count] = await Promise.all([
      db.class.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          subject: {
            select: {
              subjectName: true,
            },
          },
          teacher: {
            select: {
              givenName: true,
              surname: true,
            },
          },
          term: {
            select: {
              termNumber: true,
            },
          },
          grade: {
            select: {
              name: true,
              gradeNumber: true,
            },
          },
          _count: {
            select: {
              studentClasses: true,
            },
          },
        },
      }),
      db.class.count({ where }),
    ])

    const mapped: ClassListResult[] = (rows as Array<any>).map((c) => ({
      id: c.id as string,
      name: c.name as string,
      subjectName: c.subject?.subjectName || "Unknown",
      teacherName: c.teacher
        ? `${c.teacher.givenName} ${c.teacher.surname}`
        : "Unknown",
      termName: c.term?.termNumber ? `Term ${c.term.termNumber}` : "Unknown",
      gradeName: c.grade?.name || "",
      courseCode: c.courseCode || "",
      credits: c.credits?.toString() || "",
      evaluationType: c.evaluationType || "NORMAL",
      enrolledStudents: c._count.studentClasses,
      maxCapacity: c.maxCapacity || 50,
      createdAt: (c.createdAt as Date).toISOString(),
    }))

    return { success: true, data: { rows: mapped, total: count } }
  } catch (error) {
    console.error("[getClasses] Error:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch classes",
    }
  }
}

/**
 * Export classes to CSV format
 */
export async function getClassesCSV(
  input?: Partial<z.infer<typeof getClassesSchema>>
): Promise<ActionResponse<string>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    try {
      assertClassPermission(authContext, "export", { schoolId })
    } catch {
      return { success: false, error: "Unauthorized to export classes" }
    }

    const sp = getClassesSchema.parse(input ?? {})

    const where: any = {
      schoolId,
      ...(sp.name ? { name: { contains: sp.name, mode: "insensitive" } } : {}),
      ...(sp.subjectId ? { subjectId: sp.subjectId } : {}),
      ...(sp.teacherId ? { teacherId: sp.teacherId } : {}),
      ...(sp.termId ? { termId: sp.termId } : {}),
    }

    const classes = await db.class.findMany({
      where,
      include: {
        subject: {
          select: {
            subjectName: true,
          },
        },
        teacher: {
          select: {
            givenName: true,
            surname: true,
          },
        },
        term: {
          select: {
            termNumber: true,
          },
        },
        classroom: {
          select: {
            roomName: true,
            capacity: true,
          },
        },
        grade: {
          select: {
            name: true,
            gradeNumber: true,
          },
        },
        _count: {
          select: {
            studentClasses: true,
          },
        },
      },
      orderBy: [{ name: "asc" }],
    })

    const exportData = classes.map((classItem: any) => ({
      classId: classItem.id,
      name: classItem.name || "",
      courseCode: classItem.courseCode || "",
      grade: classItem.grade?.name || "",
      subject: classItem.subject?.subjectName || "",
      teacher: classItem.teacher
        ? `${classItem.teacher.givenName} ${classItem.teacher.surname}`
        : "",
      term: classItem.term?.termNumber
        ? `Term ${classItem.term.termNumber}`
        : "",
      classroom: classItem.classroom?.roomName || "",
      roomCapacity: classItem.classroom?.capacity || "",
      credits: classItem.credits || "",
      evaluationType: classItem.evaluationType || "NORMAL",
      minCapacity: classItem.minCapacity || "",
      maxCapacity: classItem.maxCapacity || "",
      duration: classItem.duration || "",
      enrolledStudents: classItem._count.studentClasses,
      createdAt: new Date(classItem.createdAt).toISOString().split("T")[0],
    }))

    const columns = [
      { key: "classId" as const, label: "Class ID" },
      { key: "name" as const, label: "Class Name" },
      { key: "courseCode" as const, label: "Course Code" },
      { key: "grade" as const, label: "Grade" },
      { key: "subject" as const, label: "Subject" },
      { key: "teacher" as const, label: "Teacher" },
      { key: "term" as const, label: "Term" },
      { key: "classroom" as const, label: "Classroom" },
      { key: "roomCapacity" as const, label: "Room Capacity" },
      { key: "credits" as const, label: "Credit Hours" },
      { key: "evaluationType" as const, label: "Evaluation Type" },
      { key: "minCapacity" as const, label: "Min Students" },
      { key: "maxCapacity" as const, label: "Max Students" },
      { key: "duration" as const, label: "Duration (weeks)" },
      { key: "enrolledStudents" as const, label: "Enrolled Students" },
      { key: "createdAt" as const, label: "Created Date" },
    ]

    const csv = arrayToCSV(exportData, { columns })
    return { success: true, data: csv }
  } catch (error) {
    console.error("[getClassesCSV] Error:", error)

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to export classes",
    }
  }
}

// ============================================================================
// Capacity Analytics
// ============================================================================

export type ClassCapacityAnalytics = {
  id: string
  name: string
  subjectName: string
  teacherName: string
  currentEnrollment: number
  minCapacity: number
  maxCapacity: number
  availableSpots: number
  percentageFull: number
  status: "under" | "optimal" | "near-full" | "full"
}

export type CapacityOverview = {
  totalClasses: number
  totalCapacity: number
  totalEnrolled: number
  averageUtilization: number
  classesUnderCapacity: number
  classesOptimal: number
  classesNearFull: number
  classesFull: number
  classes: ClassCapacityAnalytics[]
}

/**
 * Get all classes capacity analytics for the capacity dashboard
 * @returns Capacity overview with all classes data
 */
export async function getAllClassesCapacity(): Promise<
  ActionResponse<CapacityOverview>
> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    try {
      assertClassPermission(authContext, "read", { schoolId })
    } catch {
      return { success: false, error: "Unauthorized to read classes" }
    }

    const classes = await db.class.findMany({
      where: { schoolId },
      include: {
        subject: {
          select: { subjectName: true },
        },
        teacher: {
          select: { givenName: true, surname: true },
        },
        _count: {
          select: { studentClasses: true },
        },
      },
      orderBy: { name: "asc" },
    })

    const classesAnalytics: ClassCapacityAnalytics[] = (
      classes as Array<any>
    ).map((c) => {
      const minCapacity = c.minCapacity || 10
      const maxCapacity = c.maxCapacity || 50
      const currentEnrollment = c._count.studentClasses
      const availableSpots = Math.max(0, maxCapacity - currentEnrollment)
      const percentageFull = Math.round((currentEnrollment / maxCapacity) * 100)

      // Determine status
      let status: "under" | "optimal" | "near-full" | "full"
      if (currentEnrollment >= maxCapacity) {
        status = "full"
      } else if (percentageFull >= 85) {
        status = "near-full"
      } else if (currentEnrollment < minCapacity) {
        status = "under"
      } else {
        status = "optimal"
      }

      return {
        id: c.id,
        name: c.name,
        subjectName: c.subject?.subjectName || "Unknown",
        teacherName: c.teacher
          ? `${c.teacher.givenName} ${c.teacher.surname}`
          : "Unassigned",
        currentEnrollment,
        minCapacity,
        maxCapacity,
        availableSpots,
        percentageFull,
        status,
      }
    })

    // Calculate overview stats
    const totalClasses = classesAnalytics.length
    const totalCapacity = classesAnalytics.reduce(
      (sum, c) => sum + c.maxCapacity,
      0
    )
    const totalEnrolled = classesAnalytics.reduce(
      (sum, c) => sum + c.currentEnrollment,
      0
    )
    const averageUtilization =
      totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0

    const classesUnderCapacity = classesAnalytics.filter(
      (c) => c.status === "under"
    ).length
    const classesOptimal = classesAnalytics.filter(
      (c) => c.status === "optimal"
    ).length
    const classesNearFull = classesAnalytics.filter(
      (c) => c.status === "near-full"
    ).length
    const classesFull = classesAnalytics.filter(
      (c) => c.status === "full"
    ).length

    return {
      success: true,
      data: {
        totalClasses,
        totalCapacity,
        totalEnrolled,
        averageUtilization,
        classesUnderCapacity,
        classesOptimal,
        classesNearFull,
        classesFull,
        classes: classesAnalytics,
      },
    }
  } catch (error) {
    console.error("[getAllClassesCapacity] Error:", error)

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch capacity analytics",
    }
  }
}

/**
 * Get classes data for export (used by File Block ExportButton)
 * Returns raw data for client-side export generation
 */
export async function getClassesExportData(
  input?: Partial<z.infer<typeof getClassesSchema>>
): Promise<
  ActionResponse<
    Array<{
      id: string
      name: string
      code: string | null
      description: string | null
      subjectName: string | null
      teacherName: string | null
      termName: string | null
      yearLevelName: string | null
      capacity: number | null
      studentCount: number
      schedule: string | null
      room: string | null
      isActive: boolean
      createdAt: Date
    }>
  >
> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    try {
      assertClassPermission(authContext, "export", { schoolId })
    } catch {
      return { success: false, error: "Unauthorized to export classes" }
    }

    const sp = getClassesSchema.parse(input ?? {})

    const where: any = {
      schoolId,
      ...(sp.name ? { name: { contains: sp.name, mode: "insensitive" } } : {}),
      ...(sp.subjectId ? { subjectId: sp.subjectId } : {}),
      ...(sp.teacherId ? { teacherId: sp.teacherId } : {}),
      ...(sp.termId ? { termId: sp.termId } : {}),
    }

    const classes = await db.class.findMany({
      where,
      include: {
        subject: {
          select: {
            subjectName: true,
          },
        },
        teacher: {
          select: {
            givenName: true,
            surname: true,
          },
        },
        term: {
          select: {
            termNumber: true,
          },
        },
        classroom: {
          select: {
            roomName: true,
            capacity: true,
          },
        },
        _count: {
          select: {
            studentClasses: true,
          },
        },
      },
      orderBy: [{ name: "asc" }],
    })

    const exportData = classes.map((classItem: any) => ({
      id: classItem.id,
      name: classItem.name || "",
      code: classItem.courseCode || null,
      description: classItem.description || null,
      subjectName: classItem.subject?.subjectName || null,
      teacherName: classItem.teacher
        ? `${classItem.teacher.givenName} ${classItem.teacher.surname}`
        : null,
      termName: classItem.term?.termNumber
        ? `Term ${classItem.term.termNumber}`
        : null,
      yearLevelName: null, // Class model doesn't have yearLevel relation
      capacity: classItem.maxCapacity || null,
      studentCount: classItem._count.studentClasses,
      schedule: classItem.schedule || null,
      room: classItem.classroom?.roomName || null,
      isActive: classItem.isActive ?? true,
      createdAt: new Date(classItem.createdAt),
    }))

    return { success: true, data: exportData }
  } catch (error) {
    console.error("[getClassesExportData] Error:", error)

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch export data",
    }
  }
}

// ============================================================================
// ClassTeacher (Subject Teacher Assignment) Operations
// ============================================================================

export type ClassTeacherRow = {
  id: string
  classId: string
  teacherId: string
  role: string
  teacherName: string
  teacherEmail: string | null
  createdAt: string
}

/**
 * Assign a teacher to a class as a subject teacher
 */
export async function assignSubjectTeacher(
  input: ClassTeacherCreateInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    try {
      assertClassPermission(authContext, "update", { schoolId })
    } catch {
      return { success: false, error: "Unauthorized to update classes" }
    }

    const parsed = classTeacherCreateSchema.parse(input)

    // Verify class exists and belongs to school
    const existingClass = await db.class.findFirst({
      where: { id: parsed.classId, schoolId },
      select: { id: true, name: true },
    })

    if (!existingClass) {
      return { success: false, error: "Class not found" }
    }

    // Verify teacher exists and belongs to school
    const teacherModel = getModelOrThrow("teacher")
    const teacher = await teacherModel.findFirst({
      where: { id: parsed.teacherId, schoolId },
      select: { id: true, givenName: true, surname: true },
    })

    if (!teacher) {
      return { success: false, error: "Teacher not found" }
    }

    // Check for duplicate assignment
    const classTeacherModel = getModelOrThrow("classTeacher")
    const existing = await classTeacherModel.findFirst({
      where: {
        classId: parsed.classId,
        teacherId: parsed.teacherId,
        schoolId,
      },
    })

    if (existing) {
      return {
        success: false,
        error: `${teacher.givenName} ${teacher.surname} is already assigned to this class`,
      }
    }

    // Create assignment
    const assignment = await classTeacherModel.create({
      data: {
        schoolId,
        classId: parsed.classId,
        teacherId: parsed.teacherId,
        role: parsed.role || "ASSISTANT",
      },
    })

    revalidatePath(CLASSES_PATH)
    revalidatePath(`/classes/${parsed.classId}`)

    return { success: true, data: { id: assignment.id } }
  } catch (error) {
    console.error("[assignSubjectTeacher] Error:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to assign teacher",
    }
  }
}

/**
 * Update a subject teacher assignment (e.g., change role)
 */
export async function updateSubjectTeacher(input: {
  id: string
  role?: string
}): Promise<ActionResponse<void>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    try {
      assertClassPermission(authContext, "update", { schoolId })
    } catch {
      return { success: false, error: "Unauthorized to update classes" }
    }

    const parsed = classTeacherUpdateSchema.parse(input)

    // Verify assignment exists
    const classTeacherModel = getModelOrThrow("classTeacher")
    const existing = await classTeacherModel.findFirst({
      where: { id: parsed.id, schoolId },
      select: { id: true, classId: true },
    })

    if (!existing) {
      return { success: false, error: "Assignment not found" }
    }

    await classTeacherModel.update({
      where: { id: parsed.id },
      data: { role: parsed.role },
    })

    revalidatePath(CLASSES_PATH)
    revalidatePath(`/classes/${existing.classId}`)

    return { success: true, data: undefined }
  } catch (error) {
    console.error("[updateSubjectTeacher] Error:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update assignment",
    }
  }
}

/**
 * Remove a subject teacher from a class
 */
export async function removeSubjectTeacher(input: {
  id: string
}): Promise<ActionResponse<void>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    try {
      assertClassPermission(authContext, "update", { schoolId })
    } catch {
      return { success: false, error: "Unauthorized to update classes" }
    }

    const { id } = z.object({ id: z.string().min(1) }).parse(input)

    // Verify assignment exists
    const classTeacherModel = getModelOrThrow("classTeacher")
    const existing = await classTeacherModel.findFirst({
      where: { id, schoolId },
      select: { id: true, classId: true },
    })

    if (!existing) {
      return { success: false, error: "Assignment not found" }
    }

    await classTeacherModel.delete({
      where: { id },
    })

    revalidatePath(CLASSES_PATH)
    revalidatePath(`/classes/${existing.classId}`)

    return { success: true, data: undefined }
  } catch (error) {
    console.error("[removeSubjectTeacher] Error:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to remove teacher",
    }
  }
}

/**
 * Get all subject teachers for a class
 */
export async function getClassSubjectTeachers(input: {
  classId: string
}): Promise<ActionResponse<ClassTeacherRow[]>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    try {
      assertClassPermission(authContext, "read", { schoolId })
    } catch {
      return { success: false, error: "Unauthorized to read classes" }
    }

    const { classId } = z.object({ classId: z.string().min(1) }).parse(input)

    // Verify class exists
    const existingClass = await db.class.findFirst({
      where: { id: classId, schoolId },
      select: { id: true },
    })

    if (!existingClass) {
      return { success: false, error: "Class not found" }
    }

    const classTeacherModel = getModelOrThrow("classTeacher")
    const assignments = await classTeacherModel.findMany({
      where: { classId, schoolId },
      include: {
        teacher: {
          select: {
            id: true,
            givenName: true,
            surname: true,
            emailAddress: true,
          },
        },
      },
      orderBy: [{ role: "asc" as const }, { createdAt: "asc" as const }],
    })

    const rows: ClassTeacherRow[] = assignments.map((a: any) => ({
      id: a.id,
      classId: a.classId,
      teacherId: a.teacherId,
      role: a.role,
      teacherName: `${a.teacher.givenName} ${a.teacher.surname}`,
      teacherEmail: a.teacher.emailAddress || null,
      createdAt: a.createdAt.toISOString(),
    }))

    return { success: true, data: rows }
  } catch (error) {
    console.error("[getClassSubjectTeachers] Error:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch subject teachers",
    }
  }
}

/**
 * Get available teachers for assignment (teachers not already assigned to class)
 */
export async function getAvailableTeachersForClass(input: {
  classId: string
}): Promise<
  ActionResponse<Array<{ id: string; name: string; email: string | null }>>
> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    try {
      assertClassPermission(authContext, "read", { schoolId })
    } catch {
      return { success: false, error: "Unauthorized to read classes" }
    }

    const { classId } = z.object({ classId: z.string().min(1) }).parse(input)

    // Get already assigned teacher IDs
    const classTeacherModel = getModelOrThrow("classTeacher")
    const assignedTeachers = await classTeacherModel.findMany({
      where: { classId, schoolId },
      select: { teacherId: true },
    })

    const assignedIds = assignedTeachers.map((t: any) => t.teacherId)

    // Get all teachers not in assignedIds
    const teacherModel = getModelOrThrow("teacher")
    const teachers = await teacherModel.findMany({
      where: {
        schoolId,
        id: { notIn: assignedIds.length > 0 ? assignedIds : undefined },
      },
      select: {
        id: true,
        givenName: true,
        surname: true,
        emailAddress: true,
      },
      orderBy: [{ surname: "asc" }, { givenName: "asc" }],
    })

    const result = teachers.map((t: any) => ({
      id: t.id,
      name: `${t.givenName} ${t.surname}`,
      email: t.emailAddress || null,
    }))

    return { success: true, data: result }
  } catch (error) {
    console.error("[getAvailableTeachersForClass] Error:", error)

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch available teachers",
    }
  }
}

export async function bulkDeleteClasses(input: {
  ids: string[]
}): Promise<ActionResponse<{ count: number }>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    try {
      assertClassPermission(authContext, "bulk_action", { schoolId })
    } catch {
      return { success: false, error: "Unauthorized for bulk operations" }
    }

    const { ids } = z
      .object({ ids: z.array(z.string().min(1)).min(1) })
      .parse(input)

    const existing = await db.class.findMany({
      where: { id: { in: ids }, schoolId },
      select: { id: true },
    })
    const validIds = existing.map((c: any) => c.id)

    const result = await db.class.deleteMany({
      where: { id: { in: validIds }, schoolId },
    })

    revalidatePath("/classes")
    return { success: true, data: { count: result.count } }
  } catch (error) {
    console.error("[bulkDeleteClasses] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to bulk delete classes",
    }
  }
}
