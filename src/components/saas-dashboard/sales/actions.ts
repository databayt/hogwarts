"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { LeadPriority, LeadSource, LeadStatus, LeadType } from "@prisma/client"
import { z } from "zod"

import { db } from "@/lib/db"
import { requireOperator } from "@/components/saas-dashboard/lib/operator-auth"
import {
  createLeadSchema,
  leadActivitySchema,
  leadFilterSchema,
  updateLeadSchema,
} from "@/components/sales/validation"

// ============================================================================
// Types
// ============================================================================

export type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

// ============================================================================
// Constants
// ============================================================================

const SALES_PATH = "/sales"

// Platform-level leads stored under a sentinel schoolId
// TODO: Consider creating a real "platform" School record or making Lead.schoolId optional
const PLATFORM_SCHOOL_ID = "platform"

// ============================================================================
// CRUD Operations
// ============================================================================

/**
 * Create a new school-dashboard-level lead
 */
export async function createOperatorLead(
  input: z.infer<typeof createLeadSchema>
): Promise<ActionResponse<{ id: string }>> {
  try {
    const { userId } = await requireOperator()

    // Validate input
    const validated = createLeadSchema.parse(input)

    // Check for duplicate email at school-dashboard level
    if (validated.email) {
      const existing = await db.lead.findFirst({
        where: {
          email: validated.email,
          schoolId: PLATFORM_SCHOOL_ID,
        },
      })

      if (existing) {
        return {
          success: false,
          error: "A lead with this email already exists",
        }
      }
    }

    // Create the lead (school-dashboard-level, no school scoping)
    const lead = await db.lead.create({
      data: {
        schoolId: PLATFORM_SCHOOL_ID,
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
        notes: validated.notes || null,
        tags: validated.tags || [],
        lastContactedAt: validated.lastContactedAt ?? null,
        nextFollowUpAt: validated.nextFollowUpAt ?? null,
      },
    })

    revalidatePath(SALES_PATH)

    return { success: true, data: { id: lead.id } }
  } catch (error) {
    console.error("[createOperatorLead] Error:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create lead",
    }
  }
}

/**
 * Update a school-dashboard-level lead
 */
export async function updateOperatorLead(
  id: string,
  input: z.infer<typeof updateLeadSchema>
): Promise<ActionResponse<{ id: string }>> {
  try {
    await requireOperator()

    // Validate input
    const validated = updateLeadSchema.parse(input)

    // Find the lead
    const existing = await db.lead.findFirst({
      where: { id, schoolId: PLATFORM_SCHOOL_ID },
    })

    if (!existing) {
      return { success: false, error: "Lead not found" }
    }

    // Update the lead
    const lead = await db.lead.update({
      where: { id },
      data: {
        ...(validated.name && { name: validated.name }),
        ...(validated.email !== undefined && {
          email: validated.email || null,
        }),
        ...(validated.phone !== undefined && {
          phone: validated.phone || null,
        }),
        ...(validated.company !== undefined && {
          company: validated.company || null,
        }),
        ...(validated.title !== undefined && {
          title: validated.title || null,
        }),
        ...(validated.website !== undefined && {
          website: validated.website || null,
        }),
        ...(validated.linkedinUrl !== undefined && {
          linkedinUrl: validated.linkedinUrl || null,
        }),
        ...(validated.leadType && { leadType: validated.leadType as LeadType }),
        ...(validated.industry !== undefined && {
          industry: validated.industry || null,
        }),
        ...(validated.location !== undefined && {
          location: validated.location || null,
        }),
        ...(validated.status && { status: validated.status as LeadStatus }),
        ...(validated.source && { source: validated.source as LeadSource }),
        ...(validated.priority && {
          priority: validated.priority as LeadPriority,
        }),
        ...(validated.score !== undefined && { score: validated.score }),
        ...(validated.verified !== undefined && {
          verified: validated.verified,
        }),
        ...(validated.notes !== undefined && {
          notes: validated.notes || null,
        }),
        ...(validated.tags && { tags: validated.tags }),
        ...(validated.country !== undefined && {
          country: validated.country || null,
        }),
        ...(validated.lastContactedAt !== undefined && {
          lastContactedAt: validated.lastContactedAt,
        }),
        ...(validated.nextFollowUpAt !== undefined && {
          nextFollowUpAt: validated.nextFollowUpAt,
        }),
      },
    })

    revalidatePath(SALES_PATH)
    revalidatePath(`${SALES_PATH}/${id}`)

    return { success: true, data: { id: lead.id } }
  } catch (error) {
    console.error("[updateOperatorLead] Error:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update lead",
    }
  }
}

/**
 * Delete a school-dashboard-level lead
 */
export async function deleteOperatorLead(
  id: string
): Promise<ActionResponse<void>> {
  try {
    await requireOperator()

    // Find the lead
    const existing = await db.lead.findFirst({
      where: { id, schoolId: PLATFORM_SCHOOL_ID },
    })

    if (!existing) {
      return { success: false, error: "Lead not found" }
    }

    // Delete the lead
    await db.lead.delete({
      where: { id },
    })

    revalidatePath(SALES_PATH)

    return { success: true, data: undefined }
  } catch (error) {
    console.error("[deleteOperatorLead] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete lead",
    }
  }
}

/**
 * Get school-dashboard-level leads with pagination and filtering
 */
export async function getOperatorLeads(
  filters?: z.infer<typeof leadFilterSchema>,
  page = 1,
  perPage = 20
): Promise<
  ActionResponse<{
    leads: Array<{
      id: string
      name: string
      email: string | null
      phone: string | null
      company: string | null
      title: string | null
      country: string | null
      tags: string[]
      status: LeadStatus
      source: LeadSource
      priority: LeadPriority
      score: number
      verified: boolean
      nextFollowUpAt: Date | null
      createdAt: Date
      updatedAt: Date
    }>
    total: number
    page: number
    perPage: number
    totalPages: number
  }>
> {
  try {
    await requireOperator()

    // Build where clause
    const where: Record<string, unknown> = {
      schoolId: PLATFORM_SCHOOL_ID,
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
        { company: { contains: filters.search, mode: "insensitive" } },
      ]
    }

    if (filters?.status) where.status = filters.status
    if (filters?.source) where.source = filters.source
    if (filters?.priority) where.priority = filters.priority
    if (filters?.leadType) where.leadType = filters.leadType
    if (filters?.country) where.country = filters.country
    if (filters?.verified !== undefined) where.verified = filters.verified

    // Combine tier (derived from `tags`) with any explicit tag filter so we
    // don't shadow one with the other.
    const tagFilters: string[] = []
    if (filters?.tags?.length) tagFilters.push(...filters.tags)
    if (filters?.tier) tagFilters.push(`tier-${filters.tier.toLowerCase()}`)
    if (tagFilters.length) where.tags = { hasSome: tagFilters }

    if (filters?.dueBefore) {
      // Overdue = "due strictly before this moment AND not null". We treat
      // `null` follow-ups as "no commitment yet" — they don't match the filter.
      where.nextFollowUpAt = { lte: filters.dueBefore, not: null }
    }

    // Get total count
    const total = await db.lead.count({ where })

    // Get leads
    const leads = await db.lead.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        title: true,
        country: true,
        tags: true,
        status: true,
        source: true,
        priority: true,
        score: true,
        verified: true,
        nextFollowUpAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    })

    return {
      success: true,
      data: {
        leads,
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      },
    }
  } catch (error) {
    console.error("[getOperatorLeads] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch leads",
    }
  }
}

export type OperatorLeadDetail = {
  id: string
  name: string
  email: string | null
  phone: string | null
  alternatePhone: string | null
  company: string | null
  title: string | null
  website: string | null
  linkedinUrl: string | null
  leadType: LeadType
  industry: string | null
  location: string | null
  country: string | null
  status: LeadStatus
  source: LeadSource
  priority: LeadPriority
  score: number
  verified: boolean
  notes: string | null
  tags: string[]
  lastContactedAt: Date | null
  nextFollowUpAt: Date | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Get a single school-dashboard-level lead by ID
 */
export async function getOperatorLeadById(
  id: string
): Promise<ActionResponse<OperatorLeadDetail | null>> {
  try {
    await requireOperator()

    const lead = await db.lead.findFirst({
      where: { id, schoolId: PLATFORM_SCHOOL_ID },
    })

    if (!lead) {
      return { success: true, data: null }
    }

    return {
      success: true,
      data: {
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        alternatePhone: lead.alternatePhone,
        company: lead.company,
        title: lead.title,
        website: lead.website,
        linkedinUrl: lead.linkedinUrl,
        leadType: lead.leadType,
        industry: lead.industry,
        location: lead.location,
        country: lead.country,
        status: lead.status,
        source: lead.source,
        priority: lead.priority,
        score: lead.score,
        verified: lead.verified,
        notes: lead.notes,
        tags: lead.tags,
        lastContactedAt: lead.lastContactedAt,
        nextFollowUpAt: lead.nextFollowUpAt,
        createdAt: lead.createdAt,
        updatedAt: lead.updatedAt,
      },
    }
  } catch (error) {
    console.error("[getOperatorLeadById] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch lead",
    }
  }
}

// ============================================================================
// Activity Tracking (platform pipeline)
// ============================================================================

export type OperatorLeadActivity = {
  id: string
  leadId: string
  type: string
  description: string
  createdAt: Date
  createdBy: {
    id: string
    username: string | null
    email: string | null
  } | null
}

/**
 * Log an activity (touch) on a platform lead. Mirrors `addLeadActivity` on the
 * school side but writes under `schoolId="platform"` and uses operator auth.
 */
export async function logOperatorActivity(
  leadId: string,
  input: { type: string; description: string; nextFollowUpAt?: Date | null }
): Promise<ActionResponse<{ id: string }>> {
  try {
    const { userId } = await requireOperator()
    const validated = leadActivitySchema.parse({
      leadId,
      type: input.type,
      description: input.description,
    })

    const lead = await db.lead.findFirst({
      where: { id: leadId, schoolId: PLATFORM_SCHOOL_ID },
      select: { id: true },
    })
    if (!lead) {
      return { success: false, error: "Lead not found" }
    }

    const activity = await db.leadActivity.create({
      data: {
        schoolId: PLATFORM_SCHOOL_ID,
        leadId,
        type: validated.type,
        description: validated.description,
        createdById: userId,
      },
    })

    // Bump `lastContactedAt` for contact-type activities so the cadence stays
    // honest; also accept a `nextFollowUpAt` bump from the same submission.
    const leadUpdates: Record<string, Date | null> = {}
    if (["email_sent", "call", "meeting"].includes(validated.type)) {
      leadUpdates.lastContactedAt = new Date()
    }
    if (input.nextFollowUpAt !== undefined) {
      leadUpdates.nextFollowUpAt = input.nextFollowUpAt
    }
    if (Object.keys(leadUpdates).length) {
      await db.lead.update({ where: { id: leadId }, data: leadUpdates })
    }

    revalidatePath(`${SALES_PATH}/${leadId}`)
    revalidatePath(SALES_PATH)

    return { success: true, data: { id: activity.id } }
  } catch (error) {
    console.error("[logOperatorActivity] Error:", error)
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to log activity",
    }
  }
}

/**
 * Fetch activities for a platform lead, newest first.
 */
export async function getOperatorLeadActivities(
  leadId: string
): Promise<ActionResponse<OperatorLeadActivity[]>> {
  try {
    await requireOperator()

    // Confirm the lead is platform-scoped before joining activities so we
    // can't accidentally surface activity from a real school under this route.
    const lead = await db.lead.findFirst({
      where: { id: leadId, schoolId: PLATFORM_SCHOOL_ID },
      select: { id: true },
    })
    if (!lead) {
      return { success: true, data: [] }
    }

    const activities = await db.leadActivity.findMany({
      where: { leadId, schoolId: PLATFORM_SCHOOL_ID },
      orderBy: { createdAt: "desc" },
      // Using top-level `select` (instead of `include` + nested `select`) so
      // tsc reliably narrows the result; with `include` we observed it
      // falling back to the bare scalar type. User has no top-level `name`
      // field in this schema — use `username` + `email`.
      select: {
        id: true,
        leadId: true,
        type: true,
        description: true,
        createdAt: true,
        createdBy: { select: { id: true, username: true, email: true } },
      },
      take: 100,
    })

    return {
      success: true,
      data: activities.map((a) => ({
        id: a.id,
        leadId: a.leadId,
        type: a.type,
        description: a.description,
        createdAt: a.createdAt,
        createdBy: a.createdBy
          ? {
              id: a.createdBy.id,
              username: a.createdBy.username,
              email: a.createdBy.email,
            }
          : null,
      })),
    }
  } catch (error) {
    console.error("[getOperatorLeadActivities] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch activities",
    }
  }
}
