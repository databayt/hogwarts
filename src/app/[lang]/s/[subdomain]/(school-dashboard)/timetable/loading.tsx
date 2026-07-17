// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Skeleton } from "@/components/ui/skeleton"
import { TimetableGridSkeleton } from "@/components/school-dashboard/timetable/views/grid-skeleton"

/**
 * Mirrors the real timetable page: centred title, tab bar, the two filter
 * comboboxes, then the grid.
 *
 * Previously this rendered a left-aligned header + two buttons + a generic
 * `SkeletonCalendarCompact periods={8}` — neither the tabs nor the filters
 * existed in the skeleton, the header sat on the wrong side, and 8 periods no
 * longer matches the Sudanese day (7 teaching + one فسحة). Delegating to
 * `TimetableGridSkeleton` keeps the grid shape in one place, so it can't drift
 * from `SimpleGrid` again.
 */
export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Page title (centred, like the live page) */}
      <div className="flex flex-col items-center gap-4">
        <Skeleton className="h-8 w-40" />
        {/* Tab bar: الكل · التحليلات · إنشاء · التعارضات · الإعدادات */}
        <div className="flex gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-16" />
          ))}
        </div>
      </div>

      {/* Filter comboboxes (classroom + teacher), end-aligned as on the page */}
      <div className="flex justify-end gap-3">
        <Skeleton className="h-10 w-[180px]" />
        <Skeleton className="h-10 w-[180px]" />
      </div>

      <TimetableGridSkeleton />
    </div>
  )
}
