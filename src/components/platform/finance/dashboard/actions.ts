"use server"

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

import type { DashboardStats, FinancialAlert, RecentTransaction } from "./types"

// Cache tags for invalidation
const FINANCE_DASHBOARD_TAG = "finance-dashboard"
const CACHE_REVALIDATE_SECONDS = 300 // 5 minutes

// Helper to convert Decimal to number
function decimalToNumber(value: Decimal | null | undefined): number {
  if (!value) return 0
  return typeof value === "number" ? value : parseFloat(value.toString())
}

// Cached data fetching for dashboard (5 min TTL)
const getCachedDashboardData = unstable_cache(
  async (schoolId: string, startDate: Date, endDate: Date) => {
    const [
      invoices,
      payments,
      expenses,
      bankAccounts,
      budgets,
      feeStructures,
      students,
      payrollRuns,
      wallets,
      transactions,
    ] = await Promise.all([
      db.userInvoice.findMany({
        where: { schoolId, invoice_date: { gte: startDate, lte: endDate } },
      }),
      db.payment.findMany({
        where: {
          schoolId,
          paymentDate: { gte: startDate, lte: endDate },
          status: "SUCCESS",
        },
      }),
      db.expense.findMany({
        where: { schoolId, expenseDate: { gte: startDate, lte: endDate } },
        include: { category: true },
      }),
      db.bankAccount.findMany({ where: { schoolId } }),
      db.budget.findMany({
        where: { schoolId, status: "ACTIVE" },
        include: { allocations: { include: { category: true } } },
      }),
      db.feeStructure.findMany({ where: { schoolId, isActive: true } }),
      db.student.findMany({
        where: { schoolId },
        include: {
          feeAssignments: {
            where: { academicYear: new Date().getFullYear().toString() },
            include: { payments: { where: { status: "SUCCESS" } } },
          },
        },
      }),
      db.payrollRun.findMany({
        where: { schoolId, payDate: { gte: startDate, lte: endDate } },
      }),
      db.wallet.findMany({ where: { schoolId } }),
      db.transaction.findMany({
        where: { schoolId, date: { gte: startDate, lte: endDate } },
        orderBy: { date: "desc" },
        take: 10,
      }),
    ])

    return {
      invoices,
      payments,
      expenses,
      bankAccounts,
      budgets,
      feeStructures,
      students,
      payrollRuns,
      wallets,
      transactions,
    }
  },
  [FINANCE_DASHBOARD_TAG],
  { revalidate: CACHE_REVALIDATE_SECONDS, tags: [FINANCE_DASHBOARD_TAG] }
)

export async function getDashboardStats(
  dateRange: "month" | "quarter" | "year" = "month"
): Promise<DashboardStats> {
  const session = await auth()
  if (!session?.user?.schoolId) {
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

  // Use cached data fetching (5 min TTL) for performance
  const {
    invoices,
    payments,
    expenses,
    bankAccounts,
    budgets,
    feeStructures,
    students,
    payrollRuns,
    wallets,
    transactions,
  } = await getCachedDashboardData(schoolId, startDate, endDate)

  // Calculate Revenue Metrics
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0)
  const collectedRevenue = payments.reduce(
    (sum, pay) => sum + decimalToNumber(pay.amount),
    0
  )
  const outstandingRevenue = totalRevenue - collectedRevenue
  const collectionRate =
    totalRevenue > 0 ? (collectedRevenue / totalRevenue) * 100 : 0

  // Calculate Expense Metrics
  const totalExpenses = expenses.reduce(
    (sum, exp) => sum + decimalToNumber(exp.amount),
    0
  )

  // Group expenses by category
  const expenseByCategory = expenses.reduce(
    (acc, exp) => {
      const category = exp.category?.name || "Other"
      if (!acc[category]) acc[category] = 0
      acc[category] += decimalToNumber(exp.amount)
      return acc
    },
    {} as Record<string, number>
  )

  const expenseCategories = Object.entries(expenseByCategory).map(
    ([category, amount]) => ({
      category,
      amount,
      percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
    })
  )

  // Calculate Profit Metrics
  const grossProfit = collectedRevenue - totalExpenses
  const netProfit = grossProfit // Simplified - should include other deductions
  const profitMargin =
    collectedRevenue > 0 ? (netProfit / collectedRevenue) * 100 : 0

  // Calculate Cash Metrics
  const cashBalance = bankAccounts.reduce(
    (sum, acc) => sum + decimalToNumber(acc.currentBalance),
    0
  )
  const cashInflow = collectedRevenue
  const cashOutflow = totalExpenses
  const monthlyExpenses = totalExpenses // Assuming monthly data
  const cashRunway =
    monthlyExpenses > 0 ? Math.floor(cashBalance / monthlyExpenses) : 999

  // Calculate Invoice Metrics
  const totalInvoices = invoices.length
  const paidInvoices = invoices.filter((inv) => inv.status === "PAID").length
  const pendingInvoices = invoices.filter(
    (inv) => inv.status === "UNPAID"
  ).length
  const overdueInvoices = invoices.filter(
    (inv) =>
      inv.status === "OVERDUE" ||
      (inv.status === "UNPAID" && inv.due_date < now)
  ).length
  const overdueAmount = invoices
    .filter(
      (inv) =>
        inv.status === "OVERDUE" ||
        (inv.status === "UNPAID" && inv.due_date < now)
    )
    .reduce((sum, inv) => sum + inv.total, 0)

  // Calculate Payroll Metrics
  const totalPayroll = payrollRuns.reduce(
    (sum, run) => sum + decimalToNumber(run.totalNet),
    0
  )
  const payrollProcessed = payrollRuns.filter(
    (run) => run.status === "PAID"
  ).length
  const pendingPayroll = payrollRuns.filter(
    (run) => run.status !== "PAID" && run.status !== "CANCELLED"
  ).length

  // Calculate Fee Metrics
  const totalStudents = students.length
  const studentsWithPayments = students.filter((s) =>
    s.feeAssignments.some((fa) => fa.payments.length > 0)
  ).length
  const studentsWithoutPayments = totalStudents - studentsWithPayments
  const totalFeeAmount = students.reduce(
    (sum, s) =>
      sum +
      s.feeAssignments.reduce(
        (fSum, fa) => fSum + decimalToNumber(fa.finalAmount),
        0
      ),
    0
  )
  const averageFeePerStudent =
    totalStudents > 0 ? totalFeeAmount / totalStudents : 0

  // Bank Accounts
  const bankAccountsData = bankAccounts.map((acc) => ({
    name: acc.name,
    balance: decimalToNumber(acc.currentBalance),
    type: acc.type,
  }))

  // Budget Categories
  const budgetCategories = budgets.flatMap((budget) =>
    budget.allocations.map((alloc) => ({
      category: alloc.category.name,
      allocated: decimalToNumber(alloc.allocated),
      spent: decimalToNumber(alloc.spent),
      remaining: decimalToNumber(alloc.remaining),
      percentage:
        decimalToNumber(alloc.allocated) > 0
          ? (decimalToNumber(alloc.spent) / decimalToNumber(alloc.allocated)) *
            100
          : 0,
    }))
  )

  // Calculate budget totals
  const budgetTotal = budgetCategories.reduce(
    (sum, cat) => sum + cat.allocated,
    0
  )
  const budgetUsed = budgetCategories.reduce((sum, cat) => sum + cat.spent, 0)
  const budgetRemaining = budgetTotal - budgetUsed

  // Generate trends (mock data for now - should calculate from historical data)
  const generateTrend = (base: number, variance = 0.1) =>
    Array.from(
      { length: 12 },
      () => base * (1 + (Math.random() - 0.5) * variance)
    )

  const revenuesTrend = generateTrend(collectedRevenue / 12)
  const expensesTrend = generateTrend(totalExpenses / 12)
  const profitTrend = revenuesTrend.map((rev, i) => rev - expensesTrend[i])
  const collectionTrend = generateTrend(collectionRate, 0.05)

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
  limit = 10
): Promise<RecentTransaction[]> {
  const session = await auth()
  if (!session?.user?.schoolId) {
    throw new Error("Unauthorized")
  }

  const schoolId = session.user.schoolId

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
      description: `Fee payment from ${pay.student.givenName} ${pay.student.surname}`,
      amount: decimalToNumber(pay.amount),
      date: pay.paymentDate,
      status:
        pay.status === "SUCCESS"
          ? "completed"
          : pay.status === "FAILED"
            ? "failed"
            : "pending",
      category: "Student Fees",
      reference: pay.receiptNumber,
    })
  })

  // Sort by date and return top N
  return recentTransactions
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, limit)
}

export async function getFinancialAlerts(): Promise<FinancialAlert[]> {
  const session = await auth()
  if (!session?.user?.schoolId) {
    throw new Error("Unauthorized")
  }

  const schoolId = session.user.schoolId
  const now = new Date()
  const alerts: FinancialAlert[] = []

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
      title: "Overdue Invoices",
      description: `${overdueInvoices} invoice(s) are overdue and require attention`,
      action: {
        label: "View Invoices",
        href: "/finance/invoice/overdue",
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
      title: "Low Cash Balance",
      description: `Cash balance is below 2 months of operating expenses`,
      action: {
        label: "View Banking",
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
      title: "Pending Payroll",
      description: `${pendingPayroll} payroll run(s) ready for processing`,
      action: {
        label: "Process Payroll",
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
      title: "Budget Overrun",
      description: `${overrunAllocations.length} budget categories have exceeded allocation`,
      action: {
        label: "Review Budget",
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
      title: "Strong Collection Rate",
      description: `${recentPayments} successful payments received this month`,
      timestamp: now,
    })
  }

  return alerts
}

export async function getQuickActionsForRole(role: string) {
  // Define quick actions based on user role
  const allActions = [
    {
      id: "create-invoice",
      label: "Create Invoice",
      icon: "FileText",
      href: "/finance/invoice/create",
      color: "blue",
      description: "Generate a new invoice",
      permission: "invoice.create",
    },
    {
      id: "record-payment",
      label: "Record Payment",
      icon: "DollarSign",
      href: "/finance/fees/payment",
      color: "green",
      description: "Record a fee payment",
      permission: "payment.create",
    },
    {
      id: "submit-expense",
      label: "Submit Expense",
      icon: "Receipt",
      href: "/finance/expenses/create",
      color: "orange",
      description: "Submit an expense claim",
      permission: "expense.create",
    },
    {
      id: "run-payroll",
      label: "Run Payroll",
      icon: "Users",
      href: "/finance/payroll/run",
      color: "purple",
      description: "Process monthly payroll",
      permission: "payroll.process",
    },
    {
      id: "view-reports",
      label: "Financial Reports",
      icon: "BarChart",
      href: "/finance/reports",
      color: "indigo",
      description: "View financial statements",
      permission: "reports.view",
    },
    {
      id: "bank-reconciliation",
      label: "Bank Reconciliation",
      icon: "Building",
      href: "/finance/banking/reconciliation",
      color: "teal",
      description: "Reconcile bank accounts",
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
