// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Shared font registration for @react-pdf templates.
 * Call ensureFontsRegistered() before rendering any Document.
 */

import { Font } from "@react-pdf/renderer"

let registered = false

export function ensureFontsRegistered() {
  if (registered) return
  registered = true

  Font.register({
    family: "Rubik",
    fonts: [
      {
        src: "https://fonts.gstatic.com/s/rubik/v28/iJWZBXyIfDnIV5PNhY1KTN7Z-Yh-B4i1UE80V4bVkA.ttf",
        fontWeight: "normal",
      },
      {
        src: "https://fonts.gstatic.com/s/rubik/v28/iJWZBXyIfDnIV5PNhY1KTN7Z-Yh-B4iFUk80V4bVkA.ttf",
        fontWeight: 500,
      },
      {
        src: "https://fonts.gstatic.com/s/rubik/v28/iJWZBXyIfDnIV5PNhY1KTN7Z-Yh-B4hAVU80V4bVkA.ttf",
        fontWeight: "bold",
      },
    ],
  })

  Font.register({
    family: "Inter",
    fonts: [
      {
        src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff2",
        fontWeight: "normal",
      },
      {
        src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hjp-Ek-_EeA.woff2",
        fontWeight: 500,
      },
      {
        src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hjp-Ek-_EeA.woff2",
        fontWeight: "bold",
      },
    ],
  })

  Font.registerHyphenationCallback((word) => [word])
}
