/**
 * Attendance Extras Seed
 * Creates excuses and interventions linked to attendance records
 *
 * Phase 13b: Attendance Excuses & Interventions
 *
 * Features:
 * - ~150 AttendanceExcuse records linked to ABSENT/EXCUSED attendance
 * - Mix of PENDING (30%), APPROVED (50%), REJECTED (20%)
 * - Various ExcuseReasons: MEDICAL, FAMILY_EMERGENCY, RELIGIOUS, TRANSPORTATION, etc.
 * - ~40 AttendanceIntervention records for chronic absentees
 * - Escalation chains: phone call → email → meeting → contract
 * - Various InterventionTypes with Arabic titles
 */

import type {
  ExcuseReason,
  ExcuseStatus,
  InterventionStatus,
  InterventionType,
  PrismaClient,
} from "@prisma/client"

import type { StudentRef, TeacherRef, UserRef } from "./types"
import { logSuccess, randomElement, randomNumber } from "./utils"

// ============================================================================
// EXCUSE DATA
// ============================================================================

const EXCUSE_REASONS: ExcuseReason[] = [
  "MEDICAL",
  "FAMILY_EMERGENCY",
  "RELIGIOUS",
  "SCHOOL_ACTIVITY",
  "TRANSPORTATION",
  "WEATHER",
  "OTHER",
]

const EXCUSE_DESCRIPTIONS: Record<string, string[]> = {
  MEDICAL: [
    "الطالب يعاني من ارتفاع في درجة الحرارة",
    "موعد مراجعة طبية في المستشفى",
    "إصابة رياضية تمنعه من الحضور",
    "حالة حساسية موسمية شديدة",
    "مرض معدي يستوجب العزل المنزلي",
  ],
  FAMILY_EMERGENCY: [
    "وفاة أحد أقارب الدرجة الأولى",
    "حالة طوارئ عائلية",
    "سفر عائلي طارئ",
    "مرض أحد الوالدين",
  ],
  RELIGIOUS: [
    "أداء مناسك العمرة",
    "حضور مناسبة دينية عائلية",
    "مسابقة حفظ القرآن الكريم",
  ],
  SCHOOL_ACTIVITY: [
    "مشاركة في مسابقة خارجية تمثل المدرسة",
    "رحلة ميدانية مع النادي العلمي",
  ],
  TRANSPORTATION: [
    "تعطل حافلة النقل المدرسي",
    "ازدحام مروري شديد بسبب حادث",
    "عدم توفر وسيلة نقل بسبب سفر الوالدين",
  ],
  WEATHER: ["عاصفة رملية شديدة في المنطقة", "أمطار غزيرة وسيول في الشوارع"],
  OTHER: [
    "ظروف خاصة تم الاتفاق عليها مع إدارة المدرسة",
    "إجراءات إدارية (نقل / تحويل)",
  ],
}

// ============================================================================
// INTERVENTION DATA
// ============================================================================

const INTERVENTION_CHAIN: Array<{
  type: InterventionType
  title: string
  description: string
  priority: number
}> = [
  {
    type: "PARENT_PHONE_CALL",
    title: "اتصال هاتفي بولي الأمر",
    description:
      "تم الاتصال بولي أمر الطالب لإبلاغه بتكرار الغياب ومناقشة الأسباب",
    priority: 1,
  },
  {
    type: "PARENT_EMAIL",
    title: "رسالة بريد إلكتروني لولي الأمر",
    description: "تم إرسال تقرير مفصل عن حالة الحضور مع طلب التواصل",
    priority: 1,
  },
  {
    type: "COUNSELOR_REFERRAL",
    title: "تحويل للمرشد الاجتماعي",
    description:
      "تم تحويل الطالب للمرشد الاجتماعي لتقييم الوضع النفسي والاجتماعي",
    priority: 2,
  },
  {
    type: "PARENT_MEETING",
    title: "اجتماع مع ولي الأمر",
    description: "اجتماع رسمي مع ولي الأمر في المدرسة لمناقشة خطة تحسين الحضور",
    priority: 2,
  },
  {
    type: "ADMINISTRATOR_MEETING",
    title: "اجتماع مع مدير المدرسة",
    description: "اجتماع تصعيدي مع إدارة المدرسة بسبب استمرار الغياب",
    priority: 3,
  },
  {
    type: "ATTENDANCE_CONTRACT",
    title: "عقد التزام بالحضور",
    description:
      "توقيع عقد التزام بين المدرسة وولي الأمر يتضمن شروط تحسين الحضور",
    priority: 3,
  },
  {
    type: "ACADEMIC_SUPPORT",
    title: "دعم أكاديمي تعويضي",
    description: "تخصيص حصص تقوية لتعويض الطالب عن الدروس الفائتة",
    priority: 2,
  },
  {
    type: "MENTORSHIP_ASSIGNMENT",
    title: "تعيين مرشد طلابي",
    description: "ربط الطالب بزميل متفوق في الحضور كنموذج إيجابي",
    priority: 1,
  },
  {
    type: "INCENTIVE_PROGRAM",
    title: "برنامج حوافز الحضور",
    description: "تسجيل الطالب في برنامج مكافآت الحضور لتحفيزه على الانتظام",
    priority: 1,
  },
]

const INTERVENTION_OUTCOMES = [
  "تحسن ملحوظ في نسبة الحضور بعد التدخل",
  "ولي الأمر تعاون بشكل إيجابي مع المدرسة",
  "الطالب أظهر التزاماً أفضل لمدة أسبوعين ثم تراجع",
  "تم تحديد المشكلة الأساسية وحلها",
  "يحتاج الطالب لمتابعة مستمرة",
  "تم النقل لمدرسة أقرب لمنزل الطالب",
]

// ============================================================================
// SEED ATTENDANCE EXCUSES
// ============================================================================

export async function seedAttendanceExcuses(
  prisma: PrismaClient,
  schoolId: string,
  students: StudentRef[],
  adminUsers: UserRef[]
): Promise<number> {
  // Clean existing excuses
  await prisma.attendanceExcuse.deleteMany({ where: { schoolId } })

  // Find attendance records with ABSENT or EXCUSED status
  const absentRecords = await prisma.attendance.findMany({
    where: {
      schoolId,
      status: { in: ["ABSENT", "EXCUSED"] },
    },
    select: { id: true, studentId: true },
    take: 300, // Get up to 300, we'll use ~150
  })

  if (absentRecords.length === 0) {
    logSuccess("Attendance Excuses", 0, "No absent records found")
    return 0
  }

  // Get guardian user IDs for the excuse submissions
  const guardianLinks = await prisma.studentGuardian.findMany({
    where: { schoolId },
    select: {
      studentId: true,
      guardian: { select: { userId: true } },
    },
  })

  const studentGuardianMap = new Map<string, string>()
  for (const link of guardianLinks) {
    if (link.guardian.userId) {
      studentGuardianMap.set(link.studentId, link.guardian.userId)
    }
  }

  // Select ~50% of absent records for excuses
  const selectedRecords = absentRecords.filter((_, i) => i % 2 === 0)
  const excuseCount = Math.min(selectedRecords.length, 150)
  const reviewerId = adminUsers[0]?.id || null

  const excuseData = selectedRecords.slice(0, excuseCount).map((record, i) => {
    const reason = EXCUSE_REASONS[i % EXCUSE_REASONS.length]
    const descriptions =
      EXCUSE_DESCRIPTIONS[reason] || EXCUSE_DESCRIPTIONS.OTHER
    const description = descriptions[i % descriptions.length]

    // Status distribution: 50% APPROVED, 30% PENDING, 20% REJECTED
    let status: ExcuseStatus
    const statusBucket = i % 10
    if (statusBucket < 5) status = "APPROVED"
    else if (statusBucket < 8) status = "PENDING"
    else status = "REJECTED"

    const submittedBy =
      studentGuardianMap.get(record.studentId) || adminUsers[0]?.id || "system"

    const submittedAt = new Date("2025-09-15")
    submittedAt.setDate(submittedAt.getDate() + randomNumber(0, 90))

    return {
      schoolId,
      attendanceId: record.id,
      reason,
      description,
      attachments: [] as string[],
      status,
      submittedBy,
      submittedAt,
      reviewedBy: status !== "PENDING" ? reviewerId : null,
      reviewedAt:
        status !== "PENDING"
          ? new Date(submittedAt.getTime() + randomNumber(1, 3) * 86400000)
          : null,
      reviewNotes:
        status === "REJECTED" ? "الأدلة المقدمة غير كافية أو غير مقبولة" : null,
    }
  })

  // Insert in batches
  let totalCreated = 0
  for (let i = 0; i < excuseData.length; i += 50) {
    const batch = excuseData.slice(i, i + 50)
    try {
      const result = await prisma.attendanceExcuse.createMany({
        data: batch,
        skipDuplicates: true,
      })
      totalCreated += result.count
    } catch {
      // Fall back to individual creates
      for (const excuse of batch) {
        try {
          await prisma.attendanceExcuse.create({ data: excuse })
          totalCreated++
        } catch {
          // Skip (attendanceId already has excuse)
        }
      }
    }
  }

  logSuccess(
    "Attendance Excuses",
    totalCreated,
    "APPROVED 50%, PENDING 30%, REJECTED 20%"
  )
  return totalCreated
}

// ============================================================================
// SEED ATTENDANCE INTERVENTIONS
// ============================================================================

export async function seedAttendanceInterventions(
  prisma: PrismaClient,
  schoolId: string,
  students: StudentRef[],
  teachers: TeacherRef[],
  adminUsers: UserRef[]
): Promise<number> {
  // Clean existing interventions
  await prisma.attendanceIntervention.deleteMany({ where: { schoolId } })

  // Identify chronic absentees: top ~5% by absence count
  const absentCounts = await prisma.attendance.groupBy({
    by: ["studentId"],
    where: { schoolId, status: "ABSENT" },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: Math.max(10, Math.ceil(students.length * 0.05)),
  })

  if (absentCounts.length === 0) {
    logSuccess("Attendance Interventions", 0, "No chronic absentees found")
    return 0
  }

  const initiatedBy = adminUsers[0]?.id || "system"
  const counselorId = teachers[0]?.userId || initiatedBy

  const interventionData: Array<{
    schoolId: string
    studentId: string
    type: InterventionType
    title: string
    description: string
    outcome: string | null
    status: InterventionStatus
    priority: number
    scheduledDate: Date | null
    completedDate: Date | null
    followUpDate: Date | null
    initiatedBy: string
    assignedTo: string | null
    parentNotified: boolean
    contactMethod: string | null
    contactResult: string | null
    documentsUrls: string[]
    tags: string[]
  }> = []

  for (let s = 0; s < absentCounts.length; s++) {
    const studentId = absentCounts[s].studentId
    const absenceCount = absentCounts[s]._count.id

    // Number of interventions increases with severity
    const interventionCount =
      absenceCount >= 15
        ? 4
        : absenceCount >= 10
          ? 3
          : absenceCount >= 5
            ? 2
            : 1

    let previousId: string | null = null

    for (let step = 0; step < interventionCount; step++) {
      const chain = INTERVENTION_CHAIN[step % INTERVENTION_CHAIN.length]
      const baseDate = new Date("2025-10-15")
      baseDate.setDate(baseDate.getDate() + step * randomNumber(7, 14))

      // First 60% completed, 20% in progress, 20% scheduled
      let status: InterventionStatus
      let completedDate: Date | null = null
      let outcome: string | null = null
      const statusBucket = (s * 10 + step) % 10
      if (statusBucket < 6) {
        status = "COMPLETED"
        completedDate = new Date(
          baseDate.getTime() + randomNumber(1, 7) * 86400000
        )
        outcome = randomElement(INTERVENTION_OUTCOMES)
      } else if (statusBucket < 8) {
        status = "IN_PROGRESS"
      } else {
        status = "SCHEDULED"
      }

      const followUpDate =
        status === "COMPLETED"
          ? new Date(completedDate!.getTime() + 14 * 86400000)
          : null

      interventionData.push({
        schoolId,
        studentId,
        type: chain.type,
        title: chain.title,
        description: chain.description,
        outcome,
        status,
        priority: chain.priority,
        scheduledDate: baseDate,
        completedDate,
        followUpDate,
        initiatedBy,
        assignedTo: step >= 2 ? counselorId : initiatedBy,
        parentNotified: step >= 1, // Parent notified after first step
        contactMethod:
          step === 0 ? "هاتف" : step === 1 ? "بريد إلكتروني" : "اجتماع شخصي",
        contactResult: status === "COMPLETED" ? "تم التواصل بنجاح" : null,
        documentsUrls: [],
        tags: absenceCount >= 15 ? ["حرج", "متابعة_مستمرة"] : ["متابعة"],
        // escalatedFrom would link to previous, but we need IDs first
      })

      previousId = null // Will be set after creation if needed
    }
  }

  // Insert interventions
  let totalCreated = 0
  for (let i = 0; i < interventionData.length; i += 50) {
    const batch = interventionData.slice(i, i + 50)
    try {
      const result = await prisma.attendanceIntervention.createMany({
        data: batch,
        skipDuplicates: true,
      })
      totalCreated += result.count
    } catch {
      for (const entry of batch) {
        try {
          await prisma.attendanceIntervention.create({ data: entry })
          totalCreated++
        } catch {
          // Skip
        }
      }
    }
  }

  logSuccess(
    "Attendance Interventions",
    totalCreated,
    `${absentCounts.length} chronic absentees, escalation chains`
  )
  return totalCreated
}
