// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Read-only database queries for the Leads tab (Inquiries + Tour Bookings).
 * All queries are scoped by schoolId for multi-tenant isolation.
 */

import type { BookingStatus, InquiryStatus } from "@prisma/client"
import { Prisma } from "@prisma/client"

import { db } from "@/lib/db"

// ============================================================================
// Types
// ============================================================================

export type InquiryListFilters = {
  search?: string
  status?: string
  source?: string
}

export type TourBookingListFilters = {
  search?: string
  status?: string
}

export type LeadsPaginationParams = {
  page: number
  perPage: number
}

export type LeadsSortParam = {
  id: string
  desc: boolean
}

// ============================================================================
// Select shapes
// ============================================================================

export const inquiryListSelect = {
  id: true,
  parentName: true,
  email: true,
  phone: true,
  studentName: true,
  interestedGrade: true,
  source: true,
  status: true,
  followUpDate: true,
  assignedTo: true,
  notes: true,
  convertedToApplicationId: true,
  createdAt: true,
  updatedAt: true,
} as const

export const tourBookingListSelect = {
  id: true,
  bookingNumber: true,
  parentName: true,
  email: true,
  phone: true,
  studentName: true,
  interestedGrade: true,
  status: true,
  numberOfAttendees: true,
  attendedAt: true,
  cancelledAt: true,
  cancelReason: true,
  specialRequests: true,
  createdAt: true,
  updatedAt: true,
  slot: {
    select: {
      id: true,
      date: true,
      startTime: true,
      endTime: true,
      slotType: true,
      location: true,
    },
  },
} as const

// ============================================================================
// Inquiries
// ============================================================================

export async function getInquiriesList(
  schoolId: string,
  filters: InquiryListFilters &
    LeadsPaginationParams & { sort?: LeadsSortParam[] }
) {
  const { search, status, source, page, perPage, sort = [] } = filters
  const skip = (page - 1) * perPage

  const where: Prisma.AdmissionInquiryWhereInput = {
    schoolId,
    ...(search && {
      OR: [
        { parentName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { studentName: { contains: search, mode: "insensitive" } },
      ],
    }),
    ...(status && { status: status as InquiryStatus }),
    ...(source && { source }),
  }

  const orderBy: Prisma.AdmissionInquiryOrderByWithRelationInput[] =
    sort.length > 0
      ? sort.map((s) => ({ [s.id]: s.desc ? "desc" : "asc" }))
      : [{ createdAt: "desc" }]

  const [rows, count] = await Promise.all([
    db.admissionInquiry.findMany({
      where,
      select: inquiryListSelect,
      orderBy,
      skip,
      take: perPage,
    }),
    db.admissionInquiry.count({ where }),
  ])

  return { rows, count }
}

// ============================================================================
// Tour Bookings
// ============================================================================

export async function getTourBookingsList(
  schoolId: string,
  filters: TourBookingListFilters &
    LeadsPaginationParams & { sort?: LeadsSortParam[] }
) {
  const { search, status, page, perPage, sort = [] } = filters
  const skip = (page - 1) * perPage

  const where: Prisma.TourBookingWhereInput = {
    schoolId,
    ...(search && {
      OR: [
        { parentName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { studentName: { contains: search, mode: "insensitive" } },
        { bookingNumber: { contains: search, mode: "insensitive" } },
      ],
    }),
    ...(status && { status: status as BookingStatus }),
  }

  const orderBy: Prisma.TourBookingOrderByWithRelationInput[] =
    sort.length > 0
      ? sort.map((s) => ({ [s.id]: s.desc ? "desc" : "asc" }))
      : [{ createdAt: "desc" }]

  const [rows, count] = await Promise.all([
    db.tourBooking.findMany({
      where,
      select: tourBookingListSelect,
      orderBy,
      skip,
      take: perPage,
    }),
    db.tourBooking.count({ where }),
  ])

  return { rows, count }
}
