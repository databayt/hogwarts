import { auth } from "@/auth";
import { UserRole } from "@prisma/client";

/**
 * Enhanced authentication and authorization utilities for multi-tenant security
 */

export interface AuthContext {
  userId: string;
  schoolId: string | null;
  role: UserRole;
  email: string | null;
}

export class AuthError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export class TenantError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'TenantError';
  }
}

/**
 * Get authenticated user context with full security validation
 */
export async function getAuthContext(): Promise<AuthContext> {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new AuthError("Authentication required", "AUTH_REQUIRED");
  }

  if (!session.user.email) {
    throw new AuthError("User email is required", "EMAIL_REQUIRED");
  }

  return {
    userId: session.user.id,
    schoolId: (session.user as any).schoolId || null,
    role: (session.user as any).role || "USER",
    email: session.user.email,
  };
}

/**
 * Ensure user has access to specific school (multi-tenant safety)
 */
export async function requireSchoolAccess(targetSchoolId: string): Promise<AuthContext> {
  const authContext = await getAuthContext();
  
  // DEVELOPER role can access any school
  if (authContext.role === "DEVELOPER") {
    return authContext;
  }
  
  // All other users must belong to the target school
  if (!authContext.schoolId) {
    throw new TenantError("User not assigned to any school", "NO_SCHOOL_ASSIGNMENT");
  }
  
  if (authContext.schoolId !== targetSchoolId) {
    throw new TenantError("Access denied to this school", "CROSS_TENANT_ACCESS_DENIED");
  }
  
  return authContext;
}

/**
 * For School model access (schools are the tenants, not nested under schoolId)
 */
export async function requireSchoolOwnership(targetSchoolId: string): Promise<AuthContext> {
  const authContext = await getAuthContext();
  
  // DEVELOPER role can access any school
  if (authContext.role === "DEVELOPER") {
    return authContext;
  }
  
  // For school onboarding, user's schoolId should match the school they're creating/updating
  // OR they might be creating their first school (schoolId null)
  if (authContext.schoolId && authContext.schoolId !== targetSchoolId) {
    throw new TenantError("Access denied to this school", "CROSS_TENANT_ACCESS_DENIED");
  }
  
  return authContext;
}

/**
 * Ensure user has minimum required role
 */
export async function requireRole(...allowedRoles: UserRole[]): Promise<AuthContext> {
  const authContext = await getAuthContext();
  
  if (!allowedRoles.includes(authContext.role)) {
    throw new AuthError(
      `Access denied. Required roles: ${allowedRoles.join(", ")}`,
      "INSUFFICIENT_PERMISSIONS"
    );
  }
  
  return authContext;
}

/**
 * Ensure user has role AND school access (most common combination)
 */
export async function requireSchoolRole(schoolId: string, ...allowedRoles: UserRole[]): Promise<AuthContext> {
  const authContext = await requireSchoolAccess(schoolId);
  
  if (!allowedRoles.includes(authContext.role)) {
    throw new AuthError(
      `Access denied. Required roles: ${allowedRoles.join(", ")}`,
      "INSUFFICIENT_PERMISSIONS"
    );
  }
  
  return authContext;
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
    };
  }
  
  return baseWhere;
}

/**
 * Validate that a resource belongs to the user's school
 */
export async function validateResourceAccess(resourceSchoolId: string): Promise<void> {
  const authContext = await getAuthContext();
  
  // DEVELOPER can access any resource
  if (authContext.role === "DEVELOPER") {
    return;
  }
  
  if (!authContext.schoolId) {
    throw new TenantError("User not assigned to any school", "NO_SCHOOL_ASSIGNMENT");
  }
  
  if (authContext.schoolId !== resourceSchoolId) {
    throw new TenantError("Resource belongs to different school", "CROSS_TENANT_ACCESS_DENIED");
  }
}

/**
 * Standard error response for API routes
 */
export function createErrorResponse(error: unknown): Response {
  console.error("API Error:", error);
  
  if (error instanceof AuthError) {
    return new Response(
      JSON.stringify({ error: error.message, code: error.code }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
  
  if (error instanceof TenantError) {
    return new Response(
      JSON.stringify({ error: error.message, code: error.code }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }
  
  // Generic error - don't leak internal details
  return new Response(
    JSON.stringify({ error: "An error occurred", code: "INTERNAL_ERROR" }),
    { status: 500, headers: { "Content-Type": "application/json" } }
  );
}

/**
 * Standard action response type
 */
export interface ActionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  errors?: Record<string, string>;
}

/**
 * Create standardized action response
 */
export function createActionResponse<T>(
  data?: T,
  error?: unknown
): ActionResponse<T> {
  if (error) {
    console.error("Action Error:", error);
    
    if (error instanceof AuthError || error instanceof TenantError) {
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
    
    // Handle Zod validation errors
    if (error && typeof error === 'object' && 'issues' in error) {
      const zodError = error as { issues: Array<{ path: string[]; message: string }> };
      const fieldErrors: Record<string, string> = {};
      
      zodError.issues.forEach(issue => {
        if (issue.path.length > 0) {
          const fieldName = issue.path[0] as string;
          fieldErrors[fieldName] = issue.message;
        }
      });
      
      return {
        success: false,
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        errors: fieldErrors,
      };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred",
      code: "INTERNAL_ERROR",
    };
  }
  
  return {
    success: true,
    data,
  };
}