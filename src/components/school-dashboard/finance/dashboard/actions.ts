"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { unstable_cache } from "next/cache"
import { auth } from "@/auth"
import { Decimal } from "@prisma/client/runtime/library"
import {
  endOfMonth,
  endOfYear,
  startOfMonth,
  startOfYear,
  subMonths,
} from "date-fns"

import { db } from "@/lib/db"
import type { Locale } from "@/components/internationalization/config"
import { getFinanceDictionary } from "@/components/internationalization/dictionaries"

import { checkFinancePermission } from "../lib/permissions"
import type { DashboardStats, FinancialAlert, RecentTransaction } from "./types"

// Cache tags for invalidation
const FINANCE_DASHBOARD_TAG = "finance-dashboard"
const CACHE_REVALIDATE_SECONDS = 300 // 5 minutes

// Helper to convert Decimal to number
function decimalToNumber(value: Decimal | null | undefined): number {
  if (!value) return 0
  return typeof value === "number" ? value : parseFloat(value.toString())
}

/**
 * All dashboard numbers are aggregated in the database. Fetching raw rows
 * here previously produced a ~6.7MB payload that exceeded unstable_cache's
 * 2MB item limit (unhandled rejection on every dashboard load) and shipped
 * thousands of invoice rows to compute a handful of sums.
 *
 * Every Decimal is converted to number BEFORE returning: on a cache hit the
 * value is revived from JSON, so Decimal instances would come back as
 * strings and .toFixed()/arithmetic downstream would break.
 *
 * `todayIso` is date-only so the cache key stays stable within a day while
 * the overdue cutoff still advances.
 */
const getCachedDashboardData = unstable_cache(
  async (
    schoolId: string,
    startIso: string,
    endIso: string,
    todayIso: string,
    academicYear: string
  ) => {
    const startDate = new Date(startIso)
    const endDate = new Date(endIso)
    const today = new Date(todayIso)
    const invoiceWindow = {
      schoolId,
      invoice_date: { gte: startDate, lte: endDate },
    }
    const overdueWhere = {
      ...invoiceWindow,
      OR: [
        { status: "OVERDUE" as const },
        { status: "UNPAID" as const, due_date: { lt: today } },
      ],
    }

    const [
      invoiceAgg,
      invoiceStatusGroups,
      overdueAgg,
      paymentAgg,
      expenseGroups,
      expenseCategoryRows,
      bankAccounts,
      budgets,
      totalStudents,
      paidStudentGroups,
      feeAgg,
      payrollGroups,
    ] = await Promise.all([
      db.userInvoice.aggregate({
        where: invoiceWindow,
        _sum: { total: true },
        _count: { _all: true },
      }),
      db.userInvoice.groupBy({
        by: ["status"],
        where: invoiceWindow,
        _count: { _all: true },
      }),
      db.userInvoice.aggregate({
        where: overdueWhere,
        _sum: { total: true },
        _count: { _all: true },
      }),
      db.payment.aggregate({
        where: {
          schoolId,
          paymentDate: { gte: startDate, lte: endDate },
          status: "SUCCESS",
        },
        _sum: { amount: true },
      }),
      db.expense.groupBy({
        by: ["categoryId"],
        where: { schoolId, expenseDate: { gte: startDate, lte: endDate } },
        _sum: { amount: true },
      }),
      db.expenseCategory.findMany({
        where: { schoolId },
        select: { id: true, name: true },
      }),
      db.bankAccount.findMany({
        where: { schoolId },
        select: { name: true, currentBalance: true, type: true },
      }),
      db.budget.findMany({
        where: { schoolId, status: "ACTIVE" },
        select: {
          allocations: {
            select: {
              allocated: true,
              spent: true,
              remaining: true,
              category: { select: { name: true } },
            },
          },
        },
      }),
      db.student.count({ where: { schoolId } }),
      db.payment.groupBy({
        by: ["studentId"],
        where: { schoolId, status: "SUCCESS", feeAssignment: { academicYear } },
      }),
      db.feeAssignment.aggregate({
        where: { schoolId, academicYear },
        _sum: { finalAmount: true },
      }),
      db.payrollRun.groupBy({
        by: ["status"],
        where: { schoolId, payDate: { gte: startDate, lte: endDate } },
        _sum: { totalNet: true },
        _count: { _all: true },
      }),
    ])

    return {
      totalRevenue: decimalToNumber(invoiceAgg._sum.total),
      totalInvoices: invoiceAgg._count._all,
      invoiceStatusCounts: Object.fromEntries(
        invoiceStatusGroups.map((g) => [g.status, g._count._all])
      ) as Record<string, number>,
      overdueInvoices: overdueAgg._count._all,
      overdueAmount: decimalToNumber(overdueAgg._sum.total),
      collectedRevenue: decimalToNumber(paymentAgg._sum.amount),
      expenseByCategory: expenseGroups.map((g) => ({
        categoryId: g.categoryId,
        amount: decimalToNumber(g._sum.amount),
      })),
      expenseCategoryNames: Object.fromEntries(
        expenseCategoryRows.map((c) => [c.id, c.name])
      ) as Record<string, string>,
      bankAccounts: bankAccounts.map((acc) => ({
        name: acc.name,
        balance: decimalToNumber(acc.currentBalance),
        type: acc.type,
      })),
      budgetCategories: budgets.flatMap((budget) =>
        budget.allocations.map((alloc) => {
          const allocated = decimalToNumber(alloc.allocated)
          const spent = decimalToNumber(alloc.spent)
          return {
            category: alloc.category.name,
            allocated,
            spent,
            remaining: decimalToNumber(alloc.remaining),
            percentage: allocated > 0 ? (spent / allocated) * 100 : 0,
          }
        })
      ),
      totalStudents,
      studentsWithPayments: paidStudentGroups.length,
      totalFeeAmount: decimalToNumber(feeAgg._sum.finalAmount),
      payroll: payrollGroups.map((g) => ({
        status: g.status,
        totalNet: decimalToNumber(g._sum.totalNet),
        count: g._count._all,
      })),
    }
  },
  [FINANCE_DASHBOARD_TAG],
  { revalidate: CACHE_REVALIDATE_SECONDS, tags: [FINANCE_DASHBOARD_TAG] }
)

/**
 * Fee data stores academicYear as a "YYYY-YYYY" range keyed to the school's
 * latest SchoolYear (same resolution as fee-auto-assign/fee-provisioning).
 * The previous bare-calendar-year filter ("2026") could never match, so the
 * fee metrics were permanently zero.
 */
async function resolveCurrentAcademicYear(schoolId: string): Promise<string> {
  const currentYear = await db.schoolYear.findFirst({
    where: { schoolId },
    orderBy: { startDate: "desc" },
    select: { yearName: true },
  })
  return (
    currentYear?.yearName ??
    `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
  )
}

export async function getDashboardStats(
  dateRange: "month" | "quarter" | "year" = "month"
): Promise<DashboardStats> {
  const session = await auth()
  if (!session?.user?.schoolId) {
    throw new Error("Unauthorized")
  }

  if (
    !(await checkFinancePermission(
      session.user.id!,
      session.user.schoolId,
      "reports",
      "view"
    ))
  ) {
    throw new Error("Unauthorized")
  }

  const schoolId = session.user.schoolId
  const now = new Date()

  // Calculate date range
  let startDate: Date
  let endDate = endOfMonth(now)

  switch (dateRange) {
    case "year":
      startDate = startOfYear(now)
      endDate = endOfYear(now)
      break
    case "quarter":
      startDate = startOfMonth(subMonths(now, 2))
      break
    case "month":
    default:
      startDate = startOfMonth(now)
      break
  }

  // Aggregated in the DB, cached 5 min. Date-only args keep the key stable.
  const academicYear = await resolveCurrentAcademicYear(schoolId)
  const data = await getCachedDashboardData(
    schoolId,
    startDate.toISOString(),
    endDate.toISOString(),
    now.toISOString().slice(0, 10),
    academicYear
  )

  // Revenue Metrics
  const totalRevenue = data.totalRevenue
  const collectedRevenue = data.collectedRevenue
  const outstandingRevenue = totalRevenue - collectedRevenue
  const collectionRate =
    totalRevenue > 0 ? (collectedRevenue / totalRevenue) * 100 : 0

  // Expense Metrics
  const totalExpenses = data.expenseByCategory.reduce(
    (sum, g) => sum + g.amount,
    0
  )
  const expenseCategories = data.expenseByCategory.map((g) => ({
    category:
      (g.categoryId && data.expenseCategoryNames[g.categoryId]) || "Other",
    amount: g.amount,
    percentage: totalExpenses > 0 ? (g.amount / totalExpenses) * 100 : 0,
  }))

  // Profit Metrics
  const grossProfit = collectedRevenue - totalExpenses
  const netProfit = grossProfit // Simplified - should include other deductions
  const profitMargin =
    collectedRevenue > 0 ? (netProfit / collectedRevenue) * 100 : 0

  // Cash Metrics
  const cashBalance = data.bankAccounts.reduce(
    (sum, acc) => sum + acc.balance,
    0
  )
  const cashInflow = collectedRevenue
  const cashOutflow = totalExpenses
  const monthlyExpenses = totalExpenses // Assuming monthly data
  const cashRunway =
    monthlyExpenses > 0 ? Math.floor(cashBalance / monthlyExpenses) : 999

  // Invoice Metrics
  const totalInvoices = data.totalInvoices
  const paidInvoices = data.invoiceStatusCounts["PAID"] ?? 0
  const pendingInvoices = data.invoiceStatusCounts["UNPAID"] ?? 0
  const overdueInvoices = data.overdueInvoices
  const overdueAmount = data.overdueAmount

  // Payroll Metrics
  const totalPayroll = data.payroll.reduce((sum, g) => sum + g.totalNet, 0)
  const payrollProcessed = data.payroll
    .filter((g) => g.status === "PAID")
    .reduce((sum, g) => sum + g.count, 0)
  const pendingPayroll = data.payroll
    .filter((g) => g.status !== "PAID" && g.status !== "CANCELLED")
    .reduce((sum, g) => sum + g.count, 0)

  // Fee Metrics (scoped to the school's current academic year)
  const totalStudents = data.totalStudents
  const studentsWithPayments = data.studentsWithPayments
  const studentsWithoutPayments = totalStudents - studentsWithPayments
  const averageFeePerStudent =
    totalStudents > 0 ? data.totalFeeAmount / totalStudents : 0

  const bankAccountsData = data.bankAccounts
  const budgetCategories = data.budgetCategories

  // Budget totals
  const budgetTotal = budgetCategories.reduce(
    (sum, cat) => sum + cat.allocated,
    0
  )
  const budgetUsed = budgetCategories.reduce((sum, cat) => sum + cat.spent, 0)
  const budgetRemaining = budgetTotal - budgetUsed

  // Trend sparklines require real historical monthly aggregates which are not
  // computed yet. Return empty series rather than fabricating a random walk that
  // looks like a real revenue/profit/collection trend. (Real trends are a follow-up.)
  const revenuesTrend: number[] = []
  const expensesTrend: number[] = []
  const profitTrend: number[] = []
  const collectionTrend: number[] = []

  return {
    // Revenue Metrics
    totalRevenue,
    collectedRevenue,
    outstandingRevenue,
    collectionRate,

    // Expense Metrics
    totalExpenses,
    budgetUsed,
    budgetRemaining,
    expenseCategories,

    // Profit Metrics
    grossProfit,
    netProfit,
    profitMargin,

    // Cash Flow Metrics
    cashBalance,
    cashInflow,
    cashOutflow,
    cashRunway,

    // Invoice Metrics
    totalInvoices,
    paidInvoices,
    pendingInvoices,
    overdueInvoices,
    overdueAmount,

    // Payroll Metrics
    totalPayroll,
    payrollProcessed,
    pendingPayroll,

    // Fee Metrics
    totalStudents,
    studentsWithPayments,
    studentsWithoutPayments,
    averageFeePerStudent,

    // Banking Metrics
    bankAccounts: bankAccountsData,

    // Budget Metrics
    budgetCategories,

    // Trends
    revenuesTrend,
    expensesTrend,
    profitTrend,
    collectionTrend,
  }
}

export async function getRecentTransactions(
  limit = 10,
  lang: Locale = "ar"
): Promise<RecentTransaction[]> {
  const session = await auth()
  if (!session?.user?.schoolId) {
    throw new Error("Unauthorized")
  }

  if (
    !(await checkFinancePermission(
      session.user.id!,
      session.user.schoolId,
      "reports",
      "view"
    ))
  ) {
    throw new Error("Unauthorized")
  }

  const schoolId = session.user.schoolId

  const dictionary = await getFinanceDictionary(lang)
  const dp = (dictionary as any)?.finance?.dashboardPage as
    | Record<string, string>
    | undefined

  // Fetch recent transactions from multiple sources
  const [bankTransactions, expenses, payments] = await Promise.all([
    db.transaction.findMany({
      where: { schoolId },
      orderBy: { date: "desc" },
      take: limit,
    }),
    db.expense.findMany({
      where: { schoolId },
      orderBy: { expenseDate: "desc" },
      include: { category: true },
      take: limit,
    }),
    db.payment.findMany({
      where: { schoolId },
      orderBy: { paymentDate: "desc" },
      include: { student: true },
      take: limit,
    }),
  ])

  // Convert to unified format
  const recentTransactions: RecentTransaction[] = []

  // Add bank transactions
  bankTransactions.forEach((tx) => {
    recentTransactions.push({
      id: tx.id,
      type: tx.type === "credit" ? "income" : "expense",
      description: tx.name,
      amount: decimalToNumber(tx.amount),
      date: tx.date,
      status: tx.pending ? "pending" : "completed",
      category: tx.category,
      reference: tx.merchantName || undefined,
    })
  })

  // Add expenses
  expenses.forEach((exp) => {
    recentTransactions.push({
      id: exp.id,
      type: "expense",
      description: exp.description,
      amount: decimalToNumber(exp.amount),
      date: exp.expenseDate,
      status: exp.status === "PAID" ? "completed" : "pending",
      category: exp.category?.name,
      reference: exp.expenseNumber,
    })
  })

  // Add payments
  payments.forEach((pay) => {
    recentTransactions.push({
      id: pay.id,
      type: "income",
      description: (dp?.feePaymentFrom || "Fee payment from {name}").replace(
        "{name}",
        `${pay.student.firstName} ${pay.student.lastName}`
      ),
      amount: decimalToNumber(pay.amount),
      date: pay.paymentDate,
      status:
        pay.status === "SUCCESS"
          ? "completed"
          : pay.status === "FAILED"
            ? "failed"
            : "pending",
      category: dp?.studentFeesCategory || "Student Fees",
      reference: pay.receiptNumber,
    })
  })

  // Sort by date and return top N
  return recentTransactions
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, limit)
}

export async function getFinancialAlerts(
  lang: Locale = "ar"
): Promise<FinancialAlert[]> {
  const session = await auth()
  if (!session?.user?.schoolId) {
    throw new Error("Unauthorized")
  }

  if (
    !(await checkFinancePermission(
      session.user.id!,
      session.user.schoolId,
      "reports",
      "view"
    ))
  ) {
    throw new Error("Unauthorized")
  }

  const schoolId = session.user.schoolId
  const now = new Date()
  const alerts: FinancialAlert[] = []

  // Load dictionary for i18n
  const dictionary = await getFinanceDictionary(lang)
  const da = (dictionary as any)?.finance?.dashboardAlerts as
    | Record<string, string>
    | undefined

  // Check for overdue invoices
  const overdueInvoices = await db.userInvoice.count({
    where: {
      schoolId,
      status: { in: ["UNPAID", "OVERDUE"] },
      due_date: { lt: now },
    },
  })

  if (overdueInvoices > 0) {
    alerts.push({
      id: "overdue-invoices",
      type: "warning",
      title: da?.overdueInvoices || "Overdue Invoices",
      description:
        da?.overdueInvoicesDesc?.replace("{count}", String(overdueInvoices)) ||
        `${overdueInvoices} invoice(s) are overdue and require attention`,
      action: {
        label: da?.viewInvoices || "View Invoices",
        href: "/finance/invoice?status=OVERDUE",
      },
      timestamp: now,
    })
  }

  // Check for low cash balance
  const bankAccounts = await db.bankAccount.findMany({
    where: { schoolId },
  })

  const totalBalance = bankAccounts.reduce(
    (sum, acc) => sum + decimalToNumber(acc.currentBalance),
    0
  )

  // Alert if cash is below 2 months of expenses
  const monthlyExpenses = await db.expense.aggregate({
    where: {
      schoolId,
      expenseDate: {
        gte: startOfMonth(now),
        lte: endOfMonth(now),
      },
    },
    _avg: {
      amount: true,
    },
  })

  const avgMonthlyExpense = decimalToNumber(monthlyExpenses._avg.amount) || 0
  const minCashRequired = avgMonthlyExpense * 2

  if (totalBalance < minCashRequired && avgMonthlyExpense > 0) {
    alerts.push({
      id: "low-cash",
      type: "error",
      title: da?.lowCashBalance || "Low Cash Balance",
      description:
        da?.lowCashBalanceDesc ||
        "Cash balance is below 2 months of operating expenses",
      action: {
        label: da?.viewBanking || "View Banking",
        href: "/finance/banking",
      },
      timestamp: now,
    })
  }

  // Check for pending payroll
  const pendingPayroll = await db.payrollRun.count({
    where: {
      schoolId,
      status: "APPROVED",
      payDate: { lte: now },
    },
  })

  if (pendingPayroll > 0) {
    alerts.push({
      id: "pending-payroll",
      type: "info",
      title: da?.pendingPayroll || "Pending Payroll",
      description:
        da?.pendingPayrollDesc?.replace("{count}", String(pendingPayroll)) ||
        `${pendingPayroll} payroll run(s) ready for processing`,
      action: {
        label: da?.processPayroll || "Process Payroll",
        href: "/finance/payroll",
      },
      timestamp: now,
    })
  }

  // Check for budget overruns
  const budgetAllocations = await db.budgetAllocation.findMany({
    where: {
      schoolId,
    },
    include: {
      category: true,
      budget: true,
    },
  })

  // Filter for budget overruns (spent > allocated)
  const overrunAllocations = budgetAllocations.filter(
    (alloc) => decimalToNumber(alloc.spent) > decimalToNumber(alloc.allocated)
  )

  if (overrunAllocations.length > 0) {
    alerts.push({
      id: "budget-overrun",
      type: "warning",
      title: da?.budgetOverrun || "Budget Overrun",
      description:
        da?.budgetOverrunDesc?.replace(
          "{count}",
          String(overrunAllocations.length)
        ) ||
        `${overrunAllocations.length} budget categories have exceeded allocation`,
      action: {
        label: da?.reviewBudget || "Review Budget",
        href: "/finance/budget",
      },
      timestamp: now,
    })
  }

  // Success alert if collection rate is good
  const recentPayments = await db.payment.count({
    where: {
      schoolId,
      paymentDate: {
        gte: subMonths(now, 1),
      },
      status: "SUCCESS",
    },
  })

  if (recentPayments > 10) {
    alerts.push({
      id: "good-collection",
      type: "success",
      title: da?.strongCollectionRate || "Strong Collection Rate",
      description:
        da?.strongCollectionRateDesc?.replace(
          "{count}",
          String(recentPayments)
        ) || `${recentPayments} successful payments received this month`,
      timestamp: now,
    })
  }

  return alerts
}

export async function getQuickActionsForRole(
  role: string,
  lang: Locale = "ar"
) {
  // Load dictionary for i18n
  const dictionary = await getFinanceDictionary(lang)
  const qa = (dictionary as any)?.finance?.dashboardQuickActions as
    | Record<string, string>
    | undefined

  // Define quick actions based on user role
  const allActions = [
    {
      id: "create-invoice",
      label: qa?.createInvoice || "Create Invoice",
      icon: "FileText",
      href: "/finance/invoice/invoice/create",
      color: "blue",
      description: qa?.createInvoiceDesc || "Generate a new invoice",
      permission: "invoice.create",
    },
    {
      id: "record-payment",
      label: qa?.recordPayment || "Record Payment",
      icon: "DollarSign",
      href: "/finance/fees/payment",
      color: "green",
      description: qa?.recordPaymentDesc || "Record a fee payment",
      permission: "payment.create",
    },
    {
      id: "submit-expense",
      label: qa?.submitExpense || "Submit Expense",
      icon: "Receipt",
      href: "/finance/expenses/create",
      color: "orange",
      description: qa?.submitExpenseDesc || "Submit an expense claim",
      permission: "expense.create",
    },
    {
      id: "run-payroll",
      label: qa?.runPayroll || "Run Payroll",
      icon: "Users",
      href: "/finance/payroll/run",
      color: "purple",
      description: qa?.runPayrollDesc || "Process monthly payroll",
      permission: "payroll.process",
    },
    {
      id: "view-reports",
      label: qa?.financialReports || "Financial Reports",
      icon: "BarChart",
      href: "/finance/reports",
      color: "indigo",
      description: qa?.financialReportsDesc || "View financial statements",
      permission: "reports.view",
    },
    {
      id: "bank-reconciliation",
      label: qa?.bankReconciliation || "Bank Reconciliation",
      icon: "Building",
      href: "/finance/banking/reconciliation",
      color: "teal",
      description: qa?.bankReconciliationDesc || "Reconcile bank accounts",
      permission: "banking.reconcile",
    },
  ]

  // Filter actions based on role
  const rolePermissions: Record<string, string[]> = {
    ADMIN: [
      "invoice.create",
      "payment.create",
      "expense.create",
      "payroll.process",
      "reports.view",
      "banking.reconcile",
    ],
    ACCOUNTANT: [
      "invoice.create",
      "payment.create",
      "expense.create",
      "payroll.process",
      "reports.view",
      "banking.reconcile",
    ],
    TEACHER: ["expense.create", "reports.view"],
    STAFF: ["expense.create"],
    STUDENT: [],
    GUARDIAN: ["payment.create"],
  }

  const permissions = rolePermissions[role] || []
  return allActions.filter(
    (action) => !action.permission || permissions.includes(action.permission)
  )
}
