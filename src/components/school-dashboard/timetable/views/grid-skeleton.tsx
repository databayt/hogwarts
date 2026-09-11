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
  /**
   * Below `md`, render ONE day column instead of the whole week — the shape a
   * student's grid actually takes on a phone, where `StudentView` defaults to
   * day mode.
   *
   * Done in CSS rather than by narrowing `workingDays`, and that is the whole
   * point: the mode is decided by `matchMedia`, which is unreadable until after
   * mount, so a JS-narrowed skeleton paints the five-column week for its first
   * frame and then snaps to one column. A media query is already correct on the
   * frame the server sends, with no hydration risk.
   *
   * Pass it wherever the reader has NOT explicitly chosen the week; an explicit
   * pick is width-independent and should narrow `workingDays` instead.
   */
  collapseToDayOnMobile?: boolean
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
 * changes — header 41/65, teaching row 72/85, break row 68/84 (mobile/sm+).
 *
 * The mobile teaching band was 65 against a real 64 while the cell's own
 * `min-h` sat below what the period column forced. Now that the cell floors the
 * row at 72px (`simple-grid.tsx`), that band is no longer a measurement at all —
 * it IS `min-h-18`, and the two must move together.
 */
export function TimetableGridSkeleton({
  workingDays,
  periods: periodRows,
  collapseToDayOnMobile = false,
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
  // same switch SimpleGrid uses (days + 1 for the leading period column). Every
  // width-dependent class comes in an unprefixed and an `md:` flavour so the
  // collapsed phone layout and the full week can both be spelled out literally.
  const totalCols = days + 1
  const weekGridCols =
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
  const mdWeekGridCols =
    (
      {
        2: "md:grid-cols-2",
        3: "md:grid-cols-3",
        4: "md:grid-cols-4",
        5: "md:grid-cols-5",
        6: "md:grid-cols-6",
        7: "md:grid-cols-7",
        8: "md:grid-cols-8",
      } as Record<number, string>
    )[totalCols] ?? "md:grid-cols-6"

  // Collapsed: period column + exactly one day, the shape day mode renders.
  const gridColsClass = collapseToDayOnMobile
    ? `grid-cols-2 ${mdWeekGridCols}`
    : weekGridCols

  const weekBreakSpan =
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
  const mdWeekBreakSpan =
    (
      {
        1: "md:col-span-1",
        2: "md:col-span-2",
        3: "md:col-span-3",
        4: "md:col-span-4",
        5: "md:col-span-5",
        6: "md:col-span-6",
        7: "md:col-span-7",
      } as Record<number, string>
    )[days] ?? "md:col-span-5"

  const breakColSpan = collapseToDayOnMobile
    ? `col-span-1 ${mdWeekBreakSpan}`
    : weekBreakSpan

  // A day column other than the first exists only once the week is on screen.
  const hiddenBelowMd = collapseToDayOnMobile ? "hidden md:flex" : ""
  // The trailing column carries no divider. Which column is trailing depends on
  // the width when the grid collapses, so the first one loses its border below
  // `md` and gets it back with the rest of the week.
  const dayBorder = (i: number) => {
    if (i >= days - 1) return ""
    if (collapseToDayOnMobile && i === 0)
      return "md:border-e border-neutral-200 dark:border-neutral-700"
    return "border-e border-neutral-200 dark:border-neutral-700"
  }

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
        className={cn(
          "w-full bg-white dark:bg-neutral-900 print:min-w-0",
          // Collapsed, only two columns are on screen, so the week's floor
          // would force a scrollbar the real day grid does not have.
          collapseToDayOnMobile
            ? "min-w-[256px] md:min-w-[var(--tt-grid-min-w)]"
            : "min-w-[var(--tt-grid-min-w)]"
        )}
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
                i > 0 && hiddenBelowMd,
                dayBorder(i)
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
                <div className="flex min-h-[72px] flex-col items-center justify-center border-e border-neutral-200 bg-neutral-100 px-2 sm:min-h-[85px] sm:px-8 dark:border-neutral-700 dark:bg-neutral-800">
                  <Skeleton className="h-4 w-14" />
                  <Skeleton className="mt-1 h-3 w-10" />
                </div>
                {Array.from({ length: days }).map((_, col) => (
                  <div
                    key={col}
                    className={cn(
                      "flex min-h-[72px] flex-col items-center justify-center gap-1.5 px-2 sm:min-h-[85px] sm:px-4",
                      col > 0 && hiddenBelowMd,
                      dayBorder(col)
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

/**
 * The whole timetable SURFACE while it loads: the role's toolbar over the grid
 * placeholder. Two shapes, because the two surfaces differ in both dimensions —
 * a student gets a 130px segmented control over `space-y-12` and, on a phone,
 * a single day column; everyone else gets two 180px comboboxes over the full
 * week.
 *
 * Shared so the route's Suspense fallback (`timetable/layout.tsx`) and
 * `RoleRouter`'s own loading branch cannot drift. They render back to back —
 * layout first, from the streamed shell, then RoleRouter while its two server
 * actions run — so any difference between them is a visible step in the middle
 * of a single load. Before they were shared, a phone went 6 columns at 768px →
 * 2 columns at 256px → 6 columns again → 2, with the grid's top edge landing at
 * four different offsets.
 *
 * Neither caller knows `workingDays`/`periods` yet (that is the wait), so the
 * grid falls back to the Sudanese school day.
 */
export function TimetableSurfaceSkeleton({
  studentShell = false,
}: {
  /** Will this reader land on `StudentView`? See `rendersStudentTimetable`. */
  studentShell?: boolean
}) {
  return (
    <div className="space-y-12">
      {studentShell ? (
        // The week/day ToggleGroup: h-9, two 64px halves plus padding = 130px.
        <Skeleton className="h-9 w-[130px] rounded-md" />
      ) : (
        // AdminView's classroom + teacher comboboxes, at their own sizing.
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-[180px] rounded-md" />
          <Skeleton className="h-9 w-[180px] rounded-md" />
        </div>
      )}
      <TimetableGridSkeleton collapseToDayOnMobile={studentShell} />
    </div>
  )
}
