"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"

import type { CardSize } from "./types"

interface Task {
  /**
   * Task ID
   */
  id: string
  /**
   * Task title
   */
  title: string
  /**
   * Task description
   */
  description?: string
  /**
   * Completed state
   */
  completed: boolean
  /**
   * Due date
   */
  dueDate?: string
  /**
   * Priority level
   */
  priority?: "low" | "medium" | "high"
  /**
   * Optional badge
   */
  badge?: React.ReactNode
}

interface TaskListCardProps {
  /**
   * Card title
   */
  title?: string
  /**
   * Card description
   */
  description?: string
  /**
   * List of tasks
   */
  tasks: Task[]
  /**
   * Task toggle handler
   */
  onToggle?: (taskId: string) => void
  /**
   * Maximum items to display
   * @default 5
   */
  maxItems?: number
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
   * Action button in header
   */
  action?: React.ReactNode
  /**
   * Empty state message
   */
  emptyMessage?: string
  /**
   * Show progress bar
   * @default true
   */
  showProgress?: boolean
  /**
   * Additional CSS classes
   */
  className?: string
}

const priorityColors = {
  low: "text-muted-foreground",
  medium: "text-chart-3",
  high: "text-destructive",
}

/**
 * TaskListCard - Checklist with progress tracking
 *
 * Perfect for todo lists, task management, or checklist displays.
 * Shows checkboxes, task titles, optional descriptions, and overall progress.
 *
 * @example
 * ```tsx
 * <TaskListCard
 *   title="Today's Tasks"
 *   description="5 of 8 completed"
 *   tasks={[
 *     {
 *       id: "1",
 *       title: "Review exam papers",
 *       description: "Grade Math exam for Class 10A",
 *       completed: false,
 *       dueDate: "Today",
 *       priority: "high"
 *     },
 *     {
 *       id: "2",
 *       title: "Prepare lesson plan",
 *       completed: true,
 *       priority: "medium"
 *     }
 *   ]}
 *   onToggle={(id) => handleToggleTask(id)}
 *   showProgress={true}
 *   action={<Button variant="ghost" size="sm">View All</Button>}
 * />
 * ```
 */
export function TaskListCard({
  title = "Tasks",
  description,
  tasks,
  onToggle,
  maxItems = 5,
  size = "md",
  loading = false,
  action,
  emptyMessage = "No tasks",
  showProgress = true,
  className,
}: TaskListCardProps) {
  const sizeClasses = {
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
    xl: "p-8",
  }

  const displayedTasks = tasks.slice(0, maxItems)
  const isEmpty = !loading && tasks.length === 0

  // Calculate completion percentage
  const completedCount = tasks.filter((t) => t.completed).length
  const totalCount = tasks.length
  const completionPercentage =
    totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <Card className={cn("transition-colors", className)}>
      <CardHeader className={cn(sizeClasses[size], "pb-3")}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-1">
            {loading ? (
              <>
                <Skeleton className="h-5 w-32" />
                {description && <Skeleton className="h-4 w-40" />}
              </>
            ) : (
              <>
                <CardTitle>{title}</CardTitle>
                {description && (
                  <CardDescription>{description}</CardDescription>
                )}
                {!description && showProgress && totalCount > 0 && (
                  <CardDescription>
                    {completedCount} of {totalCount} completed
                  </CardDescription>
                )}
              </>
            )}
          </div>
          {action && !loading && action}
        </div>
        {showProgress && !loading && totalCount > 0 && (
          <Progress
            value={completionPercentage}
            className="mt-3 h-2"
            aria-label={`Task completion: ${Math.round(completionPercentage)}%`}
          />
        )}
      </CardHeader>
      <CardContent className={cn(sizeClasses[size], "pt-0")}>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-5 w-5 shrink-0 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : isEmpty ? (
          <div className="flex items-center justify-center py-8">
            <p className="muted text-center">{emptyMessage}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedTasks.map((task) => (
              <div
                key={task.id}
                className="group hover:bg-accent/50 flex items-start gap-3 rounded-lg p-2 transition-colors"
              >
                <Checkbox
                  id={task.id}
                  checked={task.completed}
                  onCheckedChange={() => onToggle?.(task.id)}
                  className="mt-0.5"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <label
                    htmlFor={task.id}
                    className={cn(
                      "text-foreground cursor-pointer leading-none font-medium",
                      task.completed && "text-muted-foreground line-through"
                    )}
                  >
                    {task.title}
                  </label>
                  {task.description && (
                    <p
                      className={cn(
                        "muted line-clamp-2",
                        task.completed && "line-through"
                      )}
                    >
                      {task.description}
                    </p>
                  )}
                  {(task.dueDate || task.priority) && (
                    <div className="flex items-center gap-2 text-xs">
                      {task.dueDate && (
                        <span className="muted">{task.dueDate}</span>
                      )}
                      {task.priority && (
                        <span
                          className={cn(
                            "font-medium",
                            priorityColors[task.priority]
                          )}
                        >
                          {task.priority.charAt(0).toUpperCase() +
                            task.priority.slice(1)}{" "}
                          priority
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {task.badge}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
