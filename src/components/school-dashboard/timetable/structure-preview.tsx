"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { cn } from "@/lib/utils"

import { formatWorkingDays } from "./structures"
import type { StructurePeriod, TimetableStructure } from "./structures"

interface StructurePreviewProps {
  structure: TimetableStructure
  badge?: "best-match" | "custom" | null
  periodsOverride?: StructurePeriod[]
  schoolStartOverride?: string
  schoolEndOverride?: string
  periodsPerDayOverride?: number
  dictionary?: any
  lang?: string
  /** `card` (default) draws its own tinted frame; `plain` sits inside a parent surface. */
  variant?: "card" | "plain"
  className?: string
}

const TYPE_COLORS: Record<string, string> = {
  class: "bg-primary/10 border-primary/25 text-foreground",
  break:
    "bg-amber-100 border-amber-300 dark:bg-amber-900/30 dark:border-amber-700",
  lunch:
    "bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-700",
}

/**
 * Shared schedule-structure preview. Used by the onboarding schedule step, the
 * school configuration schedule page and the timetable Settings schedule
 * configurator so the three surfaces share one visual vocabulary.
 */
export function StructurePreview({
  structure,
  badge,
  periodsOverride,
  schoolStartOverride,
  schoolEndOverride,
  periodsPerDayOverride,
  dictionary,
  lang = "en",
  variant = "card",
  className,
}: StructurePreviewProps) {
  const dict = dictionary || {}
  const periods = periodsOverride ?? structure.periods
  const schoolStart = schoolStartOverride ?? structure.schoolStart
  const schoolEnd = schoolEndOverride ?? structure.schoolEnd
  const periodsPerDay = periodsPerDayOverride ?? structure.periodsPerDay
  const isAr = lang === "ar"
  const name = isAr ? structure.name : (structure.nameEn ?? structure.name)
  const description = isAr
    ? structure.description
    : (structure.descriptionEn ?? structure.description)
  const totalMinutes = periods.reduce((sum, p) => sum + p.durationMinutes, 0)

  const typeLabel: Record<string, string> = {
    class: dict.period || "Period",
    break: dict.break || "Break",
    lunch: dict.lunch || "Lunch",
  }
  const hasLunch = periods.some((p) => p.type === "lunch")
  const hasBreak = periods.some((p) => p.type === "break")

  let classNumber = 0

  const stats = [
    {
      label: dict.periodsLabel || dict.periodsDay || "Periods/day",
      value: periodsPerDay,
    },
    {
      label: dict.hoursLabel || "School day",
      value: `${schoolStart} – ${schoolEnd}`,
    },
    {
      label: dict.daysLabel || "Days",
      value: formatWorkingDays(structure.workingDays, lang),
    },
  ]

  return (
    <div
      className={cn(
        "w-full space-y-4",
        variant === "card" &&
          "border-primary bg-primary/5 rounded-lg border p-4",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="font-semibold">{name}</h4>
          {description ? (
            <p className="text-muted-foreground text-sm">{description}</p>
          ) : null}
        </div>
        {badge === "best-match" && (
          <span className="bg-primary/10 text-primary shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium">
            {dict.bestMatch || "Best Match"}
          </span>
        )}
        {badge === "custom" && (
          <span className="bg-muted text-muted-foreground shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium">
            {dict.customSchedule || "Custom"}
          </span>
        )}
      </div>

      <dl className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="min-w-0">
            <dt className="text-muted-foreground truncate text-xs">
              {s.label}
            </dt>
            <dd className="truncate text-sm font-medium tabular-nums">
              {s.value}
            </dd>
          </div>
        ))}
      </dl>

      {/* The day reads left to right (period 1 first) in both languages. */}
      <div dir="ltr" className="flex gap-0.5">
        {periods.map((period, i) => {
          const isClass = period.type === "class"
          if (isClass) classNumber++
          const widthPercent = (period.durationMinutes / totalMinutes) * 100
          const label = isClass
            ? `${typeLabel.class} ${classNumber}`
            : typeLabel[period.type] || typeLabel.class
          return (
            <div
              key={i}
              className={cn(
                "flex h-8 items-center justify-center rounded-md border text-[11px] font-medium tabular-nums",
                TYPE_COLORS[period.type] || TYPE_COLORS.class
              )}
              style={{
                width: `${widthPercent}%`,
                minWidth: isClass ? "24px" : "12px",
              }}
              title={`${label} (${period.startTime} – ${period.endTime})`}
              aria-label={`${label} ${period.startTime} – ${period.endTime}`}
            >
              {isClass && (
                <span className="truncate px-0.5">{classNumber}</span>
              )}
            </div>
          )
        })}
      </div>

      <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
        <LegendItem className={TYPE_COLORS.class} label={typeLabel.class} />
        {hasBreak && (
          <LegendItem className={TYPE_COLORS.break} label={typeLabel.break} />
        )}
        {hasLunch && (
          <LegendItem className={TYPE_COLORS.lunch} label={typeLabel.lunch} />
        )}
      </div>
    </div>
  )
}

function LegendItem({
  className,
  label,
}: {
  className: string
  label: string
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("size-2.5 rounded-sm border", className)} />
      {label}
    </span>
  )
}
