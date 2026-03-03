// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

export interface CertRegionPreset {
  id: string
  name: { en: string; ar: string }
  description: { en: string; ar: string }
  baseStyle: "elegant" | "modern" | "classic"
  defaultLocale: "ar" | "en"
  countries: string[]
  features: {
    ministryHeader: boolean
    bilingualLayout: boolean
    arabicCalligraphy: boolean
    goldBorder: boolean
    tripleSignatures: boolean
    watermark: boolean
    seal: boolean
    qrVerification: boolean
  }
}

const CERT_PRESET_REGISTRY: Record<string, () => CertRegionPreset> = {}

export function registerCertPreset(
  id: string,
  factory: () => CertRegionPreset
) {
  CERT_PRESET_REGISTRY[id] = factory
}

export function getCertRegionPreset(id: string): CertRegionPreset | undefined {
  const factory = CERT_PRESET_REGISTRY[id]
  return factory?.()
}

export function getAllCertPresetIds(): string[] {
  return Object.keys(CERT_PRESET_REGISTRY)
}
