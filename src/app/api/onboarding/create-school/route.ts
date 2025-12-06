/**
 * Idempotent School Creation Endpoint
 *
 * PRODUCTION-READY API endpoint following multi-tenant SaaS best practices:
 * - Idempotent: Safe to retry - returns existing school if user already has one
 * - Atomic: Uses Prisma $transaction to prevent orphaned schools
 * - Session refresh: Updates user.updatedAt to trigger JWT refresh
 *
 * Usage:
 * POST /api/onboarding/create-school
 *
 * Response:
 * {
 *   success: true,
 *   school: { id, name, domain, ... },
 *   isExisting: boolean,  // true if returning existing school
 *   _redirect: string,    // Suggested redirect path
 *   _sessionRefreshRequired: boolean
 * }
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function POST() {
  try {
    // 1. AUTHENTICATION: Verify user is logged in
    const session = await auth();

    if (!session?.user?.id) {
      logger.warn('create-school: Unauthorized attempt');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    logger.info('create-school: Request received', { userId });

    // 2. IDEMPOTENCY CHECK: Return existing school if user already has one
    const existingUser = await db.user.findUnique({
      where: { id: userId },
      include: { school: true }
    });

    if (!existingUser) {
      logger.error('create-school: User not found', { userId });
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (existingUser.school) {
      // Return existing school (idempotent response)
      const existingSchoolId = existingUser.schoolId!; // Safe assertion - school exists
      logger.info('create-school: Returning existing school (idempotent)', {
        userId,
        schoolId: existingSchoolId,
        schoolName: existingUser.school.name
      });

      return NextResponse.json({
        success: true,
        school: existingUser.school,
        isExisting: true,
        _redirect: `/onboarding/${existingSchoolId}/about-school`,
        _sessionRefreshRequired: false
      });
    }

    // 3. ATOMIC CREATION: Create school and link user in single transaction
    logger.info('create-school: Creating new school with atomic transaction', { userId });

    const result = await db.$transaction(async (tx) => {
      // Generate unique domain
      const uniqueDomain = `school-${userId.slice(-8)}-${Date.now()}`;

      // Create school with owner tracking
      const school = await tx.school.create({
        data: {
          name: "New School",
          domain: uniqueDomain,
          maxStudents: 500,
          maxTeachers: 50,
          isActive: true,
          planType: "starter",
          createdByUserId: userId, // Track owner (unique constraint prevents duplicates)
        },
      });

      // Link user to school atomically
      await tx.user.update({
        where: { id: userId },
        data: {
          schoolId: school.id,
          role: existingUser.role === "USER" ? "ADMIN" : existingUser.role,
          updatedAt: new Date(), // Trigger session refresh
        },
      });

      return school;
    });

    logger.info('create-school: School created successfully', {
      userId,
      schoolId: result.id,
      schoolName: result.name
    });

    return NextResponse.json({
      success: true,
      school: result,
      isExisting: false,
      _redirect: `/onboarding/${result.id}/about-school`,
      _sessionRefreshRequired: true
    });

  } catch (error: unknown) {
    // 4. RACE CONDITION HANDLING: Another request may have created school
    const prismaError = error as { code?: string };

    if (prismaError.code === 'P2002') {
      // Unique constraint violation - likely race condition on createdByUserId
      logger.warn('create-school: Race condition detected, retrying fetch');

      try {
        const session = await auth();
        if (session?.user?.id) {
          const retryUser = await db.user.findUnique({
            where: { id: session.user.id },
            include: { school: true }
          });

          if (retryUser?.school) {
            const retrySchoolId = retryUser.schoolId!; // Safe assertion - school exists
            logger.info('create-school: Retrieved school from race condition retry', {
              userId: session.user.id,
              schoolId: retrySchoolId
            });

            return NextResponse.json({
              success: true,
              school: retryUser.school,
              isExisting: true,
              _redirect: `/onboarding/${retrySchoolId}/about-school`,
              _sessionRefreshRequired: false
            });
          }
        }
      } catch (retryError) {
        logger.error('create-school: Retry fetch failed', retryError);
      }
    }

    logger.error('create-school: Failed to create school', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create school' },
      { status: 500 }
    );
  }
}

// GET method returns method not allowed
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to create a school.' },
    { status: 405 }
  );
}
