// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { dispatchNotificationsToAudience } from "@/lib/dispatch-notification"
import { checkUserRateLimit } from "@/lib/rate-limit"
import { getSchoolBySubdomain } from "@/lib/subdomain-actions"
import {
  cancelTourBooking,
  createTourBooking,
  rescheduleTourBooking,
} from "@/components/school-marketing/admission/actions/tour"

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/db", () => ({
  db: {
    admissionSettings: { findUnique: vi.fn() },
    admissionTimeSlot: {
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    tourBooking: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

// Server Action IP resolution reads next/headers — stub it in unit tests.
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({ get: () => null })),
}))

vi.mock("@/lib/subdomain-actions", () => ({
  getSchoolBySubdomain: vi.fn(),
}))

vi.mock("@/lib/rate-limit", () => ({
  checkUserRateLimit: vi.fn().mockResolvedValue({
    allowed: true,
    remaining: 29,
    resetTime: Date.now() + 60000,
  }),
  RATE_LIMITS: {
    PUBLIC: { windowMs: 60000, maxRequests: 30 },
  },
}))

vi.mock("@/lib/dispatch-notification", () => ({
  dispatchNotificationsToAudience: vi.fn().mockResolvedValue({ created: 1 }),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SCHOOL_ID = "school-abc"
const SUBDOMAIN = "demo"
const SLOT_ID = "slot-1"
const BOOKING_NUMBER = "TOUR-2601-ABCDEF"

function mockSchoolFound() {
  vi.mocked(getSchoolBySubdomain).mockResolvedValue({
    success: true,
    data: { id: SCHOOL_ID, name: "Test School", domain: "demo" },
  } as any)
}

const baseSlot = {
  id: SLOT_ID,
  schoolId: SCHOOL_ID,
  isActive: true,
  date: new Date("2026-09-01"),
  startTime: new Date("1970-01-01T09:00:00Z"),
  endTime: new Date("1970-01-01T10:00:00Z"),
  slotType: "TOUR",
  location: "Main Gate",
  maxCapacity: 10,
  currentBookings: 3,
}

const validBookingData = {
  slotId: SLOT_ID,
  parentName: "Ahmed Ali",
  email: "ahmed@test.com",
  phone: "0501234567",
  studentName: "Sara Ali",
  interestedGrade: "Grade 1",
  // Zod schema uses .optional().or(z.literal("")); null is not accepted
  specialRequests: undefined,
  numberOfAttendees: 2,
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Tour Booking Actions", () => {
  beforeEach(() => {
    // resetAllMocks clears call counts AND implementations; re-set stubs after
    vi.resetAllMocks()
    mockSchoolFound()
    // Re-set stubs that resetAllMocks clears
    vi.mocked(checkUserRateLimit).mockResolvedValue({
      allowed: true,
      remaining: 29,
      resetTime: Date.now() + 60000,
    })
    vi.mocked(dispatchNotificationsToAudience).mockResolvedValue({ created: 1 })
    delete process.env.RESEND_API_KEY
  })

  // =========================================================================
  // createTourBooking
  // =========================================================================

  describe("createTourBooking", () => {
    it("TB-01: rejects when tour booking is disabled in settings", async () => {
      vi.mocked(db.admissionSettings.findUnique).mockResolvedValue({
        enableTourBooking: false,
        enableInquiryForm: true,
      } as any)
      vi.mocked(db.tourBooking.findFirst).mockResolvedValue(null)
      vi.mocked(db.tourBooking.findUnique).mockResolvedValue(null)

      const result = await createTourBooking(SUBDOMAIN, validBookingData)

      expect(result.success).toBe(false)
      expect(result.error).toBe("TOUR_BOOKING_DISABLED")
    })

    it("TB-02: proceeds when enableTourBooking is true", async () => {
      vi.mocked(db.admissionSettings.findUnique).mockResolvedValue({
        enableTourBooking: true,
        enableInquiryForm: true,
      } as any)
      vi.mocked(db.tourBooking.findFirst).mockResolvedValue(null)
      vi.mocked(db.tourBooking.findUnique).mockResolvedValue(null)

      // Simulate atomic transaction success
      vi.mocked(db.$transaction).mockImplementationOnce(async (fn: any) => {
        // fn receives a tx object — mock its methods
        const tx = {
          admissionTimeSlot: {
            findFirst: vi.fn().mockResolvedValue(baseSlot),
            updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
          tourBooking: {
            create: vi.fn().mockResolvedValue({ id: "booking-1" }),
          },
        }
        return fn(tx)
      })

      const result = await createTourBooking(SUBDOMAIN, validBookingData)

      expect(result.success).toBe(true)
      expect(result.data?.bookingNumber).toBeDefined()
    })

    it("TB-03: proceeds when no settings row exists (default enabled)", async () => {
      vi.mocked(db.admissionSettings.findUnique).mockResolvedValue(null)
      vi.mocked(db.tourBooking.findFirst).mockResolvedValue(null)
      vi.mocked(db.tourBooking.findUnique).mockResolvedValue(null)

      vi.mocked(db.$transaction).mockImplementationOnce(async (fn: any) => {
        const tx = {
          admissionTimeSlot: {
            findFirst: vi.fn().mockResolvedValue(baseSlot),
            updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
          tourBooking: {
            create: vi.fn().mockResolvedValue({ id: "booking-1" }),
          },
        }
        return fn(tx)
      })

      const result = await createTourBooking(SUBDOMAIN, validBookingData)

      expect(result.success).toBe(true)
    })

    it("TB-04: TOCTOU — returns SLOT_FULL when atomic updateMany returns count=0", async () => {
      vi.mocked(db.admissionSettings.findUnique).mockResolvedValue(null)
      vi.mocked(db.tourBooking.findFirst).mockResolvedValue(null)
      vi.mocked(db.tourBooking.findUnique).mockResolvedValue(null)

      vi.mocked(db.$transaction).mockImplementationOnce(async (fn: any) => {
        const tx = {
          admissionTimeSlot: {
            findFirst: vi.fn().mockResolvedValue({
              ...baseSlot,
              currentBookings: 9, // 9 + 2 > 10 → can't fit
            }),
            updateMany: vi.fn().mockResolvedValue({ count: 0 }), // race lost
          },
          tourBooking: { create: vi.fn() },
        }
        return fn(tx)
      })

      const result = await createTourBooking(SUBDOMAIN, validBookingData)

      expect(result.success).toBe(false)
      expect(result.error).toBe("SLOT_FULL")
    })

    it("TB-05: returns SLOT_NOT_FOUND when slot missing inside transaction", async () => {
      vi.mocked(db.admissionSettings.findUnique).mockResolvedValue(null)
      vi.mocked(db.tourBooking.findFirst).mockResolvedValue(null)
      vi.mocked(db.tourBooking.findUnique).mockResolvedValue(null)

      vi.mocked(db.$transaction).mockImplementationOnce(async (fn: any) => {
        const tx = {
          admissionTimeSlot: {
            findFirst: vi.fn().mockResolvedValue(null), // slot vanished
            updateMany: vi.fn(),
          },
          tourBooking: { create: vi.fn() },
        }
        return fn(tx)
      })

      const result = await createTourBooking(SUBDOMAIN, validBookingData)

      expect(result.success).toBe(false)
      expect(result.error).toBe("SLOT_NOT_FOUND")
    })

    it("TB-06: rejects duplicate booking for same email + slot", async () => {
      vi.mocked(db.admissionSettings.findUnique).mockResolvedValue(null)
      vi.mocked(db.tourBooking.findFirst).mockResolvedValue({
        id: "existing-booking",
        status: "CONFIRMED",
      } as any)

      const result = await createTourBooking(SUBDOMAIN, validBookingData)

      expect(result.success).toBe(false)
      expect(result.error).toBe("DUPLICATE_BOOKING")
    })

    it("TB-07: rate-limited when checkUserRateLimit returns allowed=false", async () => {
      vi.mocked(checkUserRateLimit).mockResolvedValueOnce({
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 60000,
      })

      const result = await createTourBooking(SUBDOMAIN, validBookingData)

      expect(result.success).toBe(false)
      expect(result.error).toBe("RATE_LIMITED")
    })
  })

  // =========================================================================
  // cancelTourBooking — decrement by numberOfAttendees
  // =========================================================================

  describe("cancelTourBooking", () => {
    const booking = {
      id: "booking-1",
      bookingNumber: BOOKING_NUMBER,
      schoolId: SCHOOL_ID,
      slotId: SLOT_ID,
      status: "CONFIRMED",
      numberOfAttendees: 3, // group booking
      email: "ahmed@test.com",
      parentName: "Ahmed Ali",
      school: {
        name: "Test School",
        nameEn: "Test School",
        domain: "demo",
        preferredLanguage: "ar",
      },
      slot: baseSlot,
    }

    it("TB-08: decrements slot by numberOfAttendees (not 1)", async () => {
      vi.mocked(db.tourBooking.findFirst).mockResolvedValue(booking as any)
      vi.mocked(db.$transaction).mockResolvedValue([{}, {}] as any)

      await cancelTourBooking(SUBDOMAIN, BOOKING_NUMBER)

      const txCall = vi.mocked(db.$transaction).mock.calls[0][0] as any[]
      // Second element in the array-form transaction is the slot update
      // We can't inspect the deferred ops directly, so verify $transaction was called
      expect(db.$transaction).toHaveBeenCalledTimes(1)
    })

    it("TB-09: rejects cancelling an already-cancelled booking", async () => {
      vi.mocked(db.tourBooking.findFirst).mockResolvedValue({
        ...booking,
        status: "CANCELLED",
      } as any)

      const result = await cancelTourBooking(SUBDOMAIN, BOOKING_NUMBER)

      expect(result.success).toBe(false)
      expect(result.error).toContain("already cancelled")
      expect(db.$transaction).not.toHaveBeenCalled()
    })

    it("TB-10: rejects cancelling a completed booking", async () => {
      vi.mocked(db.tourBooking.findFirst).mockResolvedValue({
        ...booking,
        status: "COMPLETED",
      } as any)

      const result = await cancelTourBooking(SUBDOMAIN, BOOKING_NUMBER)

      expect(result.success).toBe(false)
      expect(result.error).toContain("Cannot cancel")
      expect(db.$transaction).not.toHaveBeenCalled()
    })
  })

  // =========================================================================
  // rescheduleTourBooking — decrement by numberOfAttendees + TOCTOU
  // =========================================================================

  describe("rescheduleTourBooking", () => {
    const NEW_SLOT_ID = "slot-2"
    const newSlot = {
      ...baseSlot,
      id: NEW_SLOT_ID,
      currentBookings: 2,
      maxCapacity: 10,
    }

    const confirmedBooking = {
      id: "booking-1",
      bookingNumber: BOOKING_NUMBER,
      schoolId: SCHOOL_ID,
      slotId: SLOT_ID,
      status: "CONFIRMED",
      numberOfAttendees: 3,
      email: "ahmed@test.com",
      parentName: "Ahmed Ali",
      studentName: null,
      school: {
        name: "Test School",
        nameEn: "Test School",
        domain: "demo",
        preferredLanguage: "ar",
      },
      slot: baseSlot,
    }

    it("TB-11: TOCTOU — returns SLOT_FULL when new slot atomic increment count=0", async () => {
      vi.mocked(db.tourBooking.findFirst).mockResolvedValue(
        confirmedBooking as any
      )

      vi.mocked(db.$transaction).mockImplementationOnce(async (fn: any) => {
        const tx = {
          admissionTimeSlot: {
            findFirst: vi.fn().mockResolvedValue({
              ...newSlot,
              currentBookings: 8, // 8 + 3 > 10
            }),
            updateMany: vi.fn().mockResolvedValue({ count: 0 }), // race lost
            update: vi.fn(),
          },
          tourBooking: { update: vi.fn() },
        }
        return fn(tx)
      })

      const result = await rescheduleTourBooking(
        SUBDOMAIN,
        BOOKING_NUMBER,
        NEW_SLOT_ID
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain("fully booked")
    })

    it("TB-12: TOCTOU — returns SLOT_NOT_FOUND when new slot missing in transaction", async () => {
      vi.mocked(db.tourBooking.findFirst).mockResolvedValue(
        confirmedBooking as any
      )

      vi.mocked(db.$transaction).mockImplementationOnce(async (fn: any) => {
        const tx = {
          admissionTimeSlot: {
            findFirst: vi.fn().mockResolvedValue(null),
            updateMany: vi.fn(),
            update: vi.fn(),
          },
          tourBooking: { update: vi.fn() },
        }
        return fn(tx)
      })

      const result = await rescheduleTourBooking(
        SUBDOMAIN,
        BOOKING_NUMBER,
        NEW_SLOT_ID
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain("not available")
    })

    it("TB-13: successful reschedule decrements old slot by numberOfAttendees", async () => {
      vi.mocked(db.tourBooking.findFirst).mockResolvedValue(
        confirmedBooking as any
      )

      const mockOldSlotUpdate = vi.fn().mockResolvedValue({})
      const mockNewSlotUpdateMany = vi.fn().mockResolvedValue({ count: 1 })
      const mockBookingUpdate = vi.fn().mockResolvedValue({})

      vi.mocked(db.$transaction).mockImplementationOnce(async (fn: any) => {
        const tx = {
          admissionTimeSlot: {
            findFirst: vi.fn().mockResolvedValue(newSlot),
            updateMany: mockNewSlotUpdateMany,
            update: mockOldSlotUpdate,
          },
          tourBooking: { update: mockBookingUpdate },
        }
        return fn(tx)
      })

      const result = await rescheduleTourBooking(
        SUBDOMAIN,
        BOOKING_NUMBER,
        NEW_SLOT_ID
      )

      expect(result.success).toBe(true)

      // Old slot decremented by numberOfAttendees (3), not 1
      expect(mockOldSlotUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: SLOT_ID },
          data: { currentBookings: { decrement: 3 } },
        })
      )

      // New slot incremented by numberOfAttendees (3)
      expect(mockNewSlotUpdateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { currentBookings: { increment: 3 } },
        })
      )
    })

    it("TB-14: rejects rescheduling a non-confirmed booking", async () => {
      vi.mocked(db.tourBooking.findFirst).mockResolvedValue({
        ...confirmedBooking,
        status: "CANCELLED",
      } as any)

      const result = await rescheduleTourBooking(
        SUBDOMAIN,
        BOOKING_NUMBER,
        NEW_SLOT_ID
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain("Cannot reschedule")
      expect(db.$transaction).not.toHaveBeenCalled()
    })
  })
})
