// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { CertRegionPreset } from "./types"
import { registerCertPreset } from "./types"

const US_STANDARD: CertRegionPreset = {
  id: "us-standard",
  name: { en: "US Standard", ar: "المعيار الأمريكي" },
  description: {
    en: "School crest, modern design, QR verification",
    ar: "شعار المدرسة، تصميم عصري، تحقق بـ QR",
  },
  baseStyle: "modern",
  defaultLocale: "en",
  countries: ["US"],
  features: {
    ministryHeader: false,
    bilingualLayout: false,
    arabicCalligraphy: false,
    goldBorder: false,
    tripleSignatures: false,
    watermark: false,
    seal: false,
    qrVerification: true,
  },
}

registerCertPreset("us-standard", () => US_STANDARD)

export { US_STANDARD }
