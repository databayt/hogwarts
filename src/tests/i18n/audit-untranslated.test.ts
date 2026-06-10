// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import {
  findFieldOffenders,
  findOffenders,
  findPrewarmGaps,
} from "../../../scripts/audit-untranslated"

/**
 * Regression ratchets for the dynamic-content i18n audit — the enforced half
 * of the "translation guard" (the dictionary half lives in
 * dictionary-parity.test.ts + hardcoded-ratchet.test.ts).
 *
 * Three independent detectors, three independent baselines:
 *   1. PERSON_BASELINE  — render surfaces composing a person name raw
 *   2. FEATURE_BASELINE — feature dirs rendering a registered model with
 *                         ZERO translation anywhere in the feature
 *   3. PREWARM_BASELINE — school-scoped registered models written without
 *                         prewarm (first cross-lang reader pays Google)
 *
 * RATCHET RULE (each): a NEW offender pushes the count above the baseline →
 * the suite fails. When you FIX one, LOWER the baseline to the new count to
 * lock the win. Never raise a baseline — fix the regression instead.
 */
const PERSON_BASELINE = 6
const FEATURE_BASELINE = 3
const PREWARM_BASELINE = 33

describe("dynamic-content translation audit (ratchets)", () => {
  it("adds no new untranslated person-name render surfaces", () => {
    const offenders = findOffenders()

    const message =
      offenders.length > PERSON_BASELINE
        ? `Untranslated person-name render surface(s) added: ${offenders.length} > baseline ${PERSON_BASELINE}.\n` +
          `Route the name through getName/getNames/getLabels (see /docs/translation-guide).\n` +
          `Offenders:\n` +
          offenders
            .map((o) => `  ${o.file}:${o.line}\n    ${o.snippet}`)
            .join("\n")
        : `Backlog reduced to ${offenders.length} — lower PERSON_BASELINE to ${offenders.length} to lock it in.`

    expect(offenders.length, message).toBeLessThanOrEqual(PERSON_BASELINE)
  })

  it("adds no new zero-translation features for registered models", () => {
    const gaps = findFieldOffenders()

    const message =
      gaps.length > FEATURE_BASELINE
        ? `Feature(s) rendering a registered model with ZERO translation: ${gaps.length} > baseline ${FEATURE_BASELINE}.\n` +
          `Wire localize()/localizeOne() at the feature's data boundary (see /docs/translation-guide).\n` +
          gaps.map((g) => `  ${g.model} → ${g.dir}`).join("\n")
        : `Backlog reduced to ${gaps.length} — lower FEATURE_BASELINE to ${gaps.length} to lock it in.`

    expect(gaps.length, message).toBeLessThanOrEqual(FEATURE_BASELINE)
  })

  it("adds no new prewarm-less write paths for school-scoped models", () => {
    const gaps = findPrewarmGaps()

    const message =
      gaps.length > PREWARM_BASELINE
        ? `Write path(s) without prewarm added: ${gaps.length} > baseline ${PREWARM_BASELINE}.\n` +
          `Add after(() => prewarm("Model", row, { schoolId })) to the create/update action\n` +
          `(see announcements/actions.ts for the pattern). Gaps:\n` +
          gaps.map((g) => `  ${g.model} → ${g.file}`).join("\n")
        : `Backlog reduced to ${gaps.length} — lower PREWARM_BASELINE to ${gaps.length} to lock it in.`

    expect(gaps.length, message).toBeLessThanOrEqual(PREWARM_BASELINE)
  })
})
