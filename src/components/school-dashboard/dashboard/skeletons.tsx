// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { DashboardSkeleton } from "@/components/school-dashboard/loading"
import { TimetableGridSkeleton } from "@/components/school-dashboard/timetable/views/grid-skeleton"

/**
 * Per-widget placeholders for `content.tsx`. Each draws the box of the widget
 * it stands in for — same grid placement, same height — so the page does not
 * move when the widget streams in. They are server components with no data.
 */

/**
 * `HomeBlockClient`: the calendar widget beside the 2x2 tile cluster. Phones:
 * a two-column row bleeding to the viewport edges. From md up the block
 * dissolves (`contents`) into the dashboard's 8-column app grid: the widget
 * takes 4 columns x 2 rows, and the cluster's four tiles are grid items.
 */
export function HomeBlockSkeleton() {
  return (
    <div
      className="mx-[calc(50%-50vw)] grid grid-cols-2 gap-x-8 px-4 md:contents"
      aria-hidden="true"
    >
      <div className="flex flex-col gap-[5px] md:col-span-4 md:row-span-2">
        <Skeleton className="flex-1 rounded-[28px]" />
        <Skeleton className="mx-auto h-4 w-12" />
      </div>
      <div className="grid grid-cols-2 gap-x-8 gap-y-5 md:contents">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-[5px]">
            <Skeleton className="aspect-square w-full rounded-[29.2%]" />
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * `NextAction`: the green banner. 245px is its own box (see
 * `DashboardSkeleton`): `py-12` either side of a two-line headline and the
 * pill row. It can render nothing on a day with no ranked action; drawing it
 * is the better trade, as the route-level skeleton already decided.
 */
export function NextActionSkeleton({ className }: { className?: string }) {
  return (
    <Skeleton
      className={cn("h-[245px] w-full rounded-[36px]", className)}
      aria-hidden="true"
    />
  )
}

/**
 * `TodayTimetable`: heading row over the single-day grid column. Only students
 * and teachers get the widget, so callers pass it for those roles alone.
 */
export function TodayTimetableSkeleton() {
  return (
    <section
      className="md:order-last md:col-span-full md:mt-3"
      aria-hidden="true"
    >
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-5 w-24" />
      </div>
      <TimetableGridSkeleton workingDays={[0]} />
    </section>
  )
}

/**
 * The role dashboard under the app grid (charts, usage table, invoices, ...).
 * It reuses the route skeleton and hides that skeleton's first block — the
 * phone prefix (home block, banner, classes, quick actions) — because those
 * widgets are drawn by their own placeholders above.
 */
export function RoleDashboardSkeleton({ role }: { role?: string | null }) {
  return (
    <div className="[&>div>div:first-child]:hidden">
      <DashboardSkeleton role={role} />
    </div>
  )
}
