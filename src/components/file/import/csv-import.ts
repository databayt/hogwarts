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
import type { AdmissionChannel } from "@prisma/client"
import { hash } from "bcryptjs"
import { parse } from "csv-parse/sync"
import { z, ZodError } from "zod"

import { generateTempPassword, makeUniqueUsername } from "@/lib/credentials"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import {
  provisionStudent,
  type ProvisionGuardianInput,
  type ProvisionStudentInput,
} from "@/lib/student-provisioning"
import { detectLang } from "@/components/translation/util"

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
  studentId: z.string().optional(), // Auto-generated if missing
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
  email: z.string().email("Invalid email").optional(), // Auto-generated if missing
  employeeId: z.string().optional(), // Auto-generated if missing
  department: z.string().optional(),
  phoneNumber: z.string().optional(),
  subjects: z.string().optional(), // Comma-separated list
  qualification: z.string().optional(),
})

const staffCsvSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
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
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
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
  // Plaintext temp credentials minted for each created user, returned so the
  // admin can distribute them (passwords are now crypto-random and unguessable,
  // so the only place to learn them is here). Each user must change theirs on
  // first login (mustChangePassword).
  credentials?: Array<{
    row: number
    name: string
    username: string
    email: string | null
    role: string
    password: string
  }>
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
  const gradeMatch = section.match(/grade\s*(-?\d+)\s*[-\s]?\s*([A-Za-z])?/i)
  if (gradeMatch) {
    return {
      gradeNumber: parseInt(gradeMatch[1], 10),
      sectionLetter: gradeMatch[2]?.toUpperCase() || null,
    }
  }
  // Try "N-X" or "NX"
  const shortMatch = section.match(/^(-?\d+)\s*[-]?\s*([A-Za-z])$/)
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
   * Import students from CSV — validates + resolves grade/section per row,
   * then delegates the actual creation to the shared `provisionStudent` core
   * (the same path admission's `confirmEnrollment` uses). Compared to the old
   * hand-rolled createMany block, every bulk-imported student now also gets a
   * StudentYearLevel row, a shadow ADMITTED Application (tagged with the
   * caller's AdmissionChannel), and fee/invoice assignment.
   *
   * Rows are provisioned SEQUENTIALLY, not in parallel/chunked batches:
   * `provisionStudent` mints the per-school student code (YYGGNNNN) by
   * probing the latest existing code in its (year, grade) bucket inside its
   * own transaction — unsafe against two concurrent transactions racing on
   * the same bucket. A chunked/background strategy for very large files is a
   * separate follow-up, not attempted here.
   */
  async importStudents(
    csvContent: string,
    schoolId: string,
    origin: AdmissionChannel
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      imported: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      warnings: [],
      credentials: [],
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
        // Null when the CSV row didn't carry an email — manually-added
        // students log in with username + password only. Populated when the
        // row supplied a real email the student can verify.
        email: string | null
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

          // Only dedupe CSV-provided studentIds here. provisionStudent always
          // mints its own school-scoped login code (YYGGNNNN) — a CSV-supplied
          // studentId is preserved as `admissionNumber` instead (see the
          // per-row mapping below). This dedup guard is kept as a harmless
          // legacy safety net against re-uploading the same file.
          if (validated.studentId) {
            if (existingStudentIds.has(validated.studentId)) {
              result.warnings?.push({
                row: rowNumber,
                warning: `Student ID "${validated.studentId}" already exists — skipped`,
              })
              result.skipped++
              continue
            }
            existingStudentIds.add(validated.studentId)
          }

          // Only dedupe when the row actually carries an email. Null emails
          // (manually-added students) aren't globally unique — multiple
          // students can share "no email" without collision.
          const studentEmail = validated.email ?? null

          if (studentEmail && existingEmails.has(studentEmail)) {
            result.warnings?.push({
              row: rowNumber,
              warning: `Email "${studentEmail}" already exists — skipped`,
            })
            result.skipped++
            continue
          }

          if (studentEmail) existingEmails.add(studentEmail)

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

      // Pre-load academic grades and sections for section auto-linking, plus
      // the school's current academic year (so every row's StudentYearLevel
      // match inside provisionStudent targets the right SchoolYear instead of
      // leaving `academicYear` undefined, which would let Prisma match an
      // arbitrary SchoolYear row).
      const [existingGrades, existingSections, currentSchoolYear] =
        await Promise.all([
          db.academicGrade.findMany({
            where: { schoolId },
            select: { id: true, name: true, gradeNumber: true },
          }),
          db.section.findMany({
            where: { schoolId },
            select: { id: true, name: true, gradeId: true },
          }),
          db.schoolYear.findFirst({
            where: { schoolId },
            orderBy: { startDate: "desc" },
            select: { yearName: true },
          }),
        ])
      const academicYear = currentSchoolYear?.yearName ?? undefined

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

      // Track successfully-provisioned student IDs for access-code generation.
      const provisionedStudentIds: string[] = []
      // Batch-level fee-assignment visibility, re-derived here (rather than
      // reading provisionStudent's per-row warnings) because the "no grade"
      // case never actually reaches provisionStudent's own warnings array —
      // ensureStudentFeeAssignments short-circuits to `skipped: 1` without
      // throwing when academicGradeId is null, so it never populates
      // FEE_AUTO_ASSIGN_FAILED. We already know academicGradeId locally
      // (resolved per row below), so we can surface the same admin-facing
      // summary the old hand-rolled Phase 3/4 gave.
      let gradelessCount = 0
      let feeFailCount = 0

      // Phase 2: Provision each valid row through the shared core, one row at
      // a time (see the method doc comment above for why this can't be
      // parallelized/chunked).
      for (const r of validRows) {
        let academicGradeId: string | undefined
        let sectionId: string | undefined

        if (r.validated.section) {
          const parsed = parseSectionString(r.validated.section)
          if (parsed.gradeNumber != null) {
            academicGradeId = gradeByNumber.get(parsed.gradeNumber) || undefined
            if (academicGradeId && parsed.sectionLetter) {
              sectionId =
                sectionByKey.get(
                  `${academicGradeId}:${parsed.sectionLetter}`
                ) || undefined
            }
          }
        }

        if (!academicGradeId && r.validated.yearLevel) {
          const parsed = parseSectionString(r.validated.yearLevel)
          if (parsed.gradeNumber != null) {
            academicGradeId = gradeByNumber.get(parsed.gradeNumber) || undefined
          }
        }

        // Students whose CSV had no recognizable grade/section can't be
        // matched to a fee structure — tracked for the aggregate warning
        // below (mirrors the old Phase 4 "gradeless" surfacing).
        if (!academicGradeId) gradelessCount++

        const nameParts = r.validated.name.trim().split(/\s+/)
        const firstName = nameParts[0] || "Unknown"
        const lastName = nameParts.slice(1).join(" ") || "Unknown"

        // Guardian — only when the row actually names one. Phase 1's
        // validateGuardianInfo already guarantees at least one contact method
        // (email or phone) is present whenever guardianName is, so this is
        // never a contactless guardian. createLogin:true preserves this
        // import's long-standing behavior of giving imported guardians a
        // portal login (admission/wizard callers of provisionStudent omit it
        // and stay contact-only — see createOrLinkGuardian's doc comment).
        const guardians: ProvisionGuardianInput[] = []
        if (r.validated.guardianName) {
          const guardianParts = r.validated.guardianName.trim().split(/\s+/)
          guardians.push({
            typeName: "guardian",
            firstName: guardianParts[0] || "Unknown",
            lastName: guardianParts.slice(1).join(" ") || "Unknown",
            email: r.validated.guardianEmail ?? null,
            phone: r.validated.guardianPhone ?? null,
            occupation: null,
            isPrimary: true,
            createLogin: true,
          })
        }

        // The shadow Application provisionStudent mints for every direct-admit
        // row casts `gender` straight into Prisma's `Gender` enum (MALE /
        // FEMALE only — see ensureDirectAdmitApplication in system-campaign.ts).
        // The CSV schema additionally allows "other", and Student.gender
        // itself is a free-text column with no enum constraint, so: pass an
        // enum-safe value (or undefined) into provisionStudent, then restore
        // the row's exact original value onto Student.gender immediately
        // after (same transaction, below) — the Application write never sees
        // a non-enum string, and "other"/lowercase fidelity on the Student row
        // is never lost.
        const provisionGender =
          r.validated.gender === "male"
            ? "MALE"
            : r.validated.gender === "female"
              ? "FEMALE"
              : undefined

        const input: ProvisionStudentInput = {
          schoolId,
          firstName,
          middleName: r.validated.middleName ?? null,
          lastName,
          dateOfBirth: r.validated.dateOfBirth
            ? new Date(r.validated.dateOfBirth)
            : null,
          gender: provisionGender,
          email: r.email,
          academicGradeId: academicGradeId ?? null,
          sectionId: sectionId ?? null,
          applyingForClass:
            r.validated.yearLevel || r.validated.section || undefined,
          academicYear,
          admissionNumber: r.validated.studentId ?? undefined,
          guardians,
        }

        try {
          const provisionResult = await db.$transaction(
            async (tx) => {
              const res = await provisionStudent(
                input,
                { notify: false, credentialDelivery: "temp-password", origin },
                tx
              )
              await tx.student.update({
                where: { id: res.studentId },
                data: { gender: r.validated.gender ?? "other" },
              })
              return res
            },
            { timeout: 15000 }
          )

          result.imported++
          provisionedStudentIds.push(provisionResult.studentId)

          if (provisionResult.credentials) {
            result.credentials?.push({
              row: r.rowNumber,
              name: r.validated.name,
              username: provisionResult.credentials.username,
              email: r.email,
              role: "STUDENT",
              password: provisionResult.credentials.password,
            })
          }

          for (const w of provisionResult.warnings) {
            if (w.code === "FEE_AUTO_ASSIGN_FAILED") {
              feeFailCount++
              continue
            }
            result.warnings?.push({
              row: r.rowNumber,
              warning: `Student imported with a warning: ${w.code}`,
            })
          }
        } catch (error) {
          result.errors.push({
            row: r.rowNumber,
            error:
              error instanceof Error ? error.message : "Provisioning failed",
            data: r.validated,
          })
          result.failed++
        }
      }

      // Surface silent gaps so "imported: N" never implies "all billed".
      if (gradelessCount > 0) {
        result.warnings?.push({
          row: 0,
          warning: `${gradelessCount} student(s) imported without a recognized grade — no fees were assigned. Set their grade from the student list to assign fees.`,
        })
      }
      if (feeFailCount > 0) {
        result.warnings?.push({
          row: 0,
          warning: `Fee assignment failed for ${feeFailCount} student(s). You can re-sync fees from the Finance → Fees page.`,
        })
      }

      // Phase 3: Generate access codes for newly-provisioned students
      if (provisionedStudentIds.length > 0) {
        try {
          const { generateAccessCodesForStudents } =
            await import("@/lib/student-access-code")
          const codes = await generateAccessCodesForStudents(
            schoolId,
            provisionedStudentIds
          )
          result.accessCodes = codes.map((c) => ({
            studentId: c.studentId,
            code: c.code,
            expiresAt: c.expiresAt.toISOString(),
          }))
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
      credentials: [],
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

          // Auto-generate employeeId if missing
          if (!validated.employeeId) {
            validated.employeeId = `TCH-${Date.now()}-${i}`
          }

          // Auto-generate email if missing
          if (!validated.email) {
            const slug = validated.name
              .trim()
              .toLowerCase()
              .replace(/\s+/g, ".")
            validated.email = `${slug}.${validated.employeeId}@school.local`
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
      const detectedLang = detectLang(sampleNames.join(" "))

      // Pre-load departments for linking
      const departments = await db.department.findMany({
        where: { schoolId },
        select: { id: true, departmentName: true },
      })
      const deptMap = new Map(departments.map((d) => [d.departmentName, d.id]))

      // Existing usernames in this school — keep generated handles unique
      // (no DB unique on username, so a collision makes login ambiguous).
      const existingUsernameRows = await db.user.findMany({
        where: { schoolId, username: { not: null } },
        select: { username: true },
      })
      const takenUsernames = new Set<string>(
        existingUsernameRows.map((u) => u.username!).filter(Boolean)
      )

      // Phase 2: Process in chunks
      for (let c = 0; c < validRows.length; c += this.CHUNK_SIZE) {
        const chunk = validRows.slice(c, c + this.CHUNK_SIZE)

        // Login-valid, unique usernames (a CSV "name" has spaces / Arabic that
        // the login schema rejects — such teachers previously could not sign in
        // at all) + crypto-random temp passwords (never derived from employeeId).
        const usernames = chunk.map((r) =>
          makeUniqueUsername(
            r.validated.employeeId || r.validated.name,
            takenUsernames,
            "t"
          )
        )
        const plains = chunk.map(() => generateTempPassword())
        const hashes = await Promise.all(
          plains.map((p) => hash(p, this.BCRYPT_ROUNDS))
        )

        const userIds = chunk.map(() => crypto.randomUUID())
        const teacherIds = chunk.map(() => crypto.randomUUID())

        try {
          await db.$transaction(async (tx) => {
            // Batch create users
            await tx.user.createMany({
              data: chunk.map((r, idx) => ({
                id: userIds[idx],
                username: usernames[idx],
                email: r.validated.email,
                // Bulk import: admin vouches for these teachers, so skip the
                // login email-verification gate.
                emailVerified: new Date(),
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

                // Calculate wizardStep based on missing fields
                // Wizard steps: information -> contact -> employment -> qualifications -> experience -> expertise
                const hasContact =
                  r.validated.email &&
                  !r.validated.email.endsWith("@school.local")
                const hasEmployment = !!r.validated.employeeId
                const hasQualification = !!r.validated.qualification
                const wizardStep = !hasContact
                  ? "contact"
                  : !hasEmployment
                    ? "employment"
                    : !hasQualification
                      ? "qualifications"
                      : null

                return {
                  id: teacherIds[idx],
                  userId: userIds[idx],
                  schoolId,
                  employeeId: r.validated.employeeId!,
                  firstName: parts[0] || "Unknown",
                  lastName: parts.slice(1).join(" ") || "Unknown",
                  emailAddress: r.validated.email!,
                  lang: detectedLang,
                  wizardStep,
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

          for (let idx = 0; idx < chunk.length; idx++) {
            const r = chunk[idx]
            result.credentials?.push({
              row: r.rowNumber,
              name: r.validated.name,
              username: usernames[idx],
              email: r.validated.email ?? null,
              role: "TEACHER",
              password: plains[idx],
            })
          }
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
      credentials: [],
    }

    try {
      const rows = this.parseCSV(csvContent)

      // Existing usernames in this school — keep generated handles unique.
      const existingUsernameRows = await db.user.findMany({
        where: { schoolId, username: { not: null } },
        select: { username: true },
      })
      const takenUsernames = new Set<string>(
        existingUsernameRows.map((u) => u.username!).filter(Boolean)
      )

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

          // Create user account — login-valid unique username + crypto-random
          // temp password (the old `staff<employeeId>` value was guessable).
          const staffUsername = makeUniqueUsername(
            validated.employeeId ||
              `${validated.firstName} ${validated.lastName}`,
            takenUsernames,
            "s"
          )
          const staffPassword = generateTempPassword()
          const defaultPassword = await hash(staffPassword, this.BCRYPT_ROUNDS)
          const user = await db.user.create({
            data: {
              username: staffUsername,
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
              firstName: validated.firstName,
              lastName: validated.lastName,
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

          result.credentials?.push({
            row: rowNumber,
            name: `${validated.firstName} ${validated.lastName}`.trim(),
            username: staffUsername,
            email: validated.emailAddress ?? null,
            role: "STAFF",
            password: staffPassword,
          })

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
      credentials: [],
    }

    try {
      const rows = this.parseCSV(csvContent)

      // Detect CSV language from a sample of names
      const sampleNames = rows
        .slice(0, 5)
        .map((r: any) => `${r.firstName || ""} ${r.lastName || ""}`.trim())
        .filter(Boolean)
      const detectedLang = sampleNames.length
        ? detectLang(sampleNames.join(" "))
        : ("ar" as const)

      // Existing usernames in this school — keep generated handles unique.
      const existingUsernameRows = await db.user.findMany({
        where: { schoolId, username: { not: null } },
        select: { username: true },
      })
      const takenUsernames = new Set<string>(
        existingUsernameRows.map((u) => u.username!).filter(Boolean)
      )

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

          // Create user account. Guardians without an email log in with
          // username + password — don't fabricate a `@school.local` address
          // that nobody can verify. Login-valid unique username + crypto-random
          // temp password (the shared static "parent123" let anyone log into
          // every imported guardian account).
          const guardianUsername = makeUniqueUsername(
            `${validated.firstName} ${validated.lastName}`,
            takenUsernames,
            "g"
          )
          const guardianPassword = generateTempPassword()
          const defaultPassword = await hash(
            guardianPassword,
            this.BCRYPT_ROUNDS
          )
          const user = await db.user.create({
            data: {
              username: guardianUsername,
              email: validated.emailAddress ?? null,
              emailVerified: new Date(),
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
              firstName: validated.firstName,
              lastName: validated.lastName,
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

          result.credentials?.push({
            row: rowNumber,
            name: `${validated.firstName} ${validated.lastName}`.trim(),
            username: guardianUsername,
            email: validated.emailAddress ?? null,
            role: "GUARDIAN",
            password: guardianPassword,
          })

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
      "firstName",
      "lastName",
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
      "firstName",
      "lastName",
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
export async function importStudents(
  csvContent: string,
  schoolId: string,
  origin: AdmissionChannel
): Promise<ImportResult> {
  return csvImportService.importStudents(csvContent, schoolId, origin)
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
