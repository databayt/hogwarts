import type { Dictionary } from "@/components/internationalization/dictionaries";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, FileText, Clock, AlertTriangle, CheckCircle, Building } from "lucide-react";
import { QuickActions } from "../quick-actions";
import { getQuickActionsByRole } from "../quick-actions-config";
import { getTenantContext } from "@/lib/tenant-context";

interface StaffDashboardProps {
  user: any;
  dictionary?: Dictionary["school"];
  locale?: string;
}

export async function StaffDashboard({ user, dictionary, locale = "en" }: StaffDashboardProps) {
  // Get tenant context for subdomain
  const { schoolId } = await getTenantContext();

  // Get school subdomain for URL construction
  const school = schoolId ? await db.school.findUnique({ where: { id: schoolId }, select: { domain: true } }) : null;
  // Fetch real data from database
  const announcements = await db.announcement.findMany({
    where: {
      schoolId: user.schoolId,
      published: true
    },
    take: 5,
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Mock data for unimplemented features
  const mockTodayTasks = [
    { task: "Process student registrations", priority: "high", status: "in-progress" },
    { task: "Update attendance records", priority: "medium", status: "pending" },
    { task: "Prepare monthly reports", priority: "low", status: "completed" }
  ];

  const mockPendingRequests = [
    { type: "Student Transfer", requester: "John Smith", urgency: "high", daysOpen: 2 },
    { type: "Document Request", requester: "Sarah Johnson", urgency: "medium", daysOpen: 5 },
    { type: "Schedule Change", requester: "Mike Brown", urgency: "low", daysOpen: 1 }
  ];

  const mockSystemAlerts = [
    { type: "Database Backup", message: "Scheduled backup completed successfully", severity: "info" },
    { type: "System Update", message: "New features available in next update", severity: "info" }
  ];

  const mockRecentActivities = [
    { action: "Student record updated", user: "Admin", timestamp: "2 hours ago" },
    { action: "New announcement published", user: "Principal", timestamp: "4 hours ago" },
    { action: "Attendance marked for Class 10A", user: "Teacher", timestamp: "6 hours ago" }
  ];

  const mockPendingApprovals = [
    { item: "Field Trip Request", requester: "Science Dept", status: "pending", daysLeft: 3 },
    { item: "Budget Approval", requester: "Math Dept", status: "pending", daysLeft: 7 },
    { item: "Equipment Purchase", requester: "IT Dept", status: "pending", daysLeft: 1 }
  ];

  const mockInventoryAlerts = [
    { item: "Textbooks", status: "Low stock", quantity: 15, threshold: 20 },
    { item: "Lab Equipment", status: "Out of stock", quantity: 0, threshold: 5 }
  ];

  const mockMaintenanceRequests = [
    { issue: "Broken projector in Room 101", priority: "high", assignedTo: "IT Team", status: "in-progress" },
    { issue: "HVAC maintenance", priority: "medium", assignedTo: "Facilities", status: "scheduled" }
  ];

  const mockVisitorLog = [
    { visitor: "Parent - Mrs. Johnson", purpose: "Parent meeting", time: "9:00 AM", status: "checked-in" },
    { visitor: "Vendor - Office Supplies", purpose: "Delivery", time: "10:30 AM", status: "checked-out" }
  ];

  const mockWorkflowStatus = {
    inQueue: 8,
    completedToday: 12,
    overdue: 3,
    totalTasks: 23
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Tasks</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockTodayTasks.length}</div>
            <p className="text-xs text-muted-foreground">Tasks scheduled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockPendingRequests.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockSystemAlerts.length}</div>
            <p className="text-xs text-muted-foreground">Active alerts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockWorkflowStatus.totalTasks}</div>
            <p className="text-xs text-muted-foreground">In system</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <QuickActions
        actions={getQuickActionsByRole("STAFF", dictionary, school?.domain)}
        locale={locale}
      />

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Today's Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockTodayTasks.map((task, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{task.task}</p>
                  <p className="text-sm text-muted-foreground">Priority: {task.priority}</p>
                </div>
                <Badge variant={
                  task.status === "completed" ? "default" : 
                  task.status === "in-progress" ? "secondary" : "outline"
                }>
                  {task.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Pending Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockPendingRequests.map((request, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{request.type}</p>
                  <p className="text-sm text-muted-foreground">{request.requester}</p>
                </div>
                <div className="text-right">
                  <Badge variant={request.urgency === "high" ? "destructive" : "secondary"}>
                    {request.urgency}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {request.daysOpen} day{request.daysOpen !== 1 ? 's' : ''} open
                  </p>
                </div>
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
            {mockRecentActivities.map((activity, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <p className="font-medium">{activity.action}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-sm text-muted-foreground">by {activity.user}</p>
                  <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockPendingApprovals.map((approval, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{approval.item}</p>
                  <p className="text-sm text-muted-foreground">{approval.requester}</p>
                </div>
                <div className="text-right">
                  <Badge variant="outline">{approval.status}</Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {approval.daysLeft} day{approval.daysLeft !== 1 ? 's' : ''} left
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Inventory Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockInventoryAlerts.map((alert, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{alert.item}</p>
                  <p className="text-sm text-muted-foreground">
                    {alert.quantity} in stock (threshold: {alert.threshold})
                  </p>
                </div>
                <Badge variant={alert.status === "Out of stock" ? "destructive" : "secondary"}>
                  {alert.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Maintenance Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Maintenance Requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockMaintenanceRequests.map((request, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{request.issue}</p>
                  <p className="text-sm text-muted-foreground">Assigned to: {request.assignedTo}</p>
                </div>
                <div className="text-right">
                  <Badge variant={request.priority === "high" ? "destructive" : "secondary"}>
                    {request.priority}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">{request.status}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Visitor Log */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Visitor Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockVisitorLog.map((visitor, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{visitor.visitor}</p>
                    <p className="text-sm text-muted-foreground">{visitor.purpose}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={visitor.status === "checked-in" ? "default" : "secondary"}>
                    {visitor.status}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">{visitor.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Workflow Status */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{mockWorkflowStatus.inQueue}</div>
              <p className="text-sm text-muted-foreground">In Queue</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{mockWorkflowStatus.completedToday}</div>
              <p className="text-sm text-muted-foreground">Completed Today</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{mockWorkflowStatus.overdue}</div>
              <p className="text-sm text-muted-foreground">Overdue</p>
            </div>
          </div>
          <div className="mt-4">
            <Progress 
              value={((mockWorkflowStatus.completedToday + mockWorkflowStatus.inQueue) / mockWorkflowStatus.totalTasks) * 100} 
              className="mt-2" 
            />
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Overall Progress: {((mockWorkflowStatus.completedToday + mockWorkflowStatus.inQueue) / mockWorkflowStatus.totalTasks * 100).toFixed(1)}%
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
