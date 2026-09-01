# SaaS Dashboard Block

## Context

Platform operator control center (DEVELOPER role only): tenants, billing, domains, catalog, analytics, observability (80% complete, no blockers). Manages all schools from a single admin panel.

## Before You Start

1. Read `README.md` here for routes, file structure, and sub-feature inventory
2. Sub-features (`billing/`, `dashboard/`) have their own README.md/ISSUE.md -- check them
3. This block does NOT use `schoolId` scoping -- it operates across all tenants

## Key Decisions

- **No fabricated data (2026-06-14):** the operator dashboard must render REAL platform
  data only. The old `Math.random`/`defaultDataByRole`/persona placeholders were removed;
  detailed MRR/revenue/plan charts live on `/analytics`. Don't reintroduce sample data.
- **`planType` is stored mixed-case** ("basic" via onboarding/marketing, "BASIC" via
  operator `createTenant`). ALL planType comparisons/lookups MUST be case-insensitive.
- **Optimization backlog:** open findings tracked in `OPTIMIZATION_BACKLOG.md` +
  `.audit-findings.json` (181-finding audit; ~150 remain, mostly i18n + lower-priority
  correctness/deadcode).
- **The operator notification system exists now (2026-08-28).** The bell in
  `template/saas-header/content.tsx` is real — it replaced a dead `Mail` button
  and a "TODO: Restore when operator notification system is implemented"
  comment. It reuses the school-dashboard `NotificationBellIcon` unchanged;
  what made that possible is that a platform notification row is stamped with
  the **requesting school's** `schoolId` (a required FK a DEVELOPER cannot
  satisfy from their own session) and the DEVELOPER's `userId`. Writers go
  through `@/lib/platform-notification`. The read/mutate path has explicit
  DEVELOPER branches in `school-dashboard/notifications/{poll-actions,queries,
actions}.ts` and `use-notifications.ts` — the operator bell is **poll-only**
  and never opens a socket. `getSaasDashboardDictionary` loads the
  `notifications` namespace for it; that inclusion is deliberate, not drift.
- **Pending counts come from `catalog/pending-counts.ts`, not inline queries.**
  `getCatalogPendingCounts()` is React `cache()`-wrapped so the `(catalog)`
  layout's tab badges and the outer layout's sidebar badge share one set of six
  queries per request. Don't re-inline them.
- DEVELOPER role only -- auth guard at layout level, no other roles have access
- Operates across tenants: queries intentionally lack `schoolId` filter (unique in this codebase)
- Impersonation feature lets DEVELOPER act as school admin -- `impersonation-banner.tsx` shows active state
- Catalog management (subjects, books, materials, questions) is platform-wide, provisioned to schools during onboarding
- Sidebar navigation in `nav-main.tsx` -- different from school-dashboard sidebar

## Danger Zones

- No `schoolId` scoping is INTENTIONAL here -- do not add it (unlike every other block)
- Impersonation logic -- incorrect changes could let non-DEVELOPER roles impersonate
- Catalog changes propagate to all schools via `src/components/catalog/setup.ts`
- Billing/invoice data is sensitive -- verify RBAC before any billing action changes

## Related Blocks

- [School Dashboard](../school-dashboard/CLAUDE.md) -- individual school management (this block oversees all schools)
- [Onboarding](../onboarding/CLAUDE.md) -- new school creation triggers catalog provisioning
- [Auth](../auth/CLAUDE.md) -- DEVELOPER role gate and impersonation

## After You Finish

1. Update sub-feature README.md/ISSUE.md if they exist
2. Run `pnpm tsc --noEmit` to verify no regressions
3. Test: `dev@balqalam.com` (pw: 1234) at `localhost:3000`
