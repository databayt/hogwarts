"use client"

import * as React from "react"
import { DollarSign, TrendingUp, AlertCircle, Wallet, Receipt, CreditCard } from "lucide-react"
import { TrendingStats } from "../trending-stats"
import { ProgressStats, ProgressStatStacked } from "../progress-stats"
import type { TrendingStatItem, FinanceStatsData, StatsDictionary } from "../types"

interface FinanceStatsProps {
  /** Finance data */
  data: FinanceStatsData
  /** Currency symbol */
  currency?: string
  /** Dictionary for i18n */
  dictionary?: StatsDictionary
  /** Loading state */
  loading?: boolean
  /** Click handler for stat items */
  onItemClick?: (item: TrendingStatItem, index: number) => void
  /** Additional CSS classes */
  className?: string
}

/**
 * FinanceStats - Pre-configured stats for finance dashboards
 *
 * @example
 * ```tsx
 * <FinanceStats
 *   data={{
 *     totalRevenue: 125000,
 *     revenueChange: 8.5,
 *     outstanding: 15000,
 *     outstandingChange: -12,
 *     collectionRate: 88,
 *   }}
 *   currency="$"
 * />
 * ```
 */
export function FinanceStats({
  data,
  currency = "$",
  dictionary,
  loading = false,
  onItemClick,
  className,
}: FinanceStatsProps) {
  const labels = dictionary?.labels || {}

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `${currency}${(value / 1000000).toFixed(1)}M`
    }
    if (value >= 1000) {
      return `${currency}${(value / 1000).toFixed(1)}K`
    }
    return `${currency}${value.toLocaleString()}`
  }

  const items: TrendingStatItem[] = [
    ...(data.totalRevenue !== undefined
      ? [{
          label: labels.totalRevenue || "Total Revenue",
          value: formatCurrency(data.totalRevenue),
          change: data.revenueChange,
          changeType: (data.revenueChange ?? 0) >= 0 ? "positive" as const : "negative" as const,
          icon: <DollarSign className="h-4 w-4" />,
        }]
      : []),
    ...(data.outstanding !== undefined
      ? [{
          label: labels.outstanding || "Outstanding",
          value: formatCurrency(data.outstanding),
          change: data.outstandingChange,
          // For outstanding, negative change is good
          changeType: (data.outstandingChange ?? 0) <= 0 ? "positive" as const : "negative" as const,
          icon: <AlertCircle className="h-4 w-4" />,
        }]
      : []),
    ...(data.collectionRate !== undefined
      ? [{
          label: labels.collectionRate || "Collection Rate",
          value: `${data.collectionRate}%`,
          change: data.collectionChange,
          changeType: (data.collectionChange ?? 0) >= 0 ? "positive" as const : "negative" as const,
          icon: <TrendingUp className="h-4 w-4" />,
        }]
      : []),
    ...(data.custom || []),
  ]

  return (
    <TrendingStats
      items={items}
      variant="badges"
      loading={loading}
      dictionary={dictionary}
      onItemClick={onItemClick}
      className={className}
    />
  )
}

interface AccountantDashboardStatsProps {
  /** Total fees collected */
  feesCollected: number
  /** Fees collected change */
  feesChange?: number
  /** Pending payments */
  pendingPayments: number
  /** Pending change */
  pendingChange?: number
  /** Total invoices generated */
  invoicesGenerated: number
  /** Overdue payments */
  overduePayments: number
  /** Currency symbol */
  currency?: string
  /** Dictionary for i18n */
  dictionary?: {
    feesCollected?: string
    pendingPayments?: string
    invoicesGenerated?: string
    overduePayments?: string
  }
  /** Loading state */
  loading?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * AccountantDashboardStats - Pre-configured stats for accountant dashboard
 */
export function AccountantDashboardStats({
  feesCollected,
  feesChange,
  pendingPayments,
  pendingChange,
  invoicesGenerated,
  overduePayments,
  currency = "$",
  dictionary,
  loading = false,
  className,
}: AccountantDashboardStatsProps) {
  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `${currency}${(value / 1000).toFixed(1)}K`
    }
    return `${currency}${value.toLocaleString()}`
  }

  const items: TrendingStatItem[] = [
    {
      label: dictionary?.feesCollected || "Fees Collected",
      value: formatCurrency(feesCollected),
      change: feesChange,
      changeType: (feesChange ?? 0) >= 0 ? "positive" : "negative",
      icon: <Wallet className="h-4 w-4" />,
    },
    {
      label: dictionary?.pendingPayments || "Pending Payments",
      value: formatCurrency(pendingPayments),
      change: pendingChange,
      changeType: (pendingChange ?? 0) <= 0 ? "positive" : "negative",
      icon: <CreditCard className="h-4 w-4" />,
    },
    {
      label: dictionary?.invoicesGenerated || "Invoices Generated",
      value: invoicesGenerated,
      icon: <Receipt className="h-4 w-4" />,
    },
    {
      label: dictionary?.overduePayments || "Overdue Payments",
      value: overduePayments,
      icon: <AlertCircle className="h-4 w-4" />,
      variant: overduePayments > 0 ? "danger" : "default",
    },
  ]

  return (
    <TrendingStats
      items={items}
      variant="default"
      loading={loading}
      className={className}
    />
  )
}

interface RevenueBreakdownProps {
  /** Revenue by category */
  categories: Array<{
    label: string
    amount: number
    color: string
  }>
  /** Total revenue */
  total: number
  /** Title */
  title?: string
  /** Currency symbol */
  currency?: string
  /** Additional CSS classes */
  className?: string
}

/**
 * RevenueBreakdown - Stacked progress view of revenue categories
 */
export function RevenueBreakdown({
  categories,
  total,
  title = "Revenue Breakdown",
  currency = "$",
  className,
}: RevenueBreakdownProps) {
  const items = categories.map(cat => ({
    label: cat.label,
    value: cat.amount,
    color: cat.color,
  }))

  return (
    <ProgressStatStacked
      items={items}
      total={total}
      title={title}
      className={className}
    />
  )
}

interface CollectionProgressProps {
  /** Collected amount */
  collected: number
  /** Target/expected amount */
  target: number
  /** Outstanding amount */
  outstanding: number
  /** Currency symbol */
  currency?: string
  /** Dictionary for i18n */
  dictionary?: {
    collected?: string
    target?: string
    outstanding?: string
    collectionProgress?: string
  }
  /** Additional CSS classes */
  className?: string
}

/**
 * CollectionProgress - Progress stats for fee collection
 */
export function CollectionProgress({
  collected,
  target,
  outstanding,
  currency = "$",
  dictionary,
  className,
}: CollectionProgressProps) {
  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `${currency}${(value / 1000).toFixed(1)}K`
    }
    return `${currency}${value.toLocaleString()}`
  }

  const collectionRate = target > 0 ? (collected / target) * 100 : 0
  const outstandingRate = target > 0 ? (outstanding / target) * 100 : 0

  return (
    <ProgressStats
      title={dictionary?.collectionProgress || "Collection Progress"}
      items={[
        {
          label: dictionary?.collected || "Collected",
          value: formatCurrency(collected),
          limit: formatCurrency(target),
          percentage: collectionRate,
          variant: collectionRate >= 80 ? "success" : collectionRate >= 60 ? "warning" : "danger",
        },
        {
          label: dictionary?.outstanding || "Outstanding",
          value: formatCurrency(outstanding),
          limit: formatCurrency(target),
          percentage: outstandingRate,
          variant: outstandingRate <= 20 ? "success" : outstandingRate <= 40 ? "warning" : "danger",
        },
      ]}
      grid={{ mobile: 1, tablet: 2, desktop: 2 }}
      className={className}
    />
  )
}
