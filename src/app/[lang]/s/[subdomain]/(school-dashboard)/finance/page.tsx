// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"
import { auth } from "@/auth"

import type { Role } from "@/lib/rbac/types"
import { PageNav } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"
import FinanceContent from "@/components/school-dashboard/finance/content"
import FamilyFinanceContent from "@/components/school-dashboard/finance/family/content"
import { getFamilyMoney } from "@/components/school-dashboard/finance/family/queries"
import { PaymentReturnBanner } from "@/components/school-dashboard/finance/fees/payment-return-banner"
import { getFinanceRootTabs } from "@/components/school-dashboard/finance/permissions"

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
  return { title: dictionary?.finance?.title || "Dashboard: Finance" }
}

export default async function Page({ params, searchParams }: Props) {
  const [{ lang }, sp, session] = await Promise.all([
    params,
    searchParams,
    auth(),
  ])
  const dictionary = await getDictionary(lang)
  const d = dictionary?.finance
  const role = (session?.user?.role ?? null) as Role | null

  const financePages = getFinanceRootTabs(role, lang, d)

  // A family's /finance is its OWN money, not the school's books. The staff hub
  // below is gated on the reports permission, which a student or a guardian
  // will never hold — so before that gate is reached, resolve what this family
  // owes and render their surface instead. `getFamilyMoney` returns null for
  // anyone who is not a family with a resolvable student, which falls straight
  // through to the hub and its own gate. Nothing here widens a permission.
  const money =
    role === "STUDENT" || role === "GUARDIAN"
      ? await getFamilyMoney(lang)
      : null

  // Gateway redirect landing: `?payment=success|cancelled&assignment=…`
  // (+ `session_id` from Stripe, `tap_id` from Tap). Verified server-side by
  // the banner before anything reads as "paid". Mounted here because this is
  // where `createFeePaymentCheckout` now returns a family to.
  const payment = first(sp.payment)
  const returnAssignment = first(sp.assignment)
  const gatewayParam = first(sp.gateway)
  const banner =
    money && (payment === "success" || payment === "cancelled") && returnAssignment ? (
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
        dictionary={dictionary?.finance?.fees?.paymentReturn}
      />
    ) : null

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.title || "Finance"} />
      <PageNav pages={financePages} />
      {banner}
      {money ? (
        <FamilyFinanceContent
          dictionary={dictionary}
          lang={lang}
          money={money}
        />
      ) : (
        <FinanceContent dictionary={dictionary} lang={lang} />
      )}
    </div>
  )
}
