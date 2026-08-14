// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import {
  CircleAlert,
  CircleCheck,
  DollarSign,
  FolderOpen,
  Receipt,
  TrendingUp,
} from "lucide-react"

import { db } from "@/lib/db"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { resolveFinanceAccess } from "../guard"
import {
  DashboardGrid,
  FeatureCard,
  formatCurrency,
  StatsCard,
} from "../lib/dashboard-components"

interface Props {
  dictionary: Dictionary
  lang: Locale
}

/** Every action this page gates on, resolved in a single pass. */
const EXPENSES_ACTIONS = [
  "view",
  "create",
  "edit",
  "approve",
  "export",
] as const

export default async function ExpensesContent({ dictionary, lang }: Props) {
  const fd = (dictionary as any)?.finance
  const ep = fd?.expensesPage as Record<string, string> | undefined
  const c = fd?.common as Record<string, string> | undefined

  const { schoolId, can } = await resolveFinanceAccess(
    "expenses",
    EXPENSES_ACTIONS
  )
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

  // If user can't view expenses, show empty state
  if (!canView) {
    return (
      <div>
        <p className="text-muted-foreground">
          {c?.noPermissionExpenses ||
            "You don't have permission to view expenses"}
        </p>
      </div>
    )
  }

  let categoriesCount = 0
  let expensesCount = 0
  let pendingExpensesCount = 0
  let approvedExpensesCount = 0
  let totalExpenses = 0
  let currency = "USD"

  if (schoolId) {
    try {
      // The school row, the four counts and the aggregate are independent —
      // one round-trip rather than three.
      const [school, categories, expenses, pending, approved, expensesAgg] =
        await Promise.all([
          db.school.findUnique({
            where: { id: schoolId },
            select: { currency: true },
          }),
          db.expenseCategory.count({ where: { schoolId } }),
          db.expense.count({ where: { schoolId } }),
          db.expense.count({ where: { schoolId, status: "PENDING" } }),
          db.expense.count({ where: { schoolId, status: "APPROVED" } }),
          db.expense.aggregate({
            where: { schoolId, status: "APPROVED" },
            _sum: { amount: true },
          }),
        ])

      currency = school?.currency ?? "USD"
      categoriesCount = categories
      expensesCount = expenses
      pendingExpensesCount = pending
      approvedExpensesCount = approved

      totalExpenses = expensesAgg._sum?.amount
        ? Number(expensesAgg._sum.amount)
        : 0
    } catch (error) {
      console.error("Error fetching expense stats:", error)
    }
  }

  return (
    <div className="space-y-6">
      <DashboardGrid type="stats">
        <StatsCard
          title={ep?.totalExpenses || "Total Expenses"}
          value={formatCurrency(totalExpenses, bcp, currency)}
          description={ep?.approvedExpenses || "Approved expenses"}
          icon={DollarSign}
        />
        <StatsCard
          title={ep?.pendingExpenses || "Pending"}
          value={pendingExpensesCount}
          description={ep?.awaitingApproval || "Awaiting approval"}
          icon={CircleAlert}
        />
        <StatsCard
          title={ep?.allExpenses || "All Expenses"}
          value={expensesCount}
          description={ep?.totalSubmitted || "Total submitted"}
          icon={Receipt}
        />
        <StatsCard
          title={ep?.categories || "Categories"}
          value={categoriesCount}
          description={ep?.expenseTypes || "Expense types"}
          icon={FolderOpen}
        />
      </DashboardGrid>

      <DashboardGrid type="features">
        <FeatureCard
          title={ep?.allExpenses || "All Expenses"}
          description={
            ep?.viewManageExpenses || "View and manage expense submissions"
          }
          icon={Receipt}
          isPrimary
          primaryAction={{
            label: ep?.viewExpenses || "View Expenses",
            href: `/${lang}/finance/expenses/all`,
            count: expensesCount,
          }}
          secondaryAction={
            canCreate
              ? {
                  label: ep?.submitExpense || "Submit Expense",
                  href: `/${lang}/finance/expenses/new`,
                }
              : undefined
          }
        />
        {canPencil && (
          <FeatureCard
            title={ep?.expenseCategories || "Expense Categories"}
            description={
              ep?.manageCategories || "Manage expense categories and types"
            }
            icon={FolderOpen}
            primaryAction={{
              label: ep?.viewCategories || "View Categories",
              href: `/${lang}/finance/expenses/categories`,
            }}
          />
        )}
      </DashboardGrid>
    </div>
  )
}
