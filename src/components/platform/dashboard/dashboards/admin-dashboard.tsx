import type { Dictionary } from "@/components/internationalization/dictionaries"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { getDashboardSummary } from "./actions"
import { QuickActions } from "../quick-actions"
import { getQuickActionsByRole } from "../quick-actions-config"
import { getTenantContext } from "@/lib/tenant-context"
import { AdminDashboardStats } from "@/components/platform/shared/stats"

interface Props {
  user: any
  dictionary?: Dictionary["school"]
  locale?: string
}

export async function AdminDashboard({ user, dictionary, locale = "en" }: Props) {
  // Fetch real data from server actions with error handling
  let dashboardData
  try {
    dashboardData = await getDashboardSummary()
  } catch (error) {
    console.error("[AdminDashboard] Error fetching data:", error)
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="mb-4">Unable to Load Dashboard</h3>
            <p className="text-muted-foreground">
              There was an error loading the dashboard data. Please try refreshing the page.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get tenant context for subdomain
  const { schoolId } = await getTenantContext()

  // Get school subdomain for URL construction with error handling
  let school = null
  try {
    if (schoolId) {
      const { db } = await import("@/lib/db")
      school = await db.school.findUnique({
        where: { id: schoolId },
        select: { domain: true },
      })
    }
  } catch (error) {
    console.error("[AdminDashboard] Error fetching school domain:", error)
  }

  // Destructure real data
  const {
    enrollment,
    attendance,
    staff,
    academicPerformance,
    announcements,
    classes,
    activities,
  } = dashboardData

  // Mock data for features not yet implemented (Financial, Compliance, etc.)
  const mockFinancialSummary = {
    totalRevenue: 1250000,
    expenses: 980000,
    profit: 270000,
    outstandingFees: 45000,
    budgetUtilization: 78.4,
  }

  const mockStaffPerformance = {
    excellent: 28,
    good: 42,
    satisfactory: 15,
    needsImprovement: 5,
  }

  const mockComplianceStatus = {
    academic: "Compliant",
    financial: "Compliant",
    safety: "Pending Review",
    accreditation: "Compliant",
  }

  const mockPendingRequests = [
    { type: "Teacher Leave", requester: "Sarah Johnson", urgency: "high", daysOpen: 2 },
    { type: "Budget Approval", requester: "Math Department", urgency: "medium", daysOpen: 1 },
    { type: "Student Transfer", requester: "Parent", urgency: "low", daysOpen: 5 },
  ]

  const mockSystemAlerts = [
    {
      type: "Database Backup",
      message: "Scheduled backup completed successfully",
      severity: "info",
    },
    {
      type: "System Update",
      message: "New features available in next update",
      severity: "info",
    },
    {
      type: "Security Alert",
      message: "Multiple login attempts detected",
      severity: "warning",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Hero Section - School Overview Metrics using new reusable component */}
      <AdminDashboardStats
        totalEnrollment={enrollment.total}
        newThisMonth={enrollment.newThisMonth}
        attendanceRate={attendance.attendanceRate}
        present={attendance.present}
        absent={attendance.absent}
        activeClasses={classes.total}
        announcementsCount={announcements.published}
        totalStaff={staff.total}
        departments={staff.departments}
      />

      {/* Quick Actions */}
      <QuickActions
        actions={getQuickActionsByRole("ADMIN", dictionary, school?.domain)}
        locale={locale}
      />

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Financial Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Revenue</span>
              <span className="font-medium">
                ${(mockFinancialSummary.totalRevenue / 1000).toFixed(0)}K
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Expenses</span>
              <span className="font-medium text-destructive">
                ${(mockFinancialSummary.expenses / 1000).toFixed(0)}K
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Net Profit</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                ${(mockFinancialSummary.profit / 1000).toFixed(0)}K
              </span>
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Budget Utilization</span>
                <span className="font-medium">{mockFinancialSummary.budgetUtilization}%</span>
              </div>
              <Progress value={mockFinancialSummary.budgetUtilization} className="mt-2" />
            </div>
          </CardContent>
        </Card>

        {/* Academic Performance Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Academic Performance Trends</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Average GPA</span>
              <span className="font-medium">{academicPerformance.averageGPA}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Pass Rate</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                {academicPerformance.passRate}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Improvement</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                {academicPerformance.improvement}
              </span>
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Top Performers</span>
                <span className="font-medium">{academicPerformance.topPerformers} students</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Staff Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Staff Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-2 border rounded">
              <span className="text-sm">Excellent</span>
              <div className="flex items-center space-x-2">
                <Progress
                  value={(mockStaffPerformance.excellent / staff.total) * 100}
                  className="w-20"
                />
                <span className="text-sm font-medium">{mockStaffPerformance.excellent}</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-2 border rounded">
              <span className="text-sm">Good</span>
              <div className="flex items-center space-x-2">
                <Progress
                  value={(mockStaffPerformance.good / staff.total) * 100}
                  className="w-20"
                />
                <span className="text-sm font-medium">{mockStaffPerformance.good}</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-2 border rounded">
              <span className="text-sm">Satisfactory</span>
              <div className="flex items-center space-x-2">
                <Progress
                  value={(mockStaffPerformance.satisfactory / staff.total) * 100}
                  className="w-20"
                />
                <span className="text-sm font-medium">{mockStaffPerformance.satisfactory}</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-2 border rounded">
              <span className="text-sm">Needs Improvement</span>
              <div className="flex items-center space-x-2">
                <Progress
                  value={(mockStaffPerformance.needsImprovement / staff.total) * 100}
                  className="w-20"
                />
                <span className="text-sm font-medium">
                  {mockStaffPerformance.needsImprovement}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Status */}
        <Card>
          <CardHeader>
            <CardTitle>Compliance Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(mockComplianceStatus).map(([area, status]) => (
              <div key={area} className="flex items-center justify-between p-2 border rounded">
                <span className="text-sm capitalize">{area}</span>
                <Badge variant={status === "Compliant" ? "default" : "secondary"}>
                  {status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activities.length > 0 ? (
              activities.slice(0, 4).map((activity, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <p className="font-medium">{activity.action}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm text-muted-foreground">by {activity.user}</p>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs capitalize">
                        {activity.type}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No recent activities</p>
            )}
          </CardContent>
        </Card>

        {/* Pending Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockPendingRequests.map((request, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{request.type}</p>
                  <p className="text-sm text-muted-foreground">{request.requester}</p>
                </div>
                <div className="text-right">
                  <Badge variant={request.urgency === "high" ? "destructive" : "secondary"}>
                    {request.urgency}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {request.daysOpen} day{request.daysOpen !== 1 ? "s" : ""} open
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Analytics Section */}
      <Card>
        <CardHeader>
          <CardTitle>Analytics Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center">
              <h4 className="mb-2">Student-Teacher Ratio</h4>
              <p className="text-2xl font-bold text-primary">{classes.studentTeacherRatio}:1</p>
              <p className="text-xs text-muted-foreground">
                {enrollment.active} students / {staff.total} teachers
              </p>
            </div>
            <div className="text-center">
              <h4 className="mb-2">Exams & Assignments</h4>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {(academicPerformance.totalExams || 0) +
                  (academicPerformance.totalAssignments || 0)}
              </p>
              <p className="text-xs text-muted-foreground">
                {academicPerformance.totalExams} exams, {academicPerformance.totalAssignments}{" "}
                assignments
              </p>
            </div>
            <div className="text-center">
              <h4 className="mb-2">Recent Announcements</h4>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {announcements.recentCount}
              </p>
              <p className="text-xs text-muted-foreground">In the last 7 days</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>System Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockSystemAlerts.map((alert, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                <AlertTriangle
                  className={`h-5 w-5 ${
                    alert.severity === "warning" ? "text-amber-500" : "text-primary"
                  }`}
                />
                <div className="flex-1">
                  <p className="font-medium">{alert.type}</p>
                  <p className="text-sm text-muted-foreground">{alert.message}</p>
                </div>
                <Badge variant={alert.severity === "warning" ? "secondary" : "default"}>
                  {alert.severity}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
