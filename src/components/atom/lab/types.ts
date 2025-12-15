// Shared TypeScript types for lab atomic components

import * as React from "react"

/**
 * Base variant types using semantic tokens
 */
export type BaseVariant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "muted"

/**
 * Size variants for components
 */
export type ComponentSize = "sm" | "md" | "lg" | "xl"

/**
 * Card size variants (for card templates)
 */
export type CardSize = "sm" | "md" | "lg" | "xl"

/**
 * Trend direction for indicators
 */
export type TrendDirection = "up" | "down" | "neutral"

/**
 * Orientation for dividers and layouts
 */
export type Orientation = "horizontal" | "vertical"

/**
 * Layout variants for composite components
 */
export type LayoutVariant = "vertical" | "horizontal"

/**
 * Chart type for sparkline
 */
export type ChartType = "line" | "bar" | "area"

/**
 * Skeleton layout types for loading states
 */
export type SkeletonLayout = "stat" | "list" | "chart" | "progress" | "media"

/**
 * Trend data structure
 */
export interface TrendData {
  value: number
  direction: TrendDirection
}

/**
 * Stat data structure for multi-stat cards
 */
export interface StatData {
  value: string | number
  label: string
  trend?: TrendData
}

/**
 * List item data structure
 */
export interface ListItemData {
  icon?: React.ReactNode
  title: string
  subtitle?: string
  trailing?: React.ReactNode
  onClick?: () => void
}

/**
 * Comparison metric data structure
 */
export interface ComparisonMetric {
  label: string
  value: string | number
  variant?: BaseVariant
}

/**
 * Media card data structure
 */
export interface MediaCardData {
  media: React.ReactNode
  title: string
  subtitle?: string
  trailing?: React.ReactNode
  onClick?: () => void
}

/**
 * Base props that extend HTML attributes
 */
export interface BaseComponentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

/**
 * Enhanced card props with common features
 */
export interface EnhancedCardProps extends BaseComponentProps {
  /**
   * Card size variant
   * @default "md"
   */
  size?: CardSize
  /**
   * Loading state (shows skeleton)
   */
  loading?: boolean
  /**
   * Click handler for navigation
   */
  onClick?: () => void
  /**
   * Enable hover effect
   * @default false
   */
  hoverable?: boolean
}

/**
 * Grid responsive breakpoints
 */
export interface GridBreakpoints {
  /**
   * Base columns (mobile)
   * @default 1
   */
  base?: number
  /**
   * Tablet breakpoint (md)
   */
  md?: number
  /**
   * Desktop breakpoint (lg)
   */
  lg?: number
  /**
   * Large desktop breakpoint (xl)
   */
  xl?: number
  /**
   * Extra large breakpoint (2xl)
   */
  "2xl"?: number
}
