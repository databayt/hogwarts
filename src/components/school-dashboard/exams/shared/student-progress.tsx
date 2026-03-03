"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Student progress dashboard with subject trends, question type, and Bloom performance
import { useEffect, useState, useTransition } from "react"
import {
  Award,
  BookOpen,
  Brain,
  FileText,
  Loader2,
  TrendingDown,
  TrendingUp,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import type { ProgressData } from "./progress-actions"
import { getGuardianChildren, getStudentProgress } from "./progress-actions"

interface StudentProgressProps {
  isGuardian?: boolean
}

const QUESTION_TYPE_LABELS: Record<string, string> = {
  MULTIPLE_CHOICE: "MCQ",
  TRUE_FALSE: "T/F",
  SHORT_ANSWER: "Short",
  ESSAY: "Essay",
  FILL_BLANK: "Fill",
  MATCHING: "Match",
  ORDERING: "Order",
  MULTI_SELECT: "Multi",
}

const BLOOM_LABELS: Record<string, string> = {
  REMEMBER: "Remember",
  UNDERSTAND: "Understand",
  APPLY: "Apply",
  ANALYZE: "Analyze",
  EVALUATE: "Evaluate",
  CREATE: "Create",
}

const SUBJECT_COLORS = [
  "#2563eb",
  "#16a34a",
  "#ea580c",
  "#9333ea",
  "#0891b2",
  "#dc2626",
  "#ca8a04",
  "#4f46e5",
]

export function StudentProgress({ isGuardian }: StudentProgressProps) {
  const [data, setData] = useState<ProgressData | null>(null)
  const [children, setChildren] = useState<{ id: string; name: string }[]>([])
  const [selectedChild, setSelectedChild] = useState<string>("")
  const [isPending, startTransition] = useTransition()

  // Load children for guardian
  useEffect(() => {
    if (isGuardian) {
      getGuardianChildren().then((kids) => {
        setChildren(kids)
        if (kids.length > 0) setSelectedChild(kids[0].id)
      })
    }
  }, [isGuardian])

  // Load progress data
  useEffect(() => {
    startTransition(async () => {
      const result = await getStudentProgress(
        isGuardian && selectedChild
          ? { childStudentId: selectedChild }
          : undefined
      )
      setData(result)
    })
  }, [isGuardian, selectedChild])

  if (isPending && !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!data || data.totalExams === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="text-muted-foreground mb-4 h-12 w-12" />
          <h3 className="mb-2 text-lg font-semibold">No Progress Data Yet</h3>
          <p className="text-muted-foreground text-sm">
            Take some exams to see your progress here.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Prepare line chart data - unified timeline across subjects
  const allDates = [
    ...new Set(
      data.subjectTrends.flatMap((s) => s.dataPoints.map((p) => p.date))
    ),
  ].sort()
  const lineChartData = allDates.map((date) => {
    const point: Record<string, string | number> = { date }
    for (const subject of data.subjectTrends) {
      const dp = subject.dataPoints.find((p) => p.date === date)
      if (dp) point[subject.subjectName] = dp.percentage
    }
    return point
  })

  // Prepare radar chart data for question types
  const radarData = data.questionTypePerformance.map((qt) => ({
    type: QUESTION_TYPE_LABELS[qt.type] || qt.type,
    percentage: qt.percentage,
    fullMark: 100,
  }))

  // Prepare bar chart data for Bloom levels
  const bloomData = data.bloomPerformance.map((bl) => ({
    level: BLOOM_LABELS[bl.level] || bl.level,
    percentage: bl.percentage,
    total: bl.total,
  }))

  return (
    <div className="space-y-6">
      {/* Guardian child selector */}
      {isGuardian && children.length > 1 && (
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Viewing progress for:</span>
          <Select value={selectedChild} onValueChange={setSelectedChild}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {children.map((child) => (
                <SelectItem key={child.id} value={child.id}>
                  {child.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Overall Average
            </CardTitle>
            <Award className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overallAverage}%</div>
            <p className="text-muted-foreground text-xs">
              Across {data.totalExams} exams
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exams Taken</CardTitle>
            <FileText className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalExams}</div>
            <p className="text-muted-foreground text-xs">
              {data.subjectTrends.length} subjects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Subject</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="truncate text-lg font-bold">
              {data.bestSubject || "N/A"}
            </div>
            <p className="text-muted-foreground text-xs">Highest average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Work</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="truncate text-lg font-bold">
              {data.weakestSubject || "N/A"}
            </div>
            <p className="text-muted-foreground text-xs">Lowest average</p>
          </CardContent>
        </Card>
      </div>

      {/* Subject trends line chart */}
      {data.subjectTrends.length > 0 && lineChartData.length > 1 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Subject Score Trends</CardTitle>
              <div className="flex flex-wrap gap-1.5">
                {data.subjectTrends.map((s) => (
                  <Badge
                    key={s.subjectId}
                    variant="outline"
                    className="text-xs"
                  >
                    {s.subjectName}: {s.average}%{s.trend === "up" && " ↑"}
                    {s.trend === "down" && " ↓"}
                  </Badge>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={lineChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => {
                    const d = new Date(v)
                    return `${d.getMonth() + 1}/${d.getDate()}`
                  }}
                />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                {data.subjectTrends.map((subject, i) => (
                  <Line
                    key={subject.subjectId}
                    type="monotone"
                    dataKey={subject.subjectName}
                    stroke={SUBJECT_COLORS[i % SUBJECT_COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Question type radar chart */}
        {radarData.length >= 3 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                <CardTitle className="text-base">
                  Question Type Performance
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="type" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar
                    dataKey="percentage"
                    stroke="#2563eb"
                    fill="#2563eb"
                    fillOpacity={0.3}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, "Score"]}
                  />
                </RadarChart>
              </ResponsiveContainer>
              {/* Fallback list for fewer than 3 types */}
            </CardContent>
          </Card>
        )}

        {/* Question type list (when < 3 types for radar) */}
        {radarData.length > 0 && radarData.length < 3 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                <CardTitle className="text-base">
                  Question Type Performance
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.questionTypePerformance.map((qt) => (
                <div
                  key={qt.type}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm">
                    {QUESTION_TYPE_LABELS[qt.type] || qt.type}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="bg-muted h-2 w-24 overflow-hidden rounded-full">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{ width: `${qt.percentage}%` }}
                      />
                    </div>
                    <span className="w-12 text-end text-sm font-medium">
                      {qt.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Bloom taxonomy bar chart */}
        {bloomData.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <CardTitle className="text-base">
                  Bloom&apos;s Taxonomy
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={bloomData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="level"
                    tick={{ fontSize: 11 }}
                    width={80}
                  />
                  <Tooltip
                    formatter={(value: number, _name: string, props: any) => [
                      `${value}% (${props.payload.total} questions)`,
                      "Score",
                    ]}
                  />
                  <Bar
                    dataKey="percentage"
                    fill="#16a34a"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* No marking data message */}
      {data.questionTypePerformance.length === 0 &&
        data.bloomPerformance.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground text-sm">
                Detailed question-level analytics will appear after your exams
                are graded.
              </p>
            </CardContent>
          </Card>
        )}
    </div>
  )
}
