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
import { generateBalanceSheet } from "@/components/school-dashboard/finance/reports/actions"
import type { BalanceSheetData } from "@/components/school-dashboard/finance/reports/types"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return {
    title: dictionary?.finance?.reports?.balanceSheet || "Balance Sheet",
  }
}

export default async function BalanceSheetPage({ params }: Props) {
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
            {d?.balanceSheet || "Balance Sheet"}
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

  const result = await generateBalanceSheet(
    fiscalYear.startDate,
    fiscalYear.endDate
  )

  if (!result.success || !result.data) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">
            {d?.balanceSheet || "Balance Sheet"}
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
            d?.failedGenerateBalanceSheet ??
            "Failed to generate balance sheet."}
        </p>
      </div>
    )
  }

  const data = result.data as BalanceSheetData

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">
            {d?.balanceSheet || "Balance Sheet"}
          </h3>
          <p className="text-muted-foreground text-sm">
            {fiscalYear.name} &mdash; {d?.asOf || "As of"}{" "}
            {formatDate(data.asOfDate, lang)}
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

      {/* Assets */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            {d?.assets || "Assets"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.assets.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {d?.noAssetAccounts || "No asset accounts."}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b text-start">
                  <th className="pb-2">{d?.code || "Code"}</th>
                  <th className="pb-2">{d?.account || "Account"}</th>
                  <th className="pb-2 text-end">{d?.balance || "Balance"}</th>
                </tr>
              </thead>
              <tbody>
                {data.assets.map((a) => (
                  <tr key={a.accountCode} className="border-b last:border-0">
                    <td className="py-2 font-mono">{a.accountCode}</td>
                    <td className="py-2">{a.accountName}</td>
                    <td className="py-2 text-end">
                      {formatCurrency(a.balance, lang, currency)}
                    </td>
                  </tr>
                ))}
                <tr className="font-medium">
                  <td className="pt-2" colSpan={2}>
                    {d?.totalAssets || "Total Assets"}
                  </td>
                  <td className="pt-2 text-end">
                    {formatCurrency(data.totalAssets, lang, currency)}
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Liabilities */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            {d?.liabilities || "Liabilities"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.liabilities.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {d?.noLiabilityAccounts || "No liability accounts."}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b text-start">
                  <th className="pb-2">{d?.code || "Code"}</th>
                  <th className="pb-2">{d?.account || "Account"}</th>
                  <th className="pb-2 text-end">{d?.balance || "Balance"}</th>
                </tr>
              </thead>
              <tbody>
                {data.liabilities.map((l) => (
                  <tr key={l.accountCode} className="border-b last:border-0">
                    <td className="py-2 font-mono">{l.accountCode}</td>
                    <td className="py-2">{l.accountName}</td>
                    <td className="py-2 text-end">
                      {formatCurrency(l.balance, lang, currency)}
                    </td>
                  </tr>
                ))}
                <tr className="font-medium">
                  <td className="pt-2" colSpan={2}>
                    {d?.totalLiabilities || "Total Liabilities"}
                  </td>
                  <td className="pt-2 text-end">
                    {formatCurrency(data.totalLiabilities, lang, currency)}
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Equity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            {d?.equity || "Equity"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.equity.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {d?.noEquityAccounts || "No equity accounts."}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b text-start">
                  <th className="pb-2">{d?.code || "Code"}</th>
                  <th className="pb-2">{d?.account || "Account"}</th>
                  <th className="pb-2 text-end">{d?.balance || "Balance"}</th>
                </tr>
              </thead>
              <tbody>
                {data.equity.map((e) => (
                  <tr key={e.accountCode} className="border-b last:border-0">
                    <td className="py-2 font-mono">{e.accountCode}</td>
                    <td className="py-2">{e.accountName}</td>
                    <td className="py-2 text-end">
                      {formatCurrency(e.balance, lang, currency)}
                    </td>
                  </tr>
                ))}
                <tr className="font-medium">
                  <td className="pt-2" colSpan={2}>
                    {d?.totalEquity || "Total Equity"}
                  </td>
                  <td className="pt-2 text-end">
                    {formatCurrency(data.totalEquity, lang, currency)}
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {d?.totalAssets || "Total Assets"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(data.totalAssets, lang, currency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {d?.totalLiabilities || "Total Liabilities"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(data.totalLiabilities, lang, currency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {d?.totalEquity || "Total Equity"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(data.totalEquity, lang, currency)}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
