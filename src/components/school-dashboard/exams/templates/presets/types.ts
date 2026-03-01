// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { PaperTheme } from "../types"

/** Regional exam format preset */
export interface RegionPreset {
  id: string
  name: { en: string; ar: string }
  description: { en: string; ar: string }
  baseTemplate: "CLASSIC" | "MODERN" | "FORMAL" | "CUSTOM"
  themeOverrides: Partial<PaperTheme>
  features: {
    watermark: boolean
    ministryHeader: boolean
    disclaimer: boolean
    bubbleSheet: boolean
    seatNumber: boolean
  }
  defaultLocale: "en" | "ar"
  countries: string[]
}

const PRESET_REGISTRY: Record<string, () => RegionPreset> = {}

export function registerPreset(id: string, factory: () => RegionPreset) {
  PRESET_REGISTRY[id] = factory
}

export function getRegionPreset(id: string): RegionPreset | undefined {
  return PRESET_REGISTRY[id]?.()
}

/**
 * Auto-detect the best region preset based on school metadata.
 * Falls back to undefined if no match.
 */
export function detectRegionPreset(school: {
  country?: string | null
  curriculum?: string | null
  schoolType?: string | null
}): string | undefined {
  const country = school.country?.toLowerCase()
  const curriculum = school.curriculum?.toLowerCase()

  if (country === "sd" || country === "sudan") return "sd-national"
  if (country === "sa" || country === "saudi arabia") return "sa-national"
  if (country === "us" || country === "united states") return "us-standard"

  // MENA private/international schools
  if (
    curriculum === "international" ||
    curriculum === "ib" ||
    curriculum === "igcse"
  )
    return "mena-private"

  return undefined
}
