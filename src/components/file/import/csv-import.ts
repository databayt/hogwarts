"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * CSV Import Service - Domain-specific bulk import
 *
 * This file handles domain-specific student/teacher bulk import with database operations.
 * For generic client-side file import with UI wizard, use the Importer component.
 *
 * @example
 * ```tsx
 * // For UI-based file import with preview and mapping:
 * import { Importer, useImport } from "@/components/file"
 *
 * // For bulk database import:
 * import { importStudents, importTeachers } from "@/components/file"
 * ```
 */
import { hash } from "bcryptjs"
import { parse } from "csv-parse/sync"
import { z, ZodError } from "zod"

import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { detectLanguage } from "@/components/translation/util"

import {
  createRowErrorMessage,
  formatDuplicateError,
  formatZodError,
  validateDateFormat,
  validateGuardianInfo,
  validatePhoneFormat,
} from "./csv-validation"

// Validation schemas for CSV data
const studentCsvSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional(),
  studentId: z.string().min(1, "Student ID is required"),
  yearLevel: z.string().optional(),
  middleName: z.string().optional(),
  section: z.string().optional(),
  enrollmentDate: z.string().optional(),
  status: z.string().optional(),
  guardianName: z.string().optional(),
  guardianEmail: z.string().email().optional(),
  guardianPhone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
})

const teacherCsvSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  employeeId: z.string().min(1, "Employee ID is required"),
  department: z.string().optional(),
  phoneNumber: z.string().optional(),
  subjects: z.string().optional(), // Comma-separated list
  qualification: z.string().optional(),
})

const staffCsvSchema = z.object({
  givenName: z.string().min(1, "Given name is required"),
  surname: z.string().min(1, "Surname is required"),
  emailAddress: z.string().email("Invalid email"),
  employeeId: z.string().optional(),
  position: z.string().optional(),
  department: z.string().optional(),
  phoneNumber: z.string().optional(),
  gender: z.string().optional(),
  employmentType: z
    .enum(["FULL_TIME", "PART_TIME", "CONTRACT", "TEMPORARY"])
    .optional(),
})

const guardianCsvSchema = z.object({
  givenName: z.string().min(1, "Given name is required"),
  surname: z.string().min(1, "Surname is required"),
  emailAddress: z.string().email().optional(),
  phoneNumber: z.string().optional(),
  guardianType: z.string().optional(),
  studentId: z.string().optional(),
})

interface ImportResult {
  success: boolean
  imported: number
  failed: number
  skipped: number
  errors: Array<{
    row: number
    error: string
    data?: any
    details?: string // Enhanced error details with suggestions
  }>
  warnings?: Array<{
    row: number
    warning: string
  }>
  accessCodes?: Array<{
    studentId: string
    code: string
    expiresAt: string
  }>
}

/**
 * Map CSV status values to StudentStatus enum
 */
function mapStudentStatus(
  status?: string
): "ACTIVE" | "INACTIVE" | "SUSPENDED" | "GRADUATED" | "TRANSFERRED" {
  if (!status) return "ACTIVE"
  const normalized = status.toLowerCase().trim()
  const map: Record<
    string,
    "ACTIVE" | "INACTIVE" | "SUSPENDED" | "GRADUATED" | "TRANSFERRED"
  > = {
    active: "ACTIVE",
    inactive: "INACTIVE",
    suspended: "SUSPENDED",
    graduated: "GRADUATED",
    transferred: "TRANSFERRED",
    // Arabic
    نشط: "ACTIVE",
    "غير نشط": "INACTIVE",
    معلق: "SUSPENDED",
    متخرج: "GRADUATED",
    منقول: "TRANSFERRED",
  }
  return map[normalized] || "ACTIVE"
}

/**
 * Parse section string like "Grade 9-C" into grade number and section letter.
 * Also handles: "9-C", "Grade 9 C", "9C", "الصف التاسع-ج"
 */
function parseSectionString(section: string): {
  gradeNumber: number | null
  sectionLetter: string | null
} {
  // Try "Grade N-X" or "Grade N X"
  const gradeMatch = section.match(/grade\s*(\d+)\s*[-\s]?\s*([A-Za-z])?/i)
  if (gradeMatch) {
    return {
      gradeNumber: parseInt(gradeMatch[1], 10),
      sectionLetter: gradeMatch[2]?.toUpperCase() || null,
    }
  }
  // Try "N-X" or "NX"
  const shortMatch = section.match(/^(\d+)\s*[-]?\s*([A-Za-z])$/)
  if (shortMatch) {
    return {
      gradeNumber: parseInt(shortMatch[1], 10),
      sectionLetter: shortMatch[2].toUpperCase(),
    }
  }
  return { gradeNumber: null, sectionLetter: null }
}

class CsvImportService {
  /**
   * Parse CSV content
   */
  private parseCSV(content: string): any[] {
    try {
      return parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
        cast: (value) => {
          // Convert empty strings to undefined
          return value === "" ? undefined : value
        },
      })
    } catch (error) {
      logger.error(
        "CSV parsing failed",
        error instanceof Error ? error : new Error("Unknown error"),
        {
          action: "csv_parse_error",
        }
      )
      throw new Error("Failed to parse CSV file")
    }
  }

  // Bcrypt rounds: 6 for auto-generated temporary passwords (5-10ms vs 50-100ms at 10 rounds)
  private readonly BCRYPT_ROUNDS = 6
  private readonly CHUNK_SIZE = 50

  /**
   * Import students from CSV — chunked parallel hashing + batched DB inserts
   */
  async importStudents(
    csvContent: string,
    schoolId: string
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      imported: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      warnings: [],
    }

    try {
      const rows = this.parseCSV(csvContent)

      // Batch pre-load existing studentIds and emails to avoid N+1 queries
      const [existingStudents, existingUsers] = await Promise.all([
        db.student.findMany({
          where: { schoolId },
          select: { studentId: true },
        }),
        db.user.findMany({
          where: { schoolId },
          select: { email: true },
        }),
      ])
      const existingStudentIds = new Set(
        existingStudents.map((s) => s.studentId).filter(Boolean)
      )
      const existingEmails = new Set(
        existingUsers.map((u) => u.email).filter(Boolean)
      )

      // Phase 1: Validate all rows and collect valid ones
      interface ValidatedStudent {
        rowNumber: number
        validated: z.infer<typeof studentCsvSchema>
        email: string
      }
      const validRows: ValidatedStudent[] = []

      for (let i = 0; i < rows.length; i++) {
        const rowNumber = i + 2
        try {
          const validated = studentCsvSchema.parse(rows[i])

          const validationErrors = []

          if (validated.dateOfBirth) {
            const dateValidation = validateDateFormat(
              validated.dateOfBirth,
              "dateOfBirth"
            )
            if (!dateValidation.isValid)
              validationErrors.push(...dateValidation.errors)
          }

          if (validated.guardianPhone) {
            const phoneValidation = validatePhoneFormat(
              validated.guardianPhone,
              "guardianPhone"
            )
            if (!phoneValidation.isValid)
              validationErrors.push(...phoneValidation.errors)
          }

          const guardianValidation = validateGuardianInfo({
            guardianName: validated.guardianName,
            guardianEmail: validated.guardianEmail,
            guardianPhone: validated.guardianPhone,
          })
          if (!guardianValidation.isValid)
            validationErrors.push(...guardianValidation.errors)

          if (validationErrors.length > 0) {
            result.errors.push({
              row: rowNumber,
              error: "Validation failed",
              details: createRowErrorMessage(rowNumber, validationErrors),
              data: rows[i],
            })
            result.failed++
            continue
          }

          if (existingStudentIds.has(validated.studentId)) {
            result.warnings?.push({
              row: rowNumber,
              warning: `Student ID "${validated.studentId}" already exists — skipped`,
            })
            result.skipped++
            continue
          }

          const studentEmail =
            validated.email || `${validated.studentId}@school.local`
          if (existingEmails.has(studentEmail)) {
            result.warnings?.push({
              row: rowNumber,
              warning: `Email "${studentEmail}" already exists — skipped`,
            })
            result.skipped++
            continue
          }

          // Track in-batch duplicates
          existingStudentIds.add(validated.studentId)
          existingEmails.add(studentEmail)

          validRows.push({ rowNumber, validated, email: studentEmail })
        } catch (error) {
          if (error instanceof ZodError) {
            const formattedError = formatZodError(error)
            result.errors.push({
              row: rowNumber,
              error: "Schema validation failed",
              details: formattedError.formattedMessage,
              data: rows[i],
            })
          } else {
            result.errors.push({
              row: rowNumber,
              error: error instanceof Error ? error.message : "Unknown error",
              data: rows[i],
            })
          }
          result.failed++
        }
      }

      // Detect CSV language from a sample of names
      const sampleNames = validRows.slice(0, 5).map((r) => r.validated.name)
      const detectedLang = detectLanguage(sampleNames.join(" "))

      // Pre-load academic grades and sections for section auto-linking
      const [existingGrades, existingSections] = await Promise.all([
        db.academicGrade.findMany({
          where: { schoolId },
          select: { id: true, name: true, gradeNumber: true },
        }),
        db.section.findMany({
          where: { schoolId },
          select: { id: true, name: true, gradeId: true },
        }),
      ])

      // Build lookup maps: gradeNumber -> gradeId, "gradeId:sectionName" -> sectionId
      const gradeByNumber = new Map<number, string>()
      for (const g of existingGrades) {
        if (g.gradeNumber != null) gradeByNumber.set(g.gradeNumber, g.id)
        const num = parseInt(g.name, 10)
        if (!isNaN(num)) gradeByNumber.set(num, g.id)
      }
      const sectionByKey = new Map<string, string>()
      for (const s of existingSections) {
        sectionByKey.set(`${s.gradeId}:${s.name.toUpperCase()}`, s.id)
      }

      // Track created student IDs for access code generation
      const createdStudentUserIds: string[] = []

      // Phase 2: Process valid rows in chunks with parallel bcrypt + batched DB inserts
      for (let c = 0; c < validRows.length; c += this.CHUNK_SIZE) {
        const chunk = validRows.slice(c, c + this.CHUNK_SIZE)

        // Parallel bcrypt hashing for the chunk
        const hashes = await Promise.all(
          chunk.map((r) =>
            hash(`student${r.validated.studentId}`, this.BCRYPT_ROUNDS)
          )
        )

        // Generate UUIDs client-side for createMany
        const userIds = chunk.map(() => crypto.randomUUID())

        try {
          await db.$transaction(async (tx) => {
            // Batch create users
            await tx.user.createMany({
              data: chunk.map((r, idx) => ({
                id: userIds[idx],
                username: r.validated.name,
                email: r.email,
                password: hashes[idx],
                role: "STUDENT" as const,
                schoolId,
                mustChangePassword: true,
              })),
            })

            // Batch create students
            await tx.student.createMany({
              data: chunk.map((r, idx) => {
                const nameParts = r.validated.name.trim().split(/\s+/)

                // Resolve section + grade from CSV
                let academicGradeId: string | undefined
                let sectionId: string | undefined

                if (r.validated.section) {
                  const parsed = parseSectionString(r.validated.section)
                  if (parsed.gradeNumber != null) {
                    academicGradeId =
                      gradeByNumber.get(parsed.gradeNumber) || undefined
                    if (academicGradeId && parsed.sectionLetter) {
                      sectionId =
                        sectionByKey.get(
                          `${academicGradeId}:${parsed.sectionLetter}`
                        ) || undefined
                    }
                  }
                }

                // Fallback: use yearLevel for grade if section didn't resolve
                if (!academicGradeId && r.validated.yearLevel) {
                  const parsed = parseSectionString(r.validated.yearLevel)
                  if (parsed.gradeNumber != null) {
                    academicGradeId =
                      gradeByNumber.get(parsed.gradeNumber) || undefined
                  }
                }

                return {
                  userId: userIds[idx],
                  schoolId,
                  studentId: r.validated.studentId,
                  givenName: nameParts[0] || "Unknown",
                  middleName: r.validated.middleName || undefined,
                  surname: nameParts.slice(1).join(" ") || "Unknown",
                  dateOfBirth: r.validated.dateOfBirth
                    ? new Date(r.validated.dateOfBirth)
                    : new Date("2010-01-01"),
                  gender: r.validated.gender || "other",
                  status: mapStudentStatus(r.validated.status),
                  enrollmentDate: r.validated.enrollmentDate
                    ? new Date(r.validated.enrollmentDate)
                    : new Date(),
                  academicGradeId: academicGradeId || undefined,
                  sectionId: sectionId || undefined,
                  lang: detectedLang,
                }
              }),
            })
          })

          result.imported += chunk.length
          createdStudentUserIds.push(...userIds)

          // Handle guardians sequentially after the batch (they have complex find-or-create logic)
          for (let idx = 0; idx < chunk.length; idx++) {
            const r = chunk[idx]
            if (r.validated.guardianName && r.validated.guardianEmail) {
              try {
                await this.createGuardianLink(
                  schoolId,
                  userIds[idx],
                  r.validated.guardianName,
                  r.validated.guardianEmail,
                  r.validated.guardianPhone,
                  detectedLang
                )
              } catch {
                // Guardian creation failure shouldn't fail the student import
                result.warnings?.push({
                  row: r.rowNumber,
                  warning: `Student imported but guardian creation failed`,
                })
              }
            }
          }
        } catch (error) {
          // If batch fails, mark all rows in chunk as failed
          for (const r of chunk) {
            result.errors.push({
              row: r.rowNumber,
              error:
                error instanceof Error ? error.message : "Batch insert failed",
              data: r.validated,
            })
            result.failed++
          }
          // Undo the imported count we would have added
        }
      }

      // Phase 3: Generate access codes for newly created students
      if (createdStudentUserIds.length > 0) {
        try {
          // Look up student records by userId to get student IDs
          const createdStudents = await db.student.findMany({
            where: { schoolId, userId: { in: createdStudentUserIds } },
            select: { id: true },
          })

          if (createdStudents.length > 0) {
            const { generateAccessCodesForStudents } =
              await import("@/lib/student-access-code")
            const codes = await generateAccessCodesForStudents(
              schoolId,
              createdStudents.map((s) => s.id)
            )
            result.accessCodes = codes.map((c) => ({
              studentId: c.studentId,
              code: c.code,
              expiresAt: c.expiresAt.toISOString(),
            }))
          }
        } catch (codeError) {
          // Access code generation failure shouldn't fail the import
          logger.error(
            "Access code generation failed during import",
            codeError instanceof Error ? codeError : new Error("Unknown error"),
            { action: "access_code_generation_error", schoolId }
          )
          result.warnings?.push({
            row: 0,
            warning:
              "Students imported successfully but access code generation failed. You can generate codes manually from the student list.",
          })
        }
      }

      logger.info("Student batch import completed", {
        action: "student_import",
        schoolId,
        imported: result.imported,
        failed: result.failed,
        skipped: result.skipped,
      })

      result.success =
        result.imported > 0 || (result.skipped > 0 && result.failed === 0)
      return result
    } catch (error) {
      logger.error(
        "Student import failed",
        error instanceof Error ? error : new Error("Unknown error"),
        { action: "student_import_error", schoolId }
      )
      throw error
    }
  }

  /**
   * Helper: create guardian and link to student (by userId)
   */
  private async createGuardianLink(
    schoolId: string,
    studentUserId: string,
    guardianName: string,
    guardianEmail: string,
    guardianPhone?: string,
    lang: "ar" | "en" = "ar"
  ) {
    // Find the student record by userId
    const student = await db.student.findFirst({
      where: { userId: studentUserId, schoolId },
    })
    if (!student) return

    // Check if guardian already exists
    let guardian = await db.guardian.findFirst({
      where: { schoolId, user: { email: guardianEmail } },
    })

    if (!guardian) {
      const guardianPassword = await hash("parent123", this.BCRYPT_ROUNDS)
      const guardianUser = await db.user.create({
        data: {
          username: guardianName,
          email: guardianEmail,
          password: guardianPassword,
          role: "GUARDIAN",
          schoolId,
          mustChangePassword: true,
        },
      })

      const parts = guardianName.trim().split(/\s+/)
      guardian = await db.guardian.create({
        data: {
          userId: guardianUser.id,
          schoolId,
          givenName: parts[0] || "Unknown",
          surname: parts.slice(1).join(" ") || "Unknown",
          emailAddress: guardianEmail,
          lang,
        },
      })

      if (guardianPhone) {
        await db.guardianPhoneNumber.create({
          data: {
            guardianId: guardian.id,
            schoolId,
            phoneNumber: guardianPhone,
            isPrimary: true,
          },
        })
      }
    }

    // Get or create guardian type
    let guardianType = await db.guardianType.findFirst({
      where: { schoolId, name: "guardian" },
    })
    if (!guardianType) {
      guardianType = await db.guardianType.create({
        data: { schoolId, name: "guardian" },
      })
    }

    await db.studentGuardian.create({
      data: {
        studentId: student.id,
        guardianId: guardian.id,
        schoolId,
        guardianTypeId: guardianType.id,
        isPrimary: true,
      },
    })
  }

  /**
   * Import teachers from CSV — chunked parallel hashing + batched DB inserts
   */
  async importTeachers(
    csvContent: string,
    schoolId: string
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      imported: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      warnings: [],
    }

    try {
      const rows = this.parseCSV(csvContent)

      // Batch pre-load existing employeeIds and emails
      const [existingTeachers, existingUsers] = await Promise.all([
        db.teacher.findMany({
          where: { schoolId },
          select: { employeeId: true },
        }),
        db.user.findMany({
          where: { schoolId },
          select: { email: true },
        }),
      ])
      const existingEmployeeIds = new Set(
        existingTeachers.map((t) => t.employeeId).filter(Boolean)
      )
      const existingEmails = new Set(
        existingUsers.map((u) => u.email).filter(Boolean)
      )

      // Phase 1: Validate all rows
      interface ValidatedTeacher {
        rowNumber: number
        validated: z.infer<typeof teacherCsvSchema>
      }
      const validRows: ValidatedTeacher[] = []

      for (let i = 0; i < rows.length; i++) {
        const rowNumber = i + 2
        try {
          const validated = teacherCsvSchema.parse(rows[i])

          const validationErrors = []
          if (validated.phoneNumber) {
            const phoneValidation = validatePhoneFormat(
              validated.phoneNumber,
              "phoneNumber"
            )
            if (!phoneValidation.isValid)
              validationErrors.push(...phoneValidation.errors)
          }

          if (validationErrors.length > 0) {
            result.errors.push({
              row: rowNumber,
              error: "Validation failed",
              details: createRowErrorMessage(rowNumber, validationErrors),
              data: rows[i],
            })
            result.failed++
            continue
          }

          if (existingEmployeeIds.has(validated.employeeId)) {
            result.warnings?.push({
              row: rowNumber,
              warning: `Employee ID "${validated.employeeId}" already exists — skipped`,
            })
            result.skipped++
            continue
          }

          if (existingEmails.has(validated.email)) {
            result.warnings?.push({
              row: rowNumber,
              warning: `Email "${validated.email}" already exists — skipped`,
            })
            result.skipped++
            continue
          }

          // Track in-batch duplicates
          existingEmployeeIds.add(validated.employeeId)
          existingEmails.add(validated.email)

          validRows.push({ rowNumber, validated })
        } catch (error) {
          if (error instanceof ZodError) {
            const formattedError = formatZodError(error)
            result.errors.push({
              row: rowNumber,
              error: "Schema validation failed",
              details: formattedError.formattedMessage,
              data: rows[i],
            })
          } else {
            result.errors.push({
              row: rowNumber,
              error: error instanceof Error ? error.message : "Unknown error",
              data: rows[i],
            })
          }
          result.failed++
        }
      }

      // Detect CSV language from a sample of names
      const sampleNames = validRows.slice(0, 5).map((r) => r.validated.name)
      const detectedLang = detectLanguage(sampleNames.join(" "))

      // Pre-load departments for linking
      const departments = await db.department.findMany({
        where: { schoolId },
        select: { id: true, departmentName: true },
      })
      const deptMap = new Map(departments.map((d) => [d.departmentName, d.id]))

      // Phase 2: Process in chunks
      for (let c = 0; c < validRows.length; c += this.CHUNK_SIZE) {
        const chunk = validRows.slice(c, c + this.CHUNK_SIZE)

        // Parallel bcrypt hashing
        const hashes = await Promise.all(
          chunk.map((r) =>
            hash(`teacher${r.validated.employeeId}`, this.BCRYPT_ROUNDS)
          )
        )

        const userIds = chunk.map(() => crypto.randomUUID())
        const teacherIds = chunk.map(() => crypto.randomUUID())

        try {
          await db.$transaction(async (tx) => {
            // Batch create users
            await tx.user.createMany({
              data: chunk.map((r, idx) => ({
                id: userIds[idx],
                username: r.validated.name,
                email: r.validated.email,
                password: hashes[idx],
                role: "TEACHER" as const,
                schoolId,
                mustChangePassword: true,
              })),
            })

            // Batch create teachers
            await tx.teacher.createMany({
              data: chunk.map((r, idx) => {
                const parts = r.validated.name.trim().split(/\s+/)
                return {
                  id: teacherIds[idx],
                  userId: userIds[idx],
                  schoolId,
                  employeeId: r.validated.employeeId,
                  givenName: parts[0] || "Unknown",
                  surname: parts.slice(1).join(" ") || "Unknown",
                  emailAddress: r.validated.email,
                  lang: detectedLang,
                }
              }),
            })

            // Batch create phone numbers (only for those that have them)
            const phoneData = chunk
              .map((r, idx) =>
                r.validated.phoneNumber
                  ? {
                      teacherId: teacherIds[idx],
                      schoolId,
                      phoneNumber: r.validated.phoneNumber,
                      isPrimary: true,
                    }
                  : null
              )
              .filter(Boolean) as Array<{
              teacherId: string
              schoolId: string
              phoneNumber: string
              isPrimary: boolean
            }>

            if (phoneData.length > 0) {
              await tx.teacherPhoneNumber.createMany({ data: phoneData })
            }

            // Batch create department links
            const deptData = chunk
              .map((r, idx) => {
                if (!r.validated.department) return null
                const deptId = deptMap.get(r.validated.department)
                if (!deptId) return null
                return {
                  teacherId: teacherIds[idx],
                  departmentId: deptId,
                  schoolId,
                }
              })
              .filter(Boolean) as Array<{
              teacherId: string
              departmentId: string
              schoolId: string
            }>

            if (deptData.length > 0) {
              await tx.teacherDepartment.createMany({ data: deptData })
            }
          })

          result.imported += chunk.length
        } catch (error) {
          for (const r of chunk) {
            result.errors.push({
              row: r.rowNumber,
              error:
                error instanceof Error ? error.message : "Batch insert failed",
              data: r.validated,
            })
            result.failed++
          }
        }
      }

      logger.info("Teacher batch import completed", {
        action: "teacher_import",
        schoolId,
        imported: result.imported,
        failed: result.failed,
        skipped: result.skipped,
      })

      result.success =
        result.imported > 0 || (result.skipped > 0 && result.failed === 0)
      return result
    } catch (error) {
      logger.error(
        "Teacher import failed",
        error instanceof Error ? error : new Error("Unknown error"),
        { action: "teacher_import_error", schoolId }
      )
      throw error
    }
  }

  /**
   * Generate sample CSV template
   */
  generateStudentTemplate(): string {
    const headers = [
      "name",
      "email",
      "studentId",
      "yearLevel",
      "middleName",
      "section",
      "enrollmentDate",
      "status",
      "guardianName",
      "guardianEmail",
      "guardianPhone",
      "dateOfBirth",
      "gender",
    ]
    const sample = [
      headers.join(","),
      "John Doe,john.doe@example.com,STD001,Grade 10,Michael,Grade 10-A,2024-09-01,Active,Jane Doe,jane.doe@example.com,+1234567890,2008-05-15,male",
      "Sarah Smith,,STD002,Grade 9,,Grade 9-C,2024-09-01,Active,Mike Smith,mike.smith@example.com,+0987654321,2009-03-22,female",
    ]
    return sample.join("\n")
  }

  generateTeacherTemplate(): string {
    const headers = [
      "name",
      "email",
      "employeeId",
      "department",
      "phoneNumber",
      "subjects",
      "qualification",
    ]
    const sample = [
      headers.join(","),
      'Dr. Alice Johnson,alice.johnson@school.edu,TCH001,Mathematics,+1234567890,"Algebra,Calculus",PhD in Mathematics',
      "Mr. Bob Wilson,bob.wilson@school.edu,TCH002,Science,+0987654321,Physics,MSc in Physics",
    ]
    return sample.join("\n")
  }

  /**
   * Import staff from CSV
   */
  async importStaff(
    csvContent: string,
    schoolId: string
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      imported: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      warnings: [],
    }

    try {
      const rows = this.parseCSV(csvContent)

      for (let i = 0; i < rows.length; i++) {
        const rowNumber = i + 2
        try {
          const validated = staffCsvSchema.parse(rows[i])

          // Validate phone number
          const validationErrors = []
          if (validated.phoneNumber) {
            const phoneValidation = validatePhoneFormat(
              validated.phoneNumber,
              "phoneNumber"
            )
            if (!phoneValidation.isValid) {
              validationErrors.push(...phoneValidation.errors)
            }
          }

          if (validationErrors.length > 0) {
            result.errors.push({
              row: rowNumber,
              error: "Validation failed",
              details: createRowErrorMessage(rowNumber, validationErrors),
              data: rows[i],
            })
            result.failed++
            continue
          }

          // Check duplicate by email
          const existingUser = await db.user.findFirst({
            where: { email: validated.emailAddress, schoolId },
          })
          if (existingUser) {
            result.warnings?.push({
              row: rowNumber,
              warning: `Email "${validated.emailAddress}" already exists — skipped`,
            })
            result.skipped++
            continue
          }

          // Check duplicate by employeeId if provided
          if (validated.employeeId) {
            const existingStaff = await db.staffMember.findFirst({
              where: { schoolId, employeeId: validated.employeeId },
            })
            if (existingStaff) {
              result.warnings?.push({
                row: rowNumber,
                warning: `Employee ID "${validated.employeeId}" already exists — skipped`,
              })
              result.skipped++
              continue
            }
          }

          // Create user account
          const defaultPassword = await hash(
            `staff${validated.employeeId || validated.emailAddress}`,
            10
          )
          const user = await db.user.create({
            data: {
              username: `${validated.givenName} ${validated.surname}`,
              email: validated.emailAddress,
              password: defaultPassword,
              role: "STAFF",
              schoolId,
              mustChangePassword: true,
            },
          })

          // Find department if provided
          let departmentId: string | undefined
          if (validated.department) {
            const department = await db.department.findFirst({
              where: { schoolId, departmentName: validated.department },
            })
            if (department) {
              departmentId = department.id
            }
          }

          // Create staff member record
          const staffMember = await db.staffMember.create({
            data: {
              userId: user.id,
              schoolId,
              employeeId: validated.employeeId || undefined,
              givenName: validated.givenName,
              surname: validated.surname,
              emailAddress: validated.emailAddress,
              gender: validated.gender || undefined,
              position: validated.position || undefined,
              departmentId,
              employmentType: validated.employmentType || "FULL_TIME",
            },
          })

          // Add phone number if provided
          if (validated.phoneNumber) {
            await db.staffPhoneNumber.create({
              data: {
                staffMemberId: staffMember.id,
                schoolId,
                phoneNumber: validated.phoneNumber,
                isPrimary: true,
              },
            })
          }

          result.imported++

          logger.info("Staff member imported successfully", {
            action: "staff_import",
            schoolId,
            employeeId: validated.employeeId,
            row: rowNumber,
          })
        } catch (error) {
          if (error instanceof ZodError) {
            const formattedError = formatZodError(error)
            result.errors.push({
              row: rowNumber,
              error: "Schema validation failed",
              details: formattedError.formattedMessage,
              data: rows[i],
            })
          } else {
            result.errors.push({
              row: rowNumber,
              error: error instanceof Error ? error.message : "Unknown error",
              details: error instanceof Error ? error.stack : undefined,
              data: rows[i],
            })
          }
          result.failed++
        }
      }

      result.success =
        result.imported > 0 || (result.skipped > 0 && result.failed === 0)
      return result
    } catch (error) {
      logger.error(
        "Staff import failed",
        error instanceof Error ? error : new Error("Unknown error"),
        { action: "staff_import_error", schoolId }
      )
      throw error
    }
  }

  /**
   * Import guardians from CSV
   */
  async importGuardians(
    csvContent: string,
    schoolId: string
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      imported: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      warnings: [],
    }

    try {
      const rows = this.parseCSV(csvContent)

      // Detect CSV language from a sample of names
      const sampleNames = rows
        .slice(0, 5)
        .map((r: any) => `${r.givenName || ""} ${r.surname || ""}`.trim())
        .filter(Boolean)
      const detectedLang = sampleNames.length
        ? detectLanguage(sampleNames.join(" "))
        : ("ar" as const)

      for (let i = 0; i < rows.length; i++) {
        const rowNumber = i + 2
        try {
          const validated = guardianCsvSchema.parse(rows[i])

          // Validate phone number
          const validationErrors = []
          if (validated.phoneNumber) {
            const phoneValidation = validatePhoneFormat(
              validated.phoneNumber,
              "phoneNumber"
            )
            if (!phoneValidation.isValid) {
              validationErrors.push(...phoneValidation.errors)
            }
          }

          if (validationErrors.length > 0) {
            result.errors.push({
              row: rowNumber,
              error: "Validation failed",
              details: createRowErrorMessage(rowNumber, validationErrors),
              data: rows[i],
            })
            result.failed++
            continue
          }

          // Check duplicate by email if provided
          if (validated.emailAddress) {
            const existingGuardian = await db.guardian.findFirst({
              where: { schoolId, emailAddress: validated.emailAddress },
            })
            if (existingGuardian) {
              result.warnings?.push({
                row: rowNumber,
                warning: `Guardian email "${validated.emailAddress}" already exists — skipped`,
              })
              result.skipped++
              continue
            }
          }

          // Create user account
          const defaultPassword = await hash("parent123", 10)
          const email =
            validated.emailAddress || `guardian-${Date.now()}-${i}@school.local`
          const user = await db.user.create({
            data: {
              username: `${validated.givenName} ${validated.surname}`,
              email,
              password: defaultPassword,
              role: "GUARDIAN",
              schoolId,
              mustChangePassword: true,
            },
          })

          // Create guardian record
          const guardian = await db.guardian.create({
            data: {
              userId: user.id,
              schoolId,
              givenName: validated.givenName,
              surname: validated.surname,
              emailAddress: validated.emailAddress || undefined,
              lang: detectedLang,
            },
          })

          // Add phone number if provided
          if (validated.phoneNumber) {
            await db.guardianPhoneNumber.create({
              data: {
                guardianId: guardian.id,
                schoolId,
                phoneNumber: validated.phoneNumber,
                isPrimary: true,
              },
            })
          }

          // Link to student if studentId provided
          if (validated.studentId) {
            const student = await db.student.findFirst({
              where: { schoolId, studentId: validated.studentId },
            })

            if (student) {
              // Get or create guardian type
              const typeName = validated.guardianType || "guardian"
              let guardianType = await db.guardianType.findFirst({
                where: { schoolId, name: typeName },
              })
              if (!guardianType) {
                guardianType = await db.guardianType.create({
                  data: { schoolId, name: typeName },
                })
              }

              await db.studentGuardian.create({
                data: {
                  studentId: student.id,
                  guardianId: guardian.id,
                  schoolId,
                  guardianTypeId: guardianType.id,
                  isPrimary: true,
                },
              })
            } else {
              result.warnings?.push({
                row: rowNumber,
                warning: `Student with ID "${validated.studentId}" not found. Guardian created but not linked.`,
              })
            }
          }

          result.imported++

          logger.info("Guardian imported successfully", {
            action: "guardian_import",
            schoolId,
            email: validated.emailAddress,
            row: rowNumber,
          })
        } catch (error) {
          if (error instanceof ZodError) {
            const formattedError = formatZodError(error)
            result.errors.push({
              row: rowNumber,
              error: "Schema validation failed",
              details: formattedError.formattedMessage,
              data: rows[i],
            })
          } else {
            result.errors.push({
              row: rowNumber,
              error: error instanceof Error ? error.message : "Unknown error",
              details: error instanceof Error ? error.stack : undefined,
              data: rows[i],
            })
          }
          result.failed++
        }
      }

      result.success =
        result.imported > 0 || (result.skipped > 0 && result.failed === 0)
      return result
    } catch (error) {
      logger.error(
        "Guardian import failed",
        error instanceof Error ? error : new Error("Unknown error"),
        { action: "guardian_import_error", schoolId }
      )
      throw error
    }
  }

  generateStaffTemplate(): string {
    const headers = [
      "givenName",
      "surname",
      "emailAddress",
      "employeeId",
      "position",
      "department",
      "phoneNumber",
      "gender",
      "employmentType",
    ]
    const sample = [
      headers.join(","),
      "Ahmed,Hassan,ahmed.hassan@school.edu,STF001,Accountant,Finance,+1234567890,male,FULL_TIME",
      "Fatima,Ali,fatima.ali@school.edu,STF002,Librarian,Library,+0987654321,female,PART_TIME",
    ]
    return sample.join("\n")
  }

  generateGuardianTemplate(): string {
    const headers = [
      "givenName",
      "surname",
      "emailAddress",
      "phoneNumber",
      "guardianType",
      "studentId",
    ]
    const sample = [
      headers.join(","),
      "Mohammed,Ahmed,mohammed@example.com,+1234567890,father,STD001",
      "Sara,Hassan,sara@example.com,+0987654321,mother,STD002",
    ]
    return sample.join("\n")
  }
}

// Singleton instance (not exported — "use server" only allows async function exports)
const csvImportService = new CsvImportService()

// Export convenience functions
export async function importStudents(csvContent: string, schoolId: string) {
  return csvImportService.importStudents(csvContent, schoolId)
}
export async function importTeachers(csvContent: string, schoolId: string) {
  return csvImportService.importTeachers(csvContent, schoolId)
}
export async function importStaff(csvContent: string, schoolId: string) {
  return csvImportService.importStaff(csvContent, schoolId)
}
export async function importGuardians(csvContent: string, schoolId: string) {
  return csvImportService.importGuardians(csvContent, schoolId)
}
export async function generateStudentTemplate() {
  return csvImportService.generateStudentTemplate()
}
export async function generateTeacherTemplate() {
  return csvImportService.generateTeacherTemplate()
}
export async function generateStaffTemplate() {
  return csvImportService.generateStaffTemplate()
}
export async function generateGuardianTemplate() {
  return csvImportService.generateGuardianTemplate()
}
