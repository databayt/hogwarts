import { auth } from "@/auth"
import { getDashboardStats, getRecentTransactions, getFinancialAlerts, getQuickActionsForRole } from "./actions"
import { KPICard } from "./kpi-card"
import { RevenueChart } from "./revenue-chart"
import { ExpenseChart } from "./expense-chart"
import { QuickActions } from "./quick-actions"
import { AlertCard } from "./alert-card"
import { TransactionList } from "./transaction-list"
import { CashFlowChart } from "./cash-flow-chart"
import { BankAccountsSummary } from "./bank-accounts-summary"
import type { FinancialKPI } from "./types"
import { TrendingUp, TrendingDown, DollarSign, Receipt, Users, Wallet, Building, AlertCircle } from "lucide-react"

export async function FinanceDashboardContent() {
  const session = await auth()
  if (!session?.user) {
    return <div>Unauthorized</div>
  }

  const userRole = session.user.role || 'USER'

  // Fetch all lab data in parallel
  const [stats, transactions, alerts, quickActions] = await Promise.all([
    getDashboardStats('month'),
    getRecentTransactions(5),
    getFinancialAlerts(),
    getQuickActionsForRole(userRole)
  ])

  // Prepare KPIs based on role
  const getKPIsForRole = (): FinancialKPI[] => {
    const allKPIs: FinancialKPI[] = [
      {
        id: 'total-revenue',
        title: 'Total Revenue',
        value: stats.totalRevenue,
        change: 12,
        changeType: 'increase',
        icon: '💰',
        color: 'green',
        description: 'Total invoiced amount',
        trend: stats.revenuesTrend.slice(-7)
      },
      {
        id: 'collected-revenue',
        title: 'Collected Revenue',
        value: stats.collectedRevenue,
        change: stats.collectionRate > 75 ? 5 : -5,
        changeType: stats.collectionRate > 75 ? 'increase' : 'decrease',
        icon: '✅',
        color: 'blue',
        description: `${stats.collectionRate.toFixed(1)}% collection rate`
      },
      {
        id: 'total-expenses',
        title: 'Total Expenses',
        value: stats.totalExpenses,
        change: 3,
        changeType: 'increase',
        icon: '💸',
        color: 'red',
        description: 'All expenses this period'
      },
      {
        id: 'net-profit',
        title: 'Net Profit',
        value: stats.netProfit,
        change: stats.profitMargin,
        changeType: stats.netProfit > 0 ? 'increase' : 'decrease',
        icon: '📈',
        color: stats.netProfit > 0 ? 'green' : 'red',
        description: `${stats.profitMargin.toFixed(1)}% profit margin`,
        trend: stats.profitTrend.slice(-7)
      },
      {
        id: 'cash-balance',
        title: 'Cash Balance',
        value: stats.cashBalance,
        change: 8,
        changeType: 'increase',
        icon: '🏦',
        color: 'purple',
        description: `${stats.cashRunway} months runway`
      },
      {
        id: 'outstanding-invoices',
        title: 'Outstanding',
        value: stats.outstandingRevenue,
        change: stats.overdueInvoices,
        changeType: stats.overdueInvoices > 0 ? 'increase' : 'neutral',
        icon: '⏰',
        color: 'yellow',
        description: `${stats.overdueInvoices} overdue invoices`
      },
      {
        id: 'students-paid',
        title: 'Students Paid',
        value: `${stats.studentsWithPayments}/${stats.totalStudents}`,
        change: (stats.studentsWithPayments / stats.totalStudents) * 100,
        changeType: 'neutral',
        icon: '👥',
        color: 'blue',
        description: 'Fee payment status'
      },
      {
        id: 'payroll-expense',
        title: 'Payroll',
        value: stats.totalPayroll,
        change: 0,
        changeType: 'neutral',
        icon: '💼',
        color: 'orange',
        description: `${stats.payrollProcessed} processed, ${stats.pendingPayroll} pending`
      }
    ]

    // Filter KPIs based on role
    switch (userRole) {
      case 'ADMIN':
      case 'ACCOUNTANT':
        return allKPIs // Show all KPIs
      case 'TEACHER':
      case 'STAFF':
        return allKPIs.filter(kpi =>
          ['net-profit', 'payroll-expense'].includes(kpi.id)
        )
      case 'STUDENT':
      case 'GUARDIAN':
        return allKPIs.filter(kpi =>
          ['students-paid', 'outstanding-invoices'].includes(kpi.id)
        )
      default:
        return allKPIs.slice(0, 4) // Show basic KPIs
    }
  }

  const kpis = getKPIsForRole()

  // Check if user has full access
  const hasFullAccess = ['ADMIN', 'ACCOUNTANT'].includes(userRole)
  const hasLimitedAccess = ['TEACHER', 'STAFF'].includes(userRole)
  const hasMinimalAccess = ['STUDENT', 'GUARDIAN'].includes(userRole)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Financial Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your institution's financial performance
        </p>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.slice(0, 2).map(alert => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map(kpi => (
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
        <BudgetOverview categories={stats.budgetCategories} />
      )}

      {/* Footer Stats */}
      <div className="grid gap-4 md:grid-cols-4 pt-6 border-t">
        <StatCard
          title="Invoice Collection"
          value={`${stats.paidInvoices}/${stats.totalInvoices}`}
          description="Invoices paid"
          icon={<Receipt className="h-4 w-4" />}
        />
        <StatCard
          title="Budget Utilization"
          value={`${((stats.budgetUsed / (stats.budgetUsed + stats.budgetRemaining)) * 100).toFixed(0)}%`}
          description="Of allocated budget"
          icon={<DollarSign className="h-4 w-4" />}
        />
        <StatCard
          title="Active Students"
          value={stats.totalStudents}
          description="Enrolled students"
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          title="Bank Accounts"
          value={stats.bankAccounts.length}
          description="Active accounts"
          icon={<Building className="h-4 w-4" />}
        />
      </div>
    </div>
  )
}

// Helper Components
function StatCard({ title, value, description, icon }: {
  title: string
  value: string | number
  description: string
  icon: React.ReactNode
}) {
  return (
    <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
      <div className="p-2 bg-background rounded-md">
        {icon}
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

function BudgetOverview({ categories }: {
  categories: {
    category: string
    allocated: number
    spent: number
    remaining: number
    percentage: number
  }[]
}) {
  return (
    <div className="rounded-lg border p-6">
      <h3 className="text-lg font-semibold mb-4">Budget Overview</h3>
      <div className="space-y-3">
        {categories.slice(0, 5).map(cat => (
          <div key={cat.category} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span>{cat.category}</span>
              <span className="text-muted-foreground">
                SDG {new Intl.NumberFormat('en-SD').format(cat.spent)} / {new Intl.NumberFormat('en-SD').format(cat.allocated)}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  cat.percentage > 90 ? 'bg-red-500' :
                  cat.percentage > 75 ? 'bg-yellow-500' :
                  'bg-green-500'
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