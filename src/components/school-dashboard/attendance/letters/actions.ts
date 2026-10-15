// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Compliance Letters Server Actions
 *
 * Server actions for generating and sending compliance letters.
 */
"use server"

import { auth } from "@/auth"
import type { UserRole } from "@prisma/client"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"
import { formatDate } from "@/lib/i18n-format"
import { displayName } from "@/lib/name-utils"
import { refreshPage } from "@/lib/refresh-page"
import { schoolNameDisplay } from "@/lib/school-name-format"

import { isStaffRole } from "../authorization"
import { computeStudentRisk, riskWindowStart } from "../early-warning/queries"
import { tierBand } from "../early-warning/risk"
import {
  letterTemplates,
  type DeliveryMethod,
  type GenerateLetterInput,
  type LetterType,
} from "./validation"

interface ActionResult {
  success: boolean
  error?: string
  data?: unknown
}

/**
 * Generate a compliance letter for a student
 */
export async function generateLetter(
  input: GenerateLetterInput
): Promise<ActionResult> {
  const session = await auth()
  const schoolId = session?.user?.schoolId
  const userId = session?.user?.id
  const role = session?.user?.role as UserRole | undefined

  if (!schoolId || !userId) {
    return actionError(ACTION_ERRORS.UNAUTHORIZED)
  }

  if (!role || !isStaffRole(role)) {
    return actionError(ACTION_ERRORS.UNAUTHORIZED)
  }

  try {
    const {
      studentId,
      letterType,
      deliveryMethod,
      customMessage,
      scheduledSendDate,
    } = input

    // Get student and related data
    const student = await db.student.findFirst({
      where: { id: studentId, schoolId },
      include: {
        studentGuardians: {
          where: { isPrimary: true },
          include: {
            guardian: true,
          },
        },
        section: { select: { name: true } },
      },
    })

    if (!student) {
      return actionError(ACTION_ERRORS.STUDENT_NOT_FOUND)
    }

    // Get school info
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: {
        name: true,
        email: true,
        phoneNumber: true,
        address: true,
      },
    })

    if (!school) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    // Attendance stats over the shared risk window (same numbers the
    // at-risk list shows)
    const [risk] = await computeStudentRisk(schoolId, {
      studentIds: [studentId],
    })
    const totalDays = risk?.recordedDays ?? 0
    const absentDays = risk ? risk.recordedDays - risk.attendedDays : 0
    const absenceRate = risk ? 100 - risk.rate : 0

    // Get template
    const template = letterTemplates[letterType]
    if (!template) {
      return actionError(ACTION_ERRORS.ATTENDANCE_MARK_FAILED)
    }

    // Build data for template
    const guardian = student.studentGuardians[0]?.guardian
    // The letter's "class" line names the student's section
    const className = student.section?.name || "N/A"

    const templateData: Record<string, string> = {
      studentName: displayName(student, "full"),
      studentId: student.grNumber || student.id,
      guardianName: guardian
        ? displayName(guardian, "full")
        : "Parent/Guardian",
      className,
      absenceRate: absenceRate.toFixed(1),
      absentDays: absentDays.toString(),
      totalDays: totalDays.toString(),
      unexcusedAbsences: absentDays.toString(), // Simplified
      schoolName: school.name,
      schoolEmail: school.email || "",
      schoolPhone: school.phoneNumber || "",
      schoolAddress: school.address || "",
      currentDate: formatDate(new Date(), "ar"),
      principalName: "School Principal", // Could be fetched from settings
      meetingDate: formatDate(
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        "ar"
      ),
      meetingTime: "10:00 AM",
      contractPeriod: "30 days",
      attendancePeriod: formatDate(new Date(), "ar", {
        month: "long",
        year: "numeric",
      }),
      previousRate: (absenceRate + 5).toFixed(1), // Placeholder
      improvementPercent: "5",
    }

    // Generate letter content by replacing placeholders
    const generateContent = (text: string): string => {
      let result = text
      for (const [key, value] of Object.entries(templateData)) {
        result = result.replace(new RegExp(`{{${key}}}`, "g"), value)
      }
      if (customMessage) {
        result += `\n\nAdditional Note:\n${customMessage}`
      }
      return result
    }

    const letterContent = {
      subject: {
        en: generateContent(template.subject.en),
        ar: generateContent(template.subject.ar),
      },
      body: {
        en: generateContent(template.body.en),
        ar: generateContent(template.body.ar),
      },
      callToAction: template.callToAction,
    }

    // Create letter record in database
    // Note: This would require a LetterRecord model in Prisma
    // For now, we'll create an intervention record
    const intervention = await db.attendanceIntervention.create({
      data: {
        schoolId,
        studentId,
        type: "OTHER",
        title: `Letter: ${letterType}`,
        description: JSON.stringify({
          letterType,
          deliveryMethod,
          content: letterContent,
          templateData,
          scheduledSendDate,
          status: scheduledSendDate ? "SCHEDULED" : "GENERATED",
        }),
        status: scheduledSendDate ? "SCHEDULED" : "COMPLETED",
        scheduledDate: scheduledSendDate,
        completedDate: scheduledSendDate ? undefined : new Date(),
        initiatedBy: userId,
        parentNotified: deliveryMethod === "EMAIL",
        tags: ["LETTER", letterType, template.tier],
      },
    })

    // If email delivery, queue for sending
    if (deliveryMethod === "EMAIL" && !scheduledSendDate) {
      // In a real implementation, this would queue an email
      // For now, we'll just mark as sent
      console.log("Would send email to:", guardian?.emailAddress)
    }

    refreshPage("/attendance/letters")

    return {
      success: true,
      data: {
        id: intervention.id,
        letterType,
        content: letterContent,
        deliveryMethod,
        status: scheduledSendDate ? "SCHEDULED" : "GENERATED",
        recipientEmail: guardian?.emailAddress,
      },
    }
  } catch (error) {
    console.error("Error generating letter:", error)
    return actionError(ACTION_ERRORS.ATTENDANCE_MARK_FAILED)
  }
}

/**
 * Get letter history for a student
 */
export async function getStudentLetterHistory(
  studentId: string
): Promise<ActionResult> {
  const session = await auth()
  const schoolId = session?.user?.schoolId
  const role = session?.user?.role as UserRole | undefined

  // Compliance-letter data is staff-only (was readable by any authenticated
  // tenant user, exposing any student's letter history / at-risk lists).
  if (!schoolId || !role || !isStaffRole(role)) {
    return actionError(ACTION_ERRORS.UNAUTHORIZED)
  }

  try {
    const letters = await db.attendanceIntervention.findMany({
      where: {
        schoolId,
        studentId,
        tags: { has: "LETTER" },
      },
      orderBy: { createdAt: "desc" },
    })

    return {
      success: true,
      data: letters.map((letter) => {
        let letterData = null
        try {
          letterData = JSON.parse(letter.description)
        } catch {
          // Ignore parse errors
        }

        return {
          id: letter.id,
          letterType: letter.tags.find(
            (t) => t !== "LETTER" && !t.startsWith("TIER_")
          ),
          tier: letter.tags.find((t) => t.startsWith("TIER_")),
          status: letterData?.status || letter.status,
          deliveryMethod: letterData?.deliveryMethod,
          createdAt: letter.createdAt,
          sentAt: letter.completedDate,
        }
      }),
    }
  } catch (error) {
    console.error("Error getting letter history:", error)
    return actionError(ACTION_ERRORS.ATTENDANCE_MARK_FAILED)
  }
}

/**
 * Students who need a given letter, from the shared risk computation
 * (early-warning/queries.ts) so letters agree with the at-risk list and the
 * support tiers:
 *   Tier 3 letters (final notice, truancy, contract) → critical (< 80%)
 *   Tier 2 notices                                   → high (80–90%)
 *   Improvement recognition                          → at risk and improving
 *   Perfect attendance                               → no missed day
 * Students with too few recorded days, or who already got this letter in
 * the risk window, are left out.
 */
export async function getStudentsNeedingLetters(
  letterType: LetterType
): Promise<ActionResult> {
  const session = await auth()
  const schoolId = session?.user?.schoolId
  const role = session?.user?.role as UserRole | undefined

  // Compliance-letter data is staff-only (was readable by any authenticated
  // tenant user, exposing any student's letter history / at-risk lists).
  if (!schoolId || !role || !isStaffRole(role)) {
    return actionError(ACTION_ERRORS.UNAUTHORIZED)
  }

  try {
    const template = letterTemplates[letterType]
    if (!template) {
      return actionError(ACTION_ERRORS.ATTENDANCE_MARK_FAILED)
    }

    const rows = (await computeStudentRisk(schoolId)).filter((r) => {
      if (r.insufficient) return false
      if (letterType === "PERFECT_ATTENDANCE")
        return r.absentDays === 0 && r.excusedDays === 0
      if (letterType === "ATTENDANCE_IMPROVEMENT")
        return r.band !== "ok" && r.trend === "improving"
      return r.band === tierBand(template.tier)
    })

    const sent = await db.attendanceIntervention.findMany({
      where: {
        schoolId,
        studentId: { in: rows.map((r) => r.studentId) },
        tags: { has: letterType },
        createdAt: { gte: riskWindowStart() },
      },
      select: { studentId: true },
    })
    const alreadySent = new Set(sent.map((x) => x.studentId))
    const eligible = rows
      .filter((r) => !alreadySent.has(r.studentId))
      .sort((a, b) => a.rate - b.rate)

    const students = await db.student.findMany({
      where: { schoolId, id: { in: eligible.map((r) => r.studentId) } },
      select: {
        id: true,
        firstName: true,
        middleName: true,
        lastName: true,
        grNumber: true,
        section: { select: { name: true } },
        studentGuardians: {
          where: { isPrimary: true },
          select: { guardian: { select: { emailAddress: true } } },
        },
      },
    })
    const byId = new Map(students.map((s) => [s.id, s]))
    const nameDisplay = await schoolNameDisplay(schoolId)

    return {
      success: true,
      data: eligible.flatMap((r) => {
        const s = byId.get(r.studentId)
        if (!s) return []
        const email = s.studentGuardians[0]?.guardian?.emailAddress
        return [
          {
            id: s.id,
            name: displayName(s, nameDisplay),
            grNumber: s.grNumber,
            sectionName: s.section?.name ?? null,
            rate: r.rate,
            absenceRate: Math.round((100 - r.rate) * 10) / 10,
            absentDays: r.recordedDays - r.attendedDays,
            totalDays: r.recordedDays,
            guardianEmail: email,
            hasGuardianEmail: !!email,
          },
        ]
      }),
    }
  } catch (error) {
    console.error("Error getting students needing letters:", error)
    return actionError(ACTION_ERRORS.ATTENDANCE_MARK_FAILED)
  }
}

/**
 * Bulk generate letters for multiple students
 */
export async function bulkGenerateLetters(
  studentIds: string[],
  letterType: LetterType,
  deliveryMethod: DeliveryMethod
): Promise<ActionResult> {
  const session = await auth()
  const schoolId = session?.user?.schoolId
  const role = session?.user?.role as UserRole | undefined

  if (!schoolId) {
    return actionError(ACTION_ERRORS.UNAUTHORIZED)
  }

  if (!role || !isStaffRole(role)) {
    return actionError(ACTION_ERRORS.UNAUTHORIZED)
  }

  const results: { studentId: string; success: boolean; error?: string }[] = []

  for (const studentId of studentIds) {
    const result = await generateLetter({
      studentId,
      letterType,
      deliveryMethod,
    })

    results.push({
      studentId,
      success: result.success,
      error: result.error,
    })
  }

  const successCount = results.filter((r) => r.success).length
  const failCount = results.filter((r) => !r.success).length

  refreshPage("/attendance/letters")

  return {
    success: failCount === 0,
    data: {
      total: studentIds.length,
      succeeded: successCount,
      failed: failCount,
      results,
    },
  }
}

/**
 * Get letter preview (without saving)
 */
export async function previewLetter(
  studentId: string,
  letterType: LetterType,
  locale: "en" | "ar" = "en"
): Promise<ActionResult> {
  const session = await auth()
  const schoolId = session?.user?.schoolId
  const role = session?.user?.role as UserRole | undefined

  if (!schoolId) {
    return actionError(ACTION_ERRORS.UNAUTHORIZED)
  }

  if (!role || !isStaffRole(role)) {
    return actionError(ACTION_ERRORS.UNAUTHORIZED)
  }

  try {
    // Get student data
    const student = await db.student.findFirst({
      where: { id: studentId, schoolId },
      include: {
        studentGuardians: {
          where: { isPrimary: true },
          include: { guardian: true },
        },
        section: { select: { name: true } },
      },
    })

    if (!student) {
      return actionError(ACTION_ERRORS.STUDENT_NOT_FOUND)
    }

    // Get school
    const school = await db.school.findUnique({
      where: { id: schoolId },
    })

    if (!school) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    const template = letterTemplates[letterType]
    if (!template) {
      return actionError(ACTION_ERRORS.ATTENDANCE_MARK_FAILED)
    }

    // Same window + rules as the at-risk list
    const [risk] = await computeStudentRisk(schoolId, {
      studentIds: [studentId],
    })
    const totalDays = risk?.recordedDays ?? 0
    const absentDays = risk ? risk.recordedDays - risk.attendedDays : 0
    const absenceRate = risk ? 100 - risk.rate : 0

    const guardian = student.studentGuardians[0]?.guardian

    // Build template data
    const templateData: Record<string, string> = {
      studentName: displayName(student, "full"),
      studentId: student.grNumber || student.id,
      guardianName: guardian
        ? displayName(guardian, "full")
        : "Parent/Guardian",
      className: student.section?.name || "N/A",
      absenceRate: absenceRate.toFixed(1),
      absentDays: absentDays.toString(),
      totalDays: totalDays.toString(),
      unexcusedAbsences: absentDays.toString(),
      schoolName: school.name,
      schoolEmail: school.email || "",
      schoolPhone: school.phoneNumber || "",
      schoolAddress: school.address || "",
      currentDate: formatDate(new Date(), locale),
      principalName: "School Principal",
      meetingDate: formatDate(
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        locale
      ),
      meetingTime: locale === "ar" ? "10:00 صباحاً" : "10:00 AM",
      contractPeriod: locale === "ar" ? "30 يوم" : "30 days",
      attendancePeriod: formatDate(new Date(), locale, {
        month: "long",
        year: "numeric",
      }),
      previousRate: (absenceRate + 5).toFixed(1),
      improvementPercent: "5",
    }

    // Generate preview content
    let subject = template.subject[locale]
    let body = template.body[locale]

    for (const [key, value] of Object.entries(templateData)) {
      subject = subject.replace(new RegExp(`{{${key}}}`, "g"), value)
      body = body.replace(new RegExp(`{{${key}}}`, "g"), value)
    }

    return {
      success: true,
      data: {
        subject,
        body,
        callToAction: template.callToAction?.[locale],
        tier: template.tier,
        recipientEmail: guardian?.emailAddress,
        locale,
      },
    }
  } catch (error) {
    console.error("Error previewing letter:", error)
    return actionError(ACTION_ERRORS.ATTENDANCE_MARK_FAILED)
  }
}
