import "server-only"

import { cookies, headers } from "next/headers"
import { auth } from "@/auth"
import type { UserRole } from "@prisma/client"

import { db } from "@/lib/db"

/**
 * Tenant Context Resolution
 *
 * CRITICAL: This is the single source of truth for tenant isolation.
 * Every database query MUST use the schoolId from this context.
 *
 * Resolution priority (first wins):
 * 1. Impersonation cookie → For admin debugging without switching accounts
 * 2. x-subdomain header → From middleware URL rewriting (school.databayt.org)
 * 3. Session schoolId → From JWT token after authentication
 *
 * See: src/proxy.ts for how x-subdomain header is set
 */

// Extended user type that includes the properties added by our auth callbacks
type ExtendedUser = {
  id: string
  email?: string | null
  role?: string
  schoolId?: string | null
}

// Extended session type
type ExtendedSession = {
  user: ExtendedUser
}

export type TenantContext = {
  schoolId: string | null
  requestId: string | null
  role: UserRole | null
  isPlatformAdmin: boolean
}

export async function getTenantContext(): Promise<TenantContext> {
  try {
    const session = (await auth()) as ExtendedSession | null
    const cookieStore = await cookies()
    const hdrs = await headers()
    // Priority 1: Impersonation cookie (for admin debugging)
    // CRITICAL: Must be first - allows DEVELOPERs to view any school without switching sessions
    // GOTCHA: Clear this cookie when done debugging to prevent stuck impersonation
    const impersonatedSchoolId =
      cookieStore.get("impersonate_schoolId")?.value ?? null

    // Priority 2: Subdomain from middleware header → resolve to schoolId via DB lookup
    // The x-subdomain header contains raw domain (e.g., "acme"), but queries need schoolId
    let headerSchoolId: string | null = null
    const subdomain = hdrs.get("x-subdomain")
    if (subdomain) {
      try {
        // TODO(perf): Cache this lookup - runs on every request
        const school = await db.school.findUnique({
          where: { domain: subdomain },
        })
        headerSchoolId = school?.id ?? null
      } catch (error) {
        console.error(
          "[getTenantContext] Failed to resolve subdomain:",
          subdomain,
          error
        )
        headerSchoolId = null
      }
    }

    // Priority 3: Session schoolId (from JWT after auth)
    // CRITICAL: Order matters - impersonation > subdomain > session
    const schoolId =
      impersonatedSchoolId ?? headerSchoolId ?? session?.user?.schoolId ?? null
    const role = (session?.user?.role as UserRole | undefined) ?? null
    const isPlatformAdmin = role === "DEVELOPER"
    const requestId = null
    return { schoolId, requestId, role, isPlatformAdmin }
  } catch (error) {
    console.error("[getTenantContext] Error getting tenant context:", error)
    return {
      schoolId: null,
      requestId: null,
      role: null,
      isPlatformAdmin: false,
    }
  }
}
