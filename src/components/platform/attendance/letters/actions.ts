/**
 * Compliance Letters Server Actions
 *
 * Server actions for generating and sending compliance letters.
 */
"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { db } from "@/lib/db"

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

  if (!schoolId || !userId) {
    return { success: false, error: "Unauthorized" }
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
        studentClasses: {
          include: { class: true },
          take: 1,
        },
        attendances: {
          where: {
            deletedAt: null,
            date: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        },
      },
    })

    if (!student) {
      return { success: false, error: "Student not found" }
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
      return { success: false, error: "School not found" }
    }

    // Calculate attendance stats
    const totalDays = student.attendances.length
    const absentDays = student.attendances.filter(
      (a) => a.status === "ABSENT"
    ).length
    const absenceRate = totalDays > 0 ? (absentDays / totalDays) * 100 : 0

    // Get template
    const template = letterTemplates[letterType]
    if (!template) {
      return { success: false, error: "Invalid letter type" }
    }

    // Build data for template
    const guardian = student.studentGuardians[0]?.guardian
    const className = student.studentClasses[0]?.class?.name || "N/A"

    const templateData: Record<string, string> = {
      studentName: `${student.givenName} ${student.surname}`,
      studentId: student.grNumber || student.id,
      guardianName: guardian
        ? `${guardian.givenName} ${guardian.surname}`
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
      currentDate: new Date().toLocaleDateString(),
      principalName: "School Principal", // Could be fetched from settings
      meetingDate: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toLocaleDateString(),
      meetingTime: "10:00 AM",
      contractPeriod: "30 days",
      attendancePeriod: new Date().toLocaleDateString("en-US", {
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

    revalidatePath("/attendance/letters")

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
    return { success: false, error: "Failed to generate letter" }
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

  if (!schoolId) {
    return { success: false, error: "Unauthorized" }
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
    return { success: false, error: "Failed to get letter history" }
  }
}

/**
 * Get students who need letters based on tier
 */
export async function getStudentsNeedingLetters(
  letterType: LetterType
): Promise<ActionResult> {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const template = letterTemplates[letterType]
    if (!template) {
      return { success: false, error: "Invalid letter type" }
    }

    // Get date range for current month
    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    )

    // Get students with their attendance
    const students = await db.student.findMany({
      where: {
        schoolId,
        status: "ACTIVE",
      },
      include: {
        studentGuardians: {
          where: { isPrimary: true },
          include: { guardian: true },
        },
        studentYearLevels: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { yearLevel: true },
        },
        attendances: {
          where: {
            deletedAt: null,
            date: { gte: startOfMonth },
          },
        },
        attendanceInterventions: {
          where: {
            tags: { has: letterType },
          },
          take: 1,
        },
      },
    })

    // Filter based on tier threshold
    const thresholds = {
      TIER_1: { min: 0, max: 9.99 },
      TIER_2: { min: 10, max: 19.99 },
      TIER_3: { min: 20, max: 100 },
    }

    const threshold = thresholds[template.tier]

    const eligibleStudents = students
      .map((student) => {
        const totalDays = student.attendances.length
        const absentDays = student.attendances.filter(
          (a) => a.status === "ABSENT"
        ).length
        const absenceRate = totalDays > 0 ? (absentDays / totalDays) * 100 : 0

        return {
          ...student,
          absenceRate,
          totalDays,
          absentDays,
          alreadySent: student.attendanceInterventions.length > 0,
        }
      })
      .filter(
        (s) =>
          s.absenceRate >= threshold.min &&
          s.absenceRate <= threshold.max &&
          !s.alreadySent
      )

    return {
      success: true,
      data: eligibleStudents.map((s) => ({
        id: s.id,
        name: `${s.givenName} ${s.surname}`,
        grNumber: s.grNumber,
        yearLevel: s.studentYearLevels[0]?.yearLevel?.levelName,
        absenceRate: Math.round(s.absenceRate * 10) / 10,
        absentDays: s.absentDays,
        totalDays: s.totalDays,
        guardianEmail: s.studentGuardians[0]?.guardian?.emailAddress,
        hasGuardianEmail: !!s.studentGuardians[0]?.guardian?.emailAddress,
      })),
    }
  } catch (error) {
    console.error("Error getting students needing letters:", error)
    return { success: false, error: "Failed to get eligible students" }
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

  if (!schoolId) {
    return { success: false, error: "Unauthorized" }
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

  revalidatePath("/attendance/letters")

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

  if (!schoolId) {
    return { success: false, error: "Unauthorized" }
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
        studentClasses: {
          include: { class: true },
          take: 1,
        },
        attendances: {
          where: {
            deletedAt: null,
            date: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        },
      },
    })

    if (!student) {
      return { success: false, error: "Student not found" }
    }

    // Get school
    const school = await db.school.findUnique({
      where: { id: schoolId },
    })

    if (!school) {
      return { success: false, error: "School not found" }
    }

    const template = letterTemplates[letterType]
    if (!template) {
      return { success: false, error: "Invalid letter type" }
    }

    // Calculate stats
    const totalDays = student.attendances.length
    const absentDays = student.attendances.filter(
      (a) => a.status === "ABSENT"
    ).length
    const absenceRate = totalDays > 0 ? (absentDays / totalDays) * 100 : 0

    const guardian = student.studentGuardians[0]?.guardian

    // Build template data
    const templateData: Record<string, string> = {
      studentName: `${student.givenName} ${student.surname}`,
      studentId: student.grNumber || student.id,
      guardianName: guardian
        ? `${guardian.givenName} ${guardian.surname}`
        : "Parent/Guardian",
      className: student.studentClasses[0]?.class?.name || "N/A",
      absenceRate: absenceRate.toFixed(1),
      absentDays: absentDays.toString(),
      totalDays: totalDays.toString(),
      unexcusedAbsences: absentDays.toString(),
      schoolName: school.name,
      schoolEmail: school.email || "",
      schoolPhone: school.phoneNumber || "",
      schoolAddress: school.address || "",
      currentDate: new Date().toLocaleDateString(
        locale === "ar" ? "ar-SA" : "en-US"
      ),
      principalName: "School Principal",
      meetingDate: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US"),
      meetingTime: locale === "ar" ? "10:00 صباحاً" : "10:00 AM",
      contractPeriod: locale === "ar" ? "30 يوم" : "30 days",
      attendancePeriod: new Date().toLocaleDateString(
        locale === "ar" ? "ar-SA" : "en-US",
        { month: "long", year: "numeric" }
      ),
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
    return { success: false, error: "Failed to preview letter" }
  }
}
