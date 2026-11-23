// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import arAssignments from "@/components/internationalization/dictionaries/ar/assignments.json"
import arExams from "@/components/internationalization/dictionaries/ar/exams.json"
import enAssignments from "@/components/internationalization/dictionaries/en/assignments.json"
import enExams from "@/components/internationalization/dictionaries/en/exams.json"

const leaves = (node: unknown, prefix = ""): Record<string, string> => {
  if (node === null || typeof node !== "object") return { [prefix]: String(node) }
  return Object.entries(node as Record<string, unknown>).reduce(
    (acc, [k, v]) => ({ ...acc, ...leaves(v, prefix ? `${prefix}.${k}` : k) }),
    {} as Record<string, string>
  )
}

const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join()

describe.each([
  ["assignments", enAssignments, arAssignments],
  ["exams", enExams, arExams],
])("%s dictionary", (_name, en, ar) => {
  const e = leaves(en)
  const a = leaves(ar)

  it("is not empty", () => {
    expect(Object.keys(e).length).toBeGreaterThan(0)
  })

  it("ar and en have the same keys", () => {
    expect(Object.keys(a).sort()).toEqual(Object.keys(e).sort())
  })

  it("no empty values, and {placeholders} match between languages", () => {
    for (const [k, v] of Object.entries(e)) {
      expect(v.trim(), `en ${k}`).not.toBe("")
      expect(a[k]?.trim(), `ar ${k}`).not.toBe("")
      expect(placeholders(a[k] ?? ""), `placeholders of ${k}`).toBe(
        placeholders(v)
      )
    }
  })
})
