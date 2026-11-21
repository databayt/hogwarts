// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { draftEnvelopeSchema, questionSchema } from "./schema"
import type {
  DraftHomework,
  DraftOption,
  DraftQuestion,
  ValidDraft,
} from "./types"

/**
 * The model's answer, checked in code. Pure: no I/O, so every rule has a
 * unit test. A malformed question is dropped, never repaired — a teacher
 * reviews what is left, and "fixing" an answer key silently is worse than
 * a shorter quiz.
 */

export const MIN_QUESTIONS = 4
export const MAX_QUESTIONS = 8
export const MIN_ARABIC_RATIO = 0.7

const DIACRITICS_AND_TATWEEL = /[ً-ٰٟـ]/g

/** Trim, collapse spaces, strip Arabic diacritics and tatweel, case-fold. */
export function normalizeText(s: string): string {
  return s
    .normalize("NFC")
    .replace(DIACRITICS_AND_TATWEEL, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

const ARABIC_LETTER = /[ء-يٮ-ۓۺ-ۿ]/g
const ANY_LETTER = /\p{L}/gu

/**
 * Share of letters that are Arabic. No letters at all (numbers, symbols)
 * counts as fully Arabic: a maths option "36" is no language mistake.
 */
export function arabicRatio(text: string): number {
  const letters = text.match(ANY_LETTER)?.length ?? 0
  if (letters === 0) return 1
  return (text.match(ARABIC_LETTER)?.length ?? 0) / letters
}

function validQuestion(
  raw: unknown,
  lang: "ar" | "en"
): DraftQuestion | null {
  const parsed = questionSchema.safeParse(raw)
  if (!parsed.success) return null
  const q = parsed.data
  const text = q.text.trim()
  const explanation = q.explanation.trim()
  if (text.length < 5 || explanation.length === 0) return null

  const options: DraftOption[] = q.options.map((o) => ({
    text: o.text.trim(),
    isCorrect: o.isCorrect,
  }))
  const want = q.type === "MULTIPLE_CHOICE" ? 4 : 2
  if (options.length !== want) return null
  if (options.some((o) => o.text.length === 0)) return null
  if (new Set(options.map((o) => normalizeText(o.text))).size !== want)
    return null
  if (options.filter((o) => o.isCorrect).length !== 1) return null

  if (lang === "ar") {
    if (arabicRatio(text) < MIN_ARABIC_RATIO) return null
    if (arabicRatio(options.map((o) => o.text).join(" ")) < MIN_ARABIC_RATIO)
      return null
  }
  return {
    type: q.type,
    text,
    options,
    explanation,
    difficulty: q.difficulty,
    bloom: q.bloom,
  }
}

const clamp = (n: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, Math.round(n)))

function validHomework(raw: {
  title: string
  instructions: string
  points: number
  dueInDays: number
}): DraftHomework | null {
  const title = raw.title.trim().slice(0, 200)
  const instructions = raw.instructions.trim().slice(0, 5000)
  if (!title || !instructions) return null
  if (!Number.isFinite(raw.points) || !Number.isFinite(raw.dueInDays))
    return null
  return {
    title,
    instructions,
    points: clamp(raw.points, 1, 20),
    dueInDays: clamp(raw.dueInDays, 1, 7),
  }
}

export type DraftValidation =
  | { ok: true; draft: ValidDraft }
  | { ok: false; valid: number }

/**
 * `lang` is the LESSON's language (the model's own `lang` claim is ignored:
 * the text decides). With `needQuestions` false (the wizard's homework-only
 * mode) only the homework is checked.
 */
export function validateDraft(
  raw: unknown,
  lang: "ar" | "en",
  opts: { needQuestions?: boolean } = {}
): DraftValidation {
  const needQuestions = opts.needQuestions ?? true
  const env = draftEnvelopeSchema.safeParse(raw)
  if (!env.success) return { ok: false, valid: 0 }
  const homework = validHomework(env.data.homework)

  const seen = new Set<string>()
  const questions: DraftQuestion[] = []
  let dropped = 0
  for (const item of env.data.questions) {
    const q = validQuestion(item, lang)
    const key = q ? normalizeText(q.text) : ""
    if (!q || seen.has(key)) {
      dropped++
      continue
    }
    seen.add(key)
    questions.push(q)
  }
  const kept = questions.slice(0, MAX_QUESTIONS)

  if (!homework) return { ok: false, valid: kept.length }
  if (needQuestions && kept.length < MIN_QUESTIONS)
    return { ok: false, valid: kept.length }
  return {
    ok: true,
    draft: {
      lang,
      questions: needQuestions ? kept : [],
      homework,
      dropped: dropped + (questions.length - kept.length),
    },
  }
}
