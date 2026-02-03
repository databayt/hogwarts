/**
 * Utility functions for Domains feature
 *
 * Helper functions for domain validation, DNS management, and status handling.
 */

import {
  ALLOWED_STATUS_TRANSITIONS,
  DNS_PROPAGATION_TIME,
  DOMAIN_STATUS_LABELS,
  ERROR_MESSAGES,
  RESERVED_DOMAINS,
  RESERVED_KEYWORDS,
  VALIDATION_RULES,
} from "./config"
import type { DNSRecord, DomainStatus, DomainValidationResult } from "./types"

/**
 * Get domain status label
 */
export function getDomainStatusLabel(status: DomainStatus): string {
  return DOMAIN_STATUS_LABELS[status]
}

/**
 * Validate domain format
 */
export function isValidDomainFormat(domain: string): boolean {
  if (!domain) return false
  if (domain.length < VALIDATION_RULES.DOMAIN_MIN_LENGTH) return false
  if (domain.length > VALIDATION_RULES.DOMAIN_MAX_LENGTH) return false

  return VALIDATION_RULES.DOMAIN_PATTERN.test(domain)
}

/**
 * Check if domain is reserved
 */
export function isReservedDomain(domain: string): boolean {
  const lowerDomain = domain.toLowerCase()

  // Check if full domain is reserved
  if (
    RESERVED_DOMAINS.some(
      (reserved) =>
        lowerDomain === reserved || lowerDomain.endsWith(`.${reserved}`)
    )
  ) {
    return true
  }

  // Check if any part of the domain contains reserved keywords
  const parts = lowerDomain.split(".")
  return parts.some((part) =>
    RESERVED_KEYWORDS.includes(part as (typeof RESERVED_KEYWORDS)[number])
  )
}

/**
 * Validate domain with detailed error messages
 */
export function validateDomain(domain: string): DomainValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!domain || domain.trim() === "") {
    errors.push("Domain is required")
    return { isValid: false, errors, warnings }
  }

  const trimmedDomain = domain.trim().toLowerCase()

  if (trimmedDomain.length < VALIDATION_RULES.DOMAIN_MIN_LENGTH) {
    errors.push(ERROR_MESSAGES.DOMAIN_TOO_SHORT)
  }

  if (trimmedDomain.length > VALIDATION_RULES.DOMAIN_MAX_LENGTH) {
    errors.push(ERROR_MESSAGES.DOMAIN_TOO_LONG)
  }

  if (!VALIDATION_RULES.DOMAIN_PATTERN.test(trimmedDomain)) {
    errors.push(ERROR_MESSAGES.DOMAIN_INVALID)
  }

  if (isReservedDomain(trimmedDomain)) {
    errors.push(ERROR_MESSAGES.DOMAIN_RESERVED)
  }

  // Check for label length (each part between dots)
  const labels = trimmedDomain.split(".")
  labels.forEach((label, index) => {
    if (label.length > VALIDATION_RULES.LABEL_MAX_LENGTH) {
      errors.push(
        `Label "${label}" exceeds maximum length of ${VALIDATION_RULES.LABEL_MAX_LENGTH} characters`
      )
    }
    if (label.startsWith("-") || label.endsWith("-")) {
      errors.push(`Label "${label}" cannot start or end with a hyphen`)
    }
  })

  // Warnings
  if (labels.length === 2) {
    warnings.push(
      "Consider using a subdomain (e.g., school.yourdomain.com) for better organization"
    )
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Normalize domain (remove protocol, www, trailing slash)
 */
export function normalizeDomain(domain: string): string {
  let normalized = domain.trim().toLowerCase()

  // Remove protocol
  normalized = normalized.replace(/^https?:\/\//, "")

  // Remove www
  normalized = normalized.replace(/^www\./, "")

  // Remove trailing slash
  normalized = normalized.replace(/\/$/, "")

  // Remove port if present
  normalized = normalized.replace(/:\d+$/, "")

  return normalized
}

/**
 * Extract subdomain from domain
 */
export function extractSubdomain(domain: string): string | null {
  const parts = domain.split(".")
  if (parts.length <= 2) return null
  return parts[0]
}

/**
 * Extract root domain from domain
 */
export function extractRootDomain(domain: string): string {
  const parts = domain.split(".")
  if (parts.length <= 2) return domain
  return parts.slice(-2).join(".")
}

/**
 * Generate verification token for domain
 */
export function generateVerificationToken(
  schoolId: string,
  domain: string
): string {
  // In production, this should use a secure hash
  const timestamp = Date.now()
  const combined = `${schoolId}-${domain}-${timestamp}`
  // This is a simple example - use crypto in production
  return Buffer.from(combined).toString("base64").substring(0, 32)
}

/**
 * Format DNS record for display
 */
export function formatDNSRecord(record: DNSRecord): string {
  const parts = [record.type, record.name, record.value]
  if (record.ttl) parts.push(`TTL: ${record.ttl}`)
  if (record.priority) parts.push(`Priority: ${record.priority}`)
  return parts.join(" ")
}

/**
 * Get DNS propagation time estimate
 */
export function getDNSPropagationEstimate(): string {
  return `Up to ${DNS_PROPAGATION_TIME} hours`
}

/**
 * Format domain status for display
 */
export function formatDomainStatus(
  status: DomainStatus,
  verifiedAt: Date | string | null
): string {
  if (status === "verified" && verifiedAt) {
    const date =
      typeof verifiedAt === "string" ? new Date(verifiedAt) : verifiedAt
    return `Verified on ${new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date)}`
  }

  return DOMAIN_STATUS_LABELS[status]
}

/**
 * Check if domain can transition to new status
 */
export function canTransitionStatus(
  currentStatus: DomainStatus,
  newStatus: DomainStatus
): boolean {
  return ALLOWED_STATUS_TRANSITIONS[currentStatus].includes(newStatus)
}

/**
 * Get allowed status transitions
 */
export function getAllowedTransitions(
  currentStatus: DomainStatus
): DomainStatus[] {
  return ALLOWED_STATUS_TRANSITIONS[currentStatus]
}

/**
 * Sort domains by field
 */
export function sortDomains<
  T extends {
    domain?: string
    schoolName?: string
    status?: string
    createdAt?: Date | string
    verifiedAt?: Date | string | null
  },
>(
  domains: T[],
  field: "domain" | "schoolName" | "status" | "createdAt" | "verifiedAt",
  direction: "asc" | "desc" = "asc"
): T[] {
  return [...domains].sort((a, b) => {
    const aVal = a[field]
    const bVal = b[field]

    // Handle date fields separately
    if (field === "createdAt" || field === "verifiedAt") {
      const aTime = aVal
        ? typeof aVal === "string"
          ? new Date(aVal).getTime()
          : (aVal as Date).getTime()
        : 0
      const bTime = bVal
        ? typeof bVal === "string"
          ? new Date(bVal).getTime()
          : (bVal as Date).getTime()
        : 0
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
 * Check if domain is pending approval
 */
export function isPendingApproval(status: DomainStatus): boolean {
  return status === "pending"
}

/**
 * Check if domain is approved but not verified
 */
export function isApprovedNotVerified(status: DomainStatus): boolean {
  return status === "approved"
}

/**
 * Check if domain is fully verified
 */
export function isVerified(status: DomainStatus): boolean {
  return status === "verified"
}

/**
 * Check if domain is rejected
 */
export function isRejected(status: DomainStatus): boolean {
  return status === "rejected"
}

/**
 * Get domain health status
 */
export function getDomainHealth(
  status: DomainStatus
): "healthy" | "warning" | "critical" {
  if (status === "verified") return "healthy"
  if (status === "approved") return "warning"
  if (status === "rejected") return "critical"
  return "warning" // pending
}

/**
 * Format time since creation
 */
export function formatTimeSince(date: Date | string): string {
  const now = new Date()
  const past = typeof date === "string" ? new Date(date) : date
  const diffMs = now.getTime() - past.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}
