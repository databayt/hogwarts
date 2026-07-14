// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import {
  Geist_Mono as FontMono,
  Geist as FontSans,
  Rubik,
} from "next/font/google"
import localFont from "next/font/local"

import { cn } from "@/lib/utils"

export const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const fontMono = FontMono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400"],
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
export const fontThmanyahSans = localFont({
  src: [
    {
      path: "../../../public/fonts/thmanyah/thmanyah-sans-300.woff2",
      weight: "300",
    },
    {
      path: "../../../public/fonts/thmanyah/thmanyah-sans-400.woff2",
      weight: "400",
    },
    {
      path: "../../../public/fonts/thmanyah/thmanyah-sans-500.woff2",
      weight: "500",
    },
    {
      path: "../../../public/fonts/thmanyah/thmanyah-sans-700.woff2",
      weight: "700",
    },
    {
      path: "../../../public/fonts/thmanyah/thmanyah-sans-900.woff2",
      weight: "900",
    },
  ],
  variable: "--font-thmanyah-sans",
  display: "swap",
})

export const fontVariables = cn(
  fontSans.variable,
  fontMono.variable,
  fontRubik.variable
)
