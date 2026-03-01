// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Saudi National Exam Format
 * FORMAL template + watermark + ministry header + bubble sheet
 * Arabic-first, RTL layout
 */

import type { RegionPreset } from "./types"
import { registerPreset } from "./types"

export const SA_NATIONAL: RegionPreset = {
  id: "sa-national",
  name: {
    en: "Saudi National Exam",
    ar: "الامتحان الوطني السعودي",
  },
  description: {
    en: "Official Saudi national exam format with ministry header and OMR support",
    ar: "تنسيق الامتحان الوطني السعودي الرسمي مع رأس الوزارة ودعم التصحيح الآلي",
  },
  baseTemplate: "FORMAL",
  themeOverrides: {
    locale: "ar",
    isRTL: true,
    fontFamily: "Rubik",
    borderStyle: "double",
    numberStyle: "plain",
  },
  features: {
    watermark: true,
    ministryHeader: true,
    disclaimer: true,
    bubbleSheet: true,
    seatNumber: true,
  },
  defaultLocale: "ar",
  countries: ["SA", "Saudi Arabia"],
}

registerPreset("sa-national", () => SA_NATIONAL)
