// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { getLabels, getName, getNames } from "@/components/translation/person"
import { fullName } from "@/components/translation/util"

const { translate } = vi.hoisted(() => ({ translate: vi.fn() }))

// person.ts delegates the cached translate; transliterate stays REAL so the
// offline-fallback path is exercised end-to-end.
vi.mock("@/components/translation/actions", () => ({ translate }))

beforeEach(() => {
  vi.clearAllMocks()
})

describe("getName", () => {
  it("returns the raw name when it is already in the display script", async () => {
    const name = await getName(
      { firstName: "John", lastName: "Smith" },
      "en",
      "s1"
    )
    expect(name).toBe("John Smith")
    expect(translate).not.toHaveBeenCalled()
  })

  it("translates a cross-script name through the cached translate path", async () => {
    translate.mockResolvedValue("Mohammed Ali")
    const name = await getName(
      { firstName: "محمد", lastName: "علي" },
      "en",
      "s1"
    )
    expect(name).toBe("Mohammed Ali")
    expect(translate).toHaveBeenCalledWith("محمد علي", "ar", "en", "s1")
  })

  it("falls back to OFFLINE transliteration when the API is down (never raw Arabic on /en)", async () => {
    translate.mockRejectedValue(new Error("API down"))
    const name = await getName(
      { firstName: "محمد", lastName: "علي" },
      "en",
      "s1"
    )
    expect(name).not.toBe("محمد علي") // not raw source
    expect(name).toMatch(/^[\x20-\x7E]+$/) // pure Latin output
  })

  it("returns raw source for en→ar API failure (no reverse transliteration)", async () => {
    translate.mockRejectedValue(new Error("API down"))
    const name = await getName(
      { firstName: "John", lastName: "Smith" },
      "ar",
      "s1"
    )
    expect(name).toBe("John Smith")
  })

  it("returns empty string for empty name parts", async () => {
    expect(await getName({}, "en", "s1")).toBe("")
  })
})

describe("getNames (batched, deduped)", () => {
  it("translates each UNIQUE name once and returns a Map keyed by the raw composed name", async () => {
    translate.mockResolvedValue("Mohammed Ali")
    const rows = [
      { id: 1, teacher: { firstName: "محمد", lastName: "علي" } },
      { id: 2, teacher: { firstName: "محمد", lastName: "علي" } }, // duplicate
      { id: 3, teacher: { firstName: "John", lastName: "Smith" } }, // same-lang
    ]
    const names = await getNames(rows, (r) => r.teacher, "en", "s1")
    expect(translate).toHaveBeenCalledTimes(1) // deduped + same-lang omitted
    expect(names.get("محمد علي")).toBe("Mohammed Ali")
    // Same-script names are omitted — callers fall back to the raw value.
    expect(names.get("John Smith")).toBeUndefined()
    // The documented read-back pattern:
    const display =
      names.get(fullName(rows[0].teacher)) ?? fullName(rows[0].teacher)
    expect(display).toBe("Mohammed Ali")
  })
})

describe("getLabels (arbitrary value lists)", () => {
  it("dedupes, skips empties and same-lang values, returns Map<source, translated>", async () => {
    translate.mockResolvedValue("Mathematics")
    const labels = await getLabels(
      ["الرياضيات", "الرياضيات", "Physics", null, ""],
      "en",
      "s1"
    )
    expect(translate).toHaveBeenCalledTimes(1)
    expect(labels.get("الرياضيات")).toBe("Mathematics")
    expect(labels.get("Physics")).toBeUndefined() // already display-lang
  })
})
