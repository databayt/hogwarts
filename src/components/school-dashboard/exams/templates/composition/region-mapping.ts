// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Region Mapping — converts RegionPreset feature flags into composition overrides
 */

import type { RegionPreset } from "../presets/types"
import type { CompositionConfig } from "./types"

/** Convert region preset features into partial composition overrides */
export function regionPresetToComposition(
  preset: RegionPreset
): Partial<CompositionConfig> {
  const slots: Partial<CompositionConfig["slots"]> = {}
  const decorations: Partial<CompositionConfig["decorations"]> = {}
  const slotProps: CompositionConfig["slotProps"] = {}

  if (preset.features.ministryHeader) {
    slots.header = "ministry"
  }

  if (preset.features.disclaimer) {
    slots.footer = "disclaimer"
  }

  if (preset.features.bubbleSheet) {
    slots.studentInfo = "bubble-id"
    slots.answerSheet = "omr"
  }

  if (preset.features.watermark) {
    decorations.watermark = { enabled: true }
  }

  if (preset.features.seatNumber) {
    slotProps.studentInfo = { showSeatNumber: true }
  }

  return {
    ...(Object.keys(slots).length > 0 && {
      slots: slots as CompositionConfig["slots"],
    }),
    ...(Object.keys(decorations).length > 0 && {
      decorations: decorations as CompositionConfig["decorations"],
    }),
    ...(Object.keys(slotProps).length > 0 && { slotProps }),
  }
}
