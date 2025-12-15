/**
 * Type definitions for Tenants (Schools) feature
 *
 * These types represent the tenant/school domain model used across
 * the operator platform for managing multi-tenant school instances.
 */

import type { School } from "@prisma/client"

/**
 * Base tenant data from School model
 */
export type Tenant = School

/**
 * Tenant with owner information for detail views
 */
export interface TenantWithOwners extends School {
  owners: Array<{
    id: string
    email: string
    name: string | null
  }>
}

/**
 * Tenant usage metrics
 */
export interface TenantMetrics {
  students: number
  teachers: number
  classes: number
  announcements?: number
  attendanceRecords?: number
}

/**
 * Tenant billing information snapshot
 */
export interface TenantBilling {
  planType: string
  outstandingCents: number
  trialEndsAt: string | null
  nextInvoiceDate: string | null
  subscriptionStatus?: "active" | "trialing" | "past_due" | "canceled"
}

/**
 * Tenant invoice summary
 */
export interface TenantInvoice {
  id: string
  number: string
  status: string
  amount: number
  createdAt: string
  dueDate: string | null
}

/**
 * Complete tenant detail including all related data
 */
export interface TenantDetail extends TenantWithOwners {
  metrics: TenantMetrics
  billing: TenantBilling
  recentInvoices: TenantInvoice[]
}

/**
 * Tenant list item for data tables
 */
export interface TenantListItem {
  id: string
  name: string
  domain: string
  planType: string
  isActive: boolean
  createdAt: Date
  trialEndsAt: Date | null
  _count?: {
    users: number
  }
}

/**
 * Plan types available for tenants
 */
export type PlanType = "basic" | "premium" | "enterprise"

/**
 * Tenant status for filtering and display
 */
export type TenantStatus = "active" | "inactive" | "suspended" | "trial"

/**
 * Tenant action types for audit logging
 */
export type TenantActionType =
  | "created"
  | "updated"
  | "activated"
  | "suspended"
  | "plan_changed"
  | "trial_ended"
  | "impersonation_started"
  | "impersonation_stopped"

/**
 * Tenant filter options for search and filtering
 */
export interface TenantFilters {
  search?: string
  planType?: PlanType | ""
  isActive?: boolean | ""
  status?: TenantStatus | ""
  createdAfter?: Date
  createdBefore?: Date
}

/**
 * Tenant sort options
 */
export type TenantSortField = "name" | "domain" | "createdAt" | "planType"

export interface TenantSortOptions {
  field: TenantSortField
  direction: "asc" | "desc"
}
