/**
 * School Access Control and Management
 * Handles school creation, ownership, and access permissions
 *
 * Production-ready implementation following:
 * - AWS SaaS Lens tenant onboarding best practices
 * - Vercel Platforms multi-tenant patterns
 * - Prisma transaction guarantees for atomic operations
 */

import { auth } from "@/auth"
import { UserRole } from "@prisma/client"

import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

/**
 * School access result types
 */
export interface SchoolAccessResult {
  hasAccess: boolean
  school?: any
  userRole?: UserRole
  isOwner?: boolean
  reason?: string
}

/**
 * School creation result
 */
export interface SchoolCreationResult {
  success: boolean
  schoolId?: string
  school?: any
  error?: string
}

/**
 * Check if user can access a specific school
 */
export async function canUserAccessSchool(
  userId: string,
  schoolId: string
): Promise<SchoolAccessResult> {
  try {
    // Get user with their school association
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        schoolId: true,
      },
    })

    if (!user) {
      return { hasAccess: false, reason: "User not found" }
    }

    // Developers (platform admins) can access any school
    if (user.role === "DEVELOPER") {
      const school = await db.school.findUnique({
        where: { id: schoolId },
      })

      logger.debug("canUserAccessSchool: Platform admin access granted", {
        userId,
        schoolId,
      })
      return {
        hasAccess: true,
        school,
        userRole: user.role,
        isOwner: false,
        reason: "Platform admin access",
      }
    }

    // Check if user belongs to this school
    if (user.schoolId === schoolId) {
      const school = await db.school.findUnique({
        where: { id: schoolId },
      })

      return {
        hasAccess: true,
        school,
        userRole: user.role,
        isOwner: true,
        reason: "User belongs to school",
      }
    }

    // Check if this is a new/orphaned school that user can claim
    const orphanedSchool = await db.school.findFirst({
      where: {
        id: schoolId,
        users: {
          none: {}, // No users associated
        },
      },
    })

    if (orphanedSchool) {
      // Allow user to claim orphaned school
      return {
        hasAccess: true,
        school: orphanedSchool,
        userRole: user.role,
        isOwner: false,
        reason: "Orphaned school can be claimed",
      }
    }

    // Check if user has been invited or has secondary access
    const schoolWithUsers = await db.school.findFirst({
      where: {
        id: schoolId,
        users: {
          some: {
            id: userId,
          },
        },
      },
    })

    if (schoolWithUsers) {
      return {
        hasAccess: true,
        school: schoolWithUsers,
        userRole: user.role,
        isOwner: false,
        reason: "User has secondary access",
      }
    }

    return {
      hasAccess: false,
      reason: "User does not have access to this school",
    }
  } catch (error) {
    console.error("Error checking school access:", error)
    return {
      hasAccess: false,
      reason: "Error checking access permissions",
    }
  }
}

/**
 * Create or get user's school for onboarding
 *
 * PRODUCTION-READY: Uses Prisma $transaction for atomic school-user linking
 * This ensures that either BOTH school creation AND user update succeed,
 * or NEITHER does - preventing orphaned schools.
 *
 * Features:
 * - Idempotency: Safe to retry - returns existing school if user already has one
 * - Race condition handling: Unique constraint violations trigger retry
 * - Atomic transactions: No orphaned schools possible
 * - Session refresh: Updates user.updatedAt to trigger NextAuth JWT refresh
 */
export async function ensureUserSchool(
  userId: string
): Promise<SchoolCreationResult> {
  try {
    // 1. IDEMPOTENCY CHECK: Return existing school if user already has one
    const existingUser = await db.user.findUnique({
      where: { id: userId },
      include: { school: true },
    })

    if (!existingUser) {
      logger.warn("ensureUserSchool: User not found", { userId })
      return {
        success: false,
        error: "User not found",
      }
    }

    // Return existing school (idempotent - safe to call multiple times)
    if (existingUser.schoolId && existingUser.school) {
      logger.debug("ensureUserSchool: User already has school", {
        userId,
        schoolId: existingUser.schoolId,
        schoolName: existingUser.school.name,
      })

      return {
        success: true,
        schoolId: existingUser.schoolId,
        school: existingUser.school,
      }
    }

    // 2. ATOMIC TRANSACTION: Create school AND link user in single transaction
    // If either operation fails, both are rolled back - no orphaned schools
    logger.info(
      "ensureUserSchool: Creating new school with atomic transaction",
      { userId }
    )

    const result = await db.$transaction(async (tx) => {
      // Generate unique domain using userId suffix to prevent collisions
      const uniqueDomain = `school-${userId.slice(-8)}-${Date.now()}`

      // Create school within transaction
      // createdByUserId is set as @unique - prevents duplicate schools per user via DB constraint
      const school = await tx.school.create({
        data: {
          name: "New School",
          domain: uniqueDomain,
          maxStudents: 500,
          maxTeachers: 50,
          isActive: true,
          planType: "starter",
          createdByUserId: userId, // Track who created this school (immutable, prevents duplicates)
        },
      })

      // Link user to school within SAME transaction (atomic)
      // Also updates updatedAt to trigger session refresh
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          schoolId: school.id,
          role: existingUser.role === "USER" ? "ADMIN" : existingUser.role,
          updatedAt: new Date(), // Triggers NextAuth JWT refresh
        },
      })

      return { school, user: updatedUser }
    })

    logger.info("ensureUserSchool: School created and linked atomically", {
      userId,
      schoolId: result.school.id,
      schoolName: result.school.name,
      userRole: result.user.role,
    })

    return {
      success: true,
      schoolId: result.school.id,
      school: result.school,
    }
  } catch (error: unknown) {
    // 3. RACE CONDITION HANDLING: Another request may have created school
    const prismaError = error as { code?: string }
    if (prismaError.code === "P2002") {
      // Unique constraint violation - likely race condition
      // Retry by fetching the user's school that was just created
      logger.warn("ensureUserSchool: Race condition detected, retrying fetch", {
        userId,
      })

      const retryUser = await db.user.findUnique({
        where: { id: userId },
        include: { school: true },
      })

      if (retryUser?.school) {
        const retrySchoolId = retryUser.schoolId! // Safe assertion - school exists
        logger.info(
          "ensureUserSchool: Retrieved school from race condition retry",
          {
            userId,
            schoolId: retrySchoolId,
          }
        )

        return {
          success: true,
          schoolId: retrySchoolId,
          school: retryUser.school,
        }
      }
    }

    logger.error("ensureUserSchool: Failed to create school", error, { userId })
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create school",
    }
  }
}

/**
 * Switch user to a different school (for multi-school scenarios)
 */
export async function switchUserSchool(
  userId: string,
  newSchoolId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify user can access the new school
    const accessResult = await canUserAccessSchool(userId, newSchoolId)

    if (!accessResult.hasAccess) {
      return {
        success: false,
        error: accessResult.reason || "Access denied",
      }
    }

    // Update user's current school
    await db.user.update({
      where: { id: userId },
      data: {
        schoolId: newSchoolId,
        updatedAt: new Date(), // Force session refresh
      },
    })

    logger.info("switchUserSchool: User switched to school", {
      userId,
      newSchoolId,
    })

    return { success: true }
  } catch (error) {
    logger.error("switchUserSchool: Failed to switch school", error, {
      userId,
      newSchoolId,
    })
    return {
      success: false,
      error: "Failed to switch school",
    }
  }
}

/**
 * Get or create school for onboarding flow
 */
export async function getOrCreateSchoolForOnboarding(
  userId: string,
  requestedSchoolId?: string
): Promise<{ schoolId: string; isNew: boolean; school: any }> {
  // If a specific school is requested, check access
  if (requestedSchoolId) {
    const accessResult = await canUserAccessSchool(userId, requestedSchoolId)

    if (accessResult.hasAccess && accessResult.school) {
      return {
        schoolId: requestedSchoolId,
        isNew: false,
        school: accessResult.school,
      }
    }
  }

  // Otherwise, ensure user has a school
  const result = await ensureUserSchool(userId)

  if (!result.success || !result.schoolId || !result.school) {
    throw new Error(result.error || "Failed to ensure user school")
  }

  return {
    schoolId: result.schoolId,
    isNew: !requestedSchoolId, // New if no specific school was requested
    school: result.school,
  }
}

/**
 * Validate school ownership for sensitive operations
 */
export async function validateSchoolOwnership(
  userId: string,
  schoolId: string,
  requiredRole?: UserRole
): Promise<{ isValid: boolean; error?: string }> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        schoolId: true,
      },
    })

    if (!user) {
      return { isValid: false, error: "User not found" }
    }

    // Developers (platform admins) bypass all checks
    if (user.role === "DEVELOPER") {
      return { isValid: true }
    }

    // Check school association
    if (user.schoolId !== schoolId) {
      // For onboarding, allow access to orphaned schools
      const isOrphaned = await db.school.findFirst({
        where: {
          id: schoolId,
          users: { none: {} },
        },
      })

      if (!isOrphaned) {
        return { isValid: false, error: "User does not own this school" }
      }
    }

    // Check role requirements using numeric hierarchy
    // Higher number = more permissions; compare against requiredRole threshold
    // GOTCHA: This hierarchy must stay in sync with src/routes.ts roleRoutes matrix
    if (requiredRole) {
      const roleHierarchy: Record<UserRole, number> = {
        USER: 1, // Default authenticated user
        STUDENT: 2, // Can view own data
        GUARDIAN: 3, // Can view linked student data
        STAFF: 4, // General school staff
        ACCOUNTANT: 5, // Finance access
        TEACHER: 6, // Academic data access
        ADMIN: 7, // Full school management
        DEVELOPER: 8, // Platform admin (bypasses all checks)
      }

      if (roleHierarchy[user.role] < roleHierarchy[requiredRole]) {
        return { isValid: false, error: "Insufficient permissions" }
      }
    }

    return { isValid: true }
  } catch (error) {
    logger.error("validateSchoolOwnership: Validation error", error, {
      userId,
      schoolId,
    })
    return { isValid: false, error: "Validation error" }
  }
}

/**
 * Sync user session with school context
 *
 * Forces NextAuth to refresh the JWT by updating user.updatedAt.
 * This is necessary because NextAuth caches JWT claims - after schoolId
 * changes (e.g., during onboarding), the client needs fresh session data.
 *
 * How it works:
 * 1. Update user.updatedAt in database
 * 2. NextAuth JWT callback detects timestamp mismatch
 * 3. JWT is regenerated with fresh user data
 * 4. Client receives updated schoolId/role in session
 *
 * See: src/auth.ts JWT callback for the refresh logic
 */
export async function syncUserSchoolContext(userId: string): Promise<void> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        schoolId: true,
        updatedAt: true,
      },
    })

    if (user) {
      // Bump updatedAt timestamp - triggers NextAuth JWT refresh on next request
      await db.user.update({
        where: { id: userId },
        data: { updatedAt: new Date() },
      })

      logger.debug("syncUserSchoolContext: User context synced", {
        userId,
        schoolId: user.schoolId ?? undefined,
      })
    }
  } catch (error) {
    logger.error("syncUserSchoolContext: Failed to sync context", error, {
      userId,
    })
  }
}
