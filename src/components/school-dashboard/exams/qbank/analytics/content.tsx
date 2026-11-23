"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Psychometric Analytics Dashboard
 *
 * Displays:
 * - Summary statistics
 * - Difficulty distribution chart
 * - Quality distribution chart
 * - Flagged questions needing attention
 * - Detailed question list with metrics
 */
import * as React from "react"
import { useEffect, useState } from "react"
import {
  AlertTriangle,
  BarChart3,
  CheckCircle,
  HelpCircle,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  XCircle,
} from "lucide-react"
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Tooltip as UITooltip,
} from "@/components/ui/tooltip"
import { useDictionaryFallback } from "@/components/internationalization/use-dictionary"

import { getQuestionTypeLabels } from "../config"
import { fmt, qbankT } from "../t"
import { getAnalyticsDashboard } from "./actions"
import {
  getDifficultyKey,
  getDiscriminationKey,
  getQualityColor,
} from "./psychometrics"

interface DashboardData {
  summary: {
    totalQuestions: number
    needsRetire: number
    needsRevise: number
    goodQuestions: number
    avgQualityScore: number
    avgDifficulty: number
    avgDiscrimination: number
  }
  difficultyDistribution: {
    veryEasy: number
    easy: number
    moderate: number
    difficult: number
    veryDifficult: number
  }
  qualityDistribution: {
    excellent: number
    good: number
    fair: number
    poor: number
  }
  flaggedQuestions: Array<{
    id: string
    questionText: string
    questionType: string
    subject: string
    qualityScore: number | null
    qualityFlags: string[]
    recommendedAction: string | null
    difficultyIndex: number
    discriminationIndex: number
  }>
  analytics: Array<{
    questionId: string
    questionText: string
    questionType: string
    subject: string
    difficultyIndex: number
    discriminationIndex: number
    qualityScore: number | null
    sampleSize: number
    recommendedAction: string | null
  }>
}

export function AnalyticsDashboard() {
  const qt = qbankT(useDictionaryFallback<any>())
  const t = qt.analytics
  const typeLabels = getQuestionTypeLabels(qt)
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    const result = await getAnalyticsDashboard()
    if (result.success && result.data) {
      setData(result.data as DashboardData)
    } else {
      setError(("error" in result && result.error) || (t?.loadFailed ?? ""))
    }
    setIsLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>{t?.error ?? ""}</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!data || data.summary.totalQuestions === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BarChart3 className="text-muted-foreground h-12 w-12" />
          <h3 className="mt-4 text-lg font-semibold">{t?.noDataTitle ?? ""}</h3>
          <p className="text-muted-foreground mt-2 text-center">
            {t?.noDataDescription ?? ""}
            <br />
            {t?.noDataHint ?? ""}
          </p>
        </CardContent>
      </Card>
    )
  }

  // Prepare chart data
  const difficultyChartData = [
    {
      name: t?.difficultyLevels?.veryEasy ?? "",
      value: data.difficultyDistribution.veryEasy,
      color: "#22c55e",
    },
    {
      name: t?.difficultyLevels?.easy ?? "",
      value: data.difficultyDistribution.easy,
      color: "#84cc16",
    },
    {
      name: t?.difficultyLevels?.moderate ?? "",
      value: data.difficultyDistribution.moderate,
      color: "#eab308",
    },
    {
      name: t?.difficultyLevels?.difficult ?? "",
      value: data.difficultyDistribution.difficult,
      color: "#f97316",
    },
    {
      name: t?.difficultyLevels?.veryDifficult ?? "",
      value: data.difficultyDistribution.veryDifficult,
      color: "#ef4444",
    },
  ].filter((d) => d.value > 0)

  const qualityChartData = [
    {
      name: t?.qualityLevels?.excellent ?? "",
      value: data.qualityDistribution.excellent,
      color: "#22c55e",
    },
    {
      name: t?.qualityLevels?.good ?? "",
      value: data.qualityDistribution.good,
      color: "#84cc16",
    },
    {
      name: t?.qualityLevels?.fair ?? "",
      value: data.qualityDistribution.fair,
      color: "#eab308",
    },
    {
      name: t?.qualityLevels?.poor ?? "",
      value: data.qualityDistribution.poor,
      color: "#ef4444",
    },
  ].filter((d) => d.value > 0)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t?.totalQuestions ?? ""}
            </CardTitle>
            <BarChart3 className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.summary.totalQuestions}
            </div>
            <p className="text-muted-foreground text-xs">
              {t?.withSufficientData ?? ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t?.goodQuality ?? ""}
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.summary.goodQuestions}
            </div>
            <p className="text-muted-foreground text-xs">
              {fmt(t?.percentOfQuestions, {
                percent: Math.round(
                  (data.summary.goodQuestions / data.summary.totalQuestions) *
                    100
                ),
              })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t?.needsRevision ?? ""}
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.needsRevise}</div>
            <p className="text-muted-foreground text-xs">
              {t?.considerUpdating ?? ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t?.shouldRetire ?? ""}
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.needsRetire}</div>
            <p className="text-muted-foreground text-xs">
              {t?.removeOrReplace ?? ""}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Average Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {t?.avgQuality ?? ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">
                {Math.round(data.summary.avgQualityScore)}
              </div>
              <span className="text-muted-foreground">/100</span>
            </div>
            <Progress value={data.summary.avgQualityScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              {t?.avgDifficulty ?? ""}
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger>
                    <HelpCircle className="text-muted-foreground h-4 w-4" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t?.difficultyDescription ?? ""}</p>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(data.summary.avgDifficulty * 100).toFixed(1)}%
            </div>
            <p className="text-muted-foreground mt-1 text-sm">
              {t?.difficultyLevels?.[
                getDifficultyKey(data.summary.avgDifficulty)
              ] ?? ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              {t?.avgDiscrimination ?? ""}
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger>
                    <HelpCircle className="text-muted-foreground h-4 w-4" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t?.discriminationDescription ?? ""}</p>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.summary.avgDiscrimination.toFixed(2)}
            </div>
            <p className="text-muted-foreground mt-1 text-sm">
              {t?.qualityLevels?.[
                getDiscriminationKey(data.summary.avgDiscrimination)
              ] ?? ""}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t?.difficultyDistribution ?? ""}</CardTitle>
            <CardDescription>
              {t?.difficultyDistributionDesc ?? ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={difficultyChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {difficultyChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t?.qualityDistribution ?? ""}</CardTitle>
            <CardDescription>
              {t?.qualityDistributionDesc ?? ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={qualityChartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {qualityChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Flagged Questions */}
      {data.flaggedQuestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              {t?.flaggedTitle ?? ""}
            </CardTitle>
            <CardDescription>{t?.flaggedDescription ?? ""}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t?.headers?.question ?? ""}</TableHead>
                  <TableHead>{t?.headers?.subject ?? ""}</TableHead>
                  <TableHead>{t?.headers?.type ?? ""}</TableHead>
                  <TableHead>{t?.headers?.quality ?? ""}</TableHead>
                  <TableHead>{t?.headers?.difficulty ?? ""}</TableHead>
                  <TableHead>{t?.headers?.issues ?? ""}</TableHead>
                  <TableHead>{t?.headers?.action ?? ""}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.flaggedQuestions.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell className="max-w-[200px] truncate">
                      {q.questionText}...
                    </TableCell>
                    <TableCell>{q.subject}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {typeLabels[q.questionType] || q.questionType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          getQualityColor(q.qualityScore || 0) === "green"
                            ? "default"
                            : getQualityColor(q.qualityScore || 0) === "yellow"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {q.qualityScore || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {(q.difficultyIndex * 100).toFixed(0)}%
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {q.qualityFlags.map((flag) => (
                          <Badge
                            key={flag}
                            variant="outline"
                            className="text-xs"
                          >
                            {t?.flags?.[flag] ?? flag.replace(/_/g, " ")}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          q.recommendedAction === "keep"
                            ? "default"
                            : q.recommendedAction === "revise"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {(q.recommendedAction &&
                          t?.actions?.[q.recommendedAction]) ||
                          q.recommendedAction}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          className="max-md:min-h-11 max-md:w-full"
          onClick={loadData}
          disabled={isLoading}
        >
          <RefreshCw
            className={cn("me-2 h-4 w-4", isLoading && "animate-spin")}
          />
          {t?.refresh ?? ""}
        </Button>
      </div>
    </div>
  )
}
