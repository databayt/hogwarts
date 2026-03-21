// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"

import { updateApplicationStatus } from "../actions"

// ---------------------------------------------------------------------------
// Mocks — follows the same pattern as actions.test.ts
// ---------------------------------------------------------------------------

vi.mock("@/lib/db", () => ({
  db: {
    admissionCampaign: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    application: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    admissionSettings: {
      findUnique: vi.fn(),
    },
    school: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    student: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    section: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    class: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    studentClass: {
      findFirst: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    yearLevel: {
      findFirst: vi.fn(),
    },
    schoolYear: {
      findFirst: vi.fn(),
    },
    studentYearLevel: {
      upsert: vi.fn(),
    },
    feeStructure: {
      findMany: vi.fn(),
    },
    feeAssignment: {
      upsert: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

vi.mock("@/lib/dispatch-notification", () => ({
  dispatchNotification: vi.fn().mockResolvedValue("notif-1"),
}))

vi.mock("@/lib/enrollment-sync", () => ({
  enrollStudentInGradeClasses: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/lib/grade-utils", () => ({
  extractGradeNumber: vi.fn().mockReturnValue(null),
}))

vi.mock("@/components/school-dashboard/finance/invoice/actions", () => ({
  createInvoiceFromEnrollment: vi.fn().mockResolvedValue({ success: true }),
}))

// Mock the authorization module to let calls through
vi.mock("../authorization", () => ({
  assertAdmissionPermission: vi.fn(),
}))

vi.mock("../queries", () => ({
  getCampaignsList: vi.fn(),
  getCampaignOptions: vi.fn(),
  getApplicationsList: vi.fn(),
  getMeritList: vi.fn(),
  getEnrollmentList: vi.fn(),
}))

vi.mock("../validation", () => ({
  campaignSchemaWithValidation: {
    safeParse: vi.fn(),
  },
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SCHOOL_ID = "school-123"
const USER_ID = "user-1"

function mockAuthenticated() {
  vi.mocked(auth).mockResolvedValue({
    user: { id: USER_ID, schoolId: SCHOOL_ID, role: "ADMIN" },
  } as any)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("updateApplicationStatus - offer expiry", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthenticated()

    // Default: application.update succeeds
    vi.mocked(db.application.update).mockResolvedValue({} as any)
    // Default: application.findUnique returns current status for transition validation
    vi.mocked(db.application.findUnique).mockResolvedValue({
      status: "SHORTLISTED",
    } as any)
    // Default: application.findFirst returns an app with userId for notification
    vi.mocked(db.application.findFirst).mockResolvedValue({
      userId: "applicant-user-1",
      firstName: "Test",
      lastName: "Student",
      campaignId: "camp-1",
    } as any)
    // Default: school.findFirst returns school for notification lang
    vi.mocked(db.school.findFirst).mockResolvedValue({
      preferredLanguage: "ar",
    } as any)
  })

  it("reads offerExpiryDays from AdmissionSettings when status is SELECTED", async () => {
    vi.mocked(db.admissionSettings.findUnique).mockResolvedValue({
      offerExpiryDays: 7,
    } as any)

    const now = Date.now()

    await updateApplicationStatus({ id: "app-1", status: "SELECTED" })

    // Verify admissionSettings was queried with schoolId
    expect(db.admissionSettings.findUnique).toHaveBeenCalledWith({
      where: { schoolId: SCHOOL_ID },
      select: { offerExpiryDays: true },
    })

    // Verify application.update was called
    expect(db.application.update).toHaveBeenCalledTimes(1)

    const updateCall = vi.mocked(db.application.update).mock.calls[0][0] as any
    const updateData = updateCall.data

    // Status and offer fields should be set
    expect(updateData.status).toBe("SELECTED")
    expect(updateData.admissionOffered).toBe(true)
    expect(updateData.offerDate).toBeInstanceOf(Date)

    // offerExpiryDate should be approximately 7 days from now (within 1 minute tolerance)
    const expiryDate = updateData.offerExpiryDate as Date
    const expectedExpiry = now + 7 * 24 * 60 * 60 * 1000
    const tolerance = 60 * 1000 // 1 minute
    expect(expiryDate.getTime()).toBeGreaterThan(expectedExpiry - tolerance)
    expect(expiryDate.getTime()).toBeLessThan(expectedExpiry + tolerance)
  })

  it("defaults to 14 days when no admission settings exist", async () => {
    vi.mocked(db.admissionSettings.findUnique).mockResolvedValue(null)

    const now = Date.now()

    await updateApplicationStatus({ id: "app-1", status: "SELECTED" })

    expect(db.admissionSettings.findUnique).toHaveBeenCalledTimes(1)

    const updateCall = vi.mocked(db.application.update).mock.calls[0][0] as any
    const expiryDate = updateCall.data.offerExpiryDate as Date

    // Should default to 14 days
    const expectedExpiry = now + 14 * 24 * 60 * 60 * 1000
    const tolerance = 60 * 1000
    expect(expiryDate.getTime()).toBeGreaterThan(expectedExpiry - tolerance)
    expect(expiryDate.getTime()).toBeLessThan(expectedExpiry + tolerance)
  })

  it("does not query admission settings for non-SELECTED transitions", async () => {
    // Override: need UNDER_REVIEW → SHORTLISTED (valid transition)
    vi.mocked(db.application.findUnique).mockResolvedValue({
      status: "UNDER_REVIEW",
    } as any)

    await updateApplicationStatus({ id: "app-1", status: "SHORTLISTED" })

    expect(db.admissionSettings.findUnique).not.toHaveBeenCalled()

    // Verify the update still happened, but without offer fields
    expect(db.application.update).toHaveBeenCalledTimes(1)
    const updateData = (
      vi.mocked(db.application.update).mock.calls[0][0] as any
    ).data
    expect(updateData.status).toBe("SHORTLISTED")
    expect(updateData.admissionOffered).toBeUndefined()
    expect(updateData.offerExpiryDate).toBeUndefined()
  })
})
