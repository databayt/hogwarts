"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { InquiryStatus, type BookingStatus } from "@prisma/client"
import { z } from "zod"

import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { assertAdmissionPermission, isPermissionDenied } from "../authorization"
import {
  getInquiriesList,
  getTourBookingsList,
  type InquiryListFilters,
  type LeadsSortParam,
  type TourBookingListFilters,
} from "./leads-queries"

const updateInquiryStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(InquiryStatus),
  followUpDate: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)))
    .nullish(),
  notes: z.string().max(5000).nullish(),
  assignedTo: z.string().min(1).nullish(),
})

// ============================================================================
// Tenant resolution
// ============================================================================

// A server action runs without the dashboard layout, so the layout's
// session-school == subdomain check never guards it. getTenantContext() prefers
// the x-subdomain header over the session, which let a STAFF of school A read
// and edit school B's leads by calling these actions on B's host. School roles
// are bound to their own school; only DEVELOPER (no schoolId) follows the
// tenant context (impersonation / subdomain).
async function resolveLeadsSchoolId(user: {
  role?: string | null
  schoolId?: string | null
}): Promise<string | null> {
  if (user.role === "DEVELOPER") {
    const { schoolId } = await getTenantContext()
    return schoolId ?? null
  }
  return user.schoolId ?? null
}

// ============================================================================
// Paginated fetch actions (called from client via usePlatformData)
// ============================================================================

export async function getInquiries(params: {
  page?: number
  perPage?: number
  search?: string
  status?: string
  source?: string
  sort?: LeadsSortParam[]
}): Promise<ActionResponse<{ rows: unknown[]; total: number }>> {
  try {
    const session = await auth()
    if (!session?.user) return { success: false, error: "NOT_AUTHENTICATED" }

    const role = session.user.role ?? ""
    assertAdmissionPermission(role, "viewApplications")

    const schoolId = await resolveLeadsSchoolId(session.user)
    if (!schoolId) return { success: false, error: "MISSING_SCHOOL_CONTEXT" }

    const { rows, count } = await getInquiriesList(schoolId, {
      search: params.search,
      status: params.status,
      source: params.source,
      page: params.page ?? 1,
      perPage: params.perPage ?? 20,
      sort: params.sort,
    })

    return { success: true, data: { rows, total: count } }
  } catch (err) {
    console.error("[getInquiries]", err)
    if (isPermissionDenied(err)) {
      return { success: false, error: "FORBIDDEN" }
    }
    return { success: false, error: "INTERNAL_ERROR" }
  }
}

export async function getTourBookings(params: {
  page?: number
  perPage?: number
  search?: string
  status?: string
  sort?: LeadsSortParam[]
}): Promise<ActionResponse<{ rows: unknown[]; total: number }>> {
  try {
    const session = await auth()
    if (!session?.user) return { success: false, error: "NOT_AUTHENTICATED" }

    const role = session.user.role ?? ""
    assertAdmissionPermission(role, "viewApplications")

    const schoolId = await resolveLeadsSchoolId(session.user)
    if (!schoolId) return { success: false, error: "MISSING_SCHOOL_CONTEXT" }

    const { rows, count } = await getTourBookingsList(schoolId, {
      search: params.search,
      status: params.status,
      page: params.page ?? 1,
      perPage: params.perPage ?? 20,
      sort: params.sort,
    })

    return { success: true, data: { rows, total: count } }
  } catch (err) {
    console.error("[getTourBookings]", err)
    if (isPermissionDenied(err)) {
      return { success: false, error: "FORBIDDEN" }
    }
    return { success: false, error: "INTERNAL_ERROR" }
  }
}

// ============================================================================
// Mutation actions
// ============================================================================

export async function updateInquiryStatus(params: {
  id: string
  status: InquiryStatus
  followUpDate?: string | null
  notes?: string | null
  assignedTo?: string | null
}): Promise<ActionResponse<null>> {
  try {
    const session = await auth()
    if (!session?.user) return { success: false, error: "NOT_AUTHENTICATED" }

    const role = session.user.role ?? ""
    assertAdmissionPermission(role, "updateStatus")

    const schoolId = await resolveLeadsSchoolId(session.user)
    if (!schoolId) return { success: false, error: "MISSING_SCHOOL_CONTEXT" }

    const parsed = updateInquiryStatusSchema.safeParse(params)
    if (!parsed.success) return { success: false, error: "VALIDATION_ERROR" }
    params = parsed.data

    // Verify the inquiry belongs to this school
    const inquiry = await db.admissionInquiry.findFirst({
      where: { id: params.id, schoolId },
      select: { id: true },
    })
    if (!inquiry) return { success: false, error: "INQUIRY_NOT_FOUND" }

    // The assignee must be a member of this school's staff, not any user id.
    if (params.assignedTo) {
      const assignee = await db.user.findFirst({
        where: { id: params.assignedTo, schoolId },
        select: { id: true },
      })
      if (!assignee) return { success: false, error: "VALIDATION_ERROR" }
    }

    await db.admissionInquiry.update({
      where: { id: params.id },
      data: {
        status: params.status,
        ...(params.followUpDate !== undefined && {
          followUpDate: params.followUpDate
            ? new Date(params.followUpDate)
            : null,
        }),
        ...(params.notes !== undefined && { notes: params.notes }),
        ...(params.assignedTo !== undefined && {
          assignedTo: params.assignedTo,
        }),
      },
    })

    revalidatePath("/[lang]/s/[subdomain]/admission/leads", "page")
    return { success: true, data: null }
  } catch (err) {
    console.error("[updateInquiryStatus]", err)
    if (isPermissionDenied(err)) {
      return { success: false, error: "FORBIDDEN" }
    }
    return { success: false, error: "INTERNAL_ERROR" }
  }
}

export async function markInquiryConverted(params: {
  id: string
  convertedToApplicationId: string
}): Promise<ActionResponse<null>> {
  try {
    const session = await auth()
    if (!session?.user) return { success: false, error: "NOT_AUTHENTICATED" }

    const role = session.user.role ?? ""
    assertAdmissionPermission(role, "updateStatus")

    const schoolId = await resolveLeadsSchoolId(session.user)
    if (!schoolId) return { success: false, error: "MISSING_SCHOOL_CONTEXT" }

    // Verify the inquiry belongs to this school
    const inquiry = await db.admissionInquiry.findFirst({
      where: { id: params.id, schoolId },
      select: { id: true },
    })
    if (!inquiry) return { success: false, error: "INQUIRY_NOT_FOUND" }

    // Verify the application belongs to this school
    const application = await db.application.findFirst({
      where: { id: params.convertedToApplicationId, schoolId },
      select: { id: true },
    })
    if (!application) return { success: false, error: "APPLICATION_NOT_FOUND" }

    await db.admissionInquiry.update({
      where: { id: params.id },
      data: {
        status: "CONVERTED",
        convertedToApplicationId: params.convertedToApplicationId,
      },
    })

    revalidatePath("/[lang]/s/[subdomain]/admission/leads", "page")
    return { success: true, data: null }
  } catch (err) {
    console.error("[markInquiryConverted]", err)
    if (isPermissionDenied(err)) {
      return { success: false, error: "FORBIDDEN" }
    }
    return { success: false, error: "INTERNAL_ERROR" }
  }
}

export async function updateTourBookingStatus(params: {
  id: string
  status: Extract<
    BookingStatus,
    "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW"
  >
  cancelReason?: string | null
}): Promise<ActionResponse<null>> {
  try {
    const session = await auth()
    if (!session?.user) return { success: false, error: "NOT_AUTHENTICATED" }

    const role = session.user.role ?? ""
    assertAdmissionPermission(role, "updateStatus")

    const schoolId = await resolveLeadsSchoolId(session.user)
    if (!schoolId) return { success: false, error: "MISSING_SCHOOL_CONTEXT" }

    // Verify the booking belongs to this school (tenant isolation)
    const booking = await db.tourBooking.findFirst({
      where: { id: params.id, schoolId },
      select: { id: true, status: true, slotId: true, numberOfAttendees: true },
    })
    if (!booking) return { success: false, error: "BOOKING_NOT_FOUND" }

    const now = new Date()

    if (params.status === "CANCELLED") {
      // Already cancelled (by the family or another admin): the seats were
      // released then — decrementing again drives currentBookings negative.
      if (booking.status === "CANCELLED") return { success: true, data: null }
      // Decrement slot capacity when cancelling from dashboard
      await db.$transaction([
        db.tourBooking.update({
          where: { id: params.id },
          data: {
            status: "CANCELLED",
            cancelledAt: now,
            cancelReason: params.cancelReason ?? null,
          },
        }),
        db.admissionTimeSlot.update({
          where: { id: booking.slotId },
          data: { currentBookings: { decrement: booking.numberOfAttendees } },
        }),
      ])
    } else {
      await db.tourBooking.update({
        where: { id: params.id },
        data: {
          status: params.status,
          ...(params.status === "COMPLETED" && { attendedAt: now }),
        },
      })
    }

    revalidatePath("/[lang]/s/[subdomain]/admission/leads", "page")
    return { success: true, data: null }
  } catch (err) {
    console.error("[updateTourBookingStatus]", err)
    if (isPermissionDenied(err)) {
      return { success: false, error: "FORBIDDEN" }
    }
    return { success: false, error: "INTERNAL_ERROR" }
  }
}
