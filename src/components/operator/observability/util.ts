/**
 * Utility functions for Observability feature
 *
 * Helper functions for log processing, metrics calculation, and monitoring utilities.
 */

import {
  ACTION_CATEGORY_LABELS,
  COMMON_ACTIONS,
  DATE_RANGE_PRESETS,
  LOG_LEVEL_LABELS,
  PERFORMANCE_THRESHOLDS,
} from "./config"
import type {
  LogActionCategory,
  LogLevel,
  MetricValue,
  UnifiedLog,
} from "./types"

/**
 * Get log level label
 */
export function getLogLevelLabel(level: LogLevel): string {
  return LOG_LEVEL_LABELS[level]
}

/**
 * Get action category from action string
 */
export function getActionCategory(action: string): LogActionCategory {
  const lowerAction = action.toLowerCase()

  if (
    lowerAction.includes("login") ||
    lowerAction.includes("logout") ||
    lowerAction.includes("auth")
  ) {
    return "auth"
  }
  if (lowerAction.includes("user")) return "user"
  if (lowerAction.includes("tenant") || lowerAction.includes("school"))
    return "tenant"
  if (
    lowerAction.includes("invoice") ||
    lowerAction.includes("billing") ||
    lowerAction.includes("payment")
  ) {
    return "billing"
  }
  if (lowerAction.includes("domain")) return "domain"
  if (
    lowerAction.includes("security") ||
    lowerAction.includes("permission") ||
    lowerAction.includes("impersonation")
  ) {
    return "security"
  }
  if (
    lowerAction.includes("create") ||
    lowerAction.includes("update") ||
    lowerAction.includes("delete")
  ) {
    return "data"
  }

  return "system"
}

/**
 * Get action category label
 */
export function getActionCategoryLabel(category: LogActionCategory): string {
  return ACTION_CATEGORY_LABELS[category]
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(d)
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) return "Just now"
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return formatTimestamp(d)
}

/**
 * Format duration in milliseconds
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`
  if (ms < 3600000) return `${(ms / 60000).toFixed(2)}m`
  return `${(ms / 3600000).toFixed(2)}h`
}

/**
 * Format byte size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"

  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * Format percentage
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`
}

/**
 * Parse IP address details
 */
export function parseIPAddress(ip: string): {
  version: "IPv4" | "IPv6" | "unknown"
  isPrivate: boolean
} {
  if (!ip) return { version: "unknown", isPrivate: false }

  // IPv4 pattern
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/
  // IPv6 pattern
  const ipv6Pattern = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::)$/

  if (ipv4Pattern.test(ip)) {
    const parts = ip.split(".").map(Number)
    const isPrivate =
      parts[0] === 10 ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 192 && parts[1] === 168) ||
      parts[0] === 127
    return { version: "IPv4", isPrivate }
  }

  if (ipv6Pattern.test(ip)) {
    const isPrivate =
      ip.startsWith("fe80:") || ip.startsWith("fc") || ip === "::1"
    return { version: "IPv6", isPrivate }
  }

  return { version: "unknown", isPrivate: false }
}

/**
 * Get date range from preset
 */
export function getDateRangeFromPreset(
  preset: keyof typeof DATE_RANGE_PRESETS
): { from: Date; to: Date } {
  const now = new Date()
  const from = new Date(now.getTime() - DATE_RANGE_PRESETS[preset])
  return { from, to: now }
}

/**
 * Calculate metric trend
 */
export function calculateTrend(
  current: number,
  previous: number
): "up" | "down" | "stable" {
  const threshold = 0.05 // 5% change threshold
  const change = (current - previous) / previous

  if (Math.abs(change) < threshold) return "stable"
  return change > 0 ? "up" : "down"
}

/**
 * Check if metric is within threshold
 */
export function isMetricHealthy(
  value: number,
  max: number,
  warnThreshold?: number,
  critThreshold?: number
): {
  status: "healthy" | "warning" | "critical"
  percentage: number
} {
  const percentage = (value / max) * 100

  if (critThreshold && percentage >= critThreshold) {
    return { status: "critical", percentage }
  }
  if (warnThreshold && percentage >= warnThreshold) {
    return { status: "warning", percentage }
  }
  return { status: "healthy", percentage }
}

/**
 * Check response time health
 */
export function getResponseTimeHealth(
  ms: number
): "healthy" | "warning" | "critical" {
  if (ms >= PERFORMANCE_THRESHOLDS.RESPONSE_TIME_CRITICAL) return "critical"
  if (ms >= PERFORMANCE_THRESHOLDS.RESPONSE_TIME_WARNING) return "warning"
  return "healthy"
}

/**
 * Check error rate health
 */
export function getErrorRateHealth(
  rate: number
): "healthy" | "warning" | "critical" {
  if (rate >= PERFORMANCE_THRESHOLDS.ERROR_RATE_CRITICAL) return "critical"
  if (rate >= PERFORMANCE_THRESHOLDS.ERROR_RATE_WARNING) return "warning"
  return "healthy"
}

/**
 * Calculate error rate from total and errors
 */
export function calculateErrorRate(
  totalRequests: number,
  errors: number
): number {
  if (totalRequests === 0) return 0
  return (errors / totalRequests) * 100
}

/**
 * Group logs by time bucket
 */
export function groupLogsByTime(
  logs: UnifiedLog[],
  bucketSize: "minute" | "hour" | "day"
): Map<string, UnifiedLog[]> {
  const grouped = new Map<string, UnifiedLog[]>()

  logs.forEach((log) => {
    const date = new Date(log.createdAt)
    let key: string

    switch (bucketSize) {
      case "minute":
        key = `${date.toISOString().slice(0, 16)}`
        break
      case "hour":
        key = `${date.toISOString().slice(0, 13)}`
        break
      case "day":
        key = `${date.toISOString().slice(0, 10)}`
        break
    }

    if (!grouped.has(key)) {
      grouped.set(key, [])
    }
    grouped.get(key)!.push(log)
  })

  return grouped
}

/**
 * Export logs to CSV
 */
export function exportLogsToCSV(logs: UnifiedLog[]): string {
  const headers = [
    "Timestamp",
    "Action",
    "User",
    "Tenant",
    "IP",
    "Level",
    "Request ID",
    "Reason",
  ]
  const rows = logs.map((log) => [
    formatTimestamp(log.createdAt),
    log.action,
    log.userEmail || log.userId,
    log.schoolName || log.schoolId || "-",
    log.ip || "-",
    log.level || "-",
    log.requestId || "-",
    log.reason || "-",
  ])

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n")

  return csvContent
}

/**
 * Export logs to JSON
 */
export function exportLogsToJSON(logs: UnifiedLog[]): string {
  return JSON.stringify(logs, null, 2)
}

/**
 * Sort logs by field
 */
export function sortLogs(
  logs: UnifiedLog[],
  field: "createdAt" | "action" | "userEmail" | "level",
  direction: "asc" | "desc" = "desc"
): UnifiedLog[] {
  return [...logs].sort((a, b) => {
    const aVal = a[field]
    const bVal = b[field]

    // Handle date fields separately
    if (field === "createdAt") {
      const aTime = new Date(a.createdAt).getTime()
      const bTime = new Date(b.createdAt).getTime()
      return direction === "asc" ? aTime - bTime : bTime - aTime
    }

    if (aVal === undefined || aVal === null) return 1
    if (bVal === undefined || bVal === null) return -1

    if (typeof aVal === "string" && typeof bVal === "string") {
      return direction === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal)
    }

    if (typeof aVal === "number" && typeof bVal === "number") {
      return direction === "asc" ? aVal - bVal : bVal - aVal
    }

    return 0
  })
}

/**
 * Generate unique colors for action categories
 */
export function getActionColor(action: string): string {
  const category = getActionCategory(action)
  const colors: Record<LogActionCategory, string> = {
    auth: "hsl(199 89% 48%)",
    user: "hsl(262 83% 58%)",
    tenant: "hsl(142 76% 36%)",
    billing: "hsl(38 92% 50%)",
    domain: "hsl(280 65% 60%)",
    system: "hsl(215 20% 65%)",
    security: "hsl(0 84% 60%)",
    data: "hsl(173 80% 40%)",
  }
  return colors[category]
}
