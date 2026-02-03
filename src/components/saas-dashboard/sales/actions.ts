"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { LeadPriority, LeadSource, LeadStatus, LeadType } from "@prisma/client"
import { z } from "zod"

import { db } from "@/lib/db"
import {
  createLeadSchema,
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

// Platform schoolId for saas-dashboard-level leads (no tenant scoping)
const PLATFORM_SCHOOL_ID = "platform"

// ============================================================================
// Helper Functions
// ============================================================================

async function getOperatorContext() {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  // Check if user is a school-dashboard admin (DEVELOPER role)
  const isPlatformAdmin = session.user.role === "DEVELOPER"
  if (!isPlatformAdmin) {
    throw new Error("Unauthorized: Platform admin access required")
  }

  return { userId: session.user.id }
}

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
    const { userId } = await getOperatorContext()

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
    await getOperatorContext()

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
    await getOperatorContext()

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
      status: LeadStatus
      source: LeadSource
      priority: LeadPriority
      score: number
      verified: boolean
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
    await getOperatorContext()

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
    if (filters?.verified !== undefined) where.verified = filters.verified

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
        status: true,
        source: true,
        priority: true,
        score: true,
        verified: true,
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

/**
 * Get a single school-dashboard-level lead by ID
 */
export async function getOperatorLeadById(id: string): Promise<
  ActionResponse<{
    id: string
    name: string
    email: string | null
    phone: string | null
    company: string | null
    title: string | null
    website: string | null
    linkedinUrl: string | null
    leadType: LeadType
    industry: string | null
    location: string | null
    status: LeadStatus
    source: LeadSource
    priority: LeadPriority
    score: number
    verified: boolean
    notes: string | null
    tags: string[]
    createdAt: Date
    updatedAt: Date
  } | null>
> {
  try {
    await getOperatorContext()

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
        company: lead.company,
        title: lead.title,
        website: lead.website,
        linkedinUrl: lead.linkedinUrl,
        leadType: lead.leadType,
        industry: lead.industry,
        location: lead.location,
        status: lead.status,
        source: lead.source,
        priority: lead.priority,
        score: lead.score,
        verified: lead.verified,
        notes: lead.notes,
        tags: lead.tags,
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
