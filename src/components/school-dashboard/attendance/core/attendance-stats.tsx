"use client"

import React from "react"
import { motion } from "framer-motion"
import {
  Activity,
  BarChart3,
  Calendar,
  Clock,
  PieChart,
  TrendingDown,
  TrendingUp,
  UserCheck,
  UserMinus,
  Users,
  UserX,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import type {
  AttendanceMethod,
  AttendanceRecord,
  AttendanceStats,
} from "../shared/types"
import {
  calculateAttendancePercentage,
  getMethodDisplayName,
  getStatusColor,
} from "../shared/utils"

interface AttendanceStatsProps {
  stats: AttendanceStats | null
  records?: AttendanceRecord[]
  showDetails?: boolean
  className?: string
  dictionary?: Dictionary["school"]
}

interface StatCardProps {
  title: string
  value: number | string
  icon: React.ReactNode
  description?: string
  color?: string
  percentage?: number
  trend?: "up" | "down" | "neutral"
}

function StatCard({
  title,
  value,
  icon,
  description,
  color,
  percentage,
  trend,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="transition-shadow hover:shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <div className={cn("rounded-lg p-2", color || "bg-secondary")}>
            {icon}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {description && (
            <p className="text-muted-foreground mt-1 text-xs">{description}</p>
          )}
          {percentage !== undefined && (
            <div className="mt-2 flex items-center">
              <Progress value={percentage} className="flex-1" />
              <span className="ml-2 text-sm font-medium">
                {percentage.toFixed(1)}%
              </span>
            </div>
          )}
          {trend && (
            <div className="mt-2 flex items-center">
              {trend === "up" && (
                <TrendingUp className="text-chart-2 mr-1 h-4 w-4" />
              )}
              {trend === "down" && (
                <TrendingDown className="text-destructive mr-1 h-4 w-4" />
              )}
              {trend === "neutral" && (
                <Activity className="text-muted-foreground mr-1 h-4 w-4" />
              )}
              <span className="text-muted-foreground text-xs">
                vs last period
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function AttendanceStats({
  stats,
  records = [],
  showDetails = true,
  className,
  dictionary,
}: AttendanceStatsProps) {
  const t = dictionary?.attendance as Record<string, unknown> | undefined
  const statsDict = t?.stats as Record<string, string> | undefined
  const statusDict = t?.status as Record<string, string> | undefined
  const methodDict = t?.method as Record<string, string> | undefined

  if (!stats) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>
            {statsDict?.attendanceRate || "Attendance Statistics"}
          </CardTitle>
          <CardDescription>
            {statsDict?.noDataAvailable || "No data available"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <BarChart3 className="text-muted-foreground mx-auto mb-3 h-12 w-12" />
            <p className="text-muted-foreground">
              {statsDict?.selectClassAndDate ||
                "Select a class and date to view attendance statistics"}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate method distribution
  const methodDistribution: Record<AttendanceMethod, number> = {} as any
  records.forEach((record) => {
    if (!methodDistribution[record.method]) {
      methodDistribution[record.method] = 0
    }
    methodDistribution[record.method]++
  })

  // Calculate time-based stats (if records have check-in times)
  const timeStats = records.reduce(
    (acc, record) => {
      if (record.checkInTime) {
        const hour = new Date(record.checkInTime).getHours()
        if (hour < 9) acc.early++
        else if (hour < 10) acc.onTime++
        else acc.late++
      }
      return acc
    },
    { early: 0, onTime: 0, late: 0 }
  )

  return (
    <div className={cn("space-y-6", className)}>
      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={statsDict?.totalStudents || "Total Students"}
          value={stats.total}
          icon={<Users className="h-4 w-4" />}
          description={statsDict?.enrolledInClass || "Enrolled in class"}
          color="bg-primary/10"
        />
        <StatCard
          title={statusDict?.PRESENT || "Present"}
          value={stats.present}
          icon={<UserCheck className="text-chart-2 h-4 w-4" />}
          description={`${calculateAttendancePercentage(stats.present, stats.total)}% ${(t?.title as string | undefined)?.toLowerCase() || "attendance"}`}
          color="bg-chart-2/10"
          percentage={calculateAttendancePercentage(stats.present, stats.total)}
        />
        <StatCard
          title={statusDict?.ABSENT || "Absent"}
          value={stats.absent}
          icon={<UserX className="text-destructive h-4 w-4" />}
          description={`${calculateAttendancePercentage(stats.absent, stats.total)}% ${statusDict?.ABSENT?.toLowerCase() || "absence"}`}
          color="bg-destructive/10"
        />
        <StatCard
          title={statusDict?.LATE || "Late"}
          value={stats.late}
          icon={<Clock className="text-chart-4 h-4 w-4" />}
          description={
            statsDict?.arrivedAfterStartTime || "Arrived after start time"
          }
          color="bg-chart-4/10"
        />
      </div>

      {showDetails && (
        <>
          {/* Secondary Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              title={statusDict?.EXCUSED || "Excused"}
              value={stats.excused}
              icon={<UserMinus className="text-primary h-4 w-4" />}
              description={statsDict?.withValidExcuse || "With valid excuse"}
              color="bg-primary/10"
            />
            <StatCard
              title={statusDict?.SICK || "Sick"}
              value={stats.sick}
              icon={<Activity className="text-chart-1 h-4 w-4" />}
              description={
                statsDict?.healthRelatedAbsence || "Health-related absence"
              }
              color="bg-chart-1/10"
            />
            <StatCard
              title={statusDict?.HOLIDAY || "Holiday"}
              value={stats.holiday}
              icon={<Calendar className="text-chart-3 h-4 w-4" />}
              description={statsDict?.onApprovedLeave || "On approved leave"}
              color="bg-chart-3/10"
            />
          </div>

          {/* Overall Attendance Rate */}
          <Card>
            <CardHeader>
              <CardTitle>
                {statsDict?.overallAttendanceRate || "Overall Attendance Rate"}
              </CardTitle>
              <CardDescription>
                {statsDict?.combinedPresentLate ||
                  "Combined present and late students"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold">
                    {stats.attendanceRate.toFixed(1)}%
                  </span>
                  <div className="text-right">
                    <p className="text-muted-foreground text-sm">
                      {statsDict?.target?.replace("{percent}", "95") ||
                        "Target: 95%"}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {stats.attendanceRate >= 95 ? (
                        <span className="text-chart-2">
                          {statsDict?.aboveTarget || "Above target"}
                        </span>
                      ) : (
                        <span className="text-destructive">
                          {statsDict?.belowTarget?.replace(
                            "{percent}",
                            (95 - stats.attendanceRate).toFixed(1)
                          ) ||
                            `${(95 - stats.attendanceRate).toFixed(1)}% below target`}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <Progress value={stats.attendanceRate} className="h-3" />
              </div>
            </CardContent>
          </Card>

          {/* Method Distribution */}
          {Object.keys(methodDistribution).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {statsDict?.trackingMethodDistribution ||
                    "Tracking Method Distribution"}
                </CardTitle>
                <CardDescription>
                  {statsDict?.howAttendanceRecorded ||
                    "How attendance was recorded today"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(methodDistribution).map(([method, count]) => {
                    const percentage = (count / stats.total) * 100
                    return (
                      <div key={method} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>
                            {methodDict?.[method as keyof typeof methodDict] ||
                              getMethodDisplayName(method as AttendanceMethod)}
                          </span>
                          <span className="font-medium">
                            {count} ({percentage.toFixed(0)}%)
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Time Distribution */}
          {(timeStats.early > 0 ||
            timeStats.onTime > 0 ||
            timeStats.late > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {statsDict?.arrivalTimeDistribution ||
                    "Arrival Time Distribution"}
                </CardTitle>
                <CardDescription>
                  {statsDict?.whenStudentsCheckedIn ||
                    "When students checked in"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="space-y-2">
                    <div className="text-chart-2 text-2xl font-bold">
                      {timeStats.early}
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {statsDict?.early || "Early (<9 AM)"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="text-primary text-2xl font-bold">
                      {timeStats.onTime}
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {statsDict?.onTime || "On Time (9-10 AM)"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="text-chart-4 text-2xl font-bold">
                      {timeStats.late}
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {statsDict?.late || "Late (>10 AM)"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Breakdown Chart */}
          <Card>
            <CardHeader>
              <CardTitle>
                {statsDict?.statusBreakdown || "Status Breakdown"}
              </CardTitle>
              <CardDescription>
                {statsDict?.visualRepresentation ||
                  "Visual representation of attendance status"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Present */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <div className="bg-chart-2 h-3 w-3 rounded-full" />
                      {statusDict?.PRESENT || "Present"}
                    </span>
                    <span className="font-medium">{stats.present}</span>
                  </div>
                  <Progress
                    value={(stats.present / stats.total) * 100}
                    className="h-2"
                  />
                </div>

                {/* Absent */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <div className="bg-destructive h-3 w-3 rounded-full" />
                      {statusDict?.ABSENT || "Absent"}
                    </span>
                    <span className="font-medium">{stats.absent}</span>
                  </div>
                  <Progress
                    value={(stats.absent / stats.total) * 100}
                    className="h-2"
                  />
                </div>

                {/* Late */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <div className="bg-chart-4 h-3 w-3 rounded-full" />
                      {statusDict?.LATE || "Late"}
                    </span>
                    <span className="font-medium">{stats.late}</span>
                  </div>
                  <Progress
                    value={(stats.late / stats.total) * 100}
                    className="h-2"
                  />
                </div>

                {/* Other statuses if they exist */}
                {stats.excused > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <div className="bg-primary h-3 w-3 rounded-full" />
                        {statusDict?.EXCUSED || "Excused"}
                      </span>
                      <span className="font-medium">{stats.excused}</span>
                    </div>
                    <Progress
                      value={(stats.excused / stats.total) * 100}
                      className="h-2"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Last Updated */}
      {stats.lastUpdated && (
        <div className="text-muted-foreground text-center text-sm">
          {statsDict?.lastUpdated?.replace(
            "{date}",
            new Date(stats.lastUpdated).toLocaleString()
          ) || `Last updated: ${new Date(stats.lastUpdated).toLocaleString()}`}
        </div>
      )}
    </div>
  )
}
