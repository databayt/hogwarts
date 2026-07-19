"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { BookOpen, CheckCircle2, Clock } from "lucide-react"

import { Progress } from "@/components/ui/progress"
import type { CourseProgressData } from "@/components/stream/data/catalog/get-course-progress"

interface Props {
  progress: CourseProgressData
  // The `stream` dictionary subtree (same convention as sibling components).
  dictionary?: Record<string, any>
}

export function CourseProgressBar({ progress, dictionary }: Props) {
  const {
    totalLessons,
    completedLessons,
    progressPercent,
    estimatedRemainingMinutes,
  } = progress
  const d = dictionary?.courseProgress ?? {}

  const remainingDisplay =
    estimatedRemainingMinutes >= 60
      ? `${Math.floor(estimatedRemainingMinutes / 60)}h ${estimatedRemainingMinutes % 60}m`
      : `${estimatedRemainingMinutes}m`

  const percentLabel = (d.percentComplete ?? "{percent}% complete").replace(
    "{percent}",
    String(progressPercent)
  )

  return (
    <div
      className="rounded-lg border p-4"
      style={{ backgroundColor: "#f0eee6" }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium" style={{ color: "#141413" }}>
          {percentLabel}
        </span>
        <span className="text-xs" style={{ color: "#5e5b4e" }}>
          {completedLessons}/{totalLessons} {d.lessons ?? "lessons"}
        </span>
      </div>
      <Progress value={progressPercent} className="mb-3 h-2" />
      <div className="flex gap-4 text-xs" style={{ color: "#5e5b4e" }}>
        <span className="flex items-center gap-1">
          <CheckCircle2 className="size-3.5" />
          {completedLessons} {d.done ?? "done"}
        </span>
        <span className="flex items-center gap-1">
          <BookOpen className="size-3.5" />
          {totalLessons - completedLessons} {d.remaining ?? "remaining"}
        </span>
        {estimatedRemainingMinutes > 0 && (
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" />~{remainingDisplay} {d.left ?? "left"}
          </span>
        )}
      </div>
    </div>
  )
}
