// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { createHash } from "crypto"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getSchoolBySubdomain } from "@/lib/subdomain-actions"
import {
  getApplicationStatus,
  requestStatusOTP,
  verifyStatusOTP,
} from "@/components/school-marketing/admission/actions/status"

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

// Rate-limit module: always allow in tests
vi.mock("@/lib/rate-limit", () => ({
  checkUserRateLimit: vi.fn().mockResolvedValue({
    allowed: true,
    remaining: 29,
    resetTime: Date.now() + 60000,
  }),
  RATE_LIMITS: {
    AUTH: { windowMs: 60000, maxRequests: 5 },
    PUBLIC: { windowMs: 60000, maxRequests: 30 },
  },
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SCHOOL_ID = "school-123"
const SUBDOMAIN = "demo"
const APP_NUMBER = "APP-2026-001"
const EMAIL = "ahmed@test.com"
const OTP_PLAINTEXT = "123456"
const OTP_HASH = createHash("sha256").update(OTP_PLAINTEXT).digest("hex")

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
    // Ensure NODE_ENV is 'test' so dev-branch console.log path is taken
    process.env.NODE_ENV = "test"
  })

  // =========================================================================
  // requestStatusOTP
  // =========================================================================

  describe("requestStatusOTP", () => {
    it("T-01: sends OTP for valid application and stores sha256 hash (not plaintext)", async () => {
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

      // Generic success response regardless of outcome (oracle-hardened)
      expect(result.success).toBe(true)
      expect(result.data?.message).toContain("Verification code sent")

      // OTP stored as hash — must NOT be a 6-digit plaintext string
      expect(db.admissionOTP.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          schoolId: SCHOOL_ID,
          email: EMAIL,
          applicationNumber: APP_NUMBER,
          // hash is 64-char hex, not 6-digit plaintext
          otp: expect.stringMatching(/^[0-9a-f]{64}$/),
          expiresAt: expect.any(Date),
        }),
      })
    })

    it("T-02: returns generic success when school not found (enumeration oracle hardened)", async () => {
      mockSchoolNotFound()

      const result = await requestStatusOTP(SUBDOMAIN, APP_NUMBER, EMAIL)

      // Must return success:true — not leak "school not found"
      expect(result.success).toBe(true)
      expect(result.data?.message).toContain("Verification code sent")
    })

    it("T-03: returns generic success when application not found (enumeration oracle hardened)", async () => {
      vi.mocked(db.application.findFirst).mockResolvedValue(null)

      const result = await requestStatusOTP(SUBDOMAIN, APP_NUMBER, EMAIL)

      // Must NOT expose "Application not found" to caller
      expect(result.success).toBe(true)
      expect(result.data?.message).toContain("Verification code sent")
    })

    it("T-04: returns generic success when DB rate limit hit (3 OTPs per hour)", async () => {
      vi.mocked(db.application.findFirst).mockResolvedValue({
        id: "app-1",
        applicationNumber: APP_NUMBER,
        email: EMAIL,
        schoolId: SCHOOL_ID,
      } as any)
      vi.mocked(db.admissionOTP.count).mockResolvedValue(3)

      const result = await requestStatusOTP(SUBDOMAIN, APP_NUMBER, EMAIL)

      // Generic success — do not leak rate-limit status
      expect(result.success).toBe(true)
      expect(db.admissionOTP.create).not.toHaveBeenCalled()
    })

    it("T-05: allows request when under DB rate limit", async () => {
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

    it("T-06: DB rate-limit check scoped by schoolId and email", async () => {
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
    it("T-07: verifies correct OTP (hash comparison) and returns access token", async () => {
      // existingOTP.otp must be the sha256 hash of the submitted plaintext
      vi.mocked(db.admissionOTP.findFirst).mockResolvedValueOnce({
        id: "otp-1",
        otp: OTP_HASH,
        verified: false,
        expiresAt: new Date(Date.now() + 600000),
        attempts: 0,
      } as any)
      // updateMany for atomic increment — returns count:1 (under limit)
      vi.mocked(db.admissionOTP.updateMany).mockResolvedValue({
        count: 1,
      } as any)
      vi.mocked(db.admissionOTP.update).mockResolvedValue({} as any)
      vi.mocked(db.application.findFirst).mockResolvedValue({
        id: "app-1",
        applicationNumber: APP_NUMBER,
        accessToken: null,
        accessTokenExpiry: null,
      } as any)
      vi.mocked(db.application.update).mockResolvedValue({} as any)

      const result = await verifyStatusOTP(SUBDOMAIN, APP_NUMBER, OTP_PLAINTEXT)

      expect(result.success).toBe(true)
      expect(result.data?.accessToken).toBeDefined()
      expect(typeof result.data?.accessToken).toBe("string")

      // OTP should be marked as verified
      expect(db.admissionOTP.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "otp-1" },
          data: { verified: true },
        })
      )
    })

    it("T-08: reuses existing valid access token", async () => {
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      vi.mocked(db.admissionOTP.findFirst).mockResolvedValueOnce({
        id: "otp-1",
        otp: OTP_HASH,
        verified: false,
        expiresAt: new Date(Date.now() + 600000),
        attempts: 0,
      } as any)
      vi.mocked(db.admissionOTP.updateMany).mockResolvedValue({
        count: 1,
      } as any)
      vi.mocked(db.admissionOTP.update).mockResolvedValue({} as any)
      vi.mocked(db.application.findFirst).mockResolvedValue({
        id: "app-1",
        applicationNumber: APP_NUMBER,
        accessToken: "existing-token-abc",
        accessTokenExpiry: futureDate,
      } as any)

      const result = await verifyStatusOTP(SUBDOMAIN, APP_NUMBER, OTP_PLAINTEXT)

      expect(result.success).toBe(true)
      expect(result.data?.accessToken).toBe("existing-token-abc")
      // Should NOT update the application when token is still valid
      expect(db.application.update).not.toHaveBeenCalled()
    })

    it("T-09: rejects invalid OTP (wrong hash) and increments attempts atomically", async () => {
      vi.mocked(db.admissionOTP.findFirst).mockResolvedValueOnce({
        id: "otp-1",
        otp: OTP_HASH, // stored hash for the correct OTP
        verified: false,
        expiresAt: new Date(Date.now() + 600000),
        attempts: 1,
      } as any)
      // Atomic increment succeeds (still under limit)
      vi.mocked(db.admissionOTP.updateMany).mockResolvedValue({
        count: 1,
      } as any)

      // Submit wrong OTP
      const result = await verifyStatusOTP(SUBDOMAIN, APP_NUMBER, "999999")

      expect(result.success).toBe(false)
      expect(result.error).toContain("Invalid or expired")

      // Atomic updateMany was called — not a read-then-write
      expect(db.admissionOTP.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: "otp-1",
            attempts: { lt: 5 },
          }),
          data: { attempts: { increment: 1 } },
        })
      )
    })

    it("T-10: locks after 5 failed attempts — invalidates record atomically", async () => {
      vi.mocked(db.admissionOTP.findFirst).mockResolvedValueOnce({
        id: "otp-1",
        otp: OTP_HASH,
        verified: false,
        expiresAt: new Date(Date.now() + 600000),
        attempts: 4, // next increment brings it to 5 → lock
      } as any)
      vi.mocked(db.admissionOTP.updateMany).mockResolvedValue({
        count: 1,
      } as any)
      vi.mocked(db.admissionOTP.update).mockResolvedValue({} as any)

      const result = await verifyStatusOTP(SUBDOMAIN, APP_NUMBER, "999999")

      expect(result.success).toBe(false)
      expect(result.error).toContain("Too many invalid attempts")

      // Record should be invalidated (expiresAt set to now)
      const updateCalls = vi.mocked(db.admissionOTP.update).mock.calls
      const invalidateCall = updateCalls.find(
        (call) =>
          (call[0] as any)?.data?.expiresAt instanceof Date &&
          !(call[0] as any)?.data?.verified
      )
      expect(invalidateCall).toBeDefined()
    })

    it("T-11: returns 0 from updateMany when already at limit → locked immediately", async () => {
      vi.mocked(db.admissionOTP.findFirst).mockResolvedValueOnce({
        id: "otp-1",
        otp: OTP_HASH,
        verified: false,
        expiresAt: new Date(Date.now() + 600000),
        attempts: 5, // already at limit
      } as any)
      // updateMany matches 0 rows because attempts is not lt 5
      vi.mocked(db.admissionOTP.updateMany).mockResolvedValue({
        count: 0,
      } as any)
      vi.mocked(db.admissionOTP.update).mockResolvedValue({} as any)

      const result = await verifyStatusOTP(SUBDOMAIN, APP_NUMBER, OTP_PLAINTEXT)

      expect(result.success).toBe(false)
      expect(result.error).toContain("Too many invalid attempts")
    })

    it("T-12: rejects expired OTP (no active record found)", async () => {
      vi.mocked(db.admissionOTP.findFirst).mockResolvedValueOnce(null)

      const result = await verifyStatusOTP(SUBDOMAIN, APP_NUMBER, OTP_PLAINTEXT)

      expect(result.success).toBe(false)
      expect(result.error).toContain("Invalid or expired")
    })

    it("T-13: rejects when school not found", async () => {
      mockSchoolNotFound()

      const result = await verifyStatusOTP(SUBDOMAIN, APP_NUMBER, OTP_PLAINTEXT)

      expect(result.success).toBe(false)
      expect(result.error).toBe("School not found")
    })

    it("T-14: rejects when application not found after OTP verification", async () => {
      vi.mocked(db.admissionOTP.findFirst).mockResolvedValueOnce({
        id: "otp-1",
        otp: OTP_HASH,
        verified: false,
        expiresAt: new Date(Date.now() + 600000),
        attempts: 0,
      } as any)
      vi.mocked(db.admissionOTP.updateMany).mockResolvedValue({
        count: 1,
      } as any)
      vi.mocked(db.admissionOTP.update).mockResolvedValue({} as any)
      vi.mocked(db.application.findFirst).mockResolvedValue(null)

      const result = await verifyStatusOTP(SUBDOMAIN, APP_NUMBER, OTP_PLAINTEXT)

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

      const result = await getApplicationStatus("demo", "valid-token")

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

      const result = await getApplicationStatus("demo", "valid-token")

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

      const result = await getApplicationStatus("demo", "valid-token")

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

      const result = await getApplicationStatus("demo", "invalid-token")

      expect(result.success).toBe(false)
      expect(result.error).toContain("not found or access expired")
    })

    it("rejects expired access token", async () => {
      vi.mocked(db.application.findFirst).mockResolvedValue(null)

      const result = await getApplicationStatus("demo", "expired-token")

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

      const result = await getApplicationStatus("demo", "valid-token")

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

      const result = await getApplicationStatus("demo", "valid-token")

      expect(result.success).toBe(true)
      expect(result.data?.currentStep).toBeDefined()
      expect(result.data?.currentStep.current).toBeGreaterThan(0)
      expect(result.data?.currentStep.total).toBeGreaterThan(0)
      expect(result.data?.currentStep.label).toBeDefined()
    })
  })
})
