// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import type { Locale } from "@/components/internationalization/config"
import { loadFamilyMoney } from "@/components/school-dashboard/finance/family/queries"
import type {
  FamilyInstallment,
  FamilyMoney,
  FamilyPayment,
} from "@/components/school-dashboard/finance/family/types"
import { resolveTenantBaseUrl } from "@/components/school-dashboard/finance/fees/tenant-url"

import type { MobileAuthContext } from "../lib/authenticate"
import { hasRole } from "../lib/roles"

/**
 * The mobile family-money routes read the SAME resolution as the web's
 * `/finance` page (`loadFamilyMoney`): invoice rows as the instalment ledger,
 * statuses re-derived against the school's clock, balances from SUCCESS
 * payments only. Nothing here re-queries money.
 */

export function langOf(url: URL): Locale {
  return url.searchParams.get("lang") === "en" ? "en" : "ar"
}

export type FamilyResult =
  | { ok: true; money: FamilyMoney | null; studentId: string | null }
  | { ok: false; response: NextResponse }

/**
 * STUDENT / GUARDIAN only. `?student_id=` narrows a guardian's view to one
 * child; an id that is not one of the family's children is a 403.
 */
export async function familyMoneyFor(
  auth: MobileAuthContext,
  url: URL
): Promise<FamilyResult> {
  if (!hasRole(auth, "STUDENT", "GUARDIAN")) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    }
  }
  const money = await loadFamilyMoney({
    userId: auth.userId,
    schoolId: auth.schoolId,
    role: auth.role,
    lang: langOf(url),
  })
  const studentId = url.searchParams.get("student_id")
  if (studentId && !money?.fees.some((f) => f.studentId === studentId)) {
    // A child with no fee rows is still the family's child — only refuse ids
    // the caller cannot see at all.
    const own = await isFamilyStudent(auth, studentId)
    if (!own) {
      return {
        ok: false,
        response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      }
    }
  }
  return { ok: true, money, studentId }
}

async function isFamilyStudent(auth: MobileAuthContext, studentId: string) {
  if (hasRole(auth, "STUDENT")) {
    return !!(await db.student.findFirst({
      where: { id: studentId, schoolId: auth.schoolId, userId: auth.userId },
      select: { id: true },
    }))
  }
  return !!(await db.studentGuardian.findFirst({
    where: {
      schoolId: auth.schoolId,
      studentId,
      guardian: { userId: auth.userId },
    },
    select: { id: true },
  }))
}

/** Origin the hosted invoice page lives on, for `share_url`. */
export async function tenantBaseUrl(schoolId: string): Promise<string> {
  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: { domain: true },
  })
  return resolveTenantBaseUrl(school?.domain)
}

export function invoiceDto(
  i: FamilyInstallment,
  currency: string,
  base: string,
  lang: Locale
) {
  return {
    // An invoice id — or the fee assignment id for a fee billed as one lump
    // with no invoice (then invoice_no and due_date are null).
    id: i.id,
    invoice_no: i.invoiceNo ?? null,
    fee_assignment_id: i.feeAssignmentId,
    fee_name: i.feeName,
    student_id: i.studentId,
    student_name: i.studentName,
    academic_year: i.academicYear,
    installment_number: i.number,
    installment_count: i.count,
    due_date: i.dueDate,
    amount: i.amount,
    paid_amount: i.paidAmount,
    remaining: Math.max(i.amount - i.paidAmount, 0),
    currency,
    // PAID | PARTIAL | PENDING | OVERDUE | CANCELLED
    status: i.status,
    share_url: i.shareToken ? `${base}/${lang}/invoice/${i.shareToken}` : null,
  }
}

export function paymentDto(p: FamilyPayment, currency: string) {
  return {
    id: p.id,
    fee_assignment_id: p.feeAssignmentId,
    payment_number: p.paymentNumber,
    receipt_number: p.receiptNumber,
    amount: p.amount,
    currency,
    payment_date: p.paymentDate,
    payment_method: p.paymentMethod,
    // SUCCESS | PENDING_VERIFICATION
    status: p.status,
    fee_name: p.feeName,
    student_id: p.studentId,
    student_name: p.studentName,
    academic_year: p.academicYear,
  }
}

export function pageOf(url: URL) {
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1") || 1)
  const perPage = Math.min(
    100,
    Math.max(1, parseInt(url.searchParams.get("per_page") || "20") || 20)
  )
  return { page, perPage }
}
