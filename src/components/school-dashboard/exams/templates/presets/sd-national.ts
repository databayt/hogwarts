// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Sudan National Exam Format
 * FORMAL template + watermark + ministry header + disclaimer
 * Arabic-first, RTL layout
 */

import type { RegionPreset } from "./types"
import { registerPreset } from "./types"

export const SD_NATIONAL: RegionPreset = {
  id: "sd-national",
  name: {
    en: "Sudan National Exam",
    ar: "الامتحان الوطني السوداني",
  },
  description: {
    en: "Official Sudan national exam format with ministry header and formal styling",
    ar: "تنسيق الامتحان الوطني السوداني الرسمي مع رأس الوزارة والتنسيق الرسمي",
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
    bubbleSheet: false,
    seatNumber: true,
  },
  defaultLocale: "ar",
  countries: ["SD", "Sudan"],
}

registerPreset("sd-national", () => SD_NATIONAL)
