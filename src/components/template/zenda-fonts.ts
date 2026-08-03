// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { DM_Sans, Poppins } from "next/font/google"

/**
 * The two Google faces the zenda clone needs.
 *
 * `src/styles/zenda-clone.css` asks for them by literal family name, which only
 * resolves if a matching `@font-face` exists. The generated sheet used to carry
 * an `@import url(fonts.googleapis.com/...DM+Sans...)` for exactly this, but
 * Next concatenates that file after globals.css and an `@import` anywhere other
 * than the top of a stylesheet is invalid and gets dropped -- so it never once
 * worked, and the whole clone silently rendered in system Helvetica. Measurable:
 * "Terms and Conditions" set in `"DM Sans"` came out the same width as in bare
 * `sans-serif`, and the footer link columns were 372px against zenda's 396px.
 *
 * `next/font/google` registers the real family plus a metric-matched
 * "<Name> Fallback", which is how zenda itself gets them. Weights and subset
 * mirror zenda's `app/[lang]/layout.tsx` exactly -- change them and the metrics
 * change and the clone stops matching.
 *
 * Deliberately NOT in `@/components/atom/fonts`: the root layout imports that
 * module, so declaring these there would ship both families on every page in
 * the app. Only the school-marketing layout imports this one.
 */
export const fontDmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
})

export const fontPoppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
})
