// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

export { ComposableCertificate } from "./composable"
export {
  CERT_VARIANT_REGISTRY,
  DEFAULT_CERT_COMPOSITION,
  resolveCertComposition,
} from "./composition"
export type {
  CertificateCompositionConfig,
  CertSlotName,
  CertVariantEntry,
} from "./composition"
export { getCertThemePreset, withCertLocale } from "./config"
export { getAllCertPresetIds, getCertRegionPreset } from "./presets"
export type { CertRegionPreset } from "./presets"
export type { CertificateForPaper, CertPaperTheme } from "./types"
