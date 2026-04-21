import { db } from "@/lib/db"
import { extractGradeNumber } from "@/lib/grade-utils"

/**
 * Fee preview data for wizard steps.
 * Read-only — does not create FeeAssignment or FeeInvoice records.
 * Mirrors autoAssignFeesForStudent matching logic so the preview stays in sync
 * with what will actually be assigned at enrollment/confirmation time.
 */

export interface FeePreviewInstallment {
  sequence: number
  dueDate: string | null
  amount: number
  description: string
}

export interface FeePreviewStructure {
  id: string
  name: string
  totalAmount: number
  installments: number
  schedule: FeePreviewInstallment[]
}

export interface FeePreviewPaymentOption {
  method: "stripe" | "cash" | "bank_transfer"
  enabled: boolean
}

export interface FeePreview {
  matched: boolean
  academicYear: string
  currency: string
  totalAmount: number
  structures: FeePreviewStructure[]
  paymentMethods: FeePreviewPaymentOption[]
  enableOnlinePayment: boolean
  bankDetails: {
    bankName?: string
    accountName?: string
    accountNumber?: string
    iban?: string
    swiftCode?: string
  } | null
  cashPaymentInstructions: string | null
}

interface PaymentScheduleEntry {
  dueDate?: string
  amount?: number | string
  description?: string
}

function buildInstallmentSchedule(
  structure: {
    name: string
    installments: number
    paymentSchedule: unknown
  },
  totalAmount: number
): FeePreviewInstallment[] {
  const installments = structure.installments ?? 1
  const scheduleJson = structure.paymentSchedule as
    | PaymentScheduleEntry[]
    | null

  if (installments === 1) {
    return [
      {
        sequence: 1,
        dueDate: null,
        amount: totalAmount,
        description: structure.name,
      },
    ]
  }

  if (Array.isArray(scheduleJson) && scheduleJson.length > 0) {
    return scheduleJson.map((entry, i) => ({
      sequence: i + 1,
      dueDate: entry.dueDate ?? null,
      amount: Number(entry.amount) || 0,
      description:
        entry.description ?? `${structure.name} — ${i + 1}/${installments}`,
    }))
  }

  const per = Math.round((totalAmount / installments) * 100) / 100
  let running = 0
  const rows: FeePreviewInstallment[] = []
  for (let i = 0; i < installments; i++) {
    const isLast = i === installments - 1
    const amount = isLast
      ? Math.round((totalAmount - running) * 100) / 100
      : per
    running += amount
    rows.push({
      sequence: i + 1,
      dueDate: null,
      amount,
      description: `${structure.name} — ${i + 1}/${installments}`,
    })
  }
  return rows
}

async function loadSchoolSettings(schoolId: string) {
  const [school, admission] = await Promise.all([
    db.school.findUnique({
      where: { id: schoolId },
      select: { currency: true },
    }),
    db.admissionSettings.findUnique({
      where: { schoolId },
      select: {
        enableOnlinePayment: true,
        paymentMethods: true,
        bankDetails: true,
        cashPaymentInstructions: true,
      },
    }),
  ])

  const enabledMethods = ((admission?.paymentMethods as string[] | null) ?? [
    "stripe",
    "cash",
  ]) as ("stripe" | "cash" | "bank_transfer")[]

  const paymentMethods: FeePreviewPaymentOption[] = (
    ["stripe", "cash", "bank_transfer"] as const
  ).map((method) => ({ method, enabled: enabledMethods.includes(method) }))

  return {
    currency: school?.currency ?? "USD",
    enableOnlinePayment: admission?.enableOnlinePayment ?? false,
    paymentMethods,
    bankDetails: (admission?.bankDetails as FeePreview["bankDetails"]) ?? null,
    cashPaymentInstructions: admission?.cashPaymentInstructions ?? null,
  }
}

async function loadAcademicYear(schoolId: string): Promise<string> {
  const currentYear = await db.schoolYear.findFirst({
    where: { schoolId },
    orderBy: { startDate: "desc" },
    select: { yearName: true },
  })
  if (currentYear?.yearName) return currentYear.yearName
  const y = new Date().getFullYear()
  return `${y}-${y + 1}`
}

async function findApplicableFeeStructures(
  schoolId: string,
  academicYear: string,
  gradeClassIds: string[]
) {
  return db.feeStructure.findMany({
    where: {
      schoolId,
      academicYear,
      isActive: true,
      OR: [
        { classId: null },
        ...(gradeClassIds.length > 0
          ? [{ classId: { in: gradeClassIds } }]
          : []),
      ],
    },
    select: {
      id: true,
      name: true,
      totalAmount: true,
      installments: true,
      paymentSchedule: true,
    },
  })
}

function buildEmptyPreview(
  settings: Awaited<ReturnType<typeof loadSchoolSettings>>,
  academicYear: string
): FeePreview {
  return {
    matched: false,
    academicYear,
    currency: settings.currency,
    totalAmount: 0,
    structures: [],
    paymentMethods: settings.paymentMethods,
    enableOnlinePayment: settings.enableOnlinePayment,
    bankDetails: settings.bankDetails,
    cashPaymentInstructions: settings.cashPaymentInstructions,
  }
}

/**
 * Get fee preview for an admin-driven flow where the academic grade ID is known.
 * Used by the Add Student wizard.
 */
export async function getFeePreviewByGradeId(
  schoolId: string,
  academicGradeId: string
): Promise<FeePreview> {
  const [settings, academicYear, gradeClasses] = await Promise.all([
    loadSchoolSettings(schoolId),
    loadAcademicYear(schoolId),
    db.class.findMany({
      where: { schoolId, gradeId: academicGradeId },
      select: { id: true },
    }),
  ])

  const structures = await findApplicableFeeStructures(
    schoolId,
    academicYear,
    gradeClasses.map((c) => c.id)
  )

  if (structures.length === 0) return buildEmptyPreview(settings, academicYear)

  return {
    matched: true,
    academicYear,
    currency: settings.currency,
    totalAmount: structures.reduce((s, x) => s + Number(x.totalAmount), 0),
    structures: structures.map((s) => ({
      id: s.id,
      name: s.name,
      totalAmount: Number(s.totalAmount),
      installments: s.installments ?? 1,
      schedule: buildInstallmentSchedule(s, Number(s.totalAmount)),
    })),
    paymentMethods: settings.paymentMethods,
    enableOnlinePayment: settings.enableOnlinePayment,
    bankDetails: settings.bankDetails,
    cashPaymentInstructions: settings.cashPaymentInstructions,
  }
}

/**
 * Get fee preview for the public application wizard, where only a grade label
 * string is available (e.g., "الصف الأول" or "Grade 1"). Matches the same
 * cascading logic used in admission confirmEnrollment.
 */
export async function getFeePreviewByGradeLabel(
  schoolId: string,
  applyingForClass: string
): Promise<FeePreview> {
  const [settings, academicYear] = await Promise.all([
    loadSchoolSettings(schoolId),
    loadAcademicYear(schoolId),
  ])

  // Resolve AcademicGrade from the label (exact → case-insensitive → gradeNumber)
  let grade = await db.academicGrade.findFirst({
    where: { schoolId, name: applyingForClass },
    select: { id: true },
  })

  if (!grade) {
    grade = await db.academicGrade.findFirst({
      where: {
        schoolId,
        name: { equals: applyingForClass, mode: "insensitive" },
      },
      select: { id: true },
    })
  }

  if (!grade) {
    const gradeNum = extractGradeNumber(applyingForClass)
    if (gradeNum) {
      grade = await db.academicGrade.findFirst({
        where: { schoolId, gradeNumber: gradeNum },
        select: { id: true },
      })
    }
  }

  if (!grade) return buildEmptyPreview(settings, academicYear)

  const gradeClasses = await db.class.findMany({
    where: { schoolId, gradeId: grade.id },
    select: { id: true },
  })

  const structures = await findApplicableFeeStructures(
    schoolId,
    academicYear,
    gradeClasses.map((c) => c.id)
  )

  if (structures.length === 0) return buildEmptyPreview(settings, academicYear)

  return {
    matched: true,
    academicYear,
    currency: settings.currency,
    totalAmount: structures.reduce((s, x) => s + Number(x.totalAmount), 0),
    structures: structures.map((s) => ({
      id: s.id,
      name: s.name,
      totalAmount: Number(s.totalAmount),
      installments: s.installments ?? 1,
      schedule: buildInstallmentSchedule(s, Number(s.totalAmount)),
    })),
    paymentMethods: settings.paymentMethods,
    enableOnlinePayment: settings.enableOnlinePayment,
    bankDetails: settings.bankDetails,
    cashPaymentInstructions: settings.cashPaymentInstructions,
  }
}
