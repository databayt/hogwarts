/**
 * Staff Profile Overview Tab
 * Summary view with work metrics and key highlights
 */

"use client"

import React from "react"
import { format } from "date-fns"
import {
  Award,
  BarChart3,
  Briefcase,
  Building,
  Calendar,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Clock,
  FileText,
  Mail,
  Phone,
  Shield,
  Target,
  TrendingUp,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import type { StaffProfile } from "../../types"

// ============================================================================
// Types
// ============================================================================

interface OverviewTabProps {
  profile: any // Cast to any to support mock data properties (staffInfo, workMetrics, responsibilities, schedule)
  dictionary?: Dictionary
  lang?: "ar" | "en"
  className?: string
}

interface StatCard {
  title: string
  value: string | number
  description?: string
  icon: React.ReactNode
  color?: string
  trend?: "up" | "down" | "stable"
}

// ============================================================================
// Component
// ============================================================================

export function OverviewTab({
  profile,
  dictionary,
  lang = "en",
  className,
}: OverviewTabProps) {
  const { staffInfo, workMetrics, responsibilities, schedule } = profile

  // Key statistics
  const stats: StatCard[] = [
    {
      title: "Tasks Completed",
      value: workMetrics.tasksCompleted,
      description: "This month",
      icon: <CircleCheck className="h-4 w-4" />,
      color: "text-green-500",
      trend: "up",
    },
    {
      title: "In Progress",
      value: workMetrics.tasksInProgress,
      description: "Active tasks",
      icon: <Clock className="h-4 w-4" />,
      color: "text-blue-500",
    },
    {
      title: "On-Time Rate",
      value: `${workMetrics.onTimeCompletionRate}%`,
      description: "Completion rate",
      icon: <TrendingUp className="h-4 w-4" />,
      color: "text-purple-500",
      trend: workMetrics.onTimeCompletionRate >= 90 ? "up" : "down",
    },
    {
      title: "Documents",
      value: workMetrics.documentsProcessed,
      description: "Processed",
      icon: <FileText className="h-4 w-4" />,
      color: "text-orange-500",
    },
  ]

  // Upcoming tasks (mock data)
  const upcomingTasks = [
    {
      id: "1",
      title: "Process March payroll",
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      priority: "high",
    },
    {
      id: "2",
      title: "Prepare quarterly budget report",
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      priority: "medium",
    },
    {
      id: "3",
      title: "Update vendor contracts",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      priority: "low",
    },
  ]

  // Recent reports (mock data)
  const recentReports = [
    {
      id: "1",
      name: "Financial Statement - February",
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      status: "completed",
    },
    {
      id: "2",
      name: "Budget Analysis Q1",
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      status: "completed",
    },
    {
      id: "3",
      name: "Expense Report - January",
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      status: "completed",
    },
  ]

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-500"
      case "medium":
        return "text-yellow-500"
      case "low":
        return "text-green-500"
      default:
        return ""
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Statistics Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="mb-2 flex items-start justify-between">
                <div className={cn("bg-muted rounded-lg p-2", stat.color)}>
                  {stat.icon}
                </div>
                {stat.trend && (
                  <Badge
                    variant={
                      stat.trend === "up"
                        ? "default"
                        : stat.trend === "down"
                          ? "destructive"
                          : "secondary"
                    }
                    className="text-xs"
                  >
                    {stat.trend === "up"
                      ? "↑"
                      : stat.trend === "down"
                        ? "↓"
                        : "→"}
                  </Badge>
                )}
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-muted-foreground text-xs">{stat.title}</p>
              {stat.description && (
                <p className="text-muted-foreground mt-1 text-xs">
                  {stat.description}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Employment Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Briefcase className="h-4 w-4" />
              Employment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Employee ID</span>
              <span className="font-medium">{staffInfo.employeeId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Department</span>
              <Badge variant="secondary">{staffInfo.department}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Designation</span>
              <span className="text-sm font-medium">
                {staffInfo.designation}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Reports To</span>
              <span className="font-medium">{staffInfo.reportingTo}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                Service Years
              </span>
              <span className="font-medium">
                {staffInfo.yearsOfService} years
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Status</span>
              <Badge variant="default">{staffInfo.employmentStatus}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Work Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4" />
              Work Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span>Task Completion</span>
                <span className="font-medium">
                  {workMetrics.onTimeCompletionRate}%
                </span>
              </div>
              <Progress
                value={workMetrics.onTimeCompletionRate}
                className="h-2"
              />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span>Efficiency Score</span>
                <span className="font-medium">92%</span>
              </div>
              <Progress value={92} className="h-2" />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span>Quality Rating</span>
                <span className="font-medium">95%</span>
              </div>
              <Progress value={95} className="h-2" />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span>Attendance</span>
                <span className="font-medium">98%</span>
              </div>
              <Progress value={98} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Primary Responsibilities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" />
            Primary Responsibilities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {responsibilities.primary.map((resp: string, index: number) => (
              <div key={index} className="flex items-start gap-2">
                <div className="bg-primary mt-1.5 h-2 w-2 rounded-full" />
                <p className="text-sm">{resp}</p>
              </div>
            ))}
          </div>
          {responsibilities.committees &&
            responsibilities.committees.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-sm font-medium">
                  Committee Memberships
                </p>
                <div className="flex flex-wrap gap-2">
                  {responsibilities.committees.map(
                    (committee: string, index: number) => (
                      <Badge key={index} variant="secondary">
                        {committee}
                      </Badge>
                    )
                  )}
                </div>
              </div>
            )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Upcoming Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Upcoming Tasks
              </span>
              <Button variant="outline" size="sm">
                View All
                <ChevronRight className="ms-1 h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingTasks.map((task) => (
              <div
                key={task.id}
                className="bg-muted/50 flex items-center justify-between rounded-lg p-3"
              >
                <div>
                  <p className="text-sm font-medium">{task.title}</p>
                  <p className="text-muted-foreground text-xs">
                    Due: {format(task.dueDate, "MMM dd, yyyy")}
                  </p>
                </div>
                <Badge
                  variant={
                    task.priority === "high" ? "destructive" : "secondary"
                  }
                  className={cn("text-xs", getPriorityColor(task.priority))}
                >
                  {task.priority}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Recent Reports
              </span>
              <Button variant="outline" size="sm">
                View All
                <ChevronRight className="ms-1 h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentReports.map((report) => (
              <div
                key={report.id}
                className="bg-muted/50 flex items-center justify-between rounded-lg p-3"
              >
                <div>
                  <p className="text-sm font-medium">{report.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {format(report.date, "MMM dd, yyyy")}
                  </p>
                </div>
                <Badge variant="default" className="text-xs">
                  {report.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Skills & Certifications */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Skills */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4" />
              Core Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {staffInfo.skills.map((skill: string, index: number) => (
                <Badge key={index} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Certifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="h-4 w-4" />
              Certifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {staffInfo.certifications?.map((cert: any, index: number) => (
              <div key={index} className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm font-medium">{cert.name}</p>
                <p className="text-muted-foreground text-xs">{cert.issuer}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {format(cert.date, "MMM yyyy")}
                  </Badge>
                  {cert.expiry && (
                    <Badge variant="outline" className="text-xs">
                      Expires: {format(cert.expiry, "MMM yyyy")}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Schedule & Availability */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4" />
            Work Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <p className="text-muted-foreground mb-1 text-sm">
                Working Hours
              </p>
              <p className="font-medium">{schedule.workingHours}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1 text-sm">Break Time</p>
              <p className="font-medium">{schedule.breakTime}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1 text-sm">
                Office Location
              </p>
              <p className="font-medium">{schedule.officeLocation}</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-muted-foreground mb-2 text-sm">Working Days</p>
            <div className="flex gap-2">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                (day, index) => {
                  const isWorkingDay = schedule.workingDays.some((wd: string) =>
                    wd.toLowerCase().startsWith(day.toLowerCase())
                  )
                  return (
                    <div
                      key={day}
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg text-xs font-medium",
                        isWorkingDay
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {day}
                    </div>
                  )
                }
              )}
            </div>
            <div className="mt-4 flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 animate-pulse rounded-full bg-green-500" />
                <span className="text-sm font-medium">
                  Currently {schedule.currentAvailability}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3">
              <div className="bg-muted rounded-lg p-2">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Email</p>
                <p className="font-medium">{profile.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-muted rounded-lg p-2">
                <Phone className="h-4 w-4" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Phone</p>
                <p className="font-medium">{profile.phone || "Not provided"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-muted rounded-lg p-2">
                <Building className="h-4 w-4" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Department</p>
                <p className="font-medium">{staffInfo.department}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-muted rounded-lg p-2">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Reports To</p>
                <p className="font-medium">{staffInfo.reportingTo}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
