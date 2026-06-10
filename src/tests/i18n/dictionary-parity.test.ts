// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * THE translation guard: en/ar dictionary parity over the REAL files.
 *
 * Any key added to one language and not the other — in the 4 top-level
 * pairs or any module file under dictionaries/{en,ar}/ — fails this test,
 * and therefore `pnpm test` and CI. (The key-diff.test.ts suite covers the
 * diff algorithm on synthetic data; this one covers the actual dictionaries.)
 *
 * To fix a failure: add the missing key(s) to the other language, or run
 * `pnpm i18n:fix` to scaffold [AR]/[EN] placeholders and translate them.
 */
import { describe, expect, it } from "vitest"

import {
  checkDictionaryParity,
  findUntranslatedPlaceholders,
  formatParityReport,
} from "@/components/internationalization/lib/parity"

describe("dictionary parity (real en/ar files)", () => {
  const report = checkDictionaryParity()

  it("covers the expected dictionary surface", () => {
    // 4 top-level pairs + at least the 19 module pairs that exist today.
    expect(report.pairs.filter((p) => p.topLevel)).toHaveLength(4)
    expect(
      report.pairs.filter((p) => !p.topLevel).length
    ).toBeGreaterThanOrEqual(19)
  })

  it("every module dictionary file exists in BOTH languages", () => {
    expect(report.filesOnlyInAr, "files missing an en/ twin").toEqual([])
    expect(report.filesOnlyInEn, "files missing an ar/ twin").toEqual([])
  })

  it("en and ar dictionaries have ZERO key drift", () => {
    expect(
      report.totalMissingInAr + report.totalMissingInEn,
      `\n${formatParityReport(report)}\n`
    ).toBe(0)
  })

  it("no untranslated [AR]/[EN] placeholders are committed", () => {
    // i18n:fix scaffolds placeholders; they must be translated before commit.
    // Checked here so a lazy fix can't silently ship "[AR] Save" to users.
    const hits = findUntranslatedPlaceholders()
    expect(
      hits,
      hits.map((h) => `${h.file}: ${h.key} = ${h.value}`).join("\n")
    ).toEqual([])
  })
})
