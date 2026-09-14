// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"
import Link from "next/link"

import { db } from "@/lib/db"
import { formatCurrency, formatDate } from "@/lib/i18n-format"
import { actionErrorMessage } from "@/lib/resolve-action-error"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { FinanceAccessDenied } from "@/components/school-dashboard/finance/access-denied"
import { resolveFinanceAccess } from "@/components/school-dashboard/finance/guard"
import { generateTrialBalance } from "@/components/school-dashboard/finance/reports/actions"
import type { TrialBalanceData } from "@/components/school-dashboard/finance/reports/types"
import { getLabels } from "@/components/translation/person"

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
  // Existing key, already used the same way by accounts/chart and
  // accounts/ledger — translates the raw ASSET/LIABILITY/... enum.
  const acctTypeLabels = dictionary?.finance?.accountsConfig?.accountTypeLabels
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
            className={cn(
              buttonVariants({ variant: "outline" }),
              "max-md:rounded-full"
            )}
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
            className={cn(
              buttonVariants({ variant: "outline" }),
              "max-md:rounded-full"
            )}
          >
            {d?.backToReports || "Back to Reports"}
          </Link>
        </div>
        <p className="text-destructive py-8 text-center">
          {actionErrorMessage(
            result.error,
            dictionary,
            d?.failedGenerateTrialBalance ?? "Failed to generate trial balance."
          )}
        </p>
      </div>
    )
  }

  const data = result.data as TrialBalanceData

  const names = await getLabels(
    data.accounts.map((a) => a.accountName),
    lang,
    schoolId
  )

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
            className={cn(
              buttonVariants({ variant: "outline" }),
              "max-md:rounded-full"
            )}
          >
            {d?.backToReports || "Back to Reports"}
          </Link>
        </div>
      </div>

      <Card className="max-md:bg-muted max-md:border-0 max-md:shadow-none">
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
            <>
              <div className="hidden md:block">
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
                      <tr
                        key={a.accountCode}
                        className="border-b last:border-0"
                      >
                        <td className="py-2 font-mono">{a.accountCode}</td>
                        <td className="py-2">
                          {names.get(a.accountName) ?? a.accountName}
                        </td>
                        <td className="py-2">
                          <Badge variant="secondary" className="text-xs">
                            {acctTypeLabels?.[a.accountType] ?? a.accountType}
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
              </div>
              {/* Phone: readable label/amount rows instead of a 5-column
                  table that wrapped account names to 2-3 lines. */}
              <div className="divide-y md:hidden">
                {data.accounts.map((a) => (
                  <div
                    key={a.accountCode}
                    className="flex items-start justify-between gap-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate">
                        {names.get(a.accountName) ?? a.accountName}
                      </p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <span className="text-muted-foreground font-mono text-xs">
                          {a.accountCode}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {acctTypeLabels?.[a.accountType] ?? a.accountType}
                        </Badge>
                      </div>
                    </div>
                    <div className="shrink-0 text-end text-xs">
                      {a.debitBalance > 0 && (
                        <p className="tabular-nums">
                          {d?.debit || "Debit"}:{" "}
                          {formatCurrency(a.debitBalance, lang, currency)}
                        </p>
                      )}
                      {a.creditBalance > 0 && (
                        <p className="tabular-nums">
                          {d?.credit || "Credit"}:{" "}
                          {formatCurrency(a.creditBalance, lang, currency)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between gap-3 py-2 font-medium">
                  <p>{d?.totals || "Totals"}</p>
                  <div className="shrink-0 text-end text-xs">
                    <p className="tabular-nums">
                      {d?.debit || "Debit"}:{" "}
                      {formatCurrency(data.totalDebits, lang, currency)}
                    </p>
                    <p className="tabular-nums">
                      {d?.credit || "Credit"}:{" "}
                      {formatCurrency(data.totalCredits, lang, currency)}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="max-md:bg-border grid gap-4 max-md:grid-cols-2 max-md:gap-px max-md:overflow-hidden max-md:rounded-xl sm:grid-cols-3 max-md:[&>*:last-child:nth-child(odd)]:col-span-2">
        <Card className="max-md:bg-muted max-md:h-full max-md:rounded-none max-md:border-0 max-md:shadow-none">
          <CardHeader className="pb-2 max-md:px-4 max-md:pt-4 max-md:pb-1">
            <CardTitle className="max-md:text-muted-foreground text-sm font-medium max-md:line-clamp-1 max-md:text-xs max-md:font-normal">
              {d?.totalDebits || "Total Debits"}
            </CardTitle>
          </CardHeader>
          <CardContent className="max-md:px-4 max-md:pb-4">
            <p className="text-2xl font-bold max-md:text-base max-md:leading-6">
              {formatCurrency(data.totalDebits, lang, currency)}
            </p>
          </CardContent>
        </Card>
        <Card className="max-md:bg-muted max-md:h-full max-md:rounded-none max-md:border-0 max-md:shadow-none">
          <CardHeader className="pb-2 max-md:px-4 max-md:pt-4 max-md:pb-1">
            <CardTitle className="max-md:text-muted-foreground text-sm font-medium max-md:line-clamp-1 max-md:text-xs max-md:font-normal">
              {d?.totalCredits || "Total Credits"}
            </CardTitle>
          </CardHeader>
          <CardContent className="max-md:px-4 max-md:pb-4">
            <p className="text-2xl font-bold max-md:text-base max-md:leading-6">
              {formatCurrency(data.totalCredits, lang, currency)}
            </p>
          </CardContent>
        </Card>
        <Card className="max-md:bg-muted max-md:h-full max-md:rounded-none max-md:border-0 max-md:shadow-none">
          <CardHeader className="pb-2 max-md:px-4 max-md:pt-4 max-md:pb-1">
            <CardTitle className="max-md:text-muted-foreground text-sm font-medium max-md:line-clamp-1 max-md:text-xs max-md:font-normal">
              {d?.difference || "Difference"}
            </CardTitle>
          </CardHeader>
          <CardContent className="max-md:px-4 max-md:pb-4">
            <p className="text-2xl font-bold max-md:text-base max-md:leading-6">
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
