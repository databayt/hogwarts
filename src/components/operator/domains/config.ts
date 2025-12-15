/**
 * Constants for Domains feature
 *
 * Static configuration data, enums, and lookup tables for domain management.
 */

import type { DomainStatus } from "./types"

/**
 * Available domain statuses
 */
export const DOMAIN_STATUSES: readonly DomainStatus[] = [
  "pending",
  "approved",
  "rejected",
  "verified",
] as const

/**
 * Domain status display labels
 */
export const DOMAIN_STATUS_LABELS: Record<DomainStatus, string> = {
  pending: "Pending Review",
  approved: "Approved",
  rejected: "Rejected",
  verified: "Verified",
} as const

/**
 * Domain status badge variants
 */
export const DOMAIN_STATUS_VARIANTS: Record<
  DomainStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "outline",
  approved: "secondary",
  rejected: "destructive",
  verified: "default",
} as const

/**
 * Default pagination options
 */
export const DEFAULT_PAGE_SIZE = 10
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const

/**
 * Domain table column IDs
 */
export const DOMAIN_TABLE_COLUMNS = {
  DOMAIN: "domain",
  SCHOOL_NAME: "schoolName",
  STATUS: "status",
  CREATED_AT: "createdAt",
  VERIFIED_AT: "verifiedAt",
  ACTIONS: "actions",
} as const

/**
 * Sortable columns
 */
export const SORTABLE_COLUMNS = [
  DOMAIN_TABLE_COLUMNS.DOMAIN,
  DOMAIN_TABLE_COLUMNS.SCHOOL_NAME,
  DOMAIN_TABLE_COLUMNS.STATUS,
  DOMAIN_TABLE_COLUMNS.CREATED_AT,
  DOMAIN_TABLE_COLUMNS.VERIFIED_AT,
] as const

/**
 * Filterable columns
 */
export const FILTERABLE_COLUMNS = [
  DOMAIN_TABLE_COLUMNS.DOMAIN,
  DOMAIN_TABLE_COLUMNS.SCHOOL_NAME,
  DOMAIN_TABLE_COLUMNS.STATUS,
] as const

/**
 * Domain action types for audit logging
 */
export const DOMAIN_ACTIONS = {
  REQUESTED: "requested",
  APPROVED: "approved",
  REJECTED: "rejected",
  VERIFIED: "verified",
  VERIFICATION_FAILED: "verification_failed",
  REMOVED: "removed",
} as const

/**
 * Required DNS record types for domain verification
 */
export const REQUIRED_DNS_RECORDS = {
  CNAME: {
    type: "CNAME" as const,
    name: "www",
    value: "cname.schoolapp.com",
    description: "Points your domain to our service",
  },
  TXT: {
    type: "TXT" as const,
    name: "@",
    value: "schoolapp-verification=",
    description: "Verifies domain ownership",
  },
} as const

/**
 * Domain validation rules
 */
export const VALIDATION_RULES = {
  DOMAIN_MIN_LENGTH: 4,
  DOMAIN_MAX_LENGTH: 253,
  LABEL_MAX_LENGTH: 63,
  // RFC 1035 compliant domain pattern
  DOMAIN_PATTERN:
    /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i,
  // Hostname pattern (excludes subdomains)
  HOSTNAME_PATTERN: /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i,
  NOTES_MAX_LENGTH: 500,
} as const

/**
 * Reserved/blacklisted domains and keywords
 */
export const RESERVED_DOMAINS = [
  "localhost",
  "example",
  "test",
  "invalid",
  "local",
] as const

export const RESERVED_KEYWORDS = [
  "www",
  "mail",
  "ftp",
  "admin",
  "api",
  "app",
  "dashboard",
  "portal",
] as const

/**
 * DNS verification timeout (in milliseconds)
 */
export const DNS_VERIFICATION_TIMEOUT = 30000 // 30 seconds

/**
 * DNS verification retry attempts
 */
export const DNS_VERIFICATION_RETRIES = 3

/**
 * Domain request approval auto-expiry (days)
 */
export const APPROVAL_EXPIRY_DAYS = 30

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  DOMAIN_INVALID: "Please enter a valid domain name",
  DOMAIN_TOO_SHORT: `Domain must be at least ${VALIDATION_RULES.DOMAIN_MIN_LENGTH} characters`,
  DOMAIN_TOO_LONG: `Domain must be at most ${VALIDATION_RULES.DOMAIN_MAX_LENGTH} characters`,
  DOMAIN_RESERVED: "This domain or keyword is reserved and cannot be used",
  DOMAIN_EXISTS: "This domain is already registered",
  DOMAIN_NOT_FOUND: "Domain request not found",
  VERIFICATION_FAILED:
    "Domain verification failed. Please check your DNS records.",
  VERIFICATION_TIMEOUT: "Domain verification timed out. Please try again.",
  ALREADY_APPROVED: "This domain request is already approved",
  ALREADY_REJECTED: "This domain request is already rejected",
  ALREADY_VERIFIED: "This domain is already verified",
  INVALID_STATUS: "Invalid domain status",
  NOTES_TOO_LONG: `Notes must be at most ${VALIDATION_RULES.NOTES_MAX_LENGTH} characters`,
} as const

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  REQUEST_CREATED: "Domain request submitted successfully",
  REQUEST_APPROVED: "Domain request approved",
  REQUEST_REJECTED: "Domain request rejected",
  DOMAIN_VERIFIED: "Domain verified successfully",
  REQUEST_REMOVED: "Domain request removed",
} as const

/**
 * DNS propagation time estimate (hours)
 */
export const DNS_PROPAGATION_TIME = 24 // 24 hours

/**
 * Domain status transitions
 */
export const ALLOWED_STATUS_TRANSITIONS: Record<DomainStatus, DomainStatus[]> =
  {
    pending: ["approved", "rejected"],
    approved: ["verified", "rejected"],
    rejected: ["pending"],
    verified: [],
  } as const
