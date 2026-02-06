import Link from "next/link"
import { format, isToday, isTomorrow } from "date-fns"
import { ArrowDownRight, ArrowUpRight, ChevronRight } from "lucide-react"

import { getTenantContext } from "@/lib/tenant-context"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { getFinancialSummary, getQuickLookData } from "./actions"
import { ActivityRings } from "./activity-rings"
import { ChartSection } from "./chart-section"
import { EmptyState } from "./empty-state"
import { InvoiceHistorySection } from "./invoice-history-section"
import { MetricCard } from "./metric-card"
import { PerformanceGauge } from "./performance-gauge"
import { ProgressCard } from "./progress-card"
import { QuickActions } from "./quick-actions"
import { getQuickActionsByRole } from "./quick-actions-config"
import { QuickLookSection } from "./quick-look-section"
import { ResourceUsageSection } from "./resource-usage-section"
import { RevenueChart } from "./revenue-chart"
import { SectionHeading } from "./section-heading"
import { Upcoming } from "./upcoming"
import { Weather } from "./weather"
import { getWeatherData } from "./weather-actions"
import { WeeklyActivityChart } from "./weekly-chart"

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
  // Wrap entire component in try-catch for comprehensive error handling (like AdminDashboard)
  try {
    // Fetch Quick Look and Weather data
    let quickLookData
    let weatherData
    try {
      const [qlData, weather] = await Promise.all([
        getQuickLookData(),
        getWeatherData(),
      ])
      quickLookData = qlData
      weatherData = weather
    } catch (error) {
      console.error("[AccountantDashboard] Error fetching data:", error)
    }

    // Get tenant context for subdomain with error handling
    let schoolId: string | null = null
    try {
      const tenantContext = await getTenantContext()
      schoolId = tenantContext.schoolId
    } catch (error) {
      console.error(
        "[AccountantDashboard] Error getting tenant context:",
        error
      )
    }

    // Get school subdomain for URL construction with error handling
    let school: { domain: string | null; name: string | null } | null = null
    try {
      if (schoolId) {
        const { db } = await import("@/lib/db")
        const id = schoolId
        school = await db.school.findUnique({
          where: { id },
          select: { domain: true, name: true },
        })
      }
    } catch (error) {
      console.error(
        "[AccountantDashboard] Error fetching school domain:",
        error
      )
    }

    // Fetch real invoice data from database with error handling
    let totalInvoices = 0
    let paidInvoices = 0
    let unpaidInvoices = 0
    try {
      if (user.schoolId) {
        const { db } = await import("@/lib/db")
        const [total, paid, unpaid] = await Promise.all([
          db.userInvoice.count({ where: { schoolId: user.schoolId } }),
          db.userInvoice.count({
            where: { schoolId: user.schoolId, status: "PAID" },
          }),
          db.userInvoice.count({
            where: { schoolId: user.schoolId, status: "UNPAID" },
          }),
        ])
        totalInvoices = total
        paidInvoices = paid
        unpaidInvoices = unpaid
      }
    } catch (error) {
      console.error("[AccountantDashboard] Error fetching invoice data:", error)
    }

    // Fetch financial summary from centralized server action
    let financialData
    try {
      financialData = await getFinancialSummary()
    } catch (error) {
      console.error(
        "[AccountantDashboard] Error fetching financial summary:",
        error
      )
    }

    // Destructure with defaults for error handling
    const {
      revenue = { total: 0, pending: 0, overdue: 0, collectionRate: 0 },
      expenses = { total: 0, categories: [], budgetUtilization: 0 },
      budget = {
        allocated: 0,
        remaining: 0,
        utilizationRate: 0,
        status: "unknown",
      },
      recentTransactions = [],
      defaulters = [],
    } = financialData || {}

    // Map real data to display format with fallback
    const mockFeeCollectionStatus = {
      totalFees: revenue.total + revenue.pending + revenue.overdue,
      collected: revenue.total,
      outstanding: revenue.pending,
      collectionRate: revenue.collectionRate,
      overdue: revenue.overdue,
    }

    // Monthly revenue chart data (still mock as we'd need historical data)
    const mockMonthlyRevenue = [
      { month: "Sep", revenue: 42000, expenses: 35000 },
      { month: "Oct", revenue: 45000, expenses: 38000 },
      { month: "Nov", revenue: 48000, expenses: 36000 },
      { month: "Dec", revenue: 52000, expenses: 42000 },
      { month: "Jan", revenue: 55000, expenses: 40000 },
      {
        month: "Feb",
        revenue: Math.round(revenue.total / 1000) * 1000 || 58000,
        expenses: Math.round(expenses.total / 1000) * 1000 || 44000,
      },
    ]

    const weeklyCollections = [
      { day: "Mon", value: 8500 },
      { day: "Tue", value: 12000 },
      { day: "Wed", value: 9500 },
      { day: "Thu", value: 15000 },
      { day: "Fri", value: 7000 },
    ]

    // Map recent transactions from real data
    const mockTodaysTransactions =
      recentTransactions.length > 0
        ? recentTransactions
            .slice(0, 4)
            .map(
              (t: {
                id: string
                type: string
                amount: number
                date: Date
                studentName?: string
                description?: string
                status?: string
              }) => ({
                type: t.type === "fee_payment" ? "Payment" : "Expense",
                amount: t.amount,
                description: t.studentName
                  ? `Fee payment - ${t.studentName}`
                  : t.description || "Transaction",
                status: t.status === "completed" ? "completed" : "pending",
                time: format(t.date, "h:mm a"),
              })
            )
        : [
            {
              type: "Payment",
              amount: 2500,
              description: "Student fee payment - Grade 10",
              status: "completed",
              time: "9:30 AM",
            },
            {
              type: "Payment",
              amount: 1800,
              description: "Lab fee - Science Dept",
              status: "completed",
              time: "11:00 AM",
            },
          ]

    // Map defaulters to pending payments format
    const mockPendingPayments =
      defaulters.length > 0
        ? defaulters
            .slice(0, 4)
            .map(
              (d: {
                id: string
                name: string
                class: string
                outstandingAmount: number
                monthsOverdue: number
                lastPaymentDate: Date | null
              }) => ({
                student: d.name,
                grade: d.class,
                amount: d.outstandingAmount,
                dueDate:
                  d.lastPaymentDate ||
                  new Date(
                    Date.now() - d.monthsOverdue * 30 * 24 * 60 * 60 * 1000
                  ),
                status: d.monthsOverdue > 1 ? "overdue" : "due-soon",
              })
            )
        : [
            {
              student: "Emma Johnson",
              grade: "Grade 10",
              amount: 2500,
              dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
              status: "overdue",
            },
            {
              student: "Michael Brown",
              grade: "Grade 8",
              amount: 1800,
              dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
              status: "due-soon",
            },
          ]

    const mockFinancialCalendar = [
      {
        event: "Monthly Report Due",
        date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        type: "reporting",
        priority: "high",
      },
      {
        event: "Audit Preparation",
        date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        type: "audit",
        priority: "high",
      },
      {
        event: "Tax Filing Deadline",
        date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        type: "tax",
        priority: "critical",
      },
      {
        event: "Budget Review",
        date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        type: "budget",
        priority: "medium",
      },
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
        value: Math.max(
          0,
          100 -
            (mockFeeCollectionStatus.outstanding /
              mockFeeCollectionStatus.totalFees) *
              100
        ),
        color:
          mockFeeCollectionStatus.outstanding > 50000 ? "#ef4444" : "#f59e0b",
        current: mockFeeCollectionStatus.outstanding,
        target: 0,
        unit: "pending",
      },
    ]

    // Calculate totals for today
    const todayTotal = mockTodaysTransactions
      .filter((t) => t.status === "completed")
      .reduce((sum, t) => sum + t.amount, 0)

    return (
      <div className="space-y-6">
        {/* ============ TOP HERO SECTION (Unified Order) ============ */}
        {/* Section 1: Upcoming + Weather */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:gap-8">
          <Upcoming
            role="ACCOUNTANT"
            locale={locale}
            subdomain={school?.domain || ""}
          />
          <Weather
            current={weatherData?.current}
            forecast={weatherData?.forecast}
            location={weatherData?.location}
          />
        </div>

        {/* Section 2: Quick Look (no title) */}
        <QuickLookSection
          locale={locale}
          subdomain={school?.domain || ""}
          data={quickLookData}
        />

        {/* Section 3: Quick Actions (4 focused actions) */}
        <section>
          <SectionHeading title="Quick Actions" />
          <QuickActions
            actions={getQuickActionsByRole(
              "ACCOUNTANT",
              school?.domain ?? undefined
            )}
            locale={locale}
          />
        </section>

        {/* Section 4: Resource Usage */}
        <ResourceUsageSection role="ACCOUNTANT" />

        {/* Section 5: Invoice History */}
        <InvoiceHistorySection role="ACCOUNTANT" />

        {/* Section 6: Analytics Charts */}
        <ChartSection role="ACCOUNTANT" />

        {/* ============ ACCOUNTANT-SPECIFIC SECTIONS ============ */}
        {/* Key Metrics Row */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricCard
            title="Fees Collected"
            value={`$${(mockFeeCollectionStatus.collected / 1000).toFixed(0)}K`}
            iconName="DollarSign"
            iconColor="text-emerald-500"
            change={8.5}
            changeType="positive"
            href={`/${locale}/s/${school?.domain}/finance`}
          />
          <MetricCard
            title="Outstanding"
            value={`$${(mockFeeCollectionStatus.outstanding / 1000).toFixed(0)}K`}
            iconName="Clock"
            iconColor="text-amber-500"
            change={-12}
            changeType="negative"
            href={`/${locale}/s/${school?.domain}/finance`}
          />
          <MetricCard
            title="Total Invoices"
            value={totalInvoices}
            iconName="FileText"
            iconColor="text-blue-500"
            href={`/${locale}/s/${school?.domain}/invoice`}
          />
          <MetricCard
            title="Overdue"
            value={`$${(mockFeeCollectionStatus.overdue / 1000).toFixed(0)}K`}
            iconName="Bell"
            iconColor="text-destructive"
            href={`/${locale}/s/${school?.domain}/finance`}
          />
        </div>

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
              <CardTitle className="text-base">
                Today&apos;s Transactions
              </CardTitle>
              <Badge variant="outline">{format(new Date(), "MMM d")}</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockTodaysTransactions.length > 0 ? (
                mockTodaysTransactions.map((transaction, index) => (
                  <div
                    key={index}
                    className="hover:bg-muted/50 flex items-center justify-between rounded-lg border p-3 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`rounded-full p-2 ${transaction.amount > 0 ? "bg-emerald-100 dark:bg-emerald-950" : "bg-red-100 dark:bg-red-950"}`}
                      >
                        {transaction.amount > 0 ? (
                          <ArrowDownRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <ArrowUpRight className="text-destructive h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-muted-foreground text-sm">
                          {transaction.time}
                        </p>
                      </div>
                    </div>
                    <div className="text-end">
                      <p
                        className={`font-bold ${
                          transaction.amount > 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-destructive"
                        }`}
                      >
                        {transaction.amount > 0 ? "+" : ""}$
                        {Math.abs(transaction.amount).toLocaleString()}
                      </p>
                      <Badge
                        variant={
                          transaction.status === "completed"
                            ? "default"
                            : "secondary"
                        }
                        className={
                          transaction.status === "completed"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                            : ""
                        }
                      >
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  iconName="DollarSign"
                  title="No transactions today"
                  description="Transactions will appear here"
                />
              )}
            </CardContent>
          </Card>

          {/* Pending Payments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Pending Payments</CardTitle>
              <Link
                href={`/${locale}/s/${school?.domain}/finance`}
                className="text-primary flex items-center gap-1 text-sm hover:underline"
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
                      className="hover:bg-muted/50 flex items-center justify-between rounded-lg border p-3 transition-colors"
                    >
                      <div>
                        <p className="font-medium">{payment.student}</p>
                        <p className="text-muted-foreground text-sm">
                          {payment.grade} • Due: {format(dueDate, "MMM d")}
                        </p>
                      </div>
                      <div className="text-end">
                        <p className="font-bold">
                          ${payment.amount.toLocaleString()}
                        </p>
                        <Badge
                          variant={
                            isOverdue
                              ? "destructive"
                              : isDueToday || isDueTomorrow
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {isOverdue
                            ? "Overdue"
                            : isDueToday
                              ? "Due Today"
                              : isDueTomorrow
                                ? "Tomorrow"
                                : format(dueDate, "MMM d")}
                        </Badge>
                      </div>
                    </div>
                  )
                })
              ) : (
                <EmptyState
                  iconName="FileText"
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
            <CardTitle className="text-base">Financial Calendar</CardTitle>
            <Badge variant="outline">
              {mockFinancialCalendar.length} upcoming
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {mockFinancialCalendar.map((event, index) => {
                const eventDate = new Date(event.date)
                const daysUntil = Math.ceil(
                  (eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                )

                return (
                  <div
                    key={index}
                    className="hover:bg-muted/50 flex items-center justify-between rounded-lg border p-3 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{event.event}</p>
                      <p className="text-muted-foreground text-sm capitalize">
                        {event.type}
                      </p>
                    </div>
                    <div className="text-end">
                      <Badge
                        variant={
                          event.priority === "critical"
                            ? "destructive"
                            : event.priority === "high"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {daysUntil <= 0
                          ? "Today"
                          : daysUntil === 1
                            ? "1 day"
                            : `${daysUntil} days`}
                      </Badge>
                      <p className="text-muted-foreground mt-1 text-xs">
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
              <div className="bg-muted/30 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  ${(mockFeeCollectionStatus.collected / 1000).toFixed(0)}K
                </p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Total Collected
                </p>
              </div>
              <div className="bg-muted/30 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                  ${(mockFeeCollectionStatus.outstanding / 1000).toFixed(0)}K
                </p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Outstanding
                </p>
              </div>
              <div className="bg-muted/30 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {totalInvoices}
                </p>
                <p className="text-muted-foreground mt-1 text-sm">Invoices</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-4 text-center">
                <p className="text-primary text-3xl font-bold">
                  {mockFeeCollectionStatus.collectionRate.toFixed(0)}%
                </p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Collection Rate
                </p>
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
            iconName="DollarSign"
            showPercentage
          />
          <ProgressCard
            title="Invoices Paid"
            current={paidInvoices}
            total={Math.max(totalInvoices, 1)}
            unit="invoices"
            iconName="FileText"
            showPercentage
          />
          <ProgressCard
            title="Fiscal Year Progress"
            current={7}
            total={12}
            unit="months"
            iconName="Calendar"
            showPercentage
          />
        </div>
      </div>
    )
  } catch (renderError) {
    // Catch any rendering errors and log them
    console.error("[AccountantDashboard] Rendering error:", renderError)
    const errorMessage =
      renderError instanceof Error ? renderError.message : String(renderError)
    const errorStack =
      renderError instanceof Error ? renderError.stack : undefined
    console.error("[AccountantDashboard] Error message:", errorMessage)
    console.error("[AccountantDashboard] Error stack:", errorStack)
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="mb-4">Dashboard Rendering Error</h3>
            <p className="text-muted-foreground mb-2">
              An error occurred while rendering the dashboard.
            </p>
            <pre className="bg-muted max-h-40 overflow-auto rounded p-2 text-xs">
              {errorMessage}
            </pre>
          </CardContent>
        </Card>
      </div>
    )
  }
}
