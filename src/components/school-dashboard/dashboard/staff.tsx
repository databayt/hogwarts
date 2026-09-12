// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import { format } from "date-fns"
import { ChevronRight } from "lucide-react"

import { getTenantContext } from "@/lib/tenant-context"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { getStaffDashboardData } from "./actions"
import { ActivityRings } from "./activity-rings"
import { ChartSection } from "./chart-section"
import { EmptyState } from "./empty-state"
import { InvoiceHistorySection } from "./invoice-history-section"
import { MetricCard } from "./metric-card"
import { PerformanceGauge } from "./performance-gauge"
import { ProgressCard } from "./progress-card"
import { QuickActions } from "./quick-actions"
import { getQuickActionsByRole } from "./quick-actions-config"
import { ResourceUsageSection } from "./resource-usage-section"
import { SectionHeading } from "./section-heading"
import { WeeklyActivityChart } from "./weekly-chart"

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
    // The Upcoming/Weather hero and the Quick Look row are hidden on this
    // dashboard, so their fetches (getQuickLookData, getWeatherData) are not
    // made here — restore both alongside the JSX below.

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
      tasks: todayTasks = [],
      requests: pendingRequests = [],
      approvals: pendingApprovals = [],
      maintenance: maintenanceRequests = [],
      inventory: inventoryAlerts = [],
      visitors: visitorLog = [],
      workflow: workflowStatus = {
        inQueue: 0,
        completedToday: 0,
        overdue: 0,
        totalTasks: 0,
      },
      weeklyTaskCompletion = [],
    } = staffData || {}

    // Activity rings for staff productivity
    const productivityRings = [
      {
        label: "Tasks",
        value:
          workflowStatus.totalTasks > 0
            ? (workflowStatus.completedToday / workflowStatus.totalTasks) * 100
            : 0,
        color: "#22c55e",
        current: workflowStatus.completedToday,
        target: workflowStatus.totalTasks,
        unit: "completed",
      },
      {
        label: "Requests",
        value:
          pendingRequests.length > 0
            ? Math.max(0, 100 - pendingRequests.length * 10)
            : 100,
        color: "#3b82f6",
        current: pendingRequests.filter((r) => r.urgency === "high").length,
        target: pendingRequests.length,
        unit: "urgent",
      },
      {
        label: "Queue",
        value:
          workflowStatus.inQueue > 0
            ? Math.max(
                0,
                100 - (workflowStatus.overdue / workflowStatus.inQueue) * 100
              )
            : 100,
        color: workflowStatus.overdue > 2 ? "#ef4444" : "#f59e0b",
        current: workflowStatus.overdue,
        target: 0,
        unit: "overdue",
      },
    ]

    const completedTasksToday = todayTasks.filter(
      (t) => t.status === "completed"
    ).length

    return (
      <div className="space-y-8">
        {/* ============ SHARED SECTIONS (the student dashboard's order) ======
            The Upcoming/Weather hero and the Quick Look row of announcements /
            events / notifications / messages are hidden here, as they are on
            the student and teacher dashboards. Restore by putting the JSX back
            and re-importing `Upcoming`, `Weather`, `QuickLookSection`,
            `getQuickLookData` and `getWeatherData`. */}
        <div className="space-y-6">
          {/* Quick Actions — from `md` up only. Below it the phone dashboard
              shows this same section near the top instead
              (`phone-quick-actions.tsx`), where a thumb reaches it; two copies
              at once would be the same four tiles twice. */}
          <section className="hidden md:block">
            <SectionHeading title={"Quick Actions"} />
            <QuickActions
              actions={getQuickActionsByRole(
                "STAFF",
                school?.domain ?? undefined
              )}
              locale={locale}
            />
          </section>

          {/* Analytics, directly under the quick actions rather than below the
              two tables — the order the student dashboard settled on. */}
          <ChartSection role="STAFF" />

          <ResourceUsageSection role="STAFF" />

          <InvoiceHistorySection role="STAFF" />
        </div>

        {/* ============ STAFF-SPECIFIC SECTIONS ============ */}
        {/* Key Metrics Row */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricCard
            title="Today's Tasks"
            value={todayTasks.length}
            iconName="ClipboardList"
            iconColor="text-blue-500"
            href={`/${locale}/school`}
          />
          <MetricCard
            title="Pending Requests"
            value={pendingRequests.length}
            iconName="FileText"
            iconColor={
              pendingRequests.filter((r) => r.urgency === "high").length > 2
                ? "text-destructive"
                : "text-amber-500"
            }
            href={`/${locale}/school`}
          />
          <MetricCard
            title="Visitors Today"
            value={visitorLog.filter((v) => v.status === "checked-in").length}
            iconName="Users"
            iconColor="text-purple-500"
          />
          <MetricCard
            title="Alerts"
            value={
              inventoryAlerts.length +
              maintenanceRequests.filter((m) => m.priority === "high").length
            }
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
              <Badge variant="outline">
                {format(new Date(), "EEEE, MMM d")}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {todayTasks.length > 0 ? (
                todayTasks.map((task) => (
                  <div
                    key={task.id}
                    className="hover:bg-muted/50 flex items-center justify-between rounded-lg border p-3 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p
                        className={`font-medium ${task.status === "completed" ? "text-muted-foreground line-through" : ""}`}
                      >
                        {task.task}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        Due: {task.dueTime}
                      </p>
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
                        className={
                          task.status === "completed"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                            : ""
                        }
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
          <ActivityRings
            activities={productivityRings}
            title="Daily Productivity"
          />
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
            value={Math.round(
              (workflowStatus.completedToday / workflowStatus.totalTasks) * 100
            )}
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
              <Badge
                variant={
                  pendingRequests.filter((r) => r.urgency === "high").length > 0
                    ? "destructive"
                    : "secondary"
                }
              >
                {pendingRequests.filter((r) => r.urgency === "high").length}{" "}
                urgent
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingRequests.length > 0 ? (
                pendingRequests.slice(0, 4).map((request) => (
                  <div
                    key={request.id}
                    className="hover:bg-muted/50 flex items-center justify-between rounded-lg border p-3 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{request.type}</p>
                      <p className="text-muted-foreground text-sm">
                        {request.requester} • {request.department}
                      </p>
                    </div>
                    <div className="text-end">
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
                      <p className="text-muted-foreground mt-1 text-xs">
                        {request.daysOpen} day
                        {request.daysOpen !== 1 ? "s" : ""} open
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
                href={`/${locale}/school`}
                className="text-primary flex items-center gap-1 text-sm hover:underline"
              >
                View all <ChevronRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingApprovals.length > 0 ? (
                pendingApprovals.map((approval) => (
                  <div
                    key={approval.id}
                    className="hover:bg-muted/50 flex items-center justify-between rounded-lg border p-3 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{approval.item}</p>
                      <p className="text-muted-foreground text-sm">
                        {approval.requester}
                      </p>
                    </div>
                    <div className="text-end">
                      <Badge
                        variant={
                          approval.daysLeft <= 2
                            ? "destructive"
                            : approval.daysLeft <= 5
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {approval.daysLeft} day
                        {approval.daysLeft !== 1 ? "s" : ""} left
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
              <Badge
                variant={
                  maintenanceRequests.filter((m) => m.priority === "high")
                    .length > 0
                    ? "destructive"
                    : "secondary"
                }
              >
                {
                  maintenanceRequests.filter((m) => m.priority === "high")
                    .length
                }{" "}
                urgent
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {maintenanceRequests.length > 0 ? (
                maintenanceRequests.map((request) => (
                  <div
                    key={request.id}
                    className="hover:bg-muted/50 flex items-center justify-between rounded-lg border p-3 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{request.issue}</p>
                      <p className="text-muted-foreground text-sm">
                        {request.assignedTo}
                      </p>
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
              <Badge
                variant={
                  inventoryAlerts.filter((i) => i.quantity === 0).length > 0
                    ? "destructive"
                    : "secondary"
                }
              >
                {inventoryAlerts.length} alerts
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {inventoryAlerts.length > 0 ? (
                inventoryAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="hover:bg-muted/50 flex items-center justify-between rounded-lg border p-3 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{alert.item}</p>
                      <p className="text-muted-foreground text-sm">
                        {alert.quantity} in stock (min: {alert.threshold})
                      </p>
                    </div>
                    <Badge
                      variant={
                        alert.quantity === 0 ? "destructive" : "secondary"
                      }
                    >
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
                {visitorLog.filter((v) => v.status === "checked-in").length}{" "}
                on-site
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {visitorLog.length > 0 ? (
                visitorLog.map((visitor) => (
                  <div
                    key={visitor.id}
                    className="hover:bg-muted/50 flex items-center justify-between rounded-lg border p-3 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{visitor.visitor}</p>
                      <p className="text-muted-foreground text-sm">
                        {visitor.purpose}
                      </p>
                    </div>
                    <div className="text-end">
                      <Badge
                        variant={
                          visitor.status === "checked-in"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {visitor.status.replace("-", " ")}
                      </Badge>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {visitor.time}
                      </p>
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
              <div className="bg-muted/30 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {workflowStatus.inQueue}
                </p>
                <p className="text-muted-foreground mt-1 text-sm">In Queue</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  {workflowStatus.completedToday}
                </p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Completed Today
                </p>
              </div>
              <div className="bg-muted/30 rounded-lg p-4 text-center">
                <p className="text-destructive text-3xl font-bold">
                  {workflowStatus.overdue}
                </p>
                <p className="text-muted-foreground mt-1 text-sm">Overdue</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-4 text-center">
                <p className="text-primary text-3xl font-bold">
                  {Math.round(
                    (workflowStatus.completedToday /
                      workflowStatus.totalTasks) *
                      100
                  )}
                  %
                </p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Completion Rate
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <ProgressCard
            title="Daily Tasks"
            current={workflowStatus.completedToday}
            total={workflowStatus.totalTasks}
            unit="tasks"
            iconName="CheckCircle"
            showPercentage
          />
          <ProgressCard
            title="Request Processing"
            current={
              pendingRequests.length -
              pendingRequests.filter((r) => r.urgency === "high").length
            }
            total={pendingRequests.length}
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
    const errorMessage =
      renderError instanceof Error ? renderError.message : String(renderError)
    const errorStack =
      renderError instanceof Error ? renderError.stack : undefined
    console.error("[StaffDashboard] Error message:", errorMessage)
    console.error("[StaffDashboard] Error stack:", errorStack)
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
