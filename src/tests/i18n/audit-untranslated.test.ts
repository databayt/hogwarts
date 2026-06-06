// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import { findOffenders } from "../../../scripts/audit-untranslated"

/**
 * Regression ratchet for the dynamic-content i18n audit.
 *
 * `scripts/audit-untranslated.ts` finds render surfaces that compose a person
 * name (`${x.firstName} ${x.lastName}`, `firstName + … + lastName`, …) but never
 * route it through a translation helper — those rows reach the UI as raw stored
 * (usually Arabic) text on `/en`. This test promotes that previously-manual
 * script into a regression gate so the count can only go DOWN.
 *
 * RATCHET RULE:
 *   - A NEW offender pushes the count above BASELINE → this test fails the suite.
 *   - When you FIX an offender (route it through getName/getNames/getLabels —
 *     see /docs/translation-guide), LOWER BASELINE to the new count so the win
 *     is locked in. Never raise it.
 *
 * The current backlog is small (the audit prints the exact offenders); this is
 * the "wire the gate" half of translation-guide's first Area of Improvement.
 */
const BASELINE = 7

describe("dynamic-content translation audit (ratchet)", () => {
  it("adds no new untranslated person-name render surfaces", () => {
    const offenders = findOffenders()

    const message =
      offenders.length > BASELINE
        ? `Untranslated person-name render surface(s) added: ${offenders.length} > baseline ${BASELINE}.\n` +
          `Route the name through getName/getNames/getLabels (see /docs/translation-guide).\n` +
          `Offenders:\n` +
          offenders
            .map((o) => `  ${o.file}:${o.line}\n    ${o.snippet}`)
            .join("\n")
        : `Backlog reduced to ${offenders.length} — lower BASELINE to ${offenders.length} to lock it in.`

    expect(offenders.length, message).toBeLessThanOrEqual(BASELINE)
  })
})
