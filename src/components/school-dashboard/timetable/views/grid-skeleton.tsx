// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type CSSProperties } from "react"

import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

interface TimetableGridSkeletonProps {
  /**
   * The SAME arrays `SimpleGrid` is about to receive. Both are known before the
   * slots are fetched — they come from `getActiveTerm`/`getPersonalizedTimetable`
   * via RoleRouter's `commonProps`, not from the grid read — so the placeholder
   * can be exact rather than a guess. Pass `visibleDays`, not `workingDays`,
   * where the caller narrows them: a phone in day mode renders ONE column, and a
   * five-column skeleton in front of it is the reflow this component exists to
   * prevent.
   */
  workingDays?: number[]
  periods?: Array<{ isBreak: boolean }>
  className?: string
}

/**
 * Loading placeholder for `SimpleGrid`, mirroring its DOM: the same container,
 * the same `grid-cols-N` header (clock cell + one column per working day), the
 * same period rows, and a break row in the right place.
 *
 * Replaces `<Skeleton className="h-96 w-full rounded-lg" />` — a single
 * featureless rectangle that stood in for the whole timetable at 7 call sites.
 * The block's own rule is "match the actual content layout exactly": a blob
 * gives no hint of the grid's shape, so the page visibly reflows when data
 * lands instead of resolving in place.
 *
 * Defaults describe the Sudanese school day so the common case needs no props.
 * Static by contract — no hooks, no state, no fetching.
 *
 * The band heights below are MEASURED off the live grid, not derived from
 * padding: a real cell's height is driven by its text (a subject that wraps to
 * two lines on a phone), which a placeholder cannot reproduce. Matching the
 * classes alone left the skeleton ~9px short per row and 68px short overall, so
 * the page still stepped when data landed. Re-measure if the cell typography
 * changes — header 41/65, teaching row 65/85, break row 68/84 (mobile/sm+).
 */
export function TimetableGridSkeleton({
  workingDays,
  periods: periodRows,
  className,
}: TimetableGridSkeletonProps) {
  // Fall back to the Sudanese school day when a caller has nothing better —
  // 5 days, 7 teaching periods, one فسحة after the third.
  const days = workingDays?.length ?? 5
  const teaching = periodRows?.filter((p) => !p.isBreak)
  const periods = teaching?.length ?? 7
  // Where the break lands: the count of teaching periods that precede the first
  // non-teaching one, in the order given. `SimpleGrid` derives this from the
  // same data rather than a constant, and so must this.
  const breakAfterPeriod = periodRows
    ? (() => {
        let seen = 0
        for (const p of periodRows) {
          if (p.isBreak) return seen
          seen++
        }
        return null
      })()
    : 3
  // Tailwind can only see literal class names, so map rather than interpolate —
  // same switch SimpleGrid uses (days + 1 for the leading period column).
  const totalCols = days + 1
  const gridColsClass =
    (
      {
        2: "grid-cols-2",
        3: "grid-cols-3",
        4: "grid-cols-4",
        5: "grid-cols-5",
        6: "grid-cols-6",
        7: "grid-cols-7",
        8: "grid-cols-8",
      } as Record<number, string>
    )[totalCols] ?? "grid-cols-6"

  const breakColSpan =
    (
      {
        1: "col-span-1",
        2: "col-span-2",
        3: "col-span-3",
        4: "col-span-4",
        5: "col-span-5",
        6: "col-span-6",
        7: "col-span-7",
      } as Record<number, string>
    )[days] ?? "col-span-5"

  const BreakRow = () => (
    <div className={cn("grid", gridColsClass)}>
      <div className="flex min-h-[68px] flex-col items-center justify-center border-e border-neutral-200 bg-neutral-100 px-2 sm:min-h-[84px] sm:px-8 dark:border-neutral-700 dark:bg-neutral-800">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="mt-1 h-3 w-10" />
      </div>
      <div
        className={cn(
          "flex min-h-[68px] items-center justify-center bg-neutral-50 px-2 sm:min-h-[84px] sm:px-8 dark:bg-neutral-800/50",
          breakColSpan
        )}
      >
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  )

  return (
    <div
      className={cn(
        "overflow-x-auto rounded-xl border border-neutral-200 shadow-lg dark:border-neutral-700 print:rounded-none print:shadow-none",
        className
      )}
      // The grid it stands in for is a table of scheduled classes; announce the
      // wait rather than letting a screen reader meet an empty region.
      role="status"
      aria-busy="true"
    >
      {/* Same per-column floor SimpleGrid applies, so a week on a phone
          scrolls at the same width instead of compressing and then jumping. */}
      <div
        className="w-full min-w-[var(--tt-grid-min-w)] bg-white dark:bg-neutral-900 print:min-w-0"
        style={{ "--tt-grid-min-w": `${(days + 1) * 128}px` } as CSSProperties}
      >
        {/* Header — clock cell + one column per working day */}
        <div
          className={cn(
            "grid border-b border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800",
            gridColsClass
          )}
        >
          <div className="flex min-h-[41px] items-center justify-center border-e border-neutral-200 px-2 sm:min-h-[65px] sm:px-8 dark:border-neutral-700">
            <Skeleton className="h-4 w-4 rounded-full" />
          </div>
          {Array.from({ length: days }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "flex min-h-[41px] items-center justify-center px-4 sm:min-h-[65px] sm:px-8",
                i < days - 1
                  ? "border-e border-neutral-200 dark:border-neutral-700"
                  : ""
              )}
            >
              <Skeleton className="mx-auto h-4 w-16" />
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
          {Array.from({ length: periods }).map((_, row) => (
            <div key={row}>
              {breakAfterPeriod === row && <BreakRow />}
              <div className={cn("grid", gridColsClass)}>
                <div className="flex min-h-[65px] flex-col items-center justify-center border-e border-neutral-200 bg-neutral-100 px-2 sm:min-h-[85px] sm:px-8 dark:border-neutral-700 dark:bg-neutral-800">
                  <Skeleton className="h-4 w-14" />
                  <Skeleton className="mt-1 h-3 w-10" />
                </div>
                {Array.from({ length: days }).map((_, col) => (
                  <div
                    key={col}
                    className={cn(
                      "flex min-h-[65px] flex-col items-center justify-center gap-1.5 px-2 sm:min-h-[85px] sm:px-4",
                      col < days - 1
                        ? "border-e border-neutral-200 dark:border-neutral-700"
                        : ""
                    )}
                  >
                    {/* subject + teacher — the two lines a real cell shows */}
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
