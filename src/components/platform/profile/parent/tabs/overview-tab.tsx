/**
 * Parent Profile Overview Tab
 * Summary view of children's performance and key highlights
 */

"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Users, GraduationCap, Calendar, CreditCard, TrendingUp, CircleAlert, ChevronRight, Clock, Award, BookOpen, Activity, MessageSquare, FileText, Bell } from "lucide-react"
import { cn } from '@/lib/utils'
import { format, formatDistanceToNow } from 'date-fns'
import type { ParentProfile } from '../../types'
import type { Dictionary } from '@/components/internationalization/dictionaries'

// ============================================================================
// Types
// ============================================================================

interface OverviewTabProps {
  profile: ParentProfile
  dictionary?: Dictionary
  lang?: 'ar' | 'en'
  className?: string
}

interface StatCard {
  title: string
  value: string | number
  description?: string
  icon: React.ReactNode
  color?: string
  trend?: 'up' | 'down' | 'stable'
}

// ============================================================================
// Component
// ============================================================================

export function OverviewTab({
  profile,
  dictionary,
  lang = 'en',
  className
}: OverviewTabProps) {
  const { children, engagementMetrics, financialSummary, parentingInfo } = profile

  // Calculate overall statistics
  const averageGPA = (children?.reduce((sum, child) => sum + (child.currentGPA || 0), 0) ?? 0) / (children?.length || 1)
  const averageAttendance = (children?.reduce((sum, child) => sum + (child.attendanceRate || 0), 0) ?? 0) / (children?.length || 1)
  const totalUpcomingAssignments = children?.reduce((sum, child) => sum + (child.upcomingAssignments || 0), 0) ?? 0
  const hasOutstandingFees = (financialSummary?.pendingAmount || 0) > 0

  // Key statistics
  const stats: StatCard[] = [
    {
      title: 'Children',
      value: children?.length || 0,
      description: 'Enrolled students',
      icon: <Users className="h-4 w-4" />,
      color: 'text-blue-500'
    },
    {
      title: 'Average GPA',
      value: averageGPA.toFixed(2),
      description: 'Combined average',
      icon: <GraduationCap className="h-4 w-4" />,
      color: 'text-green-500',
      trend: averageGPA >= 3.5 ? 'up' : 'stable'
    },
    {
      title: 'Attendance',
      value: `${averageAttendance.toFixed(0)}%`,
      description: 'Average rate',
      icon: <Calendar className="h-4 w-4" />,
      color: 'text-purple-500',
      trend: averageAttendance >= 95 ? 'up' : 'down'
    },
    {
      title: 'Pending Tasks',
      value: totalUpcomingAssignments,
      description: 'Assignments due',
      icon: <Clock className="h-4 w-4" />,
      color: 'text-orange-500'
    }
  ]

  // Recent notifications (mock data)
  const notifications = [
    { type: 'assignment', message: 'Alex has a Math test tomorrow', time: '2 hours ago', urgent: true },
    { type: 'grade', message: 'Emma received an A in Science project', time: '5 hours ago', urgent: false },
    { type: 'payment', message: 'Tuition fee due in 5 days', time: '1 day ago', urgent: true },
    { type: 'event', message: 'Parent-Teacher meeting on Friday', time: '2 days ago', urgent: false }
  ]

  return (
    <div className={cn('space-y-6', className)}>
      {/* Alert Banner */}
      {hasOutstandingFees && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CircleAlert className="h-5 w-5 text-destructive" />
              <div className="flex-1">
                <p className="font-medium">Payment Reminder</p>
                <p className="text-sm text-muted-foreground">
                  You have ${financialSummary?.pendingAmount || 0} in pending fees. Next payment due on {financialSummary?.nextPaymentDate ? format(financialSummary.nextPaymentDate, 'MMM dd, yyyy') : 'N/A'}
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className={cn('p-2 rounded-lg bg-muted', stat.color)}>
                  {stat.icon}
                </div>
                {stat.trend && (
                  <Badge
                    variant={stat.trend === 'up' ? 'default' : stat.trend === 'down' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {stat.trend === 'up' ? '↑' : stat.trend === 'down' ? '↓' : '→'}
                  </Badge>
                )}
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.title}</p>
              {stat.description && (
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              )}
            </CardContent>
          </Card>
        ))
      }</div>

      {/* Children Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Children Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {children?.map((child) => (
            <div key={child.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={child.profilePhotoUrl || undefined} />
                  <AvatarFallback>{child.givenName?.[0] || '?'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{child.givenName} {child.surname}</h4>
                      <p className="text-sm text-muted-foreground">
                        Grade {child.grade}, Section {child.section} • Student ID: {child.studentId}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {child.academicStatus}
                    </Badge>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                    <div>
                      <p className="text-xs text-muted-foreground">GPA</p>
                      <div className="flex items-center gap-1">
                        <p className="font-semibold">{child.currentGPA}</p>
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Attendance</p>
                      <p className="font-semibold">{child.attendanceRate}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Pending Tasks</p>
                      <p className="font-semibold">{child.upcomingAssignments}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <Badge variant="outline" className="text-xs">
                        {child.enrollmentStatus}
                      </Badge>
                    </div>
                  </div>

                  {/* Recent Grades */}
                  {child.recentGrades && child.recentGrades.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-muted-foreground mb-2">Recent Grades</p>
                      <div className="flex gap-2 flex-wrap">
                        {child.recentGrades.map((grade, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Engagement Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Parent Engagement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Messages Sent</span>
              <span className="font-semibold">{engagementMetrics?.messagesSent || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Events Attended</span>
              <span className="font-semibold">{engagementMetrics?.eventsAttended || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Volunteer Hours</span>
              <span className="font-semibold">{engagementMetrics?.volunteerHours || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">PT Meetings</span>
              <span className="font-semibold">{engagementMetrics?.parentTeacherMeetings || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">School Activities</span>
              <span className="font-semibold">{engagementMetrics?.schoolActivitiesParticipation || 0}</span>
            </div>
          </CardContent>
        </Card>

        {/* Financial Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Financial Summary
              </span>
              <Button variant="outline" size="sm">
                View Details
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Payment Progress</span>
                <span className="font-medium">${financialSummary?.totalPaid || 0} / ${financialSummary?.totalFeesDue || 0}</span>
              </div>
              <Progress value={((financialSummary?.totalPaid || 0) / (financialSummary?.totalFeesDue || 1)) * 100} className="h-2" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Pending Amount</span>
              <span className="font-semibold text-destructive">${financialSummary?.pendingAmount || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Next Payment</span>
              <span className="text-sm text-muted-foreground">
                {financialSummary?.nextPaymentDate ? format(financialSummary.nextPaymentDate, 'MMM dd, yyyy') : 'N/A'}
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
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Recent Notifications
            </span>
            <Badge variant="secondary">{notifications.length} new</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {notifications.map((notif, index) => (
            <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className={cn(
                "p-2 rounded-lg",
                notif.urgent ? "bg-destructive/10" : "bg-muted"
              )}>
                {notif.type === 'assignment' && <FileText className="h-4 w-4" />}
                {notif.type === 'grade' && <Award className="h-4 w-4" />}
                {notif.type === 'payment' && <CreditCard className="h-4 w-4" />}
                {notif.type === 'event' && <Calendar className="h-4 w-4" />}
              </div>
              <div className="flex-1">
                <p className="text-sm">{notif.message}</p>
                <p className="text-xs text-muted-foreground">{notif.time}</p>
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
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </CardContent>
      </Card>

      {/* Emergency Contacts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CircleAlert className="h-4 w-4" />
            Emergency Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Emergency Contacts */}
            <div>
              <p className="text-sm font-medium mb-2">Emergency Contacts</p>
              <div className="space-y-2">
                {(parentingInfo as any)?.emergencyContacts?.map((contact: any, index: number) => (
                  <div key={index} className="text-sm">
                    <p className="font-medium">{contact.name}</p>
                    <p className="text-muted-foreground">
                      {contact.relationship} • {contact.phone}
                    </p>
                  </div>
                )) || <p className="text-sm text-muted-foreground">No emergency contacts</p>}
              </div>
            </div>

            {/* Authorized Pickups */}
            <div>
              <p className="text-sm font-medium mb-2">Authorized Pickups</p>
              <div className="flex flex-wrap gap-2">
                {(parentingInfo as any)?.authorizedPickups?.map((person: string, index: number) => (
                  <Badge key={index} variant="secondary">
                    {person}
                  </Badge>
                )) || <p className="text-sm text-muted-foreground">No authorized pickups</p>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}