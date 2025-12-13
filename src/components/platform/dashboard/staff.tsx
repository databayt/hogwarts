import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { format } from "date-fns"
import { getQuickLookData, getStaffDashboardData } from "./actions"
import { getWeatherData } from "./weather-actions"
import { QuickActions } from "./quick-actions"
import { getQuickActionsByRole } from "./quick-actions-config"
import { getTenantContext } from "@/lib/tenant-context"
import { MetricCard } from "./metric-card"
import { ActivityRings } from "./activity-rings"
import { ProgressCard } from "./progress-card"
import { EmptyState } from "./empty-state"
import { WeeklyActivityChart } from "./weekly-chart"
import { PerformanceGauge } from "./performance-gauge"
import { Upcoming } from "./upcoming"
import { Weather } from "./weather"
import { QuickLookSection } from "./quick-look-section"
import { ResourceUsageSection } from "./resource-usage-section"
import { InvoiceHistorySection } from "./invoice-history-section"
import { ChartSection } from "./chart-section"
import { SectionHeading } from "./section-heading"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

interface StaffDashboardProps {
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

export async function StaffDashboard({
  user,
  dictionary,
  locale = "en",
}: StaffDashboardProps) {
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
      console.error("[StaffDashboard] Error fetching data:", error)
    }

    // Get tenant context for subdomain with error handling
    let schoolId: string | null = null
    try {
      const tenantContext = await getTenantContext()
      schoolId = tenantContext.schoolId
    } catch (error) {
      console.error("[StaffDashboard] Error getting tenant context:", error)
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
      console.error("[StaffDashboard] Error fetching school domain:", error)
    }

    // Fetch staff dashboard data from centralized server action
    let staffData
    try {
      staffData = await getStaffDashboardData()
    } catch (error) {
      console.error("[StaffDashboard] Error fetching staff data:", error)
    }

    // Destructure with defaults for error handling
    const {
      tasks: mockTodayTasks = [],
      requests: mockPendingRequests = [],
      approvals: mockPendingApprovals = [],
      maintenance: mockMaintenanceRequests = [],
      inventory: mockInventoryAlerts = [],
      visitors: mockVisitorLog = [],
      workflow: mockWorkflowStatus = { inQueue: 0, completedToday: 0, overdue: 0, totalTasks: 0 },
      weeklyTaskCompletion = [],
    } = staffData || {}

    // Activity rings for staff productivity
    const productivityRings = [
      {
        label: "Tasks",
        value: mockWorkflowStatus.totalTasks > 0
          ? (mockWorkflowStatus.completedToday / mockWorkflowStatus.totalTasks) * 100
          : 0,
        color: "#22c55e",
        current: mockWorkflowStatus.completedToday,
        target: mockWorkflowStatus.totalTasks,
        unit: "completed",
      },
      {
        label: "Requests",
        value: mockPendingRequests.length > 0 ? Math.max(0, 100 - mockPendingRequests.length * 10) : 100,
        color: "#3b82f6",
        current: mockPendingRequests.filter(r => r.urgency === "high").length,
        target: mockPendingRequests.length,
        unit: "urgent",
      },
      {
        label: "Queue",
        value: mockWorkflowStatus.inQueue > 0
          ? Math.max(0, 100 - (mockWorkflowStatus.overdue / mockWorkflowStatus.inQueue) * 100)
          : 100,
        color: mockWorkflowStatus.overdue > 2 ? "#ef4444" : "#f59e0b",
        current: mockWorkflowStatus.overdue,
        target: 0,
        unit: "overdue",
      },
    ]

    const completedTasksToday = mockTodayTasks.filter(t => t.status === "completed").length

    return (
      <div className="space-y-6">
        {/* ============ TOP HERO SECTION (Unified Order) ============ */}
        {/* Section 1: Upcoming + Weather */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:gap-8">
          <Upcoming role="STAFF" locale={locale} subdomain={school?.domain || ""} />
          <Weather
            current={weatherData?.current}
            forecast={weatherData?.forecast}
            location={weatherData?.location}
          />
        </div>

        {/* Section 2: Quick Look (no title) */}
        <QuickLookSection locale={locale} subdomain={school?.domain || ""} data={quickLookData} />

        {/* Section 3: Quick Actions (4 focused actions) */}
        <section>
          <SectionHeading title="Quick Actions" />
          <QuickActions
            actions={getQuickActionsByRole("STAFF", school?.domain ?? undefined)}
            locale={locale}
          />
        </section>

        {/* Section 4: Resource Usage */}
        <ResourceUsageSection role="STAFF" />

        {/* Section 5: Invoice History (Expense Reports) */}
        <InvoiceHistorySection role="STAFF" />

        {/* Section 6: Analytics Charts */}
        <ChartSection role="STAFF" />

        {/* ============ STAFF-SPECIFIC SECTIONS ============ */}
        {/* Key Metrics Row */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Today's Tasks"
            value={mockTodayTasks.length}
            iconName="ClipboardList"
            iconColor="text-blue-500"
            href={`/${locale}/s/${school?.domain}/school`}
          />
          <MetricCard
            title="Pending Requests"
            value={mockPendingRequests.length}
            iconName="FileText"
            iconColor={mockPendingRequests.filter(r => r.urgency === "high").length > 2 ? "text-destructive" : "text-amber-500"}
            href={`/${locale}/s/${school?.domain}/school`}
          />
          <MetricCard
            title="Visitors Today"
            value={mockVisitorLog.filter(v => v.status === "checked-in").length}
            iconName="Users"
            iconColor="text-purple-500"
          />
          <MetricCard
            title="Alerts"
            value={mockInventoryAlerts.length + mockMaintenanceRequests.filter(m => m.priority === "high").length}
            iconName="Bell"
            iconColor="text-amber-500"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Today's Tasks */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Today&apos;s Tasks</CardTitle>
              <Badge variant="outline">{format(new Date(), "EEEE, MMM d")}</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockTodayTasks.length > 0 ? (
                mockTodayTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                        {task.task}
                      </p>
                      <p className="text-sm text-muted-foreground">Due: {task.dueTime}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          task.priority === "high"
                            ? "destructive"
                            : task.priority === "medium"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {task.priority}
                      </Badge>
                      <Badge
                        variant={
                          task.status === "completed"
                            ? "default"
                            : task.status === "in-progress"
                              ? "secondary"
                              : "outline"
                        }
                        className={task.status === "completed" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" : ""}
                      >
                        {task.status.replace("-", " ")}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  iconName="ClipboardList"
                  title="No tasks for today"
                  description="Enjoy your free time!"
                />
              )}
            </CardContent>
          </Card>

          {/* Productivity Rings */}
          <ActivityRings activities={productivityRings} title="Daily Productivity" />
        </div>

        {/* Secondary Content Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Weekly Task Completion */}
          <WeeklyActivityChart
            data={weeklyTaskCompletion}
            title="Weekly Task Completion"
            label="Tasks"
            color="hsl(var(--chart-1))"
          />

          {/* Workflow Efficiency Gauge */}
          <PerformanceGauge
            value={Math.round((mockWorkflowStatus.completedToday / mockWorkflowStatus.totalTasks) * 100)}
            label="Efficiency"
            description="Daily task completion rate"
            maxValue={100}
            color="hsl(199, 89%, 48%)"
          />
        </div>

        {/* Requests and Approvals Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Pending Requests */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Pending Requests</CardTitle>
              <Badge variant={mockPendingRequests.filter(r => r.urgency === "high").length > 0 ? "destructive" : "secondary"}>
                {mockPendingRequests.filter(r => r.urgency === "high").length} urgent
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockPendingRequests.length > 0 ? (
                mockPendingRequests.slice(0, 4).map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{request.type}</p>
                      <p className="text-sm text-muted-foreground">
                        {request.requester} • {request.department}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          request.urgency === "high"
                            ? "destructive"
                            : request.urgency === "medium"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {request.urgency}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {request.daysOpen} day{request.daysOpen !== 1 ? "s" : ""} open
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  iconName="FileText"
                  title="No pending requests"
                  description="All requests have been processed"
                />
              )}
            </CardContent>
          </Card>

          {/* Pending Approvals */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Pending Approvals</CardTitle>
              <Link
                href={`/${locale}/s/${school?.domain}/school`}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                View all <ChevronRight className="h-4 w-4" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockPendingApprovals.length > 0 ? (
                mockPendingApprovals.map((approval) => (
                  <div
                    key={approval.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{approval.item}</p>
                      <p className="text-sm text-muted-foreground">{approval.requester}</p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={approval.daysLeft <= 2 ? "destructive" : approval.daysLeft <= 5 ? "secondary" : "outline"}
                      >
                        {approval.daysLeft} day{approval.daysLeft !== 1 ? "s" : ""} left
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  iconName="CheckCircle"
                  title="No pending approvals"
                  description="All items have been reviewed"
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Operations Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Maintenance Requests */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Maintenance</CardTitle>
              <Badge variant={mockMaintenanceRequests.filter(m => m.priority === "high").length > 0 ? "destructive" : "secondary"}>
                {mockMaintenanceRequests.filter(m => m.priority === "high").length} urgent
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockMaintenanceRequests.length > 0 ? (
                mockMaintenanceRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{request.issue}</p>
                      <p className="text-sm text-muted-foreground">{request.assignedTo}</p>
                    </div>
                    <Badge
                      variant={
                        request.priority === "high"
                          ? "destructive"
                          : request.status === "in-progress"
                            ? "default"
                            : "secondary"
                      }
                    >
                      {request.status.replace("-", " ")}
                    </Badge>
                  </div>
                ))
              ) : (
                <EmptyState
                  iconName="Settings"
                  title="No maintenance issues"
                  description="All systems operational"
                />
              )}
            </CardContent>
          </Card>

          {/* Inventory Alerts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Inventory Alerts</CardTitle>
              <Badge variant={mockInventoryAlerts.filter(i => i.quantity === 0).length > 0 ? "destructive" : "secondary"}>
                {mockInventoryAlerts.length} alerts
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockInventoryAlerts.length > 0 ? (
                mockInventoryAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{alert.item}</p>
                      <p className="text-sm text-muted-foreground">
                        {alert.quantity} in stock (min: {alert.threshold})
                      </p>
                    </div>
                    <Badge variant={alert.quantity === 0 ? "destructive" : "secondary"}>
                      {alert.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <EmptyState
                  iconName="FolderOpen"
                  title="No inventory alerts"
                  description="Stock levels are healthy"
                />
              )}
            </CardContent>
          </Card>

          {/* Today's Visitors */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Visitor Log</CardTitle>
              <Badge variant="outline">
                {mockVisitorLog.filter(v => v.status === "checked-in").length} on-site
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockVisitorLog.length > 0 ? (
                mockVisitorLog.map((visitor) => (
                  <div
                    key={visitor.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{visitor.visitor}</p>
                      <p className="text-sm text-muted-foreground">{visitor.purpose}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={visitor.status === "checked-in" ? "default" : "secondary"}>
                        {visitor.status.replace("-", " ")}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">{visitor.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  iconName="Users"
                  title="No visitors today"
                  description="Visitor log is empty"
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Workflow Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Workflow Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-4">
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {mockWorkflowStatus.inQueue}
                </p>
                <p className="text-sm text-muted-foreground mt-1">In Queue</p>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  {mockWorkflowStatus.completedToday}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Completed Today</p>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <p className="text-3xl font-bold text-destructive">
                  {mockWorkflowStatus.overdue}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Overdue</p>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <p className="text-3xl font-bold text-primary">
                  {Math.round((mockWorkflowStatus.completedToday / mockWorkflowStatus.totalTasks) * 100)}%
                </p>
                <p className="text-sm text-muted-foreground mt-1">Completion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <ProgressCard
            title="Daily Tasks"
            current={mockWorkflowStatus.completedToday}
            total={mockWorkflowStatus.totalTasks}
            unit="tasks"
            iconName="CheckCircle"
            showPercentage
          />
          <ProgressCard
            title="Request Processing"
            current={mockPendingRequests.length - mockPendingRequests.filter(r => r.urgency === "high").length}
            total={mockPendingRequests.length}
            unit="handled"
            iconName="FileText"
            showPercentage
          />
          <ProgressCard
            title="Week Progress"
            current={new Date().getDay() || 7}
            total={7}
            unit="days"
            iconName="Calendar"
            showPercentage
          />
        </div>
      </div>
    )
  } catch (renderError) {
    // Catch any rendering errors and log them
    console.error("[StaffDashboard] Rendering error:", renderError)
    const errorMessage = renderError instanceof Error ? renderError.message : String(renderError)
    const errorStack = renderError instanceof Error ? renderError.stack : undefined
    console.error("[StaffDashboard] Error message:", errorMessage)
    console.error("[StaffDashboard] Error stack:", errorStack)
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
