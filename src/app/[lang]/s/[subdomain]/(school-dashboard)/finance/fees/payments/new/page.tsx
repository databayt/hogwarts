// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { FinanceAccessDenied } from "@/components/school-dashboard/finance/access-denied"
import PaymentForm from "@/components/school-dashboard/finance/fees/payment-form"
import {
  getFeeCurrency,
  getPayableAssignments,
} from "@/components/school-dashboard/finance/fees/queries"
import { toPayableRows } from "@/components/school-dashboard/finance/fees/rows"
import { resolveFinanceAccess } from "@/components/school-dashboard/finance/guard"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
  searchParams: Promise<{ assignment?: string | string[] }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return {
    title: dictionary?.finance?.feesPage?.recordPayment || "Record Payment",
  }
}

export default async function RecordPaymentPage({
  params,
  searchParams,
}: Props) {
  const [{ lang }, sp] = await Promise.all([params, searchParams])
  const dictionary = await getDictionary(lang)
  const { schoolId, can } = await resolveFinanceAccess("fees", ["view"])

  if (!schoolId) {
    return (
      <p className="text-muted-foreground">
        {dictionary?.finance?.common?.schoolNotFound ||
          "School context not found"}
      </p>
    )
  }

  if (!can.view) {
    return <FinanceAccessDenied dictionary={dictionary} module="fees" />
  }

  // The newest payable assignments; the picker searches the rest on the
  // server. `?assignment=` (the assignments table's "Record payment") arrives
  // preselected.
  const preselectedId =
    typeof sp.assignment === "string" ? sp.assignment : undefined
  const [rows, currency] = await Promise.all([
    getPayableAssignments(schoolId, { includeId: preselectedId }),
    getFeeCurrency(schoolId),
  ])
  const assignments = await toPayableRows(rows, lang, schoolId)

  return (
    <PaymentForm
      lang={lang}
      assignments={assignments}
      currency={currency}
      preselectedId={
        assignments.some((a) => a.id === preselectedId)
          ? preselectedId
          : undefined
      }
    />
  )
}
