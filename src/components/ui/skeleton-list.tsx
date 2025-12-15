import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * SkeletonList Component
 *
 * Skeleton for vertical list layouts (notifications, activity feeds, etc.).
 * Matches list item pattern with avatar/icon, title, description, and metadata.
 *
 * Pattern matches:
 * - Avatar or icon on left
 * - Title and description
 * - Timestamp or metadata on right
 *
 * @example
 * ```tsx
 * // Default list (8 items)
 * <SkeletonList />
 *
 * // Custom item count
 * <SkeletonList items={15} />
 * ```
 */
interface SkeletonListProps {
  /** Number of list items (default: 8) */
  items?: number
  /** Show avatar/icon (default: true) */
  showAvatar?: boolean
  /** Wrap items in cards (default: false) */
  showCards?: boolean
  /** Additional CSS classes */
  className?: string
}

export function SkeletonList({
  items = 8,
  showAvatar = true,
  showCards = false,
  className,
}: SkeletonListProps) {
  const ListItem = ({ index }: { index: number }) => (
    <div
      className={cn(
        "flex items-start gap-4 p-4",
        !showCards && "border-b last:border-b-0"
      )}
    >
      {showAvatar && (
        <Skeleton className="h-10 w-10 flex-shrink-0 rounded-full" />
      )}
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-3 w-16 flex-shrink-0" />
    </div>
  )

  if (showCards) {
    return (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: items }).map((_, i) => (
          <Card key={i}>
            <ListItem index={i} />
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className={cn("divide-y rounded-lg border", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <ListItem key={i} index={i} />
      ))}
    </div>
  )
}

/**
 * SkeletonListCompact Component
 *
 * Compact variant without descriptions (for dense lists).
 *
 * @example
 * ```tsx
 * <SkeletonListCompact items={12} />
 * ```
 */
export function SkeletonListCompact({
  items = 10,
  showAvatar = true,
  className,
}: Omit<SkeletonListProps, "showCards">) {
  return (
    <div className={cn("divide-y rounded-lg border", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          {showAvatar && <Skeleton className="h-8 w-8 rounded-full" />}
          <div className="flex-1">
            <Skeleton className="h-4 w-3/4" />
          </div>
          <Skeleton className="h-3 w-12" />
        </div>
      ))}
    </div>
  )
}

/**
 * SkeletonActivityFeed Component
 *
 * Activity feed variant with timeline indicator.
 *
 * @example
 * ```tsx
 * <SkeletonActivityFeed items={6} />
 * ```
 */
export function SkeletonActivityFeed({
  items = 6,
  className,
}: Omit<SkeletonListProps, "showAvatar" | "showCards">) {
  return (
    <div className={cn("space-y-6", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {/* Timeline dot */}
          <div className="flex flex-col items-center">
            <Skeleton className="h-8 w-8 rounded-full" />
            {i < items - 1 && <div className="bg-border mt-2 w-0.5 flex-1" />}
          </div>
          {/* Content */}
          <div className="flex-1 space-y-2 pb-6">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="mt-2 h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}
