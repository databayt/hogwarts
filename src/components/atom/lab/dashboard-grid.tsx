import * as React from "react"
import { cn } from "@/lib/utils"
import type { GridBreakpoints } from "./types"

interface DashboardGridProps {
  /**
   * Grid children (cards, etc.)
   */
  children: React.ReactNode
  /**
   * Responsive column breakpoints
   * @default { base: 1, md: 2, lg: 3, xl: 4 }
   */
  columns?: GridBreakpoints
  /**
   * Gap between grid items
   * @default 4 (1rem / 16px)
   */
  gap?: 2 | 3 | 4 | 6 | 8
  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * DashboardGrid - Responsive grid container for lab cards
 *
 * Provides a consistent, responsive grid layout with customizable
 * column breakpoints. Uses Tailwind's grid system with semantic spacing.
 *
 * @example
 * ```tsx
 * <DashboardGrid
 *   columns={{ base: 1, md: 2, lg: 3, xl: 4 }}
 *   gap={4}
 * >
 *   <StatCard {...} />
 *   <StatCard {...} />
 *   <StatCard {...} />
 * </DashboardGrid>
 * ```
 *
 * @example
 * // Different layout for different content
 * <DashboardGrid
 *   columns={{ base: 1, md: 1, lg: 2 }}
 *   gap={6}
 * >
 *   <ChartCard {...} />
 *   <ChartCard {...} />
 * </DashboardGrid>
 * ```
 */
export function DashboardGrid({
  children,
  columns = { base: 1, md: 2, lg: 3, xl: 4 },
  gap = 4,
  className,
}: DashboardGridProps) {
  const gapClasses = {
    2: "gap-2",
    3: "gap-3",
    4: "gap-4",
    6: "gap-6",
    8: "gap-8",
  }

  // Build responsive column classes
  const columnClasses = React.useMemo(() => {
    const classes: string[] = []

    if (columns.base) {
      classes.push(`grid-cols-${columns.base}`)
    }
    if (columns.md) {
      classes.push(`md:grid-cols-${columns.md}`)
    }
    if (columns.lg) {
      classes.push(`lg:grid-cols-${columns.lg}`)
    }
    if (columns.xl) {
      classes.push(`xl:grid-cols-${columns.xl}`)
    }
    if (columns["2xl"]) {
      classes.push(`2xl:grid-cols-${columns["2xl"]}`)
    }

    return classes.join(" ")
  }, [columns])

  return (
    <div className={cn("grid", columnClasses, gapClasses[gap], className)}>
      {children}
    </div>
  )
}
