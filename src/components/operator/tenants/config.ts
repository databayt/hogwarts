/**
 * Constants for Tenants (Schools) feature
 *
 * Static configuration data, enums, and lookup tables for tenant management.
 */

import type { PlanType, TenantStatus } from "./types";

/**
 * Available subscription plans
 */
export const PLAN_TYPES: readonly PlanType[] = ["basic", "premium", "enterprise"] as const;

/**
 * Plan type display labels
 */
export const PLAN_TYPE_LABELS: Record<PlanType, string> = {
  basic: "Basic",
  premium: "Premium",
  enterprise: "Enterprise",
} as const;

/**
 * Plan type descriptions
 */
export const PLAN_TYPE_DESCRIPTIONS: Record<PlanType, string> = {
  basic: "Up to 100 students, 10 teachers",
  premium: "Up to 500 students, 50 teachers, advanced features",
  enterprise: "Unlimited students and teachers, custom features",
} as const;

/**
 * Plan limits configuration
 */
export const PLAN_LIMITS: Record<PlanType, { maxStudents: number; maxTeachers: number }> = {
  basic: { maxStudents: 100, maxTeachers: 10 },
  premium: { maxStudents: 500, maxTeachers: 50 },
  enterprise: { maxStudents: Infinity, maxTeachers: Infinity },
} as const;

/**
 * Tenant status options
 */
export const TENANT_STATUSES: readonly TenantStatus[] = ["active", "inactive", "suspended", "trial"] as const;

/**
 * Status display labels
 */
export const TENANT_STATUS_LABELS: Record<TenantStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  suspended: "Suspended",
  trial: "Trial",
} as const;

/**
 * Status badge variants for UI components
 */
export const TENANT_STATUS_VARIANTS: Record<TenantStatus, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  inactive: "secondary",
  suspended: "destructive",
  trial: "outline",
} as const;

/**
 * Default trial period in days
 */
export const DEFAULT_TRIAL_DAYS = 14;

/**
 * Default pagination options
 */
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

/**
 * Tenant table column IDs
 */
export const TENANT_TABLE_COLUMNS = {
  NAME: "name",
  DOMAIN: "domain",
  PLAN_TYPE: "planType",
  IS_ACTIVE: "isActive",
  CREATED_AT: "createdAt",
  TRIAL_ENDS_AT: "trialEndsAt",
  ACTIONS: "actions",
} as const;

/**
 * Sortable columns
 */
export const SORTABLE_COLUMNS = [
  TENANT_TABLE_COLUMNS.NAME,
  TENANT_TABLE_COLUMNS.DOMAIN,
  TENANT_TABLE_COLUMNS.PLAN_TYPE,
  TENANT_TABLE_COLUMNS.CREATED_AT,
] as const;

/**
 * Filterable columns
 */
export const FILTERABLE_COLUMNS = [
  TENANT_TABLE_COLUMNS.NAME,
  TENANT_TABLE_COLUMNS.DOMAIN,
  TENANT_TABLE_COLUMNS.PLAN_TYPE,
  TENANT_TABLE_COLUMNS.IS_ACTIVE,
] as const;

/**
 * Action types for audit logging
 */
export const TENANT_ACTIONS = {
  CREATED: "created",
  UPDATED: "updated",
  ACTIVATED: "activated",
  SUSPENDED: "suspended",
  PLAN_CHANGED: "plan_changed",
  TRIAL_ENDED: "trial_ended",
  IMPERSONATION_STARTED: "impersonation_started",
  IMPERSONATION_STOPPED: "impersonation_stopped",
} as const;

/**
 * Default values for new tenants
 */
export const TENANT_DEFAULTS = {
  planType: "basic" as PlanType,
  isActive: true,
  timezone: "Africa/Khartoum",
  maxStudents: 100,
  maxTeachers: 10,
} as const;

/**
 * Validation rules
 */
export const VALIDATION_RULES = {
  DOMAIN_MIN_LENGTH: 3,
  DOMAIN_MAX_LENGTH: 50,
  DOMAIN_PATTERN: /^[a-z0-9-]+$/,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  PHONE_PATTERN: /^\+?[1-9]\d{1,14}$/,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  DOMAIN_INVALID: "Domain must contain only lowercase letters, numbers, and hyphens",
  DOMAIN_TOO_SHORT: `Domain must be at least ${VALIDATION_RULES.DOMAIN_MIN_LENGTH} characters`,
  DOMAIN_TOO_LONG: `Domain must be at most ${VALIDATION_RULES.DOMAIN_MAX_LENGTH} characters`,
  DOMAIN_TAKEN: "This domain is already in use",
  NAME_REQUIRED: "School name is required",
  NAME_TOO_SHORT: `Name must be at least ${VALIDATION_RULES.NAME_MIN_LENGTH} characters`,
  NAME_TOO_LONG: `Name must be at most ${VALIDATION_RULES.NAME_MAX_LENGTH} characters`,
  PHONE_INVALID: "Please enter a valid phone number",
  EMAIL_INVALID: "Please enter a valid email address",
} as const;
