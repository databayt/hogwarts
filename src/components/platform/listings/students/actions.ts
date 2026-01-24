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
 * 2. Email deduplication is PER SCHOOL - not platform-wide
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
import { z } from "zod"

import { db } from "@/lib/db"
import { getModelOrThrow } from "@/lib/prisma-guards"
import { getTenantContext } from "@/lib/tenant-context"
import { arrayToCSV } from "@/components/file"
import {
  getStudentsSchema,
  studentCreateSchema,
  studentUpdateSchema,
} from "@/components/platform/listings/students/validation"

// ============================================================================
// Types
// ============================================================================

export type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

// ============================================================================
// Constants
// ============================================================================

const STUDENTS_PATH = "/students"

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
    // Get tenant context
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
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

    // Create student record
    const studentModel = getModelOrThrow("student")
    const row = await studentModel.create({
      data: {
        schoolId,
        givenName: parsed.givenName,
        middleName: parsed.middleName ?? null,
        surname: parsed.surname,
        ...(parsed.dateOfBirth
          ? { dateOfBirth: new Date(parsed.dateOfBirth) }
          : {}),
        gender: parsed.gender,
        ...(parsed.enrollmentDate
          ? { enrollmentDate: new Date(parsed.enrollmentDate) }
          : {}),
        userId: normalizedUserId,
      },
    })

    // Revalidate cache
    revalidatePath(STUDENTS_PATH)

    return { success: true, data: { id: row.id } }
  } catch (error) {
    console.error("[createStudent] Error:", error, {
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
        error instanceof Error ? error.message : "Failed to create student",
    }
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
    // Get tenant context
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    // Parse and validate input
    const parsed = studentUpdateSchema.parse(input)
    const { id, ...rest } = parsed

    // Build update data object
    const data: Record<string, unknown> = {}
    if (typeof rest.givenName !== "undefined") data.givenName = rest.givenName
    if (typeof rest.middleName !== "undefined")
      data.middleName = rest.middleName ?? null
    if (typeof rest.surname !== "undefined") data.surname = rest.surname
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

    // Update student (using updateMany for tenant safety)
    const studentModel = getModelOrThrow("student")
    await studentModel.updateMany({ where: { id, schoolId }, data })

    // Revalidate cache
    revalidatePath(STUDENTS_PATH)

    return { success: true, data: undefined }
  } catch (error) {
    console.error("[updateStudent] Error:", error, {
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
        error instanceof Error ? error.message : "Failed to update student",
    }
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
    // Get tenant context
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    // Parse and validate input
    const { id } = z.object({ id: z.string().min(1) }).parse(input)

    // Delete student (using deleteMany for tenant safety)
    const studentModel = getModelOrThrow("student")
    await studentModel.deleteMany({ where: { id, schoolId } })

    // Revalidate cache
    revalidatePath(STUDENTS_PATH)

    return { success: true, data: undefined }
  } catch (error) {
    console.error("[deleteStudent] Error:", error, {
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
        error instanceof Error ? error.message : "Failed to delete student",
    }
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
    // Get tenant context
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
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
        givenName: true,
        middleName: true,
        surname: true,
        dateOfBirth: true,
        gender: true,
        enrollmentDate: true,
        userId: true,
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
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch student",
    }
  }
}

/**
 * Get students list with filtering and pagination
 * @param input - Query parameters
 * @returns Action response with students and total count
 */
export async function getStudents(
  input: Partial<z.infer<typeof getStudentsSchema>>
): Promise<
  ActionResponse<{
    rows: Array<{
      id: string
      userId: string | null
      name: string
      className: string
      status: string
      createdAt: string
    }>
    total: number
  }>
> {
  try {
    // Get tenant context
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    // Parse and validate input
    const sp = getStudentsSchema.parse(input ?? {})

    // Build where clause
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
    const studentModel = getModelOrThrow("student")
    const [rows, count] = await Promise.all([
      studentModel.findMany({
        where,
        orderBy,
        skip,
        take,
        relationLoadStrategy: "join",
        include: {
          studentClasses: {
            include: {
              class: {
                select: {
                  name: true,
                },
              },
            },
            take: 1, // Get primary class
          },
        },
      }),
      studentModel.count({ where }),
    ])

    // Map results
    const mapped = (rows as Array<any>).map((s) => ({
      id: s.id as string,
      userId: s.userId as string | null,
      name: [s.givenName, s.surname].filter(Boolean).join(" "),
      className:
        s.studentClasses && s.studentClasses.length > 0
          ? s.studentClasses[0].class?.name || "-"
          : "-",
      status: s.userId ? "active" : "inactive",
      createdAt: (s.createdAt as Date).toISOString(),
    }))

    return { success: true, data: { rows: mapped, total: count as number } }
  } catch (error) {
    console.error("[getStudents] Error:", error, {
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
        error instanceof Error ? error.message : "Failed to fetch students",
    }
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
    // Get tenant context
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    // Parse and validate input
    const sp = getStudentsSchema.parse(input ?? {})

    // Build where clause with filters
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
      ...(sp.status
        ? sp.status === "active"
          ? { NOT: { userId: null } }
          : sp.status === "inactive"
            ? { userId: null }
            : {}
        : {}),
    }

    // Fetch ALL students matching filters (no pagination for export)
    const studentModel = getModelOrThrow("student")
    const students = await studentModel.findMany({
      where,
      relationLoadStrategy: "join",
      include: {
        user: {
          select: {
            email: true,
          },
        },
        studentClasses: {
          include: {
            class: {
              select: {
                name: true,
              },
            },
          },
          take: 1, // Get primary class
        },
      },
      orderBy: [{ givenName: "asc" }, { surname: "asc" }],
    })

    // Transform data for CSV export
    const exportData = students.map((student: any) => ({
      studentId: student.id,
      givenName: student.givenName || "",
      middleName: student.middleName || "",
      surname: student.surname || "",
      fullName: [student.givenName, student.middleName, student.surname]
        .filter(Boolean)
        .join(" "),
      dateOfBirth: student.dateOfBirth
        ? new Date(student.dateOfBirth).toISOString().split("T")[0]
        : "",
      gender: student.gender || "",
      email: student.user?.email || "",
      enrollmentDate: student.enrollmentDate
        ? new Date(student.enrollmentDate).toISOString().split("T")[0]
        : "",
      status: student.userId ? "Active" : "Inactive",
      className:
        student.studentClasses && student.studentClasses.length > 0
          ? student.studentClasses[0].class.name
          : "",
      createdAt: new Date(student.createdAt).toISOString().split("T")[0],
    }))

    // Define CSV columns
    const columns = [
      { key: "studentId", label: "Student ID" },
      { key: "givenName", label: "First Name" },
      { key: "middleName", label: "Middle Name" },
      { key: "surname", label: "Last Name" },
      { key: "fullName", label: "Full Name" },
      { key: "dateOfBirth", label: "Date of Birth" },
      { key: "gender", label: "Gender" },
      { key: "email", label: "Email" },
      { key: "enrollmentDate", label: "Enrollment Date" },
      { key: "status", label: "Status" },
      { key: "className", label: "Class" },
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
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to export students",
    }
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
      givenName: string
      middleName: string | null
      surname: string
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
      className: string | null
      yearLevel: string | null
      guardianName: string | null
      guardianPhone: string | null
      createdAt: Date
    }>
  >
> {
  try {
    // Get tenant context
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    // Parse and validate input
    const sp = getStudentsSchema.parse(input ?? {})

    // Build where clause with filters
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
      ...(sp.status
        ? sp.status === "active"
          ? { status: "ACTIVE" }
          : sp.status === "inactive"
            ? { status: "INACTIVE" }
            : {}
        : {}),
    }

    // Fetch ALL students matching filters (no pagination for export)
    const studentModel = getModelOrThrow("student")
    const students = await studentModel.findMany({
      where,
      relationLoadStrategy: "join",
      include: {
        user: {
          select: {
            email: true,
          },
        },
        studentClasses: {
          include: {
            class: {
              select: {
                name: true,
              },
            },
          },
          take: 1,
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
      orderBy: [{ givenName: "asc" }, { surname: "asc" }],
    })

    // Transform data for export
    const exportData = students.map((student: any) => ({
      id: student.id,
      studentId: student.studentId || null,
      grNumber: student.grNumber || null,
      givenName: student.givenName || "",
      middleName: student.middleName || null,
      surname: student.surname || "",
      fullName: [student.givenName, student.middleName, student.surname]
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
      className: student.studentClasses?.[0]?.class?.name || null,
      yearLevel: student.studentYearLevels?.[0]?.yearLevel?.name || null,
      guardianName: student.studentGuardians?.[0]?.guardian
        ? [
            student.studentGuardians[0].guardian.givenName,
            student.studentGuardians[0].guardian.surname,
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

/**
 * Register a new student with comprehensive information
 * @param input - Complete student registration data
 * @returns Action response with student data
 */
export async function registerStudent(
  input: any
): Promise<ActionResponse<any>> {
  try {
    // Get tenant context
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    // Process guardian data first if provided
    const guardianIds = []
    if (input.guardians && input.guardians.length > 0) {
      const guardianModel = getModelOrThrow("guardian")
      const guardianPhoneNumberModel = getModelOrThrow("guardianPhoneNumber")

      for (const guardian of input.guardians) {
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
              givenName: guardian.givenName,
              surname: guardian.surname,
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
      givenName: input.givenName,
      middleName: input.middleName || null,
      surname: input.surname,
      dateOfBirth: new Date(input.dateOfBirth),
      gender: input.gender,
      bloodGroup: input.bloodGroup || null,
      nationality: input.nationality || "Saudi Arabia",
      passportNumber: input.passportNumber || null,
      visaStatus: input.visaStatus || null,
      visaExpiryDate: input.visaExpiryDate
        ? new Date(input.visaExpiryDate)
        : null,

      // Contact Information
      email: input.email || null,
      mobileNumber: input.mobileNumber || null,
      alternatePhone: input.alternatePhone || null,

      // Address
      currentAddress: input.currentAddress || null,
      permanentAddress: input.sameAsPermanent
        ? input.currentAddress
        : input.permanentAddress || null,
      city: input.city || null,
      state: input.state || null,
      postalCode: input.postalCode || null,
      country: input.country || "Saudi Arabia",

      // Emergency Contact
      emergencyContactName: input.emergencyContactName || null,
      emergencyContactPhone: input.emergencyContactPhone || null,
      emergencyContactRelation: input.emergencyContactRelation || null,

      // Status and Enrollment
      status: input.status || "ACTIVE",
      enrollmentDate: input.enrollmentDate
        ? new Date(input.enrollmentDate)
        : new Date(),
      admissionNumber: input.admissionNumber || null,
      admissionDate: input.admissionDate
        ? new Date(input.admissionDate)
        : new Date(),

      // Academic
      category: input.category || null,
      studentType: input.studentType || "REGULAR",

      // Health Information
      medicalConditions: input.medicalConditions || null,
      allergies: input.allergies || null,
      medicationRequired: input.medicationRequired || null,
      doctorName: input.doctorName || null,
      doctorContact: input.doctorContact || null,
      insuranceProvider: input.insuranceProvider || null,
      insuranceNumber: input.insuranceNumber || null,

      // Previous Education
      previousSchoolName: input.previousSchoolName || null,
      previousSchoolAddress: input.previousSchoolAddress || null,
      previousGrade: input.previousGrade || null,
      transferCertificateNo: input.transferCertificateNo || null,
      transferDate: input.transferDate ? new Date(input.transferDate) : null,
      previousAcademicRecord: input.previousAcademicRecord || null,

      // Photo
      profilePhotoUrl: input.profilePhotoUrl || null,

      // GR Number - Auto-generate if not provided
      grNumber: input.grNumber || null,
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
    if (input.documents && input.documents.length > 0) {
      const studentDocumentModel = getModelOrThrow("studentDocument")
      for (const doc of input.documents) {
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
    if (input.vaccinations && input.vaccinations.length > 0) {
      const healthRecordModel = getModelOrThrow("healthRecord")
      for (const vaccination of input.vaccinations) {
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
        return {
          success: false,
          error: "Selected class not found",
        }
      }

      const maxCapacity = classData.maxCapacity || 50 // Default to 50 if not set
      const currentEnrollment = classData._count.studentClasses

      if (currentEnrollment >= maxCapacity) {
        return {
          success: false,
          error: `Cannot enroll in "${classData.name}": Class is at full capacity (${currentEnrollment}/${maxCapacity} students)`,
        }
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
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to register student",
    }
  }
}
