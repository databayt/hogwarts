// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import { CONCEPT_POOL } from "@/components/catalog/concepts-data"

import { resolveBannerSource } from "../../../prisma/seeds/catalog/banners"

describe("resolveBannerSource", () => {
  it("borrows the nearest downloaded neighbor from the concept's pool chain", () => {
    // health chain: ["health", "life-skills", "biology", "science", "economics"]
    const downloaded = new Set(["biology", "math"])
    expect(resolveBannerSource("health", downloaded)).toBe("biology")
  })

  it("prefers earlier chain neighbors over later ones", () => {
    const downloaded = new Set(["science", "biology"])
    // biology comes before science in the health chain
    expect(resolveBannerSource("health", downloaded)).toBe("biology")
  })

  it("falls back to any downloaded concept when no chain neighbor matches", () => {
    const downloaded = new Set(["math"])
    expect(resolveBannerSource("health", downloaded)).toBe("math")
  })

  it("returns null when nothing downloaded", () => {
    expect(resolveBannerSource("health", new Set())).toBeNull()
  })

  it("covers every pool concept when at least one banner exists", () => {
    const downloaded = new Set(["math"])
    for (const concept of Object.keys(CONCEPT_POOL)) {
      if (downloaded.has(concept)) continue
      expect(resolveBannerSource(concept, downloaded)).not.toBeNull()
    }
  })
})
