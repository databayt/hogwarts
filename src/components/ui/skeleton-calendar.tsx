import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * SkeletonCalendar Component
 *
 * Skeleton for calendar/timetable grid layouts.
 * Used in timetable views with day columns and period rows.
 *
 * Pattern matches:
 * - Day header row (7 columns for full week)
 * - Period rows with time slots
 * - Grid structure with borders
 *
 * @example
 * ```tsx
 * // Full week timetable
 * <SkeletonCalendar />
 *
 * // Custom days and periods
 * <SkeletonCalendar days={5} periods={8} />
 * ```
 */
interface SkeletonCalendarProps {
  /** Number of day columns (default: 7 for full week) */
  days?: number
  /** Number of period rows (default: 8) */
  periods?: number
  /** Show time column on left (default: true) */
  showTime?: boolean
  /** Additional CSS classes */
  className?: string
}

export function SkeletonCalendar({
  days = 7,
  periods = 8,
  showTime = true,
  className,
}: SkeletonCalendarProps) {
  const columns = showTime ? days + 1 : days

  return (
    <div className={cn("overflow-x-auto rounded-xl border", className)}>
      <div className="min-w-full">
        {/* Header row - Days */}
        <div className="bg-muted/50 flex border-b">
          {showTime && (
            <div className="flex w-[100px] items-center justify-center border-r p-4">
              <Skeleton className="h-4 w-16" />
            </div>
          )}
          {Array.from({ length: days }).map((_, i) => (
            <div
              key={i}
              className="min-w-[120px] flex-1 border-r p-4 last:border-r-0"
            >
              <Skeleton className="mx-auto h-4 w-16" />
            </div>
          ))}
        </div>

        {/* Period rows */}
        {Array.from({ length: periods }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex border-b last:border-b-0">
            {showTime && (
              <div className="flex w-[100px] flex-col items-center justify-center border-r p-4">
                <Skeleton className="mb-1 h-4 w-12" />
                <Skeleton className="h-3 w-20" />
              </div>
            )}
            {Array.from({ length: days }).map((_, colIndex) => (
              <div
                key={colIndex}
                className="min-h-[80px] min-w-[120px] flex-1 border-r p-4 last:border-r-0"
              >
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * SkeletonCalendarCompact Component
 *
 * Compact 5-day school week variant.
 *
 * @example
 * ```tsx
 * <SkeletonCalendarCompact />
 * ```
 */
export function SkeletonCalendarCompact({
  periods = 8,
  className,
}: Omit<SkeletonCalendarProps, "days" | "showTime">) {
  return (
    <SkeletonCalendar
      days={5}
      periods={periods}
      showTime={true}
      className={className}
    />
  )
}

/**
 * SkeletonMonthCalendar Component
 *
 * Month view calendar skeleton (6 rows × 7 columns).
 *
 * @example
 * ```tsx
 * <SkeletonMonthCalendar />
 * ```
 */
export function SkeletonMonthCalendar({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border", className)}>
      {/* Month header */}
      <div className="flex items-center justify-between border-b p-4">
        <Skeleton className="h-6 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 border-b">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="border-r p-2 last:border-r-0">
            <Skeleton className="mx-auto h-4 w-8" />
          </div>
        ))}
      </div>

      {/* Date cells */}
      <div className="grid grid-cols-7">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="h-20 border-r border-b p-2 last:border-r-0">
            <Skeleton className="h-4 w-6" />
          </div>
        ))}
      </div>
    </div>
  )
}
