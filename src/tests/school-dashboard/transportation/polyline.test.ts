// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import { decodePolyline } from "@/components/school-dashboard/transportation/lib/polyline"

describe("decodePolyline", () => {
  it("decodes the canonical Google example", () => {
    // From the Encoded Polyline Algorithm Format spec.
    const coords = decodePolyline("_p~iF~ps|U_ulLnnqC_mqNvxq`@")
    expect(coords).toHaveLength(3)
    expect(coords[0][0]).toBeCloseTo(38.5, 4)
    expect(coords[0][1]).toBeCloseTo(-120.2, 4)
    expect(coords[1][0]).toBeCloseTo(40.7, 4)
    expect(coords[1][1]).toBeCloseTo(-120.95, 4)
    expect(coords[2][0]).toBeCloseTo(43.252, 3)
    expect(coords[2][1]).toBeCloseTo(-126.453, 3)
  })

  it("returns an empty array for an empty string", () => {
    expect(decodePolyline("")).toEqual([])
  })
})
