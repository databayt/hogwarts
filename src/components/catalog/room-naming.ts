// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Default homeroom classroom name for a section:
 * `<section letter><2-digit grade number>` — e.g. Grade 1 → A01 (section A),
 * B01 (section B); Grade 12 → A12, B12. Grade-assigned (not shared).
 *
 * Single source of truth shared by `autoProvisionSections` (the "Sync defaults"
 * button) and the Configure tab's `generateSections`, so the two provisioning
 * paths can never drift apart.
 */
export function defaultRoomName(letter: string, gradeNumber: number): string {
  return `${letter}${String(gradeNumber).padStart(2, "0")}`
}

/**
 * Section letters in the school's own script — أ/ب/ج for an Arabic school,
 * A/B/C otherwise. Sections were previously lettered "ABCDEFGHIJ" for EVERY
 * school, so a Sudanese school got English sections ("Grade 1-A", stored
 * lang="en") and Latin homerooms ("A01") while its grades read الصف الأول.
 *
 * Arabic order is the أبجد/hija'i sequence schools actually use for شعب
 * (أ، ب، ج، د…) — NOT a transliteration of A/B/C.
 *
 * Digits stay Latin on purpose: the Arabic UI renders numbers in Latin
 * throughout (الحصة 1, 07:15), so أ01 is consistent and أ٠١ would not be.
 */
const SECTION_LETTERS_AR = ["أ", "ب", "ج", "د", "ه", "و", "ز", "ح", "ط", "ي"]
const SECTION_LETTERS_EN = "ABCDEFGHIJ".split("")

export function sectionLetters(lang: string | null | undefined): string[] {
  return lang === "ar" ? SECTION_LETTERS_AR : SECTION_LETTERS_EN
}

/**
 * Display name for a section. Arabic composes from the grade's OWN name, which
 * the curriculum config already localises (الصف الأول - أ); English keeps the
 * established `Grade 1-A` shape.
 */
export function defaultSectionName(
  lang: string | null | undefined,
  gradeNumber: number,
  gradeName: string,
  letter: string
): string {
  return lang === "ar"
    ? `${gradeName} - ${letter}`
    : `Grade ${gradeNumber}-${letter}`
}
