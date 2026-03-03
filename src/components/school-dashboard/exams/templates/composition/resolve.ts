// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Composition Resolver — merges blockConfig + region preset + defaults
 * Priority: blockConfig (user) > regionPreset (auto) > DEFAULT_COMPOSITION
 */

import { getRegionPreset } from "../presets/types"
import { DEFAULT_COMPOSITION } from "./defaults"
import { regionPresetToComposition } from "./region-mapping"
import type { CompositionConfig } from "./types"

/** Deep merge two composition configs (source wins over target) */
function mergeComposition(
  target: CompositionConfig,
  source: Partial<CompositionConfig>
): CompositionConfig {
  return {
    slots: {
      ...target.slots,
      ...(source.slots || {}),
    },
    decorations: {
      accentBar: {
        ...target.decorations.accentBar,
        ...(source.decorations?.accentBar || {}),
      },
      watermark: {
        ...target.decorations.watermark,
        ...(source.decorations?.watermark || {}),
      },
      frame: {
        ...target.decorations.frame,
        ...(source.decorations?.frame || {}),
      },
    },
    slotProps: {
      ...target.slotProps,
      ...(source.slotProps || {}),
      header: {
        ...target.slotProps.header,
        ...(source.slotProps?.header || {}),
      },
      footer: {
        ...target.slotProps.footer,
        ...(source.slotProps?.footer || {}),
      },
      studentInfo: {
        ...target.slotProps.studentInfo,
        ...(source.slotProps?.studentInfo || {}),
      },
      instructions: {
        ...target.slotProps.instructions,
        ...(source.slotProps?.instructions || {}),
      },
    },
  }
}

/**
 * Resolve the final composition config.
 * Priority: blockConfig (explicit user) > region preset > DEFAULT_COMPOSITION
 */
export function resolveComposition(
  blockConfig?: unknown,
  regionPresetId?: string | null
): CompositionConfig {
  let result = { ...DEFAULT_COMPOSITION }

  // Layer 1: region preset overrides
  if (regionPresetId) {
    const preset = getRegionPreset(regionPresetId)
    if (preset) {
      const regionOverrides = regionPresetToComposition(preset)
      result = mergeComposition(result, regionOverrides)
    }
  }

  // Layer 2: explicit blockConfig (user choices from Compose tab)
  if (blockConfig && typeof blockConfig === "object") {
    result = mergeComposition(result, blockConfig as Partial<CompositionConfig>)
  }

  return result
}
