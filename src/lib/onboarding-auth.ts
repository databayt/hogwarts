/**
 * Onboarding-specific authentication utilities
 * Provides flexible auth checks during the onboarding flow
 */

import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getAuthContext, TenantError } from "@/lib/auth-security";

/**
 * Check if a user has access to a school during onboarding
 * This is more lenient than standard school ownership checks
 * to handle race conditions during school creation
 */
export async function checkOnboardingAccess(
  userId: string,
  schoolId: string
): Promise<boolean> {
  try {
    // Check if user's schoolId matches
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { schoolId: true, createdAt: true }
    });

    if (user?.schoolId === schoolId) {
      logger.debug('User has matching schoolId', { userId, schoolId });
      return true;
    }

    // Check if this is a recent onboarding session (within 1 hour)
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { createdAt: true }
    });

    if (!school) {
      return false;
    }

    // Allow access if both school and user were created recently
    // This handles race conditions during onboarding
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const schoolIsRecent = school.createdAt > oneHourAgo;
    const userIsRecent = user && user.createdAt > oneHourAgo;

    if (schoolIsRecent && userIsRecent) {
      logger.info('Allowing onboarding access for recent entities', {
        userId,
        schoolId,
        schoolAge: Date.now() - school.createdAt.getTime(),
        userAge: user ? Date.now() - user.createdAt.getTime() : null
      });
      return true;
    }

    return false;
  } catch (error) {
    logger.error('Error checking onboarding access', error, { userId, schoolId });
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
    return (error as any).code === 'CROSS_TENANT_ACCESS_DENIED';
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