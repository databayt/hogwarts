// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Unit tests for the translation-cache prune helpers (the CLI itself is
 * manual-run only; these pin the cutoff math and the predicate that protects
 * manual overrides and proven-hot rows).
 */
import { describe, expect, it } from "vitest"

import {
  pruneCutoff,
  pruneWhere,
} from "../../../../scripts/prune-translation-cache"

describe("prune-translation-cache", () => {
  it("computes the cutoff N months before now", () => {
    const now = new Date("2026-06-10T12:00:00Z")
    const cutoff = pruneCutoff(6, now)
    expect(cutoff.toISOString()).toBe("2025-12-10T12:00:00.000Z")
  })

  it("where-clause targets only rows older than the cutoff (by createdAt, not lastAccessedAt)", () => {
    const cutoff = new Date("2025-12-10T12:00:00Z")
    const where = pruneWhere(cutoff)
    expect(where.createdAt).toEqual({ lt: cutoff })
    // Recency must never be the eviction key — localize()'s batched reads do not
    // bump lastAccessedAt, so it would evict the hottest rows.
    expect("lastAccessedAt" in where).toBe(false)
  })

  it("NEVER deletes manual overrides — every auto provider (google/groq/auto) is fair game", () => {
    const where = pruneWhere(new Date())
    expect(where.provider).toEqual({ not: "manual" })
  })

  it("only deletes never-hit rows (hitCount = 0)", () => {
    const where = pruneWhere(new Date())
    expect(where.hitCount).toBe(0)
  })
})
