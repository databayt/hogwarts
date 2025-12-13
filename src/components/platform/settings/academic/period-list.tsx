"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Pencil, Trash2, Clock } from "lucide-react"
import { useAcademicDictionary } from "@/hooks/use-academic-dictionary"
import type { Period } from "./types"
import type { Dictionary } from "@/components/internationalization/dictionaries"

interface PeriodListProps {
  periods: Period[]
  selectedYearId: string | null
  onEditPeriod: (period: Period) => void
  onDeletePeriod: (periodId: string) => void
  dictionary?: Dictionary
  isLoading?: boolean
}

export function PeriodList({
  periods,
  selectedYearId,
  onEditPeriod,
  onDeletePeriod,
  dictionary,
  isLoading = false,
}: PeriodListProps) {
  const dict = useAcademicDictionary(dictionary)

  // Format time from Date to HH:MM string
  const formatTime = (time: Date | string) => {
    if (typeof time === "string") return time
    const date = new Date(time)
    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  }

  // Calculate duration in minutes
  const getDuration = (start: Date | string, end: Date | string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const diffMs = endDate.getTime() - startDate.getTime()
    return Math.round(diffMs / (1000 * 60))
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-2" role="status" aria-label="Loading periods">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-lg border border-border p-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-36" />
              </div>
            </div>
          </div>
        ))}
        <span className="sr-only">Loading periods...</span>
      </div>
    )
  }

  if (!selectedYearId) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-3 mb-4">
          <Clock className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        </div>
        <p className="text-muted-foreground text-sm">
          {dict.selectYearFirst || "Select an academic year first"}
        </p>
      </div>
    )
  }

  if (periods.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-3 mb-4">
          <Clock className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        </div>
        <p className="text-muted-foreground text-sm">
          {dict.noPeriods || "No periods configured"}
        </p>
        <p className="text-muted-foreground text-xs mt-1">
          {dict.addPeriodHint || "Add daily class periods"}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {periods.map((period, index) => (
        <div
          key={period.id}
          className={cn(
            "group relative rounded-lg border p-3 transition-all",
            "hover:border-primary/50 hover:bg-accent/50",
            "border-border bg-card"
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              {/* Period number indicator */}
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-medium">
                {index + 1}
              </div>

              <div className="space-y-0.5">
                <h4 className="font-medium text-sm">{period.name}</h4>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatTime(period.startTime)}</span>
                  <span>-</span>
                  <span>{formatTime(period.endTime)}</span>
                  <span className="text-muted-foreground/60">
                    ({getDuration(period.startTime, period.endTime)} {dict.minutes || "min"})
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onEditPeriod(period)}
                aria-label={`${dict.edit || "Edit"} ${period.name}`}
                title={`${dict.edit || "Edit"} ${period.name}`}
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => onDeletePeriod(period.id)}
                aria-label={`${dict.delete || "Delete"} ${period.name}`}
                title={`${dict.delete || "Delete"} ${period.name}`}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
