/**
 * Utility functions for Tenants (Schools) feature
 *
 * Helper functions for tenant data manipulation, formatting, and validation.
 */

import type { PlanType, TenantStatus, TenantMetrics, TenantBilling } from "./type";
import { PLAN_TYPE_LABELS, TENANT_STATUS_LABELS, PLAN_LIMITS, VALIDATION_RULES } from "./config";

/**
 * Format tenant domain as full URL
 */
export function formatTenantUrl(domain: string, baseUrl = "schoolapp.com"): string {
  return `https://${domain}.${baseUrl}`;
}

/**
 * Get plan type display label
 */
export function getPlanTypeLabel(planType: string): string {
  return PLAN_TYPE_LABELS[planType as PlanType] || planType;
}

/**
 * Get tenant status label
 */
export function getTenantStatusLabel(status: TenantStatus): string {
  return TENANT_STATUS_LABELS[status];
}

/**
 * Check if tenant is on trial
 */
export function isTenantOnTrial(trialEndsAt: Date | string | null): boolean {
  if (!trialEndsAt) return false;
  const trialDate = typeof trialEndsAt === "string" ? new Date(trialEndsAt) : trialEndsAt;
  return trialDate > new Date();
}

/**
 * Get days remaining in trial
 */
export function getTrialDaysRemaining(trialEndsAt: Date | string | null): number {
  if (!trialEndsAt) return 0;
  const trialDate = typeof trialEndsAt === "string" ? new Date(trialEndsAt) : trialEndsAt;
  const now = new Date();
  const diffTime = trialDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Format trial status for display
 */
export function formatTrialStatus(trialEndsAt: Date | string | null): string {
  if (!trialEndsAt) return "No trial";

  const daysRemaining = getTrialDaysRemaining(trialEndsAt);

  if (daysRemaining <= 0) return "Trial ended";
  if (daysRemaining === 1) return "1 day remaining";
  return `${daysRemaining} days remaining`;
}

/**
 * Determine tenant status based on isActive and trial
 */
export function getTenantStatus(isActive: boolean, trialEndsAt: Date | string | null): TenantStatus {
  if (!isActive) return "suspended";
  if (isTenantOnTrial(trialEndsAt)) return "trial";
  return "active";
}

/**
 * Check if tenant has reached plan limits
 */
export function hasReachedPlanLimit(
  planType: PlanType,
  metrics: TenantMetrics
): { students: boolean; teachers: boolean } {
  const limits = PLAN_LIMITS[planType];
  return {
    students: metrics.students >= limits.maxStudents,
    teachers: metrics.teachers >= limits.maxTeachers,
  };
}

/**
 * Calculate usage percentage for a limit
 */
export function calculateUsagePercentage(current: number, max: number): number {
  if (max === Infinity) return 0;
  return Math.round((current / max) * 100);
}

/**
 * Format currency amount from cents
 */
export function formatCurrency(cents: number, currency = "USD"): string {
  const amount = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string | null): string {
  if (!date) return "-";
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(dateObj);
}

/**
 * Format date with time
 */
export function formatDateTime(date: Date | string | null): string {
  if (!date) return "-";
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dateObj);
}

/**
 * Validate domain format
 */
export function isValidDomain(domain: string): boolean {
  if (domain.length < VALIDATION_RULES.DOMAIN_MIN_LENGTH) return false;
  if (domain.length > VALIDATION_RULES.DOMAIN_MAX_LENGTH) return false;
  return VALIDATION_RULES.DOMAIN_PATTERN.test(domain);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  return VALIDATION_RULES.EMAIL_PATTERN.test(email);
}

/**
 * Validate phone format
 */
export function isValidPhone(phone: string): boolean {
  return VALIDATION_RULES.PHONE_PATTERN.test(phone);
}

/**
 * Generate tenant initials for avatar
 */
export function getTenantInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Sort tenants by field
 */
export function sortTenants<T extends { name?: string; domain?: string; createdAt?: Date | string }>(
  tenants: T[],
  field: "name" | "domain" | "createdAt",
  direction: "asc" | "desc" = "asc"
): T[] {
  return [...tenants].sort((a, b) => {
    let aVal = a[field];
    let bVal = b[field];

    if (field === "createdAt") {
      aVal = typeof aVal === "string" ? new Date(aVal).getTime() : (aVal as Date)?.getTime() || 0;
      bVal = typeof bVal === "string" ? new Date(bVal).getTime() : (bVal as Date)?.getTime() || 0;
    }

    if (aVal === undefined || aVal === null) return 1;
    if (bVal === undefined || bVal === null) return -1;

    if (typeof aVal === "string" && typeof bVal === "string") {
      return direction === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }

    if (typeof aVal === "number" && typeof bVal === "number") {
      return direction === "asc" ? aVal - bVal : bVal - aVal;
    }

    return 0;
  });
}

/**
 * Calculate total outstanding balance
 */
export function calculateOutstandingBalance(billing: TenantBilling | null): number {
  return billing?.outstandingCents || 0;
}

/**
 * Check if billing is overdue
 */
export function isBillingOverdue(billing: TenantBilling | null): boolean {
  if (!billing?.nextInvoiceDate) return false;
  const dueDate = new Date(billing.nextInvoiceDate);
  return dueDate < new Date() && (billing.outstandingCents || 0) > 0;
}

/**
 * Get tenant health status
 */
export function getTenantHealth(
  isActive: boolean,
  billing: TenantBilling | null
): "healthy" | "warning" | "critical" {
  if (!isActive) return "critical";
  if (isBillingOverdue(billing)) return "warning";
  return "healthy";
}
