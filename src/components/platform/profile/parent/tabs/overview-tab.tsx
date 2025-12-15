/**
 * Parent Profile Overview Tab
 * Summary view of children's performance and key highlights
 */

"use client"

import React from "react"
import { format, formatDistanceToNow } from "date-fns"
import {
  Activity,
  Award,
  Bell,
  BookOpen,
  Calendar,
  ChevronRight,
  CircleAlert,
  Clock,
  CreditCard,
  FileText,
  GraduationCap,
  MessageSquare,
  TrendingUp,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import type { ParentProfile } from "../../types"

// ============================================================================
// Types
// ============================================================================

interface OverviewTabProps {
  profile: ParentProfile
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
  const { children, engagementMetrics, financialSummary, parentingInfo } =
    profile

  // Calculate overall statistics
  const averageGPA =
    (children?.reduce((sum, child) => sum + (child.currentGPA || 0), 0) ?? 0) /
    (children?.length || 1)
  const averageAttendance =
    (children?.reduce((sum, child) => sum + (child.attendanceRate || 0), 0) ??
      0) / (children?.length || 1)
  const totalUpcomingAssignments =
    children?.reduce(
      (sum, child) => sum + (child.upcomingAssignments || 0),
      0
    ) ?? 0
  const hasOutstandingFees = (financialSummary?.pendingAmount || 0) > 0

  // Key statistics
  const stats: StatCard[] = [
    {
      title: "Children",
      value: children?.length || 0,
      description: "Enrolled students",
      icon: <Users className="h-4 w-4" />,
      color: "text-blue-500",
    },
    {
      title: "Average GPA",
      value: averageGPA.toFixed(2),
      description: "Combined average",
      icon: <GraduationCap className="h-4 w-4" />,
      color: "text-green-500",
      trend: averageGPA >= 3.5 ? "up" : "stable",
    },
    {
      title: "Attendance",
      value: `${averageAttendance.toFixed(0)}%`,
      description: "Average rate",
      icon: <Calendar className="h-4 w-4" />,
      color: "text-purple-500",
      trend: averageAttendance >= 95 ? "up" : "down",
    },
    {
      title: "Pending Tasks",
      value: totalUpcomingAssignments,
      description: "Assignments due",
      icon: <Clock className="h-4 w-4" />,
      color: "text-orange-500",
    },
  ]

  // Recent notifications (mock data)
  const notifications = [
    {
      type: "assignment",
      message: "Alex has a Math test tomorrow",
      time: "2 hours ago",
      urgent: true,
    },
    {
      type: "grade",
      message: "Emma received an A in Science project",
      time: "5 hours ago",
      urgent: false,
    },
    {
      type: "payment",
      message: "Tuition fee due in 5 days",
      time: "1 day ago",
      urgent: true,
    },
    {
      type: "event",
      message: "Parent-Teacher meeting on Friday",
      time: "2 days ago",
      urgent: false,
    },
  ]

  return (
    <div className={cn("space-y-6", className)}>
      {/* Alert Banner */}
      {hasOutstandingFees && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CircleAlert className="text-destructive h-5 w-5" />
              <div className="flex-1">
                <p className="font-medium">Payment Reminder</p>
                <p className="text-muted-foreground text-sm">
                  You have ${financialSummary?.pendingAmount || 0} in pending
                  fees. Next payment due on{" "}
                  {financialSummary?.nextPaymentDate
                    ? format(financialSummary.nextPaymentDate, "MMM dd, yyyy")
                    : "N/A"}
                </p>
              </div>
              <Button variant="destructive" size="sm">
                Pay Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Children Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Children Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {children?.map((child) => (
            <div
              key={child.id}
              className="hover:bg-muted/50 rounded-lg border p-4 transition-colors"
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={child.profilePhotoUrl || undefined} />
                  <AvatarFallback>{child.givenName?.[0] || "?"}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">
                        {child.givenName} {child.surname}
                      </h4>
                      <p className="text-muted-foreground text-sm">
                        Grade {child.grade}, Section {child.section} • Student
                        ID: {child.studentId}
                      </p>
                    </div>
                    <Badge variant="secondary">{child.academicStatus}</Badge>
                  </div>

                  {/* Quick Stats */}
                  <div className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div>
                      <p className="text-muted-foreground text-xs">GPA</p>
                      <div className="flex items-center gap-1">
                        <p className="font-semibold">{child.currentGPA}</p>
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">
                        Attendance
                      </p>
                      <p className="font-semibold">{child.attendanceRate}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">
                        Pending Tasks
                      </p>
                      <p className="font-semibold">
                        {child.upcomingAssignments}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Status</p>
                      <Badge variant="outline" className="text-xs">
                        {child.enrollmentStatus}
                      </Badge>
                    </div>
                  </div>

                  {/* Recent Grades */}
                  {child.recentGrades && child.recentGrades.length > 0 && (
                    <div className="mt-3">
                      <p className="text-muted-foreground mb-2 text-xs">
                        Recent Grades
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {child.recentGrades.map((grade, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="text-xs"
                          >
                            {grade.subject}: {grade.grade} ({grade.score}%)
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="sm">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Engagement Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4" />
              Parent Engagement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Messages Sent</span>
              <span className="font-semibold">
                {engagementMetrics?.messagesSent || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Events Attended</span>
              <span className="font-semibold">
                {engagementMetrics?.eventsAttended || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Volunteer Hours</span>
              <span className="font-semibold">
                {engagementMetrics?.volunteerHours || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">PT Meetings</span>
              <span className="font-semibold">
                {engagementMetrics?.parentTeacherMeetings || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">School Activities</span>
              <span className="font-semibold">
                {engagementMetrics?.schoolActivitiesParticipation || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Financial Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Financial Summary
              </span>
              <Button variant="outline" size="sm">
                View Details
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span>Payment Progress</span>
                <span className="font-medium">
                  ${financialSummary?.totalPaid || 0} / $
                  {financialSummary?.totalFeesDue || 0}
                </span>
              </div>
              <Progress
                value={
                  ((financialSummary?.totalPaid || 0) /
                    (financialSummary?.totalFeesDue || 1)) *
                  100
                }
                className="h-2"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Pending Amount</span>
              <span className="text-destructive font-semibold">
                ${financialSummary?.pendingAmount || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Next Payment</span>
              <span className="text-muted-foreground text-sm">
                {financialSummary?.nextPaymentDate
                  ? format(financialSummary.nextPaymentDate, "MMM dd, yyyy")
                  : "N/A"}
              </span>
            </div>
            <Button className="w-full" size="sm">
              Make Payment
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Notifications & Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Recent Notifications
            </span>
            <Badge variant="secondary">{notifications.length} new</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {notifications.map((notif, index) => (
            <div
              key={index}
              className="hover:bg-muted/50 flex items-start gap-3 rounded-lg p-3 transition-colors"
            >
              <div
                className={cn(
                  "rounded-lg p-2",
                  notif.urgent ? "bg-destructive/10" : "bg-muted"
                )}
              >
                {notif.type === "assignment" && (
                  <FileText className="h-4 w-4" />
                )}
                {notif.type === "grade" && <Award className="h-4 w-4" />}
                {notif.type === "payment" && <CreditCard className="h-4 w-4" />}
                {notif.type === "event" && <Calendar className="h-4 w-4" />}
              </div>
              <div className="flex-1">
                <p className="text-sm">{notif.message}</p>
                <p className="text-muted-foreground text-xs">{notif.time}</p>
              </div>
              {notif.urgent && (
                <Badge variant="destructive" className="text-xs">
                  Urgent
                </Badge>
              )}
            </div>
          ))}
          <Button variant="outline" size="sm" className="w-full">
            View All Notifications
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Emergency Contacts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CircleAlert className="h-4 w-4" />
            Emergency Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Emergency Contacts */}
            <div>
              <p className="mb-2 text-sm font-medium">Emergency Contacts</p>
              <div className="space-y-2">
                {(parentingInfo as any)?.emergencyContacts?.map(
                  (contact: any, index: number) => (
                    <div key={index} className="text-sm">
                      <p className="font-medium">{contact.name}</p>
                      <p className="text-muted-foreground">
                        {contact.relationship} • {contact.phone}
                      </p>
                    </div>
                  )
                ) || (
                  <p className="text-muted-foreground text-sm">
                    No emergency contacts
                  </p>
                )}
              </div>
            </div>

            {/* Authorized Pickups */}
            <div>
              <p className="mb-2 text-sm font-medium">Authorized Pickups</p>
              <div className="flex flex-wrap gap-2">
                {(parentingInfo as any)?.authorizedPickups?.map(
                  (person: string, index: number) => (
                    <Badge key={index} variant="secondary">
                      {person}
                    </Badge>
                  )
                ) || (
                  <p className="text-muted-foreground text-sm">
                    No authorized pickups
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
