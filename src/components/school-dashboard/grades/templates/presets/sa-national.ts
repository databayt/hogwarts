// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { CertRegionPreset } from "./types"
import { registerCertPreset } from "./types"

const SA_NATIONAL: CertRegionPreset = {
  id: "sa-national",
  name: { en: "Saudi Arabia National", ar: "المملكة العربية السعودية" },
  description: {
    en: "Kingdom seal, NQA standards, ministry header",
    ar: "ختم المملكة، معايير هيئة التقويم، رأس وزاري",
  },
  baseStyle: "elegant",
  defaultLocale: "ar",
  countries: ["SA"],
  features: {
    ministryHeader: true,
    bilingualLayout: false,
    arabicCalligraphy: true,
    goldBorder: true,
    tripleSignatures: true,
    watermark: false,
    seal: true,
    qrVerification: true,
  },
}

registerCertPreset("sa-national", () => SA_NATIONAL)

export { SA_NATIONAL }
