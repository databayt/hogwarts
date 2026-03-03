// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { CertRegionPreset } from "./types"
import { registerCertPreset } from "./types"

const MENA_PRIVATE: CertRegionPreset = {
  id: "mena-private",
  name: { en: "MENA Private", ar: "خاص - الشرق الأوسط" },
  description: {
    en: "Bilingual, gold accents, modern design",
    ar: "ثنائي اللغة، لمسات ذهبية، تصميم عصري",
  },
  baseStyle: "modern",
  defaultLocale: "en",
  countries: ["AE", "QA", "KW", "BH", "OM", "JO", "LB", "EG"],
  features: {
    ministryHeader: false,
    bilingualLayout: true,
    arabicCalligraphy: false,
    goldBorder: true,
    tripleSignatures: false,
    watermark: true,
    seal: false,
    qrVerification: true,
  },
}

registerCertPreset("mena-private", () => MENA_PRIVATE)

export { MENA_PRIVATE }
