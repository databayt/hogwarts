"use client"

import { useSidebar } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Users,
  FileText,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  Building2,
  ClipboardList,
  Settings,
  Zap
} from "lucide-react"
import { cn } from "@/lib/utils"

interface StaffDashboardProps {
  data: Record<string, unknown>
}

// Department overview
const DEPARTMENT_STATS = [
  { label: "Total Students", value: 1247, change: "+23", trend: "up" },
  { label: "Total Teachers", value: 89, change: "+2", trend: "up" },
  { label: "Total Classes", value: 156, change: "0", trend: "stable" },
  { label: "Active Events", value: 8, change: "+3", trend: "up" },
]

// Pending tasks
const PENDING_TASKS = [
  { title: "Process new student enrollments", count: 12, priority: "high", due: "Today" },
  { title: "Update teacher schedules", count: 5, priority: "medium", due: "Tomorrow" },
  { title: "Generate monthly attendance report", count: 1, priority: "high", due: "Dec 20" },
  { title: "Review fee waiver requests", count: 8, priority: "medium", due: "Dec 22" },
  { title: "Prepare event logistics", count: 3, priority: "low", due: "Dec 25" },
]

// Recent activities
const RECENT_ACTIVITIES = [
  { title: "New Computer Lab Setup", department: "Technology", status: "completed", time: "2 hours ago" },
  { title: "Science Fair Planning", department: "Science", status: "in_progress", time: "5 hours ago" },
  { title: "Fee Collection Report", department: "Finance", status: "completed", time: "Yesterday" },
]

export default function StaffDashboard({ data }: StaffDashboardProps) {
  const { open, isMobile } = useSidebar()
  const useMobileLayout = isMobile || open

  const priorityColors = {
    high: "bg-destructive/10 text-destructive border-destructive/30",
    medium: "bg-orange-500/10 text-orange-500 border-orange-500/30",
    low: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
  }

  const statusIcons = {
    pending: <Clock className="size-4 text-muted-foreground" />,
    in_progress: <AlertCircle className="size-4 text-orange-500" />,
    completed: <CheckCircle2 className="size-4 text-emerald-500" />,
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className={cn(
        "grid gap-4",
        useMobileLayout ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 md:grid-cols-4"
      )}>
        {DEPARTMENT_STATS.map((stat, idx) => (
          <Card key={idx} className="border-border">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                {idx === 0 && <Users className="size-4 text-blue-500" />}
                {idx === 1 && <Building2 className="size-4 text-purple-500" />}
                {idx === 2 && <FileText className="size-4 text-emerald-500" />}
                {idx === 3 && <Calendar className="size-4 text-orange-500" />}
                {stat.label}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className={cn(
                  "text-3xl font-bold",
                  idx === 0 && "text-blue-500",
                  idx === 1 && "text-purple-500",
                  idx === 2 && "text-emerald-500",
                  idx === 3 && "text-orange-500"
                )}>{stat.value.toLocaleString()}</span>
                {stat.change !== "0" && (
                  <span className={cn(
                    "text-xs",
                    stat.trend === "up" ? "text-emerald-500" : "text-destructive"
                  )}>{stat.change}</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">This semester</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className={cn(
        "grid gap-6",
        useMobileLayout ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"
      )}>
        {/* Pending Tasks */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="size-5 text-primary" />
              Pending Tasks
            </CardTitle>
            <CardDescription>Administrative tasks requiring attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {PENDING_TASKS.map((task, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                    {task.count}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground">Due: {task.due}</p>
                  </div>
                </div>
                <Badge variant="outline" className={cn("text-[10px]", priorityColors[task.priority as keyof typeof priorityColors])}>
                  {task.priority}
                </Badge>
              </div>
            ))}
            <button className="w-full text-sm text-primary hover:underline py-2">
              View all tasks
            </button>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="size-5 text-amber-500" />
              Recent Activities
            </CardTitle>
            <CardDescription>Latest department updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {RECENT_ACTIVITIES.map((activity, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {statusIcons[activity.status as keyof typeof statusIcons]}
                  <div>
                    <p className="font-medium text-sm">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">{activity.department} Department</p>
                  </div>
                </div>
                <div className="text-end">
                  <Badge variant={activity.status === "completed" ? "secondary" : "outline"} className="text-[10px] mb-1">
                    {activity.status.replace("_", " ")}
                  </Badge>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
            <button className="w-full text-sm text-primary hover:underline py-2">
              View activity log
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Department Distribution */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">Department Distribution</CardTitle>
          <CardDescription>Staff allocation across departments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className={cn(
            "grid gap-3",
            useMobileLayout ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2 md:grid-cols-3"
          )}>
            {[
              { name: "Mathematics", teachers: 8, classes: 24, color: "bg-chart-1" },
              { name: "Science", teachers: 12, classes: 32, color: "bg-chart-2" },
              { name: "English", teachers: 10, classes: 28, color: "bg-chart-3" },
              { name: "History", teachers: 6, classes: 18, color: "bg-chart-4" },
              { name: "Art", teachers: 4, classes: 12, color: "bg-chart-5" },
              { name: "Physical Education", teachers: 5, classes: 15, color: "bg-chart-1" },
            ].map((dept, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className={cn("size-3 rounded-full", dept.color)} />
                  <span className="font-medium text-sm">{dept.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-2xl font-bold text-foreground">{dept.teachers}</p>
                    <p className="text-xs text-muted-foreground">Teachers</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{dept.classes}</p>
                    <p className="text-xs text-muted-foreground">Classes</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* School-wide Metrics */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="size-5 text-emerald-500" />
            School-wide Metrics
          </CardTitle>
          <CardDescription>Key performance indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className={cn(
            "grid gap-4",
            useMobileLayout ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2 md:grid-cols-4"
          )}>
            {[
              { label: "Attendance Rate", value: 94.2, suffix: "%", target: 95, color: "text-blue-500" },
              { label: "Fee Collection", value: 98, suffix: "%", target: 100, color: "text-emerald-500" },
              { label: "Teacher Retention", value: 96, suffix: "%", target: 95, color: "text-purple-500" },
              { label: "Student Satisfaction", value: 4.5, suffix: "/5", target: 4.5, color: "text-amber-500" },
            ].map((metric, idx) => (
              <div key={idx} className="p-4 rounded-lg border border-border bg-card">
                <p className="text-xs text-muted-foreground mb-1">{metric.label}</p>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className={cn("text-2xl font-bold", metric.color)}>{metric.value}</span>
                  <span className="text-sm text-muted-foreground">{metric.suffix}</span>
                </div>
                <Progress value={(metric.value / metric.target) * 100} className="h-1.5 mb-1" />
                <p className="text-[10px] text-muted-foreground">Target: {metric.target}{metric.suffix}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className={cn(
            "grid gap-3",
            useMobileLayout ? "grid-cols-2" : "grid-cols-2 md:grid-cols-4"
          )}>
            {[
              { icon: Users, label: "Add Student", color: "text-blue-500" },
              { icon: Building2, label: "Add Teacher", color: "text-purple-500" },
              { icon: FileText, label: "Generate Report", color: "text-emerald-500" },
              { icon: Settings, label: "System Settings", color: "text-muted-foreground" },
            ].map((action, idx) => (
              <button
                key={idx}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
              >
                <action.icon className={cn("size-6", action.color)} />
                <span className="text-xs font-medium">{action.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
