// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Lang } from "./types"

/**
 * Translations a machine must never be asked to produce.
 *
 * Some strings have ONE right rendering that a general-purpose translator
 * reliably gets wrong, because the right answer is a published name rather
 * than a reading of the words. The library's featured title is the case that
 * forced this file: Google returns "هاري بوتر والحجر الفلسفي" — a literal
 * "the philosophical stone" — where every Arabic edition of the novel, and
 * every reader who has held one, says "هاري بوتر وحجر الفيلسوف".
 *
 * The same rule covers literary prose. A book's opening lines are written,
 * not stated, and a sentence-by-sentence machine pass flattens them; the
 * excerpt below is rendered here once, by hand, instead.
 *
 * This map is consulted BEFORE every cache tier — the process LRU and the
 * per-school `Translation` rows both included. That ordering is the point,
 * not an optimisation: the wrong strings are already sitting in caches on
 * localhost and in production, one row per school, and a lookup placed after
 * them would keep losing to rows nobody is going to clean up.
 *
 * Keyed by the exact source string. An edit to the source text in the seed or
 * the row is an edit here too, or the entry silently stops matching and the
 * machine takes over again.
 *
 * `القبس` moved here from the tenant-override branch that used to sit inside
 * `translate()` in `actions.ts`, so there is one place to look.
 */
const CANONICAL: Record<string, Partial<Record<Lang, string>>> = {
  // The library's featured book — see `library/content.tsx`.
  "Harry Potter and the Philosopher's Stone": {
    ar: "هاري بوتر وحجر الفيلسوف",
  },

  // Its opening paragraph, kept in step with `prisma/seeds/catalog/books.ts`.
  "Mr and Mrs Dursley, of number four, Privet Drive, were proud to say that they were perfectly normal, thank you very much. They were the last people you'd expect to be involved in anything strange or mysterious, because they just didn't hold with such nonsense.":
    {
      ar: "كان السيد والسيدة درسلي، من المنزل رقم أربعة في شارع بريفت، يفخران بأنهما طبيعيان تمامًا، شكرًا جزيلًا لك. كانا آخر من تتوقع أن يكون له شأن بأي أمر غريب أو غامض، لأنهما ببساطة لم يكونا يطيقان مثل هذا الهراء.",
    },

  // Tenant name — the school writes it as one word in English.
  القبس: {
    en: "Alqabs",
  },
}

/**
 * The hand-written rendering of `text` in `targetLang`, or `undefined` when
 * the string is ordinary content the translator should handle.
 */
export function canonicalTranslation(
  text: string,
  targetLang: Lang
): string | undefined {
  return CANONICAL[text.trim()]?.[targetLang]
}
