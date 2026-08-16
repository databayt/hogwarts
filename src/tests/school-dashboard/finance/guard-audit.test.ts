// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Ratchet tests for the finance block's structural invariants — the mechanical
 * net that would have caught this year's P0 (27 db-querying pages with no
 * permission gate). Baselines are a floor to drive DOWN, never up: a new
 * ungated page or a new dead link fails the build; fixing existing debt lets
 * the baseline drop.
 *
 * See scripts/finance-guard-audit.ts for the closure analysis.
 */

import { describe, expect, it } from "vitest"

import { auditFinanceGuards } from "../../../../scripts/finance-guard-audit"

// ── Ungated pages ───────────────────────────────────────────────────────────
// Every finance route page whose import closure hits the DB must also reach a
// permission gate. Measured 2026-07-17 after the RBAC fix at 8; the hub,
// dashboard and receipt pages were gated since. The 4 that remain (2026-08-15)
// are all verified OWN-DATA pages, where a module gate would be the wrong tool:
//   • banking/{my-banks,payment-transfer,transaction-history} — the caller's
//     own linked bank accounts; every fetch is keyed on session.user.id and
//     createTransfer ownership-checks both accounts before writing.
//   • payroll/my/page.tsx — a staff member's OWN payslips, scoped by
//     teacher.userId = session.user.id (own-data, exactly like fees/my); a
//     module gate would wrongly block staff from their own pay.
// Do NOT raise it except for a verified own-data page (session-scoped, no
// cross-user read).
const BASELINE_UNGATED_PAGES = 4

// ── Dead internal links ─────────────────────────────────────────────────────
// Internal /finance/... <Link> targets with no route on disk. Was 93 (the
// "coming soon" facade: budget/expenses/wallet/timesheet/accounts/payroll/
// reports/salary all advertised unbuilt routes); Phase 3 (2026-07-18) trimmed
// every module's nav + dashboard to only routes that exist → 0. Now locked:
// a new dead link fails the build. Do NOT raise it.
const BASELINE_DEAD_LINKS = 0

describe("finance guard audit — ratchets", () => {
  const audit = auditFinanceGuards()

  it(`no NEW ungated db-querying finance page (baseline ${BASELINE_UNGATED_PAGES})`, () => {
    expect(
      audit.ungatedPages.length,
      `Ungated finance pages that query the DB without reaching a permission gate:\n` +
        audit.ungatedPages.map((p) => `  ${p}`).join("\n") +
        `\n\nEvery finance page.tsx that touches db.* must call resolveFinanceAccess/` +
        `requireFinanceActor (directly or via its content.tsx). If you removed one, ` +
        `lower the baseline.`
    ).toBeLessThanOrEqual(BASELINE_UNGATED_PAGES)
  })

  it(`no NEW dead internal finance link (baseline ${BASELINE_DEAD_LINKS})`, () => {
    const targets = [...new Set(audit.deadLinks.map((d) => d.target))].sort()
    expect(
      audit.deadLinks.length,
      `Internal <Link> targets under /finance with no route on disk:\n` +
        targets.map((t) => `  ${t}`).join("\n") +
        `\n\nBuild the route, mark the action "coming soon" (disabled), or remove ` +
        `the link. If you fixed some, lower the baseline.`
    ).toBeLessThanOrEqual(BASELINE_DEAD_LINKS)
  })

  it("finds the finance pages at all (audit sanity)", () => {
    // Guard against the audit silently matching nothing (e.g. a path change)
    // and reporting a false all-clear.
    expect(audit.ungatedPages.length + audit.deadLinks.length).toBeGreaterThan(
      0
    )
  })
})
