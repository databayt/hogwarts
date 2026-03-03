// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"

import { getAdmissionSettings, saveAdmissionSettings } from "../actions"
import { admissionSettingsSchema } from "../validation"

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/db", () => ({
  db: {
    admissionSettings: {
      findUnique: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
    },
  },
}))

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

vi.mock("../validation", () => ({
  admissionSettingsSchema: {
    safeParse: vi.fn(),
  },
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SCHOOL_ID = "school-123"
const USER_ID = "user-1"

function mockAdmin() {
  vi.mocked(auth).mockResolvedValue({
    user: { id: USER_ID, schoolId: SCHOOL_ID, role: "ADMIN" },
  } as any)
}

function mockTeacher() {
  vi.mocked(auth).mockResolvedValue({
    user: { id: USER_ID, schoolId: SCHOOL_ID, role: "TEACHER" },
  } as any)
}

function mockUnauthenticated() {
  vi.mocked(auth).mockResolvedValue(null as any)
}

const validSettings = {
  allowMultipleApplications: false,
  requireDocuments: true,
  applicationFee: 50,
  offerExpiryDays: 14,
  autoEmailNotifications: true,
  enableOnlinePayment: false,
  academicWeight: 40,
  entranceWeight: 35,
  interviewWeight: 25,
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Admission Settings Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAdmin()
    vi.mocked(admissionSettingsSchema.safeParse).mockReturnValue({
      success: true,
      data: validSettings,
    } as any)
  })

  // =========================================================================
  // getAdmissionSettings
  // =========================================================================

  describe("getAdmissionSettings", () => {
    it("returns settings for authenticated school admin", async () => {
      vi.mocked(db.admissionSettings.findUnique).mockResolvedValue({
        allowMultipleApplications: false,
        requireDocuments: true,
        defaultApplicationFee: { toNumber: () => 50 },
        offerExpiryDays: 14,
        autoEmailNotifications: true,
        enableOnlinePayment: false,
        academicWeight: 40,
        entranceWeight: 35,
        interviewWeight: 25,
      } as any)

      const result = await getAdmissionSettings()

      expect(result.success).toBe(true)
      expect(result.data).toMatchObject({
        allowMultipleApplications: false,
        applicationFee: 50,
        offerExpiryDays: 14,
      })
      expect(db.admissionSettings.findUnique).toHaveBeenCalledWith({
        where: { schoolId: SCHOOL_ID },
      })
    })

    it("creates default settings if none exist", async () => {
      vi.mocked(db.admissionSettings.findUnique).mockResolvedValue(null)
      vi.mocked(db.admissionSettings.create).mockResolvedValue({
        allowMultipleApplications: false,
        requireDocuments: true,
        defaultApplicationFee: null,
        offerExpiryDays: 14,
        autoEmailNotifications: true,
        enableOnlinePayment: false,
        academicWeight: 40,
        entranceWeight: 35,
        interviewWeight: 25,
      } as any)

      const result = await getAdmissionSettings()

      expect(result.success).toBe(true)
      expect(db.admissionSettings.create).toHaveBeenCalledWith({
        data: { schoolId: SCHOOL_ID },
      })
      expect(result.data?.applicationFee).toBe(0) // null → 0
    })

    it("returns error when not authenticated", async () => {
      mockUnauthenticated()

      const result = await getAdmissionSettings()

      expect(result.success).toBe(false)
      expect(result.error).toBe("Unauthorized")
    })
  })

  // =========================================================================
  // saveAdmissionSettings
  // =========================================================================

  describe("saveAdmissionSettings", () => {
    it("saves validated settings with upsert", async () => {
      vi.mocked(db.admissionSettings.upsert).mockResolvedValue({} as any)

      const result = await saveAdmissionSettings(validSettings)

      expect(result.success).toBe(true)
      expect(db.admissionSettings.upsert).toHaveBeenCalledWith({
        where: { schoolId: SCHOOL_ID },
        create: expect.objectContaining({
          schoolId: SCHOOL_ID,
          allowMultipleApplications: false,
          academicWeight: 40,
        }),
        update: expect.objectContaining({
          allowMultipleApplications: false,
          academicWeight: 40,
        }),
      })
    })

    it("returns error when not authenticated", async () => {
      mockUnauthenticated()

      const result = await saveAdmissionSettings(validSettings)

      expect(result.success).toBe(false)
      expect(result.error).toBe("Unauthorized")
    })

    it("returns error for non-admin role", async () => {
      mockTeacher()

      const result = await saveAdmissionSettings(validSettings)

      expect(result.success).toBe(false)
      expect(result.error).toBe("Insufficient permissions")
    })

    it("returns validation error for invalid data", async () => {
      vi.mocked(admissionSettingsSchema.safeParse).mockReturnValue({
        success: false,
        error: {
          issues: [{ message: "Merit weights must sum to 100%" }],
        },
      } as any)

      const result = await saveAdmissionSettings({
        ...validSettings,
        academicWeight: 50,
        entranceWeight: 50,
        interviewWeight: 50,
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe("Merit weights must sum to 100%")
    })
  })
})
