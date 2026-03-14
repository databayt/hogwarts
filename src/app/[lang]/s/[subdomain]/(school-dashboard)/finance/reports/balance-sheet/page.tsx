// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"

import { db } from "@/lib/db"
import { formatCurrency, formatDate } from "@/lib/i18n-format"
import { getTenantContext } from "@/lib/tenant-context"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type Locale } from "@/components/internationalization/config"
import { generateBalanceSheet } from "@/components/school-dashboard/finance/reports/actions"
import type { BalanceSheetData } from "@/components/school-dashboard/finance/reports/types"

export const metadata = { title: "Balance Sheet" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function BalanceSheetPage({ params }: Props) {
  const { lang } = await params
  const { schoolId } = await getTenantContext()

  if (!schoolId) {
    return <p className="text-muted-foreground">School context not found</p>
  }

  const fiscalYear = await db.fiscalYear.findFirst({
    where: { schoolId, isCurrent: true },
  })

  if (!fiscalYear) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Balance Sheet</h3>
          <Link
            href={`/${lang}/finance/reports`}
            className={buttonVariants({ variant: "outline" })}
          >
            Back to Reports
          </Link>
        </div>
        <p className="text-muted-foreground py-8 text-center">
          No active fiscal year found. Please set up a fiscal year first.
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
          <h3 className="text-lg font-medium">Balance Sheet</h3>
          <Link
            href={`/${lang}/finance/reports`}
            className={buttonVariants({ variant: "outline" })}
          >
            Back to Reports
          </Link>
        </div>
        <p className="text-destructive py-8 text-center">
          {result.error ?? "Failed to generate balance sheet."}
        </p>
      </div>
    )
  }

  const data = result.data as BalanceSheetData

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Balance Sheet</h3>
          <p className="text-muted-foreground text-sm">
            {fiscalYear.name} &mdash; As of {formatDate(data.asOfDate, lang)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={data.isBalanced ? "default" : "destructive"}>
            {data.isBalanced ? "Balanced" : "Unbalanced"}
          </Badge>
          <Link
            href={`/${lang}/finance/reports`}
            className={buttonVariants({ variant: "outline" })}
          >
            Back to Reports
          </Link>
        </div>
      </div>

      {/* Assets */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Assets</CardTitle>
        </CardHeader>
        <CardContent>
          {data.assets.length === 0 ? (
            <p className="text-muted-foreground text-sm">No asset accounts.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b text-start">
                  <th className="pb-2">Code</th>
                  <th className="pb-2">Account</th>
                  <th className="pb-2 text-end">Balance</th>
                </tr>
              </thead>
              <tbody>
                {data.assets.map((a) => (
                  <tr key={a.accountCode} className="border-b last:border-0">
                    <td className="py-2 font-mono">{a.accountCode}</td>
                    <td className="py-2">{a.accountName}</td>
                    <td className="py-2 text-end">
                      {formatCurrency(a.balance, lang)}
                    </td>
                  </tr>
                ))}
                <tr className="font-medium">
                  <td className="pt-2" colSpan={2}>
                    Total Assets
                  </td>
                  <td className="pt-2 text-end">
                    {formatCurrency(data.totalAssets, lang)}
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
          <CardTitle className="text-sm font-medium">Liabilities</CardTitle>
        </CardHeader>
        <CardContent>
          {data.liabilities.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No liability accounts.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b text-start">
                  <th className="pb-2">Code</th>
                  <th className="pb-2">Account</th>
                  <th className="pb-2 text-end">Balance</th>
                </tr>
              </thead>
              <tbody>
                {data.liabilities.map((l) => (
                  <tr key={l.accountCode} className="border-b last:border-0">
                    <td className="py-2 font-mono">{l.accountCode}</td>
                    <td className="py-2">{l.accountName}</td>
                    <td className="py-2 text-end">
                      {formatCurrency(l.balance, lang)}
                    </td>
                  </tr>
                ))}
                <tr className="font-medium">
                  <td className="pt-2" colSpan={2}>
                    Total Liabilities
                  </td>
                  <td className="pt-2 text-end">
                    {formatCurrency(data.totalLiabilities, lang)}
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
          <CardTitle className="text-sm font-medium">Equity</CardTitle>
        </CardHeader>
        <CardContent>
          {data.equity.length === 0 ? (
            <p className="text-muted-foreground text-sm">No equity accounts.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b text-start">
                  <th className="pb-2">Code</th>
                  <th className="pb-2">Account</th>
                  <th className="pb-2 text-end">Balance</th>
                </tr>
              </thead>
              <tbody>
                {data.equity.map((e) => (
                  <tr key={e.accountCode} className="border-b last:border-0">
                    <td className="py-2 font-mono">{e.accountCode}</td>
                    <td className="py-2">{e.accountName}</td>
                    <td className="py-2 text-end">
                      {formatCurrency(e.balance, lang)}
                    </td>
                  </tr>
                ))}
                <tr className="font-medium">
                  <td className="pt-2" colSpan={2}>
                    Total Equity
                  </td>
                  <td className="pt-2 text-end">
                    {formatCurrency(data.totalEquity, lang)}
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
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(data.totalAssets, lang)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Liabilities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(data.totalLiabilities, lang)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Equity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(data.totalEquity, lang)}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
