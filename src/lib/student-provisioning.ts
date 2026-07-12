// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Transaction-scoped core for turning an admitted applicant (or any other
 * direct-admit source) into a real Student + User + guardians + fee
 * assignments + documents. Extracted from
 * `school-dashboard/admission/actions.ts confirmEnrollment` so every
 * student-creation path (admission portal today; the admin single-student
 * wizard and CSV import next) shares one implementation instead of
 * re-inlining the same ~500-line sequence.
 *
 * `tx` is MANDATORY — this function never opens its own transaction and never
 * falls back to the ungated `db` singleton. Callers own the transaction
 * boundary (and, for admission, the surrounding Application status update +
 * registration-fee ledger entry that must commit atomically alongside this).
 *
 * Deliberately NOT done here: notifications and password-reset-token minting.
 * Both should only fire once the enrollment is durably committed, so callers
 * dispatch them post-commit themselves, outside this function's transaction.
 */

import type { AdmissionChannel, Prisma } from "@prisma/client"

import { mintTempPassword } from "@/lib/credentials"
import { enrollStudentInGradeClasses } from "@/lib/enrollment-sync"
import { ensureStudentFeeAssignments } from "@/lib/fee-auto-assign"
import { extractGradeNumber } from "@/lib/grade-utils"
import { createOrLinkGuardian } from "@/lib/guardian-utils"
import { generateStudentUsername } from "@/lib/student-username"
import { ensureDirectAdmitApplication } from "@/lib/system-campaign"
import { detectLang } from "@/components/translation/util"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProvisionGuardianInput {
  typeName: string
  firstName: string
  lastName: string
  email?: string | null
  phone?: string | null
  occupation?: string | null
  isPrimary?: boolean
  /** Reserved — minting a guardian login is not implemented in this pass. */
  createLogin?: boolean
}

export interface ProvisionStudentDocumentInput {
  type?: string | null
  name?: string | null
  // Optional (not required) — the document loop below skips any entry
  // without a url, mirroring confirmEnrollment's original tolerant cast of
  // Application.documents (arbitrary JSON with no schema guarantee).
  url?: string | null
  uploadedAt?: string | Date | null
}

export interface ProvisionStudentInput {
  schoolId: string

  // Demographics
  firstName: string
  middleName?: string | null
  lastName: string
  dateOfBirth?: Date | null
  gender?: string | null
  nationality?: string | null
  category?: string | null
  photoUrl?: string | null

  // Contact
  email: string
  phone?: string | null
  alternatePhone?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  postalCode?: string | null
  country?: string | null

  // Academic
  academicGradeId?: string | null
  applyingForClass?: string | null
  academicYear?: string | null
  sectionId?: string | null
  previousSchool?: string | null
  previousGrade?: string | null
  // Beyond the original field enumeration — needed to preserve
  // confirmEnrollment's `previousAcademicRecord` text exactly.
  previousMarks?: string | null
  previousPercentage?: string | null
  achievements?: string | null

  guardians?: ProvisionGuardianInput[]
  documents?: ProvisionStudentDocumentInput[]

  applicationId?: string | null
  existingStudentId?: string | null
  admissionNumber?: string | null
  lang?: string | null

  /**
   * Existing User to link (mirrors `Application.userId`). Addition beyond the
   * original field list: without it, discovering "does this applicant already
   * have an account" would require an extra `tx.application.findUnique` read
   * inside provisionStudent that the caller — which already has the
   * Application row in hand — can skip entirely.
   */
  userId?: string | null

  /**
   * Precomputed emergency-contact fields. Addition beyond the original field
   * list: confirmEnrollment's priority order for these
   * (`guardianName || fatherName`, etc.) does not match the isPrimary
   * priority baked into `guardians[]` (father is primary), so they cannot be
   * safely re-derived inside provisionStudent for that caller — it computes
   * and passes the resolved strings. Other callers may omit these and let
   * provisionStudent derive a best-effort fallback from `guardians[]`.
   */
  emergencyContactName?: string | null
  emergencyContactPhone?: string | null
  emergencyContactRelation?: string | null
}

export interface ProvisionStudentOptions {
  /** Informational only in this pass — provisionStudent never dispatches
   *  notifications itself (not safe to fire mid-transaction); the caller
   *  decides what to send once the transaction has committed. */
  notify: boolean
  credentialDelivery: "reset-link" | "temp-password" | "none"
  origin: AdmissionChannel
  /** Defaults to true. Set false to skip fee auto-assignment + invoicing
   *  entirely (e.g. a bulk import that fans out invoices separately). */
  createInvoices?: boolean
}

export interface ProvisionWarning {
  code: string
  meta?: Record<string, unknown>
}

export interface ProvisionStudentResult {
  studentId: string
  userId: string
  applicationId: string
  isNewUser: boolean
  credentials?: { username: string; password: string }
  warnings: ProvisionWarning[]
}

// ---------------------------------------------------------------------------
// Core
// ---------------------------------------------------------------------------

export async function provisionStudent(
  input: ProvisionStudentInput,
  opts: ProvisionStudentOptions,
  tx: Prisma.TransactionClient
): Promise<ProvisionStudentResult> {
  const { schoolId } = input
  const warnings: ProvisionWarning[] = []

  // ---------------------------------------------------------------------
  // 1. Resolve AcademicGrade — explicit id wins; else cascade from
  //    applyingForClass (mirrors confirmEnrollment's original cascade,
  //    used only to scope the generated student code).
  // ---------------------------------------------------------------------
  let resolvedAcademicGradeId: string | null = input.academicGradeId ?? null
  if (!resolvedAcademicGradeId) {
    const applyingGradeNumber = extractGradeNumber(input.applyingForClass ?? "")
    if (applyingGradeNumber) {
      const resolvedAcademicGrade = await tx.academicGrade.findFirst({
        where: { schoolId, gradeNumber: applyingGradeNumber },
        select: { id: true },
      })
      resolvedAcademicGradeId = resolvedAcademicGrade?.id ?? null
    }
  }

  // ---------------------------------------------------------------------
  // 2. Per-school student code (YYGGNNNN), generated inside the tx so
  //    concurrent provisioning calls see each other's increments.
  // ---------------------------------------------------------------------
  const studentCode = await generateStudentUsername({
    schoolId,
    academicGradeId: resolvedAcademicGradeId,
    tx,
  })

  // ---------------------------------------------------------------------
  // 3. Resolve/create User — BEFORE fees (invoice fan-out is a no-op
  //    without a userId).
  // ---------------------------------------------------------------------
  let userId: string | null = input.userId ?? null
  let isNewUser = false
  if (!userId) {
    // MUST be schoolId-scoped: User is @@unique([email, schoolId]) and the
    // same email may exist as separate rows in other schools.
    const existingUser = await tx.user.findFirst({
      where: { email: input.email, schoolId },
      select: { id: true },
    })

    if (existingUser) {
      userId = existingUser.id
      // Stamp the code onto the existing user's username if they don't
      // already have one (e.g. an applicant who self-registered).
      await tx.user.updateMany({
        where: { id: existingUser.id, username: null },
        data: { username: studentCode },
      })
    } else {
      const guestUser = await tx.user.create({
        data: {
          email: input.email,
          username: studentCode,
          role: "STUDENT",
          schoolId,
          emailVerified: new Date(),
        },
      })
      userId = guestUser.id
      isNewUser = true
    }

    // Link back to the caller's existing Application immediately — the
    // mint-new-Application path (step 4) links at creation time instead.
    if (input.applicationId) {
      await tx.application.update({
        where: { id: input.applicationId, schoolId },
        data: { userId },
      })
    }
  }

  // ---------------------------------------------------------------------
  // 4. Resolve applicationId — reuse the caller's existing Application (no
  //    write here; the caller owns its lifecycle) or mint a hidden shadow
  //    Application for non-PORTAL channels.
  // ---------------------------------------------------------------------
  const applicationId: string =
    input.applicationId ??
    (await ensureDirectAdmitApplication(tx, input, opts.origin, studentCode))

  // ---------------------------------------------------------------------
  // 5. Find-or-create Student.
  // ---------------------------------------------------------------------
  const existingStudent = input.existingStudentId
    ? await tx.student.findUnique({
        where: { id: input.existingStudentId },
        select: { id: true, schoolId: true },
      })
    : await tx.student.findUnique({
        where: { userId },
        select: { id: true, schoolId: true },
      })

  if (existingStudent && existingStudent.schoolId !== schoolId) {
    throw new Error("Student is already enrolled in another school")
  }

  const previousAcademicParts: string[] = []
  if (input.previousMarks)
    previousAcademicParts.push(`Marks: ${input.previousMarks}`)
  if (input.previousPercentage)
    previousAcademicParts.push(`Percentage: ${input.previousPercentage}%`)
  if (input.achievements)
    previousAcademicParts.push(`Achievements: ${input.achievements}`)

  const primaryGuardian =
    input.guardians?.find((g) => g.isPrimary) ?? input.guardians?.[0]
  const emergencyContactName =
    input.emergencyContactName ??
    (primaryGuardian
      ? `${primaryGuardian.firstName} ${primaryGuardian.lastName}`.trim()
      : undefined)
  const emergencyContactPhone =
    input.emergencyContactPhone ?? primaryGuardian?.phone ?? undefined
  const emergencyContactRelation =
    input.emergencyContactRelation ?? primaryGuardian?.typeName ?? "Parent"

  const student = existingStudent
    ? existingStudent
    : await tx.student.create({
        data: {
          schoolId,
          userId,
          studentId: studentCode,
          firstName: input.firstName,
          middleName: input.middleName ?? undefined,
          lastName: input.lastName,
          dateOfBirth: input.dateOfBirth ?? new Date("2000-01-01"),
          gender: input.gender ?? "MALE",
          nationality: input.nationality ?? undefined,
          email: input.email,
          mobileNumber: input.phone ?? undefined,
          alternatePhone: input.alternatePhone ?? undefined,
          currentAddress: input.address ?? undefined,
          city: input.city ?? undefined,
          state: input.state ?? undefined,
          postalCode: input.postalCode ?? undefined,
          country: input.country ?? undefined,
          applicationId,
          admissionNumber: input.admissionNumber ?? undefined,
          admissionDate: new Date(),
          enrollmentDate: new Date(),
          status: "ACTIVE",
          category: input.category ?? undefined,
          profilePhotoUrl: input.photoUrl ?? undefined,
          previousSchoolName: input.previousSchool ?? undefined,
          previousGrade: input.previousGrade ?? undefined,
          previousAcademicRecord:
            previousAcademicParts.length > 0
              ? previousAcademicParts.join("; ")
              : undefined,
          emergencyContactName,
          emergencyContactPhone,
          emergencyContactRelation,
          lang:
            input.lang ??
            detectLang(
              [input.firstName, input.lastName].filter(Boolean).join(" ")
            ),
          // Every field above is already resolved from the source
          // (application or equivalent) — wizard is complete.
          wizardStep: null,
        },
      })

  // ---------------------------------------------------------------------
  // 6. YearLevel match -> StudentYearLevel + Student.academicGradeId.
  //    Independent cascade from step 1 (both re-derive the grade number
  //    from applyingForClass) — kept unmerged to preserve confirmEnrollment's
  //    exact original behavior rather than "fixing" the redundancy.
  // ---------------------------------------------------------------------
  try {
    let yearLevel = await tx.yearLevel.findFirst({
      where: { schoolId, levelName: input.applyingForClass ?? undefined },
    })

    if (!yearLevel) {
      yearLevel = await tx.yearLevel.findFirst({
        where: {
          schoolId,
          levelName: {
            equals: input.applyingForClass ?? undefined,
            mode: "insensitive",
          },
        },
      })
    }

    if (!yearLevel) {
      const gradeNum = extractGradeNumber(input.applyingForClass ?? "")
      if (gradeNum) {
        // Match via AcademicGrade.gradeNumber (not levelOrder, which
        // includes KG levels and shifts the numbering).
        const academicGradeForLevel = await tx.academicGrade.findFirst({
          where: { schoolId, gradeNumber: gradeNum },
          select: { yearLevelId: true },
        })
        if (academicGradeForLevel?.yearLevelId) {
          yearLevel = await tx.yearLevel.findFirst({
            where: { id: academicGradeForLevel.yearLevelId, schoolId },
          })
        }
        // Fallback to levelOrder if no AcademicGrade match.
        if (!yearLevel) {
          yearLevel = await tx.yearLevel.findFirst({
            where: { schoolId, levelOrder: gradeNum },
          })
        }
      }
    }

    if (yearLevel) {
      // Unconditional — mirrors confirmEnrollment exactly (a falsy
      // academicYear here means Prisma treats yearName as unfiltered).
      const schoolYear = await tx.schoolYear.findFirst({
        where: { schoolId, yearName: input.academicYear ?? undefined },
      })

      if (schoolYear) {
        // Upsert to be idempotent (unique on [schoolId, studentId, yearId]).
        await tx.studentYearLevel.upsert({
          where: {
            schoolId_studentId_yearId: {
              schoolId,
              studentId: student.id,
              yearId: schoolYear.id,
            },
          },
          create: {
            schoolId,
            studentId: student.id,
            levelId: yearLevel.id,
            yearId: schoolYear.id,
          },
          update: { levelId: yearLevel.id },
        })
      } else {
        console.warn(
          `[provisionStudent] No SchoolYear found for academicYear="${input.academicYear}" in school=${schoolId}`
        )
      }

      // Set academicGradeId from the matched YearLevel.
      const academicGrade = await tx.academicGrade.findFirst({
        where: { schoolId, yearLevelId: yearLevel.id },
      })
      if (academicGrade) {
        await tx.student.update({
          where: { id: student.id },
          data: { academicGradeId: academicGrade.id },
        })
      }
    } else {
      console.warn(
        `[provisionStudent] No YearLevel found matching applyingForClass="${input.applyingForClass}" in school=${schoolId}. Available levels should be checked in Year Level settings.`
      )
    }
  } catch (ylError) {
    // Don't break provisioning if year level matching fails.
    console.warn(
      "[provisionStudent] Failed to create StudentYearLevel:",
      ylError
    )
  }

  // ---------------------------------------------------------------------
  // 7. Promote role USER -> STUDENT (never downgrade a higher role).
  // ---------------------------------------------------------------------
  try {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { role: true, schoolId: true },
    })

    if (user && user.role === "USER") {
      await tx.user.update({
        where: { id: userId },
        data: { role: "STUDENT", schoolId },
      })
    }
  } catch (roleError) {
    console.warn("[provisionStudent] Failed to update user role:", roleError)
  }

  // ---------------------------------------------------------------------
  // 8. Auto-assign fees + generate invoices via the canonical helper — the
  //    single source of truth for student -> FeeStructure matching shared
  //    by every student-creation path. `notify: false` defers the fee_due
  //    notification to the caller's post-commit dispatch.
  // ---------------------------------------------------------------------
  if (opts.createInvoices ?? true) {
    try {
      // Re-fetch rather than reuse step 1's resolvedAcademicGradeId — the
      // YearLevel-matching cascade above may just have set a DIFFERENT
      // academicGradeId on the student; the fee helper must see the
      // CURRENT value. Mirrors confirmEnrollment's original re-fetch.
      const studentGrade = await tx.student.findUnique({
        where: { id: student.id },
        select: { academicGradeId: true },
      })
      await ensureStudentFeeAssignments(
        {
          schoolId,
          studentId: student.id,
          academicGradeId: studentGrade?.academicGradeId ?? null,
          academicYear: input.academicYear ?? undefined,
          notify: false,
        },
        tx
      )
    } catch (feeError) {
      console.warn("[provisionStudent] Fee auto-assignment failed:", feeError)
      warnings.push({ code: "FEE_AUTO_ASSIGN_FAILED" })
    }
  }

  // ---------------------------------------------------------------------
  // 9. Guardians — sequential (not Promise.all) to match the original
  //    ordering and avoid concurrent upserts racing on the same GuardianType.
  // ---------------------------------------------------------------------
  try {
    for (const guardian of input.guardians ?? []) {
      await createOrLinkGuardian(tx, {
        schoolId,
        studentId: student.id,
        typeName: guardian.typeName,
        firstName: guardian.firstName,
        lastName: guardian.lastName,
        email: guardian.email ?? null,
        phone: guardian.phone ?? null,
        occupation: guardian.occupation ?? null,
        isPrimary: guardian.isPrimary ?? false,
      })
    }
  } catch (guardianError) {
    console.warn("[provisionStudent] Guardian creation failed:", guardianError)
    warnings.push({ code: "GUARDIAN_CREATE_FAILED" })
  }

  // ---------------------------------------------------------------------
  // 10. Section placement — only when the caller supplies one.
  //     confirmEnrollment never does (placement is a separate, later action);
  //     this exists for the wizard/CSV-import callers who assign a section
  //     at creation time.
  // ---------------------------------------------------------------------
  if (input.sectionId) {
    try {
      await tx.student.update({
        where: { id: student.id },
        data: { sectionId: input.sectionId },
      })
      const section = await tx.section.findFirst({
        where: { id: input.sectionId, schoolId },
        select: { gradeId: true },
      })
      if (section?.gradeId) {
        await enrollStudentInGradeClasses(
          schoolId,
          student.id,
          section.gradeId,
          tx
        )
      }
    } catch (sectionError) {
      console.warn("[provisionStudent] Section placement failed:", sectionError)
    }
  }

  // ---------------------------------------------------------------------
  // 11. Documents — idempotent on fileUrl so a retried provisioning call
  //     never duplicates a StudentDocument row.
  // ---------------------------------------------------------------------
  try {
    for (const doc of input.documents ?? []) {
      if (!doc.url) continue
      const existingDoc = await tx.studentDocument.findFirst({
        where: { schoolId, studentId: student.id, fileUrl: doc.url },
        select: { id: true },
      })
      if (existingDoc) continue
      await tx.studentDocument.create({
        data: {
          schoolId,
          studentId: student.id,
          documentType: doc.type || "Other",
          documentName: doc.name || doc.type || "Document",
          fileUrl: doc.url,
          uploadedAt: doc.uploadedAt ? new Date(doc.uploadedAt) : new Date(),
        },
      })
    }
  } catch (docError) {
    console.warn("[provisionStudent] Document copy failed:", docError)
  }

  // ---------------------------------------------------------------------
  // 12. Temp-password credential delivery — opt-in. confirmEnrollment uses
  //     'reset-link' instead, minted post-commit by the caller (not tx-safe
  //     here: the email must only send once the transaction has committed).
  // ---------------------------------------------------------------------
  let credentials: { username: string; password: string } | undefined
  if (opts.credentialDelivery === "temp-password" && isNewUser && userId) {
    const { plain, hashed } = await mintTempPassword()
    await tx.user.update({
      where: { id: userId },
      data: { password: hashed },
    })
    credentials = { username: studentCode, password: plain }
  }

  return {
    studentId: student.id,
    userId,
    applicationId,
    isNewUser,
    credentials,
    warnings,
  }
}
