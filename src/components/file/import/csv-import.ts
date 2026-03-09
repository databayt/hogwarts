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

  /**
   * Import students from CSV
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

      for (let i = 0; i < rows.length; i++) {
        const rowNumber = i + 2 // Account for header row
        try {
          // Validate with Zod schema
          const validated = studentCsvSchema.parse(rows[i])

          // Additional field-level validations
          const validationErrors = []

          // Validate date of birth format
          if (validated.dateOfBirth) {
            const dateValidation = validateDateFormat(
              validated.dateOfBirth,
              "dateOfBirth"
            )
            if (!dateValidation.isValid) {
              validationErrors.push(...dateValidation.errors)
            }
          }

          // Validate guardian phone format
          if (validated.guardianPhone) {
            const phoneValidation = validatePhoneFormat(
              validated.guardianPhone,
              "guardianPhone"
            )
            if (!phoneValidation.isValid) {
              validationErrors.push(...phoneValidation.errors)
            }
          }

          // Validate guardian information completeness
          const guardianValidation = validateGuardianInfo({
            guardianName: validated.guardianName,
            guardianEmail: validated.guardianEmail,
            guardianPhone: validated.guardianPhone,
          })
          if (!guardianValidation.isValid) {
            validationErrors.push(...guardianValidation.errors)
          }

          // If there are validation errors, add them to result
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

          // Check if student already exists (using pre-loaded set)
          if (existingStudentIds.has(validated.studentId)) {
            result.warnings?.push({
              row: rowNumber,
              warning: `Student ID "${validated.studentId}" already exists — skipped`,
            })
            result.skipped++
            continue
          }

          // Check if email already exists (using pre-loaded set)
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

          // Create user account for student
          const defaultPassword = await hash(
            `student${validated.studentId}`,
            10
          )
          const user = await db.user.create({
            data: {
              username: validated.name,
              email: validated.email || `${validated.studentId}@school.local`,
              password: defaultPassword,
              role: "STUDENT",
              schoolId,
            },
          })

          // Parse name into first and last name
          const nameParts = validated.name.trim().split(/\s+/)
          const givenName = nameParts[0] || "Unknown"
          const surname = nameParts.slice(1).join(" ") || "Unknown"

          // Create student record
          const student = await db.student.create({
            data: {
              userId: user.id,
              schoolId,
              studentId: validated.studentId,
              givenName,
              surname,
              dateOfBirth: validated.dateOfBirth
                ? new Date(validated.dateOfBirth)
                : new Date("2010-01-01"), // Default date
              gender: validated.gender || "other",
            },
          })

          // Create guardian if provided
          if (validated.guardianName && validated.guardianEmail) {
            // Check if guardian already exists
            let guardian = await db.guardian.findFirst({
              where: {
                schoolId,
                user: {
                  email: validated.guardianEmail,
                },
              },
            })

            if (!guardian) {
              // Create guardian user
              const guardianPassword = await hash("parent123", 10)
              const guardianUser = await db.user.create({
                data: {
                  username: validated.guardianName,
                  email: validated.guardianEmail,
                  password: guardianPassword,
                  role: "GUARDIAN",
                  schoolId,
                },
              })

              // Parse guardian name into first and last name
              const guardianNameParts = validated.guardianName
                .trim()
                .split(/\s+/)
              const guardianGivenName = guardianNameParts[0] || "Unknown"
              const guardianSurname =
                guardianNameParts.slice(1).join(" ") || "Unknown"

              // Create guardian record
              guardian = await db.guardian.create({
                data: {
                  userId: guardianUser.id,
                  schoolId,
                  givenName: guardianGivenName,
                  surname: guardianSurname,
                  emailAddress: validated.guardianEmail,
                },
              })

              // Add phone number if provided
              if (validated.guardianPhone) {
                await db.guardianPhoneNumber.create({
                  data: {
                    guardianId: guardian.id,
                    schoolId,
                    phoneNumber: validated.guardianPhone,
                    isPrimary: true,
                  },
                })
              }
            }

            // Get or create a default guardian type
            let guardianType = await db.guardianType.findFirst({
              where: {
                schoolId,
                name: "guardian",
              },
            })

            if (!guardianType) {
              guardianType = await db.guardianType.create({
                data: {
                  schoolId,
                  name: "guardian",
                },
              })
            }

            // Link guardian to student
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

          result.imported++

          logger.info("Student imported successfully", {
            action: "student_import",
            schoolId,
            studentId: validated.studentId,
            row: rowNumber,
          })
        } catch (error) {
          // Enhanced error handling with Zod errors
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
        "Student import failed",
        error instanceof Error ? error : new Error("Unknown error"),
        {
          action: "student_import_error",
          schoolId,
        }
      )
      throw error
    }
  }

  /**
   * Import teachers from CSV
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

      // Batch pre-load existing employeeIds and emails to avoid N+1 queries
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

      for (let i = 0; i < rows.length; i++) {
        const rowNumber = i + 2
        try {
          // Validate with Zod schema
          const validated = teacherCsvSchema.parse(rows[i])

          // Additional field-level validations
          const validationErrors = []

          // Validate phone number format
          if (validated.phoneNumber) {
            const phoneValidation = validatePhoneFormat(
              validated.phoneNumber,
              "phoneNumber"
            )
            if (!phoneValidation.isValid) {
              validationErrors.push(...phoneValidation.errors)
            }
          }

          // If there are validation errors, add them to result
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

          // Check if teacher already exists (using pre-loaded set)
          if (existingEmployeeIds.has(validated.employeeId)) {
            result.warnings?.push({
              row: rowNumber,
              warning: `Employee ID "${validated.employeeId}" already exists — skipped`,
            })
            result.skipped++
            continue
          }

          // Check if email already exists (using pre-loaded set)
          if (existingEmails.has(validated.email)) {
            result.warnings?.push({
              row: rowNumber,
              warning: `Email "${validated.email}" already exists — skipped`,
            })
            result.skipped++
            continue
          }

          // Create user account for teacher
          const defaultPassword = await hash(
            `teacher${validated.employeeId}`,
            10
          )
          const user = await db.user.create({
            data: {
              username: validated.name,
              email: validated.email,
              password: defaultPassword,
              role: "TEACHER",
              schoolId,
            },
          })

          // Parse name into first and last name
          const teacherNameParts = validated.name.trim().split(/\s+/)
          const teacherGivenName = teacherNameParts[0] || "Unknown"
          const teacherSurname =
            teacherNameParts.slice(1).join(" ") || "Unknown"

          // Create teacher record
          const teacher = await db.teacher.create({
            data: {
              userId: user.id,
              schoolId,
              employeeId: validated.employeeId,
              givenName: teacherGivenName,
              surname: teacherSurname,
              emailAddress: validated.email,
            },
          })

          // Add phone number if provided
          if (validated.phoneNumber) {
            await db.teacherPhoneNumber.create({
              data: {
                teacherId: teacher.id,
                schoolId,
                phoneNumber: validated.phoneNumber,
                isPrimary: true,
              },
            })
          }

          // Link to department if provided
          if (validated.department) {
            const department = await db.department.findFirst({
              where: {
                schoolId,
                departmentName: validated.department,
              },
            })

            if (department) {
              await db.teacherDepartment.create({
                data: {
                  teacherId: teacher.id,
                  departmentId: department.id,
                  schoolId,
                },
              })
            }
          }

          result.imported++

          logger.info("Teacher imported successfully", {
            action: "teacher_import",
            schoolId,
            employeeId: validated.employeeId,
            row: rowNumber,
          })
        } catch (error) {
          // Enhanced error handling with Zod errors
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
        "Teacher import failed",
        error instanceof Error ? error : new Error("Unknown error"),
        {
          action: "teacher_import_error",
          schoolId,
        }
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
      "guardianName",
      "guardianEmail",
      "guardianPhone",
      "dateOfBirth",
      "gender",
    ]
    const sample = [
      headers.join(","),
      "John Doe,john.doe@example.com,STD001,Grade 10,Jane Doe,jane.doe@example.com,+1234567890,2008-05-15,male",
      "Sarah Smith,,STD002,Grade 9,Mike Smith,mike.smith@example.com,+0987654321,2009-03-22,female",
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
