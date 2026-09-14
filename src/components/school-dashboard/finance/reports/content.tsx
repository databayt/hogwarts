// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import {
  BarChart,
  Calendar,
  Download,
  FileBarChart,
  PieChart,
  TrendingUp,
} from "lucide-react"

import { db } from "@/lib/db"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { resolveFinanceAccess } from "../guard"

interface Props {
  dictionary: Dictionary
  lang: Locale
}

/** Every action this page gates on. The overview renders no export control,
 *  so "export" is not resolved here — the export routes gate themselves. */
const REPORTS_ACTIONS = ["view"] as const

export default async function ReportsContent({ dictionary, lang }: Props) {
  const fd = (dictionary as any)?.finance
  const rp = fd?.reportsPage as Record<string, string> | undefined
  const c = fd?.common as Record<string, string> | undefined
  // One tenant + session resolution, then both permissions concurrently.
  const { schoolId, can } = await resolveFinanceAccess(
    "reports",
    REPORTS_ACTIONS
  )

  if (!schoolId) {
    return (
      <div>
        <p className="text-muted-foreground">
          {c?.schoolNotFound || "School context not found"}
        </p>
      </div>
    )
  }

  const { view: canView } = can

  // If user can't view reports, show empty state
  if (!canView) {
    return (
      <div>
        <p className="text-muted-foreground">
          {c?.noPermissionReports ||
            "You don't have permission to view reports"}
        </p>
      </div>
    )
  }

  let reportsCount = 0
  let generatedReportsCount = 0

  try {
    ;[reportsCount, generatedReportsCount] = await Promise.all([
      db.financialReport.count({ where: { schoolId } }),
      db.financialReport.count({ where: { schoolId, status: "COMPLETED" } }),
    ])
  } catch (error) {
    console.error("Error fetching report stats:", error)
  }

  const d = dictionary?.finance?.reports

  return (
    <div className="space-y-6">
      <div className="max-md:bg-border grid gap-4 max-md:grid-cols-2 max-md:gap-px max-md:overflow-hidden max-md:rounded-xl md:grid-cols-4 max-md:[&>*:last-child:nth-child(odd)]:col-span-2">
        <Card className="max-md:bg-muted max-md:h-full max-md:rounded-none max-md:border-0 max-md:shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 max-md:px-4 max-md:pt-4 max-md:pb-1">
            <CardTitle className="max-md:text-muted-foreground text-sm font-medium max-md:line-clamp-1 max-md:text-xs max-md:font-normal">
              {rp?.generatedReports || "Generated Reports"}
            </CardTitle>
            <FileBarChart className="text-muted-foreground h-4 w-4 max-md:hidden" />
          </CardHeader>
          <CardContent className="max-md:px-4 max-md:pb-4">
            <div className="text-2xl font-bold max-md:text-lg max-md:leading-7 max-md:font-bold max-md:tabular-nums">
              {generatedReportsCount}
            </div>
            <p className="text-muted-foreground text-xs max-md:line-clamp-2 max-md:leading-4">
              {reportsCount} {c?.total || "total"}
            </p>
          </CardContent>
        </Card>

        <Card className="max-md:bg-muted max-md:h-full max-md:rounded-none max-md:border-0 max-md:shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 max-md:px-4 max-md:pt-4 max-md:pb-1">
            <CardTitle className="max-md:text-muted-foreground text-sm font-medium max-md:line-clamp-1 max-md:text-xs max-md:font-normal">
              {rp?.reportTypes || "Report Types"}
            </CardTitle>
            <BarChart className="text-muted-foreground h-4 w-4 max-md:hidden" />
          </CardHeader>
          <CardContent className="max-md:px-4 max-md:pb-4">
            {/* Three financial statements are actually implemented and
                navigable: balance sheet, profit & loss, trial balance. */}
            <div className="text-2xl font-bold max-md:text-lg max-md:leading-7 max-md:font-bold max-md:tabular-nums">
              3
            </div>
            <p className="text-muted-foreground text-xs max-md:line-clamp-2 max-md:leading-4">
              {rp?.availableReports || "Available reports"}
            </p>
          </CardContent>
        </Card>

        <Card className="max-md:bg-muted max-md:h-full max-md:rounded-none max-md:border-0 max-md:shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 max-md:px-4 max-md:pt-4 max-md:pb-1">
            <CardTitle className="max-md:text-muted-foreground text-sm font-medium max-md:line-clamp-1 max-md:text-xs max-md:font-normal">
              {rp?.scheduled || "Scheduled"}
            </CardTitle>
            <Calendar className="text-muted-foreground h-4 w-4 max-md:hidden" />
          </CardHeader>
          <CardContent className="max-md:px-4 max-md:pb-4">
            <div className="text-2xl font-bold max-md:text-lg max-md:leading-7 max-md:font-bold max-md:tabular-nums">
              -
            </div>
            <p className="text-muted-foreground text-xs max-md:line-clamp-2 max-md:leading-4">
              {rp?.automatedReports || "Automated reports"}
            </p>
          </CardContent>
        </Card>

        <Card className="max-md:bg-muted max-md:h-full max-md:rounded-none max-md:border-0 max-md:shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 max-md:px-4 max-md:pt-4 max-md:pb-1">
            <CardTitle className="max-md:text-muted-foreground text-sm font-medium max-md:line-clamp-1 max-md:text-xs max-md:font-normal">
              {rp?.exports || "Exports"}
            </CardTitle>
            <Download className="text-muted-foreground h-4 w-4 max-md:hidden" />
          </CardHeader>
          <CardContent className="max-md:px-4 max-md:pb-4">
            <div className="text-2xl font-bold max-md:text-lg max-md:leading-7 max-md:font-bold max-md:tabular-nums">
              -
            </div>
            <p className="text-muted-foreground text-xs max-md:line-clamp-2 max-md:leading-4">
              {rp?.pdfExcelCsv || "PDF, Excel, CSV"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 max-md:gap-3 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-primary/20 max-md:bg-muted max-md:border-0 max-md:shadow-none">
          <CardHeader className="max-md:p-5 max-md:pb-3">
            <CardTitle className="flex items-center gap-2 max-md:text-base">
              <TrendingUp className="text-primary h-5 w-5" />
              {rp?.profitLoss || "Profit & Loss Statement"}
            </CardTitle>
            <CardDescription>
              {rp?.profitLossDesc ||
                "Income statement showing revenue and expenses"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 max-md:flex max-md:flex-wrap max-md:gap-2 max-md:space-y-0 max-md:px-5 max-md:pb-5 max-md:[&>*]:h-10 max-md:[&>*]:w-auto max-md:[&>*]:rounded-full max-md:[&>*]:px-5">
            <Button asChild className="w-full">
              <Link href={`/${lang}/finance/reports/profit-loss`}>
                {c?.generateReport || "Generate Report"}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="max-md:bg-muted max-md:border-0 max-md:shadow-none">
          <CardHeader className="max-md:p-5 max-md:pb-3">
            <CardTitle className="flex items-center gap-2 max-md:text-base">
              <BarChart className="h-5 w-5" />
              {rp?.balanceSheet || "Balance Sheet"}
            </CardTitle>
            <CardDescription>
              {rp?.balanceSheetDesc ||
                "Assets, liabilities, and equity statement"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 max-md:flex max-md:flex-wrap max-md:gap-2 max-md:space-y-0 max-md:px-5 max-md:pb-5 max-md:[&>*]:h-10 max-md:[&>*]:w-auto max-md:[&>*]:rounded-full max-md:[&>*]:px-5">
            <Button asChild className="w-full">
              <Link href={`/${lang}/finance/reports/balance-sheet`}>
                {c?.generateReport || "Generate Report"}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="max-md:bg-muted max-md:border-0 max-md:shadow-none">
          <CardHeader className="max-md:p-5 max-md:pb-3">
            <CardTitle className="flex items-center gap-2 max-md:text-base">
              <BarChart className="h-5 w-5" />
              {rp?.trialBalance || "Trial Balance"}
            </CardTitle>
            <CardDescription>
              {rp?.trialBalanceDesc ||
                "List of all accounts with debit/credit balances"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 max-md:flex max-md:flex-wrap max-md:gap-2 max-md:space-y-0 max-md:px-5 max-md:pb-5 max-md:[&>*]:h-10 max-md:[&>*]:w-auto max-md:[&>*]:rounded-full max-md:[&>*]:px-5">
            <Button asChild className="w-full">
              <Link href={`/${lang}/finance/reports/trial-balance`}>
                {c?.generateReport || "Generate Report"}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="max-md:bg-muted max-md:border-0 max-md:shadow-none">
          <CardHeader className="max-md:p-5 max-md:pb-3">
            <CardTitle className="flex items-center gap-2 max-md:text-base">
              <FileBarChart className="h-5 w-5" />
              {rp?.allReports || "All Reports"}
            </CardTitle>
            <CardDescription>
              {rp?.allReportsDesc || "View and manage all generated reports"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 max-md:flex max-md:flex-wrap max-md:gap-2 max-md:space-y-0 max-md:px-5 max-md:pb-5 max-md:[&>*]:h-10 max-md:[&>*]:w-auto max-md:[&>*]:rounded-full max-md:[&>*]:px-5">
            <Button asChild className="w-full">
              <Link href={`/${lang}/finance/reports/all`}>
                {(rp?.viewAllCount || "View All ({count})").replace(
                  "{count}",
                  String(reportsCount)
                )}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
