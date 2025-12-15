import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * SkeletonDataTable Component
 *
 * Production-ready skeleton for data tables with toolbar, header, rows, and pagination.
 * Matches the exact layout of DataTable component to prevent Cumulative Layout Shift (CLS).
 *
 * Pattern matches:
 * - DataTableToolbar (search + filters + actions)
 * - Table structure (header row + data rows)
 * - Pagination controls
 *
 * @example
 * ```tsx
 * // Default usage (5 columns, 10 rows)
 * <SkeletonDataTable />
 *
 * // Custom configuration
 * <SkeletonDataTable
 *   columns={8}
 *   rows={20}
 *   showToolbar={true}
 *   showPagination={true}
 * />
 * ```
 */
interface SkeletonDataTableProps {
  /** Number of columns to display (default: 5) */
  columns?: number
  /** Number of data rows to display (default: 10) */
  rows?: number
  /** Show toolbar with search and action buttons (default: true) */
  showToolbar?: boolean
  /** Show pagination controls at bottom (default: true) */
  showPagination?: boolean
  /** Additional CSS classes */
  className?: string
}

export function SkeletonDataTable({
  columns = 5,
  rows = 10,
  showToolbar = true,
  showPagination = true,
  className,
}: SkeletonDataTableProps) {
  return (
    <div className={cn("flex w-full flex-col gap-2.5", className)}>
      {/* DataTableToolbar skeleton */}
      {showToolbar && (
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-1 items-center gap-2">
            {/* Search input */}
            <Skeleton className="h-8 w-[250px]" />
            {/* Filter dropdown */}
            <Skeleton className="h-8 w-[100px]" />
          </div>
          <div className="flex items-center gap-2">
            {/* Action buttons */}
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      )}

      {/* Table skeleton */}
      <div className="overflow-hidden rounded-md border">
        <div className="w-full">
          {/* Table header */}
          <div className="bg-muted/50 border-b">
            <div className="flex h-12 items-center px-2">
              {Array.from({ length: columns }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center px-2",
                    i === 0 ? "w-[50px]" : "flex-1"
                  )}
                >
                  {i === 0 ? (
                    // Checkbox column
                    <Skeleton className="h-4 w-4 rounded" />
                  ) : (
                    // Regular column header
                    <Skeleton className="h-4 w-24" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Table body */}
          <div>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <div
                key={rowIndex}
                className="flex h-[57px] items-center border-b px-2 last:border-b-0"
              >
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <div
                    key={colIndex}
                    className={cn(
                      "flex items-center px-2",
                      colIndex === 0 ? "w-[50px]" : "flex-1"
                    )}
                  >
                    {colIndex === 0 ? (
                      // Checkbox column
                      <Skeleton className="h-4 w-4 rounded" />
                    ) : (
                      // Regular cell content
                      <Skeleton className="h-4 w-full max-w-[200px]" />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pagination skeleton */}
      {showPagination && (
        <div className="flex items-center justify-between px-2">
          <Skeleton className="h-4 w-[140px]" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-[100px]" />
            <div className="flex items-center gap-1">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * SkeletonDataTableCompact Component
 *
 * Compact variant without toolbar for embedded tables.
 *
 * @example
 * ```tsx
 * <SkeletonDataTableCompact columns={4} rows={5} />
 * ```
 */
export function SkeletonDataTableCompact({
  columns = 4,
  rows = 5,
  className,
}: Omit<SkeletonDataTableProps, "showToolbar" | "showPagination">) {
  return (
    <SkeletonDataTable
      columns={columns}
      rows={rows}
      showToolbar={false}
      showPagination={false}
      className={className}
    />
  )
}
