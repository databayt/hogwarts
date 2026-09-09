// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import "server-only"

import { auth } from "@/auth"

import { db } from "@/lib/db"
import { resolveDefaultCurrency } from "@/lib/payment/gateway-config"
import {
  filterConfiguredManualRails,
  getSchoolPaymentSettings,
} from "@/lib/payment/manual-rail-settings"
import { resolveAvailableMethods } from "@/lib/payment/provider"
import type { PaymentGateway } from "@/lib/payment/types"
import { getTenantContext } from "@/lib/tenant-context"
import { schoolCalendarDayOf, schoolWallTimeToUtc } from "@/lib/timezone"
import type { Locale } from "@/components/internationalization/config"
import { localize } from "@/components/translation/localize"
import { getName, getNames } from "@/components/translation/person"
import { fullName } from "@/components/translation/util"

import type {
  FamilyFee,
  FamilyInstallment,
  FamilyMoney,
  FamilyPayment,
  InstallmentStatus,
} from "./types"

/**
 * Everything a family owes, has paid, and can pay with — resolved once.
 *
 * This is the single reader behind BOTH family money surfaces: the overview at
 * `/finance` and the detailed table at `/finance/fees/my`. They used to be one
 * page with the whole resolution inlined; two callers reading it two ways is
 * how a family ends up seeing two different balances for the same fee.
 *
 * Returns `null` for anyone who is not a STUDENT or GUARDIAN with a resolvable
 * student — the caller then falls through to the staff finance hub, which has
 * its own (much stricter) reports gate. Nothing here widens a permission: a
 * family reads only rows tied to its own student ids, inside its own school.
 */
export async function getFamilyMoney(
  lang: Locale
): Promise<FamilyMoney | null> {
  const [session, { schoolId }] = await Promise.all([auth(), getTenantContext()])
  const userId = session?.user?.id
  const role = session?.user?.role

  if (!userId || !schoolId) return null
  if (role !== "STUDENT" && role !== "GUARDIAN") return null

  // Which students this caller may see. A student is exactly one; a guardian
  // is every child linked to them — and only through StudentGuardian, never
  // by name or email.
  const studentIds: string[] = []
  const studentNames: Record<string, string> = {}

  if (role === "STUDENT") {
    const student = await db.student.findFirst({
      where: { userId, schoolId },
      select: { id: true, firstName: true, lastName: true },
    })
    if (!student) return null
    studentIds.push(student.id)
    studentNames[student.id] = await getName(student, lang, schoolId)
  } else {
    const guardian = await db.guardian.findFirst({
      where: { userId, schoolId },
      select: {
        studentGuardians: {
          select: {
            student: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    })
    if (!guardian?.studentGuardians?.length) return null
    const links = guardian.studentGuardians
    studentIds.push(...links.map((l) => l.student.id))
    const names = await getNames(links, (l) => l.student, lang, schoolId)
    for (const link of links) {
      const raw = fullName(link.student)
      studentNames[link.student.id] = names.get(raw) ?? raw
    }
  }

  const [school, paymentSettings, assignments] = await Promise.all([
    db.school.findUnique({
      where: { id: schoolId },
      select: { name: true, currency: true, country: true, timezone: true },
    }),
    getSchoolPaymentSettings(schoolId),
    db.feeAssignment.findMany({
      where: { schoolId, studentId: { in: studentIds } },
      include: {
        feeStructure: {
          select: { name: true, installments: true, paymentSchedule: true },
        },
        // The invoice rows ARE the installment ledger: one per scheduled
        // instalment, written at enrollment and kept current oldest-first by
        // `allocatePaymentToInvoices`. Reading the schedule JSON instead would
        // show a plan; this shows what is actually owed.
        invoices: {
          where: { status: { not: "CANCELLED" } },
          select: {
            id: true,
            invoice_no: true,
            due_date: true,
            total: true,
            amountPaid: true,
            status: true,
            shareToken: true,
            isPublic: true,
          },
          orderBy: { due_date: "asc" },
        },
        // SUCCESS drives the balance; PENDING_VERIFICATION rows are the
        // family's own submitted proofs, shown so a parent knows the school
        // has their receipt. FAILED/CANCELLED stay hidden — the rejection
        // notice already told them.
        payments: {
          where: { status: { in: ["SUCCESS", "PENDING_VERIFICATION"] } },
          select: {
            id: true,
            paymentNumber: true,
            receiptNumber: true,
            amount: true,
            paymentDate: true,
            paymentMethod: true,
            status: true,
          },
          orderBy: { paymentDate: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ])

  const currency =
    school?.currency ?? resolveDefaultCurrency(school?.country, school?.timezone)

  // Rails this family can actually pay with: the school's region list, minus
  // rails with no API key, minus wallet rails the school never published an
  // account for. Same resolution the admin assignment page uses.
  const methods: PaymentGateway[] = filterConfiguredManualRails(
    resolveAvailableMethods(school?.country, school?.timezone, currency),
    paymentSettings
  )

  // Fee names are school-authored in ONE language (single-language storage), so
  // an English-reading parent would otherwise meet "الصف العاشر" and an
  // Arabic-reading one "Primary Fee Structure". One batched pass over the
  // distinct names, never a per-row `getText` inside the loop below.
  const localizedNames = await localizeFeeNames(
    assignments.map((a) => a.feeStructure?.name ?? ""),
    schoolId,
    lang
  )

  // An instalment is late only once its DUE DAY is over in the SCHOOL's zone.
  // Comparing against `Date.now()` marks an invoice due today as overdue from
  // midnight UTC — 02:00 that same morning in Khartoum — so a parent paying on
  // the due day would read red all day for a payment that is not yet late.
  const timeZone = school?.timezone ?? "UTC"
  const today = schoolCalendarDayOf(new Date(), timeZone)
  const overdueAfter = schoolWallTimeToUtc(
    timeZone,
    today.year,
    today.month,
    today.day,
    0,
    0
  ).getTime()

  const fees: FamilyFee[] = []
  const payments: FamilyPayment[] = []

  for (const a of assignments) {
    const studentName = studentNames[a.studentId] ?? ""
    const rawFeeName = a.feeStructure?.name ?? ""
    const feeName = localizedNames.get(rawFeeName) || rawFeeName || "—"
    const total = Number(a.finalAmount)
    const paid = a.payments
      .filter((p) => p.status === "SUCCESS")
      .reduce((sum, p) => sum + Number(p.amount), 0)
    const pendingVerification = a.payments
      .filter((p) => p.status === "PENDING_VERIFICATION")
      .reduce((sum, p) => sum + Number(p.amount), 0)
    const remaining = Math.max(total - paid, 0)

    const installments = buildFamilyInstallments({
      assignmentId: a.id,
      feeName,
      studentName,
      academicYear: a.academicYear,
      invoices: a.invoices,
      total,
      paid,
      overdueAfter,
    })

    fees.push({
      id: a.id,
      feeName,
      studentId: a.studentId,
      studentName,
      academicYear: a.academicYear,
      total,
      discount: Number(a.totalDiscount),
      paid,
      pendingVerification,
      remaining,
      status: a.status,
      installments,
    })

    for (const p of a.payments) {
      payments.push({
        id: p.id,
        feeAssignmentId: a.id,
        paymentNumber: p.paymentNumber,
        receiptNumber: p.receiptNumber,
        amount: Number(p.amount),
        paymentDate: p.paymentDate.toISOString(),
        paymentMethod: p.paymentMethod,
        status: p.status,
        feeName,
        academicYear: a.academicYear,
        studentName,
      })
    }
  }

  payments.sort((x, y) => y.paymentDate.localeCompare(x.paymentDate))

  // Every instalment across every fee, in the order the money is owed. A row
  // with no due date (a fee billed as a single lump with no invoice) sorts
  // last — it is owed, but it is not owed on a date.
  const installments = fees
    .flatMap((f) => f.installments)
    .sort((x, y) => {
      if (!x.dueDate) return 1
      if (!y.dueDate) return -1
      return x.dueDate.localeCompare(y.dueDate)
    })

  const due = installments.filter(
    (i) => i.status === "OVERDUE" || i.status === "PENDING" || i.status === "PARTIAL"
  )

  const totals = {
    billed: fees.reduce((sum, f) => sum + f.total, 0),
    paid: fees.reduce((sum, f) => sum + f.paid, 0),
    pendingVerification: fees.reduce((sum, f) => sum + f.pendingVerification, 0),
    remaining: fees.reduce((sum, f) => sum + f.remaining, 0),
    overdue: installments
      .filter((i) => i.status === "OVERDUE")
      .reduce((sum, i) => sum + Math.max(i.amount - i.paidAmount, 0), 0),
  }

  const names = studentIds.map((id) => studentNames[id]).filter(Boolean)

  return {
    role,
    studentNames: names,
    studentLabel: joinNames(names, lang),
    currency,
    schoolName: school?.name ?? undefined,
    methods,
    fees,
    installments,
    due,
    payments,
    totals,
    nextDue: due[0] ?? null,
  }
}

/**
 * One fee assignment's instalments.
 *
 * Invoices first, because they are the ledger the payment allocator writes to.
 * A fee with no invoices still owes its balance, so it falls back to a single
 * dateless row rather than disappearing — an unbilled fee that renders as
 * nothing is how a family misses a payment.
 */
function buildFamilyInstallments({
  assignmentId,
  feeName,
  studentName,
  academicYear,
  invoices,
  total,
  paid,
  overdueAfter,
}: {
  assignmentId: string
  feeName: string
  studentName: string
  academicYear: string
  invoices: Array<{
    id: string
    invoice_no: string
    due_date: Date
    total: unknown
    amountPaid: unknown
    status: string
    shareToken: string | null
    isPublic: boolean
  }>
  total: number
  paid: number
  /** Midnight today in the school's zone — anything due before it is late. */
  overdueAfter: number
}): FamilyInstallment[] {
  const base = {
    feeAssignmentId: assignmentId,
    feeName,
    studentName,
    academicYear,
  }

  if (invoices.length > 0) {
    return invoices.map((inv, idx) => {
      const amount = Number(inv.total)
      const paidAmount = Number(inv.amountPaid)
      return {
        ...base,
        id: inv.id,
        number: idx + 1,
        count: invoices.length,
        invoiceNo: inv.invoice_no,
        // Only a token the school actually published opens a page; a token on
        // a private invoice would 404 the family it was shown to.
        shareToken: inv.isPublic ? inv.shareToken : null,
        dueDate: inv.due_date.toISOString(),
        amount,
        paidAmount,
        status: invoiceStatus(
          inv.status,
          amount,
          paidAmount,
          inv.due_date,
          overdueAfter
        ),
      }
    })
  }

  return [
    {
      ...base,
      id: assignmentId,
      number: 1,
      count: 1,
      invoiceNo: undefined,
      shareToken: null,
      dueDate: null,
      amount: total,
      paidAmount: Math.min(paid, total),
      status:
        paid >= total && total > 0 ? "PAID" : paid > 0 ? "PARTIAL" : "PENDING",
    },
  ]
}

/**
 * The status a family should read on one instalment.
 *
 * The stored status is authoritative for PAID and CANCELLED. Everything else
 * is re-derived against the clock: an UNPAID invoice whose due date has passed
 * is OVERDUE whether or not a cron has relabelled it yet, and a family must
 * never learn that from a stale row.
 */
function invoiceStatus(
  stored: string,
  amount: number,
  paidAmount: number,
  dueDate: Date,
  overdueAfter: number
): InstallmentStatus {
  if (stored === "PAID" || (amount > 0 && paidAmount >= amount)) return "PAID"
  if (stored === "CANCELLED") return "CANCELLED"
  if (paidAmount > 0) return "PARTIAL"
  return dueDate.getTime() < overdueAfter ? "OVERDUE" : "PENDING"
}

/**
 * The distinct fee-structure names, in the reader's language.
 *
 * Batched deliberately: `localize` resolves one source language in a single
 * cache/DB pass, and a family with a dozen instalments across six fees would
 * otherwise pay for the same name half a dozen times. Falls back to the stored
 * name on any failure — a translation outage must never blank a fee's label.
 */
async function localizeFeeNames(
  names: string[],
  schoolId: string,
  lang: Locale
): Promise<Map<string, string>> {
  const distinct = [...new Set(names.filter(Boolean))]
  if (distinct.length === 0) return new Map()

  try {
    const rows = await localize(
      "FeeStructure",
      distinct.map((name) => ({ name })),
      { schoolId, lang: lang === "en" ? "en" : "ar" }
    )
    return new Map(distinct.map((name, i) => [name, rows[i]?.name || name]))
  } catch {
    return new Map(distinct.map((name) => [name, name]))
  }
}

/**
 * The family's names as one line.
 *
 * `Intl.ListFormat` rather than a joined separator: the Arabic list conjunction
 * is "و" attached to the last name, not a comma, and hardcoding "، " printed
 * "Harry، Ron" to an English-reading guardian of two children.
 */
function joinNames(names: string[], lang: Locale): string {
  if (names.length <= 1) return names[0] ?? ""
  try {
    return new Intl.ListFormat(lang, {
      style: "long",
      type: "conjunction",
    }).format(names)
  } catch {
    return names.join(lang === "ar" ? "، " : ", ")
  }
}
