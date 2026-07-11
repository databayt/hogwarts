// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Hardcoded-string ratchet: counts can only go DOWN.
 *
 * Baselines are the measured state of the codebase. If your change adds a
 * hardcoded English string (FormLabel/toast/Button/error/label/Zod/
 * placeholder/bilingual field), the matching counter rises above its
 * baseline and this test fails — use dictionary keys instead (see
 * .claude/rules/translation.md). When a sweep removes strings, LOWER the
 * baseline to the new measured count so the win is locked in:
 *
 *   npx tsx scripts/i18n-hardcoded-ratchet.ts          # fresh counts
 *   npx tsx scripts/i18n-audit.ts                      # fresh STATIC-GAP?
 */
import { describe, expect, it } from "vitest"

import { auditRoutes } from "../../../scripts/i18n-audit"
import {
  scanHardcodedStrings,
  type PatternName,
} from "../../../scripts/i18n-hardcoded-ratchet"

// Measured 2026-06-10; re-baselined 2026-06-12 after reverting a sweep
// agent's ratchet gaming (lowercased messages dodge the [A-Z] patterns).
// Re-baselined 2026-06-21: the scan now excludes `src/app/api/**` (machine-
// facing API JSON, not UI — see i18n-hardcoded-ratchet.ts), so the floors drop
// to the honest UI-only counts. errorReturn 1543→1116 (−466 API responses,
// which also resolves the +39 drift from intervening API endpoints), selectLabel
// 1624→1547, zodMessage 880→864, bilingualField 123→111, toast 110→106,
// button 35→34, placeholder 163→161. UI surfaces (src/components, non-api
// src/app) remain fully scanned.
// Re-baselined 2026-07-11: admission production-readiness pass added 12
// legitimate error-CODE returns (not hardcoded UI English) — the RBAC
// `FORBIDDEN` returns in admission leads actions (+5) and the offer-integrity
// gates `OFFER_NOT_AVAILABLE`/`OFFER_EXPIRED`/`REGISTRATION_FEE_ALREADY_PAID`
// in application/offer/actions.ts (+7), each following its file's existing
// error-code pattern. errorReturn 1116→1128.
const BASELINE_BY_PATTERN: Record<PatternName, number> = {
  formLabel: 23,
  toast: 106,
  button: 34,
  errorReturn: 1128,
  selectLabel: 1547,
  zodMessage: 864,
  bilingualField: 111,
  placeholder: 161,
}

/**
 * Routes whose page closure shows NO dictionary wiring (i18n-audit.ts).
 * Driven 21 → 0 on 2026-06-11 (exam wizard, parent portal, transcript
 * verify). Every route now has dictionary wiring — keep it at zero.
 */
const BASELINE_STATIC_GAP = 0

describe("hardcoded-string ratchet", () => {
  const report = scanHardcodedStrings()

  for (const [pattern, baseline] of Object.entries(BASELINE_BY_PATTERN) as [
    PatternName,
    number,
  ][]) {
    it(`"${pattern}" count stays at or below baseline (${baseline})`, () => {
      const fresh = report.offenders.filter((o) => o.pattern === pattern)
      expect(
        report.byPattern[pattern],
        `New hardcoded "${pattern}" strings detected. Worst offenders:\n` +
          fresh
            .slice(-10)
            .map((o) => `  ${o.file}:${o.line} ${o.text}`)
            .join("\n") +
          `\nUse dictionary keys (see .claude/rules/translation.md). ` +
          `If you removed strings, lower the baseline instead.`
      ).toBeLessThanOrEqual(baseline)
    })
  }

  it(`STATIC-GAP? route count stays at or below baseline (${BASELINE_STATIC_GAP})`, () => {
    const audit = auditRoutes()
    const gaps = audit.byTag["STATIC-GAP?"] ?? 0
    expect(
      gaps,
      `Routes with no dictionary wiring:\n` +
        audit.gaps.map((g) => `  ${g.route}`).join("\n")
    ).toBeLessThanOrEqual(BASELINE_STATIC_GAP)
  }, 30_000)
})
