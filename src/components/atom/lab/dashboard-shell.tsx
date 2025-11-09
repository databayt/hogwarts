import * as React from "react"
import { cn } from "@/lib/utils"

interface DashboardShellProps {
  /**
   * Dashboard content (children)
   */
  children: React.ReactNode
  /**
   * Spacing variant
   * @default "default"
   */
  spacing?: "compact" | "default" | "spacious"
  /**
   * Maximum width constraint
   * @default "full" (no constraint)
   */
  maxWidth?: "full" | "7xl" | "6xl" | "5xl"
  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * DashboardShell - Full page layout wrapper
 *
 * Provides consistent padding, spacing, and max-width for lab pages.
 * Use this as the top-level wrapper for all lab content.
 *
 * @example
 * ```tsx
 * // In a lab page component
 * export default function AdminDashboard() {
 *   return (
 *     <DashboardShell>
 *       <DashboardSection title="Overview">
 *         <DashboardGrid>
 *           <StatCard {...} />
 *           <StatCard {...} />
 *         </DashboardGrid>
 *       </DashboardSection>
 *
 *       <DashboardSection title="Charts">
 *         <DashboardGrid columns={{ base: 1, lg: 2 }}>
 *           <ChartCard {...} />
 *           <ChartCard {...} />
 *         </DashboardGrid>
 *       </DashboardSection>
 *     </DashboardShell>
 *   )
 * }
 * ```
 */
export function DashboardShell({
  children,
  spacing = "default",
  maxWidth = "full",
  className,
}: DashboardShellProps) {
  const spacingClasses = {
    compact: "space-y-4",
    default: "space-y-6",
    spacious: "space-y-8",
  }

  const maxWidthClasses = {
    full: "",
    "7xl": "max-w-7xl mx-auto",
    "6xl": "max-w-6xl mx-auto",
    "5xl": "max-w-5xl mx-auto",
  }

  return (
    <div
      className={cn(
        "w-full px-4 sm:px-6 md:px-8",
        spacingClasses[spacing],
        maxWidthClasses[maxWidth],
        className
      )}
    >
      {children}
    </div>
  )
}
