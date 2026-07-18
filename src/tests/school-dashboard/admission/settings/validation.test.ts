// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Real-schema assertions (actions.test.ts mocks the validation module, so
 * the defaults regression must live in an unmocked file).
 */
import { describe, expect, it } from "vitest"

import { admissionSettingsSchema } from "@/components/school-dashboard/admission/settings/validation"

describe("admissionSettingsSchema", () => {
  it("DEFAULTS satisfy the weights invariant (regression: 35+25 never summed to 100)", () => {
    // A freshly seeded school must be able to save Settings with zero
    // edits — the old 35/25 defaults failed the schema's own refine.
    const parsed = admissionSettingsSchema.parse({})
    expect(parsed.entranceWeight + parsed.interviewWeight).toBe(100)
    expect(parsed.academicWeight).toBe(0)
  })

  it("rejects weights that do not sum to 100", () => {
    const result = admissionSettingsSchema.safeParse({
      entranceWeight: 50,
      interviewWeight: 30,
    })
    expect(result.success).toBe(false)
  })
})
