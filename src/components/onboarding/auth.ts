/**
 * Onboarding-specific authentication utilities
 * Provides flexible auth checks during the onboarding flow
 */

import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getAuthContext, TenantError } from "@/lib/auth-security";

/**
 * Check if a user has access to a school during onboarding
 *
 * PRIMARY: Checks if user.schoolId matches the requested school
 *
 * DEPRECATED FALLBACK: The 1-hour grace period fallback is no longer needed
 * after implementing atomic transactions in school-access.ts.
 * This fallback should rarely trigger now. If it does, it indicates
 * a potential issue with the transaction flow that should be investigated.
 *
 * @deprecated The fallback path will be removed after 30 days of stability
 */
export async function checkOnboardingAccess(
  userId: string,
  schoolId: string
): Promise<boolean> {
  try {
    // PRIMARY CHECK: User's schoolId should match (this is the expected path)
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { schoolId: true, createdAt: true }
    });

    if (user?.schoolId === schoolId) {
      logger.debug('checkOnboardingAccess: Primary check passed', { userId, schoolId });
      return true;
    }

    // DEPRECATED FALLBACK: 1-hour grace period for race conditions
    // With atomic transactions implemented, this path should rarely trigger
    // If this logs frequently, investigate why the transaction flow isn't working
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { createdAt: true }
    });

    if (!school) {
      return false;
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const schoolIsRecent = school.createdAt > oneHourAgo;
    const userIsRecent = user && user.createdAt > oneHourAgo;

    if (schoolIsRecent && userIsRecent) {
      // Log warning - this path should be rare after transaction implementation
      logger.warn('checkOnboardingAccess: DEPRECATED FALLBACK TRIGGERED - Investigate transaction sync', {
        userId,
        schoolId,
        userSchoolId: user?.schoolId,
        schoolAge: Date.now() - school.createdAt.getTime(),
        userAge: user ? Date.now() - user.createdAt.getTime() : null,
        reason: 'User schoolId does not match but both entities are recent',
        action: 'Check if atomic transaction is working correctly'
      });
      return true;
    }

    return false;
  } catch (error) {
    logger.error('checkOnboardingAccess: Error checking access', error, { userId, schoolId });
    return false;
  }
}

/**
 * Determines if an error is due to cross-tenant access denial
 */
export function isCrossTenantError(error: unknown): boolean {
  if (error instanceof TenantError && error.code === 'CROSS_TENANT_ACCESS_DENIED') {
    return true;
  }

  if (error && typeof error === 'object' && 'code' in error) {
    return (error as { code: string }).code === 'CROSS_TENANT_ACCESS_DENIED';
  }

  return false;
}

/**
 * Get school data with onboarding fallback
 * Attempts standard auth first, falls back to onboarding checks if needed
 */
export async function getSchoolWithOnboardingFallback(
  schoolId: string,
  requireOwnership: (id: string) => Promise<void>
) {
  try {
    // Try standard ownership check first
    await requireOwnership(schoolId);

    // If successful, fetch and return the school
    const school = await db.school.findUnique({
      where: { id: schoolId }
    });

    if (!school) {
      throw new Error("School not found");
    }

    return { school, fallbackUsed: false };
  } catch (error) {
    // Only attempt fallback for cross-tenant errors during onboarding
    if (!isCrossTenantError(error)) {
      throw error;
    }

    logger.debug('Standard auth failed, attempting onboarding fallback', { schoolId });

    // Get auth context for fallback check
    const authContext = await getAuthContext();

    // Check if user has onboarding access
    const hasAccess = await checkOnboardingAccess(authContext.userId, schoolId);

    if (!hasAccess) {
      logger.warn('Onboarding access denied', {
        userId: authContext.userId,
        schoolId
      });
      throw error; // Re-throw original error
    }

    // Fetch the school data
    const school = await db.school.findUnique({
      where: { id: schoolId }
    });

    if (!school) {
      throw new Error("School not found");
    }

    logger.info('Onboarding fallback successful', {
      userId: authContext.userId,
      schoolId
    });

    return { school, fallbackUsed: true };
  }
}
