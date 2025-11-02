/**
 * Teacher Profile Overview Tab
 * Summary view with teaching metrics and key highlights
 */

"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Award,
  BookOpen,
  Users,
  TrendingUp,
  Calendar,
  Star,
  Clock,
  GraduationCap,
  ChevronRight,
  MessageSquare,
  BarChart,
  Target
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import type { TeacherProfile } from '../../types'
import type { Dictionary } from '@/components/internationalization/dictionaries'

// ============================================================================
// Types
// ============================================================================

interface OverviewTabProps {
  profile: TeacherProfile
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
  const { teacher, professionalInfo, teachingMetrics, schedule } = profile

  // Key statistics
  const stats: StatCard[] = [
    {
      title: 'Students Taught',
      value: teachingMetrics.totalStudentsTaught,
      description: 'Total students',
      icon: <Users className="h-4 w-4" />,
      color: 'text-blue-500',
      trend: 'up'
    },
    {
      title: 'Student Rating',
      value: teachingMetrics.averageStudentRating?.toFixed(1) || 'N/A',
      description: `${teachingMetrics.feedbackCount} reviews`,
      icon: <Star className="h-4 w-4" />,
      color: 'text-yellow-500',
      trend: 'up'
    },
    {
      title: 'Pass Rate',
      value: `${teachingMetrics.passRate?.toFixed(1)}%`,
      description: 'Student success',
      icon: <TrendingUp className="h-4 w-4" />,
      color: 'text-green-500',
      trend: 'stable'
    },
    {
      title: 'Weekly Hours',
      value: schedule.weeklyHours,
      description: 'Teaching hours',
      icon: <Clock className="h-4 w-4" />,
      color: 'text-purple-500'
    }
  ]

  // Current classes (mock data for display)
  const currentClasses = [
    { name: 'CS101 - Programming', students: 45, nextClass: 'Tomorrow 9:00 AM' },
    { name: 'CS201 - Data Structures', students: 38, nextClass: 'Thursday 2:00 PM' },
    { name: 'CS301 - Machine Learning', students: 25, nextClass: 'Friday 11:00 AM' }
  ]

  // Recent feedback (mock data)
  const recentFeedback = [
    { student: 'Alex Smith', rating: 5, comment: 'Excellent teaching methodology!', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    { student: 'Emma Johnson', rating: 5, comment: 'Very helpful and knowledgeable', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
    { student: 'Michael Brown', rating: 4, comment: 'Great course content', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
  ]

  return (
    <div className={cn('space-y-6', className)}>
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
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Classes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Current Classes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {currentClasses.map((cls, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-sm">{cls.name}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {cls.students} students
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {cls.nextClass}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full">
              View All Classes
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>

        {/* Teaching Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart className="h-4 w-4" />
              Teaching Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Student Satisfaction</span>
                <span className="font-medium">{(teachingMetrics.averageStudentRating! / 5 * 100).toFixed(0)}%</span>
              </div>
              <Progress value={teachingMetrics.averageStudentRating! / 5 * 100} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Pass Rate</span>
                <span className="font-medium">{teachingMetrics.passRate}%</span>
              </div>
              <Progress value={teachingMetrics.passRate} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Attendance Rate</span>
                <span className="font-medium">{teachingMetrics.attendanceRate}%</span>
              </div>
              <Progress value={teachingMetrics.attendanceRate} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Course Completion</span>
                <span className="font-medium">87%</span>
              </div>
              <Progress value={87} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Specializations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Specializations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {professionalInfo.specializations.map((spec, index) => (
                <Badge key={index} variant="secondary">
                  {spec}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Research Interests */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              Research Interests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {professionalInfo.researchInterests?.map((interest, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span className="text-sm">{interest}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Office Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Office Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {schedule.officeHours?.map((hour, index) => {
                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                return (
                  <div key={index} className="text-sm">
                    <div className="font-medium">{days[hour.dayOfWeek]}</div>
                    <div className="text-muted-foreground">
                      {hour.startTime} - {hour.endTime}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {hour.isOnline ? '🟢 Online' : `📍 ${hour.location}`}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Student Feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Recent Student Feedback
            </span>
            <Button variant="outline" size="sm">
              View All Reviews
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {recentFeedback.map((feedback, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${feedback.student}`} />
                    <AvatarFallback>{feedback.student[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{feedback.student}</p>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            'h-3 w-3',
                            i < feedback.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {format(feedback.date, 'MMM dd, yyyy')}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{feedback.comment}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Professional Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="h-4 w-4" />
            Professional Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Employment</p>
              <p className="font-medium">{professionalInfo.employmentType}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <Badge variant="secondary">{professionalInfo.employmentStatus}</Badge>
            </div>
            <div>
              <p className="text-muted-foreground">Experience</p>
              <p className="font-medium">{professionalInfo.totalExperience} years</p>
            </div>
            <div>
              <p className="text-muted-foreground">Joined</p>
              <p className="font-medium">{format(professionalInfo.joiningDate, 'MMM yyyy')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}