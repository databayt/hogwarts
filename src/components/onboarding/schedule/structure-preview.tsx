"use client"

import { cn } from "@/lib/utils"
import type { TimetableStructure } from "@/components/school-dashboard/timetable/structures"
import { formatWorkingDays } from "@/components/school-dashboard/timetable/structures"

interface StructurePreviewProps {
  structure: TimetableStructure
  selected?: boolean
  onSelect?: () => void
  compact?: boolean
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
  selected,
  onSelect,
  compact,
}: StructurePreviewProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-lg border-2 p-4 text-start transition-colors",
        selected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50"
      )}
    >
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h4 className="font-semibold">{structure.nameEn}</h4>
          <p className="text-muted-foreground text-sm">
            {structure.descriptionEn}
          </p>
        </div>
        {structure.isDefault && (
          <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium">
            Recommended
          </span>
        )}
      </div>

      <div className="text-muted-foreground mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        <span>{structure.periodsPerDay} periods/day</span>
        <span>
          {structure.schoolStart} - {structure.schoolEnd}
        </span>
        <span>{formatWorkingDays(structure.workingDays)}</span>
      </div>

      {!compact && (
        <div className="flex gap-0.5">
          {structure.periods.map((period, i) => {
            const totalMinutes = structure.periods.reduce(
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
      )}
    </button>
  )
}
