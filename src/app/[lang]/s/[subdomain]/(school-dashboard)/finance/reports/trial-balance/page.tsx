// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type Locale } from "@/components/internationalization/config"
import { generateTrialBalance } from "@/components/school-dashboard/finance/reports/actions"
import type { TrialBalanceData } from "@/components/school-dashboard/finance/reports/types"

export const metadata = { title: "Trial Balance" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function TrialBalancePage({ params }: Props) {
  const { lang } = await params
  const { schoolId } = await getTenantContext()

  if (!schoolId) {
    return <p className="text-muted-foreground">School context not found</p>
  }

  const fiscalYear = await db.fiscalYear.findFirst({
    where: { schoolId, isCurrent: true },
  })

  const result = await generateTrialBalance(fiscalYear?.id)

  if (!result.success || !result.data) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Trial Balance</h3>
          <Link
            href={`/${lang}/finance/reports`}
            className={buttonVariants({ variant: "outline" })}
          >
            Back to Reports
          </Link>
        </div>
        <p className="text-destructive py-8 text-center">
          {result.error ?? "Failed to generate trial balance."}
        </p>
      </div>
    )
  }

  const data = result.data as TrialBalanceData

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Trial Balance</h3>
          <p className="text-muted-foreground text-sm">
            {fiscalYear?.name ?? "All periods"} &mdash; As of{" "}
            {new Date(data.asOfDate).toLocaleDateString()}
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

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Account Balances
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.accounts.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              No account balances found.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b text-left">
                  <th className="pb-2">Code</th>
                  <th className="pb-2">Account</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2 text-right">Debit</th>
                  <th className="pb-2 text-right">Credit</th>
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
                    <td className="py-2 text-right">
                      {a.debitBalance > 0
                        ? `$${a.debitBalance.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}`
                        : "—"}
                    </td>
                    <td className="py-2 text-right">
                      {a.creditBalance > 0
                        ? `$${a.creditBalance.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}`
                        : "—"}
                    </td>
                  </tr>
                ))}
                <tr className="font-medium">
                  <td className="pt-2" colSpan={3}>
                    Totals
                  </td>
                  <td className="pt-2 text-right">
                    $
                    {data.totalDebits.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="pt-2 text-right">
                    $
                    {data.totalCredits.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
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
            <CardTitle className="text-sm font-medium">Total Debits</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              $
              {data.totalDebits.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              $
              {data.totalCredits.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Difference</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              $
              {Math.abs(data.totalDebits - data.totalCredits).toLocaleString(
                undefined,
                { minimumFractionDigits: 2 }
              )}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
