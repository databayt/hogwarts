/**
 * Constants for Observability feature
 *
 * Static configuration data for logs, metrics, and monitoring.
 */

import type { LogLevel, LogActionCategory } from "./types";

/**
 * Available log levels
 */
export const LOG_LEVELS: readonly LogLevel[] = ["debug", "info", "warn", "error"] as const;

/**
 * Log level display labels
 */
export const LOG_LEVEL_LABELS: Record<LogLevel, string> = {
  debug: "Debug",
  info: "Info",
  warn: "Warning",
  error: "Error",
} as const;

/**
 * Log level badge variants
 */
export const LOG_LEVEL_VARIANTS: Record<LogLevel, "default" | "secondary" | "destructive" | "outline"> = {
  debug: "outline",
  info: "secondary",
  warn: "default",
  error: "destructive",
} as const;

/**
 * Log action categories
 */
export const LOG_ACTION_CATEGORIES: readonly LogActionCategory[] = [
  "auth",
  "user",
  "tenant",
  "billing",
  "domain",
  "system",
  "security",
  "data",
] as const;

/**
 * Action category display labels
 */
export const ACTION_CATEGORY_LABELS: Record<LogActionCategory, string> = {
  auth: "Authentication",
  user: "User Management",
  tenant: "Tenant Management",
  billing: "Billing",
  domain: "Domain",
  system: "System",
  security: "Security",
  data: "Data Operations",
} as const;

/**
 * Common audit actions
 */
export const COMMON_ACTIONS = {
  // Auth
  LOGIN: "login",
  LOGOUT: "logout",
  REGISTER: "register",
  PASSWORD_RESET: "password_reset",

  // Tenant
  TENANT_CREATED: "tenant_created",
  TENANT_UPDATED: "tenant_updated",
  TENANT_SUSPENDED: "tenant_suspended",
  TENANT_ACTIVATED: "tenant_activated",

  // User
  USER_CREATED: "user_created",
  USER_UPDATED: "user_updated",
  USER_DELETED: "user_deleted",

  // Billing
  INVOICE_CREATED: "invoice_created",
  INVOICE_PAID: "invoice_paid",
  INVOICE_VOIDED: "invoice_voided",

  // Domain
  DOMAIN_REQUESTED: "domain_requested",
  DOMAIN_APPROVED: "domain_approved",
  DOMAIN_REJECTED: "domain_rejected",
  DOMAIN_VERIFIED: "domain_verified",

  // Security
  IMPERSONATION_STARTED: "impersonation_started",
  IMPERSONATION_STOPPED: "impersonation_stopped",
  PERMISSION_CHANGED: "permission_changed",
} as const;

/**
 * Default pagination options
 */
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [20, 50, 100, 200] as const;

/**
 * Log table column IDs
 */
export const LOG_TABLE_COLUMNS = {
  TIMESTAMP: "createdAt",
  ACTION: "action",
  USER: "userEmail",
  TENANT: "schoolName",
  IP: "ip",
  LEVEL: "level",
  REQUEST_ID: "requestId",
  REASON: "reason",
} as const;

/**
 * Sortable columns
 */
export const SORTABLE_COLUMNS = [
  LOG_TABLE_COLUMNS.TIMESTAMP,
  LOG_TABLE_COLUMNS.ACTION,
  LOG_TABLE_COLUMNS.USER,
  LOG_TABLE_COLUMNS.LEVEL,
] as const;

/**
 * Filterable columns
 */
export const FILTERABLE_COLUMNS = [
  LOG_TABLE_COLUMNS.ACTION,
  LOG_TABLE_COLUMNS.USER,
  LOG_TABLE_COLUMNS.TENANT,
  LOG_TABLE_COLUMNS.IP,
  LOG_TABLE_COLUMNS.LEVEL,
  LOG_TABLE_COLUMNS.REQUEST_ID,
] as const;

/**
 * Date range presets (in milliseconds)
 */
export const DATE_RANGE_PRESETS = {
  LAST_HOUR: 60 * 60 * 1000,
  LAST_24_HOURS: 24 * 60 * 60 * 1000,
  LAST_7_DAYS: 7 * 24 * 60 * 60 * 1000,
  LAST_30_DAYS: 30 * 24 * 60 * 60 * 1000,
  LAST_90_DAYS: 90 * 24 * 60 * 60 * 1000,
} as const;

/**
 * Metrics refresh intervals (in milliseconds)
 */
export const METRICS_REFRESH_INTERVAL = {
  REALTIME: 5000, // 5 seconds
  FAST: 30000, // 30 seconds
  NORMAL: 60000, // 1 minute
  SLOW: 300000, // 5 minutes
} as const;

/**
 * Performance thresholds
 */
export const PERFORMANCE_THRESHOLDS = {
  RESPONSE_TIME_WARNING: 1000, // 1 second
  RESPONSE_TIME_CRITICAL: 3000, // 3 seconds
  ERROR_RATE_WARNING: 0.01, // 1%
  ERROR_RATE_CRITICAL: 0.05, // 5%
  CPU_WARNING: 70, // 70%
  CPU_CRITICAL: 90, // 90%
  MEMORY_WARNING: 80, // 80%
  MEMORY_CRITICAL: 95, // 95%
} as const;

/**
 * Log retention periods (in days)
 */
export const LOG_RETENTION = {
  DEBUG: 7,
  INFO: 30,
  WARN: 90,
  ERROR: 365,
} as const;

/**
 * Security event severity levels
 */
export const SEVERITY_LEVELS = ["low", "medium", "high", "critical"] as const;

/**
 * Severity badge variants
 */
export const SEVERITY_VARIANTS: Record<
  "low" | "medium" | "high" | "critical",
  "default" | "secondary" | "destructive" | "outline"
> = {
  low: "outline",
  medium: "secondary",
  high: "default",
  critical: "destructive",
} as const;

/**
 * Log provider options
 */
export const LOG_PROVIDERS = {
  DATABASE: "db",
  HTTP: "http",
} as const;

/**
 * Chart colors for metrics
 */
export const CHART_COLORS = {
  PRIMARY: "hsl(var(--primary))",
  SUCCESS: "hsl(142 76% 36%)",
  WARNING: "hsl(38 92% 50%)",
  ERROR: "hsl(0 84% 60%)",
  INFO: "hsl(199 89% 48%)",
} as const;

/**
 * Metric unit labels
 */
export const METRIC_UNITS = {
  PERCENT: "%",
  MB: "MB",
  GB: "GB",
  MS: "ms",
  SECONDS: "s",
  REQUESTS: "req/min",
  QUERIES: "q/min",
} as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  LOGS_FETCH_FAILED: "Failed to fetch logs",
  METRICS_FETCH_FAILED: "Failed to fetch metrics",
  PROVIDER_NOT_CONFIGURED: "Log provider not properly configured",
  INVALID_DATE_RANGE: "Invalid date range",
  EXPORT_FAILED: "Failed to export logs",
} as const;

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  LOGS_EXPORTED: "Logs exported successfully",
  METRICS_REFRESHED: "Metrics refreshed",
  FILTER_APPLIED: "Filter applied",
} as const;
