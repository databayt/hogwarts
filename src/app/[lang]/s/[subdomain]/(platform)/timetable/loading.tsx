import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonCalendarCompact } from "@/components/ui/skeleton-calendar"

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>

      {/* Timetable grid */}
      <SkeletonCalendarCompact periods={8} />
    </div>
  )
}
