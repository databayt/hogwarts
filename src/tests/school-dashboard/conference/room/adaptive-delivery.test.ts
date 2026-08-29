// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The delivery ladder's hysteresis. A single bad sample must not drop the
 * tier; a sustained bad patch steps down ONE rung; recovery is slower than
 * degradation; the bottom rung is audio-only and the top is high.
 */

import { describe, expect, it } from "vitest"

import {
  DEFAULT_ADAPTIVE_OPTIONS,
  initialAdaptiveState,
  nextAdaptiveState,
  stepDown,
  stepUp,
  type AdaptiveState,
  type QualitySample,
} from "@/components/school-dashboard/conference/room/adaptive-delivery"

function run(
  samples: Array<[QualitySample, number]>,
  start = initialAdaptiveState("high")
): AdaptiveState {
  return samples.reduce((s, [q, at]) => nextAdaptiveState(s, q, at), start)
}

describe("adaptive delivery ladder", () => {
  it("ignores a single poor sample", () => {
    const s = run([["poor", 0]])
    expect(s.tier).toBe("high")
    expect(s.poorStreak).toBe(1)
  })

  it("does not step down on two poor samples that are too close together", () => {
    const s = run([
      ["poor", 0],
      ["poor", 2_000],
    ])
    expect(s.tier).toBe("high")
  })

  it("steps down one rung after two poor samples spanning the window", () => {
    const s = run([
      ["poor", 0],
      ["poor", DEFAULT_ADAPTIVE_OPTIONS.stepDownAfterMs],
    ])
    expect(s.tier).toBe("medium")
    expect(s.poorStreak).toBe(0) // fresh evidence needed for the next rung
  })

  it("never cascades straight to audio from one bad patch", () => {
    const s = run([
      ["poor", 0],
      ["poor", 8_000],
      ["poor", 9_000],
      ["poor", 10_000],
    ])
    expect(s.tier).toBe("medium")
  })

  it("keeps stepping down with sustained poor quality, bottoming out at audio", () => {
    const s = run([
      ["poor", 0],
      ["poor", 8_000], // → medium
      ["poor", 9_000],
      ["poor", 16_000], // → low
      ["lost", 17_000],
      ["lost", 24_000], // → audio
      ["lost", 25_000],
      ["lost", 40_000], // stays audio
    ])
    expect(s.tier).toBe("audio")
  })

  it("steps back up only after a sustained good stretch", () => {
    const down = run([
      ["poor", 0],
      ["poor", 8_000],
    ])
    expect(down.tier).toBe("medium")
    const soon = run(
      [
        ["good", 9_000],
        ["excellent", 20_000],
      ],
      down
    )
    expect(soon.tier).toBe("medium")
    const later = run(
      [["good", 9_000 + DEFAULT_ADAPTIVE_OPTIONS.stepUpAfterMs]],
      soon
    )
    expect(later.tier).toBe("high")
  })

  it("a poor sample resets the good stretch", () => {
    const down = run([
      ["poor", 0],
      ["poor", 8_000],
    ])
    const s = run(
      [
        ["good", 9_000],
        ["poor", 20_000],
        ["good", 21_000],
        ["good", 35_000], // only 14s since the reset
      ],
      down
    )
    expect(s.tier).toBe("medium")
  })

  it("unknown samples change nothing", () => {
    const s = initialAdaptiveState("low")
    expect(nextAdaptiveState(s, "unknown", 5_000)).toBe(s)
  })

  it("clamps at both ends of the ladder", () => {
    expect(stepUp("high")).toBe("high")
    expect(stepDown("audio")).toBe("audio")
    expect(stepDown("high")).toBe("medium")
    expect(stepUp("audio")).toBe("low")
  })
})
