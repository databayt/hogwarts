// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import { streamCoursesSearchParams } from "@/components/stream/list-params"

describe("streamCoursesSearchParams", () => {
  it("applies defaults when query is empty", async () => {
    const result = await streamCoursesSearchParams.parse({})
    expect(result).toEqual({
      page: 1,
      perPage: 12,
      title: "",
      category: "",
      level: "1",
      isPublished: "",
      sort: [],
    })
  })

  it("parses page and perPage as integers", async () => {
    const result = await streamCoursesSearchParams.parse({
      page: "3",
      perPage: "24",
    })
    expect(result.page).toBe(3)
    expect(result.perPage).toBe(24)
  })

  it("falls back to defaults for non-integer page/perPage", async () => {
    const result = await streamCoursesSearchParams.parse({
      page: "abc",
      perPage: "xyz",
    })
    expect(result.page).toBe(1)
    expect(result.perPage).toBe(12)
  })

  it("preserves string filters", async () => {
    const result = await streamCoursesSearchParams.parse({
      title: "math",
      category: "cat-1",
      level: "BEGINNER",
      isPublished: "true",
    })
    expect(result.title).toBe("math")
    expect(result.category).toBe("cat-1")
    expect(result.level).toBe("BEGINNER")
    expect(result.isPublished).toBe("true")
  })
})
