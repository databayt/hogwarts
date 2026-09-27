// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Subject slugs from before the catalog repository (github.com/databayt/catalog)
 * → the catalog id each one became. The catalog tree seed renamed these rows
 * in place (same ids, same school selections); `proxy.ts` 308s any URL that
 * still carries an old slug, so bookmarks and shared links keep working.
 *
 * Generated from the catalog's `scripts/migrate/renames.json` (SD only — the
 * curricula this app has adopted). Append when another curriculum is adopted.
 */
export const LEGACY_SUBJECT_SLUGS: Readonly<Record<string, string>> = {
  "sd-g10-english-v2": "sd-g10-english",
  "sd-g10-military-sciences": "sd-g10-military-science",
  "sd-g11-arabic-advanced": "sd-g11-arabic-specialized",
  "sd-g11-arts-design": "sd-g11-art",
  "sd-g11-commerce": "sd-g11-commercial-studies",
  "sd-g11-family-sciences": "sd-g11-home-economics",
  "sd-g11-grammar": "sd-g11-arabic-grammar",
  "sd-g11-literature": "sd-g11-arabic-literature",
  "sd-g11-military-sciences": "sd-g11-military-science",
  "sd-g11-quran-studies": "sd-g11-quran",
  "sd-g11-rhetoric": "sd-g11-arabic-rhetoric",
  "sd-g12-arabic-advanced": "sd-g12-arabic-specialized",
  "sd-g12-arts-design": "sd-g12-art",
  "sd-g12-basic-math": "sd-g12-math",
  "sd-g12-commerce": "sd-g12-commercial-studies",
  "sd-g12-family-sciences": "sd-g12-home-economics",
  "sd-g12-grammar": "sd-g12-arabic-grammar",
  "sd-g12-literature": "sd-g12-arabic-literature",
  "sd-g12-military-sciences": "sd-g12-military-science",
  "sd-g12-rhetoric": "sd-g12-arabic-rhetoric",
  "sd-g4-arts": "sd-g4-art",
  "sd-g4-computer": "sd-g4-ict",
  "sd-g4-english-v2": "sd-g4-english",
  "sd-g5-arts": "sd-g5-art",
  "sd-g5-computer": "sd-g5-ict",
  "sd-g5-resources": "sd-g5-arabic-reader",
  "sd-g6-arabic-v2": "sd-g6-arabic",
  "sd-g6-arts": "sd-g6-art",
  "sd-g6-technology": "sd-g6-ict",
  "sd-g7-islamic-education": "sd-g7-islamic-studies",
  "sd-g8-islamic-education": "sd-g8-islamic-studies",
  "sd-g8-technology": "sd-g8-technical-education",
  "sd-g9-communication-tech": "sd-g9-ict",
}

/** The catalog id for a legacy subject slug, or null when it is current. */
export function currentSubjectSlug(slug: string): string | null {
  return Object.hasOwn(LEGACY_SUBJECT_SLUGS, slug)
    ? LEGACY_SUBJECT_SLUGS[slug]!
    : null
}
