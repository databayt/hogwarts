// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Fees list rows — the ONE place a Prisma row becomes a serializable table
 * row, shared by the page (first paint) and the `fetchXRows` actions (client
 * pagination / search).
 *
 * The two used to duplicate the mapping and both shipped stored text raw: a
 * student named in Arabic rendered as Arabic on /en, and the seeded English
 * fee-structure names rendered as English on /ar. Person names go through the
 * batched `getNames` (transliteration fallback when the API is down); other
 * stored labels through `getLabels`. One resolution per list, never per row.
 */

import "server-only"

import { getLabels, getNames } from "@/components/translation/person"
import type { Lang } from "@/components/translation/types"
import { fullName } from "@/components/translation/util"

import type { FeeAssignmentRow } from "./assignment-columns"
import type { FineRow } from "./fine-columns"
import type { PaymentRow } from "./payment-columns"
import type { ScholarshipRow } from "./scholarship-columns"

const iso = (d: unknown): string =>
  d instanceof Date ? d.toISOString() : String(d)

type Person = { firstName?: string | null; lastName?: string | null } | null

const nameOf = (names: Map<string, string>, person: Person | undefined) => {
  if (!person) return ""
  const raw = fullName(person)
  return names.get(raw) ?? raw
}

export async function toAssignmentRows(
  rows: any[],
  lang: Lang,
  schoolId: string
): Promise<FeeAssignmentRow[]> {
  const [names, labels] = await Promise.all([
    getNames(rows, (fa) => fa.student ?? {}, lang, schoolId),
    getLabels(
      rows.map((fa) => fa.feeStructure?.name),
      lang,
      schoolId
    ),
  ])
  return rows.map((fa) => {
    const structure = fa.feeStructure?.name
    return {
      id: fa.id,
      studentName: nameOf(names, fa.student),
      studentId: fa.studentId ?? fa.student?.id,
      feeStructureName: structure ? (labels.get(structure) ?? structure) : "-",
      academicYear: fa.academicYear,
      finalAmount: Number(fa.finalAmount),
      totalDiscount: Number(fa.totalDiscount),
      paidAmount: (fa.payments ?? [])
        .filter((p: any) => p.status === "SUCCESS")
        .reduce((sum: number, p: any) => sum + Number(p.amount), 0),
      status: fa.status,
      createdAt: iso(fa.createdAt),
    }
  })
}

export async function toPaymentRows(
  rows: any[],
  lang: Lang,
  schoolId: string
): Promise<PaymentRow[]> {
  const [names, labels] = await Promise.all([
    getNames(rows, (p) => p.student ?? {}, lang, schoolId),
    getLabels(
      rows.map((p) => p.feeAssignment?.feeStructure?.name),
      lang,
      schoolId
    ),
  ])
  return rows.map((p) => {
    const structure = p.feeAssignment?.feeStructure?.name
    return {
      id: p.id,
      paymentNumber: p.paymentNumber,
      studentName: nameOf(names, p.student),
      feeStructureName: structure ? (labels.get(structure) ?? structure) : "-",
      amount: Number(p.amount),
      paymentDate: iso(p.paymentDate),
      paymentMethod: p.paymentMethod,
      status: p.status,
      receiptNumber: p.receiptNumber,
      createdAt: iso(p.createdAt),
    }
  })
}

export async function toFineRows(
  rows: any[],
  lang: Lang,
  schoolId: string
): Promise<FineRow[]> {
  const [names, labels] = await Promise.all([
    getNames(rows, (f) => f.student ?? {}, lang, schoolId),
    getLabels(
      rows.map((f) => f.reason),
      lang,
      schoolId
    ),
  ])
  return rows.map((f) => ({
    id: f.id,
    studentName: nameOf(names, f.student),
    studentId: f.studentId ?? f.student?.id,
    fineType: f.fineType,
    amount: Number(f.amount),
    reason: f.reason ? (labels.get(f.reason) ?? f.reason) : f.reason,
    dueDate: iso(f.dueDate),
    isPaid: f.isPaid,
    isWaived: f.isWaived,
    createdAt: iso(f.createdAt),
  }))
}

export async function toScholarshipRows(
  rows: any[],
  lang: Lang,
  schoolId: string
): Promise<ScholarshipRow[]> {
  const labels = await getLabels(
    rows.map((s) => s.name),
    lang,
    schoolId
  )
  return rows.map((s) => ({
    id: s.id,
    name: labels.get(s.name) ?? s.name,
    coverageType: s.coverageType,
    coverageAmount: Number(s.coverageAmount),
    academicYear: s.academicYear,
    startDate: iso(s.startDate),
    endDate: iso(s.endDate),
    maxBeneficiaries: s.maxBeneficiaries,
    currentBeneficiaries: s.currentBeneficiaries,
    applicationCount: s._count?.applications || 0,
    isActive: s.isActive,
    createdAt: iso(s.createdAt),
  }))
}
