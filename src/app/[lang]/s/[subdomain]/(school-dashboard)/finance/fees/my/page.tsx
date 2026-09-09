// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { auth } from "@/auth"

import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { getFamilyMoney } from "@/components/school-dashboard/finance/family/queries"
import { MyFees } from "@/components/school-dashboard/finance/fees/my-fees"
import { PaymentReturnBanner } from "@/components/school-dashboard/finance/fees/payment-return-banner"

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

/**
 * The family's fee detail table.
 *
 * The overview at `/finance` and this page read the SAME resolver
 * (`getFamilyMoney`) — the two used to resolve students, assignments,
 * payments, currency and rails separately, which is how one surface can show a
 * family a balance the other disagrees with. This page keeps its table shape;
 * only where the numbers come from changed.
 */
export default async function MyFeesPage({ params, searchParams }: Props) {
  const [{ lang }, sp, session] = await Promise.all([
    params,
    searchParams,
    auth(),
  ])
  const dictionary = await getDictionary(lang)
  const role = session?.user?.role

  // Admin / accountant / staff have the full fees pipeline; this page is the
  // family's own. Kept as a redirect, not a 404, so an old link still lands.
  if (role !== "STUDENT" && role !== "GUARDIAN") {
    redirect(`/${lang}/finance/fees`)
  }

  const money = await getFamilyMoney(lang)
  if (!money) notFound()

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
  // the banner before anything reads as "paid". Families now return to
  // `/finance` after checkout, but this page still honours the params so an
  // in-flight redirect issued before that change still resolves truthfully.
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
        currency={money.currency}
        dictionary={fees?.paymentReturn}
      />
    ) : null

  // A guardian with more than one child reads the child's name on every row —
  // two children can carry the same fee name in the same year.
  const showStudent = money.studentNames.length > 1
  const assignments = money.fees.map((fee) => ({
    id: fee.id,
    feeStructureName: showStudent
      ? `${fee.studentName} — ${fee.feeName}`
      : fee.feeName,
    academicYear: fee.academicYear,
    finalAmount: fee.total,
    totalDiscount: fee.discount,
    paidAmount: fee.paid,
    pendingAmount: fee.pendingVerification,
    status: fee.status,
    payments: money.payments
      .filter((p) => p.feeAssignmentId === fee.id)
      .map((p) => ({
        id: p.id,
        paymentNumber: p.paymentNumber,
        receiptNumber: p.receiptNumber,
        amount: p.amount,
        paymentDate: p.paymentDate,
        paymentMethod: p.paymentMethod,
        status: p.status,
      })),
  }))

  return (
    <div className="space-y-6">
      {banner}
      <MyFees
        studentName={money.studentNames.join("، ")}
        assignments={assignments}
        lang={lang}
        currency={money.currency}
        schoolName={money.schoolName}
        dictionary={dictionary?.finance?.fees?.myFees}
        methods={money.methods}
        gatewayDictionary={fees?.gateways}
        manualRailDictionary={fees?.manualRail}
        totals={money.totals}
      />
    </div>
  )
}
