// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { getProposableLessons } from "@/components/stream/teach/get-proposable-lessons"

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    lesson: {
      findMany: vi.fn(),
    },
    subjectSelection: {
      findMany: vi.fn(),
    },
  },
}))

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>
const mockTenant = getTenantContext as ReturnType<typeof vi.fn>
const mockFindMany = db.lesson.findMany as ReturnType<typeof vi.fn>
const mockSelectionFindMany = db.subjectSelection.findMany as ReturnType<
  typeof vi.fn
>

beforeEach(() => {
  vi.clearAllMocks()
  mockFindMany.mockResolvedValue([])
  // Default: a school with one selected subject (school-role path reaches the
  // lesson query).
  mockTenant.mockResolvedValue({ schoolId: "school-1", subdomain: "demo" })
  mockSelectionFindMany.mockResolvedValue([{ catalogSubjectId: "subj-1" }])
})

describe("getProposableLessons — security", () => {
  it("returns [] for unauthenticated user", async () => {
    mockAuth.mockResolvedValueOnce(null)
    const result = await getProposableLessons()
    expect(result).toEqual([])
    expect(mockFindMany).not.toHaveBeenCalled()
  })

  it("returns [] for missing role", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "u-1" } })
    const result = await getProposableLessons()
    expect(result).toEqual([])
    expect(mockFindMany).not.toHaveBeenCalled()
  })

  it.each(["STUDENT", "GUARDIAN", "ACCOUNTANT", "STAFF", "USER"] as const)(
    "denies role %s",
    async (role) => {
      mockAuth.mockResolvedValueOnce({ user: { id: "u-1", role } })
      const result = await getProposableLessons()
      expect(result).toEqual([])
      expect(mockFindMany).not.toHaveBeenCalled()
    }
  )

  it.each(["DEVELOPER", "ADMIN", "TEACHER"] as const)(
    "permits role %s",
    async (role) => {
      mockAuth.mockResolvedValueOnce({ user: { id: "u-1", role } })
      await getProposableLessons()
      expect(mockFindMany).toHaveBeenCalledOnce()
    }
  )
})

describe("getProposableLessons — school scoping", () => {
  it("DEVELOPER enumerates the global catalog (no SubjectSelection scope)", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "dev-1", role: "DEVELOPER" } })
    await getProposableLessons()
    expect(mockSelectionFindMany).not.toHaveBeenCalled()
    const call = mockFindMany.mock.calls[0][0] as {
      where: { chapter: { subject: Record<string, unknown> } }
    }
    expect(call.where.chapter.subject).not.toHaveProperty("id")
  })

  it("scopes a TEACHER to the school's selected subjects", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "t-1", role: "TEACHER" } })
    mockSelectionFindMany.mockResolvedValueOnce([
      { catalogSubjectId: "subj-1" },
      { catalogSubjectId: "subj-2" },
    ])
    await getProposableLessons()
    const call = mockFindMany.mock.calls[0][0] as {
      where: { chapter: { subject: { id: { in: string[] } } } }
    }
    expect(call.where.chapter.subject.id.in).toEqual(["subj-1", "subj-2"])
  })

  it("returns [] for a school role without school context", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "a-1", role: "ADMIN" } })
    mockTenant.mockResolvedValueOnce({ schoolId: null, subdomain: null })
    const result = await getProposableLessons()
    expect(result).toEqual([])
    expect(mockFindMany).not.toHaveBeenCalled()
  })

  it("returns [] when the school has selected no subjects", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "a-1", role: "ADMIN" } })
    mockSelectionFindMany.mockResolvedValueOnce([])
    const result = await getProposableLessons()
    expect(result).toEqual([])
    expect(mockFindMany).not.toHaveBeenCalled()
  })
})

describe("getProposableLessons — query", () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({ user: { id: "t-1", role: "TEACHER" } })
  })

  it("filters by published subject status", async () => {
    await getProposableLessons()
    const call = mockFindMany.mock.calls[0][0] as {
      where: { chapter: { subject: { status: string } } }
    }
    expect(call.where.chapter.subject.status).toBe("PUBLISHED")
  })

  it("orders by subject.name → chapter.sequenceOrder → lesson.sequenceOrder", async () => {
    await getProposableLessons()
    const call = mockFindMany.mock.calls[0][0] as {
      orderBy: Array<Record<string, unknown>>
    }
    expect(call.orderBy).toHaveLength(3)
  })

  it("flattens nested chapter+subject into the result", async () => {
    mockFindMany.mockResolvedValueOnce([
      {
        id: "l-1",
        name: "Algebra basics",
        chapter: {
          name: "Chapter 1",
          subject: { name: "Math", slug: "math" },
        },
      },
    ])
    const result = await getProposableLessons()
    expect(result).toEqual([
      {
        id: "l-1",
        name: "Algebra basics",
        chapterName: "Chapter 1",
        subjectName: "Math",
        subjectSlug: "math",
      },
    ])
  })
})
