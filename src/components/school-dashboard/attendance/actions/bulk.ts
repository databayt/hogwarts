"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import type { Prisma } from "@prisma/client"
import { z } from "zod"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  canMarkAttendance,
  canViewSchoolAnalytics,
  isStaffRole,
} from "@/components/school-dashboard/attendance/authorization"

import { attendanceFilterSchema, bulkUploadSchema } from "../shared/validation"
import { getTeacherClassIds } from "./helpers"

/**
 * Encode a single CSV cell: wrap in quotes, double internal quotes, and guard
 * against spreadsheet formula injection by prefixing risky leading characters.
 */
function csvCell(value: unknown): string {
  const s = value == null ? "" : String(value)
  const guarded = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s
  return `"${guarded.replace(/"/g, '""')}"`
}

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
  if (!canMarkAttendance(session.user.role as any)) {
    return {
      successful: 0,
      failed: 0,
      errors: [
        { studentId: "", row: 0, error: "Unauthorized: insufficient role" },
      ],
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

  // Phase 1b: Prefetch existing rows so the txn issues O(N+1) queries
  // instead of O(2N). Same family of N+1 fixes as markAttendance /
  // quickMarkAllPresent that landed in March; bulk upload slipped through.
  // Safe to batch because (schoolId, studentId, classId, date, periodId)
  // is unique — see prisma/models/attendance.prisma:94.
  const uploadDate = new Date(parsed.date)
  // SOFT-DELETE INVARIANT: this existing-record lookup must NOT filter
  // deletedAt — a soft-deleted row still occupies the unique key, and
  // filtering it out sends the record down the create path where the
  // constraint violation rolls back the WHOLE upload batch. The update
  // path below revives instead (deletedAt: null).
  const existingRows = await db.attendance.findMany({
    where: {
      schoolId,
      classId: parsed.classId,
      date: uploadDate,
      periodId: null,
      studentId: { in: studentIds },
    },
    select: { id: true, studentId: true },
  })
  const existingByStudent = new Map(
    existingRows.map((row) => [row.studentId, row.id])
  )

  // Phase 2: Execute all operations in a single transaction
  try {
    await db.$transaction(async (tx) => {
      const toCreate: Prisma.AttendanceCreateManyInput[] = []

      for (const record of parsed.records) {
        const existingId = existingByStudent.get(record.studentId)

        if (existingId) {
          await tx.attendance.update({
            where: { id: existingId },
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
              // Revive a soft-deleted row on re-upload (see lookup above).
              deletedAt: null,
            },
          })
        } else {
          toCreate.push({
            schoolId,
            studentId: record.studentId,
            classId: parsed.classId,
            date: uploadDate,
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
          })
        }
      }

      if (toCreate.length > 0) {
        await tx.attendance.createMany({ data: toCreate })
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

  const session = await auth()
  if (
    !session?.user?.role ||
    !canViewSchoolAnalytics(session.user.role as any)
  ) {
    return { success: false, error: "Unauthorized" }
  }

  const parsed = attendanceFilterSchema.parse(input)

  const where: Prisma.AttendanceWhereInput = {
    schoolId,
    deletedAt: null,
  }

  // Teacher scoping — a teacher may only see their own classes.
  let teacherClassIds: string[] | null = null
  if (session.user.role === "TEACHER") {
    teacherClassIds = await getTeacherClassIds(schoolId, session.user.id!)
  }

  // Apply optional filters. SECURITY: an explicit classId must be INTERSECTED
  // with the teacher's owned classes — previously it OVERWROTE the restriction,
  // letting a teacher read any class's attendance in the school.
  if (parsed.classId) {
    where.classId =
      teacherClassIds && !teacherClassIds.includes(parsed.classId)
        ? "__forbidden__"
        : parsed.classId
  } else if (teacherClassIds) {
    where.classId = { in: teacherClassIds }
  }
  if (parsed.sectionId) where.sectionId = parsed.sectionId
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
        student: { select: { firstName: true, lastName: true } },
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
      studentName: `${r.student.firstName} ${r.student.lastName}`,
      classId: r.classId,
      className: r.class?.name ?? "",
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

  const session = await auth()
  if (
    !session?.user?.role ||
    !canViewSchoolAnalytics(session.user.role as any)
  ) {
    throw new Error("Unauthorized")
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

  // Teacher scoping for CSV export — intersect, never overwrite (see report).
  let teacherClassIds: string[] | null = null
  if (session.user.role === "TEACHER") {
    teacherClassIds = await getTeacherClassIds(schoolId, session.user.id!)
  }

  if (sp.classId) {
    where.classId =
      teacherClassIds && !teacherClassIds.includes(sp.classId)
        ? "__forbidden__"
        : sp.classId
  } else if (teacherClassIds) {
    where.classId = { in: teacherClassIds }
  }
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
      student: { select: { firstName: true, lastName: true } },
      class: { select: { name: true } },
    },
  })

  // CSV Header
  const header =
    "date,studentId,studentName,classId,className,status,method,checkInTime,checkOutTime,notes\n"

  // CSV Body — every cell is quoted, internal quotes are doubled, and any value
  // beginning with =, +, -, @, tab or CR is prefixed with ' to neutralize
  // spreadsheet formula injection (a student named "=cmd()" must not execute).
  const body = rows
    .map((r) =>
      [
        r.date.toISOString().split("T")[0],
        r.studentId,
        `${r.student.firstName} ${r.student.lastName}`,
        r.classId,
        r.class?.name ?? "",
        String(r.status),
        String(r.method),
        r.checkInTime?.toISOString() || "",
        r.checkOutTime?.toISOString() || "",
        r.notes || "",
      ]
        .map(csvCell)
        .join(",")
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

  const session = await auth()
  if (!session?.user?.role || !isStaffRole(session.user.role as any)) {
    return { uploads: [] }
  }

  // Get most recent bulk uploads (group by date and classId)
  const recentUploads = await db.attendance.groupBy({
    by: ["date", "classId"],
    where: {
      schoolId,
      method: "BULK_UPLOAD",
      deletedAt: null,
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
  const classIds = [...new Set(recentUploads.map((u) => u.classId))].filter(
    (id): id is string => id !== null
  )
  const classes = await db.class.findMany({
    where: { id: { in: classIds }, schoolId },
    select: { id: true, name: true },
  })
  const classMap = new Map(classes.map((c) => [c.id, c.name]))

  // PERF: one grouped query for success counts across all returned upload
  // buckets (was a COUNT query per bucket inside Promise.all = N+1).
  const successGroups = await db.attendance.groupBy({
    by: ["date", "classId"],
    where: {
      schoolId,
      method: "BULK_UPLOAD",
      status: { in: ["PRESENT", "LATE"] },
      date: { in: recentUploads.map((u) => u.date) },
      classId: { in: classIds },
      deletedAt: null,
    },
    _count: { _all: true },
  })
  const successByKey = new Map(
    successGroups.map((g) => [
      `${g.date.toISOString()}|${g.classId}`,
      g._count._all,
    ])
  )

  // Count successful records (present or late, not absent/excused/sick)
  const uploads = recentUploads.map((upload) => {
    const successCount =
      successByKey.get(`${upload.date.toISOString()}|${upload.classId}`) ?? 0
    return {
      date: upload.date,
      classId: upload.classId ?? "",
      className:
        (upload.classId ? classMap.get(upload.classId) : null) ||
        "Unknown Class",
      total: upload._count._all,
      successful: successCount,
      failed: upload._count._all - successCount,
    }
  })

  return { uploads }
}
