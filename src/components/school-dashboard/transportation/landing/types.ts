// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

export type TransportationDictionary = Dictionary["transportation"]

/**
 * Shared shape for every landing section.
 *
 * `dictionary` is the transportation namespace only — sections read
 * `dictionary.landing.*` and fall back to English literals, the same
 * contract lumos/home uses.
 */
export interface LandingSectionProps {
  dictionary: TransportationDictionary
  lang: Locale
}

/** Headcounts shown in the hero strip. Ops roles only — see content.tsx. */
export interface LandingStats {
  totalVehicles: number
  totalRoutes: number
  totalDrivers: number
  activeAssignments: number
}
