"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import type { Prisma } from "@prisma/client"
import { z } from "zod"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { attendanceFilterSchema, bulkUploadSchema } from "../shared/validation"

/**
 * Bulk upload attendance records with atomic transaction
 *
 * Process:
 * 1. Pre-validate all records (student exists, class exists)
 * 2. Return early if validation fails (no DB operations)
 * 3. Execute all creates/updates in single transaction
 * 4. Rollback entire operation on any error
 *
 * @param input - Bulk upload payload with classId, date, records
 * @returns Success count, failure count, and detailed errors
 */
export async function bulkUploadAttendance(
  input: z.infer<typeof bulkUploadSchema>
): Promise<{
  successful: number
  failed: number
  errors: Array<{ studentId: string; row: number; error: string }>
  rolledBack: boolean
}> {
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return {
      successful: 0,
      failed: 0,
      errors: [{ studentId: "", row: 0, error: "Missing school context" }],
      rolledBack: false,
    }
  }

  const session = await auth()
  if (!session?.user?.id) {
    return {
      successful: 0,
      failed: 0,
      errors: [{ studentId: "", row: 0, error: "Not authenticated" }],
      rolledBack: false,
    }
  }

  const parsed = bulkUploadSchema.parse(input)

  // Phase 1: Pre-validate all records BEFORE any DB operations
  const validationErrors: Array<{
    studentId: string
    row: number
    error: string
  }> = []

  // Get all student IDs to validate they exist in this school
  const studentIds = parsed.records.map((r) => r.studentId)
  const existingStudents = await db.student.findMany({
    where: { schoolId, id: { in: studentIds } },
    select: { id: true },
  })
  const validStudentIds = new Set(existingStudents.map((s) => s.id))

  // Validate each record
  for (let i = 0; i < parsed.records.length; i++) {
    const record = parsed.records[i]
    const rowNum = i + 1

    if (!validStudentIds.has(record.studentId)) {
      validationErrors.push({
        studentId: record.studentId,
        row: rowNum,
        error: `Student not found in this school: ${record.studentId}`,
      })
    }
  }

  // If any validation errors, abort entire operation
  if (validationErrors.length > 0) {
    return {
      successful: 0,
      failed: validationErrors.length,
      errors: validationErrors,
      rolledBack: true,
    }
  }

  // Validate class exists in this school
  const classExists = await db.class.findFirst({
    where: { id: parsed.classId, schoolId },
  })
  if (!classExists) {
    return {
      successful: 0,
      failed: parsed.records.length,
      errors: [
        {
          studentId: "",
          row: 0,
          error: `Class not found in this school: ${parsed.classId}`,
        },
      ],
      rolledBack: true,
    }
  }

  // Phase 2: Execute all operations in a single transaction
  try {
    await db.$transaction(async (tx) => {
      for (const record of parsed.records) {
        // Check if attendance record already exists for this date
        const existing = await tx.attendance.findFirst({
          where: {
            schoolId,
            studentId: record.studentId,
            classId: parsed.classId,
            date: new Date(parsed.date),
            periodId: null,
            deletedAt: null,
          },
        })

        if (existing) {
          // Update existing record
          await tx.attendance.update({
            where: { id: existing.id },
            data: {
              status: record.status,
              checkInTime: record.checkInTime
                ? new Date(record.checkInTime)
                : null,
              checkOutTime: record.checkOutTime
                ? new Date(record.checkOutTime)
                : null,
              notes: record.notes,
              markedBy: session.user.id,
              markedAt: new Date(),
            },
          })
        } else {
          // Create new record
          await tx.attendance.create({
            data: {
              schoolId,
              studentId: record.studentId,
              classId: parsed.classId,
              date: new Date(parsed.date),
              status: record.status,
              method: parsed.method,
              markedBy: session.user.id,
              markedAt: new Date(),
              checkInTime: record.checkInTime
                ? new Date(record.checkInTime)
                : null,
              checkOutTime: record.checkOutTime
                ? new Date(record.checkOutTime)
                : null,
              notes: record.notes,
            },
          })
        }
      }
    })

    revalidatePath("/attendance")
    return {
      successful: parsed.records.length,
      failed: 0,
      errors: [],
      rolledBack: false,
    }
  } catch (error) {
    return {
      successful: 0,
      failed: parsed.records.length,
      errors: [
        {
          studentId: "",
          row: 0,
          error: `Transaction failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ],
      rolledBack: true,
    }
  }
}

/**
 * Get attendance report data with filtering and pagination
 *
 * @param input - Filter options (class, student, status, date range, etc.)
 * @returns Paginated attendance records with metadata
 */
export async function getAttendanceReport(
  input: z.infer<typeof attendanceFilterSchema>
) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return { success: false, error: "Missing school context" }
  }

  const parsed = attendanceFilterSchema.parse(input)

  const where: Prisma.AttendanceWhereInput = {
    schoolId,
    deletedAt: null,
  }

  // Apply optional filters
  if (parsed.classId) where.classId = parsed.classId
  if (parsed.studentId) where.studentId = parsed.studentId

  // Status filter (handle both single and array)
  if (parsed.status) {
    where.status = Array.isArray(parsed.status)
      ? { in: parsed.status }
      : parsed.status
  }

  // Method filter (handle both single and array)
  if (parsed.method) {
    where.method = Array.isArray(parsed.method)
      ? { in: parsed.method }
      : parsed.method
  }

  // Date range filter
  if (parsed.dateFrom || parsed.dateTo) {
    where.date = {}
    if (parsed.dateFrom) where.date.gte = new Date(parsed.dateFrom)
    if (parsed.dateTo) where.date.lte = new Date(parsed.dateTo)
  }

  // Get paginated records and total count in parallel
  const [records, total] = await Promise.all([
    db.attendance.findMany({
      where,
      include: {
        student: { select: { givenName: true, surname: true } },
        class: { select: { name: true } },
      },
      orderBy: { date: "desc" },
      take: parsed.limit,
      skip: parsed.offset,
    }),
    db.attendance.count({ where }),
  ])

  const pageSize = parsed.limit
  const currentPage = Math.floor(parsed.offset / pageSize) + 1
  const totalPages = Math.ceil(total / pageSize)

  return {
    success: true,
    records: records.map((r) => ({
      id: r.id,
      date: r.date.toISOString().split("T")[0],
      studentId: r.studentId,
      studentName: `${r.student.givenName} ${r.student.surname}`,
      classId: r.classId,
      className: r.class.name,
      status: r.status,
      method: r.method,
      checkInTime: r.checkInTime?.toISOString(),
      checkOutTime: r.checkOutTime?.toISOString(),
      notes: r.notes,
    })),
    pagination: {
      total,
      page: currentPage,
      pageSize,
      totalPages,
    },
  }
}

/**
 * Export attendance data as CSV
 *
 * CSV Format: date,studentId,studentName,classId,className,status,method,checkInTime,checkOutTime,notes
 *
 * @param input - Filter options
 * @returns CSV string with header and data rows
 */
export async function getAttendanceReportCsv(input: {
  classId?: string
  studentId?: string
  status?: string
  from?: string
  to?: string
  limit?: number
}): Promise<string> {
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    throw new Error("Missing school context")
  }

  const schema = z.object({
    classId: z.string().optional(),
    studentId: z.string().optional(),
    status: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    limit: z.number().int().positive().max(5000).default(1000).optional(),
  })
  const sp = schema.parse(input ?? {})

  const where: Prisma.AttendanceWhereInput = {
    schoolId,
    deletedAt: null,
  }

  if (sp.classId) where.classId = sp.classId
  if (sp.studentId) where.studentId = sp.studentId
  if (sp.status)
    where.status = sp.status.toUpperCase() as
      | "PRESENT"
      | "ABSENT"
      | "LATE"
      | "EXCUSED"
      | "SICK"
      | "HOLIDAY"
  if (sp.from || sp.to) {
    where.date = {}
    if (sp.from) where.date.gte = new Date(sp.from)
    if (sp.to) where.date.lte = new Date(sp.to)
  }

  const rows = await db.attendance.findMany({
    where,
    orderBy: { date: "desc" },
    take: sp.limit ?? 1000,
    include: {
      student: { select: { givenName: true, surname: true } },
      class: { select: { name: true } },
    },
  })

  // CSV Header
  const header =
    "date,studentId,studentName,classId,className,status,method,checkInTime,checkOutTime,notes\n"

  // CSV Body
  const body = rows
    .map((r) =>
      [
        r.date.toISOString().split("T")[0],
        r.studentId,
        `"${r.student.givenName} ${r.student.surname}"`,
        r.classId,
        `"${r.class.name}"`,
        String(r.status),
        String(r.method),
        r.checkInTime?.toISOString() || "",
        r.checkOutTime?.toISOString() || "",
        `"${r.notes || ""}"`,
      ].join(",")
    )
    .join("\n")

  return header + body
}

/**
 * Get recent bulk uploads grouped by class and date
 *
 * Useful for showing upload history and summary stats
 *
 * @param limit - Number of recent uploads to return
 * @returns Array of bulk upload summaries with success/failed counts
 */
export async function getRecentBulkUploads(limit = 5): Promise<{
  uploads: Array<{
    date: Date
    classId: string
    className: string
    total: number
    successful: number
    failed: number
  }>
}> {
  const { schoolId } = await getTenantContext()
  if (!schoolId) return { uploads: [] }

  // Get most recent bulk uploads (group by date and classId)
  const recentUploads = await db.attendance.groupBy({
    by: ["date", "classId"],
    where: {
      schoolId,
      method: "BULK_UPLOAD",
    },
    _count: {
      _all: true,
    },
    orderBy: { date: "desc" },
    take: limit,
  })

  if (recentUploads.length === 0) {
    return { uploads: [] }
  }

  // Get class names for all uploaded classes
  const classIds = [...new Set(recentUploads.map((u) => u.classId))]
  const classes = await db.class.findMany({
    where: { id: { in: classIds }, schoolId },
    select: { id: true, name: true },
  })
  const classMap = new Map(classes.map((c) => [c.id, c.name]))

  // Count successful records (present or late, not absent/excused/sick)
  const uploads = await Promise.all(
    recentUploads.map(async (upload) => {
      const successCount = await db.attendance.count({
        where: {
          schoolId,
          date: upload.date,
          classId: upload.classId,
          method: "BULK_UPLOAD",
          status: { in: ["PRESENT", "LATE"] },
        },
      })

      return {
        date: upload.date,
        classId: upload.classId,
        className: classMap.get(upload.classId) || "Unknown Class",
        total: upload._count._all,
        successful: successCount,
        failed: upload._count._all - successCount,
      }
    })
  )

  return { uploads }
}
