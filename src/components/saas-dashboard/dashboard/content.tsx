import React from "react"
import Link from "next/link"
import {
  AlertTriangle,
  DollarSign,
  TrendingDown,
  TrendingUp,
} from "lucide-react"

import { db } from "@/lib/db"
import { formatCurrency } from "@/lib/i18n-format"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type Locale } from "@/components/internationalization/config"
import { type Dictionary } from "@/components/internationalization/dictionaries"
import {
  calculateChurnRate,
  calculateMRR,
} from "@/components/saas-dashboard/analytics/actions"
import { AreaGraph } from "@/components/saas-dashboard/dashboard/area-graph"
import { BarGraph } from "@/components/saas-dashboard/dashboard/bar-graph"
import { MetricsCards } from "@/components/saas-dashboard/dashboard/metrics-cards"
import { PeriodSwitcher } from "@/components/saas-dashboard/dashboard/period-switcher"
import { PieGraph } from "@/components/saas-dashboard/dashboard/pie-graph"
import { RecentSales } from "@/components/saas-dashboard/dashboard/recent-sales"

interface DashboardContentProps {
  dictionary: Dictionary
  lang: Locale
}

export async function DashboardContent({
  dictionary,
  lang,
}: DashboardContentProps) {
  const [
    totalSchools,
    activeSchools,
    totalUsers,
    totalStudents,
    mrrData,
    churnData,
  ] = await Promise.all([
    db.school.count(),
    db.school.count({ where: { isActive: true } }),
    db.user.count(),
    db.student.count(),
    calculateMRR(),
    calculateChurnRate("30d"),
  ])

  const t = dictionary.operator

  return (
    <div className="flex flex-1 flex-col space-y-6">
      <div className="flex items-center justify-between space-y-2">
        <div className="flex items-center gap-2">
          <PeriodSwitcher />
        </div>
      </div>

      {/* Key Financial Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t.dashboard.monthlyRecurringRevenue}
            </CardTitle>
            <DollarSign className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(mrrData.currentMRR, lang)}
            </div>
            <div className="flex items-center gap-1 text-xs">
              {mrrData.growth >= 0 ? (
                <>
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">+{mrrData.growth}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3 text-red-600" />
                  <span className="text-red-600">{mrrData.growth}%</span>
                </>
              )}
              <span className="text-muted-foreground ms-1">
                {t.dashboard.vsLastMonth}
              </span>
            </div>
            <Link href={`/${lang}/analytics`}>
              <Button variant="link" size="sm" className="mt-2 h-auto p-0">
                {t.dashboard.viewAnalytics} →
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t.dashboard.annualRunRate}
            </CardTitle>
            <DollarSign className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(mrrData.currentMRR * 12, lang)}
            </div>
            <p className="text-muted-foreground text-xs">
              {t.dashboard.basedOnCurrentMRR}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t.dashboard.churnRate}
            </CardTitle>
            <AlertTriangle className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{churnData.churnRate}%</div>
            <p className="text-muted-foreground text-xs">
              {churnData.churned}{" "}
              {churnData.churned !== 1
                ? t.dashboard.schoolsChurned
                : t.dashboard.schoolChurned}
            </p>
          </CardContent>
        </Card>
      </div>

      <MetricsCards
        totals={{ totalSchools, activeSchools, totalUsers, totalStudents }}
      />
      <BarGraph />
      <RecentSales />
      <div className="flex w-full justify-between gap-6">
        <AreaGraph />
        <PieGraph />
      </div>
    </div>
  )
}
