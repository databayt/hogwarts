"use server";

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const domainRequestSchema = z.object({
  domain: z.string()
    .min(3, 'Domain must be at least 3 characters')
    .max(63, 'Domain must be less than 63 characters')
    .regex(/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/, 'Invalid domain format. Use lowercase letters, numbers, and hyphens only.'),
  notes: z.string().optional(),
});

export async function createDomainRequest(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.schoolId) {
      return { success: false, error: 'Not authenticated' };
    }

    // Only PRINCIPAL or DEVELOPER can request custom domains
    if (session.user.role !== 'PRINCIPAL' && session.user.role !== 'DEVELOPER') {
      return { success: false, error: 'Insufficient permissions' };
    }

    const rawData = Object.fromEntries(formData);
    const validated = domainRequestSchema.parse(rawData);

    // Check if domain is already taken
    const existingSchool = await db.school.findFirst({
      where: { domain: validated.domain },
    });

    if (existingSchool) {
      return { success: false, error: 'This domain is already taken' };
    }

    // Check if there's already a pending request
    const existingRequest = await db.domainRequest.findFirst({
      where: {
        schoolId: session.user.schoolId,
        status: 'pending',
      },
    });

    if (existingRequest) {
      return { success: false, error: 'You already have a pending domain request' };
    }

    // Create the domain request
    const domainRequest = await db.domainRequest.create({
      data: {
        schoolId: session.user.schoolId,
        domain: validated.domain,
        notes: validated.notes,
        status: 'pending',
      },
    });

    logger.info('Domain request created', {
      action: 'domain_request_create',
      schoolId: session.user.schoolId,
      domain: validated.domain,
      requestId: domainRequest.id,
    });

    revalidatePath('/settings/domain');
    return { success: true, data: domainRequest };
  } catch (error) {
    logger.error('Domain request creation failed', error instanceof Error ? error : new Error('Unknown error'), {
      action: 'domain_request_create_error',
    });
    return { success: false, error: 'Failed to create domain request' };
  }
}

export async function getDomainRequests() {
  try {
    const session = await auth();
    if (!session?.user?.schoolId) {
      return { success: false, error: 'Not authenticated' };
    }

    const requests = await db.domainRequest.findMany({
      where: { schoolId: session.user.schoolId },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: requests };
  } catch (error) {
    logger.error('Failed to fetch domain requests', error instanceof Error ? error : new Error('Unknown error'), {
      action: 'domain_requests_fetch_error',
    });
    return { success: false, error: 'Failed to fetch domain requests' };
  }
}

export async function cancelDomainRequest(requestId: string) {
  try {
    const session = await auth();
    if (!session?.user?.schoolId) {
      return { success: false, error: 'Not authenticated' };
    }

    const request = await db.domainRequest.findFirst({
      where: {
        id: requestId,
        schoolId: session.user.schoolId,
        status: 'pending',
      },
    });

    if (!request) {
      return { success: false, error: 'Request not found or already processed' };
    }

    await db.domainRequest.delete({
      where: { id: requestId },
    });

    logger.info('Domain request cancelled', {
      action: 'domain_request_cancel',
      schoolId: session.user.schoolId,
      requestId,
    });

    revalidatePath('/settings/domain');
    return { success: true };
  } catch (error) {
    logger.error('Failed to cancel domain request', error instanceof Error ? error : new Error('Unknown error'), {
      action: 'domain_request_cancel_error',
    });
    return { success: false, error: 'Failed to cancel domain request' };
  }
}

// Admin-only actions
export async function approveDomainRequest(requestId: string) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'DEVELOPER') {
      return { success: false, error: 'Insufficient permissions' };
    }

    const request = await db.domainRequest.findUnique({
      where: { id: requestId },
      include: { school: true },
    });

    if (!request) {
      return { success: false, error: 'Request not found' };
    }

    // Update the school's domain
    await db.school.update({
      where: { id: request.schoolId },
      data: { domain: request.domain },
    });

    // Update the request status
    await db.domainRequest.update({
      where: { id: requestId },
      data: {
        status: 'approved',
        verifiedAt: new Date(),
      },
    });

    logger.info('Domain request approved', {
      action: 'domain_request_approve',
      requestId,
      domain: request.domain,
      schoolId: request.schoolId,
    });

    revalidatePath('/school/domain-requests');
    return { success: true };
  } catch (error) {
    logger.error('Failed to approve domain request', error instanceof Error ? error : new Error('Unknown error'), {
      action: 'domain_request_approve_error',
    });
    return { success: false, error: 'Failed to approve domain request' };
  }
}

export async function rejectDomainRequest(requestId: string, reason?: string) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'DEVELOPER') {
      return { success: false, error: 'Insufficient permissions' };
    }

    await db.domainRequest.update({
      where: { id: requestId },
      data: {
        status: 'rejected',
        notes: reason,
      },
    });

    logger.info('Domain request rejected', {
      action: 'domain_request_reject',
      requestId,
      reason,
    });

    revalidatePath('/school/domain-requests');
    return { success: true };
  } catch (error) {
    logger.error('Failed to reject domain request', error instanceof Error ? error : new Error('Unknown error'), {
      action: 'domain_request_reject_error',
    });
    return { success: false, error: 'Failed to reject domain request' };
  }
}