"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { cn } from "@/lib/utils"
import type {
  StructurePeriod,
  TimetableStructure,
} from "@/components/school-dashboard/timetable/structures"
import { formatWorkingDays } from "@/components/school-dashboard/timetable/structures"

interface StructurePreviewProps {
  structure: TimetableStructure
  badge?: "best-match" | "custom" | null
  periodsOverride?: StructurePeriod[]
  schoolStartOverride?: string
  schoolEndOverride?: string
  periodsPerDayOverride?: number
  dictionary?: any
  lang?: string
}

const TYPE_COLORS: Record<string, string> = {
  class: "bg-primary/15 border-primary/30",
  break:
    "bg-amber-100 border-amber-300 dark:bg-amber-900/30 dark:border-amber-700",
  lunch:
    "bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-700",
}

export function StructurePreview({
  structure,
  badge,
  periodsOverride,
  schoolStartOverride,
  schoolEndOverride,
  periodsPerDayOverride,
  dictionary,
  lang = "en",
}: StructurePreviewProps) {
  const dict = dictionary || {}
  const periods = periodsOverride ?? structure.periods
  const schoolStart = schoolStartOverride ?? structure.schoolStart
  const schoolEnd = schoolEndOverride ?? structure.schoolEnd
  const periodsPerDay = periodsPerDayOverride ?? structure.periodsPerDay
  const name = lang === "ar" ? structure.name : structure.nameEn
  const description =
    lang === "ar" ? structure.description : structure.descriptionEn

  return (
    <div className="border-primary bg-primary/5 w-full rounded-lg border p-4">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h4 className="font-semibold">{name}</h4>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
        {badge === "best-match" && (
          <span className="bg-primary/10 text-primary shrink-0 rounded-full px-2 py-0.5 text-xs font-medium">
            {dict.bestMatch || "Best Match"}
          </span>
        )}
        {badge === "custom" && (
          <span className="bg-muted text-muted-foreground shrink-0 rounded-full px-2 py-0.5 text-xs font-medium">
            {dict.customSchedule || "Custom"}
          </span>
        )}
      </div>

      <div className="text-muted-foreground mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        <span>
          {periodsPerDay} {dict.periodsDay || "periods/day"}
        </span>
        <span>
          {schoolStart} - {schoolEnd}
        </span>
        <span>{formatWorkingDays(structure.workingDays)}</span>
      </div>

      <div className="flex gap-0.5">
        {periods.map((period, i) => {
          const totalMinutes = periods.reduce(
            (sum, p) => sum + p.durationMinutes,
            0
          )
          const widthPercent = (period.durationMinutes / totalMinutes) * 100
          return (
            <div
              key={i}
              className={cn(
                "flex items-center justify-center rounded border text-[10px]",
                TYPE_COLORS[period.type] || TYPE_COLORS.class
              )}
              style={{
                width: `${widthPercent}%`,
                minWidth: period.type === "class" ? "28px" : "16px",
                height: "28px",
              }}
              title={`${period.name} (${period.startTime}-${period.endTime})`}
            >
              {period.type === "class" && (
                <span className="truncate px-0.5">
                  {period.name.replace("Period ", "P")}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
