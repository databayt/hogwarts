// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import {
  Geist_Mono as FontMono,
  Geist as FontSans,
  Rubik,
} from "next/font/google"
import localFont from "next/font/local"

import { cn } from "@/lib/utils"

// Both are only rendered by `fonts-preview.tsx`, but next/font emits a
// preload for every face declared at module scope — and the root layout
// imports fontRubik from THIS module, so every page in the app was preloading
// them. Geist is doubly wasted: `[lang]/layout.tsx` already ships the same
// typeface via `geist/font/sans`. Declared without preload, so they are
// fetched only if the preview actually renders.
export const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
  preload: false,
})

export const fontMono = FontMono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400"],
  preload: false,
})

export const fontRubik = Rubik({
  subsets: ["latin", "arabic"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-rubik",
  display: "swap",
})

// Thmanyah (خط ثمانية) — the Arabic UI face, self-hosted from
// public/fonts/thmanyah/ (fetched on build by scripts/fetch-thmanyah.mjs;
// license forbids redistribution so the woff2 files are git-ignored).
// Applied for Arabic only via the :root[dir="rtl"] tokens in globals.css.
// Uses the "serif text" family (Thmanyah's running-text serif), not the sans.
export const fontThmanyahText = localFont({
  src: [
    {
      path: "../../../public/fonts/thmanyah/thmanyah-serif-text-300.woff2",
      weight: "300",
    },
    {
      path: "../../../public/fonts/thmanyah/thmanyah-serif-text-400.woff2",
      weight: "400",
    },
    {
      path: "../../../public/fonts/thmanyah/thmanyah-serif-text-500.woff2",
      weight: "500",
    },
    {
      path: "../../../public/fonts/thmanyah/thmanyah-serif-text-700.woff2",
      weight: "700",
    },
    {
      path: "../../../public/fonts/thmanyah/thmanyah-serif-text-900.woff2",
      weight: "900",
    },
  ],
  variable: "--font-thmanyah-text",
  display: "swap",
  // Five Arabic weights are ~390KB, and this family is applied CONDITIONALLY:
  // only under :root[dir="rtl"]. next/font preloads every declared face just
  // because the module is imported by the root layout, so /en was downloading
  // all five at high priority and never drawing a glyph with them — and the
  // thmanyah homepage doesn't use them in either locale, since its shell
  // pins its own faces from /fonts/. Without the preload links the browser
  // fetches these only when a rendered element actually asks for the family,
  // which is exactly the conditional behaviour the CSS already describes.
  preload: false,
})

export const fontVariables = cn(
  fontSans.variable,
  fontMono.variable,
  fontRubik.variable
)
