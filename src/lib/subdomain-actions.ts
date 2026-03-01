"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Subdomain Management - School Tenant Allocation
 *
 * PURPOSE: Manages subdomain allocation for multi-tenant school instances
 * Subdomains serve as unique identifiers for schools (e.g., school1.ed.databayt.org)
 *
 * KEY FUNCTIONS:
 * - checkSubdomainAvailability(): Verify subdomain is unclaimed
 * - reserveSubdomain(): Claim subdomain during onboarding
 * - updateSubdomain(): Change subdomain for existing school
 * - getSchoolBySubdomain(): Lookup school from subdomain
 * - getAllSubdomains(): List all schools and their subdomains
 *
 * SUBDOMAIN FORMAT:
 * - Valid characters: a-z, 0-9, hyphens (no underscores, caps, special chars)
 * - Min length: 3 characters
 * - Max length: 63 characters (DNS limit)
 * - Reserved: Avoid api, www, mail, ftp, admin, etc.
 * - Normalized: Lowercase, hyphenated (via normalizeSubdomain())
 *
 * CONSTRAINT: One-to-one mapping
 * - Each school has exactly one subdomain
 * - Each subdomain maps to exactly one school
 * - Subdomains cannot be reused (even if school deleted)
 *
 * ARCHITECTURE:
 * - Unique constraint on domain field in School model
 * - Middleware rewrites subdomain to tenantContext for routing
 * - Production: school.ed.databayt.org
 * - Preview: tenant---branch.vercel.app
 * - Development: subdomain.localhost
 *
 * USE CASE: Onboarding flow
 * 1. User enters desired subdomain
 * 2. Validate format (normalizeSubdomain + isValidSubdomain)
 * 3. Check availability (query School.domain = normalized)
 * 4. Reserve subdomain (db.school.update)
 * 5. Redirect to https://subdomain.ed.databayt.org
 *
 * ERROR HANDLING:
 * - Invalid format: Return isValid=false with error message
 * - Already taken: Return available=false with school name
 * - Database error: Caught and logged, generic error returned
 *
 * PERFORMANCE:
 * - checkSubdomainAvailability: O(1) - indexed unique query
 * - getAllSubdomains: O(n) - table scan
 * - Consider adding subdomain index if not present
 *
 * CONSTRAINTS & GOTCHAS:
 * - Subdomain cannot be changed after onboarding (in current implementation)
 *   updateSubdomain() available for admins
 * - Reserved words should be validated (future enhancement)
 * - DNS propagation takes 24-48 hours (info only, not enforced)
 * - Requires middleware for subdomain routing to work
 * - Not validated against existing TLDs or reserved domains
 */
import { revalidatePath } from "next/cache"

import { dbCircuitBreaker } from "@/lib/circuit-breaker"
import { db } from "@/lib/db"

import { dnsService } from "./dns-service"
import { isValidSubdomain, normalizeSubdomain } from "./subdomain"

// In-memory cache for getSchoolBySubdomain (same pattern as tenant-context.ts)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const schoolCache = new Map<string, { data: any; expiresAt: number }>()
const SCHOOL_CACHE_TTL_MS = 60 * 1000 // 60 seconds

export type SchoolLookupResult =
  | { success: true; data: any; errorType?: undefined; error?: undefined }
  | {
      success: false
      data?: undefined
      errorType: "not_found" | "db_error"
      error: string
    }

/**
 * Check if a subdomain is available for use
 */
export async function checkSubdomainAvailability(subdomain: string): Promise<{
  available: boolean
  error?: string
}> {
  try {
    // Normalize the subdomain
    const normalized = normalizeSubdomain(subdomain)

    // Validate format
    if (!isValidSubdomain(normalized)) {
      return {
        available: false,
        error: "Invalid subdomain format",
      }
    }

    // Check reserved words (www, api, admin, mail, etc.)
    const availability = await dnsService.checkAvailability(normalized)
    if (
      !availability.available &&
      availability.reason === "This subdomain is reserved"
    ) {
      return {
        available: false,
        error: availability.suggestions
          ? `This subdomain is reserved. Try: ${availability.suggestions.slice(0, 3).join(", ")}`
          : "This subdomain is reserved",
      }
    }

    // Check if already exists
    const existingSchool = await db.school.findUnique({
      where: { domain: normalized },
      select: { id: true, name: true },
    })

    if (existingSchool) {
      return {
        available: false,
        error: `Subdomain already taken by "${existingSchool.name}"`,
      }
    }

    return { available: true }
  } catch (error) {
    console.error("Error checking subdomain availability:", error)
    return {
      available: false,
      error: "Database error occurred",
    }
  }
}

/**
 * Reserve a subdomain for a school (during onboarding)
 */
export async function reserveSubdomain(
  subdomain: string,
  schoolId: string
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    // Check availability first
    const availability = await checkSubdomainAvailability(subdomain)
    if (!availability.available) {
      return {
        success: false,
        error: availability.error,
      }
    }

    // Update the school with the reserved subdomain
    await db.school.update({
      where: { id: schoolId },
      data: { domain: normalizeSubdomain(subdomain) },
    })

    revalidatePath("/onboarding")
    return { success: true }
  } catch (error) {
    console.error("Error reserving subdomain:", error)
    return {
      success: false,
      error: "Failed to reserve subdomain",
    }
  }
}

/**
 * Get all existing subdomains (for admin purposes)
 */
export async function getAllSubdomains(): Promise<{
  success: boolean
  data?: Array<{ id: string; name: string; domain: string; isActive: boolean }>
  error?: string
}> {
  try {
    const schools = await db.school.findMany({
      select: {
        id: true,
        name: true,
        domain: true,
        isActive: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return { success: true, data: schools }
  } catch (error) {
    console.error("Error fetching subdomains:", error)
    return {
      success: false,
      error: "Failed to fetch subdomains",
    }
  }
}

/**
 * Update subdomain for an existing school
 */
export async function updateSubdomain(
  schoolId: string,
  newSubdomain: string
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    // Check if new subdomain is available
    const availability = await checkSubdomainAvailability(newSubdomain)
    if (!availability.available) {
      return {
        success: false,
        error: availability.error,
      }
    }

    // Update the school
    await db.school.update({
      where: { id: schoolId },
      data: { domain: normalizeSubdomain(newSubdomain) },
    })

    revalidatePath("/saas-dashboard/tenants")
    return { success: true }
  } catch (error) {
    console.error("Error updating subdomain:", error)
    return {
      success: false,
      error: "Failed to update subdomain",
    }
  }
}

const SCHOOL_SELECT = {
  id: true,
  name: true,
  domain: true,
  logoUrl: true,
  address: true,
  phoneNumber: true,
  email: true,
  website: true,
  timezone: true,
  preferredLanguage: true,
  planType: true,
  maxStudents: true,
  maxTeachers: true,
  isActive: true,
  currency: true,
  createdAt: true,
  updatedAt: true,
} as const

/**
 * Get school data by subdomain — with in-memory cache, circuit breaker, and retry.
 *
 * Returns distinct error types so callers can differentiate:
 * - "not_found" → subdomain doesn't exist (show 404)
 * - "db_error"  → transient DB failure (show retry UI)
 */
export async function getSchoolBySubdomain(
  subdomain: string
): Promise<SchoolLookupResult> {
  const normalized = normalizeSubdomain(subdomain)
  const now = Date.now()

  // Check in-memory cache first
  const cached = schoolCache.get(normalized)
  if (cached && cached.expiresAt > now) {
    if (cached.data) {
      return { success: true, data: cached.data }
    }
    return { success: false, errorType: "not_found", error: "School not found" }
  }

  // DB lookup with circuit breaker + one retry on transient errors
  try {
    const school = await dbCircuitBreaker.execute(() =>
      db.school.findUnique({
        where: { domain: normalized },
        select: SCHOOL_SELECT,
      })
    )

    // Cache the result (including nulls to avoid repeated lookups)
    schoolCache.set(normalized, {
      data: school,
      expiresAt: now + SCHOOL_CACHE_TTL_MS,
    })

    // Evict stale entries when cache grows large
    if (schoolCache.size > 100) {
      for (const [key, value] of schoolCache) {
        if (value.expiresAt < now) schoolCache.delete(key)
      }
    }

    if (!school) {
      return {
        success: false,
        errorType: "not_found",
        error: "School not found",
      }
    }

    return { success: true, data: school }
  } catch (error) {
    // One automatic retry for transient DB errors (cold starts, connection resets)
    try {
      const school = await dbCircuitBreaker.execute(() =>
        db.school.findUnique({
          where: { domain: normalized },
          select: SCHOOL_SELECT,
        })
      )

      schoolCache.set(normalized, {
        data: school,
        expiresAt: now + SCHOOL_CACHE_TTL_MS,
      })

      if (!school) {
        return {
          success: false,
          errorType: "not_found",
          error: "School not found",
        }
      }

      return { success: true, data: school }
    } catch (retryError) {
      console.error(
        `[getSchoolBySubdomain] DB error for "${normalized}" after retry:`,
        retryError
      )
      return {
        success: false,
        errorType: "db_error",
        error: "Database temporarily unavailable",
      }
    }
  }
}
