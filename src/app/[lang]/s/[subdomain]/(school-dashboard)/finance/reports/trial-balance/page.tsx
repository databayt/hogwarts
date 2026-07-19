// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"
import Link from "next/link"

import { db } from "@/lib/db"
import { formatCurrency, formatDate } from "@/lib/i18n-format"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { FinanceAccessDenied } from "@/components/school-dashboard/finance/access-denied"
import { resolveFinanceAccess } from "@/components/school-dashboard/finance/guard"
import { generateTrialBalance } from "@/components/school-dashboard/finance/reports/actions"
import type { TrialBalanceData } from "@/components/school-dashboard/finance/reports/types"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return {
    title: dictionary?.finance?.reports?.trialBalance || "Trial Balance",
  }
}

export default async function TrialBalancePage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const d = dictionary?.finance?.reportsPage
  const { schoolId, can } = await resolveFinanceAccess("reports", ["view"])

  if (!schoolId) {
    return (
      <p className="text-muted-foreground">
        {dictionary?.finance?.common?.schoolNotFound ||
          "School context not found"}
      </p>
    )
  }

  if (!can.view) {
    return <FinanceAccessDenied dictionary={dictionary} module="reports" />
  }

  const [fiscalYear, schoolForCurrency] = await Promise.all([
    db.fiscalYear.findFirst({
      where: { schoolId, isCurrent: true },
      orderBy: { startDate: "desc" },
    }),
    db.school.findUnique({
      where: { id: schoolId },
      select: { currency: true },
    }),
  ])
  const currency = schoolForCurrency?.currency ?? "USD"

  if (!fiscalYear) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">
            {d?.trialBalance || "Trial Balance"}
          </h3>
          <Link
            href={`/${lang}/finance/reports`}
            className={buttonVariants({ variant: "outline" })}
          >
            {d?.backToReports || "Back to Reports"}
          </Link>
        </div>
        <p className="text-muted-foreground py-8 text-center">
          {d?.noActiveFiscalYear ||
            "No active fiscal year found. Please set up a fiscal year first."}
        </p>
      </div>
    )
  }

  const result = await generateTrialBalance(
    fiscalYear.startDate,
    fiscalYear.endDate
  )

  if (!result.success || !result.data) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">
            {d?.trialBalance || "Trial Balance"}
          </h3>
          <Link
            href={`/${lang}/finance/reports`}
            className={buttonVariants({ variant: "outline" })}
          >
            {d?.backToReports || "Back to Reports"}
          </Link>
        </div>
        <p className="text-destructive py-8 text-center">
          {result.error ??
            d?.failedGenerateTrialBalance ??
            "Failed to generate trial balance."}
        </p>
      </div>
    )
  }

  const data = result.data as TrialBalanceData

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">
            {d?.trialBalance || "Trial Balance"}
          </h3>
          <p className="text-muted-foreground text-sm">
            {fiscalYear?.name ?? d?.allPeriods ?? "All periods"} &mdash;{" "}
            {d?.asOf || "As of"} {formatDate(data.asOfDate, lang)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={data.isBalanced ? "default" : "destructive"}>
            {data.isBalanced
              ? d?.balanced || "Balanced"
              : d?.unbalanced || "Unbalanced"}
          </Badge>
          <Link
            href={`/${lang}/finance/reports`}
            className={buttonVariants({ variant: "outline" })}
          >
            {d?.backToReports || "Back to Reports"}
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            {d?.accountBalances || "Account Balances"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.accounts.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              {d?.noAccountBalances || "No account balances found."}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b text-start">
                  <th className="pb-2">{d?.code || "Code"}</th>
                  <th className="pb-2">{d?.account || "Account"}</th>
                  <th className="pb-2">{d?.type || "Type"}</th>
                  <th className="pb-2 text-end">{d?.debit || "Debit"}</th>
                  <th className="pb-2 text-end">{d?.credit || "Credit"}</th>
                </tr>
              </thead>
              <tbody>
                {data.accounts.map((a) => (
                  <tr key={a.accountCode} className="border-b last:border-0">
                    <td className="py-2 font-mono">{a.accountCode}</td>
                    <td className="py-2">{a.accountName}</td>
                    <td className="py-2">
                      <Badge variant="secondary" className="text-xs">
                        {a.accountType}
                      </Badge>
                    </td>
                    <td className="py-2 text-end">
                      {a.debitBalance > 0
                        ? formatCurrency(a.debitBalance, lang, currency)
                        : "\u2014"}
                    </td>
                    <td className="py-2 text-end">
                      {a.creditBalance > 0
                        ? formatCurrency(a.creditBalance, lang, currency)
                        : "\u2014"}
                    </td>
                  </tr>
                ))}
                <tr className="font-medium">
                  <td className="pt-2" colSpan={3}>
                    {d?.totals || "Totals"}
                  </td>
                  <td className="pt-2 text-end">
                    {formatCurrency(data.totalDebits, lang, currency)}
                  </td>
                  <td className="pt-2 text-end">
                    {formatCurrency(data.totalCredits, lang, currency)}
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {d?.totalDebits || "Total Debits"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(data.totalDebits, lang, currency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {d?.totalCredits || "Total Credits"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(data.totalCredits, lang, currency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {d?.difference || "Difference"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(
                Math.abs(data.totalDebits - data.totalCredits),
                lang,
                currency
              )}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
