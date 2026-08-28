// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { getAllCatalogCourses } from "@/components/lumos/data/catalog/get-all-courses"

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("@/components/catalog/setup", () => ({
  ensureSubjectSelections: vi.fn(async () => ({ provisioned: false })),
}))
vi.mock("@/components/catalog/image-url", () => ({
  getCatalogImageUrl: (v: string | null) => v,
}))
// The translation layer is exercised by its own suite; here it is a
// pass-through so the assertions stay on the query shape.
vi.mock("@/components/translation/localize", () => ({
  localize: async (_model: string, rows: unknown[]) => rows,
}))
vi.mock("@/components/translation/person", () => ({
  getLabels: async () => new Map<string, string>(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    subjectSelection: { findMany: vi.fn() },
    subject: { findMany: vi.fn(), count: vi.fn() },
    translation: { findMany: vi.fn() },
  },
}))

const mTenant = getTenantContext as unknown as ReturnType<typeof vi.fn>
const mSelections = db.subjectSelection.findMany as ReturnType<typeof vi.fn>
const mSubjects = db.subject.findMany as ReturnType<typeof vi.fn>
const mCount = db.subject.count as ReturnType<typeof vi.fn>
const mTranslations = db.translation.findMany as ReturnType<typeof vi.fn>

const SUBJECT = {
  id: "subj-1",
  name: "Mathematics",
  slug: "sd-g1-math",
  description: "desc",
  thumbnail: "catalog/math",
  banner: null,
  color: "#123456",
  lang: "en",
  department: "Elementary",
  levels: ["ELEMENTARY"],
  grades: [1],
  totalChapters: 3,
  totalLessons: 47,
  usageCount: 0,
  averageRating: 0,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
}

beforeEach(() => {
  vi.clearAllMocks()
  mTenant.mockResolvedValue({ schoolId: "school-1", subdomain: "demo" })
  mSelections.mockResolvedValue([
    { catalogSubjectId: "subj-1", customName: null },
  ])
  mSubjects.mockResolvedValue([SUBJECT])
  mCount.mockResolvedValue(1)
  mTranslations.mockResolvedValue([])
})

describe("getAllCatalogCourses — tenant scope", () => {
  it("returns nothing when the request carries no school", async () => {
    mTenant.mockResolvedValueOnce({ schoolId: null, subdomain: null })
    const result = await getAllCatalogCourses({})
    expect(result).toEqual({ rows: [], count: 0 })
    expect(mSubjects).not.toHaveBeenCalled()
  })

  it("restricts the query to the school's active selections", async () => {
    await getAllCatalogCourses({})
    expect(mSelections).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { schoolId: "school-1", isActive: true },
      })
    )
    expect(mSubjects.mock.calls[0][0].where.id).toEqual({ in: ["subj-1"] })
  })
})

describe("getAllCatalogCourses — search", () => {
  it("reads the translation cache only for the language on screen", async () => {
    await getAllCatalogCourses({ search: "الرياضيات", lang: "ar" })
    // Scoping to the display language is what keeps the cache read off a full
    // scan of every translation the school owns.
    expect(mTranslations).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          schoolId: "school-1",
          targetLanguage: "ar",
        }),
      })
    )
  })

  it("matches the stored name, the slug, and cached translations", async () => {
    mTranslations.mockResolvedValueOnce([{ sourceText: "Mathematics" }])
    await getAllCatalogCourses({ search: "الرياضيات", lang: "ar" })
    const or = mSubjects.mock.calls[0][0].where.OR
    expect(or).toEqual([
      { name: { contains: "الرياضيات", mode: "insensitive" } },
      { slug: { contains: "الرياضيات", mode: "insensitive" } },
      { name: { in: ["Mathematics"] } },
    ])
  })

  it("spans every grade while searching, and only one while browsing", async () => {
    await getAllCatalogCourses({ search: "math", grade: 3 })
    expect(mSubjects.mock.calls[0][0].where.grades).toBeUndefined()

    mSubjects.mockClear()
    await getAllCatalogCourses({ grade: 3 })
    expect(mSubjects.mock.calls[0][0].where.grades).toEqual({ has: 3 })
  })

  it("never touches the cache when nothing was typed", async () => {
    await getAllCatalogCourses({ grade: 1 })
    expect(mTranslations).not.toHaveBeenCalled()
    expect(mSubjects.mock.calls[0][0].where.OR).toBeUndefined()
  })
})

describe("getAllCatalogCourses — shape", () => {
  it("carries the fields the cards and the search dropdown render", async () => {
    const { rows, count } = await getAllCatalogCourses({ lang: "en" })
    expect(count).toBe(1)
    expect(rows[0]).toMatchObject({
      id: "subj-1",
      title: "Mathematics",
      slug: "sd-g1-math",
      imageUrl: "catalog/math",
      category: { name: "Elementary" },
    })
    // The dropdown's meta line reads grades + lesson count off `_catalog`.
    expect(rows[0]._catalog).toMatchObject({
      grades: [1],
      totalLessons: 47,
      color: "#123456",
    })
  })

  it("paginates by page/perPage", async () => {
    await getAllCatalogCourses({ page: 3, perPage: 6 })
    expect(mSubjects.mock.calls[0][0]).toMatchObject({ skip: 12, take: 6 })
  })
})
