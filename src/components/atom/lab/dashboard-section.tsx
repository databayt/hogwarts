import * as React from "react"

import { cn } from "@/lib/utils"

import { Divider } from "./divider"

interface DashboardSectionProps {
  /**
   * Section title
   */
  title: string
  /**
   * Optional section description
   */
  description?: string
  /**
   * Optional action element (e.g., "View All" button)
   */
  action?: React.ReactNode
  /**
   * Section content (children)
   */
  children: React.ReactNode
  /**
   * Show divider below header
   * @default true
   */
  showDivider?: boolean
  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * DashboardSection - Titled section with optional action
 *
 * Groups related lab cards under a consistent header.
 * Perfect for organizing different areas of a lab
 * (e.g., "Overview", "Recent Activity", "Quick Stats").
 *
 * @example
 * ```tsx
 * <DashboardSection
 *   title="Overview"
 *   description="Key metrics at a glance"
 *   action={<Button variant="ghost" size="sm">View All</Button>}
 * >
 *   <DashboardGrid>
 *     <StatCard {...} />
 *     <StatCard {...} />
 *     <StatCard {...} />
 *   </DashboardGrid>
 * </DashboardSection>
 * ```
 */
export function DashboardSection({
  title,
  description,
  action,
  children,
  showDivider = true,
  className,
}: DashboardSectionProps) {
  return (
    <section className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h3>{title}</h3>
          {description && <p className="muted">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      {/* Divider */}
      {showDivider && <Divider />}

      {/* Content */}
      {children}
    </section>
  )
}
