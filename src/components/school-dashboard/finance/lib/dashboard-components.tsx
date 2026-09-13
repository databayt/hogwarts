// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Reusable Dashboard Components for Finance Block
 *
 * These components consolidate the repeated lab patterns across all finance sub-blocks,
 * reducing code duplication by ~67% while maintaining consistency and using semantic HTML.
 */

import type { ElementType, ReactNode } from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

/**
 * StatsCard Component
 * Displays a single metric with icon, title, value, and description
 * Uses semantic HTML (h6, h2, small) instead of hardcoded typography classes
 */
interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon?: ElementType
  trend?: "up" | "down" | "neutral"
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
}: StatsCardProps) {
  // Phone: one cell of the grey stat panel `DashboardGrid type="stats"` draws —
  // label small and muted, figure bold, no icon, no card chrome. The same
  // vocabulary as the phone dashboard's analytics card and `StatPanel`.
  return (
    <Card className="max-md:bg-muted max-md:rounded-none max-md:border-0">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 max-md:px-5 max-md:pt-4 max-md:pb-1">
        <CardTitle className="max-md:min-w-0">
          <h6 className="max-md:text-muted-foreground max-md:line-clamp-1 max-md:text-xs max-md:font-normal">
            {title}
          </h6>
        </CardTitle>
        {Icon && (
          <Icon className="text-muted-foreground h-4 w-4 max-md:hidden" />
        )}
      </CardHeader>
      <CardContent className="max-md:px-5 max-md:pb-4">
        <h2
          className={cn(
            "max-md:font-bold max-md:tabular-nums",
            // Money runs to "550,000.00 SDG"; at 18px it overflows a half-width
            // cell and the symbol breaks across lines, so long figures step down.
            String(value).length > 10
              ? "max-md:text-base max-md:leading-6"
              : "max-md:text-lg max-md:leading-7"
          )}
        >
          {value}
        </h2>
        {description && (
          <p className="muted max-md:line-clamp-2 max-md:leading-4">
            <small>{description}</small>
          </p>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * FeatureCard Component
 * Action card with icon, title, description, and buttons
 * Uses semantic HTML and semantic tokens
 */
interface FeatureAction {
  label: string
  href: string
  count?: number
  /** No route behind this yet: render it disabled rather than as a link that
   *  404s. Pass `comingSoonLabel` on the card to say so. */
  comingSoon?: boolean
}

interface FeatureCardProps {
  title: string
  description: string
  icon?: ElementType
  primaryAction: FeatureAction
  secondaryAction?: FeatureAction
  isPrimary?: boolean // Adds border-primary/20 for emphasis
  /** Translated "Coming soon" (finance.common.comingSoon). */
  comingSoonLabel?: string
}

export function FeatureCard({
  title,
  description,
  icon: Icon,
  primaryAction,
  secondaryAction,
  isPrimary = false,
  comingSoonLabel,
}: FeatureCardProps) {
  const renderAction = (
    action: FeatureAction,
    { primary }: { primary: boolean }
  ) => {
    const label = (
      <>
        {action.label}
        {action.count !== undefined && ` (${action.count})`}
      </>
    )
    const props = primary
      ? { className: "w-full" }
      : {
          variant: "outline" as const,
          className: "w-full",
          size: "sm" as const,
        }

    if (action.comingSoon) {
      return (
        <Button {...props} disabled>
          {label}
          {comingSoonLabel && (
            <span className="text-muted-foreground ms-2 text-xs">
              {comingSoonLabel}
            </span>
          )}
        </Button>
      )
    }

    return (
      <Button {...props} asChild>
        <Link href={action.href}>{label}</Link>
      </Button>
    )
  }

  // Phone: the dashboard's grey card with the reference's pill buttons, side
  // by side — the stacked full-width black bars read as a form's submit, not
  // as doors into a section.
  return (
    <Card
      className={cn(
        isPrimary ? "border-primary/20" : "",
        "max-md:bg-muted max-md:border-0"
      )}
    >
      <CardHeader className="max-md:p-5 max-md:pb-3">
        <CardTitle className="flex items-center gap-2 max-md:text-base">
          {Icon && (
            <Icon className={`h-5 w-5 ${isPrimary ? "text-primary" : ""}`} />
          )}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 max-md:flex max-md:flex-wrap max-md:gap-2 max-md:space-y-0 max-md:px-5 max-md:pb-5 max-md:[&>*]:h-10 max-md:[&>*]:w-auto max-md:[&>*]:rounded-full max-md:[&>*]:px-5">
        {renderAction(primaryAction, { primary: true })}
        {secondaryAction && renderAction(secondaryAction, { primary: false })}
      </CardContent>
    </Card>
  )
}

/**
 * DashboardGrid Component
 * Responsive grid layout for lab sections
 */
interface DashboardGridProps {
  children: ReactNode
  type: "stats" | "features"
}

export function DashboardGrid({ children, type }: DashboardGridProps) {
  // Phone: stats become ONE grey panel, two across, the cells split by 1px
  // hairlines (the gap shows the border colour through) — four stacked
  // bordered cards took a whole screen to say four numbers. A lone last cell
  // spans the row so no empty square is left in the panel.
  const gridClass =
    type === "stats"
      ? "grid gap-4 md:grid-cols-4 max-md:bg-border max-md:grid-cols-2 max-md:gap-px max-md:overflow-hidden max-md:rounded-xl max-md:[&>*:last-child:nth-child(odd)]:col-span-2"
      : "grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-md:gap-3"

  return <div className={gridClass}>{children}</div>
}

/**
 * Dashboard Stats Type Definition
 * Standard interface for lab statistics across all finance modules
 */
export interface DashboardStats {
  // Core counts
  primaryCount: number
  secondaryCount?: number

  // Financial metrics
  totalAmount?: number
  amountSpent?: number
  amountRemaining?: number

  // Calculated metrics
  percentage?: number
  variance?: number
}

/**
 * useDashboardStats Hook Pattern
 *
 * This is a pattern/template for creating module-specific lab data fetching.
 * Each finance sub-block should create its own version following this structure:
 *
 * @example
 * ```tsx
 * export async function getBudgetDashboardStats(schoolId: string): Promise<DashboardStats> {
 *   const [budgetsCount, allocationsCount] = await Promise.all([
 *     db.budget.count({ where: { schoolId, status: 'ACTIVE' } }),
 *     db.budgetAllocation.count({ where: { schoolId } }),
 *   ])
 *
 *   const [budgetAgg, spentAgg] = await Promise.all([
 *     db.budget.aggregate({
 *       where: { schoolId, status: 'ACTIVE' },
 *       _sum: { totalAmount: true },
 *     }),
 *     db.budgetAllocation.aggregate({
 *       where: { schoolId },
 *       _sum: { spent: true },
 *     }),
 *   ])
 *
 *   const totalAmount = budgetAgg._sum?.totalAmount ? Number(budgetAgg._sum.totalAmount) : 0
 *   const amountSpent = spentAgg._sum?.spent ? Number(spentAgg._sum.spent) : 0
 *
 *   return {
 *     primaryCount: budgetsCount,
 *     secondaryCount: allocationsCount,
 *     totalAmount,
 *     amountSpent,
 *     amountRemaining: totalAmount - amountSpent,
 *     percentage: totalAmount > 0 ? (amountSpent / totalAmount) * 100 : 0,
 *   }
 * }
 * ```
 */

/**
 * formatCurrency
 * Formats a WHOLE-unit amount as a localized currency string. Finance amounts
 * (Payment.amount, ledger Decimal(12,2), expense/salary/budget/wallet aggregates)
 * are stored in whole units — do NOT divide by 100. The only callers are the
 * expenses/payroll/budget/wallet dashboards, all of which pass whole-unit sums.
 */
export function formatCurrency(
  amount: number,
  locale: string = "en-US",
  currency: string = "USD"
): string {
  // Latin digits, as every other finance figure renders them: `ar-SA` alone
  // gives Arabic-Indic money beside Latin counts in the same row of cards.
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    numberingSystem: "latn",
  }).format(amount)
}

/**
 * formatPercentage
 * Helper function to format percentages
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}
