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
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { resolveFinanceAccess } from "../guard"
import {
  DashboardGrid,
  FeatureCard,
  formatCurrency,
  formatPercentage,
  StatsCard,
} from "../lib/dashboard-components"

interface Props {
  dictionary: Dictionary
  lang: Locale
}

/** Every action this page gates on, resolved in a single pass. */
const BUDGET_ACTIONS = ["view", "create", "edit", "approve", "export"] as const

export default async function BudgetContent({ dictionary, lang }: Props) {
  const fd = (dictionary as any)?.finance
  const bp = fd?.budgetPage as Record<string, string> | undefined
  const c = fd?.common as Record<string, string> | undefined

  const { schoolId, can } = await resolveFinanceAccess("budget", BUDGET_ACTIONS)
  const bcp = lang === "ar" ? "ar-SA" : "en-US"

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
  const {
    view: canView,
    create: canCreate,
    edit: canPencil,
    approve: canApprove,
    export: canExport,
  } = can

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
  let currency = "USD"

  if (schoolId) {
    try {
      // The school row, both counts and both aggregates are independent —
      // one round-trip rather than three.
      const [school, budgets, allocations, budgetAgg, spentAgg] =
        await Promise.all([
          db.school.findUnique({
            where: { id: schoolId },
            select: { currency: true },
          }),
          db.budget.count({ where: { schoolId, status: "ACTIVE" } }),
          db.budgetAllocation.count({ where: { schoolId } }),
          db.budget.aggregate({
            where: { schoolId, status: "ACTIVE" },
            _sum: { totalAmount: true },
          }),
          db.budgetAllocation.aggregate({
            where: { schoolId },
            _sum: { spent: true },
          }),
        ])

      currency = school?.currency ?? "USD"
      budgetsCount = budgets
      allocationsCount = allocations

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
          value={formatCurrency(totalBudget, bcp, currency)}
          description={bp?.allocatedBudget || "Allocated budget"}
          icon={DollarSign}
        />
        <StatsCard
          title={bp?.spent || "Spent"}
          value={formatCurrency(totalSpent, bcp, currency)}
          description={`${formatPercentage(utilizationRate)} utilization`}
          icon={TrendingUp}
        />
        <StatsCard
          title={bp?.remaining || "Remaining"}
          value={formatCurrency(variance, bcp, currency)}
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
      </DashboardGrid>
    </div>
  )
}
