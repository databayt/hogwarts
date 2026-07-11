"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import type { BookingStatus, InquiryStatus } from "@prisma/client"

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

    const { schoolId } = await getTenantContext()
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

    const { schoolId } = await getTenantContext()
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

    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "MISSING_SCHOOL_CONTEXT" }

    // Verify the inquiry belongs to this school
    const inquiry = await db.admissionInquiry.findFirst({
      where: { id: params.id, schoolId },
      select: { id: true },
    })
    if (!inquiry) return { success: false, error: "INQUIRY_NOT_FOUND" }

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

    revalidatePath("/s/[subdomain]/admission/leads", "page")
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

    const { schoolId } = await getTenantContext()
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

    revalidatePath("/s/[subdomain]/admission/leads", "page")
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

    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "MISSING_SCHOOL_CONTEXT" }

    // Verify the booking belongs to this school (tenant isolation)
    const booking = await db.tourBooking.findFirst({
      where: { id: params.id, schoolId },
      select: { id: true, status: true, slotId: true, numberOfAttendees: true },
    })
    if (!booking) return { success: false, error: "BOOKING_NOT_FOUND" }

    const now = new Date()

    if (params.status === "CANCELLED") {
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

    revalidatePath("/s/[subdomain]/admission/leads", "page")
    return { success: true, data: null }
  } catch (err) {
    console.error("[updateTourBookingStatus]", err)
    if (isPermissionDenied(err)) {
      return { success: false, error: "FORBIDDEN" }
    }
    return { success: false, error: "INTERNAL_ERROR" }
  }
}
