// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Normalize a string for case- and diacritic-insensitive matching.
 *
 * Used by both the client-side `filterByQuery` and (mirrored) the server-side
 * spotlight search so a single search query produces the same result set on
 * either side of the wire.
 *
 * Rules applied (in order):
 *  1. NFD decomposition then strip Unicode combining marks (handles Latin
 *     diacritics like é→e, ü→u, ñ→n, and Arabic harakat — fatha/damma/kasra).
 *  2. Arabic alef variants ا أ إ آ → ا (so أحمد and احمد match).
 *  3. Arabic ya ى → ي (so على and علي match).
 *  4. Arabic ta-marbuta ة → ه (so فاطمة and فاطمه match).
 *  5. Strip Arabic tatweel ـ (so مح‍مد and محمد match).
 *  6. Lowercase + collapse whitespace.
 */
export function normalizeForMatch(input: string): string {
  if (!input) return ""
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // Latin combining marks
    .replace(/[ً-ٰٟ]/g, "") // Arabic harakat (tashkeel)
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ـ/g, "") // tatweel
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
}
