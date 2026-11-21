// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import {
  arabicRatio,
  normalizeText,
  validateDraft,
} from "@/components/lesson-draft/validate"

const mc = (n: number, over: Record<string, unknown> = {}) => ({
  type: "MULTIPLE_CHOICE",
  text: `ما هي الجملة الاسمية رقم ${n}؟`,
  options: [
    { text: `الجواب الأول ${n}`, isCorrect: true },
    { text: `الجواب الثاني ${n}`, isCorrect: false },
    { text: `الجواب الثالث ${n}`, isCorrect: false },
    { text: `الجواب الرابع ${n}`, isCorrect: false },
  ],
  explanation: "لأنها تبدأ باسم",
  difficulty: "EASY",
  bloom: "REMEMBER",
  ...over,
})
const tf = (n: number, over: Record<string, unknown> = {}) => ({
  type: "TRUE_FALSE",
  text: `هل تبدأ الجملة الفعلية بفعل في المثال ${n}؟`,
  options: [
    { text: "صح", isCorrect: true },
    { text: "خطأ", isCorrect: false },
  ],
  explanation: "الجملة الفعلية تبدأ بفعل",
  difficulty: "MEDIUM",
  bloom: "UNDERSTAND",
  ...over,
})
const homework = {
  title: "تمرين على الجمل",
  instructions: "اكتب خمس جمل اسمية وخمس جمل فعلية.",
  points: 10,
  dueInDays: 3,
}
const draft = (questions: unknown[], hw: unknown = homework) => ({
  lang: "ar",
  questions,
  homework: hw,
})
const six = () => [mc(1), mc(2), mc(3), tf(4), tf(5), mc(6)]

describe("normalizeText", () => {
  it("trims, collapses spaces, strips diacritics and tatweel", () => {
    expect(normalizeText("  الجُمْلَـــة   الاسمية ")).toBe("الجملة الاسمية")
  })
})

describe("arabicRatio", () => {
  it("is 1 for Arabic, 0 for Latin, and 1 when there are no letters", () => {
    expect(arabicRatio("جملة اسمية")).toBe(1)
    expect(arabicRatio("hello")).toBe(0)
    expect(arabicRatio("٣٦ + ٤")).toBe(1)
  })
})

describe("validateDraft", () => {
  it("accepts a well-formed draft", () => {
    const r = validateDraft(draft(six()), "ar")
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.draft.questions).toHaveLength(6)
      expect(r.draft.homework.points).toBe(10)
      expect(r.draft.lang).toBe("ar")
    }
  })

  it("multiple choice needs exactly 4 options", () => {
    const three = mc(9, { options: mc(9).options.slice(0, 3) })
    const five = mc(8, {
      options: [...mc(8).options, { text: "الجواب الخامس", isCorrect: false }],
    })
    const r = validateDraft(draft([...six(), three, five]), "ar")
    expect(r.ok && r.draft.questions).toHaveLength(6)
    expect(r.ok && r.draft.dropped).toBe(2)
  })

  it("options must be unique after normalisation", () => {
    const dup = mc(7, {
      options: [
        { text: "الجُواب", isCorrect: true },
        { text: " الجواب ", isCorrect: false },
        { text: "ثانٍ", isCorrect: false },
        { text: "ثالث", isCorrect: false },
      ],
    })
    const r = validateDraft(draft([...six(), dup]), "ar")
    expect(r.ok && r.draft.questions).toHaveLength(6)
  })

  it("needs exactly one correct option", () => {
    const none = mc(7, {
      options: mc(7).options.map((o) => ({ ...o, isCorrect: false })),
    })
    const two = mc(8, {
      options: mc(8).options.map((o, i) => ({ ...o, isCorrect: i < 2 })),
    })
    const r = validateDraft(draft([...six(), none, two]), "ar")
    expect(r.ok && r.draft.questions).toHaveLength(6)
  })

  it("true/false has exactly 2 options and one correct", () => {
    const three = tf(7, {
      options: [
        { text: "صح", isCorrect: true },
        { text: "خطأ", isCorrect: false },
        { text: "ربما", isCorrect: false },
      ],
    })
    const bothTrue = tf(8, {
      options: [
        { text: "صح", isCorrect: true },
        { text: "خطأ", isCorrect: true },
      ],
    })
    const r = validateDraft(draft([...six(), three, bothTrue]), "ar")
    expect(r.ok && r.draft.questions).toHaveLength(6)
  })

  it("drops a duplicate question", () => {
    const r = validateDraft(draft([...six(), mc(1)]), "ar")
    expect(r.ok && r.draft.questions).toHaveLength(6)
    expect(r.ok && r.draft.dropped).toBe(1)
  })

  it("requires Arabic text when the lesson is Arabic", () => {
    const english = mc(7, { text: "What is a nominal sentence number seven?" })
    const englishOptions = mc(8, {
      options: [
        { text: "alpha beta", isCorrect: true },
        { text: "gamma delta", isCorrect: false },
        { text: "epsilon zeta", isCorrect: false },
        { text: "eta theta", isCorrect: false },
      ],
    })
    const r = validateDraft(draft([...six(), english, englishOptions]), "ar")
    expect(r.ok && r.draft.questions).toHaveLength(6)
    // The same items pass for an English lesson
    const en = validateDraft(draft([english, englishOptions, ...six()]), "en")
    expect(en.ok && en.draft.questions.length).toBeGreaterThanOrEqual(2)
  })

  it("drops malformed items (bad enum, missing fields)", () => {
    const r = validateDraft(
      draft([...six(), mc(7, { difficulty: "IMPOSSIBLE" }), { text: "x" }, null]),
      "ar"
    )
    expect(r.ok && r.draft.questions).toHaveLength(6)
  })

  it("fewer than 4 valid questions is incomplete", () => {
    const r = validateDraft(draft([mc(1), mc(2), mc(3)]), "ar")
    expect(r).toEqual({ ok: false, valid: 3 })
  })

  it("keeps at most 8 questions", () => {
    const ten = Array.from({ length: 10 }, (_, i) => mc(i + 1))
    const r = validateDraft(draft(ten), "ar")
    expect(r.ok && r.draft.questions).toHaveLength(8)
  })

  it("clamps homework points and days", () => {
    const r = validateDraft(
      draft(six(), { ...homework, points: 99, dueInDays: 30 }),
      "ar"
    )
    expect(r.ok && r.draft.homework).toMatchObject({ points: 20, dueInDays: 7 })
  })

  it("rejects an empty homework", () => {
    const r = validateDraft(draft(six(), { ...homework, title: "  " }), "ar")
    expect(r.ok).toBe(false)
  })

  it("rejects a non-object answer", () => {
    expect(validateDraft(null, "ar")).toEqual({ ok: false, valid: 0 })
  })

  it("homework-only mode needs no questions", () => {
    const r = validateDraft(draft([]), "ar", { needQuestions: false })
    expect(r.ok && r.draft.questions).toEqual([])
  })
})
