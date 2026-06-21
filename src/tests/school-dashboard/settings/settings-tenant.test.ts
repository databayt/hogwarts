// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  createTerm,
  getTerms,
  setActiveTerm,
} from "@/components/school-dashboard/school/academic/term/actions"
import {
  createSchoolYear,
  deleteSchoolYear,
  getSchoolYears,
  updateSchoolYear,
} from "@/components/school-dashboard/school/academic/year/actions"

vi.mock("@/lib/db", () => ({
  db: {
    schoolYear: {
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    term: {
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}))

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

describe("settings tenant isolation", () => {
  const mockSchoolId = "school-123"

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("updateSchoolYear returns error when schoolId is null", async () => {
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: null as any,
      subdomain: "test",
      role: "ADMIN",
      locale: "en",
    })

    const result = await updateSchoolYear({
      id: "year-1",
      yearName: "2025-2026",
    })
    expect(result.success).toBe(false)
    expect(result.error).toBe("MISSING_SCHOOL")
    expect(db.schoolYear.updateMany).not.toHaveBeenCalled()
  })

  it("updateSchoolYear passes schoolId directly to db query", async () => {
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: mockSchoolId,
      subdomain: "test",
      role: "ADMIN",
      locale: "en",
    })

    // First findFirst: existence check → record found
    // Second findFirst: duplicate-name check → null (no duplicate)
    vi.mocked(db.schoolYear.findFirst)
      .mockResolvedValueOnce({ id: "year-1", schoolId: mockSchoolId } as any)
      .mockResolvedValueOnce(null)
    vi.mocked(db.schoolYear.updateMany).mockResolvedValue({ count: 1 })

    await updateSchoolYear({ id: "year-1", yearName: "2025-2026" })

    expect(db.schoolYear.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "year-1",
          schoolId: mockSchoolId,
        }),
      })
    )
  })

  it("getSchoolYears returns error when schoolId is null", async () => {
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: null as any,
      subdomain: "test",
      role: "ADMIN",
      locale: "en",
    })

    const result = await getSchoolYears()
    expect(result.success).toBe(false)
    expect(result.error).toBe("MISSING_SCHOOL")
    expect(db.schoolYear.findMany).not.toHaveBeenCalled()
  })

  it("createSchoolYear returns error when schoolId is null", async () => {
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: null as any,
      subdomain: "test",
      role: "ADMIN",
      locale: "en",
    })

    const result = await createSchoolYear({
      yearName: "2025-2026",
      startDate: new Date("2025-09-01"),
      endDate: new Date("2026-06-30"),
    })
    expect(result.success).toBe(false)
    expect(result.error).toBe("MISSING_SCHOOL")
    expect(db.schoolYear.create).not.toHaveBeenCalled()
  })

  it("deleteSchoolYear includes schoolId in where clause", async () => {
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: mockSchoolId,
      subdomain: "test",
      role: "ADMIN",
      locale: "en",
    })

    vi.mocked(db.schoolYear.findFirst).mockResolvedValue({
      id: "year-1",
      schoolId: mockSchoolId,
      _count: { terms: 0, periods: 0 },
    } as any)
    vi.mocked(db.schoolYear.deleteMany).mockResolvedValue({ count: 1 })

    await deleteSchoolYear({ id: "year-1" })

    expect(db.schoolYear.deleteMany).toHaveBeenCalledWith({
      where: { id: "year-1", schoolId: mockSchoolId },
    })
  })

  it("getTerms returns error when schoolId is null", async () => {
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: null as any,
      subdomain: "test",
      role: "ADMIN",
      locale: "en",
    })

    const result = await getTerms()
    expect(result.success).toBe(false)
    expect(result.error).toBe("MISSING_SCHOOL")
    expect(db.term.findMany).not.toHaveBeenCalled()
  })

  it("setActiveTerm returns error when schoolId is null", async () => {
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: null as any,
      subdomain: "test",
      role: "ADMIN",
      locale: "en",
    })

    const result = await setActiveTerm({ id: "term-1" })
    expect(result.success).toBe(false)
    expect(result.error).toBe("MISSING_SCHOOL")
    expect(db.term.updateMany).not.toHaveBeenCalled()
  })
})
