import { UserRole } from "@prisma/client"

import { canUserAccessSchool, ensureUserSchool } from "@/lib/school-access"

// Dynamic import to avoid module-level initialization issues
// The auth module has side effects (validateAuthConfig, NextAuth init) that run at import time
async function getAuth() {
  const { auth } = await import("@/auth")
  return auth
}

/**
 * Authentication & Authorization Security Layer
 *
 * PURPOSE: Enforces tenant isolation and role-based access control (RBAC)
 * Validates that every operation respects school boundaries (multi-tenant safety).
 *
 * KEY CONCEPTS:
 * - AuthContext: User identity + school assignment + role
 * - Tenant isolation: CRITICAL - all DB queries must include schoolId
 * - Role hierarchy: DEVELOPER (platform) > ADMIN (school) > specific roles (TEACHER, STUDENT, etc.)
 * - Extended session: NextAuth session includes schoolId, role, isPlatformAdmin
 *
 * SECURITY PATTERNS:
 * 1. getAuthContext(): Get user from session (basic auth check)
 * 2. requireSchoolAccess(schoolId): Verify user belongs to school
 * 3. requireRole(...roles): Verify user has required role
 * 4. requireSchoolRole(schoolId, ...roles): Combined check (most common)
 * 5. validateResourceAccess(resourceSchoolId): Verify resource ownership
 * 6. createTenantSafeWhere(): Inject schoolId into DB queries
 *
 * CRITICAL RULES - MUST FOLLOW:
 * - DEVELOPER role bypasses school checks (platform admin)
 * - All non-DEVELOPER users must have schoolId in session
 * - Every DB query must include schoolId in WHERE clause
 * - Cross-tenant access throws TenantError (403 Forbidden)
 * - Missing schoolId throws TenantError (401 Unauthorized)
 *
 * ERROR HANDLING:
 * - AuthError: Authentication failed (401) - bad credentials, missing session
 * - TenantError: Authorization failed (403) - access denied to school/resource
 * - Zod validation errors: Parsed into field-level errors
 *
 * GOTCHAS:
 * - Session.user is typed as DefaultSession, cast to 'any' to access schoolId/role
 * - Null schoolId is VALID for DEVELOPER role only
 * - onboarding flow allows permissive checks (see requireSchoolOwnership)
 * - Debug logging uses console.log (remove or silence in production)
 */

export interface AuthContext {
  userId: string
  schoolId: string | null
  role: UserRole
  email: string | null
}

export class AuthError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message)
    this.name = "AuthError"
  }
}

export class TenantError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message)
    this.name = "TenantError"
  }
}

/**
 * Get authenticated user context with full security validation
 * WHY: Provides single source of truth for user identity in server actions
 * Extracts schoolId and role from NextAuth extended session
 */
export async function getAuthContext(): Promise<AuthContext> {
  let session
  try {
    const auth = await getAuth()
    session = await auth()
  } catch (authError) {
    throw new AuthError("Authentication service error", "AUTH_SERVICE_ERROR")
  }

  if (!session?.user?.id) {
    throw new AuthError("Authentication required", "AUTH_REQUIRED")
  }

  if (!session.user.email) {
    throw new AuthError("User email is required", "EMAIL_REQUIRED")
  }

  const authContext = {
    userId: session.user.id,
    schoolId: (session.user as any).schoolId || null,
    role: (session.user as any).role || "USER",
    email: session.user.email,
  }

  return authContext
}

/**
 * Ensure user has access to specific school (multi-tenant safety)
 */
export async function requireSchoolAccess(
  targetSchoolId: string
): Promise<AuthContext> {
  const authContext = await getAuthContext()

  // DEVELOPER role can access any school
  if (authContext.role === "DEVELOPER") {
    return authContext
  }

  // All other users must belong to the target school
  if (!authContext.schoolId) {
    throw new TenantError(
      "User not assigned to any school",
      "NO_SCHOOL_ASSIGNMENT"
    )
  }

  if (authContext.schoolId !== targetSchoolId) {
    throw new TenantError(
      "Access denied to this school",
      "CROSS_TENANT_ACCESS_DENIED"
    )
  }

  return authContext
}

/**
 * For School model access (schools are the tenants, not nested under schoolId)
 */
export async function requireSchoolOwnership(
  targetSchoolId: string
): Promise<AuthContext> {
  const authContext = await getAuthContext()

  // Check if user can access this school
  const accessResult = await canUserAccessSchool(
    authContext.userId,
    targetSchoolId
  )

  if (!accessResult.hasAccess) {
    // If user doesn't have access but is authenticated, try to create/ensure they have a school
    if (!authContext.schoolId) {
      const schoolResult = await ensureUserSchool(authContext.userId)

      if (schoolResult.success && schoolResult.schoolId) {
        // Update auth context with new school
        authContext.schoolId = schoolResult.schoolId
      }
    }

    // For onboarding, be permissive if user is authenticated
    // This allows users to complete onboarding flow
  }

  return authContext
}

/**
 * Ensure user has minimum required role
 */
export async function requireRole(
  ...allowedRoles: UserRole[]
): Promise<AuthContext> {
  const authContext = await getAuthContext()

  if (!allowedRoles.includes(authContext.role)) {
    throw new AuthError(
      `Access denied. Required roles: ${allowedRoles.join(", ")}`,
      "INSUFFICIENT_PERMISSIONS"
    )
  }

  return authContext
}

/**
 * Ensure user has role AND school access (most common combination)
 */
export async function requireSchoolRole(
  schoolId: string,
  ...allowedRoles: UserRole[]
): Promise<AuthContext> {
  const authContext = await requireSchoolAccess(schoolId)

  if (!allowedRoles.includes(authContext.role)) {
    throw new AuthError(
      `Access denied. Required roles: ${allowedRoles.join(", ")}`,
      "INSUFFICIENT_PERMISSIONS"
    )
  }

  return authContext
}

/**
 * Create multi-tenant safe database where clause
 */
export function createTenantSafeWhere<T extends Record<string, any>>(
  baseWhere: T,
  schoolId: string | null
): T & { schoolId?: string } {
  if (schoolId) {
    return {
      ...baseWhere,
      schoolId,
    }
  }

  return baseWhere
}

/**
 * Validate that a resource belongs to the user's school
 */
export async function validateResourceAccess(
  resourceSchoolId: string
): Promise<void> {
  const authContext = await getAuthContext()

  // DEVELOPER can access any resource
  if (authContext.role === "DEVELOPER") {
    return
  }

  if (!authContext.schoolId) {
    throw new TenantError(
      "User not assigned to any school",
      "NO_SCHOOL_ASSIGNMENT"
    )
  }

  if (authContext.schoolId !== resourceSchoolId) {
    throw new TenantError(
      "Resource belongs to different school",
      "CROSS_TENANT_ACCESS_DENIED"
    )
  }
}

/**
 * Standard error response for API routes
 */
export function createErrorResponse(error: unknown): Response {
  console.error("API Error:", error)

  if (error instanceof AuthError) {
    return new Response(
      JSON.stringify({ error: error.message, code: error.code }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    )
  }

  if (error instanceof TenantError) {
    return new Response(
      JSON.stringify({ error: error.message, code: error.code }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    )
  }

  // Generic error - don't leak internal details
  return new Response(
    JSON.stringify({ error: "An error occurred", code: "INTERNAL_ERROR" }),
    { status: 500, headers: { "Content-Type": "application/json" } }
  )
}

/**
 * Standard action response type
 */
export interface ActionResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: string
  errors?: Record<string, string>
}

/**
 * Create standardized action response
 */
export function createActionResponse<T>(
  data?: T,
  error?: unknown
): ActionResponse<T> {
  if (error) {
    if (error instanceof AuthError || error instanceof TenantError) {
      return {
        success: false,
        error: error.message || "Access denied",
        code: error.code || "ACCESS_DENIED",
      }
    }

    // Handle Zod validation errors
    if (error && typeof error === "object" && "issues" in error) {
      const zodError = error as {
        issues: Array<{ path: string[]; message: string }>
      }
      const fieldErrors: Record<string, string> = {}

      zodError.issues.forEach((issue) => {
        if (issue.path.length > 0) {
          const fieldName = issue.path[0] as string
          fieldErrors[fieldName] = issue.message
        }
      })

      return {
        success: false,
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        errors: fieldErrors,
      }
    }

    // Handle generic errors and ensure they're serializable
    let errorMessage = "An error occurred"
    let errorCode = "INTERNAL_ERROR"

    // First check if it's a standard Error instance
    if (error instanceof Error) {
      errorMessage = error.message || "An error occurred"
      errorCode = error.name || "INTERNAL_ERROR"
    } else if (typeof error === "string") {
      errorMessage = error
      errorCode = "STRING_ERROR"
    } else if (error && typeof error === "object") {
      // Try to extract message and code from object
      const errorObj = error as Record<string, unknown>
      if (errorObj.message && typeof errorObj.message === "string") {
        errorMessage = errorObj.message
      } else if (errorObj.error && typeof errorObj.error === "string") {
        errorMessage = errorObj.error
      }

      if (errorObj.code && typeof errorObj.code === "string") {
        errorCode = errorObj.code
      } else if (errorObj.name && typeof errorObj.name === "string") {
        errorCode = errorObj.name
      }
    } else {
      // Fallback for any other type
      errorMessage = String(error) || "Unknown error occurred"
      errorCode = "UNKNOWN_ERROR"
    }

    // Ensure we never return an empty or undefined error message
    if (!errorMessage || errorMessage.trim() === "") {
      errorMessage = "An error occurred"
    }

    return {
      success: false,
      error: errorMessage,
      code: errorCode,
    }
  }

  return {
    success: true,
    data,
  }
}
