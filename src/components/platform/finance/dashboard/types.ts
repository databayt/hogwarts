// Dashboard Types for Finance Module

export interface FinancialKPI {
  id: string
  title: string
  value: string | number
  change?: number
  changeType?: "increase" | "decrease" | "neutral"
  icon?: string
  description?: string
  trend?: number[]
  color?: "blue" | "green" | "red" | "yellow" | "purple" | "orange"
}

export interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string
    fill?: boolean
  }[]
}

export interface DashboardStats {
  // Revenue Metrics
  totalRevenue: number
  collectedRevenue: number
  outstandingRevenue: number
  collectionRate: number

  // Expense Metrics
  totalExpenses: number
  budgetUsed: number
  budgetRemaining: number
  expenseCategories: {
    category: string
    amount: number
    percentage: number
  }[]

  // Profit Metrics
  grossProfit: number
  netProfit: number
  profitMargin: number

  // Cash Flow Metrics
  cashBalance: number
  cashInflow: number
  cashOutflow: number
  cashRunway: number // months

  // Invoice Metrics
  totalInvoices: number
  paidInvoices: number
  pendingInvoices: number
  overdueInvoices: number
  overdueAmount: number

  // Payroll Metrics
  totalPayroll: number
  payrollProcessed: number
  pendingPayroll: number

  // Fee Metrics
  totalStudents: number
  studentsWithPayments: number
  studentsWithoutPayments: number
  averageFeePerStudent: number

  // Banking Metrics
  bankAccounts: {
    name: string
    balance: number
    type: string
  }[]

  // Budget Metrics
  budgetCategories: {
    category: string
    allocated: number
    spent: number
    remaining: number
    percentage: number
  }[]

  // Trends
  revenuesTrend: number[] // last 12 months
  expensesTrend: number[] // last 12 months
  profitTrend: number[] // last 12 months
  collectionTrend: number[] // last 12 months
}

export interface QuickAction {
  id: string
  label: string
  icon: string
  href?: string
  action?: () => void
  color?: string
  description?: string
  permission?: string
}

export interface RecentTransaction {
  id: string
  type: "income" | "expense" | "transfer"
  description: string
  amount: number
  date: Date
  status: "completed" | "pending" | "failed"
  category?: string
  reference?: string
}

export interface FinancialAlert {
  id: string
  type: "warning" | "error" | "info" | "success"
  title: string
  description: string
  action?: {
    label: string
    href: string
  }
  timestamp: Date
}

export interface DashboardFilters {
  dateRange: "today" | "week" | "month" | "quarter" | "year" | "custom"
  startDate?: Date
  endDate?: Date
  schoolYear?: string
  department?: string
  category?: string
}

export interface RoleBasedDashboard {
  role: "ADMIN" | "ACCOUNTANT" | "TEACHER" | "STUDENT" | "GUARDIAN" | "STAFF"
  kpis: FinancialKPI[]
  charts: {
    revenue?: boolean
    expenses?: boolean
    cashFlow?: boolean
    feeCollection?: boolean
    budgetUtilization?: boolean
    payroll?: boolean
  }
  quickActions: QuickAction[]
  sections: {
    overview: boolean
    invoices: boolean
    expenses: boolean
    banking: boolean
    reports: boolean
    alerts: boolean
  }
}
