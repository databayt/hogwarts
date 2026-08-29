// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The exam-blueprint distribution schema.
 *
 * Zod 4 changed `z.record(enumKey, value)` to be EXHAUSTIVE — it demands every
 * member of the key enum. A distribution names only the buckets a blueprint
 * actually asks for ("5 easy multiple-choice"), so after the Zod 3 → 4 upgrade
 * every realistic blueprint was rejected and `createTemplate` /
 * `updateTemplate` threw on save. Nothing caught it: the schema still compiled,
 * `tsc` was clean, and no test exercised it with a partial distribution.
 *
 * `z.partialRecord` is Zod 4's name for the old behaviour. These assertions pin
 * both halves of what it has to do — accept a partial distribution, and still
 * reject a key that is not in the enum.
 */
import { describe, expect, it } from "vitest"

import { examTemplateSchema } from "@/components/school-dashboard/exams/generate/validation"
import { examTemplateSchema as qbankExamTemplateSchema } from "@/components/school-dashboard/exams/qbank/validation"

const base = {
  name: "Term test blueprint",
  subjectId: "subj-1",
  duration: 60,
  totalMarks: 34,
}

/** Every copy of this schema in the repo must behave the same way. */
const SCHEMAS: Array<[string, typeof examTemplateSchema]> = [
  ["exams/generate", examTemplateSchema],
  ["exams/qbank", qbankExamTemplateSchema],
]

describe.each(SCHEMAS)("%s examTemplateSchema", (_name, schema) => {
  it("accepts a distribution naming only the buckets it wants", () => {
    // What the distribution editor actually submits: it writes a cell only
    // when a teacher types a number into it.
    const result = schema.safeParse({
      ...base,
      distribution: { MULTIPLE_CHOICE: { EASY: 5 }, TRUE_FALSE: { EASY: 3 } },
    })
    expect(result.success).toBe(true)
  })

  it("accepts a single bucket", () => {
    const result = schema.safeParse({
      ...base,
      distribution: { ESSAY: { HARD: 2 } },
    })
    expect(result.success).toBe(true)
  })

  it("rejects a difficulty that is not a DifficultyLevel", () => {
    // The demo blueprint stored `{"MULTIPLE_CHOICE": {"ALL": 5}}`, which
    // matches no question and selects nothing. Partial must not mean lax.
    const result = schema.safeParse({
      ...base,
      distribution: { MULTIPLE_CHOICE: { ALL: 5 } },
    })
    expect(result.success).toBe(false)
  })

  it("rejects a question type that is not a QuestionType", () => {
    const result = schema.safeParse({
      ...base,
      distribution: { NOT_A_TYPE: { EASY: 5 } },
    })
    expect(result.success).toBe(false)
  })

  it("still enforces the per-cell count range", () => {
    expect(
      schema.safeParse({
        ...base,
        distribution: { MULTIPLE_CHOICE: { EASY: 999 } },
      }).success
    ).toBe(false)
    expect(
      schema.safeParse({
        ...base,
        distribution: { MULTIPLE_CHOICE: { EASY: -1 } },
      }).success
    ).toBe(false)
  })

  it("rejects a blueprint that asks for no questions at all", () => {
    // A distribution summing to zero would generate an empty paper.
    expect(schema.safeParse({ ...base, distribution: {} }).success).toBe(false)
  })
})
