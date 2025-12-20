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
  const startTime = new Date().toISOString()
  console.log("🔍 [DEBUG] getAuthContext START", { startTime })

  // WHY: Call auth() once - it's async and shouldn't be called multiple times
  console.log("🔍 [DEBUG] Step 1: Calling auth() function...")

  let session
  try {
    const auth = await getAuth()
    session = await auth()
  } catch (authError) {
    console.error("❌ [DEBUG] auth() call failed:", {
      error: authError instanceof Error ? authError.message : String(authError),
      errorType: authError?.constructor?.name,
      stack: authError instanceof Error ? authError.stack : undefined,
      timestamp: new Date().toISOString(),
    })
    throw new AuthError("Authentication service error", "AUTH_SERVICE_ERROR")
  }

  console.log("📋 [DEBUG] Step 1 - Raw session data:", {
    hasSession: !!session,
    hasUser: !!session?.user,
    userId: session?.user?.id,
    email: session?.user?.email,
    sessionKeys: session?.user ? Object.keys(session.user) : [],
    sessionUserType: session?.user ? typeof session.user : "undefined",
    sessionUserSchoolId: (session?.user as any)?.schoolId,
    sessionUserRole: (session?.user as any)?.role,
    timestamp: new Date().toISOString(),
  })

  if (!session?.user?.id) {
    // WHY: Must have valid session with userId
    // Prevents unauthenticated access and identifies which user made request
    console.error("❌ [DEBUG] Step 2 - No session or user ID found", {
      hasSession: !!session,
      hasUser: !!session?.user,
      hasUserId: !!session?.user?.id,
      errorTimestamp: new Date().toISOString(),
    })
    throw new AuthError("Authentication required", "AUTH_REQUIRED")
  }

  if (!session.user.email) {
    console.error("❌ [DEBUG] Step 2 - No user email found", {
      userId: session.user.id,
      hasEmail: !!session.user.email,
      errorTimestamp: new Date().toISOString(),
    })
    throw new AuthError("User email is required", "EMAIL_REQUIRED")
  }

  console.log("🔍 [DEBUG] Step 2: Creating auth context...")
  const authContext = {
    userId: session.user.id,
    schoolId: (session.user as any).schoolId || null,
    role: (session.user as any).role || "USER",
    email: session.user.email,
  }

  console.log("✅ [DEBUG] Step 2 - AuthContext created:", {
    ...authContext,
    sessionSchoolId: (session.user as any).schoolId,
    sessionRole: (session.user as any).role,
    sessionHasSchoolId: "schoolId" in (session.user as any),
    sessionHasRole: "role" in (session.user as any),
    contextCreationTimestamp: new Date().toISOString(),
  })

  console.log("✅ [DEBUG] getAuthContext COMPLETE", {
    userId: authContext.userId,
    schoolId: authContext.schoolId,
    role: authContext.role,
    endTime: new Date().toISOString(),
  })

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

  console.log("🔐 [SCHOOL OWNERSHIP CHECK] Starting:", {
    userId: authContext.userId,
    role: authContext.role,
    targetSchoolId,
    userSchoolId: authContext.schoolId,
    timestamp: new Date().toISOString(),
  })

  // Check if user can access this school
  const accessResult = await canUserAccessSchool(
    authContext.userId,
    targetSchoolId
  )

  if (!accessResult.hasAccess) {
    // If user doesn't have access but is authenticated, try to create/ensure they have a school
    if (!authContext.schoolId) {
      console.log(
        "🏫 [SCHOOL OWNERSHIP] User has no school, ensuring one exists"
      )
      const schoolResult = await ensureUserSchool(authContext.userId)

      if (schoolResult.success && schoolResult.schoolId) {
        // Update auth context with new school
        authContext.schoolId = schoolResult.schoolId
        console.log("✅ [SCHOOL OWNERSHIP] School created/ensured for user:", {
          userId: authContext.userId,
          schoolId: schoolResult.schoolId,
        })
      }
    }

    // For onboarding, be permissive if user is authenticated
    console.warn(
      "⚠️ [SCHOOL OWNERSHIP] Access check failed but allowing for onboarding:",
      {
        reason: accessResult.reason,
        userId: authContext.userId,
        targetSchoolId,
      }
    )
  } else {
    console.log("✅ [SCHOOL OWNERSHIP] Access granted:", {
      userId: authContext.userId,
      targetSchoolId,
      reason: accessResult.reason,
      isOwner: accessResult.isOwner,
    })
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
    console.error("🚨 [DEBUG] createActionResponse called with error:", {
      error,
      errorType: error?.constructor?.name,
      errorMessage:
        error instanceof Error ? error.message : "Not an Error instance",
      isAuthError: error instanceof AuthError,
      isTenantError: error instanceof TenantError,
      errorKeys: error && typeof error === "object" ? Object.keys(error) : [],
      errorStringified: JSON.stringify(error),
      errorToString: error?.toString?.() || String(error),
    })

    if (error instanceof AuthError || error instanceof TenantError) {
      console.error("🚨 [DEBUG] This is an AuthError or TenantError:", {
        message: error.message,
        code: error.code,
        name: error.name,
      })
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

      console.error("🔍 [DEBUG] Standard Error instance:", {
        message: error.message,
        name: error.name,
        stack: error.stack?.substring(0, 200), // First 200 chars of stack
      })
    } else if (typeof error === "string") {
      errorMessage = error
      errorCode = "STRING_ERROR"
    } else if (error && typeof error === "object") {
      console.error("🔍 [DEBUG] Object error, trying to extract info:", {
        hasMessage: "message" in error,
        hasCode: "code" in error,
        hasName: "name" in error,
        keys: Object.keys(error),
        stringified: JSON.stringify(error),
      })

      // Try to extract message and code from object
      const errorObj = error as any
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

    console.error("🚨 [DEBUG] Final error response:", {
      errorMessage,
      errorCode,
      originalError: error,
    })

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
