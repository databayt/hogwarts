"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"

import type { CardSize } from "./types"

interface GoalCardProps {
  /**
   * Goal title
   */
  title: string
  /**
   * Current value
   */
  current: number
  /**
   * Target value
   */
  target: number
  /**
   * Unit (e.g., "%", "students", "exams")
   */
  unit?: string
  /**
   * Card size variant
   * @default "md"
   */
  size?: CardSize
  /**
   * Loading state
   */
  loading?: boolean
  /**
   * Click handler
   */
  onClick?: () => void
  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * GoalCard - Goal tracking with progress visualization
 *
 * Perfect for tracking completion, targets, or milestones.
 * Shows progress percentage and visual progress bar.
 *
 * @example
 * ```tsx
 * <GoalCard
 *   title="Student Enrollment Goal"
 *   current={4812}
 *   target={5000}
 *   unit="students"
 *   onClick={() => router.push('/enrollment')}
 * />
 * ```
 */
export function GoalCard({
  title,
  current,
  target,
  unit,
  size = "md",
  loading = false,
  onClick,
  className,
}: GoalCardProps) {
  const sizeClasses = {
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
    xl: "p-8",
  }

  const percentage = Math.round((current / target) * 100)
  const isComplete = current >= target

  const isInteractive = !!onClick

  return (
    <Card
      className={cn(
        "transition-colors",
        isInteractive && "hover:bg-accent/50 cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <CardContent className={cn(sizeClasses[size])}>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="mx-auto h-16 w-16 rounded-full" />
            <Skeleton className="mx-auto h-4 w-24" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Title */}
            <h5 className="text-center">{title}</h5>

            {/* Circular Progress Visual */}
            <div className="relative flex items-center justify-center">
              <svg className="h-32 w-32 -rotate-90">
                {/* Background circle */}
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-muted"
                />
                {/* Progress circle */}
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - percentage / 100)}`}
                  strokeLinecap="round"
                  className={cn(
                    "transition-all duration-500",
                    isComplete ? "text-chart-2" : "text-primary"
                  )}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <h3>{percentage}%</h3>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-1 text-center">
              <p>
                {current.toLocaleString()} / {target.toLocaleString()}
                {unit && ` ${unit}`}
              </p>
              {isComplete ? (
                <p className="muted">Goal completed! 🎉</p>
              ) : (
                <p className="muted">
                  {(target - current).toLocaleString()} to go
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
