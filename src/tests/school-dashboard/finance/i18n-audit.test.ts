// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Finance i18n ratchets — the two detectors the platform-wide checks miss.
 * Baselines are a floor to drive DOWN, never up: a new bare English heading
 * or a `d?.key` lookup that names a key the dictionary does not have fails
 * the build. See scripts/finance-i18n-audit.ts.
 */

import { describe, expect, it } from "vitest"

import {
  findJsxTextLiterals,
  findMissingDictionaryKeys,
} from "../../../../scripts/finance-i18n-audit"

// ── Missing dictionary keys ────────────────────────────────────────────────
// `rp?.profitLossStatement || "Profit & Loss Statement"` with no such key:
// EN/AR parity passes (both files lack it) and /ar shows English. 28 shipped
// that way until 2026-08-15; now 0. Do NOT raise it.
const BASELINE_MISSING_KEYS = 0

// ── Bare English JSX copy ──────────────────────────────────────────────────
// Headings, empty states, unit suffixes, `? "Active" : "Inactive"` ternaries.
// 2026-08-15: 72 → 29. The residue is the `d?.key ?? (isRTL ? "…" : "…")`
// bilingual-fallback pattern in fees/manual-payment-rail.tsx (22) and
// fees/fee-payment-methods.tsx (3) — the dictionary resolves first and both
// languages are covered, so it is a style debt rather than a leak — plus two
// email font stacks and two internal Error() messages the scanner cannot tell
// from copy. Drive it down; never up.
const BASELINE_JSX_LITERALS = 29

describe("finance i18n audit — ratchets", () => {
  it(`no NEW dictionary lookup on a key that does not exist (baseline ${BASELINE_MISSING_KEYS})`, () => {
    const hits = findMissingDictionaryKeys()
    expect(
      hits.length,
      `Lookups whose key is absent from the dictionary slice (the English fallback wins on /ar):\n` +
        hits
          .map(
            (h) => `  ${h.file}:${h.line}  ${h.alias}?.${h.key}  (${h.slice})`
          )
          .join("\n") +
        `\n\nAdd the key to BOTH en/finance.json and ar/finance.json, or point the lookup at an existing key.`
    ).toBeLessThanOrEqual(BASELINE_MISSING_KEYS)
  })

  it(`no NEW bare English JSX copy in the finance block (baseline ${BASELINE_JSX_LITERALS})`, () => {
    const hits = findJsxTextLiterals()
    expect(
      hits.length,
      `Hardcoded English rendered as JSX text/attr/ternary:\n` +
        hits
          .slice(0, 40)
          .map((h) => `  ${h.file}:${h.line} [${h.kind}] ${h.text}`)
          .join("\n") +
        `\n\nUse a dictionary key (finance.json en+ar). If you removed some, lower the baseline.`
    ).toBeLessThanOrEqual(BASELINE_JSX_LITERALS)
  })

  it("finds the finance files at all (audit sanity)", () => {
    // Guard against a path change silently matching nothing.
    expect(findJsxTextLiterals().length).toBeGreaterThan(0)
  })
})
