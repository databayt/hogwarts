// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getSchoolBySubdomain } from "@/lib/subdomain-actions"

import {
  getApplicationStatus,
  requestStatusOTP,
  verifyStatusOTP,
} from "../status"

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/db", () => ({
  db: {
    application: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    admissionOTP: {
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    school: {
      findFirst: vi.fn(),
    },
  },
}))

vi.mock("@/lib/subdomain-actions", () => ({
  getSchoolBySubdomain: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SCHOOL_ID = "school-123"
const SUBDOMAIN = "demo"
const APP_NUMBER = "APP-2026-001"
const EMAIL = "ahmed@test.com"

function mockSchoolFound() {
  vi.mocked(getSchoolBySubdomain).mockResolvedValue({
    success: true,
    data: { id: SCHOOL_ID, name: "Test School" },
  } as any)
}

function mockSchoolNotFound() {
  vi.mocked(getSchoolBySubdomain).mockResolvedValue({
    success: false,
    data: null,
  } as any)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Status Tracking", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSchoolFound()
    // Remove RESEND_API_KEY to prevent actual email sending
    delete process.env.RESEND_API_KEY
  })

  // =========================================================================
  // requestStatusOTP
  // =========================================================================

  describe("requestStatusOTP", () => {
    it("sends OTP for valid application", async () => {
      vi.mocked(db.application.findFirst).mockResolvedValue({
        id: "app-1",
        applicationNumber: APP_NUMBER,
        email: EMAIL,
        schoolId: SCHOOL_ID,
      } as any)
      vi.mocked(db.admissionOTP.count).mockResolvedValue(0)
      vi.mocked(db.admissionOTP.create).mockResolvedValue({
        id: "otp-1",
      } as any)

      const result = await requestStatusOTP(SUBDOMAIN, APP_NUMBER, EMAIL)

      expect(result.success).toBe(true)
      expect(result.data?.message).toContain("Verification code sent")

      // Verify OTP was saved to database
      expect(db.admissionOTP.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          schoolId: SCHOOL_ID,
          email: EMAIL,
          applicationNumber: APP_NUMBER,
          otp: expect.stringMatching(/^\d{6}$/),
          expiresAt: expect.any(Date),
        }),
      })
    })

    it("rejects when school not found", async () => {
      mockSchoolNotFound()

      const result = await requestStatusOTP(SUBDOMAIN, APP_NUMBER, EMAIL)

      expect(result.success).toBe(false)
      expect(result.error).toBe("School not found")
    })

    it("rejects when application not found", async () => {
      vi.mocked(db.application.findFirst).mockResolvedValue(null)

      const result = await requestStatusOTP(SUBDOMAIN, APP_NUMBER, EMAIL)

      expect(result.success).toBe(false)
      expect(result.error).toContain("Application not found")
    })

    it("rate limits after 3 requests per hour", async () => {
      vi.mocked(db.application.findFirst).mockResolvedValue({
        id: "app-1",
        applicationNumber: APP_NUMBER,
        email: EMAIL,
        schoolId: SCHOOL_ID,
      } as any)
      // Simulate 3 recent OTPs
      vi.mocked(db.admissionOTP.count).mockResolvedValue(3)

      const result = await requestStatusOTP(SUBDOMAIN, APP_NUMBER, EMAIL)

      expect(result.success).toBe(false)
      expect(result.error).toContain("Too many OTP requests")
      expect(db.admissionOTP.create).not.toHaveBeenCalled()
    })

    it("allows request when under rate limit", async () => {
      vi.mocked(db.application.findFirst).mockResolvedValue({
        id: "app-1",
        applicationNumber: APP_NUMBER,
        email: EMAIL,
        schoolId: SCHOOL_ID,
      } as any)
      vi.mocked(db.admissionOTP.count).mockResolvedValue(2)
      vi.mocked(db.admissionOTP.create).mockResolvedValue({
        id: "otp-1",
      } as any)

      const result = await requestStatusOTP(SUBDOMAIN, APP_NUMBER, EMAIL)

      expect(result.success).toBe(true)
    })

    it("checks rate limit scoped by schoolId and email", async () => {
      vi.mocked(db.application.findFirst).mockResolvedValue({
        id: "app-1",
        applicationNumber: APP_NUMBER,
        email: EMAIL,
        schoolId: SCHOOL_ID,
      } as any)
      vi.mocked(db.admissionOTP.count).mockResolvedValue(0)
      vi.mocked(db.admissionOTP.create).mockResolvedValue({
        id: "otp-1",
      } as any)

      await requestStatusOTP(SUBDOMAIN, APP_NUMBER, EMAIL)

      expect(db.admissionOTP.count).toHaveBeenCalledWith({
        where: {
          schoolId: SCHOOL_ID,
          email: EMAIL,
          createdAt: {
            gte: expect.any(Date),
          },
        },
      })
    })
  })

  // =========================================================================
  // verifyStatusOTP
  // =========================================================================

  describe("verifyStatusOTP", () => {
    it("verifies correct OTP and returns access token", async () => {
      vi.mocked(db.admissionOTP.findFirst).mockResolvedValueOnce({
        id: "otp-1",
        otp: "123456",
        verified: false,
        expiresAt: new Date(Date.now() + 600000),
        attempts: 0,
      } as any)
      vi.mocked(db.admissionOTP.update).mockResolvedValue({} as any)
      vi.mocked(db.application.findFirst).mockResolvedValue({
        id: "app-1",
        applicationNumber: APP_NUMBER,
        accessToken: null,
        accessTokenExpiry: null,
      } as any)
      vi.mocked(db.application.update).mockResolvedValue({} as any)

      const result = await verifyStatusOTP(SUBDOMAIN, APP_NUMBER, "123456")

      expect(result.success).toBe(true)
      expect(result.data?.accessToken).toBeDefined()
      expect(typeof result.data?.accessToken).toBe("string")

      // OTP should be marked as verified
      expect(db.admissionOTP.update).toHaveBeenCalledWith({
        where: { id: "otp-1" },
        data: { verified: true },
      })
    })

    it("reuses existing valid access token", async () => {
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      vi.mocked(db.admissionOTP.findFirst).mockResolvedValueOnce({
        id: "otp-1",
        otp: "123456",
        verified: false,
        expiresAt: new Date(Date.now() + 600000),
        attempts: 0,
      } as any)
      vi.mocked(db.admissionOTP.update).mockResolvedValue({} as any)
      vi.mocked(db.application.findFirst).mockResolvedValue({
        id: "app-1",
        applicationNumber: APP_NUMBER,
        accessToken: "existing-token-abc",
        accessTokenExpiry: futureDate,
      } as any)

      const result = await verifyStatusOTP(SUBDOMAIN, APP_NUMBER, "123456")

      expect(result.success).toBe(true)
      expect(result.data?.accessToken).toBe("existing-token-abc")
      // Should NOT update the application when token is still valid
      expect(db.application.update).not.toHaveBeenCalled()
    })

    it("rejects invalid OTP", async () => {
      // First findFirst (correct OTP match) returns null
      vi.mocked(db.admissionOTP.findFirst)
        .mockResolvedValueOnce(null)
        // Second findFirst (any OTP for attempts tracking) returns an OTP record
        .mockResolvedValueOnce({
          id: "otp-1",
          otp: "123456",
          verified: false,
          expiresAt: new Date(Date.now() + 600000),
          attempts: 1,
        } as any)
      vi.mocked(db.admissionOTP.update).mockResolvedValue({} as any)

      const result = await verifyStatusOTP(SUBDOMAIN, APP_NUMBER, "999999")

      expect(result.success).toBe(false)
      expect(result.error).toContain("Invalid or expired")

      // Attempts should be incremented
      expect(db.admissionOTP.update).toHaveBeenCalledWith({
        where: { id: "otp-1" },
        data: { attempts: { increment: 1 } },
      })
    })

    it("locks after 5 failed attempts", async () => {
      // First findFirst (correct OTP match) returns null
      vi.mocked(db.admissionOTP.findFirst)
        .mockResolvedValueOnce(null)
        // Second findFirst (any OTP for attempts tracking)
        .mockResolvedValueOnce({
          id: "otp-1",
          otp: "123456",
          verified: false,
          expiresAt: new Date(Date.now() + 600000),
          attempts: 4, // Will be >= 4, triggering lockout
        } as any)
      vi.mocked(db.admissionOTP.update).mockResolvedValue({} as any)

      const result = await verifyStatusOTP(SUBDOMAIN, APP_NUMBER, "999999")

      expect(result.success).toBe(false)
      expect(result.error).toContain("Too many invalid attempts")

      // OTP should be invalidated (expiresAt set to now)
      const updateCalls = vi.mocked(db.admissionOTP.update).mock.calls
      const invalidateCall = updateCalls.find(
        (call) =>
          (call[0] as any)?.data?.expiresAt instanceof Date &&
          !(call[0] as any)?.data?.attempts
      )
      expect(invalidateCall).toBeDefined()
    })

    it("rejects expired OTP (>10 min)", async () => {
      // findFirst with expiresAt gte: new Date() returns null because OTP is expired
      vi.mocked(db.admissionOTP.findFirst)
        .mockResolvedValueOnce(null)
        // No existing OTP either (all expired)
        .mockResolvedValueOnce(null)

      const result = await verifyStatusOTP(SUBDOMAIN, APP_NUMBER, "123456")

      expect(result.success).toBe(false)
      expect(result.error).toContain("Invalid or expired")
    })

    it("rejects when school not found", async () => {
      mockSchoolNotFound()

      const result = await verifyStatusOTP(SUBDOMAIN, APP_NUMBER, "123456")

      expect(result.success).toBe(false)
      expect(result.error).toBe("School not found")
    })

    it("rejects when application not found after OTP verification", async () => {
      vi.mocked(db.admissionOTP.findFirst).mockResolvedValueOnce({
        id: "otp-1",
        otp: "123456",
        verified: false,
        expiresAt: new Date(Date.now() + 600000),
        attempts: 0,
      } as any)
      vi.mocked(db.admissionOTP.update).mockResolvedValue({} as any)
      vi.mocked(db.application.findFirst).mockResolvedValue(null)

      const result = await verifyStatusOTP(SUBDOMAIN, APP_NUMBER, "123456")

      expect(result.success).toBe(false)
      expect(result.error).toBe("Application not found")
    })
  })

  // =========================================================================
  // getApplicationStatus
  // =========================================================================

  describe("getApplicationStatus", () => {
    it("returns status timeline for valid access token", async () => {
      vi.mocked(db.application.findFirst).mockResolvedValue({
        id: "app-1",
        applicationNumber: APP_NUMBER,
        status: "UNDER_REVIEW",
        submittedAt: new Date("2026-01-15"),
        updatedAt: new Date("2026-01-20"),
        applicationFeePaid: true,
        documents: [],
        campaign: {
          name: "Fall 2026",
          requiredDocuments: [],
          applicationFee: 500,
        },
        communications: [],
        tourBookings: [],
      } as any)

      const result = await getApplicationStatus("valid-token")

      expect(result.success).toBe(true)
      expect(result.data?.applicationNumber).toBe(APP_NUMBER)
      expect(result.data?.status).toBe("UNDER_REVIEW")

      // Verify timeline structure
      const timeline = result.data?.timeline
      expect(timeline).toBeDefined()
      expect(timeline!.length).toBeGreaterThan(0)

      // DRAFT and SUBMITTED should be completed (before UNDER_REVIEW)
      const draftStep = timeline!.find((s) => s.status === "DRAFT")
      expect(draftStep?.completed).toBe(true)

      const submittedStep = timeline!.find((s) => s.status === "SUBMITTED")
      expect(submittedStep?.completed).toBe(true)

      // UNDER_REVIEW should be current
      const currentStep = timeline!.find((s) => s.status === "UNDER_REVIEW")
      expect(currentStep?.current).toBe(true)
      expect(currentStep?.completed).toBe(false)

      // SHORTLISTED and later should not be completed
      const shortlistedStep = timeline!.find((s) => s.status === "SHORTLISTED")
      expect(shortlistedStep?.completed).toBe(false)
      expect(shortlistedStep?.current).toBe(false)
    })

    it("includes checklist with application submission and payment status", async () => {
      vi.mocked(db.application.findFirst).mockResolvedValue({
        id: "app-1",
        applicationNumber: APP_NUMBER,
        status: "SUBMITTED",
        submittedAt: new Date("2026-01-15"),
        updatedAt: new Date("2026-01-15"),
        applicationFeePaid: false,
        documents: [],
        campaign: {
          name: "Fall 2026",
          requiredDocuments: [],
          applicationFee: 500,
        },
        communications: [],
        tourBookings: [],
      } as any)

      const result = await getApplicationStatus("valid-token")

      expect(result.success).toBe(true)
      const checklist = result.data?.checklist
      expect(checklist).toBeDefined()

      // Application submitted should be completed
      const appItem = checklist!.find((c) => c.id === "application")
      expect(appItem?.completed).toBe(true)

      // Payment should be not completed
      const paymentItem = checklist!.find((c) => c.id === "payment")
      expect(paymentItem?.completed).toBe(false)
      expect(paymentItem?.required).toBe(true)
    })

    it("includes document checklist items from campaign requirements", async () => {
      vi.mocked(db.application.findFirst).mockResolvedValue({
        id: "app-1",
        applicationNumber: APP_NUMBER,
        status: "SUBMITTED",
        submittedAt: new Date("2026-01-15"),
        updatedAt: new Date("2026-01-15"),
        applicationFeePaid: true,
        documents: [{ type: "birth_cert" }],
        campaign: {
          name: "Fall 2026",
          requiredDocuments: [
            { type: "birth_cert", name: "Birth Certificate", required: true },
            { type: "photo", name: "Photo", required: true },
          ],
          applicationFee: 0,
        },
        communications: [],
        tourBookings: [],
      } as any)

      const result = await getApplicationStatus("valid-token")

      expect(result.success).toBe(true)
      const checklist = result.data?.checklist

      // Birth cert uploaded
      const birthCert = checklist!.find((c) => c.id === "doc-birth_cert")
      expect(birthCert?.completed).toBe(true)

      // Photo not uploaded
      const photo = checklist!.find((c) => c.id === "doc-photo")
      expect(photo?.completed).toBe(false)
    })

    it("rejects invalid access token", async () => {
      vi.mocked(db.application.findFirst).mockResolvedValue(null)

      const result = await getApplicationStatus("invalid-token")

      expect(result.success).toBe(false)
      expect(result.error).toContain("not found or access expired")
    })

    it("rejects expired access token", async () => {
      // findFirst with accessTokenExpiry gte: new Date() returns null for expired tokens
      vi.mocked(db.application.findFirst).mockResolvedValue(null)

      const result = await getApplicationStatus("expired-token")

      expect(result.success).toBe(false)
      expect(result.error).toContain("not found or access expired")
    })

    it("includes special status in timeline for REJECTED applications", async () => {
      vi.mocked(db.application.findFirst).mockResolvedValue({
        id: "app-1",
        applicationNumber: APP_NUMBER,
        status: "REJECTED",
        submittedAt: new Date("2026-01-15"),
        updatedAt: new Date("2026-02-01"),
        applicationFeePaid: true,
        documents: [],
        campaign: {
          name: "Fall 2026",
          requiredDocuments: [],
          applicationFee: 0,
        },
        communications: [],
        tourBookings: [],
      } as any)

      const result = await getApplicationStatus("valid-token")

      expect(result.success).toBe(true)
      const timeline = result.data?.timeline

      // REJECTED should be appended as a special status
      const rejectedStep = timeline!.find((s) => s.status === "REJECTED")
      expect(rejectedStep).toBeDefined()
      expect(rejectedStep?.current).toBe(true)
      expect(rejectedStep?.label).toBeDefined()
    })

    it("includes current step progress info", async () => {
      vi.mocked(db.application.findFirst).mockResolvedValue({
        id: "app-1",
        applicationNumber: APP_NUMBER,
        status: "SHORTLISTED",
        submittedAt: new Date("2026-01-15"),
        updatedAt: new Date("2026-01-25"),
        applicationFeePaid: true,
        documents: [],
        campaign: {
          name: "Fall 2026",
          requiredDocuments: [],
          applicationFee: 0,
        },
        communications: [],
        tourBookings: [],
      } as any)

      const result = await getApplicationStatus("valid-token")

      expect(result.success).toBe(true)
      expect(result.data?.currentStep).toBeDefined()
      expect(result.data?.currentStep.current).toBeGreaterThan(0)
      expect(result.data?.currentStep.total).toBeGreaterThan(0)
      expect(result.data?.currentStep.label).toBeDefined()
    })
  })
})
