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
import { generateIncomeStatement } from "@/components/school-dashboard/finance/reports/actions"
import type { IncomeStatementData } from "@/components/school-dashboard/finance/reports/types"
import { getLabels } from "@/components/translation/person"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return {
    title: dictionary?.finance?.reports?.profitAndLoss || "Profit & Loss",
  }
}

export default async function ProfitLossPage({ params }: Props) {
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
            {d?.profitLoss || "Profit & Loss"}
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

  const result = await generateIncomeStatement(
    fiscalYear.startDate,
    fiscalYear.endDate
  )

  if (!result.success || !result.data) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">
            {d?.profitLoss || "Profit & Loss"}
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
            d?.failedGenerateIncomeStatement ??
              "Failed to generate income statement."
          )}
        </p>
      </div>
    )
  }

  const data = result.data as IncomeStatementData

  const names = await getLabels(
    [...data.revenue, ...data.expenses].map((a) => a.accountName),
    lang,
    schoolId
  )
  const nameOf = (a: { accountName: string }) =>
    names.get(a.accountName) ?? a.accountName
  const isProfit = data.netIncome >= 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">
            {d?.profitLoss || "Profit & Loss"}
          </h3>
          <p className="text-muted-foreground text-sm">
            {fiscalYear.name} &mdash; {formatDate(data.startDate, lang)}{" "}
            {d?.to || "to"} {formatDate(data.endDate, lang)}
          </p>
        </div>
        <Link
          href={`/${lang}/finance/reports`}
          className={buttonVariants({ variant: "outline" })}
        >
          {d?.backToReports || "Back to Reports"}
        </Link>
      </div>

      {/* Revenue */}
      <Card className="max-md:bg-muted max-md:border-0 max-md:shadow-none">
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            {d?.revenue || "Revenue"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.revenue.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {d?.noRevenueAccounts || "No revenue accounts."}
            </p>
          ) : (
            <>
              <div className="hidden md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground border-b text-start">
                      <th className="pb-2">{d?.code || "Code"}</th>
                      <th className="pb-2">{d?.account || "Account"}</th>
                      <th className="pb-2 text-end">{d?.amount || "Amount"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.revenue.map((r) => (
                      <tr
                        key={r.accountCode}
                        className="border-b last:border-0"
                      >
                        <td className="py-2 font-mono">{r.accountCode}</td>
                        <td className="py-2">{nameOf(r)}</td>
                        <td className="py-2 text-end">
                          {formatCurrency(r.balance, lang, currency)}
                        </td>
                      </tr>
                    ))}
                    <tr className="font-medium">
                      <td className="pt-2" colSpan={2}>
                        {d?.totalRevenue || "Total Revenue"}
                      </td>
                      <td className="pt-2 text-end">
                        {formatCurrency(data.totalRevenue, lang, currency)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {/* Phone: readable label/amount rows instead of a 3-column
                  table that wrapped account names to 2-3 lines. */}
              <div className="divide-y md:hidden">
                {data.revenue.map((r) => (
                  <div
                    key={r.accountCode}
                    className="flex items-center justify-between gap-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate">{nameOf(r)}</p>
                      <p className="text-muted-foreground font-mono text-xs">
                        {r.accountCode}
                      </p>
                    </div>
                    <p className="shrink-0 tabular-nums">
                      {formatCurrency(r.balance, lang, currency)}
                    </p>
                  </div>
                ))}
                <div className="flex items-center justify-between gap-3 py-2 font-medium">
                  <p>{d?.totalRevenue || "Total Revenue"}</p>
                  <p className="shrink-0 tabular-nums">
                    {formatCurrency(data.totalRevenue, lang, currency)}
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Expenses */}
      <Card className="max-md:bg-muted max-md:border-0 max-md:shadow-none">
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            {d?.expenses || "Expenses"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.expenses.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {d?.noExpenseAccounts || "No expense accounts."}
            </p>
          ) : (
            <>
              <div className="hidden md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground border-b text-start">
                      <th className="pb-2">{d?.code || "Code"}</th>
                      <th className="pb-2">{d?.account || "Account"}</th>
                      <th className="pb-2 text-end">{d?.amount || "Amount"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.expenses.map((e) => (
                      <tr
                        key={e.accountCode}
                        className="border-b last:border-0"
                      >
                        <td className="py-2 font-mono">{e.accountCode}</td>
                        <td className="py-2">{nameOf(e)}</td>
                        <td className="py-2 text-end">
                          {formatCurrency(e.balance, lang, currency)}
                        </td>
                      </tr>
                    ))}
                    <tr className="font-medium">
                      <td className="pt-2" colSpan={2}>
                        {d?.totalExpenses || "Total Expenses"}
                      </td>
                      <td className="pt-2 text-end">
                        {formatCurrency(data.totalExpenses, lang, currency)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="divide-y md:hidden">
                {data.expenses.map((e) => (
                  <div
                    key={e.accountCode}
                    className="flex items-center justify-between gap-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate">{nameOf(e)}</p>
                      <p className="text-muted-foreground font-mono text-xs">
                        {e.accountCode}
                      </p>
                    </div>
                    <p className="shrink-0 tabular-nums">
                      {formatCurrency(e.balance, lang, currency)}
                    </p>
                  </div>
                ))}
                <div className="flex items-center justify-between gap-3 py-2 font-medium">
                  <p>{d?.totalExpenses || "Total Expenses"}</p>
                  <p className="shrink-0 tabular-nums">
                    {formatCurrency(data.totalExpenses, lang, currency)}
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Net Income Summary */}
      <Card className="max-md:bg-muted max-md:border-0 max-md:shadow-none">
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            {d?.netIncome || "Net Income"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between max-md:flex-wrap max-md:gap-2">
            <div className="space-y-1">
              <p className="text-2xl font-bold max-md:text-lg max-md:leading-7 max-md:tabular-nums">
                {formatCurrency(data.netIncome, lang, currency)}
              </p>
              <p className="text-muted-foreground text-sm max-md:text-xs">
                {d?.revenue || "Revenue"}{" "}
                {formatCurrency(data.totalRevenue, lang, currency)} &minus;{" "}
                {d?.expenses || "Expenses"}{" "}
                {formatCurrency(data.totalExpenses, lang, currency)}
              </p>
            </div>
            <Badge variant={isProfit ? "default" : "destructive"}>
              {isProfit ? d?.profitLabel || "Profit" : d?.lossLabel || "Loss"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
