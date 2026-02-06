/**
 * Teachers Server Actions Module
 *
 * RESPONSIBILITY: Teacher lifecycle management - create, update, assign classes/subjects, manage credentials
 *
 * WHAT IT HANDLES:
 * - Teacher records: Create, update, delete basic info (name, qualifications, specialization)
 * - Class assignment: Assign teachers to classes as homeroom or subject teachers
 * - Subject expertise: Map teacher certifications and subject teaching assignments
 * - Department management: Organize teachers into departments
 * - Performance tracking: Monitor class assignments, student feedback, teaching metrics
 * - Bulk operations: Export teacher lists, import teacher data
 *
 * KEY ALGORITHMS:
 * 1. createTeacher(): Validates qualifications format, normalizes strings
 * 2. getTeachers(): Supports filtering by department, subject, specialization
 * 3. Assignment validation: Check teacher availability before adding to class
 * 4. Subject mapping: Many-to-many relationship between teachers and subjects
 *
 * MULTI-TENANT SAFETY (CRITICAL):
 * - ALL teacher records must have schoolId (required field)
 * - Class assignments validate class belongs to same school
 * - Subject assignments must reference school's subject catalog
 * - Department filtering scoped to schoolId
 * - Email uniqueness is per-school (same logic as students)
 *
 * GOTCHAS & NON-OBVIOUS BEHAVIOR:
 * 1. Teacher can be assigned to multiple classes (1:many relationship)
 * 2. Teacher can teach multiple subjects (many-to-many, allows overlaps)
 * 3. qualifications is free-text (no validation, consider standardizing)
 * 4. Deleting teacher doesn't auto-reassign classes (admin must manually handle)
 * 5. Department is optional - allows teachers without department affiliation
 *
 * QUALIFICATION MANAGEMENT:
 * - Stored as free-text (e.g., "BS Math, MS Education, PGCE")
 * - No validation against known certifications (consider: standardized taxonomy)
 * - No expiry tracking (assume permanent unless manually updated)
 * - Consider: License/credential expiry dates and renewal tracking
 *
 * PERFORMANCE NOTES:
 * - getTeachers() with multiple filters - ensure indexes on (schoolId, department) and (schoolId, name)
 * - Subject assignments use joins - monitor for N+1 queries if fetched frequently
 * - Department loading is eager - could optimize with lazy loading for large schools
 * - Class assignments show workload - useful for balancing but can be expensive calculation
 *
 * PERMISSION NOTES:
 * - Teachers can edit own profile (enforce in UI)
 * - Department heads can manage teachers in their department
 * - School admin can manage all teachers
 * - Teachers cannot assign themselves to classes (prevent conflicts)
 *
 * FUTURE IMPROVEMENTS:
 * - Add standardized qualifications/certifications (CCNA, PMP, etc.)
 * - Implement license expiry tracking and renewal reminders
 * - Add teaching load balancing (suggest optimal class distribution)
 * - Support teaching preferences (preferred subjects, grades, languages)
 * - Add performance review tracking
 * - Implement teacher evaluation system (student feedback, peer review)
 * - Add professional development hours tracking
 * - Support substitute teacher management
 * - Add teacher mentorship program tracking
 * - Implement absence/leave management
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
  getTeachersSchema,
  teacherCreateSchema,
  teacherUpdateSchema,
} from "@/components/school-dashboard/listings/teachers/validation"

import { assertTeacherPermission, getAuthContext } from "./authorization"

// ============================================================================
// Types
// ============================================================================

export type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

// ============================================================================
// Constants
// ============================================================================

const TEACHERS_PATH = "/teachers"

// ============================================================================
// Mutations
// ============================================================================

/**
 * Create a new teacher with all related data
 * @param input - Teacher data including qualifications, experience, expertise
 * @returns Action response with teacher ID
 */
export async function createTeacher(
  input: z.infer<typeof teacherCreateSchema>
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return { success: false, error: "Not authenticated" }
    }

    // Get tenant context
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    try {
      assertTeacherPermission(authContext, "create", { schoolId })
    } catch {
      return { success: false, error: "Unauthorized" }
    }

    // Parse and validate input
    const parsed = teacherCreateSchema.parse(input)

    // Use transaction to ensure all related data is created atomically
    const result = await db.$transaction(async (tx: any) => {
      // Create teacher with all basic + employment fields
      const teacher = await tx.teacher.create({
        data: {
          schoolId,
          givenName: parsed.givenName,
          surname: parsed.surname,
          gender: parsed.gender,
          emailAddress: parsed.emailAddress,
          birthDate: parsed.birthDate,
          employeeId: parsed.employeeId,
          joiningDate: parsed.joiningDate,
          employmentStatus: parsed.employmentStatus || "ACTIVE",
          employmentType: parsed.employmentType || "FULL_TIME",
          contractStartDate: parsed.contractStartDate,
          contractEndDate: parsed.contractEndDate,
        },
      })

      // Create phone numbers if provided
      if (parsed.phoneNumbers && parsed.phoneNumbers.length > 0) {
        await tx.teacherPhoneNumber.createMany({
          data: parsed.phoneNumbers.map((phone) => ({
            schoolId,
            teacherId: teacher.id,
            phoneNumber: phone.phoneNumber,
            phoneType: phone.phoneType,
            isPrimary: phone.isPrimary,
          })),
        })
      }

      // Create qualifications if provided
      if (parsed.qualifications && parsed.qualifications.length > 0) {
        await tx.teacherQualification.createMany({
          data: parsed.qualifications.map((qual) => ({
            schoolId,
            teacherId: teacher.id,
            qualificationType: qual.qualificationType,
            name: qual.name,
            institution: qual.institution,
            major: qual.major,
            dateObtained: qual.dateObtained,
            expiryDate: qual.expiryDate,
            licenseNumber: qual.licenseNumber,
            documentUrl: qual.documentUrl,
          })),
        })
      }

      // Create experiences if provided
      if (parsed.experiences && parsed.experiences.length > 0) {
        await tx.teacherExperience.createMany({
          data: parsed.experiences.map((exp) => ({
            schoolId,
            teacherId: teacher.id,
            institution: exp.institution,
            position: exp.position,
            startDate: exp.startDate,
            endDate: exp.endDate,
            isCurrent: exp.isCurrent,
            description: exp.description,
          })),
        })
      }

      // Create subject expertise if provided
      if (parsed.subjectExpertise && parsed.subjectExpertise.length > 0) {
        await tx.teacherSubjectExpertise.createMany({
          data: parsed.subjectExpertise.map((expertise) => ({
            schoolId,
            teacherId: teacher.id,
            subjectId: expertise.subjectId,
            expertiseLevel: expertise.expertiseLevel,
          })),
        })
      }

      return teacher
    })

    // Revalidate cache
    revalidatePath(TEACHERS_PATH)

    return { success: true, data: { id: result.id as string } }
  } catch (error) {
    console.error("[createTeacher] Error:", error, {
      input,
      timestamp: new Date().toISOString(),
    })

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create teacher",
    }
  }
}

/**
 * Update an existing teacher with all related data
 * @param input - Teacher update data
 * @returns Action response
 */
export async function updateTeacher(
  input: z.infer<typeof teacherUpdateSchema>
): Promise<ActionResponse<void>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return { success: false, error: "Not authenticated" }
    }

    // Get tenant context
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    try {
      assertTeacherPermission(authContext, "update", { schoolId })
    } catch {
      return { success: false, error: "Unauthorized to update teachers" }
    }

    // Parse and validate input
    const parsed = teacherUpdateSchema.parse(input)
    const { id, qualifications, experiences, subjectExpertise, ...rest } =
      parsed

    // Build update data object for teacher
    const data: Record<string, unknown> = {}
    if (typeof rest.givenName !== "undefined") data.givenName = rest.givenName
    if (typeof rest.surname !== "undefined") data.surname = rest.surname
    if (typeof rest.gender !== "undefined") data.gender = rest.gender
    if (typeof rest.emailAddress !== "undefined")
      data.emailAddress = rest.emailAddress
    if (typeof rest.birthDate !== "undefined") data.birthDate = rest.birthDate
    if (typeof rest.employeeId !== "undefined")
      data.employeeId = rest.employeeId
    if (typeof rest.joiningDate !== "undefined")
      data.joiningDate = rest.joiningDate
    if (typeof rest.employmentStatus !== "undefined")
      data.employmentStatus = rest.employmentStatus
    if (typeof rest.employmentType !== "undefined")
      data.employmentType = rest.employmentType
    if (typeof rest.contractStartDate !== "undefined")
      data.contractStartDate = rest.contractStartDate
    if (typeof rest.contractEndDate !== "undefined")
      data.contractEndDate = rest.contractEndDate

    // Use transaction for atomic updates
    await db.$transaction(async (tx: any) => {
      // Update teacher basic info
      await tx.teacher.updateMany({ where: { id, schoolId }, data })

      // Update qualifications if provided (delete and recreate for simplicity)
      if (qualifications !== undefined) {
        await tx.teacherQualification.deleteMany({
          where: { teacherId: id, schoolId },
        })
        if (qualifications.length > 0) {
          await tx.teacherQualification.createMany({
            data: qualifications.map((qual) => ({
              schoolId,
              teacherId: id,
              qualificationType: qual.qualificationType,
              name: qual.name,
              institution: qual.institution,
              major: qual.major,
              dateObtained: qual.dateObtained,
              expiryDate: qual.expiryDate,
              licenseNumber: qual.licenseNumber,
              documentUrl: qual.documentUrl,
            })),
          })
        }
      }

      // Update experiences if provided
      if (experiences !== undefined) {
        await tx.teacherExperience.deleteMany({
          where: { teacherId: id, schoolId },
        })
        if (experiences.length > 0) {
          await tx.teacherExperience.createMany({
            data: experiences.map((exp) => ({
              schoolId,
              teacherId: id,
              institution: exp.institution,
              position: exp.position,
              startDate: exp.startDate,
              endDate: exp.endDate,
              isCurrent: exp.isCurrent,
              description: exp.description,
            })),
          })
        }
      }

      // Update subject expertise if provided
      if (subjectExpertise !== undefined) {
        await tx.teacherSubjectExpertise.deleteMany({
          where: { teacherId: id, schoolId },
        })
        if (subjectExpertise.length > 0) {
          await tx.teacherSubjectExpertise.createMany({
            data: subjectExpertise.map((expertise) => ({
              schoolId,
              teacherId: id,
              subjectId: expertise.subjectId,
              expertiseLevel: expertise.expertiseLevel,
            })),
          })
        }
      }
    })

    // Revalidate cache
    revalidatePath(TEACHERS_PATH)

    return { success: true, data: undefined }
  } catch (error) {
    console.error("[updateTeacher] Error:", error, {
      input,
      timestamp: new Date().toISOString(),
    })

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update teacher",
    }
  }
}

/**
 * Delete a teacher
 * @param input - Teacher ID
 * @returns Action response
 */
export async function deleteTeacher(input: {
  id: string
}): Promise<ActionResponse<void>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return { success: false, error: "Not authenticated" }
    }

    // Get tenant context
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    try {
      assertTeacherPermission(authContext, "delete", { schoolId })
    } catch {
      return { success: false, error: "Unauthorized to delete teachers" }
    }

    // Parse and validate input
    const { id } = z.object({ id: z.string().min(1) }).parse(input)

    // Delete teacher (using deleteMany for tenant safety)
    const teacherModel = getModelOrThrow("teacher")
    await teacherModel.deleteMany({ where: { id, schoolId } })

    // Revalidate cache
    revalidatePath(TEACHERS_PATH)

    return { success: true, data: undefined }
  } catch (error) {
    console.error("[deleteTeacher] Error:", error, {
      input,
      timestamp: new Date().toISOString(),
    })

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete teacher",
    }
  }
}

// ============================================================================
// Queries
// ============================================================================

/**
 * Get a single teacher by ID with all related data
 * @param input - Teacher ID
 * @returns Action response with teacher data
 */
export async function getTeacher(input: {
  id: string
}): Promise<ActionResponse<Record<string, unknown> | null>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return { success: false, error: "Not authenticated" }
    }

    // Get tenant context
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    try {
      assertTeacherPermission(authContext, "read", { schoolId })
    } catch {
      return { success: false, error: "Unauthorized to read teachers" }
    }

    // Parse and validate input
    const { id } = z.object({ id: z.string().min(1) }).parse(input)

    // Fetch teacher with all related data
    const teacherModel = getModelOrThrow("teacher")
    const teacher = await teacherModel.findFirst({
      where: { id, schoolId },
      include: {
        phoneNumbers: {
          select: {
            id: true,
            phoneNumber: true,
            phoneType: true,
            isPrimary: true,
          },
          orderBy: { isPrimary: "desc" },
        },
        qualifications: {
          select: {
            id: true,
            qualificationType: true,
            name: true,
            institution: true,
            major: true,
            dateObtained: true,
            expiryDate: true,
            licenseNumber: true,
            documentUrl: true,
          },
          orderBy: { dateObtained: "desc" },
        },
        experiences: {
          select: {
            id: true,
            institution: true,
            position: true,
            startDate: true,
            endDate: true,
            isCurrent: true,
            description: true,
          },
          orderBy: { startDate: "desc" },
        },
        subjectExpertise: {
          select: {
            id: true,
            subjectId: true,
            expertiseLevel: true,
            subject: {
              select: {
                id: true,
                subjectName: true,
                lang: true,
              },
            },
          },
        },
        teacherDepartments: {
          select: {
            id: true,
            departmentId: true,
            isPrimary: true,
            department: {
              select: {
                id: true,
                departmentName: true,
                lang: true,
              },
            },
          },
        },
        classes: {
          select: {
            id: true,
            className: true,
            lang: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            image: true,
          },
        },
      },
    })

    return { success: true, data: teacher as null | Record<string, unknown> }
  } catch (error) {
    console.error("[getTeacher] Error:", error, {
      input,
      timestamp: new Date().toISOString(),
    })

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch teacher",
    }
  }
}

/**
 * Get teacher workload and schedule data
 * @param input - Teacher ID and optional term filter
 * @returns Action response with workload data
 */
export async function getTeacherWorkload(input: {
  teacherId: string
  termId?: string
}): Promise<
  ActionResponse<{
    totalPeriods: number
    classCount: number
    subjectCount: number
    schedule: Array<{
      day: number
      period: number
      subject: string
      className: string
    }>
    workloadStatus: "UNDERUTILIZED" | "NORMAL" | "OVERLOAD"
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
      assertTeacherPermission(authContext, "read", { schoolId })
    } catch {
      return { success: false, error: "Unauthorized to read teachers" }
    }

    const { teacherId, termId } = input

    // Get teacher's timetable slots
    const timetableSlotModel = getModelOrThrow("timetableSlot")
    const timetableSlots =
      (await timetableSlotModel.findMany({
        where: {
          schoolId,
          teacherId,
          ...(termId ? { timetable: { termId } } : {}),
        },
        include: {
          subject: { select: { subjectName: true } },
          class: { select: { className: true } },
          period: { select: { periodNumber: true, dayOfWeek: true } },
        },
      })) || []

    // Get workload config for school
    const workloadConfigModel = getModelOrThrow("workloadConfig")
    const workloadConfig = (await workloadConfigModel.findUnique({
      where: { schoolId },
    })) || {
      minPeriodsPerWeek: 15,
      normalPeriodsPerWeek: 20,
      maxPeriodsPerWeek: 25,
      overloadThreshold: 25,
    }

    const totalPeriods = timetableSlots.length
    const uniqueClasses = new Set(timetableSlots.map((s: any) => s.classId))
    const uniqueSubjects = new Set(timetableSlots.map((s: any) => s.subjectId))

    // Determine workload status
    let workloadStatus: "UNDERUTILIZED" | "NORMAL" | "OVERLOAD" = "NORMAL"
    if (totalPeriods < workloadConfig.minPeriodsPerWeek) {
      workloadStatus = "UNDERUTILIZED"
    } else if (totalPeriods > workloadConfig.overloadThreshold) {
      workloadStatus = "OVERLOAD"
    }

    const schedule = timetableSlots.map((slot: any) => ({
      day: slot.period?.dayOfWeek || 0,
      period: slot.period?.periodNumber || 0,
      subject: slot.subject?.subjectName || "Unknown",
      className: slot.class?.className || "Unknown",
    }))

    return {
      success: true,
      data: {
        totalPeriods,
        classCount: uniqueClasses.size,
        subjectCount: uniqueSubjects.size,
        schedule,
        workloadStatus,
      },
    }
  } catch (error) {
    console.error("[getTeacherWorkload] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch workload",
    }
  }
}

/**
 * Get teachers list with filtering and pagination
 * @param input - Query parameters
 * @returns Action response with teachers and total count
 */
export async function getTeachers(
  input: Partial<z.infer<typeof getTeachersSchema>>
): Promise<
  ActionResponse<{
    rows: Array<{
      id: string
      name: string
      emailAddress: string
      status: string
      createdAt: string
    }>
    total: number
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
      assertTeacherPermission(authContext, "read", { schoolId })
    } catch {
      return { success: false, error: "Unauthorized to read teachers" }
    }

    const sp = getTeachersSchema.parse(input ?? {})

    // Build where clause
    const teacherModel = getModelOrThrow("teacher")
    const where: any = {
      schoolId,
      ...(sp.name
        ? {
            OR: [
              { givenName: { contains: sp.name, mode: "insensitive" } },
              { surname: { contains: sp.name, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(sp.emailAddress
        ? { emailAddress: { contains: sp.emailAddress, mode: "insensitive" } }
        : {}),
      ...(sp.status
        ? sp.status === "active"
          ? { NOT: { userId: null } }
          : sp.status === "inactive"
            ? { userId: null }
            : {}
        : {}),
    }

    // Build pagination
    const skip = (sp.page - 1) * sp.perPage
    const take = sp.perPage

    // Build order by clause
    const orderBy =
      sp.sort && Array.isArray(sp.sort) && sp.sort.length
        ? sp.sort.map((s) => ({ [s.id]: s.desc ? "desc" : "asc" }))
        : [{ createdAt: "desc" }]

    // Execute queries in parallel
    const [rows, count] = await Promise.all([
      teacherModel.findMany({ where, orderBy, skip, take }),
      teacherModel.count({ where }),
    ])

    // Map results
    const mapped = (rows as Array<any>).map((t) => ({
      id: t.id as string,
      userId: t.userId as string | null,
      name: [t.givenName, t.surname].filter(Boolean).join(" "),
      emailAddress: t.emailAddress || "-",
      status: t.userId ? "active" : "inactive",
      createdAt: (t.createdAt as Date).toISOString(),
    }))

    return { success: true, data: { rows: mapped, total: count as number } }
  } catch (error) {
    console.error("[getTeachers] Error:", error, {
      input,
      timestamp: new Date().toISOString(),
    })

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch teachers",
    }
  }
}

/**
 * Export teachers to CSV format
 * @param input - Query parameters
 * @returns CSV string
 */
export async function getTeachersCSV(
  input?: Partial<z.infer<typeof getTeachersSchema>>
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
      assertTeacherPermission(authContext, "export", { schoolId })
    } catch {
      return { success: false, error: "Unauthorized to export teachers" }
    }

    const sp = getTeachersSchema.parse(input ?? {})

    // Build where clause with filters
    const teacherModel = getModelOrThrow("teacher")
    const where: any = {
      schoolId,
      ...(sp.name
        ? {
            OR: [
              { givenName: { contains: sp.name, mode: "insensitive" } },
              { surname: { contains: sp.name, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(sp.emailAddress
        ? { emailAddress: { contains: sp.emailAddress, mode: "insensitive" } }
        : {}),
      ...(sp.status
        ? sp.status === "active"
          ? { NOT: { userId: null } }
          : sp.status === "inactive"
            ? { userId: null }
            : {}
        : {}),
    }

    // Fetch ALL teachers matching filters (no pagination for export)
    const teachers = await teacherModel.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
          },
        },
        teacherDepartments: {
          include: {
            department: {
              select: {
                departmentName: true,
              },
            },
          },
          take: 1, // Get primary department
        },
        teacherPhoneNumbers: {
          where: {
            isPrimary: true,
          },
          select: {
            phoneNumber: true,
          },
          take: 1,
        },
      },
      orderBy: [{ givenName: "asc" }, { surname: "asc" }],
    })

    // Transform data for CSV export
    const exportData = teachers.map((teacher: any) => ({
      teacherId: teacher.id,
      employeeId: teacher.employeeId || "",
      givenName: teacher.givenName || "",
      surname: teacher.surname || "",
      fullName: [teacher.givenName, teacher.surname].filter(Boolean).join(" "),
      gender: teacher.gender || "",
      email: teacher.emailAddress || "",
      userEmail: teacher.user?.email || "",
      phone:
        teacher.teacherPhoneNumbers && teacher.teacherPhoneNumbers.length > 0
          ? teacher.teacherPhoneNumbers[0].phoneNumber
          : "",
      department:
        teacher.teacherDepartments && teacher.teacherDepartments.length > 0
          ? teacher.teacherDepartments[0].department.departmentName
          : "",
      status: teacher.userId ? "Active" : "Inactive",
      createdAt: new Date(teacher.createdAt).toISOString().split("T")[0],
    }))

    // Define CSV columns
    const columns = [
      { key: "teacherId", label: "Teacher ID" },
      { key: "employeeId", label: "Employee ID" },
      { key: "givenName", label: "First Name" },
      { key: "surname", label: "Last Name" },
      { key: "fullName", label: "Full Name" },
      { key: "gender", label: "Gender" },
      { key: "email", label: "Primary Email" },
      { key: "userEmail", label: "User Account Email" },
      { key: "phone", label: "Phone" },
      { key: "department", label: "Department" },
      { key: "status", label: "Status" },
      { key: "createdAt", label: "Created Date" },
    ]

    const csv = arrayToCSV(exportData, { columns })
    return { success: true, data: csv }
  } catch (error) {
    console.error("[getTeachersCSV] Error:", error, {
      input,
      timestamp: new Date().toISOString(),
    })

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to export teachers",
    }
  }
}

/**
 * Get all subjects for teacher expertise selection
 * Groups subjects by department for better organization
 * @returns Action response with subjects grouped by department
 */
export async function getSubjectsForExpertise(): Promise<
  ActionResponse<{
    subjects: Array<{
      id: string
      name: string
      lang: string
      departmentId: string
      departmentName: string
    }>
    byDepartment: Record<
      string,
      Array<{
        id: string
        name: string
        lang: string
      }>
    >
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
      assertTeacherPermission(authContext, "read", { schoolId })
    } catch {
      return { success: false, error: "Unauthorized to read teachers" }
    }

    // Fetch all subjects with their departments
    const subjectModel = getModelOrThrow("subject")
    const subjects = await subjectModel.findMany({
      where: { schoolId },
      include: {
        department: {
          select: {
            id: true,
            departmentName: true,
            lang: true,
          },
        },
      },
      orderBy: [
        { department: { departmentName: "asc" } },
        { subjectName: "asc" },
      ],
    })

    // Map subjects to a flat list
    const mappedSubjects = subjects.map((s: any) => ({
      id: s.id,
      name: s.subjectName,
      lang: s.lang || "ar",
      departmentId: s.departmentId,
      departmentName: s.department?.departmentName || "Unknown",
    }))

    // Group subjects by department name
    const byDepartment: Record<
      string,
      Array<{ id: string; name: string; lang: string }>
    > = {}
    for (const subject of mappedSubjects) {
      const deptName = subject.departmentName
      if (!byDepartment[deptName]) {
        byDepartment[deptName] = []
      }
      byDepartment[deptName].push({
        id: subject.id,
        name: subject.name,
        lang: subject.lang,
      })
    }

    return {
      success: true,
      data: {
        subjects: mappedSubjects,
        byDepartment,
      },
    }
  } catch (error) {
    console.error("[getSubjectsForExpertise] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch subjects",
    }
  }
}

/**
 * Get teachers data for export (used by File Block ExportButton)
 * Returns raw data for client-side export generation
 * @param input - Query parameters
 * @returns Array of teacher export data
 */
export async function getTeachersExportData(
  input?: Partial<z.infer<typeof getTeachersSchema>>
): Promise<
  ActionResponse<
    Array<{
      id: string
      employeeId: string | null
      givenName: string
      surname: string
      fullName: string
      gender: string
      email: string | null
      userEmail: string | null
      phone: string | null
      department: string | null
      qualification: string | null
      specialization: string | null
      hireDate: Date | null
      status: string
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
      assertTeacherPermission(authContext, "export", { schoolId })
    } catch {
      return { success: false, error: "Unauthorized to export teachers" }
    }

    const sp = getTeachersSchema.parse(input ?? {})

    // Build where clause with filters
    const teacherModel = getModelOrThrow("teacher")
    const where: any = {
      schoolId,
      ...(sp.name
        ? {
            OR: [
              { givenName: { contains: sp.name, mode: "insensitive" } },
              { surname: { contains: sp.name, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(sp.emailAddress
        ? { emailAddress: { contains: sp.emailAddress, mode: "insensitive" } }
        : {}),
      ...(sp.status
        ? sp.status === "active"
          ? { NOT: { userId: null } }
          : sp.status === "inactive"
            ? { userId: null }
            : {}
        : {}),
    }

    // Fetch ALL teachers matching filters (no pagination for export)
    const teachers = await teacherModel.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
          },
        },
        teacherDepartments: {
          include: {
            department: {
              select: {
                departmentName: true,
              },
            },
          },
          take: 1,
        },
        teacherPhoneNumbers: {
          where: {
            isPrimary: true,
          },
          select: {
            phoneNumber: true,
          },
          take: 1,
        },
      },
      orderBy: [{ givenName: "asc" }, { surname: "asc" }],
    })

    // Transform data for export
    const exportData = teachers.map((teacher: any) => ({
      id: teacher.id,
      employeeId: teacher.employeeId || null,
      givenName: teacher.givenName || "",
      surname: teacher.surname || "",
      fullName: [teacher.givenName, teacher.surname].filter(Boolean).join(" "),
      gender: teacher.gender || "",
      email: teacher.emailAddress || null,
      userEmail: teacher.user?.email || null,
      phone:
        teacher.teacherPhoneNumbers && teacher.teacherPhoneNumbers.length > 0
          ? teacher.teacherPhoneNumbers[0].phoneNumber
          : null,
      department:
        teacher.teacherDepartments && teacher.teacherDepartments.length > 0
          ? teacher.teacherDepartments[0].department.departmentName
          : null,
      qualification: teacher.qualification || null,
      specialization: teacher.specialization || null,
      hireDate: teacher.hireDate ? new Date(teacher.hireDate) : null,
      status: teacher.userId ? "Active" : "Inactive",
      createdAt: new Date(teacher.createdAt),
    }))

    return { success: true, data: exportData }
  } catch (error) {
    console.error("[getTeachersExportData] Error:", error, {
      input,
      timestamp: new Date().toISOString(),
    })

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch export data",
    }
  }
}

export async function bulkDeleteTeachers(input: {
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
      assertTeacherPermission(authContext, "bulk_action", { schoolId })
    } catch {
      return { success: false, error: "Unauthorized for bulk operations" }
    }

    const { ids } = z
      .object({ ids: z.array(z.string().min(1)).min(1) })
      .parse(input)

    const teacherModel = getModelOrThrow("teacher")
    const existing = await teacherModel.findMany({
      where: { id: { in: ids }, schoolId },
      select: { id: true },
    })
    const validIds = existing.map((t: any) => t.id)

    const result = await teacherModel.deleteMany({
      where: { id: { in: validIds }, schoolId },
    })

    revalidatePath("/teachers")
    return { success: true, data: { count: result.count as number } }
  } catch (error) {
    console.error("[bulkDeleteTeachers] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to bulk delete teachers",
    }
  }
}
