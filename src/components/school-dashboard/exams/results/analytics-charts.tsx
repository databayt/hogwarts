"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Enhanced per-exam analytics charts: score distribution, grade distribution,
// per-question success rate, top/bottom performers
import { Award, TrendingDown, TrendingUp, UserX } from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export interface ScoreDistributionBucket {
  range: string
  count: number
}

export interface GradeDistribution {
  grade: string
  count: number
}

export interface PerformerData {
  studentName: string
  percentage: number
  grade: string | null
}

export interface AnalyticsData {
  scoreDistribution: ScoreDistributionBucket[]
  gradeDistribution: GradeDistribution[]
  topPerformers: PerformerData[]
  bottomPerformers: PerformerData[]
  absentCount: number
  totalStudents: number
}

const GRADE_COLORS: Record<string, string> = {
  "A+": "#16a34a",
  A: "#22c55e",
  "A-": "#4ade80",
  "B+": "#2563eb",
  B: "#3b82f6",
  "B-": "#60a5fa",
  "C+": "#ca8a04",
  C: "#eab308",
  "C-": "#facc15",
  "D+": "#ea580c",
  D: "#f97316",
  "D-": "#fb923c",
  F: "#dc2626",
}

const DISTRIBUTION_COLORS = [
  "#dc2626", // 0-10
  "#ea580c", // 10-20
  "#f97316", // 20-30
  "#ca8a04", // 30-40
  "#eab308", // 40-50
  "#84cc16", // 50-60
  "#22c55e", // 60-70
  "#16a34a", // 70-80
  "#2563eb", // 80-90
  "#7c3aed", // 90-100
]

interface AnalyticsChartsProps {
  data: AnalyticsData
}

export function AnalyticsCharts({ data }: AnalyticsChartsProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Score Distribution Histogram */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Score Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {data.scoreDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.scoreDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="range"
                    tick={{ fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {data.scoreDistribution.map((_, i) => (
                      <Cell
                        key={i}
                        fill={
                          DISTRIBUTION_COLORS[i % DISTRIBUTION_COLORS.length]
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground py-8 text-center text-sm">
                No score data available
              </p>
            )}
          </CardContent>
        </Card>

        {/* Grade Distribution Pie */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Grade Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {data.gradeDistribution.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="60%" height={280}>
                  <PieChart>
                    <Pie
                      data={data.gradeDistribution}
                      dataKey="count"
                      nameKey="grade"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ grade, count }) => `${grade}: ${count}`}
                    >
                      {data.gradeDistribution.map((entry) => (
                        <Cell
                          key={entry.grade}
                          fill={GRADE_COLORS[entry.grade] || "#6b7280"}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5">
                  {data.gradeDistribution.map((d) => (
                    <div key={d.grade} className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{
                          backgroundColor: GRADE_COLORS[d.grade] || "#6b7280",
                        }}
                      />
                      <span className="text-xs">
                        {d.grade}: {d.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground py-8 text-center text-sm">
                No grade data available
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Top Performers */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <CardTitle className="text-base">Top Performers</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.topPerformers.length > 0 ? (
              data.topPerformers.map((student, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-md border p-2"
                >
                  <div className="flex items-center gap-2">
                    {i === 0 && <Award className="h-4 w-4 text-amber-500" />}
                    <span className="truncate text-sm">
                      {student.studentName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-emerald-600">
                      {student.percentage.toFixed(0)}%
                    </span>
                    {student.grade && (
                      <Badge variant="outline" className="text-xs">
                        {student.grade}
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground py-4 text-center text-sm">
                No data
              </p>
            )}
          </CardContent>
        </Card>

        {/* Bottom Performers */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-orange-500" />
              <CardTitle className="text-base">Needs Improvement</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.bottomPerformers.length > 0 ? (
              data.bottomPerformers.map((student, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-md border p-2"
                >
                  <span className="truncate text-sm">
                    {student.studentName}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-orange-600">
                      {student.percentage.toFixed(0)}%
                    </span>
                    {student.grade && (
                      <Badge variant="outline" className="text-xs">
                        {student.grade}
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground py-4 text-center text-sm">
                No data
              </p>
            )}
          </CardContent>
        </Card>

        {/* Absent Students */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <UserX className="h-4 w-4 text-red-500" />
              <CardTitle className="text-base">Attendance</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Present</span>
                <span className="text-sm font-bold">
                  {data.totalStudents - data.absentCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Absent</span>
                <span className="text-sm font-bold text-red-600">
                  {data.absentCount}
                </span>
              </div>
              <div className="flex items-center justify-between border-t pt-2">
                <span className="text-sm font-medium">Attendance Rate</span>
                <Badge
                  variant={
                    data.totalStudents > 0 &&
                    (data.totalStudents - data.absentCount) /
                      data.totalStudents >=
                      0.9
                      ? "default"
                      : "destructive"
                  }
                >
                  {data.totalStudents > 0
                    ? (
                        ((data.totalStudents - data.absentCount) /
                          data.totalStudents) *
                        100
                      ).toFixed(0)
                    : 0}
                  %
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
