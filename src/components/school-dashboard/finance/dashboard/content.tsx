// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import {
  Building,
  CircleAlert,
  DollarSign,
  Receipt,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react"

import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"

import {
  getDashboardStats,
  getFinancialAlerts,
  getQuickActionsForRole,
  getRecentTransactions,
} from "./actions"
import { AlertCard } from "./alert-card"
import { BankAccountsSummary } from "./bank-accounts-summary"
import { CashFlowChart } from "./cash-flow-chart"
import { ExpenseChart } from "./expense-chart"
import { KPICard } from "./kpi-card"
import { QuickActions } from "./quick-actions"
import { RevenueChart } from "./revenue-chart"
import { TransactionList } from "./transaction-list"
import type { FinancialKPI } from "./types"

export async function FinanceDashboardContent({
  lang = "ar",
}: { lang?: string } = {}) {
  const session = await auth()
  if (!session?.user) {
    return <div>Unauthorized</div>
  }

  const dictionary = await getDictionary(lang as Locale)
  const fd = (dictionary as any)?.finance
  const dp = fd?.dashboardPage as Record<string, string> | undefined
  const c = fd?.common as Record<string, string> | undefined

  const userRole = session.user.role || "USER"

  // Fetch all lab data in parallel
  const [stats, transactions, alerts, quickActions] = await Promise.all([
    getDashboardStats("month"),
    getRecentTransactions(5),
    getFinancialAlerts(),
    getQuickActionsForRole(userRole),
  ])

  // Prepare KPIs based on role
  const getKPIsForRole = (): FinancialKPI[] => {
    const allKPIs: FinancialKPI[] = [
      {
        id: "total-revenue",
        title: dp?.totalRevenue || "Total Revenue",
        value: stats.totalRevenue,
        change: 12,
        changeType: "increase",
        icon: "💰",
        color: "green",
        description: dp?.totalInvoicedAmount || "Total invoiced amount",
        trend: stats.revenuesTrend.slice(-7),
      },
      {
        id: "collected-revenue",
        title: dp?.collectedRevenue || "Collected Revenue",
        value: stats.collectedRevenue,
        change: stats.collectionRate > 75 ? 5 : -5,
        changeType: stats.collectionRate > 75 ? "increase" : "decrease",
        icon: "✅",
        color: "blue",
        description: `${stats.collectionRate.toFixed(1)}% ${dp?.collectionRate || "collection rate"}`,
      },
      {
        id: "total-expenses",
        title: dp?.totalExpenses || "Total Expenses",
        value: stats.totalExpenses,
        change: 3,
        changeType: "increase",
        icon: "💸",
        color: "red",
        description: dp?.allExpensesPeriod || "All expenses this period",
      },
      {
        id: "net-profit",
        title: dp?.netProfit || "Net Profit",
        value: stats.netProfit,
        change: stats.profitMargin,
        changeType: stats.netProfit > 0 ? "increase" : "decrease",
        icon: "📈",
        color: stats.netProfit > 0 ? "green" : "red",
        description: `${stats.profitMargin.toFixed(1)}% ${dp?.profitMargin || "profit margin"}`,
        trend: stats.profitTrend.slice(-7),
      },
      {
        id: "cash-balance",
        title: dp?.cashBalance || "Cash Balance",
        value: stats.cashBalance,
        change: 8,
        changeType: "increase",
        icon: "🏦",
        color: "purple",
        description: `${stats.cashRunway} ${dp?.monthsRunway || "months runway"}`,
      },
      {
        id: "outstanding-invoices",
        title: dp?.outstanding || "Outstanding",
        value: stats.outstandingRevenue,
        change: stats.overdueInvoices,
        changeType: stats.overdueInvoices > 0 ? "increase" : "neutral",
        icon: "⏰",
        color: "yellow",
        description: `${stats.overdueInvoices} ${dp?.overdueInvoices || "overdue invoices"}`,
      },
      {
        id: "students-paid",
        title: dp?.studentsPaid || "Students Paid",
        value: `${stats.studentsWithPayments}/${stats.totalStudents}`,
        change: (stats.studentsWithPayments / stats.totalStudents) * 100,
        changeType: "neutral",
        icon: "👥",
        color: "blue",
        description: dp?.feePaymentStatus || "Fee payment status",
      },
      {
        id: "payroll-expense",
        title: dp?.payroll || "Payroll",
        value: stats.totalPayroll,
        change: 0,
        changeType: "neutral",
        icon: "💼",
        color: "orange",
        description: `${stats.payrollProcessed} ${dp?.processedPending || "processed, pending".split(", ")[0]}, ${stats.pendingPayroll} ${(dp?.processedPending || "processed, pending").split(", ")[1] || "pending"}`,
      },
    ]

    // ListFilter KPIs based on role
    switch (userRole) {
      case "ADMIN":
      case "ACCOUNTANT":
        return allKPIs // Show all KPIs
      case "TEACHER":
      case "STAFF":
        return allKPIs.filter((kpi) =>
          ["net-profit", "payroll-expense"].includes(kpi.id)
        )
      case "STUDENT":
      case "GUARDIAN":
        return allKPIs.filter((kpi) =>
          ["students-paid", "outstanding-invoices"].includes(kpi.id)
        )
      default:
        return allKPIs.slice(0, 4) // Show basic KPIs
    }
  }

  const kpis = getKPIsForRole()

  // Check if user has full access
  const hasFullAccess = ["ADMIN", "ACCOUNTANT"].includes(userRole)
  const hasLimitedAccess = ["TEACHER", "STAFF"].includes(userRole)
  const hasMinimalAccess = ["STUDENT", "GUARDIAN"].includes(userRole)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {dp?.financialDashboard || "Financial Dashboard"}
        </h1>
        <p className="text-muted-foreground">
          {dp?.overviewDescription ||
            "Overview of your institution's financial performance"}
        </p>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.slice(0, 2).map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <KPICard key={kpi.id} kpi={kpi} />
        ))}
      </div>

      {/* Charts Section */}
      {hasFullAccess && (
        <div className="grid gap-6 md:grid-cols-2">
          <RevenueChart
            revenueData={stats.revenuesTrend}
            expenseData={stats.expensesTrend}
            profitData={stats.profitTrend}
          />
          <ExpenseChart expenseCategories={stats.expenseCategories} />
        </div>
      )}

      {/* Additional Charts */}
      {hasFullAccess && (
        <div className="grid gap-6 md:grid-cols-2">
          <CashFlowChart
            inflowData={[stats.cashInflow]}
            outflowData={[stats.cashOutflow]}
            balanceData={[stats.cashBalance]}
          />
          <BankAccountsSummary accounts={stats.bankAccounts} />
        </div>
      )}

      {/* Quick Actions and Recent Transactions */}
      <div className="grid gap-6 md:grid-cols-2">
        <QuickActions actions={quickActions} />
        {(hasFullAccess || hasLimitedAccess) && (
          <TransactionList transactions={transactions} />
        )}
      </div>

      {/* Budget Overview - Only for Admin/Accountant */}
      {hasFullAccess && stats.budgetCategories.length > 0 && (
        <BudgetOverview
          categories={stats.budgetCategories}
          locale={lang}
          dict={dp}
        />
      )}

      {/* Footer Stats */}
      <div className="grid gap-4 border-t pt-6 md:grid-cols-4">
        <StatCard
          title={dp?.invoiceCollection || "Invoice Collection"}
          value={`${stats.paidInvoices}/${stats.totalInvoices}`}
          description={dp?.invoicesPaid || "Invoices paid"}
          icon={<Receipt className="h-4 w-4" />}
        />
        <StatCard
          title={dp?.budgetUtilization || "Budget Utilization"}
          value={`${((stats.budgetUsed / (stats.budgetUsed + stats.budgetRemaining)) * 100).toFixed(0)}%`}
          description={dp?.ofAllocatedBudget || "Of allocated budget"}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <StatCard
          title={dp?.activeStudents || "Active Students"}
          value={stats.totalStudents}
          description={dp?.enrolledStudents || "Enrolled students"}
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          title={dp?.bankAccounts || "Bank Accounts"}
          value={stats.bankAccounts.length}
          description={dp?.activeAccounts || "Active accounts"}
          icon={<Building className="h-4 w-4" />}
        />
      </div>
    </div>
  )
}

// Helper Components
function StatCard({
  title,
  value,
  description,
  icon,
}: {
  title: string
  value: string | number
  description: string
  icon: React.ReactNode
}) {
  return (
    <div className="bg-muted/50 flex items-center gap-3 rounded-lg p-4">
      <div className="bg-background rounded-md p-2">{icon}</div>
      <div>
        <p className="text-muted-foreground text-sm">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-muted-foreground text-xs">{description}</p>
      </div>
    </div>
  )
}

function BudgetOverview({
  categories,
  locale = "ar",
  dict,
}: {
  categories: {
    category: string
    allocated: number
    spent: number
    remaining: number
    percentage: number
  }[]
  locale?: string
  dict?: Record<string, string>
}) {
  return (
    <div className="rounded-lg border p-6">
      <h3 className="mb-4 text-lg font-semibold">
        {dict?.budgetOverview || "Budget Overview"}
      </h3>
      <div className="space-y-3">
        {categories.slice(0, 5).map((cat) => (
          <div key={cat.category} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span>{cat.category}</span>
              <span className="text-muted-foreground">
                SDG {new Intl.NumberFormat(locale).format(cat.spent)} /{" "}
                {new Intl.NumberFormat(locale).format(cat.allocated)}
              </span>
            </div>
            <div className="bg-muted h-2 w-full rounded-full">
              <div
                className={`h-2 rounded-full transition-all ${
                  cat.percentage > 90
                    ? "bg-red-500"
                    : cat.percentage > 75
                      ? "bg-yellow-500"
                      : "bg-green-500"
                }`}
                style={{ width: `${Math.min(cat.percentage, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
