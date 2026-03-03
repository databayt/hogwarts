// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"

import {
  createOperatorLead,
  deleteOperatorLead,
  getOperatorLeadById,
  getOperatorLeads,
  updateOperatorLead,
} from "../actions"

// ============================================================================
// Mocks
// ============================================================================

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    lead: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

vi.mock("@/components/sales/validation", () => ({
  createLeadSchema: { parse: vi.fn((x: unknown) => x) },
  updateLeadSchema: { parse: vi.fn((x: unknown) => x) },
  leadFilterSchema: { parse: vi.fn((x: unknown) => x) },
}))

// ============================================================================
// Constants
// ============================================================================

const PLATFORM_SCHOOL_ID = "platform"
const SALES_PATH = "/sales"

// ============================================================================
// Helpers
// ============================================================================

function mockDeveloperSession() {
  vi.mocked(auth).mockResolvedValue({
    user: { id: "dev-1", role: "DEVELOPER" },
  } as any)
}

function mockNonDeveloperSession(role = "ADMIN") {
  vi.mocked(auth).mockResolvedValue({
    user: { id: "user-1", role },
  } as any)
}

function mockNoSession() {
  vi.mocked(auth).mockResolvedValue(null as any)
}

function makeLeadInput(overrides: Record<string, unknown> = {}) {
  return {
    name: "Acme School",
    email: "contact@acme.edu",
    phone: "+1234567890",
    company: "Acme Education",
    title: "Principal",
    website: "https://acme.edu",
    linkedinUrl: "https://linkedin.com/in/acme",
    leadType: "SCHOOL",
    industry: "Education",
    location: "New York",
    country: "US",
    status: "NEW",
    source: "MANUAL",
    priority: "MEDIUM",
    score: 50,
    verified: false,
    notes: "Interested in platform",
    tags: ["k12", "us"],
    ...overrides,
  }
}

function makeMockLead(overrides: Record<string, unknown> = {}) {
  return {
    id: "lead-1",
    schoolId: PLATFORM_SCHOOL_ID,
    name: "Acme School",
    email: "contact@acme.edu",
    phone: "+1234567890",
    company: "Acme Education",
    title: "Principal",
    website: "https://acme.edu",
    linkedinUrl: "https://linkedin.com/in/acme",
    leadType: "SCHOOL",
    industry: "Education",
    location: "New York",
    status: "NEW",
    source: "MANUAL",
    priority: "MEDIUM",
    score: 50,
    verified: false,
    notes: "Interested in platform",
    tags: ["k12", "us"],
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  }
}

// ============================================================================
// Tests
// ============================================================================

describe("Sales Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ==========================================================================
  // createOperatorLead
  // ==========================================================================

  describe("createOperatorLead", () => {
    it("creates lead with valid input and PLATFORM_SCHOOL_ID", async () => {
      mockDeveloperSession()
      vi.mocked(db.lead.findFirst).mockResolvedValue(null)
      vi.mocked(db.lead.create).mockResolvedValue(
        makeMockLead({ id: "lead-new" }) as any
      )

      const input = makeLeadInput()
      const result = await createOperatorLead(input as any)

      expect(result).toEqual({ success: true, data: { id: "lead-new" } })
      expect(db.lead.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          schoolId: PLATFORM_SCHOOL_ID,
          name: "Acme School",
          email: "contact@acme.edu",
        }),
      })
      expect(revalidatePath).toHaveBeenCalledWith(SALES_PATH)
    })

    it("sets default values for optional fields", async () => {
      mockDeveloperSession()
      vi.mocked(db.lead.findFirst).mockResolvedValue(null)
      vi.mocked(db.lead.create).mockResolvedValue(
        makeMockLead({ id: "lead-min" }) as any
      )

      const input = makeLeadInput({
        email: undefined,
        phone: undefined,
        company: undefined,
      })
      const result = await createOperatorLead(input as any)

      expect(result.success).toBe(true)
      expect(db.lead.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          schoolId: PLATFORM_SCHOOL_ID,
          email: null,
          phone: null,
          company: null,
        }),
      })
    })

    it("returns error for duplicate email", async () => {
      mockDeveloperSession()
      vi.mocked(db.lead.findFirst).mockResolvedValue(
        makeMockLead({ email: "contact@acme.edu" }) as any
      )

      const input = makeLeadInput({ email: "contact@acme.edu" })
      const result = await createOperatorLead(input as any)

      expect(result).toEqual({
        success: false,
        error: "A lead with this email already exists",
      })
      expect(db.lead.create).not.toHaveBeenCalled()
    })

    it("checks duplicate email scoped to PLATFORM_SCHOOL_ID", async () => {
      mockDeveloperSession()
      vi.mocked(db.lead.findFirst).mockResolvedValue(null)
      vi.mocked(db.lead.create).mockResolvedValue(
        makeMockLead({ id: "lead-dup-check" }) as any
      )

      const input = makeLeadInput({ email: "test@example.com" })
      await createOperatorLead(input as any)

      expect(db.lead.findFirst).toHaveBeenCalledWith({
        where: {
          email: "test@example.com",
          schoolId: PLATFORM_SCHOOL_ID,
        },
      })
    })

    it("skips duplicate check when email is empty", async () => {
      mockDeveloperSession()
      vi.mocked(db.lead.create).mockResolvedValue(
        makeMockLead({ id: "lead-no-email" }) as any
      )

      const input = makeLeadInput({ email: "" })
      const result = await createOperatorLead(input as any)

      expect(result.success).toBe(true)
      expect(db.lead.findFirst).not.toHaveBeenCalled()
    })

    it("requires DEVELOPER role", async () => {
      mockNonDeveloperSession("ADMIN")

      const input = makeLeadInput()
      const result = await createOperatorLead(input as any)

      expect(result).toEqual({
        success: false,
        error: "Unauthorized: Platform admin access required",
      })
      expect(db.lead.create).not.toHaveBeenCalled()
    })

    it("rejects TEACHER role", async () => {
      mockNonDeveloperSession("TEACHER")

      const input = makeLeadInput()
      const result = await createOperatorLead(input as any)

      expect(result.success).toBe(false)
      expect(db.lead.create).not.toHaveBeenCalled()
    })

    it("returns error when not authenticated", async () => {
      mockNoSession()

      const input = makeLeadInput()
      const result = await createOperatorLead(input as any)

      expect(result).toEqual({
        success: false,
        error: "Unauthorized",
      })
      expect(db.lead.create).not.toHaveBeenCalled()
    })

    it("handles database error", async () => {
      mockDeveloperSession()
      vi.mocked(db.lead.findFirst).mockResolvedValue(null)
      vi.mocked(db.lead.create).mockRejectedValue(
        new Error("Unique constraint violation")
      )

      const input = makeLeadInput()
      const result = await createOperatorLead(input as any)

      expect(result).toEqual({
        success: false,
        error: "Unique constraint violation",
      })
    })

    it("handles non-Error thrown values gracefully", async () => {
      mockDeveloperSession()
      vi.mocked(db.lead.findFirst).mockResolvedValue(null)
      vi.mocked(db.lead.create).mockRejectedValue("some string error")

      const input = makeLeadInput()
      const result = await createOperatorLead(input as any)

      expect(result).toEqual({
        success: false,
        error: "Failed to create lead",
      })
    })
  })

  // ==========================================================================
  // updateOperatorLead
  // ==========================================================================

  describe("updateOperatorLead", () => {
    it("updates existing lead", async () => {
      mockDeveloperSession()
      vi.mocked(db.lead.findFirst).mockResolvedValue(makeMockLead() as any)
      vi.mocked(db.lead.update).mockResolvedValue(
        makeMockLead({ name: "Updated School" }) as any
      )

      const input = { name: "Updated School" }
      const result = await updateOperatorLead("lead-1", input as any)

      expect(result).toEqual({ success: true, data: { id: "lead-1" } })
      expect(db.lead.update).toHaveBeenCalledWith({
        where: { id: "lead-1" },
        data: expect.objectContaining({ name: "Updated School" }),
      })
    })

    it("finds lead scoped by PLATFORM_SCHOOL_ID", async () => {
      mockDeveloperSession()
      vi.mocked(db.lead.findFirst).mockResolvedValue(makeMockLead() as any)
      vi.mocked(db.lead.update).mockResolvedValue(makeMockLead() as any)

      await updateOperatorLead("lead-1", { name: "Test" } as any)

      expect(db.lead.findFirst).toHaveBeenCalledWith({
        where: { id: "lead-1", schoolId: PLATFORM_SCHOOL_ID },
      })
    })

    it("returns error for non-existent lead", async () => {
      mockDeveloperSession()
      vi.mocked(db.lead.findFirst).mockResolvedValue(null)

      const result = await updateOperatorLead("nonexistent", {
        name: "Test",
      } as any)

      expect(result).toEqual({
        success: false,
        error: "Lead not found",
      })
      expect(db.lead.update).not.toHaveBeenCalled()
    })

    it("requires DEVELOPER role", async () => {
      mockNonDeveloperSession("ADMIN")

      const result = await updateOperatorLead("lead-1", {
        name: "Test",
      } as any)

      expect(result).toEqual({
        success: false,
        error: "Unauthorized: Platform admin access required",
      })
      expect(db.lead.findFirst).not.toHaveBeenCalled()
    })

    it("revalidates both list and detail paths", async () => {
      mockDeveloperSession()
      vi.mocked(db.lead.findFirst).mockResolvedValue(makeMockLead() as any)
      vi.mocked(db.lead.update).mockResolvedValue(makeMockLead() as any)

      await updateOperatorLead("lead-1", { name: "Test" } as any)

      expect(revalidatePath).toHaveBeenCalledWith(SALES_PATH)
      expect(revalidatePath).toHaveBeenCalledWith(`${SALES_PATH}/lead-1`)
    })

    it("handles database error on update", async () => {
      mockDeveloperSession()
      vi.mocked(db.lead.findFirst).mockResolvedValue(makeMockLead() as any)
      vi.mocked(db.lead.update).mockRejectedValue(
        new Error("Database connection lost")
      )

      const result = await updateOperatorLead("lead-1", {
        name: "Test",
      } as any)

      expect(result).toEqual({
        success: false,
        error: "Database connection lost",
      })
    })
  })

  // ==========================================================================
  // deleteOperatorLead
  // ==========================================================================

  describe("deleteOperatorLead", () => {
    it("deletes existing lead", async () => {
      mockDeveloperSession()
      vi.mocked(db.lead.findFirst).mockResolvedValue(makeMockLead() as any)
      vi.mocked(db.lead.delete).mockResolvedValue({} as any)

      const result = await deleteOperatorLead("lead-1")

      expect(result).toEqual({ success: true, data: undefined })
      expect(db.lead.delete).toHaveBeenCalledWith({
        where: { id: "lead-1" },
      })
      expect(revalidatePath).toHaveBeenCalledWith(SALES_PATH)
    })

    it("finds lead scoped by PLATFORM_SCHOOL_ID before deleting", async () => {
      mockDeveloperSession()
      vi.mocked(db.lead.findFirst).mockResolvedValue(makeMockLead() as any)
      vi.mocked(db.lead.delete).mockResolvedValue({} as any)

      await deleteOperatorLead("lead-1")

      expect(db.lead.findFirst).toHaveBeenCalledWith({
        where: { id: "lead-1", schoolId: PLATFORM_SCHOOL_ID },
      })
    })

    it("returns error for non-existent lead", async () => {
      mockDeveloperSession()
      vi.mocked(db.lead.findFirst).mockResolvedValue(null)

      const result = await deleteOperatorLead("nonexistent")

      expect(result).toEqual({
        success: false,
        error: "Lead not found",
      })
      expect(db.lead.delete).not.toHaveBeenCalled()
    })

    it("requires DEVELOPER role", async () => {
      mockNonDeveloperSession("STUDENT")

      const result = await deleteOperatorLead("lead-1")

      expect(result).toEqual({
        success: false,
        error: "Unauthorized: Platform admin access required",
      })
      expect(db.lead.findFirst).not.toHaveBeenCalled()
    })

    it("handles database error on delete", async () => {
      mockDeveloperSession()
      vi.mocked(db.lead.findFirst).mockResolvedValue(makeMockLead() as any)
      vi.mocked(db.lead.delete).mockRejectedValue(
        new Error("Foreign key constraint failed")
      )

      const result = await deleteOperatorLead("lead-1")

      expect(result).toEqual({
        success: false,
        error: "Foreign key constraint failed",
      })
    })
  })

  // ==========================================================================
  // getOperatorLeads
  // ==========================================================================

  describe("getOperatorLeads", () => {
    const mockLeadsList = [
      makeMockLead({ id: "lead-1", name: "Alpha School" }),
      makeMockLead({ id: "lead-2", name: "Beta School" }),
      makeMockLead({ id: "lead-3", name: "Gamma School" }),
    ]

    it("returns paginated leads with defaults", async () => {
      mockDeveloperSession()
      vi.mocked(db.lead.count).mockResolvedValue(3)
      vi.mocked(db.lead.findMany).mockResolvedValue(mockLeadsList as any)

      const result = await getOperatorLeads()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.leads).toHaveLength(3)
        expect(result.data.total).toBe(3)
        expect(result.data.page).toBe(1)
        expect(result.data.perPage).toBe(20)
        expect(result.data.totalPages).toBe(1)
      }
    })

    it("scopes query to PLATFORM_SCHOOL_ID", async () => {
      mockDeveloperSession()
      vi.mocked(db.lead.count).mockResolvedValue(0)
      vi.mocked(db.lead.findMany).mockResolvedValue([])

      await getOperatorLeads()

      expect(db.lead.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          schoolId: PLATFORM_SCHOOL_ID,
        }),
      })
      expect(db.lead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            schoolId: PLATFORM_SCHOOL_ID,
          }),
        })
      )
    })

    it("applies search filter across name, email, company", async () => {
      mockDeveloperSession()
      vi.mocked(db.lead.count).mockResolvedValue(1)
      vi.mocked(db.lead.findMany).mockResolvedValue([mockLeadsList[0]] as any)

      await getOperatorLeads({ search: "Alpha" })

      expect(db.lead.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          schoolId: PLATFORM_SCHOOL_ID,
          OR: [
            { name: { contains: "Alpha", mode: "insensitive" } },
            { email: { contains: "Alpha", mode: "insensitive" } },
            { company: { contains: "Alpha", mode: "insensitive" } },
          ],
        }),
      })
    })

    it("applies status filter", async () => {
      mockDeveloperSession()
      vi.mocked(db.lead.count).mockResolvedValue(1)
      vi.mocked(db.lead.findMany).mockResolvedValue([mockLeadsList[0]] as any)

      await getOperatorLeads({ status: "QUALIFIED" } as any)

      expect(db.lead.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          schoolId: PLATFORM_SCHOOL_ID,
          status: "QUALIFIED",
        }),
      })
    })

    it("applies source filter", async () => {
      mockDeveloperSession()
      vi.mocked(db.lead.count).mockResolvedValue(2)
      vi.mocked(db.lead.findMany).mockResolvedValue(
        mockLeadsList.slice(0, 2) as any
      )

      await getOperatorLeads({ source: "WEBSITE" } as any)

      expect(db.lead.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          schoolId: PLATFORM_SCHOOL_ID,
          source: "WEBSITE",
        }),
      })
    })

    it("applies priority filter", async () => {
      mockDeveloperSession()
      vi.mocked(db.lead.count).mockResolvedValue(1)
      vi.mocked(db.lead.findMany).mockResolvedValue([mockLeadsList[0]] as any)

      await getOperatorLeads({ priority: "HIGH" } as any)

      expect(db.lead.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          schoolId: PLATFORM_SCHOOL_ID,
          priority: "HIGH",
        }),
      })
    })

    it("applies leadType filter", async () => {
      mockDeveloperSession()
      vi.mocked(db.lead.count).mockResolvedValue(1)
      vi.mocked(db.lead.findMany).mockResolvedValue([mockLeadsList[0]] as any)

      await getOperatorLeads({ leadType: "INDIVIDUAL" } as any)

      expect(db.lead.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          schoolId: PLATFORM_SCHOOL_ID,
          leadType: "INDIVIDUAL",
        }),
      })
    })

    it("applies verified filter", async () => {
      mockDeveloperSession()
      vi.mocked(db.lead.count).mockResolvedValue(1)
      vi.mocked(db.lead.findMany).mockResolvedValue([mockLeadsList[0]] as any)

      await getOperatorLeads({ verified: true } as any)

      expect(db.lead.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          schoolId: PLATFORM_SCHOOL_ID,
          verified: true,
        }),
      })
    })

    it("calculates totalPages correctly", async () => {
      mockDeveloperSession()
      vi.mocked(db.lead.count).mockResolvedValue(45)
      vi.mocked(db.lead.findMany).mockResolvedValue(mockLeadsList as any)

      const result = await getOperatorLeads(undefined, 1, 20)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.totalPages).toBe(3) // Math.ceil(45 / 20)
      }
    })

    it("passes correct skip and take for pagination", async () => {
      mockDeveloperSession()
      vi.mocked(db.lead.count).mockResolvedValue(50)
      vi.mocked(db.lead.findMany).mockResolvedValue(mockLeadsList as any)

      await getOperatorLeads(undefined, 3, 10)

      expect(db.lead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20, // (3 - 1) * 10
          take: 10,
        })
      )
    })

    it("orders results by createdAt descending", async () => {
      mockDeveloperSession()
      vi.mocked(db.lead.count).mockResolvedValue(0)
      vi.mocked(db.lead.findMany).mockResolvedValue([])

      await getOperatorLeads()

      expect(db.lead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: "desc" },
        })
      )
    })

    it("requires DEVELOPER role", async () => {
      mockNonDeveloperSession("ACCOUNTANT")

      const result = await getOperatorLeads()

      expect(result).toEqual({
        success: false,
        error: "Unauthorized: Platform admin access required",
      })
      expect(db.lead.count).not.toHaveBeenCalled()
      expect(db.lead.findMany).not.toHaveBeenCalled()
    })

    it("handles database error", async () => {
      mockDeveloperSession()
      vi.mocked(db.lead.count).mockRejectedValue(
        new Error("Connection timeout")
      )

      const result = await getOperatorLeads()

      expect(result).toEqual({
        success: false,
        error: "Connection timeout",
      })
    })
  })

  // ==========================================================================
  // getOperatorLeadById
  // ==========================================================================

  describe("getOperatorLeadById", () => {
    it("returns lead by ID", async () => {
      mockDeveloperSession()
      const mockLead = makeMockLead()
      vi.mocked(db.lead.findFirst).mockResolvedValue(mockLead as any)

      const result = await getOperatorLeadById("lead-1")

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(
          expect.objectContaining({
            id: "lead-1",
            name: "Acme School",
            email: "contact@acme.edu",
          })
        )
      }
    })

    it("queries with PLATFORM_SCHOOL_ID scope", async () => {
      mockDeveloperSession()
      vi.mocked(db.lead.findFirst).mockResolvedValue(null)

      await getOperatorLeadById("lead-1")

      expect(db.lead.findFirst).toHaveBeenCalledWith({
        where: { id: "lead-1", schoolId: PLATFORM_SCHOOL_ID },
      })
    })

    it("returns null data for non-existent lead", async () => {
      mockDeveloperSession()
      vi.mocked(db.lead.findFirst).mockResolvedValue(null)

      const result = await getOperatorLeadById("nonexistent")

      expect(result).toEqual({ success: true, data: null })
    })

    it("requires DEVELOPER role", async () => {
      mockNonDeveloperSession("GUARDIAN")

      const result = await getOperatorLeadById("lead-1")

      expect(result).toEqual({
        success: false,
        error: "Unauthorized: Platform admin access required",
      })
      expect(db.lead.findFirst).not.toHaveBeenCalled()
    })

    it("returns full lead data including all fields", async () => {
      mockDeveloperSession()
      const mockLead = makeMockLead({
        website: "https://acme.edu",
        linkedinUrl: "https://linkedin.com/in/acme",
        industry: "Education",
        location: "New York",
        notes: "Follow up next week",
        tags: ["k12", "premium"],
        verified: true,
        score: 85,
      })
      vi.mocked(db.lead.findFirst).mockResolvedValue(mockLead as any)

      const result = await getOperatorLeadById("lead-1")

      expect(result.success).toBe(true)
      if (result.success && result.data) {
        expect(result.data.website).toBe("https://acme.edu")
        expect(result.data.linkedinUrl).toBe("https://linkedin.com/in/acme")
        expect(result.data.industry).toBe("Education")
        expect(result.data.location).toBe("New York")
        expect(result.data.notes).toBe("Follow up next week")
        expect(result.data.tags).toEqual(["k12", "premium"])
        expect(result.data.verified).toBe(true)
        expect(result.data.score).toBe(85)
      }
    })

    it("handles database error", async () => {
      mockDeveloperSession()
      vi.mocked(db.lead.findFirst).mockRejectedValue(
        new Error("Query execution failed")
      )

      const result = await getOperatorLeadById("lead-1")

      expect(result).toEqual({
        success: false,
        error: "Query execution failed",
      })
    })
  })
})
