// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Unit tests for the translation-cache prune helpers (the CLI itself is
 * manual-run only; these pin the cutoff math and the manual-override guard).
 */
import { describe, expect, it } from "vitest"

import {
  pruneCutoff,
  pruneWhere,
} from "../../../../scripts/prune-translation-cache"

describe("prune-translation-cache", () => {
  it("computes the cutoff N days before now", () => {
    const now = new Date("2026-06-10T12:00:00Z")
    const cutoff = pruneCutoff(180, now)
    expect(cutoff.toISOString()).toBe("2025-12-12T12:00:00.000Z")
  })

  it("where-clause targets stale rows only", () => {
    const cutoff = new Date("2025-12-12T12:00:00Z")
    const where = pruneWhere(cutoff)
    expect(where.lastAccessedAt).toEqual({ lt: cutoff })
  })

  it("NEVER deletes manual overrides", () => {
    const where = pruneWhere(new Date())
    expect(where.provider).toEqual({ not: "manual" })
  })
})
