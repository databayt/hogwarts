// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { resolveDefaultCurrency } from "@/lib/payment/gateway-config"
import {
  filterConfiguredManualRails,
  getSchoolPaymentSettings,
} from "@/lib/payment/manual-rail-settings"
import { resolveAvailableMethods } from "@/lib/payment/provider"
import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { MyFees } from "@/components/school-dashboard/finance/fees/my-fees"
import { PaymentReturnBanner } from "@/components/school-dashboard/finance/fees/payment-return-banner"
import { getName, getNames } from "@/components/translation/person"
import { fullName } from "@/components/translation/util"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return { title: dictionary?.finance?.fees?.navigation?.myFees || "My Fees" }
}

export default async function MyFeesPage({ params, searchParams }: Props) {
  const [{ lang }, sp] = await Promise.all([params, searchParams])
  const dictionary = await getDictionary(lang)
  const session = await auth()
  const { schoolId } = await getTenantContext()

  if (!session?.user?.id || !schoolId) notFound()

  const role = session.user.role

  // Resolve student IDs based on role
  let studentIds: string[] = []
  let studentNameMap: Record<string, string> = {}

  if (role === "STUDENT") {
    const student = await db.student.findFirst({
      where: { userId: session.user.id, schoolId },
      select: { id: true, firstName: true, lastName: true },
    })
    if (!student) notFound()
    studentIds = [student.id]
    studentNameMap[student.id] = await getName(student, lang, schoolId)
  } else if (role === "GUARDIAN") {
    const guardian = await db.guardian.findFirst({
      where: { userId: session.user.id, schoolId },
      select: {
        studentGuardians: {
          select: {
            student: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
    })
    if (!guardian?.studentGuardians?.length) notFound()
    studentIds = guardian.studentGuardians.map((sg) => sg.student.id)
    const names = await getNames(
      guardian.studentGuardians,
      (sg) => sg.student,
      lang,
      schoolId
    )
    for (const sg of guardian.studentGuardians) {
      const raw = fullName(sg.student)
      studentNameMap[sg.student.id] = names.get(raw) ?? raw
    }
  } else {
    // Admin/Accountant/etc — redirect to full fees page
    redirect(`/${lang}/finance/fees`)
  }

  // School record (name + currency for the receipt PDF, region for the rails)
  // and the wallet-rail settings, alongside the assignments.
  const [school, paymentSettings, assignments] = await Promise.all([
    db.school.findUnique({
      where: { id: schoolId },
      select: {
        name: true,
        currency: true,
        country: true,
        timezone: true,
      },
    }),
    getSchoolPaymentSettings(schoolId),
    // SUCCESS drives the balance; PENDING_VERIFICATION rows are the family's
    // own submitted proofs (Bankak/Cashi) — shown as "awaiting verification"
    // so a parent knows the school has their receipt. FAILED/CANCELLED stay
    // hidden here (the rejection notice already told them).
    db.feeAssignment.findMany({
      where: { schoolId, studentId: { in: studentIds } },
      include: {
        feeStructure: { select: { name: true } },
        student: { select: { id: true, firstName: true, lastName: true } },
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

  // Rails this family can pay with: the school's region list, minus rails
  // whose API key is missing, minus wallet rails the school never published
  // an account for. Same resolution the admin assignment page uses.
  const currency =
    school?.currency ??
    resolveDefaultCurrency(school?.country, school?.timezone)
  const methods = filterConfiguredManualRails(
    resolveAvailableMethods(school?.country, school?.timezone, currency),
    paymentSettings
  )

  const fees = dictionary?.finance?.fees as
    | {
        myFees?: Record<string, unknown>
        gateways?: Record<string, unknown>
        manualRail?: Record<string, unknown>
        paymentReturn?: Record<string, unknown>
      }
    | undefined

  // Gateway redirect landing: `?payment=success|cancelled&assignment=…`
  // (+ `session_id` from Stripe, `tap_id` from Tap). Verified server-side by
  // the banner before anything reads as "paid".
  const payment = first(sp.payment)
  const returnAssignment = first(sp.assignment)
  const gatewayParam = first(sp.gateway)
  const banner =
    (payment === "success" || payment === "cancelled") && returnAssignment ? (
      <PaymentReturnBanner
        outcome={payment}
        feeAssignmentId={returnAssignment}
        gateway={
          gatewayParam === "stripe" || gatewayParam === "tap"
            ? gatewayParam
            : undefined
        }
        sessionId={first(sp.session_id)}
        tapId={first(sp.tap_id)}
        lang={lang}
        currency={currency}
        dictionary={fees?.paymentReturn}
      />
    ) : null

  const toPayments = (a: (typeof assignments)[number]) =>
    a.payments.map((p) => ({
      id: p.id,
      paymentNumber: p.paymentNumber,
      receiptNumber: p.receiptNumber,
      amount: Number(p.amount),
      paymentDate: p.paymentDate.toISOString(),
      paymentMethod: p.paymentMethod,
      status: p.status,
    }))
  const paidOf = (a: (typeof assignments)[number]) =>
    a.payments
      .filter((p) => p.status === "SUCCESS")
      .reduce((sum, p) => sum + Number(p.amount), 0)
  const pendingOf = (a: (typeof assignments)[number]) =>
    a.payments
      .filter((p) => p.status === "PENDING_VERIFICATION")
      .reduce((sum, p) => sum + Number(p.amount), 0)

  // Group by student for guardian view
  if (role === "GUARDIAN" && studentIds.length > 1) {
    // Show all children's fees together
    const allAssignments = assignments.map((a) => ({
      id: a.id,
      feeStructureName: `${studentNameMap[a.studentId] || ""} — ${a.feeStructure?.name || "-"}`,
      academicYear: a.academicYear,
      finalAmount: Number(a.finalAmount),
      totalDiscount: Number(a.totalDiscount),
      paidAmount: paidOf(a),
      pendingAmount: pendingOf(a),
      status: a.status,
      payments: toPayments(a),
    }))

    const childNames = Object.values(studentNameMap).join(", ")

    return (
      <div className="space-y-6">
        {banner}
        <MyFees
          studentName={childNames}
          assignments={allAssignments}
          lang={lang}
          currency={currency}
          schoolName={school?.name}
          dictionary={dictionary?.finance?.fees?.myFees}
          methods={methods}
          gatewayDictionary={fees?.gateways}
          manualRailDictionary={fees?.manualRail}
        />
      </div>
    )
  }

  // Single student view
  const studentName = studentNameMap[studentIds[0]] || "Student"
  const data = assignments.map((a) => ({
    id: a.id,
    feeStructureName: a.feeStructure?.name || "-",
    academicYear: a.academicYear,
    finalAmount: Number(a.finalAmount),
    totalDiscount: Number(a.totalDiscount),
    paidAmount: paidOf(a),
    pendingAmount: pendingOf(a),
    status: a.status,
    payments: toPayments(a),
  }))

  return (
    <div className="space-y-6">
      {banner}
      <MyFees
        studentName={studentName}
        assignments={data}
        lang={lang}
        currency={currency}
        schoolName={school?.name}
        dictionary={dictionary?.finance?.fees?.myFees}
        methods={methods}
        gatewayDictionary={fees?.gateways}
        manualRailDictionary={fees?.manualRail}
      />
    </div>
  )
}
