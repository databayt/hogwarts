// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { CertRegionPreset } from "./types"
import { registerCertPreset } from "./types"

const SD_NATIONAL: CertRegionPreset = {
  id: "sd-national",
  name: { en: "Sudan National", ar: "السودان الوطني" },
  description: {
    en: "Ministry header, Arabic calligraphy, gold border, triple signatures",
    ar: "رأس وزاري، خط عربي، حدود ذهبية، ثلاث توقيعات",
  },
  baseStyle: "elegant",
  defaultLocale: "ar",
  countries: ["SD"],
  features: {
    ministryHeader: true,
    bilingualLayout: false,
    arabicCalligraphy: true,
    goldBorder: true,
    tripleSignatures: true,
    watermark: true,
    seal: true,
    qrVerification: true,
  },
}

registerCertPreset("sd-national", () => SD_NATIONAL)

export { SD_NATIONAL }
