"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Shared attempt history component for Quiz and Mock pages
// Shows student's past attempts with scores, dates, and trends
import { Clock, Medal, TrendingUp } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export interface AttemptItem {
  id: string
  examTitle: string
  subjectName: string | null
  attemptNumber: number
  score: number
  totalMarks: number
  percentage: number
  grade: string | null
  startedAt: string | null
  submittedAt: string | null
  isBest: boolean
}

interface AttemptHistoryProps {
  attempts: AttemptItem[]
  title?: string
}

export function AttemptHistory({
  attempts,
  title = "My Attempts",
}: AttemptHistoryProps) {
  if (attempts.length === 0) return null

  const bestScore = Math.max(...attempts.map((a) => a.percentage))
  const avgScore =
    attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length
  const improving =
    attempts.length >= 2 &&
    attempts[0].percentage > attempts[attempts.length - 1].percentage

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {attempts.length} attempt{attempts.length !== 1 ? "s" : ""}
            </Badge>
            {improving && (
              <Badge
                variant="outline"
                className="border-emerald-300 text-xs text-emerald-600"
              >
                <TrendingUp className="me-1 h-3 w-3" />
                Improving
              </Badge>
            )}
          </div>
        </div>
        {/* Summary stats */}
        <div className="mt-2 grid grid-cols-3 gap-3">
          <div className="bg-muted/50 rounded-md p-2 text-center">
            <p className="text-muted-foreground text-xs">Best</p>
            <p className="text-sm font-bold">{Math.round(bestScore)}%</p>
          </div>
          <div className="bg-muted/50 rounded-md p-2 text-center">
            <p className="text-muted-foreground text-xs">Average</p>
            <p className="text-sm font-bold">{Math.round(avgScore)}%</p>
          </div>
          <div className="bg-muted/50 rounded-md p-2 text-center">
            <p className="text-muted-foreground text-xs">Attempts</p>
            <p className="text-sm font-bold">{attempts.length}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {attempts.map((attempt) => (
          <div
            key={attempt.id}
            className={`flex items-center justify-between rounded-md border p-3 ${
              attempt.isBest
                ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20"
                : ""
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium">
                  {attempt.examTitle}
                </p>
                {attempt.isBest && (
                  <Medal className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                )}
              </div>
              <div className="text-muted-foreground mt-0.5 flex items-center gap-2 text-xs">
                {attempt.subjectName && <span>{attempt.subjectName}</span>}
                <span>Attempt #{attempt.attemptNumber}</span>
                {attempt.submittedAt && (
                  <span className="flex items-center gap-0.5">
                    <Clock className="h-3 w-3" />
                    {new Date(attempt.submittedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            <div className="ms-3 text-end">
              <p
                className={`text-sm font-bold ${
                  attempt.percentage >= 70
                    ? "text-emerald-600"
                    : attempt.percentage >= 50
                      ? "text-yellow-600"
                      : "text-red-600"
                }`}
              >
                {Math.round(attempt.percentage)}%
              </p>
              <p className="text-muted-foreground text-xs">
                {attempt.score}/{attempt.totalMarks}
              </p>
              {attempt.grade && (
                <Badge variant="outline" className="mt-0.5 text-xs">
                  {attempt.grade}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
