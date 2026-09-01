// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The delivery ladder a student's connection climbs down and back up.
 *
 * Pure state machine — the hook feeds it `ConnectionQualityChanged` samples
 * and applies the resulting tier to the teacher's camera publication. Kept
 * free of LiveKit types so the hysteresis can be unit-tested with a clock.
 *
 * Tiers map to the teacher's simulcast layers (720 / 360 / 180) and, at the
 * bottom, to unsubscribing from camera video altogether while audio and the
 * screen share (the slides) stay — "audio + slides" mode. The literal
 * 1080→…→240 ladder in the spec is not what simulcast gives us: three
 * layers per publication is the protocol's ceiling, so three video tiers
 * plus audio-only is the honest shape.
 */

export const DELIVERY_TIERS = ["high", "medium", "low", "audio"] as const
export type DeliveryTier = (typeof DELIVERY_TIERS)[number]

export type QualitySample = "excellent" | "good" | "poor" | "lost" | "unknown"

export interface AdaptiveState {
  tier: DeliveryTier
  /** Consecutive poor/lost samples. */
  poorStreak: number
  /** When the current poor streak began. */
  poorSince: number | null
  /** When the connection last turned good and stayed good. */
  goodSince: number | null
  lastChangeAt: number | null
}

export interface AdaptiveOptions {
  /** Poor samples needed before a step down is even considered. */
  stepDownAfterSamples: number
  /** …and the streak must have lasted this long. Both — a single blip is not a bad connection. */
  stepDownAfterMs: number
  /** Good for this long before stepping back up one tier. */
  stepUpAfterMs: number
}

export const DEFAULT_ADAPTIVE_OPTIONS: AdaptiveOptions = {
  stepDownAfterSamples: 2,
  stepDownAfterMs: 8_000,
  stepUpAfterMs: 20_000,
}

export function initialAdaptiveState(
  tier: DeliveryTier = "high"
): AdaptiveState {
  return {
    tier,
    poorStreak: 0,
    poorSince: null,
    goodSince: null,
    lastChangeAt: null,
  }
}

export function stepDown(tier: DeliveryTier): DeliveryTier {
  const i = DELIVERY_TIERS.indexOf(tier)
  return DELIVERY_TIERS[Math.min(DELIVERY_TIERS.length - 1, i + 1)]
}

export function stepUp(tier: DeliveryTier): DeliveryTier {
  const i = DELIVERY_TIERS.indexOf(tier)
  return DELIVERY_TIERS[Math.max(0, i - 1)]
}

/**
 * Feed one sample. Returns the next state; `tier` changes only when the
 * hysteresis says so. Callers compare `tier` before/after to know when to
 * touch the subscription.
 */
export function nextAdaptiveState(
  state: AdaptiveState,
  quality: QualitySample,
  at: number,
  opts: AdaptiveOptions = DEFAULT_ADAPTIVE_OPTIONS
): AdaptiveState {
  if (quality === "unknown") return state

  if (quality === "poor" || quality === "lost") {
    const poorSince = state.poorSince ?? at
    const poorStreak = state.poorStreak + 1
    const longEnough = at - poorSince >= opts.stepDownAfterMs
    if (
      poorStreak >= opts.stepDownAfterSamples &&
      longEnough &&
      state.tier !== "audio"
    ) {
      // Step down and start a fresh streak: the next step needs its own
      // evidence, so one bad patch cannot cascade straight to audio.
      return {
        tier: stepDown(state.tier),
        poorStreak: 0,
        poorSince: at,
        goodSince: null,
        lastChangeAt: at,
      }
    }
    return { ...state, poorStreak, poorSince, goodSince: null }
  }

  // good / excellent
  const goodSince = state.goodSince ?? at
  if (at - goodSince >= opts.stepUpAfterMs && state.tier !== "high") {
    return {
      tier: stepUp(state.tier),
      poorStreak: 0,
      poorSince: null,
      goodSince: at,
      lastChangeAt: at,
    }
  }
  return { ...state, poorStreak: 0, poorSince: null, goodSince }
}
