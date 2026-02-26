// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getSchoolBySubdomain } from "@/lib/subdomain-actions"

import {
  getActiveCampaigns,
  getCampaignById,
  getDraftApplications,
  getDraftApplicationsByUser,
  resumeApplicationSession,
  saveApplicationSession,
  submitApplication,
} from "../application"

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/db", () => ({
  db: {
    admissionCampaign: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    application: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    applicationSession: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    school: {
      findUnique: vi.fn(),
    },
  },
}))

vi.mock("@/lib/subdomain-actions", () => ({
  getSchoolBySubdomain: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

vi.mock("nanoid", () => ({
  nanoid: vi.fn().mockReturnValue("TESTTOKEN123456789012345678901234"),
}))

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({ id: "email-1" }),
    },
  })),
}))

vi.mock("@/lib/payment/gateway-config", () => ({
  resolveDefaultCurrency: vi.fn().mockReturnValue("SDG"),
  resolvePaymentGateways: vi.fn().mockReturnValue(["bank_transfer", "cash"]),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SUBDOMAIN = "demo"
const SCHOOL_ID = "school-123"
const CAMPAIGN_ID = "campaign-1"
const SESSION_TOKEN = "session-token-abc"

function mockSchoolFound(overrides: Record<string, unknown> = {}) {
  vi.mocked(getSchoolBySubdomain).mockResolvedValue({
    success: true,
    data: { id: SCHOOL_ID, name: "Demo School", ...overrides },
  } as any)
}

function mockSchoolNotFound() {
  vi.mocked(getSchoolBySubdomain).mockResolvedValue({
    success: false,
    data: null,
  } as any)
}

function mockAuthenticated(userId = "user-1") {
  vi.mocked(auth).mockResolvedValue({
    user: { id: userId, schoolId: null, role: "USER" },
  } as any)
}

function mockUnauthenticated() {
  vi.mocked(auth).mockResolvedValue(null as any)
}

const validFormData = {
  campaignId: CAMPAIGN_ID,
  firstName: "Test",
  lastName: "Student",
  dateOfBirth: "2010-03-15",
  gender: "MALE" as const,
  nationality: "Sudanese",
  email: "test@example.com",
  phone: "+249123456789",
  address: "123 Street",
  city: "Khartoum",
  state: "Khartoum",
  postalCode: "11111",
  country: "Sudan",
  fatherName: "Father",
  motherName: "Mother",
  applyingForClass: "Grade 10",
}

const now = new Date()
const futureDate = new Date(now.getTime() + 86400000 * 30) // 30 days from now
const pastDate = new Date(now.getTime() - 86400000 * 30) // 30 days ago

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Application Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSchoolFound()
    mockAuthenticated()
  })

  // =========================================================================
  // getActiveCampaigns
  // =========================================================================

  describe("getActiveCampaigns", () => {
    it("returns error when school not found", async () => {
      mockSchoolNotFound()

      const result = await getActiveCampaigns(SUBDOMAIN)

      expect(result.success).toBe(false)
      expect(result.error).toBe("School not found")
    })

    it("returns OPEN campaigns filtered by date", async () => {
      vi.mocked(db.admissionCampaign.findMany).mockResolvedValue([
        {
          id: "c-1",
          name: "Fall 2026",
          academicYear: "2026-2027",
          startDate: pastDate,
          endDate: futureDate,
          description: "Test campaign",
          applicationFee: { toString: () => "50" },
          totalSeats: 100,
          requiredDocuments: null,
          eligibilityCriteria: null,
          _count: { applications: 10 },
        },
      ] as any)

      const result = await getActiveCampaigns(SUBDOMAIN)

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data![0]).toMatchObject({
        id: "c-1",
        name: "Fall 2026",
        totalSeats: 100,
        availableSeats: 90,
      })
      expect(db.admissionCampaign.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            schoolId: SCHOOL_ID,
            status: "OPEN",
          }),
        })
      )
    })

    it("calculates availableSeats correctly", async () => {
      vi.mocked(db.admissionCampaign.findMany).mockResolvedValue([
        {
          id: "c-1",
          name: "Full Campaign",
          academicYear: "2026-2027",
          startDate: pastDate,
          endDate: futureDate,
          description: null,
          applicationFee: null,
          totalSeats: 50,
          requiredDocuments: null,
          eligibilityCriteria: null,
          _count: { applications: 48 },
        },
      ] as any)

      const result = await getActiveCampaigns(SUBDOMAIN)

      expect(result.success).toBe(true)
      expect(result.data![0].availableSeats).toBe(2)
      expect(result.data![0].applicationFee).toBeUndefined()
    })

    it("returns empty array when no campaigns exist", async () => {
      vi.mocked(db.admissionCampaign.findMany).mockResolvedValue([])

      const result = await getActiveCampaigns(SUBDOMAIN)

      expect(result.success).toBe(true)
      expect(result.data).toEqual([])
    })

    it("returns error on DB failure", async () => {
      vi.mocked(db.admissionCampaign.findMany).mockRejectedValue(
        new Error("Connection refused")
      )

      const result = await getActiveCampaigns(SUBDOMAIN)

      expect(result.success).toBe(false)
      expect(result.error).toBe("Failed to fetch campaigns")
    })
  })

  // =========================================================================
  // getCampaignById
  // =========================================================================

  describe("getCampaignById", () => {
    it("returns error when school not found", async () => {
      mockSchoolNotFound()

      const result = await getCampaignById(SUBDOMAIN, CAMPAIGN_ID)

      expect(result.success).toBe(false)
      expect(result.error).toBe("School not found")
    })

    it("returns campaign with available seats", async () => {
      vi.mocked(db.admissionCampaign.findFirst).mockResolvedValue({
        id: CAMPAIGN_ID,
        name: "Fall 2026",
        academicYear: "2026-2027",
        startDate: pastDate,
        endDate: futureDate,
        description: "A campaign",
        applicationFee: { toString: () => "100" },
        totalSeats: 100,
        requiredDocuments: null,
        eligibilityCriteria: null,
        _count: { applications: 30 },
      } as any)

      const result = await getCampaignById(SUBDOMAIN, CAMPAIGN_ID)

      expect(result.success).toBe(true)
      expect(result.data).toMatchObject({
        id: CAMPAIGN_ID,
        availableSeats: 70,
        applicationFee: 100,
      })
    })

    it("returns error when campaign not found", async () => {
      vi.mocked(db.admissionCampaign.findFirst).mockResolvedValue(null)

      const result = await getCampaignById(SUBDOMAIN, "nonexistent")

      expect(result.success).toBe(false)
      expect(result.error).toBe(
        "Campaign not found or not accepting applications"
      )
    })

    it("returns error on DB failure", async () => {
      vi.mocked(db.admissionCampaign.findFirst).mockRejectedValue(
        new Error("Timeout")
      )

      const result = await getCampaignById(SUBDOMAIN, CAMPAIGN_ID)

      expect(result.success).toBe(false)
      expect(result.error).toBe("Failed to fetch campaign")
    })
  })

  // =========================================================================
  // saveApplicationSession
  // =========================================================================

  describe("saveApplicationSession", () => {
    const sessionData = {
      formData: { firstName: "Test" },
      currentStep: 2,
      email: "test@example.com",
      campaignId: CAMPAIGN_ID,
    }

    it("creates new session with token when no sessionToken provided", async () => {
      vi.mocked(db.applicationSession.create).mockResolvedValue({
        id: "session-1",
      } as any)

      const result = await saveApplicationSession(SUBDOMAIN, sessionData)

      expect(result.success).toBe(true)
      expect(result.data?.sessionToken).toBeDefined()
      expect(db.applicationSession.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          schoolId: SCHOOL_ID,
          email: "test@example.com",
          currentStep: 2,
          campaignId: CAMPAIGN_ID,
        }),
      })
    })

    it("validates session data via sessionDataSchema", async () => {
      const result = await saveApplicationSession(SUBDOMAIN, {
        formData: {},
        currentStep: 99, // Invalid - above max 6
        email: "test@example.com",
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe("Failed to save application session")
    })

    it("associates authenticated userId", async () => {
      mockAuthenticated("user-42")
      vi.mocked(db.applicationSession.create).mockResolvedValue({
        id: "session-1",
      } as any)

      await saveApplicationSession(SUBDOMAIN, sessionData)

      expect(db.applicationSession.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-42",
        }),
      })
    })

    it("sets 7-day expiry on new sessions", async () => {
      vi.mocked(db.applicationSession.create).mockResolvedValue({
        id: "session-1",
      } as any)

      await saveApplicationSession(SUBDOMAIN, sessionData)

      const createCall = vi.mocked(db.applicationSession.create).mock.calls[0]
      const expiresAt = createCall[0].data.expiresAt as Date
      const sevenDaysFromNow = new Date()
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

      // Expiry should be within 1 minute of 7 days from now
      expect(
        Math.abs(expiresAt.getTime() - sevenDaysFromNow.getTime())
      ).toBeLessThan(60000)
    })

    it("updates existing session when sessionToken provided", async () => {
      vi.mocked(db.applicationSession.findUnique).mockResolvedValue({
        id: "session-1",
        schoolId: SCHOOL_ID,
        sessionToken: SESSION_TOKEN,
      } as any)
      vi.mocked(db.applicationSession.update).mockResolvedValue({} as any)

      const result = await saveApplicationSession(
        SUBDOMAIN,
        sessionData,
        SESSION_TOKEN
      )

      expect(result.success).toBe(true)
      expect(result.data?.sessionToken).toBe(SESSION_TOKEN)
      expect(db.applicationSession.update).toHaveBeenCalledWith({
        where: { sessionToken: SESSION_TOKEN },
        data: expect.objectContaining({
          currentStep: 2,
        }),
      })
    })

    it("returns error when existing session not found", async () => {
      vi.mocked(db.applicationSession.findUnique).mockResolvedValue(null)

      const result = await saveApplicationSession(
        SUBDOMAIN,
        sessionData,
        "bad-token"
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe("Session not found")
    })

    it("returns error when session belongs to different school", async () => {
      vi.mocked(db.applicationSession.findUnique).mockResolvedValue({
        id: "session-1",
        schoolId: "other-school",
        sessionToken: SESSION_TOKEN,
      } as any)

      const result = await saveApplicationSession(
        SUBDOMAIN,
        sessionData,
        SESSION_TOKEN
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe("Session not found")
    })

    it("returns error on DB failure", async () => {
      vi.mocked(db.applicationSession.create).mockRejectedValue(
        new Error("Connection lost")
      )

      const result = await saveApplicationSession(SUBDOMAIN, sessionData)

      expect(result.success).toBe(false)
      expect(result.error).toBe("Failed to save application session")
    })
  })

  // =========================================================================
  // resumeApplicationSession
  // =========================================================================

  describe("resumeApplicationSession", () => {
    it("returns formData for valid token", async () => {
      vi.mocked(db.applicationSession.findUnique).mockResolvedValue({
        sessionToken: SESSION_TOKEN,
        formData: { firstName: "Test", lastName: "Student" },
        currentStep: 3,
        email: "test@example.com",
        campaignId: CAMPAIGN_ID,
        expiresAt: futureDate,
        convertedToApplicationId: null,
        school: { domain: "demo.databayt.org" },
      } as any)

      const result = await resumeApplicationSession(SESSION_TOKEN)

      expect(result.success).toBe(true)
      expect(result.data).toMatchObject({
        formData: { firstName: "Test", lastName: "Student" },
        currentStep: 3,
        email: "test@example.com",
        campaignId: CAMPAIGN_ID,
      })
    })

    it("returns error when session not found", async () => {
      vi.mocked(db.applicationSession.findUnique).mockResolvedValue(null)

      const result = await resumeApplicationSession("invalid-token")

      expect(result.success).toBe(false)
      expect(result.error).toBe("Session not found")
    })

    it("deletes expired session and returns error", async () => {
      vi.mocked(db.applicationSession.findUnique).mockResolvedValue({
        sessionToken: SESSION_TOKEN,
        expiresAt: pastDate,
        convertedToApplicationId: null,
        school: { domain: "demo.databayt.org" },
      } as any)
      vi.mocked(db.applicationSession.delete).mockResolvedValue({} as any)

      const result = await resumeApplicationSession(SESSION_TOKEN)

      expect(result.success).toBe(false)
      expect(result.error).toContain("expired")
      expect(db.applicationSession.delete).toHaveBeenCalledWith({
        where: { sessionToken: SESSION_TOKEN },
      })
    })

    it("returns error when already submitted", async () => {
      vi.mocked(db.applicationSession.findUnique).mockResolvedValue({
        sessionToken: SESSION_TOKEN,
        expiresAt: futureDate,
        convertedToApplicationId: "app-123",
        school: { domain: "demo.databayt.org" },
      } as any)

      const result = await resumeApplicationSession(SESSION_TOKEN)

      expect(result.success).toBe(false)
      expect(result.error).toContain("already been submitted")
    })

    it("returns error on DB failure", async () => {
      vi.mocked(db.applicationSession.findUnique).mockRejectedValue(
        new Error("DB error")
      )

      const result = await resumeApplicationSession(SESSION_TOKEN)

      expect(result.success).toBe(false)
      expect(result.error).toBe("Failed to resume application")
    })
  })

  // =========================================================================
  // getDraftApplications
  // =========================================================================

  describe("getDraftApplications", () => {
    it("returns non-expired non-converted sessions", async () => {
      vi.mocked(db.applicationSession.findMany).mockResolvedValue([
        {
          sessionToken: "tok-1",
          currentStep: 2,
          formData: { firstName: "Ahmed", lastName: "Mohamed" },
          updatedAt: now,
          expiresAt: futureDate,
          campaign: { id: "c-1", name: "Fall 2026" },
        },
      ] as any)

      const result = await getDraftApplications(SUBDOMAIN, "test@example.com")

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data![0]).toMatchObject({
        sessionToken: "tok-1",
        campaignName: "Fall 2026",
        studentName: "Ahmed Mohamed",
        totalSteps: 6,
      })
    })

    it("maps student name from firstName only", async () => {
      vi.mocked(db.applicationSession.findMany).mockResolvedValue([
        {
          sessionToken: "tok-2",
          currentStep: 1,
          formData: { firstName: "Sara" },
          updatedAt: now,
          expiresAt: futureDate,
          campaign: null,
        },
      ] as any)

      const result = await getDraftApplications(SUBDOMAIN, "test@example.com")

      expect(result.data![0].studentName).toBe("Sara")
      expect(result.data![0].campaignId).toBeNull()
    })

    it("returns empty array when no drafts", async () => {
      vi.mocked(db.applicationSession.findMany).mockResolvedValue([])

      const result = await getDraftApplications(SUBDOMAIN, "test@example.com")

      expect(result.success).toBe(true)
      expect(result.data).toEqual([])
    })

    it("returns error when school not found", async () => {
      mockSchoolNotFound()

      const result = await getDraftApplications(SUBDOMAIN, "test@example.com")

      expect(result.success).toBe(false)
      expect(result.error).toBe("School not found")
    })
  })

  // =========================================================================
  // getDraftApplicationsByUser
  // =========================================================================

  describe("getDraftApplicationsByUser", () => {
    it("returns drafts for userId", async () => {
      vi.mocked(db.applicationSession.findMany).mockResolvedValue([
        {
          sessionToken: "tok-1",
          currentStep: 4,
          formData: { firstName: "Ali", lastName: "Hassan" },
          updatedAt: now,
          expiresAt: futureDate,
          campaign: { id: "c-1", name: "Spring 2027" },
        },
      ] as any)

      const result = await getDraftApplicationsByUser(SUBDOMAIN, "user-1")

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data![0].studentName).toBe("Ali Hassan")
    })

    it("handles null campaign", async () => {
      vi.mocked(db.applicationSession.findMany).mockResolvedValue([
        {
          sessionToken: "tok-2",
          currentStep: 0,
          formData: {},
          updatedAt: now,
          expiresAt: futureDate,
          campaign: null,
        },
      ] as any)

      const result = await getDraftApplicationsByUser(SUBDOMAIN, "user-1")

      expect(result.success).toBe(true)
      expect(result.data![0].campaignId).toBeNull()
      expect(result.data![0].campaignName).toBeNull()
      expect(result.data![0].studentName).toBeNull()
    })

    it("returns error when school not found", async () => {
      mockSchoolNotFound()

      const result = await getDraftApplicationsByUser(SUBDOMAIN, "user-1")

      expect(result.success).toBe(false)
      expect(result.error).toBe("School not found")
    })
  })

  // =========================================================================
  // submitApplication
  // =========================================================================

  describe("submitApplication", () => {
    beforeEach(() => {
      // Default mocks for happy path
      vi.mocked(db.applicationSession.findUnique).mockResolvedValue({
        id: "session-1",
        schoolId: SCHOOL_ID,
        sessionToken: SESSION_TOKEN,
      } as any)

      vi.mocked(db.admissionCampaign.findFirst).mockResolvedValue({
        id: CAMPAIGN_ID,
        schoolId: SCHOOL_ID,
        status: "OPEN",
        endDate: futureDate,
        applicationFee: null,
      } as any)

      vi.mocked(db.application.findFirst).mockResolvedValue(null) // No duplicate
      vi.mocked(db.application.findUnique).mockResolvedValue(null) // App number not taken

      vi.mocked(db.application.create).mockResolvedValue({
        id: "app-new",
        applicationNumber: "APP-2026-ABC123",
        status: "SUBMITTED",
      } as any)

      vi.mocked(db.applicationSession.update).mockResolvedValue({} as any)

      vi.mocked(db.school.findUnique).mockResolvedValue({
        id: SCHOOL_ID,
        country: "Sudan",
        timezone: "Africa/Khartoum",
      } as any)
    })

    it("returns error when school not found", async () => {
      mockSchoolNotFound()

      const result = await submitApplication(
        SUBDOMAIN,
        SESSION_TOKEN,
        validFormData
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe("School not found")
    })

    it("validates the full schema", async () => {
      const result = await submitApplication(SUBDOMAIN, SESSION_TOKEN, {
        ...validFormData,
        email: "not-an-email",
      })

      // Zod validation failure caught in try/catch
      expect(result.success).toBe(false)
    })

    it("returns error when session schoolId mismatches", async () => {
      vi.mocked(db.applicationSession.findUnique).mockResolvedValue({
        id: "session-1",
        schoolId: "different-school",
        sessionToken: SESSION_TOKEN,
      } as any)

      const result = await submitApplication(
        SUBDOMAIN,
        SESSION_TOKEN,
        validFormData
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe("Invalid session")
    })

    it("returns error when campaign is not OPEN", async () => {
      vi.mocked(db.admissionCampaign.findFirst).mockResolvedValue(null) // No matching OPEN campaign

      const result = await submitApplication(
        SUBDOMAIN,
        SESSION_TOKEN,
        validFormData
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain("no longer accepting applications")
    })

    it("returns error for duplicate email on same campaign", async () => {
      vi.mocked(db.application.findFirst).mockResolvedValue({
        id: "existing-app",
      } as any)

      const result = await submitApplication(
        SUBDOMAIN,
        SESSION_TOKEN,
        validFormData
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain("already exists for this campaign")
    })

    it("creates Application with all fields on success", async () => {
      const result = await submitApplication(
        SUBDOMAIN,
        SESSION_TOKEN,
        validFormData
      )

      expect(result.success).toBe(true)
      expect(result.data?.applicationId).toBe("app-new")
      expect(result.data?.status).toBe("SUBMITTED")
      expect(result.data?.accessToken).toBeDefined()

      expect(db.application.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          schoolId: SCHOOL_ID,
          campaignId: CAMPAIGN_ID,
          firstName: "Test",
          lastName: "Student",
          email: "test@example.com",
          gender: "MALE",
          nationality: "Sudanese",
          fatherName: "Father",
          motherName: "Mother",
          applyingForClass: "Grade 10",
          status: "SUBMITTED",
          submittedAt: expect.any(Date),
          accessToken: expect.any(String),
          accessTokenExpiry: expect.any(Date),
        }),
      })
    })

    it("marks session as converted after submission", async () => {
      await submitApplication(SUBDOMAIN, SESSION_TOKEN, validFormData)

      expect(db.applicationSession.update).toHaveBeenCalledWith({
        where: { sessionToken: SESSION_TOKEN },
        data: { convertedToApplicationId: "app-new" },
      })
    })

    it("retries application number generation on collision", async () => {
      // First findUnique returns existing (collision), second returns null
      vi.mocked(db.application.findUnique)
        .mockResolvedValueOnce({ id: "existing" } as any)
        .mockResolvedValueOnce(null)

      const result = await submitApplication(
        SUBDOMAIN,
        SESSION_TOKEN,
        validFormData
      )

      expect(result.success).toBe(true)
      // Should have called findUnique at least twice for app number check
      expect(db.application.findUnique).toHaveBeenCalledTimes(2)
    })

    it("fails after 10 attempts at application number generation", async () => {
      // All findUnique calls return existing (never finds unique number)
      vi.mocked(db.application.findUnique).mockResolvedValue({
        id: "existing",
      } as any)

      const result = await submitApplication(
        SUBDOMAIN,
        SESSION_TOKEN,
        validFormData
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain("Failed to generate application number")
      expect(db.application.findUnique).toHaveBeenCalledTimes(10)
    })

    it("sets requiresPayment=true when campaign has fee", async () => {
      vi.mocked(db.admissionCampaign.findFirst).mockResolvedValue({
        id: CAMPAIGN_ID,
        schoolId: SCHOOL_ID,
        status: "OPEN",
        endDate: futureDate,
        applicationFee: { toString: () => "200" },
      } as any)

      const result = await submitApplication(
        SUBDOMAIN,
        SESSION_TOKEN,
        validFormData
      )

      expect(result.success).toBe(true)
      expect(result.data?.requiresPayment).toBe(true)
      expect(result.data?.applicationFee).toBe(200)
      expect(result.data?.currency).toBeDefined()
      expect(result.data?.paymentMethods).toBeDefined()
    })

    it("sets requiresPayment=false when no fee", async () => {
      const result = await submitApplication(
        SUBDOMAIN,
        SESSION_TOKEN,
        validFormData
      )

      expect(result.success).toBe(true)
      expect(result.data?.requiresPayment).toBe(false)
    })

    it("handles unique constraint error gracefully", async () => {
      vi.mocked(db.application.create).mockRejectedValue(
        new Error("Unique constraint violation")
      )

      const result = await submitApplication(
        SUBDOMAIN,
        SESSION_TOKEN,
        validFormData
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain("already exists")
    })

    it("handles generic DB error", async () => {
      vi.mocked(db.application.create).mockRejectedValue(
        new Error("Connection timeout")
      )

      const result = await submitApplication(
        SUBDOMAIN,
        SESSION_TOKEN,
        validFormData
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain("Failed to submit application")
    })
  })
})
