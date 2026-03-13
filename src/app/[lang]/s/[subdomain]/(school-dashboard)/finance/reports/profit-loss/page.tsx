// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type Locale } from "@/components/internationalization/config"
import { generateIncomeStatement } from "@/components/school-dashboard/finance/reports/actions"
import type { IncomeStatementData } from "@/components/school-dashboard/finance/reports/types"

export const metadata = { title: "Profit & Loss" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function ProfitLossPage({ params }: Props) {
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
          <h3 className="text-lg font-medium">Profit &amp; Loss</h3>
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

  const result = await generateIncomeStatement(
    fiscalYear.startDate,
    fiscalYear.endDate
  )

  if (!result.success || !result.data) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Profit &amp; Loss</h3>
          <Link
            href={`/${lang}/finance/reports`}
            className={buttonVariants({ variant: "outline" })}
          >
            Back to Reports
          </Link>
        </div>
        <p className="text-destructive py-8 text-center">
          {result.error ?? "Failed to generate income statement."}
        </p>
      </div>
    )
  }

  const data = result.data as IncomeStatementData
  const isProfit = data.netIncome >= 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Profit &amp; Loss</h3>
          <p className="text-muted-foreground text-sm">
            {fiscalYear.name} &mdash;{" "}
            {new Date(data.startDate).toLocaleDateString()} to{" "}
            {new Date(data.endDate).toLocaleDateString()}
          </p>
        </div>
        <Link
          href={`/${lang}/finance/reports`}
          className={buttonVariants({ variant: "outline" })}
        >
          Back to Reports
        </Link>
      </div>

      {/* Revenue */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          {data.revenue.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No revenue accounts.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b text-left">
                  <th className="pb-2">Code</th>
                  <th className="pb-2">Account</th>
                  <th className="pb-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.revenue.map((r) => (
                  <tr key={r.accountCode} className="border-b last:border-0">
                    <td className="py-2 font-mono">{r.accountCode}</td>
                    <td className="py-2">{r.accountName}</td>
                    <td className="py-2 text-right">
                      $
                      {r.balance.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
                <tr className="font-medium">
                  <td className="pt-2" colSpan={2}>
                    Total Revenue
                  </td>
                  <td className="pt-2 text-right">
                    $
                    {data.totalRevenue.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Expenses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {data.expenses.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No expense accounts.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b text-left">
                  <th className="pb-2">Code</th>
                  <th className="pb-2">Account</th>
                  <th className="pb-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.expenses.map((e) => (
                  <tr key={e.accountCode} className="border-b last:border-0">
                    <td className="py-2 font-mono">{e.accountCode}</td>
                    <td className="py-2">{e.accountName}</td>
                    <td className="py-2 text-right">
                      $
                      {e.balance.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
                <tr className="font-medium">
                  <td className="pt-2" colSpan={2}>
                    Total Expenses
                  </td>
                  <td className="pt-2 text-right">
                    $
                    {data.totalExpenses.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Net Income Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Net Income</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-2xl font-bold">
                $
                {data.netIncome.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </p>
              <p className="text-muted-foreground text-sm">
                Revenue $
                {data.totalRevenue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}{" "}
                &minus; Expenses $
                {data.totalExpenses.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
            <Badge variant={isProfit ? "default" : "destructive"}>
              {isProfit ? "Profit" : "Loss"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
