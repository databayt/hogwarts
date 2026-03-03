// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { CertRegionPreset } from "../presets/types"
import type { CertificateCompositionConfig } from "./types"

/** Convert region preset features to composition overrides */
export function certRegionPresetToComposition(
  preset: CertRegionPreset
): Partial<CertificateCompositionConfig> {
  const overrides: Partial<CertificateCompositionConfig> = {}
  const { features } = preset

  const slots: Partial<CertificateCompositionConfig["slots"]> = {}
  const decorations: Partial<CertificateCompositionConfig["decorations"]> = {}
  const slotProps: CertificateCompositionConfig["slotProps"] = {}

  if (features.ministryHeader) {
    slots.header = "ministry"
  }
  if (features.bilingualLayout) {
    slots.header = "bilingual"
  }
  if (features.arabicCalligraphy) {
    slots.title = "arabic-calligraphy"
  }
  if (features.goldBorder) {
    decorations.border = { enabled: true, style: "gold", width: 3 }
    decorations.cornerOrnaments = { enabled: true }
  }
  if (features.tripleSignatures) {
    slots.signatures = "triple"
  }
  if (features.watermark) {
    decorations.watermark = { enabled: true }
  }
  if (features.seal) {
    decorations.seal = { enabled: true, position: "bottom-right" }
  }
  if (features.qrVerification) {
    slots.footer = "verification"
  }

  if (Object.keys(slots).length)
    overrides.slots = slots as CertificateCompositionConfig["slots"]
  if (Object.keys(decorations).length)
    overrides.decorations =
      decorations as CertificateCompositionConfig["decorations"]
  if (Object.keys(slotProps).length) overrides.slotProps = slotProps

  return overrides
}
