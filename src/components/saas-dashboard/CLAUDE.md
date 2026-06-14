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
3. Test: `dev@databayt.org` (pw: 1234) at `localhost:3000`
