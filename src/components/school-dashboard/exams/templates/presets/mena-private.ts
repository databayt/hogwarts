// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * MENA Private/International School Format
 * CUSTOM template (brand-aware) + English-first with Arabic support
 */

import type { RegionPreset } from "./types"
import { registerPreset } from "./types"

export const MENA_PRIVATE: RegionPreset = {
  id: "mena-private",
  name: {
    en: "MENA Private/International",
    ar: "مدارس خاصة/دولية (الشرق الأوسط)",
  },
  description: {
    en: "International curriculum schools in MENA region with school branding",
    ar: "مدارس المنهج الدولي في منطقة الشرق الأوسط مع العلامة التجارية للمدرسة",
  },
  baseTemplate: "CUSTOM",
  themeOverrides: {
    locale: "en",
    isRTL: false,
    fontFamily: "Inter",
    borderStyle: "solid",
    numberStyle: "square",
  },
  features: {
    watermark: false,
    ministryHeader: false,
    disclaimer: false,
    bubbleSheet: true,
    seatNumber: false,
  },
  defaultLocale: "en",
  countries: [
    "AE",
    "BH",
    "EG",
    "JO",
    "KW",
    "LB",
    "OM",
    "QA",
    "UAE",
    "Egypt",
    "Jordan",
    "Kuwait",
    "Oman",
    "Qatar",
    "Bahrain",
    "Lebanon",
  ],
}

registerPreset("mena-private", () => MENA_PRIVATE)
