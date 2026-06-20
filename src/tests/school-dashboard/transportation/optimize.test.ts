// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Pure-logic tests for the route optimizer's Haversine fallback tier and the
// bell-time ETA arithmetic. No network — the Mapbox tiers only run when a token
// is present and are exercised via the (deterministic) fallback here.

import { describe, expect, it } from "vitest"

import {
  computeStopEtas,
  hhmmToMinutes,
  minutesToHHmm,
} from "@/components/school-dashboard/transportation/lib/eta"
import { haversineOptimize } from "@/components/school-dashboard/transportation/lib/optimize"

const SCHOOL = { lat: 0, lng: 0 }
// Collinear stops heading east, increasing distance from school.
const STOPS = [
  { id: "s1", lat: 0, lng: 0.01 },
  { id: "s2", lat: 0, lng: 0.02 },
  { id: "s3", lat: 0, lng: 0.03 },
]

describe("eta helpers", () => {
  it("round-trips HH:mm ↔ minutes", () => {
    expect(hhmmToMinutes("07:30")).toBe(450)
    expect(hhmmToMinutes("00:00")).toBe(0)
    expect(hhmmToMinutes("14:05")).toBe(845)
    expect(minutesToHHmm(450)).toBe("07:30")
    expect(minutesToHHmm(845)).toBe("14:05")
    expect(minutesToHHmm(5)).toBe("00:05")
  })

  it("wraps and zero-pads out-of-range minutes", () => {
    expect(minutesToHHmm(1440)).toBe("00:00")
    expect(minutesToHHmm(-30)).toBe("23:30")
  })

  it("DROPOFF assigns ETAs forward from departure (close + buffer)", () => {
    const etas = computeStopEtas({
      direction: "DROPOFF",
      bellTime: "14:00",
      bufferMinutes: 10,
      stops: [
        {
          stopId: "a",
          cumulativeSecondsFromSchool: 120,
          distanceFromPrevKm: 1,
        },
        {
          stopId: "b",
          cumulativeSecondsFromSchool: 300,
          distanceFromPrevKm: 2,
        },
      ],
    })
    // depart = 14:10 → +2min, +5min
    expect(etas[0].eta).toBe("14:12")
    expect(etas[1].eta).toBe("14:15")
  })

  it("PICKUP assigns ETAs backward from arrival (open - buffer)", () => {
    const etas = computeStopEtas({
      direction: "PICKUP",
      bellTime: "07:30",
      bufferMinutes: 10,
      stops: [
        {
          stopId: "far",
          cumulativeSecondsFromSchool: 300,
          distanceFromPrevKm: 0,
        },
        {
          stopId: "near",
          cumulativeSecondsFromSchool: 120,
          distanceFromPrevKm: 1,
        },
      ],
    })
    // arrive school = 07:20 → −5min (far, picked first), −2min (near, picked last)
    expect(etas[0].eta).toBe("07:15")
    expect(etas[1].eta).toBe("07:18")
  })
})

describe("haversineOptimize", () => {
  it("DROPOFF visits nearest-to-school first, cumulative time increasing", () => {
    const r = haversineOptimize(STOPS, SCHOOL, "DROPOFF")
    expect(r.source).toBe("haversine")
    expect(r.orderedStops.map((s) => s.stopId)).toEqual(["s1", "s2", "s3"])
    const cum = r.orderedStops.map((s) => s.cumulativeSecondsFromSchool)
    expect(cum[0]).toBeLessThan(cum[1])
    expect(cum[1]).toBeLessThan(cum[2])
    expect(r.totalDistanceKm).toBeGreaterThan(0)
  })

  it("PICKUP visits farthest first, cumulative time to school decreasing", () => {
    const r = haversineOptimize(STOPS, SCHOOL, "PICKUP")
    expect(r.orderedStops.map((s) => s.stopId)).toEqual(["s3", "s2", "s1"])
    const cum = r.orderedStops.map((s) => s.cumulativeSecondsFromSchool)
    // s3 is picked first and is farthest → largest remaining time to school.
    expect(cum[0]).toBeGreaterThan(cum[1])
    expect(cum[1]).toBeGreaterThan(cum[2])
  })

  it("covers every stop exactly once", () => {
    const r = haversineOptimize(STOPS, SCHOOL, "DROPOFF")
    expect(new Set(r.orderedStops.map((s) => s.stopId))).toEqual(
      new Set(["s1", "s2", "s3"])
    )
  })

  it("end-to-end: optimized order + ETAs are consistent for a PICKUP run", () => {
    const r = haversineOptimize(STOPS, SCHOOL, "PICKUP")
    const etas = computeStopEtas({
      direction: "PICKUP",
      bellTime: "08:00",
      bufferMinutes: 0,
      stops: r.orderedStops,
    })
    // First pickup (farthest) is earliest; last pickup (nearest) is latest.
    expect(hhmmToMinutes(etas[0].eta)).toBeLessThan(hhmmToMinutes(etas[2].eta))
    // Nobody is picked up after the school arrival time.
    for (const e of etas) {
      expect(hhmmToMinutes(e.eta)).toBeLessThanOrEqual(hhmmToMinutes("08:00"))
    }
  })
})
