// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * lr-08: `QualityDot` was dead code — the current chrome tints `SignalHigh`
 * inside `QualityMenuButton` (`QUALITY_TONE`) instead of drawing a
 * word-plus-dot indicator. Regression guard: it must not come back as an
 * unused export.
 */
import { describe, expect, it } from "vitest"

import * as overlays from "@/components/school-dashboard/live/room/overlays"

describe("overlays module (lr-08)", () => {
  it("no longer exports the dead QualityDot component", () => {
    const mod = overlays as unknown as Record<string, unknown>
    expect(mod.QualityDot).toBeUndefined()
  })

  it("still exports the QUALITY_TONE map that replaced it", () => {
    expect(overlays.QUALITY_TONE.excellent).toBe("text-emerald-400")
    expect(overlays.QUALITY_TONE.lost).toBe("text-red-500")
  })

  it("still exports the two real overlays", () => {
    expect(typeof overlays.ReconnectingOverlay).toBe("function")
    expect(typeof overlays.AudioOnlyBanner).toBe("function")
  })
})
