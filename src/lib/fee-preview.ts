import { db } from "@/lib/db"
import { extractGradeNumber } from "@/lib/grade-utils"

/**
 * Fee preview data for wizard steps and /my-fees.
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

export interface FeePreviewDiscount {
  type: "SIBLING" | "SCHOLARSHIP" | "EARLY_PAYMENT" | "ADMIN_OVERRIDE"
  label: string
  amount: number
  reason?: string
}

export interface FeePreviewScholarshipCandidate {
  id: string
  name: string
  coverageType: "PERCENTAGE" | "FIXED_AMOUNT" | "FULL"
  coverageAmount: number
  applicable: boolean
  alreadyAwarded: boolean
}

export interface FeePreviewEarlyPaymentHint {
  deadline: string
  savings: number
}

export interface FeePreview {
  matched: boolean
  academicYear: string
  currency: string
  subtotal: number
  /**
   * Alias for `netAmount`. Preserved for call sites that were written before
   * discounts were modelled in the preview. New code should read `netAmount`.
   */
  totalAmount: number
  netAmount: number
  structures: FeePreviewStructure[]
  discounts: FeePreviewDiscount[]
  scholarships: FeePreviewScholarshipCandidate[]
  earlyPaymentHint: FeePreviewEarlyPaymentHint | null
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

interface DiscountPolicyShape {
  siblingDiscount?: {
    type: "PERCENTAGE" | "FIXED"
    tiers: Array<{ siblingNumber: number; value: number }>
  }
  earlyPaymentDiscount?: {
    type: "PERCENTAGE" | "FIXED"
    value: number
    deadlineDays: number
  }
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

interface FeeStructureRow {
  id: string
  name: string
  totalAmount: unknown
  installments: number | null
  paymentSchedule: unknown
  discountPolicy: unknown
  isAutoGenerated: boolean
  sourceSignals: unknown
}

/**
 * Mirrors the three-source matching in ensureStudentFeeAssignments
 * (src/lib/fee-auto-assign.ts): admin school-wide, class-linked, and
 * auto-generated per-grade (sourceSignals.gradeId). Matching only
 * `{ classId: null }` would sum the auto-generated structures of EVERY
 * grade into a single preview total.
 */
async function findApplicableFeeStructures(
  schoolId: string,
  academicYear: string,
  academicGradeId: string,
  gradeClassIds: string[]
): Promise<FeeStructureRow[]> {
  return db.feeStructure.findMany({
    where: {
      schoolId,
      academicYear,
      isActive: true,
      OR: [
        { classId: null, isAutoGenerated: false },
        ...(gradeClassIds.length > 0
          ? [{ classId: { in: gradeClassIds } }]
          : []),
        {
          isAutoGenerated: true,
          sourceSignals: { path: ["gradeId"], equals: academicGradeId },
        },
      ],
    },
    select: {
      id: true,
      name: true,
      totalAmount: true,
      installments: true,
      paymentSchedule: true,
      discountPolicy: true,
      isAutoGenerated: true,
      sourceSignals: true,
    },
  }) as unknown as Promise<FeeStructureRow[]>
}

/**
 * Collapse the pricing-matrix variant group (auto-generated structures whose
 * sourceSignals.gradeId matches) to a single variant, mirroring
 * selectAssignableStructures in fee-auto-assign.ts. When the student is
 * unknown (public application wizard) the least-specific variant — the grade
 * base price inherited from School.tuitionFee — is shown; a known student
 * gets the most-specific variant compatible with their stream/type.
 */
async function collapseVariantGroup(
  schoolId: string,
  studentId: string | null,
  academicGradeId: string,
  structures: FeeStructureRow[]
): Promise<FeeStructureRow[]> {
  const variantGroup: FeeStructureRow[] = []
  const additive: FeeStructureRow[] = []
  for (const s of structures) {
    const sig = s.sourceSignals as { gradeId?: string | null } | null
    if (s.isAutoGenerated && sig?.gradeId === academicGradeId) {
      variantGroup.push(s)
    } else {
      additive.push(s)
    }
  }
  if (variantGroup.length <= 1) return [...additive, ...variantGroup]

  let studentStream: string | null = null
  let studentType: string | null = null
  if (studentId) {
    const student = await db.student.findFirst({
      where: { id: studentId, schoolId },
      select: { academicStreamId: true, studentType: true },
    })
    studentStream = student?.academicStreamId ?? null
    studentType = (student?.studentType as string | null) ?? null
  }

  let chosen: FeeStructureRow | null = null
  let chosenScore = studentId ? -1 : Number.MAX_SAFE_INTEGER
  for (const s of variantGroup) {
    const sig = s.sourceSignals as {
      streamId?: string | null
      studentType?: string | null
    } | null
    const sStream = sig?.streamId ?? null
    const sType = sig?.studentType ?? null
    const score = (sStream ? 1 : 0) + (sType ? 1 : 0)
    if (studentId) {
      // Known student → most-specific compatible variant.
      if (sStream !== null && sStream !== studentStream) continue
      if (sType !== null && sType !== studentType) continue
      if (score > chosenScore) {
        chosen = s
        chosenScore = score
      }
    } else if (score < chosenScore) {
      // Anonymous applicant → grade base variant.
      chosen = s
      chosenScore = score
    }
  }

  return chosen ? [...additive, chosen] : additive
}

/**
 * Compute sibling discount for the student across all matched fee structures.
 * Caller passes `studentId=null` when the student row does not exist yet
 * (application wizard pre-enrollment) — sibling discount is skipped in that case.
 */
async function computeSiblingDiscounts(
  schoolId: string,
  studentId: string | null,
  structures: FeeStructureRow[],
  academicYear: string
): Promise<FeePreviewDiscount[]> {
  if (!studentId || structures.length === 0) return []

  // Sibling detection: count prior FeeAssignments from sibling students for each structure.
  // We mirror the logic in `calculateSiblingDiscount` (finance/fees/queries.ts)
  // but aggregate here so the preview can show all matched discounts.
  const guardianLinks = await db.studentGuardian.findMany({
    where: { schoolId, studentId },
    select: { guardianId: true },
  })
  const guardianIds = guardianLinks.map((g) => g.guardianId)
  if (guardianIds.length === 0) return []

  const siblingLinks = await db.studentGuardian.findMany({
    where: {
      schoolId,
      guardianId: { in: guardianIds },
      studentId: { not: studentId },
    },
    select: { studentId: true },
  })
  const siblingIds = Array.from(new Set(siblingLinks.map((s) => s.studentId)))
  if (siblingIds.length === 0) return []

  const discounts: FeePreviewDiscount[] = []

  for (const structure of structures) {
    const policy = structure.discountPolicy as DiscountPolicyShape | null
    if (!policy?.siblingDiscount) continue

    const count = await db.feeAssignment.count({
      where: {
        schoolId,
        studentId: { in: siblingIds },
        feeStructureId: structure.id,
        academicYear,
        status: { not: "CANCELLED" },
      },
    })
    if (count === 0) continue

    const childNumber = count + 1
    const tier = policy.siblingDiscount.tiers
      .filter((t) => t.siblingNumber <= childNumber)
      .sort((a, b) => b.siblingNumber - a.siblingNumber)[0]
    if (!tier) continue

    const base = Number(structure.totalAmount)
    const amount =
      policy.siblingDiscount.type === "PERCENTAGE"
        ? Math.round((base * tier.value) / 100)
        : Math.min(tier.value, base)

    discounts.push({
      type: "SIBLING",
      label: `${structure.name} — sibling #${childNumber}`,
      amount,
      reason:
        policy.siblingDiscount.type === "PERCENTAGE"
          ? `${tier.value}% off`
          : `-${tier.value}`,
    })
  }

  return discounts
}

/**
 * Find applicable scholarships for a grade/year. If `studentId` is provided,
 * also flags scholarships already awarded on existing FeeAssignment rows.
 */
async function findApplicableScholarships(
  schoolId: string,
  studentId: string | null,
  academicYear: string
): Promise<FeePreviewScholarshipCandidate[]> {
  const rows = await db.scholarship.findMany({
    where: { schoolId, academicYear, isActive: true },
    select: {
      id: true,
      name: true,
      coverageType: true,
      coverageAmount: true,
    },
    orderBy: { name: "asc" },
  })

  if (rows.length === 0) return []

  const awardedIds = new Set<string>()
  if (studentId) {
    const linked = await db.feeAssignment.findMany({
      where: {
        schoolId,
        studentId,
        academicYear,
        scholarshipId: { not: null },
      },
      select: { scholarshipId: true },
    })
    for (const row of linked) {
      if (row.scholarshipId) awardedIds.add(row.scholarshipId)
    }
  }

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    coverageType: r.coverageType as "PERCENTAGE" | "FIXED_AMOUNT" | "FULL",
    coverageAmount: Number(r.coverageAmount),
    applicable: true,
    alreadyAwarded: awardedIds.has(r.id),
  }))
}

/**
 * Extract the first usable early-payment hint from the matched structures.
 * Only the earliest deadline + savings is surfaced — the preview stays compact.
 */
function extractEarlyPaymentHint(
  structures: FeeStructureRow[]
): FeePreviewEarlyPaymentHint | null {
  for (const structure of structures) {
    const policy = structure.discountPolicy as DiscountPolicyShape | null
    if (!policy?.earlyPaymentDiscount) continue

    const schedule = structure.paymentSchedule as PaymentScheduleEntry[] | null
    const firstDue = Array.isArray(schedule) ? schedule[0]?.dueDate : null
    if (!firstDue) continue

    const deadlineDate = new Date(firstDue)
    deadlineDate.setDate(
      deadlineDate.getDate() - policy.earlyPaymentDiscount.deadlineDays
    )

    const base = Number(structure.totalAmount)
    const savings =
      policy.earlyPaymentDiscount.type === "PERCENTAGE"
        ? Math.round((base * policy.earlyPaymentDiscount.value) / 100)
        : policy.earlyPaymentDiscount.value

    return {
      deadline: deadlineDate.toISOString(),
      savings,
    }
  }
  return null
}

function buildEmptyPreview(
  settings: Awaited<ReturnType<typeof loadSchoolSettings>>,
  academicYear: string
): FeePreview {
  return {
    matched: false,
    academicYear,
    currency: settings.currency,
    subtotal: 0,
    totalAmount: 0,
    netAmount: 0,
    structures: [],
    discounts: [],
    scholarships: [],
    earlyPaymentHint: null,
    paymentMethods: settings.paymentMethods,
    enableOnlinePayment: settings.enableOnlinePayment,
    bankDetails: settings.bankDetails,
    cashPaymentInstructions: settings.cashPaymentInstructions,
  }
}

async function buildMatchedPreview(
  schoolId: string,
  studentId: string | null,
  structures: FeeStructureRow[],
  settings: Awaited<ReturnType<typeof loadSchoolSettings>>,
  academicYear: string
): Promise<FeePreview> {
  const subtotal = structures.reduce((s, x) => s + Number(x.totalAmount), 0)

  const [siblingDiscounts, scholarships] = await Promise.all([
    computeSiblingDiscounts(schoolId, studentId, structures, academicYear),
    findApplicableScholarships(schoolId, studentId, academicYear),
  ])

  const earlyPaymentHint = extractEarlyPaymentHint(structures)

  const discounts = [...siblingDiscounts]
  const totalDiscount = discounts.reduce((s, d) => s + d.amount, 0)
  const netAmount = Math.max(0, subtotal - totalDiscount)

  return {
    matched: true,
    academicYear,
    currency: settings.currency,
    subtotal,
    totalAmount: netAmount,
    netAmount,
    structures: structures.map((s) => ({
      id: s.id,
      name: s.name,
      totalAmount: Number(s.totalAmount),
      installments: s.installments ?? 1,
      schedule: buildInstallmentSchedule(
        { ...s, installments: s.installments ?? 1 },
        Number(s.totalAmount)
      ),
    })),
    discounts,
    scholarships,
    earlyPaymentHint,
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
  academicGradeId: string,
  studentId: string | null = null
): Promise<FeePreview> {
  const [settings, academicYear, gradeClasses] = await Promise.all([
    loadSchoolSettings(schoolId),
    loadAcademicYear(schoolId),
    db.class.findMany({
      where: { schoolId, gradeId: academicGradeId },
      select: { id: true },
    }),
  ])

  const matched = await findApplicableFeeStructures(
    schoolId,
    academicYear,
    academicGradeId,
    gradeClasses.map((c) => c.id)
  )
  const structures = await collapseVariantGroup(
    schoolId,
    studentId,
    academicGradeId,
    matched
  )

  if (structures.length === 0) return buildEmptyPreview(settings, academicYear)

  return buildMatchedPreview(
    schoolId,
    studentId,
    structures,
    settings,
    academicYear
  )
}

/**
 * Get fee preview for the public application wizard, where only a grade label
 * string is available (e.g., "الصف الأول" or "Grade 1"). Matches the same
 * cascading logic used in admission confirmEnrollment.
 */
export async function getFeePreviewByGradeLabel(
  schoolId: string,
  applyingForClass: string,
  studentId: string | null = null
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

  const matched = await findApplicableFeeStructures(
    schoolId,
    academicYear,
    grade.id,
    gradeClasses.map((c) => c.id)
  )
  const structures = await collapseVariantGroup(
    schoolId,
    studentId,
    grade.id,
    matched
  )

  if (structures.length === 0) return buildEmptyPreview(settings, academicYear)

  return buildMatchedPreview(
    schoolId,
    studentId,
    structures,
    settings,
    academicYear
  )
}
