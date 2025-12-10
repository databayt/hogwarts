import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { format, isToday, isTomorrow } from "date-fns"
import { QuickActions } from "./quick-actions"
import { getQuickActionsByRole } from "./quick-actions-config"
import { getTenantContext } from "@/lib/tenant-context"
import { MetricCard } from "./metric-card"
import { ActivityRings } from "./activity-rings"
import { ProgressCard } from "./progress-card"
import { EmptyState } from "./empty-state"
import { RevenueChart } from "./revenue-chart"
import { PerformanceGauge } from "./performance-gauge"
import { WeeklyActivityChart } from "./weekly-chart"
import { Upcoming } from "./upcoming"
import { Weather } from "./weather"
import { QuickLookSection } from "./quick-look-section"
import { ResourceUsageSection } from "./resource-usage-section"
import { InvoiceHistorySection } from "./invoice-history-section"
import { FinancialOverviewSection } from "./financial-overview-section"
import { SectionHeading } from "./section-heading"
import Link from "next/link"
import { ChevronRight, ArrowDownRight, ArrowUpRight } from "lucide-react"

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
    // Get tenant context for subdomain with error handling
    let schoolId: string | null = null
    try {
      const tenantContext = await getTenantContext()
      schoolId = tenantContext.schoolId
    } catch (error) {
      console.error("[AccountantDashboard] Error getting tenant context:", error)
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
      console.error("[AccountantDashboard] Error fetching school domain:", error)
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
          db.userInvoice.count({ where: { schoolId: user.schoolId, status: "PAID" } }),
          db.userInvoice.count({ where: { schoolId: user.schoolId, status: "UNPAID" } }),
        ])
        totalInvoices = total
        paidInvoices = paid
        unpaidInvoices = unpaid
      }
    } catch (error) {
      console.error("[AccountantDashboard] Error fetching invoice data:", error)
    }

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
        {/* ============ TOP HERO SECTION (Unified Order) ============ */}
        {/* Section 1: Upcoming + Weather */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <Upcoming role="ACCOUNTANT" locale={locale} subdomain={school?.domain || ""} />
          <Weather className="lg:ml-auto" />
        </div>

        {/* Section 2: Quick Look (no title) */}
        <QuickLookSection locale={locale} subdomain={school?.domain || ""} />

        {/* Section 3: Quick Actions (4 focused actions) */}
        <section>
          <SectionHeading title="Quick Actions" />
          <QuickActions
            actions={getQuickActionsByRole("ACCOUNTANT", dictionary, school?.domain ?? undefined)}
            locale={locale}
          />
        </section>

        {/* Section 4: Resource Usage */}
        <ResourceUsageSection role="ACCOUNTANT" />

        {/* Section 5: Invoice History */}
        <InvoiceHistorySection role="ACCOUNTANT" />

        {/* Section 6: Financial Overview */}
        <FinancialOverviewSection role="ACCOUNTANT" />

        {/* ============ ACCOUNTANT-SPECIFIC SECTIONS ============ */}
        {/* Key Metrics Row */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
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
              <CardTitle className="text-base">Today&apos;s Transactions</CardTitle>
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
                    <div>
                      <p className="font-medium">{event.event}</p>
                      <p className="text-sm text-muted-foreground capitalize">{event.type}</p>
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
    const errorMessage = renderError instanceof Error ? renderError.message : String(renderError)
    const errorStack = renderError instanceof Error ? renderError.stack : undefined
    console.error("[AccountantDashboard] Error message:", errorMessage)
    console.error("[AccountantDashboard] Error stack:", errorStack)
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="mb-4">Dashboard Rendering Error</h3>
            <p className="text-muted-foreground mb-2">An error occurred while rendering the dashboard.</p>
            <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">{errorMessage}</pre>
          </CardContent>
        </Card>
      </div>
    )
  }
}
