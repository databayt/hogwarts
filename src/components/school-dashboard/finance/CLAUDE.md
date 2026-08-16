---
epic: 01
sprint: Q3-2026
title: Finance (school dashboard)
file_type: claude
owner: Abdout
maturity: Built+Polish
completion: 79
tracker: https://github.com/databayt/hogwarts/issues/313
docs: https://ed.databayt.org/en/docs/fees
last_audited: 2026-08-15
---

# Finance Block

## Context

School finance module with 14 sub-modules and a shared double-entry bookkeeping engine. Largest single feature in the repo (~45k LOC). Covers accounts, banking, budget, dashboard, expenses, fees, invoice, payroll, permissions, receipt, reports, salary, timesheet, wallet. Integrates Stripe for checkout/subscriptions and Plaid for bank account linking. Currency per school via `School.currency`.

## Before You Start

1. Read `README.md` for per-sub-module status and routes
2. Read `ISSUE.md` (root umbrella) for priorities across all sub-modules
3. Each sub-module has its own `ISSUE.md` with its P0/P1/P2 backlog -- read the one you're touching
4. If touching money math: read `lib/accounting/` first -- double-entry invariants must hold

## Key Decisions

- **Every page and action gates through `guard.ts`** (block root, added 2026-07-17):
  - Pages: `const { schoolId, can } = await resolveFinanceAccess("payroll", ["view"])`, then
    `if (!can.view) return <FinanceAccessDenied dictionary={dictionary} module="payroll" />`.
  - Actions: `const ctx = await requireFinanceActor("invoice", "edit"); if (isFinanceAuthError(ctx)) return ctx`.
  - **The gate belongs in the page, not the layout.** Next.js 16 streams a page in parallel with
    its layout, so a layout `redirect()` cannot stop the page's query — and a redirect thrown after
    content streams corrupts the RSC payload (React #310). Deny with **inline UI**, never `redirect()`.
  - `finance/permissions.ts` is **nav-only** (`PageNavItem[]` / toolbar `UIPermissions`) and
    `isRoleIn` comes from `rbac/ui-permissions`. Neither is authorization — they only hide links.
- **Double-entry bookkeeping**: all monetary events post journal entries via `lib/accounting/`. Debits always equal credits. Posting rules in `lib/accounting/posting-rules.ts` translate domain events (payment recorded, fee waived, salary slip approved) into balanced journal lines
- **Amount storage convention is mixed**: Decimal columns hold whole units in dashboard aggregations but cents elsewhere -- `lib/format.ts` exposes both `formatMoney` (whole units) and `formatCurrency` (cents / 100). Know which your data uses before formatting
- **Currency is per-school**: `School.currency` (ISO 4217 code) drives all money formatting. Never hardcode `$` or `SDG`. Fetch once in `content.tsx` and prop-drill to children
- **Permissions via FinancePermission model**: sub-feature-granular, role-scoped, enforced in `checkCurrentUserPermission()` before any mutation
- **Dictionary-driven notifications**: server actions dispatch notifications by reading `finance.notifications.*` keys via `getDictionary(school.preferredLanguage)` -- never ternary `isAr ? ...arStr : enStr`
- **Error-code pattern for server actions**: return `actionError(ACTION_ERRORS.INVOICE_NOT_FOUND)` -- never hardcode English messages. Client maps codes to translated strings

## Danger Zones

- **A fat `page.tsx` that queries `db` directly is the bug pattern here.** `content.tsx` is where
  the permission gate lives, so bypassing the mirror pattern bypasses authorization — that is
  exactly how 27 of 30 pages ended up ungated. Query from `content.tsx`, or call `guard.ts` first.
- **`school-*.json` has a stale top-level `finance` stub that nothing reads.** The live dictionary
  is `dictionaries/{en,ar}/finance.json` (2,324 keys, 100% parity). Editing the stub changes nothing
  and parity tests still pass. Also: `d?.key || "English"` fallbacks are near-useless as a signal —
  they resolve fine, so real i18n gaps are _no-lookup strings and raw enums_, which no parity check
  can see. Verify /ar in a browser.
- **`lib/format.ts` is server-only — client components must import `lib/format-money.ts`.**
  The barrel re-exports `formatCurrency` / `toCents` / `fromCents` from
  `./accounting/utils`, which imports `@/lib/db`. Pull the barrel into a
  `"use client"` module and Prisma lands in the browser bundle; the route then
  dies at runtime with "PrismaClient is unable to run in this browser
  environment". **Neither `tsc --noEmit` nor `next build` catches this** — both
  pass clean and the page only breaks when it renders, so a client-side money
  formatter must be verified in a browser. `format-money.ts` holds the pure
  Intl formatters (`formatMoney`, `formatCompactMoney`, `formatNumber`) and is
  safe from either side.
- **A "this month" / "today" bound built with `new Date()` + `setHours`/`setDate` is
  wrong for every non-UTC school.** Those resolve against the server's zone, which is
  UTC on Vercel, not the school's. Payroll's monthly total had this (fixed 2026-08-14):
  for a UTC+4 school the month started 4 hours late, so slips at the edge fell into the
  wrong month. Derive the bound from `School.timezone` with `schoolCalendarDayOf` +
  `schoolWallTimeToUtc` from `src/lib/timezone.ts`. **Assume siblings share it** — any
  finance figure scoped to a period is suspect until checked.
- **A `d?.key || "English"` fallback whose KEY does not exist is invisible to every parity
  test and renders English on /ar** (2026-08-15: 28 of them — the whole offline-payment form,
  the reports hub tiles). Parity checks compare en↔ar JSON; they cannot see a lookup that names
  a key neither file has. `pnpm tsx scripts/finance-i18n-audit.ts --list` resolves every
  `const x = dictionary…` alias to its slice and checks each `x?.key`; the ratchet in
  `src/tests/school-dashboard/finance/i18n-audit.test.ts` holds it at 0. It cannot see a
  PARAMETER-bound alias (`col?: Record<string,string>` in a columns file) — check those
  against the slice the table passes (fees/columns.tsx `lock`/`unlock` slipped that way).
- **`toast.error(result.error || label)` toasts the raw CODE.** Finance actions return
  `actionError(CODE)`, so `result.error` is `"UNAUTHORIZED"`, not a sentence — 29 sites showed
  enum codes to users in both languages. Use `actionErrorMessage(result.error, dictionary,
label)` from `@/lib/resolve-action-error` (never surfaces a bare `SNAKE_CASE`).
- **Never `error: error.message` from an action.** A Prisma/exception message is untranslatable
  and leaks internals; catch blocks return a code (`ZodError` → `VALIDATION_ERROR`, otherwise the
  matching `*_FAILED`). Tests that asserted the raw message were asserting the leak.
- **A "skip the first run" ref in a client effect loops under StrictMode + a server action.**
  Dev double-mount keeps the ref, the second run fires the fetch, the action's response
  re-renders the segment (a `loading.tsx` boundary remounts the table with a fresh ref) and
  the pair repeats — the invoice dashboard did 37 POSTs in 15s. Compare the filter VALUES to
  what was last fetched (as `usePlatformData` does); a boolean "first" flag is never enough.
- **`page.tsx` is not a "render surface" to `scripts/audit-untranslated.ts`**, so a fat page
  that composes `firstName lastName` raw is never flagged. Names go through `getNames`
  (batched, transliteration fallback), stored labels through `getLabels`; the fees lists now
  share `fees/rows.ts` for exactly this. In a `"use server"` action the viewer's language is
  `getDisplayLang()` from `@/components/translation/locale` — no prop-drilling.
- **The shared dashboard charts (`InteractiveBarChart`, `AreaChartStacked`, `RadialTextChart`)
  render shadcn SAMPLE DATA when given no `data`** — English month names, `desktop/mobile`
  series, on a page titled "Revenue & Expenses". The hub feeds them from
  `lib/monthly-series.ts` (school-month buckets via `date_trunc` in the school zone; the
  column is `timestamp(3)` holding UTC, so tag it `AT TIME ZONE 'UTC'` before shifting).
- **Posting-rules edits can retroactively break balance sheets** -- always add new rules rather than modify existing ones for historical integrity
- **Stripe webhook idempotency**: `webhooks/stripe/route.ts` uses event IDs to dedupe. Don't short-circuit it
- **Missing `schoolId` in a finance query = cross-tenant ledger corruption** -- multi-tenant boundary is stricter here than anywhere else in the platform
- **Plaid sandbox credentials** needed to test banking end-to-end on `demo.databayt.org`; without them, bank linking flow is blocked at the Plaid Link modal
- **Payroll approval is one-way**: once `APPROVED`, disbursement fires. Reject-before-approve is the only rollback path
- **Transaction boundaries**: fee assignment + journal entry + notification must be in one `db.$transaction` or state diverges. See `fees/actions.ts` for the canonical pattern

## Related Blocks

- [School Dashboard](../CLAUDE.md) -- parent block (14 sub-modules under this finance block)
- [Accounting engine](./lib/accounting/) -- double-entry primitives
- [Notifications](../notifications/) -- delivery pipeline for finance events
- [Admission](../admission/) -- feeds `FeeAssignment` at enrollment
- [Lumos](../../lumos/) -- uses same Stripe integration for subscriptions

## After You Finish

1. Update the sub-module's `ISSUE.md` with what you shipped / what's still open
2. Run `NODE_OPTIONS='--max-old-space-size=8192' pnpm tsc --noEmit` -- finance's type graph is heavy
3. If you touched posting-rules or Prisma schema: write a migration test before merging
4. Test credentials on `demo.databayt.org`: `accountant@databayt.org` / `1234` (finance scope) or `admin@databayt.org` / `1234` (full)
