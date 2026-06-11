// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  translateRoute,
  translateRoutes,
  translateStop,
  translateStops,
} from "@/components/school-dashboard/transportation/shared/translate-display"

// --- Mocks (hoisted by vitest) -------------------------------------------------
const { getLabels } = vi.hoisted(() => ({
  getLabels: vi.fn(),
}))

vi.mock("@/components/translation/person", () => ({ getLabels }))

const SCHOOL = "school-1"

function route(overrides: Record<string, unknown> = {}) {
  return {
    id: "route-1",
    name: "مسار الشمال",
    originName: "المدرسة",
    destinationName: "الحي الشمالي",
    notes: "ملاحظة",
    lang: "ar",
    schoolId: SCHOOL,
    monthlyFee: 100,
    ...overrides,
  }
}

function stop(overrides: Record<string, unknown> = {}) {
  return {
    id: "stop-1",
    name: "شارع بريفيت",
    address: "العنوان الأول",
    notes: null as string | null,
    lang: "ar",
    schoolId: SCHOOL,
    stopOrder: 1,
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  getLabels.mockResolvedValue(new Map())
})

describe("translateRoutes", () => {
  it("resolves N routes with ONE batched getLabels call over deduped values", async () => {
    getLabels.mockResolvedValue(
      new Map([
        ["مسار الشمال", "North Loop"],
        ["المدرسة", "School"],
        ["الحي الشمالي", "North District"],
        ["ملاحظة", "Note"],
        ["مسار الجنوب", "South Loop"],
      ])
    )
    const routes = [
      route(),
      // Shares originName/destinationName/notes with route 1 — values must dedupe.
      route({ id: "route-2", name: "مسار الجنوب" }),
    ]

    const out = await translateRoutes(routes, "en")

    // ONE batched resolution — not per-field-per-row.
    expect(getLabels).toHaveBeenCalledTimes(1)
    const [values, lang, schoolId] = getLabels.mock.calls[0]
    expect(lang).toBe("en")
    expect(schoolId).toBe(SCHOOL)
    // Deduped: 2 routes × 4 fields = 8 raw values, but only 5 unique.
    expect(values).toHaveLength(5)
    expect([...values].sort()).toEqual(
      ["المدرسة", "الحي الشمالي", "مسار الجنوب", "مسار الشمال", "ملاحظة"].sort()
    )

    expect(out[0]).toMatchObject({
      name: "North Loop",
      originName: "School",
      destinationName: "North District",
      notes: "Note",
    })
    expect(out[1]).toMatchObject({
      name: "South Loop",
      originName: "School",
      destinationName: "North District",
      notes: "Note",
    })
    // Non-translatable fields pass through untouched.
    expect(out[0].id).toBe("route-1")
    expect(out[0].monthlyFee).toBe(100)
  })

  it("falls back to the source text when getLabels rejects (never throws)", async () => {
    getLabels.mockRejectedValue(new Error("API down"))
    const routes = [route()]

    const out = await translateRoutes(routes, "en")

    expect(out[0]).toMatchObject({
      name: "مسار الشمال",
      originName: "المدرسة",
      destinationName: "الحي الشمالي",
      notes: "ملاحظة",
    })
  })

  it("falls back to the source text on a per-value map miss", async () => {
    // Only the route name resolved — everything else must keep its source.
    getLabels.mockResolvedValue(new Map([["مسار الشمال", "North Loop"]]))

    const out = await translateRoutes([route()], "en")

    expect(out[0].name).toBe("North Loop")
    expect(out[0].originName).toBe("المدرسة")
    expect(out[0].destinationName).toBe("الحي الشمالي")
    expect(out[0].notes).toBe("ملاحظة")
  })

  it("never mutates the input rows", async () => {
    getLabels.mockResolvedValue(new Map([["مسار الشمال", "North Loop"]]))
    const original = route()
    const routes = [original]

    const out = await translateRoutes(routes, "en")

    expect(out[0].name).toBe("North Loop")
    expect(original.name).toBe("مسار الشمال") // input untouched
    expect(out[0]).not.toBe(original) // translated row is a copy
  })

  it("handles null notes without translating them", async () => {
    getLabels.mockResolvedValue(new Map([["مسار الشمال", "North Loop"]]))
    const routes = [route({ notes: null })]

    const out = await translateRoutes(routes, "en")

    expect(out[0].notes).toBeNull()
    // null was never offered for translation
    const [values] = getLabels.mock.calls[0]
    expect(values).not.toContain(null)
  })

  it("returns the input array as-is for an empty list (zero work)", async () => {
    const out = await translateRoutes([], "en")

    expect(out).toEqual([])
    expect(getLabels).not.toHaveBeenCalled()
  })
})

describe("translateRoute (single)", () => {
  it("delegates to the same batched path and preserves the row shape", async () => {
    getLabels.mockResolvedValue(
      new Map([
        ["مسار الشمال", "North Loop"],
        ["المدرسة", "School"],
      ])
    )

    const out = await translateRoute(route(), "en")

    expect(getLabels).toHaveBeenCalledTimes(1)
    expect(out).toMatchObject({
      id: "route-1",
      name: "North Loop",
      originName: "School",
      destinationName: "الحي الشمالي", // miss → source fallback
      monthlyFee: 100,
    })
  })
})

describe("translateStops", () => {
  it("resolves N stops with ONE batched getLabels call and rebuilds per field", async () => {
    getLabels.mockResolvedValue(
      new Map([
        ["شارع بريفيت", "Privet Drive"],
        ["العنوان الأول", "First Address"],
        ["هوغسميد", "Hogsmeade"],
      ])
    )
    const stops = [
      stop(),
      stop({ id: "stop-2", name: "هوغسميد", address: null, stopOrder: 2 }),
    ]

    const out = await translateStops(stops, "en")

    expect(getLabels).toHaveBeenCalledTimes(1)
    const [values, lang, schoolId] = getLabels.mock.calls[0]
    expect(lang).toBe("en")
    expect(schoolId).toBe(SCHOOL)
    expect([...values].sort()).toEqual(
      ["العنوان الأول", "شارع بريفيت", "هوغسميد"].sort()
    )

    expect(out[0]).toMatchObject({
      name: "Privet Drive",
      address: "First Address",
      notes: null,
    })
    expect(out[1]).toMatchObject({
      name: "Hogsmeade",
      address: null,
      stopOrder: 2,
    })
  })

  it("keeps source values when nothing resolves", async () => {
    getLabels.mockResolvedValue(new Map())
    const stops = [stop()]

    const out = await translateStops(stops, "en")

    expect(out[0].name).toBe("شارع بريفيت")
    expect(out[0].address).toBe("العنوان الأول")
  })

  it("never mutates the input stops", async () => {
    getLabels.mockResolvedValue(new Map([["شارع بريفيت", "Privet Drive"]]))
    const original = stop()

    const out = await translateStops([original], "en")

    expect(out[0].name).toBe("Privet Drive")
    expect(original.name).toBe("شارع بريفيت")
  })
})

describe("translateStop (single)", () => {
  it("delegates to the batched path", async () => {
    getLabels.mockResolvedValue(new Map([["شارع بريفيت", "Privet Drive"]]))

    const out = await translateStop(stop(), "en")

    expect(getLabels).toHaveBeenCalledTimes(1)
    expect(out.name).toBe("Privet Drive")
    expect(out.address).toBe("العنوان الأول") // miss → source fallback
  })
})
