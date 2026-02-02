/**
 * Retake Manager Component
 *
 * UI component for managing exam retakes:
 * - View retake history
 * - Configure retake limits
 * - Apply retake penalties
 * - Track attempt numbers
 */

"use client"

import * as React from "react"
import {
  AlertCircle,
  CheckCircle,
  Clock,
  History,
  RefreshCcw,
  TrendingUp,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { applyRetakePenalty } from "./cgpa-calculator"
import { percentageToLetter } from "./grade-converter"

// Exam attempt data
interface ExamAttempt {
  id: string
  attemptNumber: number
  date: Date
  rawScore: number
  adjustedScore: number
  penalty: number
  status: "completed" | "in_progress" | "pending"
}

// Retake configuration
interface RetakeConfig {
  maxRetakes: number
  penaltyPercent: number
  policy: "best" | "latest" | "average"
}

interface RetakeManagerProps {
  examId: string
  examTitle: string
  studentId: string
  attempts: ExamAttempt[]
  config: RetakeConfig
  dictionary?: {
    retake?: {
      title?: string
      description?: string
      attempts?: string
      remaining?: string
      bestScore?: string
      latestScore?: string
      averageScore?: string
      history?: string
      noAttempts?: string
      maxReached?: string
      penalty?: string
      rawScore?: string
      adjustedScore?: string
      date?: string
      status?: string
    }
  }
}

export function RetakeManager({
  examTitle,
  attempts,
  config,
  dictionary,
}: RetakeManagerProps) {
  const d = dictionary?.retake

  // Calculate stats
  const completedAttempts = attempts.filter((a) => a.status === "completed")
  const remainingRetakes = Math.max(
    0,
    config.maxRetakes - completedAttempts.length + 1
  )
  const hasReachedMax = completedAttempts.length > config.maxRetakes

  // Calculate final score based on policy
  const calculateFinalScore = React.useCallback(() => {
    if (completedAttempts.length === 0) return 0

    const scores = completedAttempts.map((a) => a.adjustedScore)

    switch (config.policy) {
      case "best":
        return Math.max(...scores)
      case "latest":
        return scores[scores.length - 1]
      case "average":
        return scores.reduce((sum, s) => sum + s, 0) / scores.length
      default:
        return scores[0]
    }
  }, [completedAttempts, config.policy])

  const finalScore = calculateFinalScore()
  const letterGrade = percentageToLetter(finalScore)

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCcw className="h-5 w-5" />
            {d?.title ?? "Retake Management"}
          </CardTitle>
          <CardDescription>
            {d?.description ?? `Manage retakes for ${examTitle}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Attempts Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {d?.attempts ?? "Attempts"}
                </span>
                <span className="font-medium">
                  {completedAttempts.length} / {config.maxRetakes + 1}
                </span>
              </div>
              <Progress
                value={
                  (completedAttempts.length / (config.maxRetakes + 1)) * 100
                }
                className="h-2"
              />
              <p className="text-muted-foreground text-xs">
                {hasReachedMax
                  ? (d?.maxReached ?? "Maximum attempts reached")
                  : `${remainingRetakes} ${d?.remaining ?? "retakes remaining"}`}
              </p>
            </div>

            {/* Final Score */}
            <div className="space-y-2">
              <div className="text-muted-foreground text-sm">
                {config.policy === "best"
                  ? (d?.bestScore ?? "Best Score")
                  : config.policy === "latest"
                    ? (d?.latestScore ?? "Latest Score")
                    : (d?.averageScore ?? "Average Score")}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">
                  {finalScore.toFixed(1)}%
                </span>
                <Badge variant={finalScore >= 60 ? "default" : "destructive"}>
                  {letterGrade}
                </Badge>
              </div>
            </div>

            {/* Policy Info */}
            <div className="space-y-2">
              <div className="text-muted-foreground text-sm">
                {d?.penalty ?? "Retake Penalty"}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">
                  {config.penaltyPercent}%
                </span>
                <span className="text-muted-foreground text-sm">
                  per retake
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Max Reached Alert */}
      {hasReachedMax && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Maximum Retakes Reached</AlertTitle>
          <AlertDescription>
            You have used all available retake attempts for this exam. Your
            final score will be calculated based on the &ldquo;{config.policy}
            &rdquo; policy.
          </AlertDescription>
        </Alert>
      )}

      {/* Attempt History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            {d?.history ?? "Attempt History"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {attempts.length === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center justify-center py-8">
              <Clock className="mb-2 h-8 w-8" />
              <p>{d?.noAttempts ?? "No attempts yet"}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>{d?.date ?? "Date"}</TableHead>
                  <TableHead>{d?.rawScore ?? "Raw Score"}</TableHead>
                  <TableHead>{d?.penalty ?? "Penalty"}</TableHead>
                  <TableHead>{d?.adjustedScore ?? "Adjusted Score"}</TableHead>
                  <TableHead>{d?.status ?? "Status"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attempts.map((attempt) => (
                  <TableRow key={attempt.id}>
                    <TableCell className="font-medium">
                      {attempt.attemptNumber}
                    </TableCell>
                    <TableCell>{attempt.date.toLocaleDateString()}</TableCell>
                    <TableCell>{attempt.rawScore.toFixed(1)}%</TableCell>
                    <TableCell>
                      {attempt.penalty > 0 ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge
                                variant="outline"
                                className="text-orange-500"
                              >
                                -{attempt.penalty}%
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              {config.penaltyPercent}% penalty ×{" "}
                              {attempt.attemptNumber - 1} retakes
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <Badge variant="outline" className="text-green-500">
                          None
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {attempt.adjustedScore.toFixed(1)}%
                        </span>
                        <Badge variant="secondary">
                          {percentageToLetter(attempt.adjustedScore)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={attempt.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Score Improvement Trend */}
      {completedAttempts.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Score Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScoreTrendChart attempts={completedAttempts} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Status badge component
function StatusBadge({ status }: { status: ExamAttempt["status"] }) {
  switch (status) {
    case "completed":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          <CheckCircle className="mr-1 h-3 w-3" />
          Completed
        </Badge>
      )
    case "in_progress":
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
          <Clock className="mr-1 h-3 w-3" />
          In Progress
        </Badge>
      )
    case "pending":
      return (
        <Badge variant="outline">
          <Clock className="mr-1 h-3 w-3" />
          Pending
        </Badge>
      )
    default:
      return null
  }
}

// Simple score trend visualization
function ScoreTrendChart({ attempts }: { attempts: ExamAttempt[] }) {
  const maxScore = Math.max(...attempts.map((a) => a.adjustedScore))
  const minScore = Math.min(...attempts.map((a) => a.adjustedScore))
  const range = maxScore - minScore || 1

  const firstScore = attempts[0]?.adjustedScore ?? 0
  const lastScore = attempts[attempts.length - 1]?.adjustedScore ?? 0
  const improvement = lastScore - firstScore

  return (
    <div className="space-y-4">
      {/* Simple bar chart */}
      <div className="flex h-32 items-end gap-2">
        {attempts.map((attempt, index) => {
          const height =
            ((attempt.adjustedScore - minScore + 10) / (range + 20)) * 100
          return (
            <TooltipProvider key={attempt.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className="bg-primary flex-1 rounded-t transition-all hover:opacity-80"
                    style={{ height: `${height}%` }}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    Attempt {index + 1}: {attempt.adjustedScore.toFixed(1)}%
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        })}
      </div>

      {/* Improvement summary */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          First attempt: {firstScore.toFixed(1)}%
        </span>
        <span
          className={
            improvement >= 0
              ? "font-medium text-green-600"
              : "font-medium text-red-600"
          }
        >
          {improvement >= 0 ? "+" : ""}
          {improvement.toFixed(1)}%
        </span>
        <span className="text-muted-foreground">
          Latest: {lastScore.toFixed(1)}%
        </span>
      </div>
    </div>
  )
}

/**
 * Calculate exam attempts with penalties applied
 */
export function calculateAttempts(
  rawAttempts: Array<{
    id: string
    attemptNumber: number
    date: Date
    score: number
    status: "completed" | "in_progress" | "pending"
  }>,
  penaltyPercent: number
): ExamAttempt[] {
  return rawAttempts.map((attempt) => {
    const adjustedScore = applyRetakePenalty(
      attempt.score,
      attempt.attemptNumber,
      penaltyPercent
    )

    return {
      id: attempt.id,
      attemptNumber: attempt.attemptNumber,
      date: attempt.date,
      rawScore: attempt.score,
      adjustedScore,
      penalty: attempt.score - adjustedScore,
      status: attempt.status,
    }
  })
}
