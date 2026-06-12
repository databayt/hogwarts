// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { search } from "@/components/translation/search"

const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }))

vi.mock("@/lib/db", () => ({
  db: { translation: { findMany } },
}))

beforeEach(() => {
  vi.clearAllMocks()
  findMany.mockResolvedValue([])
})

describe("search (bilingual, cache-only)", () => {
  it("same language → direct contains conditions only, no cache lookup", async () => {
    const conditions = await search("math", ["name"], "s1", "en", "en")
    expect(findMany).not.toHaveBeenCalled()
    expect(conditions).toEqual([
      { name: { contains: "math", mode: "insensitive" } },
    ])
  })

  it("cross-language → direct conditions PLUS field-IN-sourceTexts from the cache", async () => {
    findMany.mockResolvedValue([
      { sourceText: "الرياضيات" },
      { sourceText: "رياضيات متقدمة" },
    ])
    const conditions = await search("math", ["name", "title"], "s1", "ar", "en")
    expect(findMany).toHaveBeenCalledTimes(1)
    const where = findMany.mock.calls[0][0].where
    expect(where).toMatchObject({
      schoolId: "s1",
      sourceLanguage: "ar",
      targetLanguage: "en",
      translatedText: { contains: "math", mode: "insensitive" },
    })
    expect(conditions).toEqual([
      { name: { contains: "math", mode: "insensitive" } },
      { title: { contains: "math", mode: "insensitive" } },
      { name: { in: ["الرياضيات", "رياضيات متقدمة"] } },
      { title: { in: ["الرياضيات", "رياضيات متقدمة"] } },
    ])
  })

  it("empty cache → direct conditions only (graceful, no API call ever)", async () => {
    const conditions = await search("xyz", ["name"], "s1", "ar", "en")
    expect(conditions).toEqual([
      { name: { contains: "xyz", mode: "insensitive" } },
    ])
  })

  it("caps the reverse-lookup result set (bounded IN clause)", async () => {
    await search("a", ["name"], "s1", "ar", "en")
    expect(findMany.mock.calls[0][0].take).toBeGreaterThanOrEqual(50)
    expect(findMany.mock.calls[0][0].take).toBeLessThanOrEqual(500)
  })
})
