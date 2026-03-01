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
import { getTenantContext } from "@/lib/tenant-context"
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

import { checkCurrentUserPermission } from "../lib/permissions"

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function ReportsContent({ dictionary, lang }: Props) {
  const fd = (dictionary as any)?.finance
  const rp = fd?.reportsPage as Record<string, string> | undefined
  const c = fd?.common as Record<string, string> | undefined
  const { schoolId } = await getTenantContext()

  if (!schoolId) {
    return (
      <div>
        <p className="text-muted-foreground">
          {c?.schoolNotFound || "School context not found"}
        </p>
      </div>
    )
  }

  // Check permissions for current user
  const canView = await checkCurrentUserPermission(schoolId, "reports", "view")
  const canExport = await checkCurrentUserPermission(
    schoolId,
    "reports",
    "export"
  )

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

  if (schoolId) {
    try {
      ;[reportsCount, generatedReportsCount] = await Promise.all([
        db.financialReport.count({ where: { schoolId } }),
        db.financialReport.count({ where: { schoolId, status: "COMPLETED" } }),
      ])
    } catch (error) {
      console.error("Error fetching report stats:", error)
    }
  }

  const d = dictionary?.finance?.reports

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {rp?.generatedReports || "Generated Reports"}
            </CardTitle>
            <FileBarChart className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{generatedReportsCount}</div>
            <p className="text-muted-foreground text-xs">
              {reportsCount} {c?.total || "total"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {rp?.reportTypes || "Report Types"}
            </CardTitle>
            <BarChart className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-muted-foreground text-xs">
              {rp?.availableReports || "Available reports"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {rp?.scheduled || "Scheduled"}
            </CardTitle>
            <Calendar className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-muted-foreground text-xs">
              {rp?.automatedReports || "Automated reports"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {rp?.exports || "Exports"}
            </CardTitle>
            <Download className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-muted-foreground text-xs">
              {rp?.exportFormats || "PDF, Excel, CSV"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="text-primary h-5 w-5" />
              {rp?.profitLossStatement || "Profit & Loss Statement"}
            </CardTitle>
            <CardDescription>
              {rp?.incomeStatementDesc ||
                "Income statement showing revenue and expenses"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href={`/${lang}/finance/reports/profit-loss`}>
                {c?.generateReport || "Generate Report"}
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full" size="sm">
              <Link href={`/${lang}/finance/reports/profit-loss/history`}>
                {c?.viewHistory || "View History"}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              {rp?.balanceSheet || "Balance Sheet"}
            </CardTitle>
            <CardDescription>
              {rp?.assetsLiabilitiesEquity ||
                "Assets, liabilities, and equity statement"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href={`/${lang}/finance/reports/balance-sheet`}>
                {c?.generateReport || "Generate Report"}
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full" size="sm">
              <Link href={`/${lang}/finance/reports/balance-sheet/comparative`}>
                {rp?.comparative || "Comparative"}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {rp?.cashFlowStatement || "Cash Flow Statement"}
            </CardTitle>
            <CardDescription>
              {rp?.cashFlowDesc ||
                "Operating, investing, and financing cash flows"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href={`/${lang}/finance/reports/cash-flow`}>
                {c?.generateReport || "Generate Report"}
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full" size="sm">
              <Link href={`/${lang}/finance/reports/cash-flow/projection`}>
                {rp?.projection || "Projection"}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              {rp?.trialBalance || "Trial Balance"}
            </CardTitle>
            <CardDescription>
              {rp?.trialBalanceDesc ||
                "List of all accounts with debit/credit balances"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href={`/${lang}/finance/reports/trial-balance`}>
                {c?.generateReport || "Generate Report"}
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full" size="sm">
              <Link href={`/${lang}/finance/reports/trial-balance/adjusted`}>
                {rp?.adjusted || "Adjusted"}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              {rp?.revenueAnalysis || "Revenue Analysis"}
            </CardTitle>
            <CardDescription>
              {rp?.revenueAnalysisDesc ||
                "Detailed breakdown of revenue sources"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href={`/${lang}/finance/reports/revenue`}>
                {c?.generateReport || "Generate Report"}
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full" size="sm">
              <Link href={`/${lang}/finance/reports/revenue/trends`}>
                {rp?.trends || "Trends"}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {rp?.expenseAnalysis || "Expense Analysis"}
            </CardTitle>
            <CardDescription>
              {rp?.expenseAnalysisDesc ||
                "Detailed breakdown of expense categories"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href={`/${lang}/finance/reports/expense`}>
                {c?.generateReport || "Generate Report"}
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full" size="sm">
              <Link href={`/${lang}/finance/reports/expense/variance`}>
                {rp?.variance || "Variance"}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {rp?.customReports || "Custom Reports"}
            </CardTitle>
            <CardDescription>
              {rp?.buildCustomReports || "Build custom financial reports"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href={`/${lang}/finance/reports/custom`}>
                {rp?.createCustom || "Create Custom"}
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full" size="sm">
              <Link href={`/${lang}/finance/reports/custom/templates`}>
                {rp?.templates || "Templates"}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileBarChart className="h-5 w-5" />
              {rp?.allReports || "All Reports"}
            </CardTitle>
            <CardDescription>
              {rp?.viewManageReports || "View and manage all generated reports"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href={`/${lang}/finance/reports/all`}>
                View All ({reportsCount})
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full" size="sm">
              <Link href={`/${lang}/finance/reports/schedule`}>
                {rp?.scheduleReports || "Schedule Reports"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
