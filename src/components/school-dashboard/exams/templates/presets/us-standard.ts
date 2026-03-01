// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * US K-12 Standard Exam Format
 * MODERN template + bubble sheet + English-first
 */

import type { RegionPreset } from "./types"
import { registerPreset } from "./types"

export const US_STANDARD: RegionPreset = {
  id: "us-standard",
  name: {
    en: "US K-12 Standard",
    ar: "المعيار الأمريكي K-12",
  },
  description: {
    en: "Standard US K-12 exam format with clean layout and bubble sheet support",
    ar: "تنسيق الامتحان الأمريكي القياسي K-12 مع تخطيط نظيف ودعم ورقة الفقاعات",
  },
  baseTemplate: "MODERN",
  themeOverrides: {
    locale: "en",
    isRTL: false,
    fontFamily: "Inter",
    borderStyle: "dashed",
    numberStyle: "circle",
  },
  features: {
    watermark: false,
    ministryHeader: false,
    disclaimer: false,
    bubbleSheet: true,
    seatNumber: false,
  },
  defaultLocale: "en",
  countries: ["US", "United States"],
}

registerPreset("us-standard", () => US_STANDARD)
