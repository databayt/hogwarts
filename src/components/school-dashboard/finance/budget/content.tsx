// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import {
  BarChart,
  CircleCheck,
  DollarSign,
  PieChart,
  TrendingUp,
  TriangleAlert,
} from "lucide-react"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import {
  DashboardGrid,
  FeatureCard,
  formatCurrency,
  formatPercentage,
  StatsCard,
} from "../lib/dashboard-components"
import { checkCurrentUserPermission } from "../lib/permissions"

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function BudgetContent({ dictionary, lang }: Props) {
  const fd = (dictionary as any)?.finance
  const bp = fd?.budgetPage as Record<string, string> | undefined
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
  const canView = await checkCurrentUserPermission(schoolId, "budget", "view")
  const canCreate = await checkCurrentUserPermission(
    schoolId,
    "budget",
    "create"
  )
  const canPencil = await checkCurrentUserPermission(schoolId, "budget", "edit")
  const canApprove = await checkCurrentUserPermission(
    schoolId,
    "budget",
    "approve"
  )
  const canExport = await checkCurrentUserPermission(
    schoolId,
    "budget",
    "export"
  )

  // If user can't view budget, show empty state
  if (!canView) {
    return (
      <div>
        <p className="text-muted-foreground">
          {c?.noPermissionBudget || "You don't have permission to view budget"}
        </p>
      </div>
    )
  }

  let budgetsCount = 0
  let allocationsCount = 0
  let totalBudget = 0
  let totalSpent = 0

  if (schoolId) {
    try {
      ;[budgetsCount, allocationsCount] = await Promise.all([
        db.budget.count({ where: { schoolId, status: "ACTIVE" } }),
        db.budgetAllocation.count({ where: { schoolId } }),
      ])

      const [budgetAgg, spentAgg] = await Promise.all([
        db.budget.aggregate({
          where: { schoolId, status: "ACTIVE" },
          _sum: { totalAmount: true },
        }),
        db.budgetAllocation.aggregate({
          where: { schoolId },
          _sum: { spent: true },
        }),
      ])

      totalBudget = budgetAgg._sum?.totalAmount
        ? Number(budgetAgg._sum.totalAmount)
        : 0
      totalSpent = spentAgg._sum?.spent ? Number(spentAgg._sum.spent) : 0
    } catch (error) {
      console.error("Error fetching budget stats:", error)
    }
  }

  const variance = totalBudget - totalSpent
  const utilizationRate = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Stats Grid - Uses semantic HTML (h6, h2, small) */}
      <DashboardGrid type="stats">
        <StatsCard
          title={bp?.totalBudget || "Total Budget"}
          value={formatCurrency(totalBudget)}
          description={bp?.allocatedBudget || "Allocated budget"}
          icon={DollarSign}
        />
        <StatsCard
          title={bp?.spent || "Spent"}
          value={formatCurrency(totalSpent)}
          description={`${formatPercentage(utilizationRate)} utilization`}
          icon={TrendingUp}
        />
        <StatsCard
          title={bp?.remaining || "Remaining"}
          value={formatCurrency(variance)}
          description={bp?.availableBudget || "Available budget"}
          icon={CircleCheck}
        />
        <StatsCard
          title={bp?.allocations || "Allocations"}
          value={allocationsCount}
          description={`${budgetsCount} ${c?.activeBudgets || "active budgets"}`}
          icon={PieChart}
        />
      </DashboardGrid>

      {/* Feature Cards Grid */}
      <DashboardGrid type="features">
        <FeatureCard
          title={bp?.budgets || "Budgets"}
          description={
            bp?.createManageBudgets || "Create and manage school budgets"
          }
          icon={PieChart}
          isPrimary
          primaryAction={{
            label: bp?.viewBudgets || "View Budgets",
            href: `/${lang}/finance/budget/all`,
            count: budgetsCount,
          }}
          secondaryAction={
            canCreate
              ? {
                  label: bp?.createBudget || "Create Budget",
                  href: `/${lang}/finance/budget/new`,
                }
              : undefined
          }
        />
        {canPencil && (
          <FeatureCard
            title={bp?.budgetAllocations || "Budget Allocations"}
            description={
              bp?.allocateByDepartment ||
              "Allocate budget by department or category"
            }
            icon={DollarSign}
            primaryAction={{
              label: bp?.viewAllocations || "View Allocations",
              href: `/${lang}/finance/budget/allocations`,
            }}
            secondaryAction={
              canCreate
                ? {
                    label: bp?.allocateFunds || "Allocate Funds",
                    href: `/${lang}/finance/budget/allocations/new`,
                  }
                : undefined
            }
          />
        )}
        <FeatureCard
          title={bp?.spendingTracking || "Spending Tracking"}
          description={
            bp?.monitorUtilization || "Monitor budget utilization and spending"
          }
          icon={TrendingUp}
          primaryAction={{
            label: bp?.trackSpending || "Track Spending",
            href: `/${lang}/finance/budget/tracking`,
          }}
          secondaryAction={{
            label: bp?.realTimeView || "Real-time View",
            href: `/${lang}/finance/budget/tracking/realtime`,
          }}
        />
        {canExport && (
          <FeatureCard
            title={bp?.varianceAnalysis || "Variance Analysis"}
            description={
              bp?.analyzeBudgetActual || "Analyze budget vs actual spending"
            }
            icon={TriangleAlert}
            primaryAction={{
              label: bp?.varianceReport || "Variance Report",
              href: `/${lang}/finance/budget/variance`,
            }}
            secondaryAction={{
              label: bp?.budgetAlerts || "Budget Alerts",
              href: `/${lang}/finance/budget/variance/alerts`,
            }}
          />
        )}
        {canExport && (
          <FeatureCard
            title={bp?.budgetReports || "Budget Reports"}
            description={
              bp?.generateBudgetReports || "Generate budget analysis reports"
            }
            icon={BarChart}
            primaryAction={{
              label: c?.viewReports || "View Reports",
              href: `/${lang}/finance/budget/reports`,
            }}
            secondaryAction={{
              label: bp?.budgetSummary || "Budget Summary",
              href: `/${lang}/finance/budget/reports/summary`,
            }}
          />
        )}
        {canApprove && (
          <FeatureCard
            title={bp?.budgetApproval || "Budget Approval"}
            description={
              bp?.reviewApproveBudget || "Review and approve budget requests"
            }
            icon={CircleCheck}
            primaryAction={{
              label: c?.pendingApproval || "Pending Approval",
              href: `/${lang}/finance/budget/approval`,
            }}
            secondaryAction={{
              label: c?.approvalHistory || "Approval History",
              href: `/${lang}/finance/budget/approval/history`,
            }}
          />
        )}
      </DashboardGrid>
    </div>
  )
}
