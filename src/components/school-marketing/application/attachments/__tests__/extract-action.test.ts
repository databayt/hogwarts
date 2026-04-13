// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { canUseAI } from "@/lib/ai/budget"
import { extractWithSchema } from "@/lib/document-extraction"
import { getTenantContext } from "@/lib/tenant-context"

import { extractForAutoFill } from "../extract-action"

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/ai/budget", () => ({
  canUseAI: vi.fn(),
}))

vi.mock("@/lib/document-extraction", () => ({
  extractWithSchema: vi.fn(),
}))

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

// Mock tenant context — schoolId resolved server-side
const SCHOOL_ID = "test-school-id"
vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn().mockResolvedValue({
    schoolId: "test-school-id",
    requestId: "test-request-id",
    role: null,
    isPlatformAdmin: false,
  }),
}))

// Mock the prompts/schemas modules to avoid pulling in heavy deps
vi.mock("@/components/school-dashboard/admission/ai/prompts", () => ({
  admissionSystemMessage: "test-system-message",
  getPromptForDocumentType: vi.fn(() => "test-prompt"),
}))

vi.mock("@/components/school-dashboard/admission/ai/schemas", () => ({
  admissionDocumentSchemaMap: {
    national_id: {},
    transcript: {},
    degree: {},
    resume: {},
    other: {},
  },
}))

// Mock global fetch
const mockFetch = vi.fn()
vi.stubGlobal("fetch", mockFetch)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Use an allowed hostname (utfs.io — UploadThing CDN)
const FILE_URL = "https://utfs.io/f/docs/id-card.pdf"

function mockBudgetAllowed(allowed = true) {
  vi.mocked(canUseAI).mockResolvedValue({
    allowed,
    remainingBudget: 10,
    monthlyBudget: 50,
    currentSpend: 40,
  })
}

function mockFetchSuccess() {
  mockFetch.mockResolvedValue({
    ok: true,
    blob: () =>
      Promise.resolve(new Blob(["fake-pdf"], { type: "application/pdf" })),
  })
}

function mockExtractionResult(extractedObject: Record<string, unknown>) {
  vi.mocked(extractWithSchema).mockResolvedValue({
    success: true,
    data: {
      fields: [],
      confidence: 0.9,
      documentType: "pdf",
      extractedObject,
    },
    processingTime: 1500,
  })
}

function mockExtractionFailure() {
  vi.mocked(extractWithSchema).mockResolvedValue({
    success: false,
    error: "AI extraction failed",
    errorCode: "AI_EXTRACTION_FAILED",
    processingTime: 500,
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("extractForAutoFill", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Re-mock tenant context after clearAllMocks
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: SCHOOL_ID,
      requestId: "test-request-id",
      role: null,
      isPlatformAdmin: false,
    })
    mockBudgetAllowed()
    mockFetchSuccess()
  })

  // =========================================================================
  // Slot routing
  // =========================================================================

  describe("slot routing", () => {
    it("returns empty data for unknown slot keys", async () => {
      const result = await extractForAutoFill(FILE_URL, "otherUrl")
      expect(result).toEqual({ success: true, data: {} })
      expect(extractWithSchema).not.toHaveBeenCalled()
    })

    it("returns empty data for profilePhotoUrl slot", async () => {
      const result = await extractForAutoFill(FILE_URL, "profilePhotoUrl")
      expect(result).toEqual({ success: true, data: {} })
    })

    it("processes idUrl as national_id", async () => {
      mockExtractionResult({ fullName: "Ahmed Hassan" })
      const result = await extractForAutoFill(FILE_URL, "idUrl")
      expect(result.success).toBe(true)
      expect(result.data?.personal).toBeDefined()
    })

    it("processes transcriptUrl as transcript", async () => {
      mockExtractionResult({ institution: "Cairo University" })
      const result = await extractForAutoFill(FILE_URL, "transcriptUrl")
      expect(result.success).toBe(true)
      expect(result.data?.academic).toBeDefined()
    })

    it("processes degreeUrl as degree", async () => {
      mockExtractionResult({ institution: "MIT" })
      const result = await extractForAutoFill(FILE_URL, "degreeUrl")
      expect(result.success).toBe(true)
      expect(result.data?.academic).toBeDefined()
    })

    it("processes resumeUrl as resume", async () => {
      mockExtractionResult({ email: "test@example.com" })
      const result = await extractForAutoFill(FILE_URL, "resumeUrl")
      expect(result.success).toBe(true)
      expect(result.data?.contact).toBeDefined()
    })
  })

  // =========================================================================
  // Budget enforcement
  // =========================================================================

  describe("budget enforcement", () => {
    it("returns empty data when AI budget exceeded", async () => {
      mockBudgetAllowed(false)
      const result = await extractForAutoFill(FILE_URL, "idUrl")
      expect(result).toEqual({ success: true, data: {} })
      expect(extractWithSchema).not.toHaveBeenCalled()
    })
  })

  // =========================================================================
  // Fetch failures
  // =========================================================================

  describe("fetch failures", () => {
    it("returns error when file fetch fails", async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 404 })
      const result = await extractForAutoFill(FILE_URL, "idUrl")
      expect(result).toEqual({ success: false, error: "FETCH_FAILED" })
    })
  })

  // =========================================================================
  // Extraction failures (silent)
  // =========================================================================

  describe("extraction failures", () => {
    it("returns empty data when extraction fails", async () => {
      mockExtractionFailure()
      const result = await extractForAutoFill(FILE_URL, "idUrl")
      expect(result).toEqual({ success: true, data: {} })
    })

    it("returns empty data when exception is thrown", async () => {
      vi.mocked(extractWithSchema).mockRejectedValue(new Error("Network error"))
      const result = await extractForAutoFill(FILE_URL, "idUrl")
      expect(result.success).toBe(true)
      expect(result.data).toEqual({})
    })
  })

  // =========================================================================
  // National ID → Personal + Location
  // =========================================================================

  describe("national ID mapping", () => {
    it("maps full name with first/middle/last", async () => {
      mockExtractionResult({
        fullName: "Ahmed Mohamed Hassan",
        dateOfBirth: "2010-03-15",
        gender: "Male",
        nationality: "Sudanese",
      })
      const result = await extractForAutoFill(FILE_URL, "idUrl")
      expect(result.data?.personal).toEqual({
        firstName: "Ahmed",
        middleName: "Mohamed",
        lastName: "Hassan",
        dateOfBirth: "2010-03-15",
        gender: "MALE",
        nationality: "Sudanese",
      })
    })

    it("maps two-part name without middleName", async () => {
      mockExtractionResult({ fullName: "Ahmed Hassan" })
      const result = await extractForAutoFill(FILE_URL, "idUrl")
      expect(result.data?.personal?.firstName).toBe("Ahmed")
      expect(result.data?.personal?.lastName).toBe("Hassan")
      expect(result.data?.personal?.middleName).toBeUndefined()
    })

    it("maps four-part name with multi-word middleName", async () => {
      mockExtractionResult({ fullName: "Ahmed Ali Mohamed Hassan" })
      const result = await extractForAutoFill(FILE_URL, "idUrl")
      expect(result.data?.personal?.firstName).toBe("Ahmed")
      expect(result.data?.personal?.middleName).toBe("Ali Mohamed")
      expect(result.data?.personal?.lastName).toBe("Hassan")
    })

    it("skips name when only one word", async () => {
      mockExtractionResult({ fullName: "Ahmed" })
      const result = await extractForAutoFill(FILE_URL, "idUrl")
      // No personal data since name couldn't be split
      expect(result.data?.personal).toBeUndefined()
    })

    it("maps placeOfBirth to location.country", async () => {
      mockExtractionResult({
        fullName: "Ahmed Hassan",
        placeOfBirth: "Sudan",
      })
      const result = await extractForAutoFill(FILE_URL, "idUrl")
      expect(result.data?.location).toEqual({ country: "Sudan" })
    })

    it("normalizes Arabic gender ذكر to MALE", async () => {
      mockExtractionResult({ fullName: "Ahmed Hassan", gender: "ذكر" })
      const result = await extractForAutoFill(FILE_URL, "idUrl")
      expect(result.data?.personal?.gender).toBe("MALE")
    })

    it("normalizes Arabic gender أنثى to FEMALE", async () => {
      mockExtractionResult({ fullName: "Fatima Hassan", gender: "أنثى" })
      const result = await extractForAutoFill(FILE_URL, "idUrl")
      expect(result.data?.personal?.gender).toBe("FEMALE")
    })

    it("normalizes shorthand gender m/f", async () => {
      mockExtractionResult({ fullName: "Ahmed Hassan", gender: "m" })
      const r1 = await extractForAutoFill(FILE_URL, "idUrl")
      expect(r1.data?.personal?.gender).toBe("MALE")

      mockExtractionResult({ fullName: "Fatima Hassan", gender: "f" })
      const r2 = await extractForAutoFill(FILE_URL, "idUrl")
      expect(r2.data?.personal?.gender).toBe("FEMALE")
    })

    it("defaults unknown gender to undefined", async () => {
      mockExtractionResult({ fullName: "Alex Hassan", gender: "nonbinary" })
      const result = await extractForAutoFill(FILE_URL, "idUrl")
      expect(result.data?.personal?.gender).toBeUndefined()
    })
  })

  // =========================================================================
  // Transcript → Academic + Personal
  // =========================================================================

  describe("transcript mapping", () => {
    it("maps institution to previousSchool", async () => {
      mockExtractionResult({ institution: "Cairo University" })
      const result = await extractForAutoFill(FILE_URL, "transcriptUrl")
      expect(result.data?.academic?.previousSchool).toBe("Cairo University")
    })

    it("maps GPA 3.8/4.0 to excellent", async () => {
      mockExtractionResult({ cumulativeGpa: 3.8, gpaScale: 4.0 })
      const result = await extractForAutoFill(FILE_URL, "transcriptUrl")
      expect(result.data?.academic?.previousPercentage).toBe("excellent")
    })

    it("maps GPA 3.2/4.0 to very-good", async () => {
      mockExtractionResult({ cumulativeGpa: 3.2, gpaScale: 4.0 })
      const result = await extractForAutoFill(FILE_URL, "transcriptUrl")
      expect(result.data?.academic?.previousPercentage).toBe("very-good")
    })

    it("maps GPA 2.8/4.0 to good", async () => {
      mockExtractionResult({ cumulativeGpa: 2.8, gpaScale: 4.0 })
      const result = await extractForAutoFill(FILE_URL, "transcriptUrl")
      expect(result.data?.academic?.previousPercentage).toBe("good")
    })

    it("maps GPA 2.4/4.0 to average", async () => {
      mockExtractionResult({ cumulativeGpa: 2.4, gpaScale: 4.0 })
      const result = await extractForAutoFill(FILE_URL, "transcriptUrl")
      expect(result.data?.academic?.previousPercentage).toBe("average")
    })

    it("maps GPA 1.5/4.0 to below-average", async () => {
      mockExtractionResult({ cumulativeGpa: 1.5, gpaScale: 4.0 })
      const result = await extractForAutoFill(FILE_URL, "transcriptUrl")
      expect(result.data?.academic?.previousPercentage).toBe("below-average")
    })

    it("handles percentage scale (92/100) as excellent", async () => {
      mockExtractionResult({ cumulativeGpa: 92, gpaScale: 100 })
      const result = await extractForAutoFill(FILE_URL, "transcriptUrl")
      expect(result.data?.academic?.previousPercentage).toBe("excellent")
    })

    it("handles raw percentage (no scale) as-is", async () => {
      mockExtractionResult({ cumulativeGpa: 75 })
      const result = await extractForAutoFill(FILE_URL, "transcriptUrl")
      expect(result.data?.academic?.previousPercentage).toBe("good")
    })

    it("maps 5.0 GPA scale correctly", async () => {
      mockExtractionResult({ cumulativeGpa: 4.5, gpaScale: 5.0 })
      const result = await extractForAutoFill(FILE_URL, "transcriptUrl")
      // 4.5/5.0 = 90% → excellent
      expect(result.data?.academic?.previousPercentage).toBe("excellent")
    })

    it("extracts studentName into personal step", async () => {
      mockExtractionResult({
        institution: "Cairo University",
        studentName: "Ahmed Mohamed Hassan",
      })
      const result = await extractForAutoFill(FILE_URL, "transcriptUrl")
      expect(result.data?.personal).toEqual({
        firstName: "Ahmed",
        middleName: "Mohamed",
        lastName: "Hassan",
      })
    })
  })

  // =========================================================================
  // Degree → Academic
  // =========================================================================

  describe("degree mapping", () => {
    it("maps institution to previousSchool", async () => {
      mockExtractionResult({ institution: "MIT" })
      const result = await extractForAutoFill(FILE_URL, "degreeUrl")
      expect(result.data?.academic?.previousSchool).toBe("MIT")
    })

    it("maps honors to achievements", async () => {
      mockExtractionResult({ honors: "Summa Cum Laude" })
      const result = await extractForAutoFill(FILE_URL, "degreeUrl")
      expect(result.data?.academic?.achievements).toBe("Summa Cum Laude")
    })

    it("returns empty when no relevant fields extracted", async () => {
      mockExtractionResult({ fieldOfStudy: "Computer Science" })
      const result = await extractForAutoFill(FILE_URL, "degreeUrl")
      expect(result.data).toEqual({})
    })
  })

  // =========================================================================
  // Resume → Contact + Personal
  // =========================================================================

  describe("resume mapping", () => {
    it("maps email and phone to contact step", async () => {
      mockExtractionResult({
        email: "ahmed@example.com",
        phone: "+249123456789",
      })
      const result = await extractForAutoFill(FILE_URL, "resumeUrl")
      expect(result.data?.contact).toEqual({
        email: "ahmed@example.com",
        phone: "+249123456789",
      })
    })

    it("extracts fullName into personal step", async () => {
      mockExtractionResult({
        fullName: "Ahmed Hassan",
        email: "ahmed@example.com",
      })
      const result = await extractForAutoFill(FILE_URL, "resumeUrl")
      expect(result.data?.personal?.firstName).toBe("Ahmed")
      expect(result.data?.personal?.lastName).toBe("Hassan")
    })

    it("maps only email when phone missing", async () => {
      mockExtractionResult({ email: "ahmed@example.com" })
      const result = await extractForAutoFill(FILE_URL, "resumeUrl")
      expect(result.data?.contact).toEqual({ email: "ahmed@example.com" })
    })
  })
})
