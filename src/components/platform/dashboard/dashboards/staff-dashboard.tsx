import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import {
  Calendar,
  Clock,
  CheckCircle2,
  TriangleAlert,
  Users,
  Bell,
  ClipboardList,
  Building,
  Wrench,
  Package,
  ChevronRight,
  ListTodo,
  UserCheck,
  FileCheck,
} from "lucide-react"
import { format } from "date-fns"
import { QuickActions } from "../quick-actions"
import { getQuickActionsByRole } from "../quick-actions-config"
import { getTenantContext } from "@/lib/tenant-context"
import { db } from "@/lib/db"
import {
  WelcomeBanner,
  MetricCard,
  ActivityRings,
  ProgressCard,
  EmptyState,
} from "../widgets"
import { WeeklyActivityChart, PerformanceGauge } from "../widgets/dashboard-charts"
import Link from "next/link"

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
    console.error("[StaffDashboard] Error fetching school domain:", error)
  }

  // Fetch real data from database
  let announcements: any[] = []
  try {
    announcements = await db.announcement.findMany({
      where: {
        schoolId: user.schoolId || undefined,
        published: true,
      },
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
    })
  } catch (error) {
    console.error("[StaffDashboard] Error fetching announcements:", error)
  }

  // Mock data for demo (would be replaced with real queries in production)
  const mockTodayTasks = [
    { id: "1", task: "Process student registrations", priority: "high", status: "in-progress", dueTime: "10:00 AM" },
    { id: "2", task: "Update attendance records", priority: "medium", status: "pending", dueTime: "12:00 PM" },
    { id: "3", task: "Prepare monthly reports", priority: "low", status: "completed", dueTime: "3:00 PM" },
    { id: "4", task: "Schedule parent meetings", priority: "medium", status: "pending", dueTime: "5:00 PM" },
  ]

  const mockPendingRequests = [
    { id: "1", type: "Student Transfer", requester: "John Smith", urgency: "high", daysOpen: 2, department: "Registrar" },
    { id: "2", type: "Document Request", requester: "Sarah Johnson", urgency: "medium", daysOpen: 5, department: "Admin" },
    { id: "3", type: "Schedule Change", requester: "Mike Brown", urgency: "low", daysOpen: 1, department: "Academic" },
    { id: "4", type: "Certificate Issue", requester: "Emma Wilson", urgency: "high", daysOpen: 3, department: "Registrar" },
  ]

  const mockPendingApprovals = [
    { id: "1", item: "Field Trip Request", requester: "Science Dept", status: "pending", daysLeft: 3 },
    { id: "2", item: "Budget Approval", requester: "Math Dept", status: "pending", daysLeft: 7 },
    { id: "3", item: "Equipment Purchase", requester: "IT Dept", status: "pending", daysLeft: 1 },
  ]

  const mockMaintenanceRequests = [
    { id: "1", issue: "Broken projector in Room 101", priority: "high", assignedTo: "IT Team", status: "in-progress" },
    { id: "2", issue: "HVAC maintenance Block B", priority: "medium", assignedTo: "Facilities", status: "scheduled" },
    { id: "3", issue: "Plumbing repair - Staff room", priority: "high", assignedTo: "Maintenance", status: "pending" },
  ]

  const mockInventoryAlerts = [
    { id: "1", item: "Textbooks - Grade 10", status: "Low stock", quantity: 15, threshold: 20 },
    { id: "2", item: "Lab Equipment", status: "Out of stock", quantity: 0, threshold: 5 },
    { id: "3", item: "Office Supplies", status: "Low stock", quantity: 8, threshold: 15 },
  ]

  const mockVisitorLog = [
    { id: "1", visitor: "Mrs. Johnson (Parent)", purpose: "Parent meeting", time: "9:00 AM", status: "checked-in" },
    { id: "2", visitor: "Office Supplies Inc.", purpose: "Delivery", time: "10:30 AM", status: "checked-out" },
    { id: "3", visitor: "Mr. Davis (Parent)", purpose: "Document pickup", time: "11:45 AM", status: "checked-in" },
  ]

  const mockWorkflowStatus = {
    inQueue: 8,
    completedToday: 12,
    overdue: 3,
    totalTasks: 23,
  }

  const weeklyTaskCompletion = [
    { day: "Mon", value: 15 },
    { day: "Tue", value: 18 },
    { day: "Wed", value: 12 },
    { day: "Thu", value: 20 },
    { day: "Fri", value: 14 },
  ]

  // Activity rings for staff productivity
  const productivityRings = [
    {
      label: "Tasks",
      value: (mockWorkflowStatus.completedToday / mockWorkflowStatus.totalTasks) * 100,
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
      value: Math.max(0, 100 - (mockWorkflowStatus.overdue / mockWorkflowStatus.inQueue) * 100),
      color: mockWorkflowStatus.overdue > 2 ? "#ef4444" : "#f59e0b",
      current: mockWorkflowStatus.overdue,
      target: 0,
      unit: "overdue",
    },
  ]

  const completedTasksToday = mockTodayTasks.filter(t => t.status === "completed").length

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <WelcomeBanner
        userName={user.name || user.email?.split("@")[0]}
        role="Staff"
        subtitle={`${completedTasksToday} of ${mockTodayTasks.length} tasks completed today`}
      />

      {/* Key Metrics Row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Today's Tasks"
          value={mockTodayTasks.length}
          icon={ListTodo}
          iconColor="text-blue-500"
          href={`/${locale}/s/${school?.domain}/admin`}
        />
        <MetricCard
          title="Pending Requests"
          value={mockPendingRequests.length}
          icon={ClipboardList}
          iconColor={mockPendingRequests.filter(r => r.urgency === "high").length > 2 ? "text-destructive" : "text-amber-500"}
          href={`/${locale}/s/${school?.domain}/admin`}
        />
        <MetricCard
          title="Visitors Today"
          value={mockVisitorLog.filter(v => v.status === "checked-in").length}
          icon={Users}
          iconColor="text-purple-500"
        />
        <MetricCard
          title="Alerts"
          value={mockInventoryAlerts.length + mockMaintenanceRequests.filter(m => m.priority === "high").length}
          icon={TriangleAlert}
          iconColor="text-amber-500"
        />
      </div>

      {/* Quick Actions */}
      <QuickActions
        actions={getQuickActionsByRole("STAFF", dictionary, school?.domain)}
        locale={locale}
      />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today's Tasks */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <ListTodo className="h-4 w-4" />
              Today's Tasks
            </CardTitle>
            <Badge variant="outline">{format(new Date(), "EEEE, MMM d")}</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockTodayTasks.length > 0 ? (
              mockTodayTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      task.status === "completed" ? "bg-emerald-100 dark:bg-emerald-950" :
                      task.status === "in-progress" ? "bg-blue-100 dark:bg-blue-950" :
                      "bg-muted"
                    }`}>
                      {task.status === "completed" ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      ) : task.status === "in-progress" ? (
                        <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <ListTodo className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className={`font-medium ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                        {task.task}
                      </p>
                      <p className="text-sm text-muted-foreground">Due: {task.dueTime}</p>
                    </div>
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
                icon={ListTodo}
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
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Pending Requests
            </CardTitle>
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
                icon={ClipboardList}
                title="No pending requests"
                description="All requests have been processed"
              />
            )}
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              Pending Approvals
            </CardTitle>
            <Link
              href={`/${locale}/s/${school?.domain}/admin`}
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
                icon={FileCheck}
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
            <CardTitle className="text-base flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Maintenance
            </CardTitle>
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
                icon={Wrench}
                title="No maintenance issues"
                description="All systems operational"
              />
            )}
          </CardContent>
        </Card>

        {/* Inventory Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" />
              Inventory Alerts
            </CardTitle>
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
                icon={Package}
                title="No inventory alerts"
                description="Stock levels are healthy"
              />
            )}
          </CardContent>
        </Card>

        {/* Today's Visitors */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Building className="h-4 w-4" />
              Visitor Log
            </CardTitle>
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
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      visitor.status === "checked-in" ? "bg-emerald-100 dark:bg-emerald-950" : "bg-muted"
                    }`}>
                      <UserCheck className={`h-4 w-4 ${
                        visitor.status === "checked-in" ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium">{visitor.visitor}</p>
                      <p className="text-sm text-muted-foreground">{visitor.purpose}</p>
                    </div>
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
                icon={Building}
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
          icon={CheckCircle2}
          showPercentage
        />
        <ProgressCard
          title="Request Processing"
          current={mockPendingRequests.length - mockPendingRequests.filter(r => r.urgency === "high").length}
          total={mockPendingRequests.length}
          unit="handled"
          icon={ClipboardList}
          showPercentage
        />
        <ProgressCard
          title="Week Progress"
          current={new Date().getDay() || 7}
          total={7}
          unit="days"
          icon={Calendar}
          showPercentage
        />
      </div>
    </div>
  )
}
