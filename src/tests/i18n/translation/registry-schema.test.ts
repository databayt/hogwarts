// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Prisma } from "@prisma/client"
import { describe, expect, it } from "vitest"

import { CATALOG_GLOBAL, TRANSLATABLE } from "@/components/translation/registry"

/**
 * Registry ↔ Prisma schema drift gate (HARD test, not a ratchet).
 *
 * A registry entry naming a column that doesn't exist silently no-ops
 * `localize()`/`prewarm()` — the model just never translates, with zero
 * errors. This happened for real: `Department: ["name"]` while the column is
 * `departmentName` (and `YearLevel`'s column is `levelName`). This test makes
 * that class of bug impossible to reintroduce.
 *
 * Also pins the CATALOG_GLOBAL set to schema truth: a model belongs there
 * if and only if it has NO `schoolId` column (its writes happen in operator
 * context where `prewarm` can't run — see registry.ts).
 */

const dmmfModels = new Map(Prisma.dmmf.datamodel.models.map((m) => [m.name, m]))

describe("translation registry ↔ prisma schema", () => {
  for (const [model, fields] of Object.entries(TRANSLATABLE)) {
    it(`${model} exists in the schema with real String fields`, () => {
      const dmmf = dmmfModels.get(model)
      expect(
        dmmf,
        `Registry model "${model}" does not exist in the Prisma schema. ` +
          `Registry keys must be actual model names (registry.ts).`
      ).toBeDefined()

      for (const field of fields) {
        const col = dmmf!.fields.find((f) => f.name === field)
        expect(
          col,
          `Registry field "${model}.${field}" does not exist in the schema — ` +
            `localize()/prewarm() silently no-op on it. Use the real column ` +
            `name (e.g. Department.departmentName, YearLevel.levelName).`
        ).toBeDefined()
        expect(
          col!.kind === "scalar" && col!.type === "String",
          `Registry field "${model}.${field}" must be a String scalar ` +
            `(got kind=${col!.kind}, type=${col!.type}).`
        ).toBe(true)
      }
    })
  }

  it("CATALOG_GLOBAL matches schema truth (model listed ⟺ no schoolId column)", () => {
    for (const model of Object.keys(TRANSLATABLE)) {
      const dmmf = dmmfModels.get(model)
      if (!dmmf) continue // covered by the per-model assertion above
      const hasSchoolId = dmmf.fields.some((f) => f.name === "schoolId")
      const listedGlobal = CATALOG_GLOBAL.has(
        model as keyof typeof TRANSLATABLE
      )
      expect(
        listedGlobal,
        hasSchoolId
          ? `"${model}" has a schoolId column but is listed in CATALOG_GLOBAL — ` +
              `remove it (its write paths CAN prewarm).`
          : `"${model}" has NO schoolId column but is missing from CATALOG_GLOBAL — ` +
              `add it (the prewarm audit must not demand the impossible).`
      ).toBe(!hasSchoolId)
    }
  })

  it("registers no bilingual or placeholder-bearing fields", () => {
    // Single-language storage: generic field names only. A *En/*Ar suffix in
    // the registry means someone is about to fork content by language.
    for (const [model, fields] of Object.entries(TRANSLATABLE)) {
      for (const field of fields) {
        expect(
          /(?:En|Ar)$/.test(field),
          `"${model}.${field}" looks like a bilingual column — forbidden by ` +
            `single-language storage (CLAUDE.md). Use the generic column + lang.`
        ).toBe(false)
      }
    }
  })
})
