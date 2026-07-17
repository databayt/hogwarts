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
last_audited: 2026-05-25
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
- [Stream](../../stream/) -- uses same Stripe integration for subscriptions

## After You Finish

1. Update the sub-module's `ISSUE.md` with what you shipped / what's still open
2. Run `NODE_OPTIONS='--max-old-space-size=8192' pnpm tsc --noEmit` -- finance's type graph is heavy
3. If you touched posting-rules or Prisma schema: write a migration test before merging
4. Test credentials on `demo.databayt.org`: `accountant@databayt.org` / `1234` (finance scope) or `admin@databayt.org` / `1234` (full)
