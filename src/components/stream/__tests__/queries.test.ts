// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Prisma } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"

import {
  buildCourseOrderBy,
  buildCourseWhere,
  buildPagination,
  getAdminCoursesList,
  getCourseDetail,
  getCoursesList,
  getCourseStats,
} from "../queries"

vi.mock("@/lib/db", () => ({
  db: {
    streamCourse: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
    },
    streamEnrollment: {
      count: vi.fn(),
    },
  },
}))

const mockFindMany = db.streamCourse.findMany as ReturnType<typeof vi.fn>
const mockFindFirst = db.streamCourse.findFirst as ReturnType<typeof vi.fn>
const mockCount = db.streamCourse.count as ReturnType<typeof vi.fn>
const mockEnrollCount = db.streamEnrollment.count as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
  mockFindMany.mockResolvedValue([])
  mockFindFirst.mockResolvedValue(null)
  mockCount.mockResolvedValue(0)
  mockEnrollCount.mockResolvedValue(0)
})

describe("buildCourseWhere", () => {
  it("always scopes by schoolId", () => {
    const where = buildCourseWhere("school-1")
    expect(where.schoolId).toBe("school-1")
  })

  it("applies case-insensitive title contains", () => {
    const where = buildCourseWhere("school-1", { title: "math" })
    expect(where.title).toEqual({
      contains: "math",
      mode: Prisma.QueryMode.insensitive,
    })
  })

  it("applies categoryId from category filter", () => {
    const where = buildCourseWhere("school-1", { category: "cat-1" })
    expect(where.categoryId).toBe("cat-1")
  })

  it("applies level filter", () => {
    const where = buildCourseWhere("school-1", { level: "BEGINNER" })
    // level is cast to enum in the actual builder
    expect((where as { level?: string }).level).toBe("BEGINNER")
  })

  it("converts isPublished='true' to boolean true", () => {
    const where = buildCourseWhere("school-1", { isPublished: "true" })
    expect(where.isPublished).toBe(true)
  })

  it("converts isPublished='false' to boolean false", () => {
    const where = buildCourseWhere("school-1", { isPublished: "false" })
    expect(where.isPublished).toBe(false)
  })

  it("ignores empty isPublished string", () => {
    const where = buildCourseWhere("school-1", { isPublished: "" })
    expect(where.isPublished).toBeUndefined()
  })

  it("applies lang filter", () => {
    const where = buildCourseWhere("school-1", { lang: "ar" })
    expect(where.lang).toBe("ar")
  })
})

describe("buildCourseOrderBy", () => {
  it("defaults to createdAt desc when no sort", () => {
    expect(buildCourseOrderBy()).toEqual([{ createdAt: Prisma.SortOrder.desc }])
  })

  it("defaults to createdAt desc for empty sort", () => {
    expect(buildCourseOrderBy([])).toEqual([
      { createdAt: Prisma.SortOrder.desc },
    ])
  })

  it("maps each sort param to Prisma sort order", () => {
    const result = buildCourseOrderBy([
      { id: "title", desc: false },
      { id: "createdAt", desc: true },
    ])
    expect(result).toEqual([
      { title: Prisma.SortOrder.asc },
      { createdAt: Prisma.SortOrder.desc },
    ])
  })
})

describe("buildPagination", () => {
  it("computes skip/take for first page", () => {
    expect(buildPagination(1, 12)).toEqual({ skip: 0, take: 12 })
  })

  it("computes skip/take for second page", () => {
    expect(buildPagination(2, 12)).toEqual({ skip: 12, take: 12 })
  })

  it("computes skip/take for arbitrary page+size", () => {
    expect(buildPagination(5, 25)).toEqual({ skip: 100, take: 25 })
  })
})

describe("getCoursesList", () => {
  it("forces isPublished=true filter (public listing)", async () => {
    await getCoursesList("school-1", { title: "x" })
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          schoolId: "school-1",
          isPublished: true,
        }),
      })
    )
  })

  it("uses default page=1 perPage=12 when omitted", async () => {
    await getCoursesList("school-1")
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 12 })
    )
  })

  it("returns rows + count from parallel queries", async () => {
    mockFindMany.mockResolvedValueOnce([{ id: "c1" }])
    mockCount.mockResolvedValueOnce(42)
    const result = await getCoursesList("school-1")
    expect(result).toEqual({ rows: [{ id: "c1" }], count: 42 })
  })
})

describe("getAdminCoursesList", () => {
  it("does NOT force isPublished (admin sees drafts)", async () => {
    await getAdminCoursesList("school-1")
    const call = mockFindMany.mock.calls[0][0] as {
      where: { isPublished?: unknown }
    }
    expect(call.where.isPublished).toBeUndefined()
  })

  it("scopes by schoolId", async () => {
    await getAdminCoursesList("school-7")
    const call = mockFindMany.mock.calls[0][0] as {
      where: { schoolId: string }
    }
    expect(call.where.schoolId).toBe("school-7")
  })
})

describe("getCourseDetail", () => {
  it("scopes by slug AND schoolId", async () => {
    await getCourseDetail("school-1", "intro-to-math")
    expect(mockFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { slug: "intro-to-math", schoolId: "school-1" },
      })
    )
  })

  it("returns null when course not found", async () => {
    mockFindFirst.mockResolvedValueOnce(null)
    const result = await getCourseDetail("school-1", "missing")
    expect(result).toBeNull()
  })
})

describe("getCourseStats", () => {
  it("scopes every aggregate query by schoolId", async () => {
    mockCount
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(7)
      .mockResolvedValueOnce(3)
    mockEnrollCount.mockResolvedValueOnce(50)

    const result = await getCourseStats("school-1")

    // 3 streamCourse.count calls all scoped by schoolId
    for (const call of mockCount.mock.calls) {
      expect((call[0] as { where: { schoolId: string } }).where.schoolId).toBe(
        "school-1"
      )
    }
    // 1 streamEnrollment.count call scoped + isActive
    expect(mockEnrollCount).toHaveBeenCalledWith({
      where: { schoolId: "school-1", isActive: true },
    })
    expect(result).toEqual({
      total: 10,
      published: 7,
      draft: 3,
      totalEnrollments: 50,
    })
  })
})
