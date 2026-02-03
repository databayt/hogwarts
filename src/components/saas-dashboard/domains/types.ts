/**
 * Type definitions for Domains feature
 *
 * These types represent custom domain requests and domain management.
 */

import type { DomainRequest } from "@prisma/client"

/**
 * Base domain request data from Prisma model
 */
export type DomainRequestData = DomainRequest

/**
 * Domain request with school information
 */
export interface DomainRequestWithSchool extends DomainRequest {
  school: {
    id: string
    name: string
    domain: string
  }
}

/**
 * Domain request list item for data tables
 */
export interface DomainRequestListItem {
  id: string
  domain: string
  schoolName: string
  status: DomainStatus
  createdAt: string
  verifiedAt: string | null
}

/**
 * Domain status enum
 */
export type DomainStatus = "pending" | "approved" | "rejected" | "verified"

/**
 * Domain verification status
 */
export interface DomainVerification {
  isVerified: boolean
  verifiedAt: Date | null
  dnsRecords?: DNSRecord[]
  lastChecked?: Date
}

/**
 * DNS record for domain verification
 */
export interface DNSRecord {
  type: "A" | "CNAME" | "TXT" | "MX"
  name: string
  value: string
  ttl?: number
  priority?: number
}

/**
 * Domain request detail with all related data
 */
export interface DomainRequestDetail extends DomainRequestWithSchool {
  verification?: DomainVerification
  history?: DomainHistory[]
}

/**
 * Domain history entry
 */
export interface DomainHistory {
  id: string
  action: DomainActionType
  performedBy: string
  performedAt: Date
  notes?: string
}

/**
 * Domain action types for audit logging
 */
export type DomainActionType =
  | "requested"
  | "approved"
  | "rejected"
  | "verified"
  | "verification_failed"
  | "removed"

/**
 * Domain filter options
 */
export interface DomainFilters {
  search?: string
  domain?: string
  schoolName?: string
  status?: DomainStatus | ""
  createdAfter?: Date
  createdBefore?: Date
  verifiedOnly?: boolean
}

/**
 * Domain sort options
 */
export type DomainSortField =
  | "domain"
  | "schoolName"
  | "status"
  | "createdAt"
  | "verifiedAt"

export interface DomainSortOptions {
  field: DomainSortField
  direction: "asc" | "desc"
}

/**
 * Domain validation result
 */
export interface DomainValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * DNS configuration for custom domains
 */
export interface DNSConfiguration {
  requiredRecords: DNSRecord[]
  optionalRecords: DNSRecord[]
  instructions: string
}
