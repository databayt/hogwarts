import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { CardSize, SkeletonLayout } from "./types"

interface SkeletonCardProps {
  /**
   * Layout variant to match
   * @default "stat"
   */
  layout?: SkeletonLayout
  /**
   * Number of rows (for list layout)
   * @default 3
   */
  rows?: number
  /**
   * Card size variant
   * @default "md"
   */
  size?: CardSize
  /**
   * Show header skeleton
   * @default false
   */
  showHeader?: boolean
  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * SkeletonCard - Loading placeholder card
 *
 * Provides visual feedback during data fetching with
 * animated pulse skeletons that match real card layouts.
 *
 * @example
 * ```tsx
 * <SkeletonCard
 *   layout="stat"
 *   size="lg"
 * />
 *
 * <SkeletonCard
 *   layout="list"
 *   rows={5}
 *   showHeader
 * />
 * ```
 */
export function SkeletonCard({
  layout = "stat",
  rows = 3,
  size = "md",
  showHeader = false,
  className,
}: SkeletonCardProps) {
  const sizeClasses = {
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
    xl: "p-8",
  }

  const renderSkeleton = () => {
    switch (layout) {
      case "stat":
        return (
          <div className="space-y-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        )

      case "list":
        return (
          <div className="space-y-3">
            {[...Array(rows)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        )

      case "chart":
        return (
          <div className="space-y-4">
            <Skeleton className="h-64 w-full rounded-lg" />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          </div>
        )

      case "progress":
        return (
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-4 w-20" />
          </div>
        )

      case "media":
        return (
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full shrink-0" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Card className={cn(className)}>
      {showHeader && (
        <CardHeader className={cn(sizeClasses[size])}>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
      )}
      <CardContent className={cn(sizeClasses[size], showHeader && "pt-0")}>
        {renderSkeleton()}
      </CardContent>
    </Card>
  )
}
