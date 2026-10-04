// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Blur placeholders for `BlurImage`. Plain module (no "use client"): a server
// component that renders a BlurImage must be able to compute its
// `blurDataURL` — calling a function exported from a client module throws.

/** Neutral 16×10 LQIP for images with no stored blur — reads fine in light + dark. */
export const NEUTRAL_BLUR =
  "data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoQAAwAA4BaJaQAA3AA/vEAgAA="

/**
 * A solid-colour LQIP from a hex the data already carries — the catalog stores a
 * colour per subject/lesson, so the blur can start in the right hue for free
 * instead of the neutral grey. Cheaper than a stored LQIP and better than none.
 */
export function blurFromColor(color: string | null | undefined) {
  if (!color) return undefined
  const hex = color.trim()
  if (!/^#[0-9a-fA-F]{3,8}$/.test(hex)) return undefined
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3Crect width='1' height='1' fill='%23${hex.slice(1)}'/%3E%3C/svg%3E`
}
