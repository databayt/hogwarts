// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { getCertRegionPreset } from "../presets/types"
import { DEFAULT_CERT_COMPOSITION } from "./defaults"
import { certRegionPresetToComposition } from "./region-mapping"
import type { CertificateCompositionConfig } from "./types"

function mergeCertComposition(
  target: CertificateCompositionConfig,
  source: Partial<CertificateCompositionConfig>
): CertificateCompositionConfig {
  return {
    slots: { ...target.slots, ...(source.slots || {}) },
    decorations: {
      border: {
        ...target.decorations.border,
        ...(source.decorations?.border || {}),
      },
      cornerOrnaments: {
        ...target.decorations.cornerOrnaments,
        ...(source.decorations?.cornerOrnaments || {}),
      },
      seal: { ...target.decorations.seal, ...(source.decorations?.seal || {}) },
      watermark: {
        ...target.decorations.watermark,
        ...(source.decorations?.watermark || {}),
      },
      ribbon: {
        ...target.decorations.ribbon,
        ...(source.decorations?.ribbon || {}),
      },
    },
    slotProps: {
      ...target.slotProps,
      ...(source.slotProps || {}),
      header: {
        ...target.slotProps.header,
        ...(source.slotProps?.header || {}),
      },
      body: { ...target.slotProps.body, ...(source.slotProps?.body || {}) },
    },
  }
}

/** Resolve final certificate composition. Priority: blockConfig > regionPreset > defaults */
export function resolveCertComposition(
  blockConfig?: unknown,
  regionPresetId?: string | null
): CertificateCompositionConfig {
  let result = { ...DEFAULT_CERT_COMPOSITION }

  if (regionPresetId) {
    const preset = getCertRegionPreset(regionPresetId)
    if (preset) {
      const regionOverrides = certRegionPresetToComposition(preset)
      result = mergeCertComposition(result, regionOverrides)
    }
  }

  if (blockConfig && typeof blockConfig === "object") {
    result = mergeCertComposition(
      result,
      blockConfig as Partial<CertificateCompositionConfig>
    )
  }

  return result
}
