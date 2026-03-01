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
import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import {
  DashboardGrid,
  FeatureCard,
  formatCurrency,
  StatsCard,
} from "../lib/dashboard-components"
import { checkCurrentUserPermission } from "../lib/permissions"

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function ExpensesContent({ dictionary, lang }: Props) {
  const fd = (dictionary as any)?.finance
  const ep = fd?.expensesPage as Record<string, string> | undefined
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
  const canView = await checkCurrentUserPermission(schoolId, "expenses", "view")
  const canCreate = await checkCurrentUserPermission(
    schoolId,
    "expenses",
    "create"
  )
  const canPencil = await checkCurrentUserPermission(
    schoolId,
    "expenses",
    "edit"
  )
  const canApprove = await checkCurrentUserPermission(
    schoolId,
    "expenses",
    "approve"
  )
  const canExport = await checkCurrentUserPermission(
    schoolId,
    "expenses",
    "export"
  )

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

  if (schoolId) {
    try {
      ;[
        categoriesCount,
        expensesCount,
        pendingExpensesCount,
        approvedExpensesCount,
      ] = await Promise.all([
        db.expenseCategory.count({ where: { schoolId } }),
        db.expense.count({ where: { schoolId } }),
        db.expense.count({ where: { schoolId, status: "PENDING" } }),
        db.expense.count({ where: { schoolId, status: "APPROVED" } }),
      ])

      const expensesAgg = await db.expense.aggregate({
        where: { schoolId, status: "APPROVED" },
        _sum: { amount: true },
      })

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
          value={formatCurrency(totalExpenses)}
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
        {canApprove && (
          <FeatureCard
            title={ep?.approvalWorkflow || "Approval Workflow"}
            description={
              ep?.reviewApproveExpenses || "Review and approve expense requests"
            }
            icon={CircleCheck}
            primaryAction={{
              label: c?.pendingApproval || "Pending Approval",
              href: `/${lang}/finance/expenses/approval`,
              count: pendingExpensesCount,
            }}
            secondaryAction={{
              label: fd?.approved || "Approved",
              href: `/${lang}/finance/expenses/approved`,
            }}
          />
        )}
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
            secondaryAction={
              canCreate
                ? {
                    label: ep?.createCategory || "Create Category",
                    href: `/${lang}/finance/expenses/categories/new`,
                  }
                : undefined
            }
          />
        )}
        {canApprove && (
          <FeatureCard
            title={ep?.reimbursements || "Reimbursements"}
            description={
              ep?.processReimbursements || "Process expense reimbursements"
            }
            icon={DollarSign}
            primaryAction={{
              label: c?.process || "Process",
              href: `/${lang}/finance/expenses/reimbursement`,
            }}
            secondaryAction={{
              label: c?.history || "History",
              href: `/${lang}/finance/expenses/reimbursement/history`,
            }}
          />
        )}
        {canExport && (
          <FeatureCard
            title={ep?.expenseReports || "Expense Reports"}
            description={
              ep?.generateExpenseReports || "Generate expense analysis reports"
            }
            icon={TrendingUp}
            primaryAction={{
              label: c?.viewReports || "View Reports",
              href: `/${lang}/finance/expenses/reports`,
            }}
            secondaryAction={{
              label: fd?.export || "Export",
              href: `/${lang}/finance/expenses/reports/export`,
            }}
          />
        )}
      </DashboardGrid>
    </div>
  )
}
