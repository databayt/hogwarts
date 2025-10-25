"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOperator, requireNotImpersonating, logOperatorAudit } from "@/components/operator/lib/operator-auth";
import type { DomainRequest } from "@prisma/client";

// ============= Type Definitions =============

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: Error };

// ============= Validation Schemas =============

const approveDomainSchema = z.object({
  id: z.string().min(1),
  notes: z.string().optional()
});

const rejectDomainSchema = z.object({
  id: z.string().min(1),
  notes: z.string().optional()
});

const verifyDomainSchema = z.object({
  id: z.string().min(1)
});

const createDomainSchema = z.object({
  schoolId: z.string().min(1),
  domain: z.string()
    .min(3)
    .refine(val => {
      try {
        const url = new URL(`https://${val}`);
        return url.hostname === val;
      } catch {
        return false;
      }
    }, "Must be a valid domain"),
  notes: z.string().optional()
});

// ============= Domain Actions =============

/**
 * Approve a domain request
 */
export async function domainApprove(
  input: { id: string; notes?: string }
): Promise<ActionResult<DomainRequest>> {
  try {
    const operator = await requireOperator();
    await requireNotImpersonating();

    const validated = approveDomainSchema.parse(input);

    const domainRequest = await db.domainRequest.update({
      where: { id: validated.id },
      data: {
        status: "approved",
        notes: validated.notes
      }
    });

    await logOperatorAudit({
      userId: operator.userId,
      schoolId: domainRequest.schoolId,
      action: "DOMAIN_APPROVE",
      reason: validated.notes
    });

    revalidatePath("/operator/domains");

    return { success: true, data: domainRequest };
  } catch (error) {
    console.error("Failed to approve domain request:", error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error("Failed to approve domain")
    };
  }
}

/**
 * Reject a domain request
 */
export async function domainReject(
  input: { id: string; notes?: string }
): Promise<ActionResult<DomainRequest>> {
  try {
    const operator = await requireOperator();
    await requireNotImpersonating();

    const validated = rejectDomainSchema.parse(input);

    const domainRequest = await db.domainRequest.update({
      where: { id: validated.id },
      data: {
        status: "rejected",
        notes: validated.notes
      }
    });

    await logOperatorAudit({
      userId: operator.userId,
      schoolId: domainRequest.schoolId,
      action: "DOMAIN_REJECT",
      reason: validated.notes
    });

    revalidatePath("/operator/domains");

    return { success: true, data: domainRequest };
  } catch (error) {
    console.error("Failed to reject domain request:", error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error("Failed to reject domain")
    };
  }
}

/**
 * Verify a domain's DNS configuration
 */
export async function domainVerify(
  input: { id: string }
): Promise<ActionResult<{ verified: boolean; domainRequest: DomainRequest }>> {
  try {
    const operator = await requireOperator();
    await requireNotImpersonating();

    const validated = verifyDomainSchema.parse(input);

    // Get the domain request
    const domainRequest = await db.domainRequest.findUnique({
      where: { id: validated.id }
    });

    if (!domainRequest) {
      return {
        success: false,
        error: new Error("Domain request not found")
      };
    }

    // TODO: Implement actual DNS verification logic
    // This would check DNS records, SSL certificates, etc.
    const isVerified = await verifyDNSRecords(domainRequest.domain);

    if (isVerified) {
      const updatedRequest = await db.domainRequest.update({
        where: { id: validated.id },
        data: {
          status: "verified",
          verifiedAt: new Date()
        }
      });

      await logOperatorAudit({
        userId: operator.userId,
        schoolId: domainRequest.schoolId,
        action: "DOMAIN_VERIFIED"
      });

      revalidatePath("/operator/domains");

      return { success: true, data: { verified: true, domainRequest: updatedRequest } };
    } else {
      return { success: true, data: { verified: false, domainRequest } };
    }
  } catch (error) {
    console.error("Failed to verify domain:", error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error("Failed to verify domain")
    };
  }
}

/**
 * Create a new domain request
 */
export async function domainCreate(
  input: { schoolId: string; domain: string; notes?: string }
): Promise<ActionResult<DomainRequest>> {
  try {
    const operator = await requireOperator();
    await requireNotImpersonating();

    const validated = createDomainSchema.parse(input);

    // Check if domain is already taken
    const existing = await db.domainRequest.findFirst({
      where: {
        domain: validated.domain,
        status: { in: ["approved", "verified"] }
      }
    });

    if (existing) {
      return {
        success: false,
        error: new Error("Domain is already in use")
      };
    }

    const domainRequest = await db.domainRequest.create({
      data: {
        schoolId: validated.schoolId,
        domain: validated.domain,
        notes: validated.notes,
        status: "pending"
      }
    });

    await logOperatorAudit({
      userId: operator.userId,
      schoolId: validated.schoolId,
      action: "DOMAIN_REQUEST_CREATED"
    });

    revalidatePath("/operator/domains");

    return { success: true, data: domainRequest };
  } catch (error) {
    console.error("Failed to create domain request:", error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error("Failed to create domain request")
    };
  }
}

// ============= Get Domains Action =============

export async function getDomains(input: {
  page: number;
  perPage: number;
  status?: string;
  search?: string;
}) {
  try {
    await requireOperator();

    const offset = (input.page - 1) * input.perPage;
    const where = {
      ...(input.status && input.status !== "all" ? { status: input.status } : {}),
      ...(input.search
        ? {
            OR: [
              { domain: { contains: input.search, mode: "insensitive" as const } },
              { school: { name: { contains: input.search, mode: "insensitive" as const } } }
            ]
          }
        : {})
    };

    const [requests, total] = await Promise.all([
      db.domainRequest.findMany({
        where,
        include: {
          school: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: input.perPage
      }),
      db.domainRequest.count({ where })
    ]);

    const rows = requests.map(request => ({
      id: request.id,
      schoolName: request.school.name,
      domain: request.domain,
      status: request.status as "pending" | "approved" | "rejected" | "verified",
      createdAt: request.createdAt.toISOString(),
      notes: request.notes
    }));

    return { success: true, data: rows, total };
  } catch (error) {
    console.error("Failed to fetch domain requests:", error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : "Failed to fetch domain requests",
      },
      data: [],
      total: 0,
    };
  }
}

// ============= Helper Functions =============

/**
 * Verify DNS records for a domain
 * TODO: Implement actual DNS verification
 */
async function verifyDNSRecords(domain: string): Promise<boolean> {
  // This would typically:
  // 1. Check for proper A/CNAME records
  // 2. Verify TXT records for ownership
  // 3. Check SSL certificate validity
  // 4. Ensure domain points to our infrastructure

  // For now, return a mock result
  return Math.random() > 0.5;
}




















