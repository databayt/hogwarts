/**
 * Teacher Profile Overview Tab
 * Summary view with teaching metrics and key highlights
 */

"use client"

import React from "react"
import { format } from "date-fns"
import {
  Award,
  BarChart,
  BookOpen,
  Calendar,
  ChevronRight,
  Clock,
  GraduationCap,
  MessageSquare,
  Star,
  Target,
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

import type { TeacherProfile } from "../../types"

// ============================================================================
// Types
// ============================================================================

interface OverviewTabProps {
  profile: TeacherProfile
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
  const { teacher, professionalInfo, teachingMetrics, schedule } = profile

  // Key statistics
  const stats: StatCard[] = [
    {
      title: "Students Taught",
      value: teachingMetrics.totalStudentsTaught,
      description: "Total students",
      icon: <Users className="h-4 w-4" />,
      color: "text-blue-500",
      trend: "up",
    },
    {
      title: "Student Rating",
      value: teachingMetrics.averageStudentRating?.toFixed(1) || "N/A",
      description: `${teachingMetrics.feedbackCount} reviews`,
      icon: <Star className="h-4 w-4" />,
      color: "text-yellow-500",
      trend: "up",
    },
    {
      title: "Pass Rate",
      value: `${teachingMetrics.passRate?.toFixed(1)}%`,
      description: "Student success",
      icon: <TrendingUp className="h-4 w-4" />,
      color: "text-green-500",
      trend: "stable",
    },
    {
      title: "Weekly Hours",
      value: schedule.weeklyHours,
      description: "Teaching hours",
      icon: <Clock className="h-4 w-4" />,
      color: "text-purple-500",
    },
  ]

  // Current classes (mock data for display)
  const currentClasses = [
    {
      name: "CS101 - Programming",
      students: 45,
      nextClass: "Tomorrow 9:00 AM",
    },
    {
      name: "CS201 - Data Structures",
      students: 38,
      nextClass: "Thursday 2:00 PM",
    },
    {
      name: "CS301 - Machine Learning",
      students: 25,
      nextClass: "Friday 11:00 AM",
    },
  ]

  // Recent feedback (mock data)
  const recentFeedback = [
    {
      student: "Alex Smith",
      rating: 5,
      comment: "Excellent teaching methodology!",
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      student: "Emma Johnson",
      rating: 5,
      comment: "Very helpful and knowledgeable",
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      student: "Michael Brown",
      rating: 4,
      comment: "Great course content",
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
  ]

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
        {/* Current Classes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-4 w-4" />
              Current Classes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {currentClasses.map((cls, index) => (
              <div
                key={index}
                className="bg-muted/50 flex items-center justify-between rounded-lg p-3"
              >
                <div>
                  <p className="text-sm font-medium">{cls.name}</p>
                  <div className="text-muted-foreground mt-1 flex items-center gap-3 text-xs">
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
              <ChevronRight className="ms-1 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Teaching Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart className="h-4 w-4" />
              Teaching Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span>Student Satisfaction</span>
                <span className="font-medium">
                  {((teachingMetrics.averageStudentRating! / 5) * 100).toFixed(
                    0
                  )}
                  %
                </span>
              </div>
              <Progress
                value={(teachingMetrics.averageStudentRating! / 5) * 100}
                className="h-2"
              />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span>Pass Rate</span>
                <span className="font-medium">{teachingMetrics.passRate}%</span>
              </div>
              <Progress value={teachingMetrics.passRate} className="h-2" />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span>Attendance Rate</span>
                <span className="font-medium">
                  {teachingMetrics.attendanceRate}%
                </span>
              </div>
              <Progress
                value={teachingMetrics.attendanceRate}
                className="h-2"
              />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span>Course Completion</span>
                <span className="font-medium">87%</span>
              </div>
              <Progress value={87} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Specializations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
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
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4" />
              Research Interests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {professionalInfo.researchInterests?.map((interest, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="bg-primary h-2 w-2 rounded-full" />
                  <span className="text-sm">{interest}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Office Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" />
              Office Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {schedule.officeHours?.map((hour, index) => {
                const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
                return (
                  <div key={index} className="text-sm">
                    <div className="font-medium">{days[hour.dayOfWeek]}</div>
                    <div className="text-muted-foreground">
                      {hour.startTime} - {hour.endTime}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {hour.isOnline ? "🟢 Online" : `📍 ${hour.location}`}
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
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Recent Student Feedback
            </span>
            <Button variant="outline" size="sm">
              View All Reviews
              <ChevronRight className="ms-1 h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {recentFeedback.map((feedback, index) => (
            <div key={index} className="rounded-lg border p-4">
              <div className="mb-2 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${feedback.student}`}
                    />
                    <AvatarFallback>{feedback.student[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{feedback.student}</p>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-3 w-3",
                            i < feedback.rating
                              ? "fill-yellow-500 text-yellow-500"
                              : "text-gray-300"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <span className="text-muted-foreground text-xs">
                  {format(feedback.date, "MMM dd, yyyy")}
                </span>
              </div>
              <p className="text-muted-foreground text-sm">
                {feedback.comment}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Professional Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Award className="h-4 w-4" />
            Professional Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <div>
              <p className="text-muted-foreground">Employment</p>
              <p className="font-medium">{professionalInfo.employmentType}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <Badge variant="secondary">
                {professionalInfo.employmentStatus}
              </Badge>
            </div>
            <div>
              <p className="text-muted-foreground">Experience</p>
              <p className="font-medium">
                {professionalInfo.totalExperience} years
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Joined</p>
              <p className="font-medium">
                {format(professionalInfo.joiningDate, "MMM yyyy")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
