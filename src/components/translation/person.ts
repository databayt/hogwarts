"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Canonical person-name & content translation helpers.
 *
 * THE one place that turns stored (often Arabic) text into the current UI locale.
 * Before this file, the "compose name -> detect script -> translate -> dedupe" logic
 * was re-implemented inline at ~every call site (students/teachers/parents/staff
 * content.tsx + actions.ts), and ~153 surfaces did it not at all — which is why
 * `/en` pages kept regressing to Arabic. New code should call these instead of
 * touching `getText` / `translate` directly for names.
 *
 * Server-only (DB cache + Google API). For client tables, resolve names in the
 * server `content.tsx` and pass already-translated strings to `columns.tsx`.
 */
import { translate } from "./actions"
import { transliterate } from "./transliterate"
import type { Lang } from "./types"
import { detectScript, fullName } from "./util"

interface PersonNameParts {
  firstName?: string | null
  middleName?: string | null
  lastName?: string | null
  /** Stored content language flag — IGNORED in favour of actual script detection. */
  lang?: string | null
}

/**
 * Translate one stored value to the display language, with an OFFLINE fallback.
 *
 * Unlike `getText` (which swallows failures and returns the raw source —
 * i.e. Arabic on `/en`), this transliterates ar->Latin when the API is unavailable,
 * so a degraded `/en` shows "Mohammed Ali" rather than "محمد علي".
 */
async function translateOrTransliterate(
  raw: string,
  contentLang: Lang,
  displayLang: Lang,
  schoolId: string
): Promise<string> {
  if (!raw) return ""
  if (contentLang === displayLang) return raw
  try {
    const out = await translate(raw, contentLang, displayLang, schoolId)
    return out || raw
  } catch {
    // API degraded: transliterate ar->en offline; otherwise return source unchanged.
    return displayLang === "en" && contentLang === "ar"
      ? transliterate(raw, "en")
      : raw
  }
}

/**
 * Resolve a single person's display name in the current locale.
 *
 * @example
 * const name = await getName(student, lang, schoolId)
 */
export async function getName(
  person: PersonNameParts,
  displayLang: Lang,
  schoolId: string
): Promise<string> {
  const raw = fullName(person)
  if (!raw) return ""
  const contentLang = detectScript(raw)
  return translateOrTransliterate(raw, contentLang, displayLang, schoolId)
}

/**
 * Batch-resolve display names for a list, de-duplicated and translated in parallel
 * (avoids the per-row N+1). Returns a `Map<rawComposedName, translatedName>`.
 *
 * Read it back with `fullName(accessor(row))` as the key, e.g.:
 *
 * @example
 * const names = await getNames(rows, (r) => r.student, lang, schoolId)
 * const display = names.get(fullName(row.student)) ?? fullName(row.student)
 */
export async function getNames<T>(
  rows: T[],
  accessor: (row: T) => PersonNameParts,
  displayLang: Lang,
  schoolId: string
): Promise<Map<string, string>> {
  const unique = new Map<string, Lang>()
  for (const row of rows) {
    const raw = fullName(accessor(row))
    if (!raw) continue
    const contentLang = detectScript(raw)
    if (contentLang !== displayLang && !unique.has(raw)) {
      unique.set(raw, contentLang)
    }
  }

  const result = new Map<string, string>()
  await Promise.all(
    Array.from(unique.entries()).map(async ([raw, contentLang]) => {
      result.set(
        raw,
        await translateOrTransliterate(raw, contentLang, displayLang, schoolId)
      )
    })
  )
  return result
}

/**
 * Generic dedupe+parallel translator for arbitrary stored content values
 * (classroom room names, subject names, grade labels, announcement titles…).
 * Content language is detected per-value from its script. Returns
 * `Map<sourceValue, translatedValue>`; values already in `displayLang` are omitted
 * (callers should fall back to the source on a miss).
 *
 * @example
 * const t = await getLabels(rooms, lang, schoolId)
 * const display = t.get(room) ?? room
 */
export async function getLabels(
  values: Array<string | null | undefined>,
  displayLang: Lang,
  schoolId: string
): Promise<Map<string, string>> {
  const unique = new Map<string, Lang>()
  for (const value of values) {
    if (!value) continue
    const contentLang = detectScript(value)
    if (contentLang !== displayLang && !unique.has(value)) {
      unique.set(value, contentLang)
    }
  }

  const result = new Map<string, string>()
  await Promise.all(
    Array.from(unique.entries()).map(async ([value, contentLang]) => {
      result.set(
        value,
        await translateOrTransliterate(
          value,
          contentLang,
          displayLang,
          schoolId
        )
      )
    })
  )
  return result
}
