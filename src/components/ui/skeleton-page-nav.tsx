import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * SkeletonPageNav Component
 *
 * Skeleton for PageNav component used in platform navigation.
 * Matches the tab-style navigation with border bottom.
 *
 * Pattern matches:
 * - Tab items with active indicator
 * - Border bottom separator
 * - Horizontal scroll area
 *
 * @example
 * ```tsx
 * // Default 4 tabs
 * <SkeletonPageNav />
 *
 * // Custom tab count
 * <SkeletonPageNav tabs={6} />
 * ```
 */
interface SkeletonPageNavProps {
  /** Number of tab items to display (default: 4) */
  tabs?: number
  /** Additional CSS classes */
  className?: string
}

export function SkeletonPageNav({ tabs = 4, className }: SkeletonPageNavProps) {
  return (
    <div className={cn("border-b", className)}>
      <nav className="flex items-center gap-6">
        {Array.from({ length: tabs }).map((_, i) => (
          <div key={i} className="relative pb-3">
            {/* Tab label */}
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
      </nav>
    </div>
  )
}

/**
 * SkeletonPageNavWide Component
 *
 * Wide variant for navigation with more tabs (e.g., Finance with 7 tabs).
 *
 * @example
 * ```tsx
 * <SkeletonPageNavWide tabs={7} />
 * ```
 */
export function SkeletonPageNavWide({
  tabs = 7,
  className,
}: SkeletonPageNavProps) {
  return (
    <div className={cn("border-b", className)}>
      <div className="max-w-[600px] overflow-x-auto lg:max-w-none">
        <nav className="flex items-center gap-6">
          {Array.from({ length: tabs }).map((_, i) => (
            <div key={i} className="relative pb-3 whitespace-nowrap">
              <Skeleton className="h-5 w-24" />
            </div>
          ))}
        </nav>
      </div>
    </div>
  )
}
