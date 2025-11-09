/**
 * Type definitions for Observability feature
 *
 * These types represent audit logs, metrics, and monitoring data.
 */

import type { AuditLog } from "@prisma/client";

/**
 * Base audit log data from Prisma model
 */
export type AuditLogData = AuditLog;

/**
 * Unified log entry from multiple providers (DB, HTTP)
 */
export interface UnifiedLog {
  id: string;
  createdAt: Date;
  userId: string;
  schoolId: string | null;
  action: string;
  reason: string | null;
  ip: string | null;
  userEmail?: string | null;
  schoolName?: string | null;
  level?: string | null;
  requestId?: string | null;
}

/**
 * Audit log with user and school information
 */
export interface AuditLogWithRelations extends AuditLog {
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  school?: {
    id: string;
    name: string;
    domain: string;
  } | null;
}

/**
 * Audit log list item for data tables
 */
export interface AuditLogListItem {
  id: string;
  action: string;
  userId: string;
  userEmail: string | null;
  schoolId: string | null;
  schoolName: string | null;
  ip: string | null;
  level: string | null;
  requestId: string | null;
  reason: string | null;
  createdAt: string;
}

/**
 * Log level enum
 */
export type LogLevel = "info" | "warn" | "error" | "debug";

/**
 * Log action categories
 */
export type LogActionCategory =
  | "auth"
  | "user"
  | "tenant"
  | "billing"
  | "domain"
  | "system"
  | "security"
  | "data";

/**
 * Log filter options
 */
export interface LogFilters {
  page: number;
  perPage: number;
  action?: string;
  ip?: string;
  from?: number | string;
  to?: number | string;
  level?: string;
  requestId?: string;
  tenantId?: string;
  userId?: string;
}

/**
 * Log sort options
 */
export type LogSortField = "createdAt" | "action" | "userEmail" | "level";

export interface LogSortOptions {
  field: LogSortField;
  direction: "asc" | "desc";
}

/**
 * System metrics
 */
export interface SystemMetrics {
  cpu: MetricValue;
  memory: MetricValue;
  disk: MetricValue;
  network: NetworkMetrics;
}

/**
 * Metric value with current and historical data
 */
export interface MetricValue {
  current: number;
  unit: string;
  trend?: "up" | "down" | "stable";
  history?: MetricDataPoint[];
}

/**
 * Network metrics
 */
export interface NetworkMetrics {
  inbound: MetricValue;
  outbound: MetricValue;
  latency: MetricValue;
}

/**
 * Metric data point for time series
 */
export interface MetricDataPoint {
  timestamp: Date;
  value: number;
}

/**
 * Application metrics
 */
export interface ApplicationMetrics {
  activeUsers: number;
  requestsPerMinute: number;
  errorRate: number;
  averageResponseTime: number;
}

/**
 * Database metrics
 */
export interface DatabaseMetrics {
  connections: number;
  queries: number;
  averageQueryTime: number;
  slowQueries: number;
}

/**
 * Metrics summary for lab
 */
export interface MetricsSummary {
  system: SystemMetrics;
  application: ApplicationMetrics;
  database: DatabaseMetrics;
  timestamp: Date;
}

/**
 * Log provider type
 */
export type LogProvider = "db" | "http";

/**
 * Log provider configuration
 */
export interface LogProviderConfig {
  provider: LogProvider;
  baseUrl?: string;
  apiToken?: string;
}

/**
 * Audit trail entry
 */
export interface AuditTrail {
  logs: UnifiedLog[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

/**
 * Error tracking entry
 */
export interface ErrorLog {
  id: string;
  message: string;
  stack: string | null;
  userId: string | null;
  schoolId: string | null;
  url: string;
  userAgent: string | null;
  severity: "low" | "medium" | "high" | "critical";
  resolved: boolean;
  createdAt: Date;
}

/**
 * Performance metric
 */
export interface PerformanceMetric {
  id: string;
  route: string;
  method: string;
  duration: number;
  status: number;
  timestamp: Date;
}

/**
 * Security event
 */
export interface SecurityEvent {
  id: string;
  type: "login_attempt" | "login_success" | "login_failure" | "password_reset" | "suspicious_activity";
  userId: string | null;
  ip: string;
  userAgent: string | null;
  details: Record<string, unknown>;
  severity: "low" | "medium" | "high" | "critical";
  createdAt: Date;
}
