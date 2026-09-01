// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Google Fonts Integration
 *
 * Utilities for loading Google Fonts dynamically via CSS link injection.
 * Based on tweakcn's google-fonts.ts pattern.
 */

export const GOOGLE_FONTS_API_URL =
  "https://www.googleapis.com/webfonts/v1/webfonts"

/**
 * Build Google Fonts CSS API URL
 * @param family - Font family name (e.g., "Inter")
 * @param weights - Array of weights to load (e.g., ["400", "600", "700"])
 * @returns Google Fonts CSS URL
 */
export function buildFontCssUrl(
  family: string,
  weights: string[] = ["400"]
): string {
  const encodedFamily = encodeURIComponent(family)
  const weightsParam = weights.join(";") // Use semicolon for Google Fonts API v2
  return `https://fonts.googleapis.com/css2?family=${encodedFamily}:wght@${weightsParam}&display=swap`
}

/**
 * Families we already ship ourselves, via next/font (Geist, Geist Mono, Rubik)
 * or as local woff2 (Thmanyah). Asking Google for one of these buys nothing:
 * the glyphs are already self-hosted, same-origin and cached, so the round
 * trip only adds a third-party DNS + TLS handshake and a stylesheet that
 * re-declares the family under the same name — which is what made every page
 * of the app fetch `fonts.googleapis.com/css2?family=Geist` after hydration.
 *
 * Compared lowercased, so "Geist"/"geist" both match.
 */
const SELF_HOSTED_FONTS = [
  "geist",
  "geist mono",
  "geist sans",
  "rubik",
  "thmanyah",
  "thmanyah sans",
  "thmanyah serif text",
  "thmanyah serif display",
]

/**
 * Load a Google Font dynamically by injecting a <link> tag
 * @param family - Font family name (e.g., "Inter")
 * @param weights - Array of weights to load (default: ["400", "700"])
 */
export function loadGoogleFont(
  family: string,
  weights: string[] = ["400", "700"]
): void {
  if (typeof document === "undefined") return

  // Already self-hosted — nothing to fetch.
  if (SELF_HOSTED_FONTS.includes(family.trim().toLowerCase())) return

  // Check if already loaded
  const href = buildFontCssUrl(family, weights)
  const existing = document.querySelector(`link[href="${href}"]`)
  if (existing) return

  const link = document.createElement("link")
  link.rel = "stylesheet"
  link.href = href
  document.head.appendChild(link)
}
