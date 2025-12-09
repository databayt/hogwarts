import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { Calendar, DollarSign, Receipt, CreditCard, CircleAlert, Clock, ChevronRight, FileText, Wallet, PiggyBank, ArrowDownRight, ArrowUpRight } from "lucide-react"
import { format, isToday, isTomorrow } from "date-fns"
import { QuickActionsGrid } from "./quick-action"
import { getQuickActionsByRole } from "./quick-actions-config"
import { getTenantContext } from "@/lib/tenant-context"
import { db } from "@/lib/db"
import { WelcomeBanner } from "./welcome-banner"
import { MetricCard } from "./metric-card"
import { ActivityRings } from "./activity-rings"
import { ProgressCard } from "./progress-card"
import { EmptyState } from "./empty-state"
import { RevenueChart } from "./revenue-chart"
import { PerformanceGauge } from "./performance-gauge"
import { WeeklyActivityChart } from "./weekly-chart"
import Link from "next/link"

interface AccountantDashboardProps {
  user: {
    id: string
    email?: string | null
    role?: string
    schoolId?: string | null
    name?: string
  }
  dictionary?: Dictionary["school"]
  locale?: string
}

export async function AccountantDashboard({
  user,
  dictionary,
  locale = "en",
}: AccountantDashboardProps) {
  // Get tenant context for subdomain
  const { schoolId } = await getTenantContext()

  // Get school subdomain for URL construction with error handling
  let school = null
  try {
    if (schoolId) {
      school = await db.school.findUnique({
        where: { id: schoolId },
        select: { domain: true, name: true },
      })
    }
  } catch (error) {
    console.error("[AccountantDashboard] Error fetching school domain:", error)
  }

  // Fetch real data from database
  const [totalInvoices, paidInvoices, unpaidInvoices] = user.schoolId
    ? await Promise.all([
        db.userInvoice.count({ where: { schoolId: user.schoolId } }),
        db.userInvoice.count({ where: { schoolId: user.schoolId, status: "PAID" } }),
        db.userInvoice.count({ where: { schoolId: user.schoolId, status: "UNPAID" } }),
      ])
    : [0, 0, 0]

  // Mock data for demo (would be replaced with real queries in production)
  const mockFeeCollectionStatus = {
    totalFees: 180000,
    collected: 135000,
    outstanding: 45000,
    collectionRate: 75.0,
    overdue: 12000,
  }

  const mockMonthlyRevenue = [
    { month: "Sep", revenue: 42000, expenses: 35000 },
    { month: "Oct", revenue: 45000, expenses: 38000 },
    { month: "Nov", revenue: 48000, expenses: 36000 },
    { month: "Dec", revenue: 52000, expenses: 42000 },
    { month: "Jan", revenue: 55000, expenses: 40000 },
    { month: "Feb", revenue: 58000, expenses: 44000 },
  ]

  const weeklyCollections = [
    { day: "Mon", value: 8500 },
    { day: "Tue", value: 12000 },
    { day: "Wed", value: 9500 },
    { day: "Thu", value: 15000 },
    { day: "Fri", value: 7000 },
  ]

  const mockTodaysTransactions = [
    { type: "Payment", amount: 2500, description: "Student fee payment - Grade 10", status: "completed", time: "9:30 AM" },
    { type: "Refund", amount: -150, description: "Overpayment refund - Grade 7", status: "pending", time: "10:15 AM" },
    { type: "Payment", amount: 1800, description: "Lab fee - Science Dept", status: "completed", time: "11:00 AM" },
    { type: "Payment", amount: 3200, description: "Tuition payment - Grade 12", status: "completed", time: "2:30 PM" },
  ]

  const mockPendingPayments = [
    { student: "Emma Johnson", grade: "Grade 10", amount: 2500, dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), status: "overdue" },
    { student: "Michael Brown", grade: "Grade 8", amount: 1800, dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), status: "due-soon" },
    { student: "Sarah Davis", grade: "Grade 11", amount: 3200, dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), status: "upcoming" },
    { student: "James Wilson", grade: "Grade 9", amount: 2100, dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), status: "upcoming" },
  ]

  const mockFinancialCalendar = [
    { event: "Monthly Report Due", date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), type: "reporting", priority: "high" },
    { event: "Audit Preparation", date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), type: "audit", priority: "high" },
    { event: "Tax Filing Deadline", date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), type: "tax", priority: "critical" },
    { event: "Budget Review", date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), type: "budget", priority: "medium" },
  ]

  // Activity rings for financial health
  const financialRings = [
    {
      label: "Collection",
      value: mockFeeCollectionStatus.collectionRate,
      color: "#22c55e",
      current: mockFeeCollectionStatus.collected,
      target: mockFeeCollectionStatus.totalFees,
      unit: "collected",
    },
    {
      label: "Invoices",
      value: totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 0,
      color: "#3b82f6",
      current: paidInvoices,
      target: totalInvoices,
      unit: "paid",
    },
    {
      label: "Outstanding",
      value: Math.max(0, 100 - (mockFeeCollectionStatus.outstanding / mockFeeCollectionStatus.totalFees) * 100),
      color: mockFeeCollectionStatus.outstanding > 50000 ? "#ef4444" : "#f59e0b",
      current: mockFeeCollectionStatus.outstanding,
      target: 0,
      unit: "pending",
    },
  ]

  // Calculate totals for today
  const todayTotal = mockTodaysTransactions
    .filter(t => t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <WelcomeBanner
        userName={user.name || user.email?.split("@")[0]}
        role="Accountant"
        subtitle={`Today's collections: $${todayTotal.toLocaleString()}`}
      />

      {/* Key Metrics Row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Fees Collected"
          value={`$${(mockFeeCollectionStatus.collected / 1000).toFixed(0)}K`}
          icon={DollarSign}
          iconColor="text-emerald-500"
          change={8.5}
          changeType="positive"
          href={`/${locale}/s/${school?.domain}/finance`}
        />
        <MetricCard
          title="Outstanding"
          value={`$${(mockFeeCollectionStatus.outstanding / 1000).toFixed(0)}K`}
          icon={Wallet}
          iconColor="text-amber-500"
          change={-12}
          changeType="negative"
          href={`/${locale}/s/${school?.domain}/finance`}
        />
        <MetricCard
          title="Total Invoices"
          value={totalInvoices}
          icon={Receipt}
          iconColor="text-blue-500"
          href={`/${locale}/s/${school?.domain}/invoice`}
        />
        <MetricCard
          title="Overdue"
          value={`$${(mockFeeCollectionStatus.overdue / 1000).toFixed(0)}K`}
          icon={CircleAlert}
          iconColor="text-destructive"
          href={`/${locale}/s/${school?.domain}/finance`}
        />
      </div>

      {/* Quick Actions */}
      <QuickActionsGrid
        actions={getQuickActionsByRole("ACCOUNTANT", dictionary, school?.domain)}
        locale={locale}
      />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue vs Expenses Chart */}
        <div className="lg:col-span-2">
          <RevenueChart
            data={mockMonthlyRevenue}
            title="Revenue vs Expenses"
            description="Monthly financial comparison"
            currency="$"
          />
        </div>

        {/* Financial Health Rings */}
        <ActivityRings activities={financialRings} title="Financial Health" />
      </div>

      {/* Secondary Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Weekly Collections */}
        <WeeklyActivityChart
          data={weeklyCollections}
          title="Weekly Collections"
          label="Amount"
          color="hsl(var(--chart-1))"
        />

        {/* Collection Rate Gauge */}
        <PerformanceGauge
          value={Math.round(mockFeeCollectionStatus.collectionRate)}
          label="Collection Rate"
          description="Target: 95%"
          maxValue={100}
          color="hsl(142, 76%, 36%)"
        />
      </div>

      {/* Transactions and Payments Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Today's Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Today's Transactions
            </CardTitle>
            <Badge variant="outline">{format(new Date(), "MMM d")}</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockTodaysTransactions.length > 0 ? (
              mockTodaysTransactions.map((transaction, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${transaction.amount > 0 ? "bg-emerald-100 dark:bg-emerald-950" : "bg-red-100 dark:bg-red-950"}`}>
                      {transaction.amount > 0 ? (
                        <ArrowDownRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">{transaction.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold ${
                        transaction.amount > 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-destructive"
                      }`}
                    >
                      {transaction.amount > 0 ? "+" : ""}${Math.abs(transaction.amount).toLocaleString()}
                    </p>
                    <Badge
                      variant={transaction.status === "completed" ? "default" : "secondary"}
                      className={transaction.status === "completed" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" : ""}
                    >
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon={CreditCard}
                title="No transactions today"
                description="Transactions will appear here"
              />
            )}
          </CardContent>
        </Card>

        {/* Pending Payments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending Payments
            </CardTitle>
            <Link
              href={`/${locale}/s/${school?.domain}/finance`}
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockPendingPayments.length > 0 ? (
              mockPendingPayments.map((payment, index) => {
                const dueDate = new Date(payment.dueDate)
                const isOverdue = dueDate < new Date()
                const isDueToday = isToday(dueDate)
                const isDueTomorrow = isTomorrow(dueDate)

                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{payment.student}</p>
                      <p className="text-sm text-muted-foreground">
                        {payment.grade} • Due: {format(dueDate, "MMM d")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${payment.amount.toLocaleString()}</p>
                      <Badge
                        variant={
                          isOverdue
                            ? "destructive"
                            : isDueToday || isDueTomorrow
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {isOverdue ? "Overdue" : isDueToday ? "Due Today" : isDueTomorrow ? "Tomorrow" : format(dueDate, "MMM d")}
                      </Badge>
                    </div>
                  </div>
                )
              })
            ) : (
              <EmptyState
                icon={Receipt}
                title="No pending payments"
                description="All payments are up to date"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Financial Calendar */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Financial Calendar
          </CardTitle>
          <Badge variant="outline">{mockFinancialCalendar.length} upcoming</Badge>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {mockFinancialCalendar.map((event, index) => {
              const eventDate = new Date(event.date)
              const daysUntil = Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      event.priority === "critical" ? "bg-red-100 dark:bg-red-950" :
                      event.priority === "high" ? "bg-amber-100 dark:bg-amber-950" :
                      "bg-blue-100 dark:bg-blue-950"
                    }`}>
                      <Calendar className={`h-4 w-4 ${
                        event.priority === "critical" ? "text-destructive" :
                        event.priority === "high" ? "text-amber-600 dark:text-amber-400" :
                        "text-blue-600 dark:text-blue-400"
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium">{event.event}</p>
                      <p className="text-sm text-muted-foreground capitalize">{event.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        event.priority === "critical"
                          ? "destructive"
                          : event.priority === "high"
                            ? "default"
                            : "secondary"
                      }
                    >
                      {daysUntil <= 0 ? "Today" : daysUntil === 1 ? "1 day" : `${daysUntil} days`}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(eventDate, "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Financial Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-4">
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                ${(mockFeeCollectionStatus.collected / 1000).toFixed(0)}K
              </p>
              <p className="text-sm text-muted-foreground mt-1">Total Collected</p>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                ${(mockFeeCollectionStatus.outstanding / 1000).toFixed(0)}K
              </p>
              <p className="text-sm text-muted-foreground mt-1">Outstanding</p>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {totalInvoices}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Invoices</p>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-3xl font-bold text-primary">
                {mockFeeCollectionStatus.collectionRate.toFixed(0)}%
              </p>
              <p className="text-sm text-muted-foreground mt-1">Collection Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <ProgressCard
          title="Fee Collection"
          current={mockFeeCollectionStatus.collected}
          total={mockFeeCollectionStatus.totalFees}
          unit="collected"
          icon={PiggyBank}
          showPercentage
        />
        <ProgressCard
          title="Invoices Paid"
          current={paidInvoices}
          total={Math.max(totalInvoices, 1)}
          unit="invoices"
          icon={FileText}
          showPercentage
        />
        <ProgressCard
          title="Fiscal Year Progress"
          current={7}
          total={12}
          unit="months"
          icon={Calendar}
          showPercentage
        />
      </div>
    </div>
  )
}
