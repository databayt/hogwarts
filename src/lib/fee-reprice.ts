// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Prisma } from "@prisma/client"

import { db } from "@/lib/db"
import { resyncAssignmentInvoices } from "@/lib/fee-invoice-sync"

type DbClient = typeof db | Prisma.TransactionClient

/**
 * The fee cascade — school → grade → student.
 *
 * 1. School:  `School.tuitionFee` is the default every grade starts from.
 * 2. Grade:   one auto-generated FeeStructure per grade, priced from the
 *             school fee. Editing it fine-tunes the grade and sets
 *             `isLocked`, so a later school-fee re-sync leaves it alone.
 * 3. Student: a FeeAssignment inherits its structure's total until the admin
 *             sets `customAmount` — that is the student's own price, and
 *             re-pricing never touches it.
 *
 * Discounts and scholarships (`totalDiscount`) apply on top of whichever
 * base wins.
 */
export function studentBaseAmount(
  customAmount: Prisma.Decimal | number | null | undefined,
  structureTotal: Prisma.Decimal | number
): number {
  return customAmount != null ? Number(customAmount) : Number(structureTotal)
}

export function studentFinalAmount(
  base: number,
  totalDiscount: Prisma.Decimal | number | null | undefined
): number {
  const discount = Number(totalDiscount ?? 0)
  return Math.max(Math.round((base - discount) * 100) / 100, 0)
}

export interface RepriceResult {
  updated: number
  skippedPaid: number
  skippedOverridden: number
}

/**
 * Push a structure's (new) total down to the students who inherit it.
 *
 * Skips: students with their own price (`customAmount`), assignments that
 * are PAID / CANCELLED or have any successful payment. Re-prices the open
 * invoices of every assignment it moves, so instalments still sum to the
 * new amount.
 */
export async function repriceStructureAssignments(
  schoolId: string,
  feeStructureId: string,
  tx?: Prisma.TransactionClient
): Promise<RepriceResult> {
  const run = async (client: DbClient): Promise<RepriceResult> => {
    const result: RepriceResult = {
      updated: 0,
      skippedPaid: 0,
      skippedOverridden: 0,
    }
    const structure = await client.feeStructure.findFirst({
      where: { id: feeStructureId, schoolId },
      select: { totalAmount: true },
    })
    if (!structure) return result

    const assignments = await client.feeAssignment.findMany({
      where: { schoolId, feeStructureId },
      select: {
        id: true,
        status: true,
        customAmount: true,
        totalDiscount: true,
        finalAmount: true,
        payments: {
          where: { status: "SUCCESS" },
          select: { id: true },
          take: 1,
        },
      },
    })

    for (const a of assignments) {
      if (
        a.status === "PAID" ||
        a.status === "CANCELLED" ||
        a.payments.length > 0
      ) {
        result.skippedPaid++
        continue
      }
      if (a.customAmount != null) {
        result.skippedOverridden++
        continue
      }
      const next = studentFinalAmount(
        studentBaseAmount(null, structure.totalAmount),
        a.totalDiscount
      )
      if (next === Number(a.finalAmount)) continue
      await client.feeAssignment.update({
        where: { id: a.id },
        data: { finalAmount: next },
      })
      await resyncAssignmentInvoices(client, schoolId, a.id, next)
      result.updated++
    }
    return result
  }

  return tx ? run(tx) : db.$transaction((inner) => run(inner))
}

/**
 * Re-derive one assignment's `finalAmount` from the cascade (its own price
 * or the structure total, minus discounts) and re-price its open invoices.
 * Used after an override, discount or scholarship change on one student.
 */
export async function recomputeAssignment(
  client: DbClient,
  schoolId: string,
  feeAssignmentId: string
): Promise<number | null> {
  const a = await client.feeAssignment.findFirst({
    where: { id: feeAssignmentId, schoolId },
    select: {
      customAmount: true,
      totalDiscount: true,
      feeStructure: { select: { totalAmount: true } },
    },
  })
  if (!a) return null
  const next = studentFinalAmount(
    studentBaseAmount(a.customAmount, a.feeStructure.totalAmount),
    a.totalDiscount
  )
  await client.feeAssignment.update({
    where: { id: feeAssignmentId },
    data: { finalAmount: next },
  })
  await resyncAssignmentInvoices(client, schoolId, feeAssignmentId, next)
  return next
}

/**
 * A student left a grade this year (grade edit, promotion). Cancel the fees
 * that grade charged them and nobody has paid toward, along with their open invoices.
 * Fees with money against them stay — the admin settles those by hand.
 * Admin school-wide structures (no grade) are not grade fees and stay.
 */
export async function releaseGradeFees(
  client: DbClient,
  input: {
    schoolId: string
    studentId: string
    academicYear: string
    keepGradeId: string | null
  }
): Promise<number> {
  const { schoolId, studentId, academicYear, keepGradeId } = input
  // Same academic year only — last year's unpaid fees are arrears, not a
  // grade the student just left.
  const assignments = await client.feeAssignment.findMany({
    where: {
      schoolId,
      studentId,
      academicYear,
      status: { in: ["PENDING", "OVERDUE"] },
      payments: { none: { status: "SUCCESS" } },
    },
    select: {
      id: true,
      feeStructure: {
        select: { gradeId: true, isAutoGenerated: true, sourceSignals: true },
      },
    },
  })

  let released = 0
  for (const a of assignments) {
    const sig = a.feeStructure.sourceSignals as { gradeId?: string } | null
    const gradeId =
      a.feeStructure.gradeId ??
      (a.feeStructure.isAutoGenerated ? (sig?.gradeId ?? null) : null)
    if (!gradeId || gradeId === keepGradeId) continue

    const paidInvoice = await client.userInvoice.findFirst({
      where: {
        schoolId,
        feeAssignmentId: a.id,
        OR: [{ status: "PAID" }, { amountPaid: { gt: 0 } }],
      },
      select: { id: true },
    })
    if (paidInvoice) continue

    await client.feeAssignment.update({
      where: { id: a.id },
      data: { status: "CANCELLED" },
    })
    await client.userInvoice.updateMany({
      where: { schoolId, feeAssignmentId: a.id, status: { not: "PAID" } },
      data: { status: "CANCELLED" },
    })
    released++
  }
  return released
}
