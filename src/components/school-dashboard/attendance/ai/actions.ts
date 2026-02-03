/**
 * AI Attendance Server Actions
 *
 * Server actions for AI-powered attendance predictions and translations.
 */
"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import type { AttendanceStatus, Prisma, StudentStatus } from "@prisma/client"

import {
  batchPredictRisk,
  type StudentAttendanceData,
} from "@/lib/ai/attendance-predictor"
import {
  batchTranslate,
  translateText,
  type SupportedLanguage,
} from "@/lib/ai/translator"
import { db } from "@/lib/db"

import {
  getRiskLevelFromScore,
  runPredictionSchema,
  translateMessageSchema,
  type AtRiskStudent,
  type PredictionSummary,
  type RunPredictionInput,
  type TranslateMessageInput,
} from "./validation"

interface ActionResult {
  success: boolean
  error?: string
  data?: unknown
}

// Type for attendance records from query
interface AttendanceRecord {
  date: Date
  status: AttendanceStatus
}

/**
 * Run AI risk predictions for students
 */
export async function runRiskPredictions(
  input?: RunPredictionInput
): Promise<ActionResult> {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const validated = runPredictionSchema.parse(input || {})

    // Get date ranges
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    // Build student query with proper Prisma types
    const whereClause: Prisma.StudentWhereInput = {
      schoolId,
    }

    if (!validated.includeInactive) {
      whereClause.status = "ACTIVE" as StudentStatus
    }

    if (validated.studentIds && validated.studentIds.length > 0) {
      whereClause.id = { in: validated.studentIds }
    }

    // Get students with attendance data using include (not select)
    const students = await db.student.findMany({
      where: whereClause,
      include: {
        studentYearLevels: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { yearLevel: true },
        },
        studentGuardians: {
          where: { isPrimary: true },
          include: { guardian: true },
        },
        attendances: {
          where: {
            deletedAt: null,
            date: { gte: startOfLastMonth },
          },
          select: {
            date: true,
            status: true,
          },
        },
        attendanceInterventions: {
          where: { status: { not: "COMPLETED" } },
          take: 1,
        },
        attendanceStreak: true,
      },
    })

    // Build student attendance data for prediction
    const studentDataList: StudentAttendanceData[] = students.map((student) => {
      // Calculate metrics - cast to typed array
      const allAttendances = student.attendances as AttendanceRecord[]
      const thisMonthAttendances = allAttendances.filter(
        (a: AttendanceRecord) => new Date(a.date) >= startOfMonth
      )
      const lastMonthAttendances = allAttendances.filter(
        (a: AttendanceRecord) =>
          new Date(a.date) >= startOfLastMonth &&
          new Date(a.date) <= endOfLastMonth
      )

      const totalDays = allAttendances.length
      const presentDays = allAttendances.filter(
        (a: AttendanceRecord) => a.status === "PRESENT"
      ).length
      const absentDays = allAttendances.filter(
        (a: AttendanceRecord) => a.status === "ABSENT"
      ).length
      const lateDays = allAttendances.filter(
        (a: AttendanceRecord) => a.status === "LATE"
      ).length
      const excusedDays = allAttendances.filter(
        (a: AttendanceRecord) => a.status === "EXCUSED"
      ).length

      const absenceRate = totalDays > 0 ? (absentDays / totalDays) * 100 : 0

      // Last month rate
      const lastMonthAbsent = lastMonthAttendances.filter(
        (a: AttendanceRecord) => a.status === "ABSENT"
      ).length
      const lastMonthTotal = lastMonthAttendances.length
      const lastMonthAbsenceRate =
        lastMonthTotal > 0 ? (lastMonthAbsent / lastMonthTotal) * 100 : 0

      // This month rate
      const thisMonthAbsent = thisMonthAttendances.filter(
        (a: AttendanceRecord) => a.status === "ABSENT"
      ).length
      const thisMonthTotal = thisMonthAttendances.length
      const thisMonthAbsenceRate =
        thisMonthTotal > 0 ? (thisMonthAbsent / thisMonthTotal) * 100 : 0

      // Trend direction
      let trendDirection: "improving" | "declining" | "stable" = "stable"
      if (thisMonthAbsenceRate < lastMonthAbsenceRate - 5) {
        trendDirection = "improving"
      } else if (thisMonthAbsenceRate > lastMonthAbsenceRate + 5) {
        trendDirection = "declining"
      }

      // Day of week patterns
      const dayOfWeekCounts: Record<string, number> = {}
      allAttendances
        .filter((a: AttendanceRecord) => a.status === "ABSENT")
        .forEach((a: AttendanceRecord) => {
          const day = new Date(a.date).toLocaleDateString("en-US", {
            weekday: "long",
          })
          dayOfWeekCounts[day] = (dayOfWeekCounts[day] || 0) + 1
        })

      const frequentAbsenceDays = Object.entries(dayOfWeekCounts)
        .filter(([, count]) => count >= 2)
        .map(([day]) => day)

      // Consecutive absences (simplified)
      const sortedAbsences = allAttendances
        .filter((a: AttendanceRecord) => a.status === "ABSENT")
        .map((a: AttendanceRecord) => new Date(a.date).getTime())
        .sort((a: number, b: number) => b - a)

      let consecutiveAbsences = 0
      const oneDay = 24 * 60 * 60 * 1000
      for (let i = 0; i < sortedAbsences.length; i++) {
        if (i === 0) {
          consecutiveAbsences = 1
        } else if (sortedAbsences[i - 1] - sortedAbsences[i] <= oneDay * 3) {
          consecutiveAbsences++
        } else {
          break
        }
      }

      return {
        studentId: student.id,
        studentName: `${student.givenName} ${student.surname}`,
        grNumber: student.grNumber,
        yearLevel: student.studentYearLevels[0]?.yearLevel?.levelName || null,
        totalDays,
        presentDays,
        absentDays,
        lateDays,
        excusedDays,
        absenceRate,
        lastMonthAbsenceRate,
        thisMonthAbsenceRate,
        trendDirection,
        frequentAbsenceDays,
        consecutiveAbsences,
        longestAbsenceStreak: student.attendanceStreak?.longestStreak || 0,
        previousInterventions: 0, // Would need to count from DB
        lastInterventionDate: null,
        hasActiveIntervention: student.attendanceInterventions.length > 0,
        hasGuardianContact:
          !!student.studentGuardians[0]?.guardian?.emailAddress,
        hasHealthCondition: !!student.medicalConditions,
      }
    })

    // Run batch predictions
    const predictions = await batchPredictRisk(studentDataList)

    // Build response with full student data
    const atRiskStudents: AtRiskStudent[] = predictions.predictions.map((p) => {
      const studentData = studentDataList.find(
        (s) => s.studentId === p.studentId
      )!
      const student = students.find((s) => s.id === p.studentId)!

      return {
        id: p.studentId,
        name: studentData.studentName,
        grNumber: studentData.grNumber,
        yearLevel: studentData.yearLevel,
        profilePhotoUrl: student.profilePhotoUrl,
        riskScore: p.riskScore,
        riskLevel: getRiskLevelFromScore(p.riskScore),
        confidence: p.confidence,
        absenceRate: studentData.absenceRate,
        currentStreak: student.attendanceStreak?.currentStreak || 0,
        factors: p.factors,
        recommendations: p.recommendations,
        predictedAbsences30Days: p.predictedAbsences30Days,
        hasActiveIntervention: studentData.hasActiveIntervention,
      }
    })

    // Sort by risk score (highest first)
    atRiskStudents.sort((a, b) => b.riskScore - a.riskScore)

    const summary: PredictionSummary = {
      total: predictions.summary.total,
      low: predictions.summary.low,
      moderate: predictions.summary.moderate,
      high: predictions.summary.high,
      critical: predictions.summary.critical,
      averageRiskScore: predictions.summary.averageRiskScore,
      lastRunAt: predictions.processedAt,
    }

    revalidatePath("/attendance/ai")

    return {
      success: true,
      data: {
        students: atRiskStudents,
        summary,
      },
    }
  } catch (error) {
    console.error("Error running predictions:", error)
    return { success: false, error: "Failed to run predictions" }
  }
}

/**
 * Get at-risk students (cached/quick view)
 */
export async function getAtRiskStudents(): Promise<ActionResult> {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    // Get students with high absence rates as a quick filter
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const students = await db.student.findMany({
      where: {
        schoolId,
        status: "ACTIVE" as StudentStatus,
      },
      include: {
        studentYearLevels: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { yearLevel: true },
        },
        attendances: {
          where: {
            deletedAt: null,
            date: { gte: thirtyDaysAgo },
          },
          select: { status: true },
        },
        attendanceStreak: true,
        attendanceInterventions: {
          where: { status: { not: "COMPLETED" } },
          take: 1,
        },
      },
    })

    // Calculate risk scores using simple statistical method
    const atRiskStudents: AtRiskStudent[] = students
      .map((student) => {
        const attendanceRecords = student.attendances as {
          status: AttendanceStatus
        }[]
        const totalDays = attendanceRecords.length
        const absentDays = attendanceRecords.filter(
          (a: { status: AttendanceStatus }) => a.status === "ABSENT"
        ).length
        const absenceRate = totalDays > 0 ? (absentDays / totalDays) * 100 : 0

        // Simple risk score calculation
        let riskScore = Math.min(absenceRate * 2.5, 100)

        // Adjust for active intervention
        if (student.attendanceInterventions.length > 0) {
          riskScore = Math.max(riskScore - 10, 0)
        }

        return {
          id: student.id,
          name: `${student.givenName} ${student.surname}`,
          grNumber: student.grNumber,
          yearLevel: student.studentYearLevels[0]?.yearLevel?.levelName || null,
          profilePhotoUrl: student.profilePhotoUrl,
          riskScore: Math.round(riskScore),
          riskLevel: getRiskLevelFromScore(riskScore),
          confidence: 0.7,
          absenceRate: Math.round(absenceRate * 10) / 10,
          currentStreak: student.attendanceStreak?.currentStreak || 0,
          factors: [],
          recommendations: [],
          predictedAbsences30Days: Math.round((absenceRate / 100) * 30),
          hasActiveIntervention: student.attendanceInterventions.length > 0,
        }
      })
      .filter((s) => s.riskScore >= 26) // Only moderate+ risk
      .sort((a, b) => b.riskScore - a.riskScore)

    const summary: PredictionSummary = {
      total: atRiskStudents.length,
      low: 0, // We filtered these out
      moderate: atRiskStudents.filter((s) => s.riskLevel === "MODERATE").length,
      high: atRiskStudents.filter((s) => s.riskLevel === "HIGH").length,
      critical: atRiskStudents.filter((s) => s.riskLevel === "CRITICAL").length,
      averageRiskScore:
        atRiskStudents.reduce((sum, s) => sum + s.riskScore, 0) /
          atRiskStudents.length || 0,
      lastRunAt: new Date(),
    }

    return {
      success: true,
      data: {
        students: atRiskStudents,
        summary,
      },
    }
  } catch (error) {
    console.error("Error getting at-risk students:", error)
    return { success: false, error: "Failed to get at-risk students" }
  }
}

/**
 * Translate a message
 */
export async function translateMessage(
  input: TranslateMessageInput
): Promise<ActionResult> {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const validated = translateMessageSchema.parse(input)

    const result = await translateText(
      validated.message,
      validated.targetLanguage as SupportedLanguage,
      validated.context
    )

    return {
      success: result.success,
      error: result.error,
      data: {
        translatedText: result.translatedText,
        sourceLanguage: result.sourceLanguage,
        targetLanguage: result.targetLanguage,
        confidence: result.confidence,
        usedCache: result.usedCache,
      },
    }
  } catch (error) {
    console.error("Error translating message:", error)
    return { success: false, error: "Failed to translate message" }
  }
}

/**
 * Batch translate messages
 */
export async function batchTranslateMessages(
  messages: string[],
  targetLanguage: "ar" | "en",
  context?: string
): Promise<ActionResult> {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const result = await batchTranslate(
      messages,
      targetLanguage as SupportedLanguage,
      context
    )

    return {
      success: true,
      data: {
        translations: result.translations.map((t) => ({
          original: messages[result.translations.indexOf(t)],
          translated: t.translatedText,
          success: t.success,
        })),
        stats: result.stats,
      },
    }
  } catch (error) {
    console.error("Error batch translating:", error)
    return { success: false, error: "Failed to translate messages" }
  }
}

/**
 * Create intervention from AI recommendation
 */
export async function createInterventionFromRecommendation(
  studentId: string,
  recommendation: string
): Promise<ActionResult> {
  const session = await auth()
  const schoolId = session?.user?.schoolId
  const userId = session?.user?.id

  if (!schoolId || !userId) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    // Map recommendation to intervention type
    const typeMap: Record<string, string> = {
      "home visit": "HOME_VISIT",
      "parent phone": "PARENT_PHONE_CALL",
      counselor: "COUNSELOR_REFERRAL",
      "social worker": "SOCIAL_WORKER_REFERRAL",
      "attendance contract": "ATTENDANCE_CONTRACT",
      administrator: "ADMINISTRATOR_MEETING",
      mentor: "MENTORSHIP_ASSIGNMENT",
      "academic support": "ACADEMIC_SUPPORT",
    }

    let interventionType = "OTHER"
    const lowerRec = recommendation.toLowerCase()
    for (const [key, type] of Object.entries(typeMap)) {
      if (lowerRec.includes(key)) {
        interventionType = type
        break
      }
    }

    const intervention = await db.attendanceIntervention.create({
      data: {
        schoolId,
        studentId,
        type: interventionType as
          | "OTHER"
          | "HOME_VISIT"
          | "PARENT_PHONE_CALL"
          | "COUNSELOR_REFERRAL"
          | "SOCIAL_WORKER_REFERRAL"
          | "ATTENDANCE_CONTRACT"
          | "ADMINISTRATOR_MEETING"
          | "MENTORSHIP_ASSIGNMENT"
          | "ACADEMIC_SUPPORT",
        title: `AI Recommended: ${recommendation}`,
        description: `This intervention was recommended by the AI risk prediction system.`,
        status: "SCHEDULED",
        priority: 3,
        initiatedBy: userId,
        tags: ["AI_RECOMMENDED"],
      },
    })

    revalidatePath("/attendance/ai")
    revalidatePath("/attendance/interventions")

    return { success: true, data: intervention }
  } catch (error) {
    console.error("Error creating intervention:", error)
    return { success: false, error: "Failed to create intervention" }
  }
}
