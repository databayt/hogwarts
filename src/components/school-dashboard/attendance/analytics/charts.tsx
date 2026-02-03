"use client"

import React from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

// Define colors for charts
const COLORS = {
  primary: "#6366f1",
  secondary: "#8b5cf6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#3b82f6",
  muted: "#94a3b8",
}

const STATUS_COLORS = {
  PRESENT: COLORS.success,
  ABSENT: COLORS.danger,
  LATE: COLORS.warning,
  EXCUSED: COLORS.info,
  SICK: COLORS.secondary,
  HOLIDAY: COLORS.muted,
}

interface AttendanceTrendsChartProps {
  data: Array<{
    date: string
    present: number
    absent: number
    late: number
    rate: number
  }>
  className?: string
}

export function AttendanceTrendsChart({
  data,
  className,
}: AttendanceTrendsChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Attendance Trends</CardTitle>
          <CardDescription>Daily attendance rates over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground flex h-[350px] items-center justify-center">
            No attendance data available for the selected period
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Attendance Trends</CardTitle>
        <CardDescription>Daily attendance rates over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              style={{ fontSize: 12 }}
              tickFormatter={(value) =>
                new Date(value).toLocaleDateString("en", {
                  month: "short",
                  day: "numeric",
                })
              }
            />
            <YAxis stroke="#64748b" style={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Bar
              dataKey="present"
              stackId="a"
              fill={STATUS_COLORS.PRESENT}
              name="Present"
            />
            <Bar
              dataKey="late"
              stackId="a"
              fill={STATUS_COLORS.LATE}
              name="Late"
            />
            <Bar
              dataKey="absent"
              stackId="a"
              fill={STATUS_COLORS.ABSENT}
              name="Absent"
            />
            <Line
              type="monotone"
              dataKey="rate"
              stroke={COLORS.primary}
              strokeWidth={2}
              name="Attendance Rate %"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

interface MethodUsagePieChartProps {
  data: Array<{
    method: string
    count: number
    percentage: number
  }>
  className?: string
}

export function MethodUsagePieChart({
  data,
  className,
}: MethodUsagePieChartProps) {
  const chartColors = [
    COLORS.primary,
    COLORS.secondary,
    COLORS.success,
    COLORS.warning,
    COLORS.danger,
    COLORS.info,
    "#ec4899",
    "#14b8a6",
    "#f97316",
    "#84cc16",
  ]

  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Method Distribution</CardTitle>
          <CardDescription>How attendance is being tracked</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground flex h-[350px] items-center justify-center">
            No tracking methods used in selected period
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Method Distribution</CardTitle>
        <CardDescription>How attendance is being tracked</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ method, percentage }) =>
                `${method}: ${percentage.toFixed(0)}%`
              }
              outerRadius={120}
              fill="#8884d8"
              dataKey="count"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={chartColors[index % chartColors.length]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

interface DayWisePatternChartProps {
  data: Array<{
    day: string
    rate: number
    present: number
    total: number
  }>
  className?: string
}

export function DayWisePatternChart({
  data,
  className,
}: DayWisePatternChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Weekly Pattern Analysis</CardTitle>
          <CardDescription>Attendance patterns by day of week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground flex h-[300px] items-center justify-center">
            No pattern data available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Weekly Pattern Analysis</CardTitle>
        <CardDescription>Attendance patterns by day of week</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={data}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis
              dataKey="day"
              stroke="#64748b"
              style={{ fontSize: 12 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              stroke="#64748b"
              style={{ fontSize: 10 }}
            />
            <Radar
              name="Attendance Rate"
              dataKey="rate"
              stroke={COLORS.primary}
              fill={COLORS.primary}
              fillOpacity={0.6}
            />
            <Legend />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

interface TimeDistributionChartProps {
  data: Array<{
    hour: string
    checkIns: number
    onTime: number
    late: number
  }>
  className?: string
}

export function TimeDistributionChart({
  data,
  className,
}: TimeDistributionChartProps) {
  const hasData =
    data && data.some((d) => d.checkIns > 0 || d.onTime > 0 || d.late > 0)

  if (!hasData) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Check-in Time Distribution</CardTitle>
          <CardDescription>When students are arriving</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground flex h-[300px] items-center justify-center">
            No check-in time data available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Check-in Time Distribution</CardTitle>
        <CardDescription>When students are arriving</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="hour" stroke="#64748b" style={{ fontSize: 12 }} />
            <YAxis stroke="#64748b" style={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="onTime"
              stackId="1"
              stroke={STATUS_COLORS.PRESENT}
              fill={STATUS_COLORS.PRESENT}
              name="On Time"
            />
            <Area
              type="monotone"
              dataKey="late"
              stackId="1"
              stroke={STATUS_COLORS.LATE}
              fill={STATUS_COLORS.LATE}
              name="Late"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

interface ClassComparisonChartProps {
  data: Array<{
    class: string
    rate: number
    students: number
  }>
  className?: string
}

export function ClassComparisonChart({
  data,
  className,
}: ClassComparisonChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Class Performance Comparison</CardTitle>
          <CardDescription>
            Attendance rates across different classes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground flex h-[350px] items-center justify-center">
            No class comparison data available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Class Performance Comparison</CardTitle>
        <CardDescription>
          Attendance rates across different classes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={data}
            layout="horizontal"
            margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              type="number"
              domain={[0, 100]}
              stroke="#64748b"
              style={{ fontSize: 12 }}
            />
            <YAxis
              type="category"
              dataKey="class"
              stroke="#64748b"
              style={{ fontSize: 12 }}
              width={70}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
              }}
              formatter={(value: number) => `${value.toFixed(1)}%`}
            />
            <Bar dataKey="rate" name="Attendance Rate">
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.rate >= 95
                      ? STATUS_COLORS.PRESENT
                      : entry.rate >= 80
                        ? STATUS_COLORS.LATE
                        : STATUS_COLORS.ABSENT
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

interface StudentAttendanceHeatmapProps {
  data: Array<{
    student: string
    monday: number
    tuesday: number
    wednesday: number
    thursday: number
    friday: number
  }>
  className?: string
}

export function StudentAttendanceHeatmap({
  data,
  className,
}: StudentAttendanceHeatmapProps) {
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday"]

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Student Attendance Heatmap</CardTitle>
        <CardDescription>
          Weekly attendance patterns per student
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="grid grid-cols-6 gap-2 text-xs font-medium">
            <div></div>
            {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day) => (
              <div key={day} className="text-center">
                {day}
              </div>
            ))}
          </div>
          {data.slice(0, 10).map((student) => (
            <div key={student.student} className="grid grid-cols-6 gap-2">
              <div className="truncate text-xs">{student.student}</div>
              {days.map((day) => {
                const value = student[day as keyof typeof student] as number
                return (
                  <div
                    key={day}
                    className={cn(
                      "flex h-8 items-center justify-center rounded text-xs font-medium",
                      value === 100
                        ? "bg-green-500 text-white"
                        : value >= 80
                          ? "bg-green-200"
                          : value >= 60
                            ? "bg-yellow-200"
                            : value >= 40
                              ? "bg-orange-200"
                              : "bg-red-200"
                    )}
                  >
                    {value}%
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

interface MonthlyComparisonChartProps {
  data: Array<{
    month: string
    current: number
    previous: number
  }>
  className?: string
}

export function MonthlyComparisonChart({
  data,
  className,
}: MonthlyComparisonChartProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Year-over-Year Comparison</CardTitle>
        <CardDescription>
          Current year vs previous year attendance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: 12 }} />
            <YAxis
              stroke="#64748b"
              style={{ fontSize: 12 }}
              domain={[80, 100]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="current"
              stroke={COLORS.primary}
              strokeWidth={2}
              dot={{ r: 4 }}
              name="Current Year"
            />
            <Line
              type="monotone"
              dataKey="previous"
              stroke={COLORS.muted}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 4 }}
              name="Previous Year"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

interface AbsenceReasonsChartProps {
  data: Array<{
    reason: string
    count: number
    color: string
  }>
  className?: string
}

export function AbsenceReasonsChart({
  data,
  className,
}: AbsenceReasonsChartProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Absence Reasons Breakdown</CardTitle>
        <CardDescription>Why students are missing classes</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="reason" stroke="#64748b" style={{ fontSize: 12 }} />
            <YAxis stroke="#64748b" style={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="count" name="Number of Absences">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
