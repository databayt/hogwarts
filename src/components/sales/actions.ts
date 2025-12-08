"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";
import { auth } from "@/auth";
import { LeadStatus, LeadSource, LeadPriority, LeadType } from "@prisma/client";
import {
  createLeadSchema,
  updateLeadSchema,
  bulkUpdateSchema,
  leadFilterSchema,
  leadActivitySchema,
  type CreateLeadInput,
  type UpdateLeadInput,
  type BulkUpdateInput,
  type LeadFilterInput,
  type LeadActivityInput,
} from "./validation";
import type { Lead, LeadListResponse, LeadAnalytics } from "./types";

// ============================================================================
// Types
// ============================================================================

export type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// ============================================================================
// Constants
// ============================================================================

const SALES_PATH = "/sales";

// ============================================================================
// Helper Functions
// ============================================================================

async function getAuthContext() {
  const { schoolId } = await getTenantContext();
  if (!schoolId) {
    throw new Error("Missing school context");
  }

  const session = await auth();
  const userId = session?.user?.id;

  return { schoolId, userId };
}

// ============================================================================
// CRUD Operations
// ============================================================================

/**
 * Create a new lead
 */
export async function createLead(
  input: CreateLeadInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const { schoolId, userId } = await getAuthContext();

    // Validate input
    const validated = createLeadSchema.parse(input);

    // Check for duplicate email within this school
    if (validated.email) {
      const existing = await db.lead.findUnique({
        where: {
          schoolId_email: {
            schoolId,
            email: validated.email,
          },
        },
      });

      if (existing) {
        return {
          success: false,
          error: "A lead with this email already exists",
        };
      }
    }

    // Create the lead
    const lead = await db.lead.create({
      data: {
        schoolId,
        name: validated.name,
        email: validated.email || null,
        phone: validated.phone || null,
        alternatePhone: validated.alternatePhone || null,
        company: validated.company || null,
        title: validated.title || null,
        website: validated.website || null,
        linkedinUrl: validated.linkedinUrl || null,
        leadType: (validated.leadType as LeadType) || "SCHOOL",
        industry: validated.industry || null,
        location: validated.location || null,
        country: validated.country || null,
        status: (validated.status as LeadStatus) || "NEW",
        source: (validated.source as LeadSource) || "MANUAL",
        priority: (validated.priority as LeadPriority) || "MEDIUM",
        score: validated.score ?? 50,
        verified: validated.verified ?? false,
        assignedToId: validated.assignedToId || userId || null,
        lastContactedAt: validated.lastContactedAt || null,
        nextFollowUpAt: validated.nextFollowUpAt || null,
        notes: validated.notes || null,
        tags: validated.tags || [],
      },
    });

    revalidatePath(SALES_PATH);

    return { success: true, data: { id: lead.id } };
  } catch (error) {
    console.error("[createLead] Error:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create lead",
    };
  }
}

/**
 * Update an existing lead
 */
export async function updateLead(
  id: string,
  input: UpdateLeadInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const { schoolId } = await getAuthContext();

    // Validate input
    const validated = updateLeadSchema.parse(input);

    // Check lead exists and belongs to this school
    const existing = await db.lead.findFirst({
      where: { id, schoolId },
    });

    if (!existing) {
      return { success: false, error: "Lead not found" };
    }

    // Check for duplicate email if changing
    if (validated.email && validated.email !== existing.email) {
      const duplicate = await db.lead.findFirst({
        where: {
          schoolId,
          email: validated.email,
          NOT: { id },
        },
      });

      if (duplicate) {
        return {
          success: false,
          error: "A lead with this email already exists",
        };
      }
    }

    // Update the lead
    const lead = await db.lead.update({
      where: { id },
      data: {
        ...(validated.name !== undefined && { name: validated.name }),
        ...(validated.email !== undefined && { email: validated.email || null }),
        ...(validated.phone !== undefined && { phone: validated.phone || null }),
        ...(validated.alternatePhone !== undefined && {
          alternatePhone: validated.alternatePhone || null,
        }),
        ...(validated.company !== undefined && {
          company: validated.company || null,
        }),
        ...(validated.title !== undefined && { title: validated.title || null }),
        ...(validated.website !== undefined && {
          website: validated.website || null,
        }),
        ...(validated.linkedinUrl !== undefined && {
          linkedinUrl: validated.linkedinUrl || null,
        }),
        ...(validated.leadType !== undefined && {
          leadType: validated.leadType as LeadType,
        }),
        ...(validated.industry !== undefined && {
          industry: validated.industry || null,
        }),
        ...(validated.location !== undefined && {
          location: validated.location || null,
        }),
        ...(validated.country !== undefined && {
          country: validated.country || null,
        }),
        ...(validated.status !== undefined && {
          status: validated.status as LeadStatus,
        }),
        ...(validated.source !== undefined && {
          source: validated.source as LeadSource,
        }),
        ...(validated.priority !== undefined && {
          priority: validated.priority as LeadPriority,
        }),
        ...(validated.score !== undefined && { score: validated.score }),
        ...(validated.verified !== undefined && { verified: validated.verified }),
        ...(validated.assignedToId !== undefined && {
          assignedToId: validated.assignedToId,
        }),
        ...(validated.lastContactedAt !== undefined && {
          lastContactedAt: validated.lastContactedAt,
        }),
        ...(validated.nextFollowUpAt !== undefined && {
          nextFollowUpAt: validated.nextFollowUpAt,
        }),
        ...(validated.notes !== undefined && { notes: validated.notes || null }),
        ...(validated.tags !== undefined && { tags: validated.tags }),
      },
    });

    revalidatePath(SALES_PATH);
    revalidatePath(`${SALES_PATH}/${id}`);

    return { success: true, data: { id: lead.id } };
  } catch (error) {
    console.error("[updateLead] Error:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update lead",
    };
  }
}

/**
 * Delete a lead
 */
export async function deleteLead(id: string): Promise<ActionResponse<void>> {
  try {
    const { schoolId } = await getAuthContext();

    // Check lead exists and belongs to this school
    const existing = await db.lead.findFirst({
      where: { id, schoolId },
    });

    if (!existing) {
      return { success: false, error: "Lead not found" };
    }

    await db.lead.delete({
      where: { id },
    });

    revalidatePath(SALES_PATH);

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[deleteLead] Error:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete lead",
    };
  }
}

/**
 * Get leads with filters and pagination
 */
export async function getLeads(
  filters?: LeadFilterInput,
  page = 1,
  pageSize = 10
): Promise<ActionResponse<LeadListResponse>> {
  try {
    const { schoolId } = await getAuthContext();

    // Build where clause
    const where: Record<string, unknown> = { schoolId };

    if (filters) {
      const validated = leadFilterSchema.parse(filters);

      if (validated.search) {
        where.OR = [
          { name: { contains: validated.search, mode: "insensitive" } },
          { email: { contains: validated.search, mode: "insensitive" } },
          { company: { contains: validated.search, mode: "insensitive" } },
        ];
      }

      if (validated.status) where.status = validated.status;
      if (validated.source) where.source = validated.source;
      if (validated.priority) where.priority = validated.priority;
      if (validated.leadType) where.leadType = validated.leadType;
      if (validated.assignedToId) where.assignedToId = validated.assignedToId;
      if (validated.verified !== undefined) where.verified = validated.verified;

      if (validated.scoreMin !== undefined || validated.scoreMax !== undefined) {
        where.score = {
          ...(validated.scoreMin !== undefined && { gte: validated.scoreMin }),
          ...(validated.scoreMax !== undefined && { lte: validated.scoreMax }),
        };
      }

      if (validated.dateFrom || validated.dateTo) {
        where.createdAt = {
          ...(validated.dateFrom && { gte: validated.dateFrom }),
          ...(validated.dateTo && { lte: validated.dateTo }),
        };
      }

      if (validated.hasEmail) where.email = { not: null };
      if (validated.hasPhone) where.phone = { not: null };

      if (validated.tags && validated.tags.length > 0) {
        where.tags = { hasSome: validated.tags };
      }
    }

    // Get total count
    const total = await db.lead.count({ where });

    // Get paginated leads
    const leads = await db.lead.findMany({
      where,
      include: {
        assignedTo: {
          select: {
            id: true,
            username: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      success: true,
      data: {
        leads: leads as Lead[],
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    };
  } catch (error) {
    console.error("[getLeads] Error:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get leads",
    };
  }
}

/**
 * Get a single lead by ID
 */
export async function getLeadById(
  id: string
): Promise<ActionResponse<Lead>> {
  try {
    const { schoolId } = await getAuthContext();

    const lead = await db.lead.findFirst({
      where: { id, schoolId },
      include: {
        assignedTo: {
          select: {
            id: true,
            username: true,
            email: true,
            image: true,
          },
        },
        activities: {
          include: {
            createdBy: {
              select: {
                id: true,
                username: true,
                email: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!lead) {
      return { success: false, error: "Lead not found" };
    }

    return { success: true, data: lead as Lead };
  } catch (error) {
    console.error("[getLeadById] Error:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get lead",
    };
  }
}

// ============================================================================
// Bulk Operations
// ============================================================================

/**
 * Bulk update leads
 */
export async function bulkUpdateLeads(
  input: BulkUpdateInput
): Promise<ActionResponse<{ updated: number }>> {
  try {
    const { schoolId } = await getAuthContext();

    const validated = bulkUpdateSchema.parse(input);

    // Verify all leads belong to this school
    const leadsCount = await db.lead.count({
      where: {
        id: { in: validated.leadIds },
        schoolId,
      },
    });

    if (leadsCount !== validated.leadIds.length) {
      return { success: false, error: "Some leads not found or unauthorized" };
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (validated.updates.status) {
      updateData.status = validated.updates.status as LeadStatus;
    }
    if (validated.updates.priority) {
      updateData.priority = validated.updates.priority as LeadPriority;
    }
    if (validated.updates.score !== undefined) {
      updateData.score = validated.updates.score;
    }
    if (validated.updates.assignedToId !== undefined) {
      updateData.assignedToId = validated.updates.assignedToId;
    }
    if (validated.updates.tags) {
      updateData.tags = validated.updates.tags;
    }

    // Perform bulk update
    const result = await db.lead.updateMany({
      where: {
        id: { in: validated.leadIds },
        schoolId,
      },
      data: updateData,
    });

    revalidatePath(SALES_PATH);

    return { success: true, data: { updated: result.count } };
  } catch (error) {
    console.error("[bulkUpdateLeads] Error:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update leads",
    };
  }
}

/**
 * Bulk delete leads
 */
export async function bulkDeleteLeads(
  leadIds: string[]
): Promise<ActionResponse<{ deleted: number }>> {
  try {
    const { schoolId } = await getAuthContext();

    if (leadIds.length === 0) {
      return { success: false, error: "No leads selected" };
    }

    if (leadIds.length > 100) {
      return { success: false, error: "Maximum 100 leads can be deleted at once" };
    }

    // Delete leads that belong to this school
    const result = await db.lead.deleteMany({
      where: {
        id: { in: leadIds },
        schoolId,
      },
    });

    revalidatePath(SALES_PATH);

    return { success: true, data: { deleted: result.count } };
  } catch (error) {
    console.error("[bulkDeleteLeads] Error:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete leads",
    };
  }
}

// ============================================================================
// Activity Tracking
// ============================================================================

/**
 * Add activity to a lead
 */
export async function addLeadActivity(
  input: LeadActivityInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const { schoolId, userId } = await getAuthContext();

    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }

    const validated = leadActivitySchema.parse(input);

    // Verify lead belongs to this school
    const lead = await db.lead.findFirst({
      where: { id: validated.leadId, schoolId },
    });

    if (!lead) {
      return { success: false, error: "Lead not found" };
    }

    const activity = await db.leadActivity.create({
      data: {
        schoolId,
        leadId: validated.leadId,
        type: validated.type,
        description: validated.description,
        metadata: validated.metadata as object | undefined,
        createdById: userId,
      },
    });

    // Update lastContactedAt if this is a contact activity
    if (["email_sent", "call", "meeting"].includes(validated.type)) {
      await db.lead.update({
        where: { id: validated.leadId },
        data: { lastContactedAt: new Date() },
      });
    }

    revalidatePath(`${SALES_PATH}/${validated.leadId}`);

    return { success: true, data: { id: activity.id } };
  } catch (error) {
    console.error("[addLeadActivity] Error:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add activity",
    };
  }
}

// ============================================================================
// Analytics
// ============================================================================

/**
 * Get lead analytics
 */
export async function getLeadAnalytics(): Promise<ActionResponse<LeadAnalytics>> {
  try {
    const { schoolId } = await getAuthContext();

    // Total leads
    const totalLeads = await db.lead.count({ where: { schoolId } });

    // New leads this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const newLeadsThisWeek = await db.lead.count({
      where: {
        schoolId,
        createdAt: { gte: oneWeekAgo },
      },
    });

    // Conversion rate (CLOSED_WON / total)
    const closedWon = await db.lead.count({
      where: { schoolId, status: "CLOSED_WON" },
    });
    const conversionRate = totalLeads > 0 ? (closedWon / totalLeads) * 100 : 0;

    // Average score
    const scoreResult = await db.lead.aggregate({
      where: { schoolId },
      _avg: { score: true },
    });
    const averageScore = scoreResult._avg.score || 0;

    // Status distribution
    const statusCounts = await db.lead.groupBy({
      by: ["status"],
      where: { schoolId },
      _count: true,
    });

    const statusDistribution = statusCounts.map((item) => ({
      status: item.status as Lead["status"],
      count: item._count,
      percentage: totalLeads > 0 ? (item._count / totalLeads) * 100 : 0,
    }));

    // Source distribution
    const sourceCounts = await db.lead.groupBy({
      by: ["source"],
      where: { schoolId },
      _count: true,
    });

    const topSources = sourceCounts.map((item) => ({
      source: item.source as Lead["source"],
      count: item._count,
      percentage: totalLeads > 0 ? (item._count / totalLeads) * 100 : 0,
    }));

    // Score distribution
    const scoreRanges = [
      { range: "0-39 (Cold)", min: 0, max: 39 },
      { range: "40-59 (Cool)", min: 40, max: 59 },
      { range: "60-79 (Warm)", min: 60, max: 79 },
      { range: "80-100 (Hot)", min: 80, max: 100 },
    ];

    const scoreDistribution = await Promise.all(
      scoreRanges.map(async ({ range, min, max }) => {
        const count = await db.lead.count({
          where: {
            schoolId,
            score: { gte: min, lte: max },
          },
        });
        return { range, count };
      })
    );

    return {
      success: true,
      data: {
        totalLeads,
        newLeadsThisWeek,
        conversionRate,
        averageScore,
        topSources,
        statusDistribution,
        scoreDistribution,
      },
    };
  } catch (error) {
    console.error("[getLeadAnalytics] Error:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get analytics",
    };
  }
}
