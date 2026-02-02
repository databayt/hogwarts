"use client"

/**
 * Question Navigation Component
 *
 * Sidebar showing question grid with:
 * - Current question highlight
 * - Answered/unanswered indicators
 * - Flagged questions (for review)
 * - Click to navigate
 * - Progress summary
 */
import * as React from "react"
import { useMemo } from "react"
import { CheckCircle2, Circle, Flag } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

interface QuestionNavProps {
  /** Total number of questions */
  totalQuestions: number
  /** Current question index (0-based) */
  currentIndex: number
  /** Set of answered question indices */
  answeredIndices: Set<number>
  /** Set of flagged question indices */
  flaggedIndices?: Set<number>
  /** Callback when question is selected */
  onSelect: (index: number) => void
  /** Callback when flag is toggled */
  onToggleFlag?: (index: number) => void
  /** Additional class name */
  className?: string
}

export function QuestionNav({
  totalQuestions,
  currentIndex,
  answeredIndices,
  flaggedIndices = new Set(),
  onSelect,
  onToggleFlag,
  className,
}: QuestionNavProps) {
  const progress = useMemo(() => {
    return (answeredIndices.size / totalQuestions) * 100
  }, [answeredIndices.size, totalQuestions])

  return (
    <Card className={cn("sticky top-32", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Questions</CardTitle>
        <CardDescription className="text-xs">
          {answeredIndices.size} of {totalQuestions} answered
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Progress bar */}
        <div className="mb-4">
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question grid */}
        <ScrollArea className="h-[calc(100vh-400px)]">
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: totalQuestions }, (_, idx) => {
              const isCurrent = idx === currentIndex
              const isAnswered = answeredIndices.has(idx)
              const isFlagged = flaggedIndices.has(idx)

              return (
                <Button
                  key={idx}
                  variant={
                    isCurrent ? "default" : isAnswered ? "secondary" : "outline"
                  }
                  size="sm"
                  className={cn(
                    "relative h-10 w-10 p-0 text-sm",
                    isAnswered &&
                      !isCurrent &&
                      "bg-green-100 hover:bg-green-200 dark:bg-green-900/50 dark:hover:bg-green-900",
                    isFlagged && "ring-2 ring-yellow-500 ring-offset-1"
                  )}
                  onClick={() => onSelect(idx)}
                >
                  {idx + 1}
                  {isFlagged && (
                    <Flag className="absolute -top-1 -right-1 h-3 w-3 fill-yellow-500 text-yellow-500" />
                  )}
                </Button>
              )
            })}
          </div>
        </ScrollArea>

        <Separator className="my-4" />

        {/* Legend */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="bg-primary h-4 w-4 rounded" />
            <span>Current</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-green-100 dark:bg-green-900/50" />
            <span>Answered</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded border" />
            <span>Not answered</span>
          </div>
          {flaggedIndices.size > 0 && (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded border ring-2 ring-yellow-500" />
              <span>Flagged for review</span>
            </div>
          )}
        </div>

        {/* Quick stats */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs">
          <div className="bg-muted rounded p-2">
            <div className="text-lg font-semibold text-green-600 dark:text-green-400">
              {answeredIndices.size}
            </div>
            <div className="text-muted-foreground">Answered</div>
          </div>
          <div className="bg-muted rounded p-2">
            <div className="text-lg font-semibold text-orange-600 dark:text-orange-400">
              {totalQuestions - answeredIndices.size}
            </div>
            <div className="text-muted-foreground">Remaining</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Compact horizontal question navigation for mobile
 */
export function MobileQuestionNav({
  totalQuestions,
  currentIndex,
  answeredIndices,
  onSelect,
  className,
}: Omit<QuestionNavProps, "flaggedIndices" | "onToggleFlag">) {
  return (
    <div className={cn("overflow-x-auto pb-2", className)}>
      <div className="flex gap-2">
        {Array.from({ length: totalQuestions }, (_, idx) => {
          const isCurrent = idx === currentIndex
          const isAnswered = answeredIndices.has(idx)

          return (
            <button
              key={idx}
              className={cn(
                "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors",
                isCurrent && "bg-primary text-primary-foreground",
                !isCurrent &&
                  isAnswered &&
                  "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200",
                !isCurrent && !isAnswered && "bg-muted text-muted-foreground"
              )}
              onClick={() => onSelect(idx)}
            >
              {idx + 1}
            </button>
          )
        })}
      </div>
    </div>
  )
}
