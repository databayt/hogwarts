// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

export { DEFAULT_CERT_COMPOSITION } from "./defaults"
export { CERT_VARIANT_REGISTRY } from "./registry"
export { certRegionPresetToComposition } from "./region-mapping"
export { resolveCertComposition } from "./resolve"
export type {
  CertBodyVariant,
  CertFooterVariant,
  CertHeaderVariant,
  CertificateCompositionConfig,
  CertRecipientVariant,
  CertScoresVariant,
  CertSignaturesVariant,
  CertSlotName,
  CertTitleVariant,
  CertVariantEntry,
} from "./types"
