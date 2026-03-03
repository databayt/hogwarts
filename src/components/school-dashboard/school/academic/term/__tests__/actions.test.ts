// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  createTerm,
  deleteTerm,
  getTermOptions,
  getTerms,
  setActiveTerm,
  updateTerm,
} from "../actions"

// ============================================================================
// Mocks
// ============================================================================

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    schoolYear: {
      findFirst: vi.fn(),
    },
    term: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    class: {
      count: vi.fn(),
    },
  },
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

// ============================================================================
// Helpers
// ============================================================================

const SCHOOL_ID = "school-1"

function mockAdminContext() {
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: SCHOOL_ID,
    role: "ADMIN",
    requestId: null,
    isPlatformAdmin: false,
  })
}

function mockStudentContext() {
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: SCHOOL_ID,
    role: "STUDENT",
    requestId: null,
    isPlatformAdmin: false,
  })
}

function mockNoSchoolContext() {
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: null,
    role: null,
    requestId: null,
    isPlatformAdmin: false,
  })
}

const validInput = {
  yearId: "year-1",
  termNumber: 1,
  startDate: new Date("2025-09-01"),
  endDate: new Date("2025-12-20"),
  isActive: false,
}

// ============================================================================
// Tests
// ============================================================================

describe("Term Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ==========================================================================
  // createTerm
  // ==========================================================================

  describe("createTerm", () => {
    it("creates term with valid input", async () => {
      mockAdminContext()
      vi.mocked(db.schoolYear.findFirst).mockResolvedValue({
        id: "year-1",
      } as any)
      vi.mocked(db.term.findFirst).mockResolvedValue(null)
      vi.mocked(db.term.create).mockResolvedValue({ id: "term-1" } as any)

      const result = await createTerm(validInput)

      expect(result.success).toBe(true)
      if (result.success) expect(result.data).toEqual({ id: "term-1" })
    })

    it("prevents duplicate term number in same year", async () => {
      mockAdminContext()
      vi.mocked(db.schoolYear.findFirst).mockResolvedValue({
        id: "year-1",
      } as any)
      vi.mocked(db.term.findFirst).mockResolvedValue({
        id: "existing",
      } as any)

      const result = await createTerm(validInput)

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toContain("already exists")
    })

    it("verifies school year exists", async () => {
      mockAdminContext()
      vi.mocked(db.schoolYear.findFirst).mockResolvedValue(null)

      const result = await createTerm(validInput)

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toContain("Academic year")
    })

    it("requires ADMIN or DEVELOPER role", async () => {
      mockStudentContext()

      const result = await createTerm(validInput)

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toContain("Insufficient")
    })

    it("requires school context", async () => {
      mockNoSchoolContext()

      const result = await createTerm(validInput)

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toContain("Missing school")
    })
  })

  // ==========================================================================
  // updateTerm
  // ==========================================================================

  describe("updateTerm", () => {
    it("updates term", async () => {
      mockAdminContext()
      vi.mocked(db.term.findFirst)
        .mockResolvedValueOnce({ id: "term-1", yearId: "year-1" } as any)
        .mockResolvedValueOnce(null) // no duplicate
      vi.mocked(db.term.updateMany).mockResolvedValue({ count: 1 } as any)

      const result = await updateTerm({ id: "term-1", termNumber: 2 })

      expect(result.success).toBe(true)
    })

    it("returns error for non-existent term", async () => {
      mockAdminContext()
      vi.mocked(db.term.findFirst).mockResolvedValue(null)

      const result = await updateTerm({ id: "nonexistent", termNumber: 2 })

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toContain("not found")
    })

    it("requires ADMIN or DEVELOPER role", async () => {
      mockStudentContext()

      const result = await updateTerm({ id: "term-1", termNumber: 2 })

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toContain("Insufficient")
    })
  })

  // ==========================================================================
  // deleteTerm
  // ==========================================================================

  describe("deleteTerm", () => {
    it("deletes term without dependencies", async () => {
      mockAdminContext()
      vi.mocked(db.term.findFirst).mockResolvedValue({
        id: "term-1",
      } as any)
      vi.mocked(db.class.count).mockResolvedValue(0)
      vi.mocked(db.term.deleteMany).mockResolvedValue({ count: 1 } as any)

      const result = await deleteTerm({ id: "term-1" })

      expect(result.success).toBe(true)
    })

    it("blocks deletion when classes reference it", async () => {
      mockAdminContext()
      vi.mocked(db.term.findFirst).mockResolvedValue({
        id: "term-1",
      } as any)
      vi.mocked(db.class.count).mockResolvedValue(5)

      const result = await deleteTerm({ id: "term-1" })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain("Cannot delete term")
        expect(result.error).toContain("5 classes")
      }
    })

    it("requires ADMIN or DEVELOPER role", async () => {
      mockStudentContext()

      const result = await deleteTerm({ id: "term-1" })

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toContain("Insufficient")
    })
  })

  // ==========================================================================
  // setActiveTerm
  // ==========================================================================

  describe("setActiveTerm", () => {
    it("activates term and deactivates others in SAME YEAR only", async () => {
      mockAdminContext()
      vi.mocked(db.term.findFirst).mockResolvedValue({
        id: "term-2",
        yearId: "year-1",
      } as any)
      vi.mocked(db.term.updateMany).mockResolvedValue({ count: 1 } as any)

      const result = await setActiveTerm({ id: "term-2" })

      expect(result.success).toBe(true)

      // First call: deactivate others in same year only
      expect(db.term.updateMany).toHaveBeenCalledWith({
        where: { schoolId: SCHOOL_ID, yearId: "year-1", NOT: { id: "term-2" } },
        data: { isActive: false },
      })

      // Second call: activate the selected term
      expect(db.term.updateMany).toHaveBeenCalledWith({
        where: { id: "term-2", schoolId: SCHOOL_ID },
        data: { isActive: true },
      })
    })

    it("does NOT deactivate terms in other years", async () => {
      mockAdminContext()
      vi.mocked(db.term.findFirst).mockResolvedValue({
        id: "term-1",
        yearId: "year-2",
      } as any)
      vi.mocked(db.term.updateMany).mockResolvedValue({ count: 1 } as any)

      await setActiveTerm({ id: "term-1" })

      // Deactivation must include yearId scope
      const deactivateCall = vi.mocked(db.term.updateMany).mock.calls[0]
      expect(deactivateCall[0].where).toHaveProperty("yearId", "year-2")
    })

    it("returns error for non-existent term", async () => {
      mockAdminContext()
      vi.mocked(db.term.findFirst).mockResolvedValue(null)

      const result = await setActiveTerm({ id: "nonexistent" })

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toContain("not found")
    })

    it("requires ADMIN or DEVELOPER role", async () => {
      mockStudentContext()

      const result = await setActiveTerm({ id: "term-1" })

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toContain("Insufficient")
    })
  })

  // ==========================================================================
  // getTerms
  // ==========================================================================

  describe("getTerms", () => {
    it("returns terms for school", async () => {
      mockAdminContext()
      const mockRows = [
        {
          id: "t1",
          yearId: "y1",
          termNumber: 1,
          startDate: new Date("2025-09-01"),
          endDate: new Date("2025-12-20"),
          isActive: true,
          createdAt: new Date(),
          schoolYear: { yearName: "2025-2026" },
        },
      ]
      vi.mocked(db.term.findMany).mockResolvedValue(mockRows as any)
      vi.mocked(db.term.count).mockResolvedValue(1)

      const result = await getTerms()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data?.rows).toHaveLength(1)
        expect(result.data?.rows[0].yearName).toBe("2025-2026")
      }
    })
  })

  // ==========================================================================
  // getTermOptions
  // ==========================================================================

  describe("getTermOptions", () => {
    it("returns id/termNumber/yearName", async () => {
      mockAdminContext()
      vi.mocked(db.term.findMany).mockResolvedValue([
        {
          id: "t1",
          termNumber: 1,
          schoolYear: { yearName: "2025-2026" },
        },
      ] as any)

      const result = await getTermOptions()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual([
          { id: "t1", termNumber: 1, yearName: "2025-2026" },
        ])
      }
    })
  })
})
