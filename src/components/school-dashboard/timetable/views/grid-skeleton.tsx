// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

interface TimetableGridSkeletonProps {
  /** Working days. Sudan runs Sun–Thu. */
  days?: number
  /** Teaching periods only — breaks are not teaching rows. sd-private has 7. */
  periods?: number
  /**
   * Render a break row after this teaching period (1-based); null for none.
   * A Sudanese day has ONE فسحة, after period 3.
   */
  breakAfterPeriod?: number | null
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
 */
export function TimetableGridSkeleton({
  days = 5,
  periods = 7,
  breakAfterPeriod = 3,
  className,
}: TimetableGridSkeletonProps) {
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
      <div className="flex flex-col items-center justify-center border-e border-neutral-200 bg-neutral-100 px-2 py-3 sm:px-8 sm:py-5 dark:border-neutral-700 dark:bg-neutral-800">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="mt-1 h-3 w-10" />
      </div>
      <div
        className={cn(
          "flex items-center justify-center bg-neutral-50 px-2 py-3 sm:px-8 sm:py-5 dark:bg-neutral-800/50",
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
        "overflow-x-auto rounded-xl border border-neutral-200 shadow-lg dark:border-neutral-700",
        className
      )}
      // The grid it stands in for is a table of scheduled classes; announce the
      // wait rather than letting a screen reader meet an empty region.
      role="status"
      aria-busy="true"
    >
      <div className="min-w-full bg-white dark:bg-neutral-900">
        {/* Header — clock cell + one column per working day */}
        <div
          className={cn(
            "grid border-b border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800",
            gridColsClass
          )}
        >
          <div className="flex items-center justify-center border-e border-neutral-200 px-2 py-3 sm:px-8 sm:py-5 dark:border-neutral-700">
            <Skeleton className="h-4 w-4 rounded-full" />
          </div>
          {Array.from({ length: days }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "px-4 py-2 sm:px-8 sm:py-5",
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
                <div className="flex flex-col items-center justify-center border-e border-neutral-200 bg-neutral-100 px-2 py-3 sm:px-8 sm:py-5 dark:border-neutral-700 dark:bg-neutral-800">
                  <Skeleton className="h-4 w-14" />
                  <Skeleton className="mt-1 h-3 w-10" />
                </div>
                {Array.from({ length: days }).map((_, col) => (
                  <div
                    key={col}
                    className={cn(
                      "flex min-h-[72px] flex-col items-center justify-center gap-1.5 px-2 py-3 sm:px-8 sm:py-5",
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
