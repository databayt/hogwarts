"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The class list: one inset grouped list, a row per student with a pill
 * Present / Absent / Late control. No pagination, no column chrome — a
 * section is ~20–40 students and the teacher's job is to scan it top to
 * bottom and touch the exceptions.
 */
import * as React from "react"

import { cn } from "@/lib/utils"
import { Segmented } from "@/components/school-dashboard/school/configuration/ui/segmented"

export type AttendanceStatusValue = "present" | "absent" | "late"

export type AttendanceRow = {
  studentId: string
  name: string
  status: AttendanceStatusValue
  /** A mark is stored for this day (vs. the "present" default). */
  marked?: boolean
}

interface RosterProps {
  rows: AttendanceRow[]
  labels: Record<AttendanceStatusValue, string>
  /** Student ids with unsaved marks. */
  dirty: Set<string>
  onChangeStatus: (studentId: string, status: AttendanceStatusValue) => void
  disabled?: boolean
}

function AttendanceRosterInner({
  rows,
  labels,
  dirty,
  onChangeStatus,
  disabled,
}: RosterProps) {
  const options = (
    ["present", "absent", "late"] as AttendanceStatusValue[]
  ).map((value) => ({ value, label: labels[value] }))

  return (
    <ul className="bg-card divide-border/60 divide-y overflow-hidden rounded-2xl border">
      {rows.map((row, i) => (
        <li
          key={row.studentId}
          className="flex min-h-14 flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5"
        >
          <span className="text-muted-foreground w-6 shrink-0 text-xs tabular-nums">
            {i + 1}
          </span>
          <span className="flex min-w-0 flex-1 items-center gap-2 text-sm font-medium">
            <span className="truncate">{row.name}</span>
            {dirty.has(row.studentId) ? (
              <span
                aria-hidden
                className="bg-primary size-1.5 shrink-0 rounded-full"
              />
            ) : null}
          </span>
          <Segmented
            value={row.status}
            onValueChange={(v) => onChangeStatus(row.studentId, v)}
            options={options}
            disabled={disabled}
            aria-label={row.name}
            className={cn(
              "w-full sm:w-auto",
              row.status === "absent" && "[&_[data-state=on]]:text-destructive",
              row.status === "late" &&
                "[&_[data-state=on]]:text-amber-600 dark:[&_[data-state=on]]:text-amber-400"
            )}
          />
        </li>
      ))}
    </ul>
  )
}

export const AttendanceRoster = React.memo(AttendanceRosterInner)
