---
epic: 02
sprint: Q3-2026
title: Admission (onboarding wizard)
file_type: claude
owner: Abdout
maturity: Built
completion: 75
tracker: https://github.com/databayt/hogwarts/issues/314
docs: https://ed.databayt.org/en/docs/admission
last_audited: 2026-05-25
---

# Onboarding Block

## Context

15-step school creation wizard (172 files, 75% complete). Core flow functional. Blockers are external integrations (Maps, Stripe, CSV parser, DNS).

## Before You Start

1. Read `README.md` here for routes, file structure, and integration points
2. Read `ISSUE.md` here for P0/P1/P2 priorities and MVP checklist
3. Read `config.ts` and `config.client.ts` for step definitions
4. Read `config.ts` for step ordering (source of truth for navigation)

## Key Decisions

- Step ordering lives in `config.ts` ONBOARDING_STEPS array (also duplicated in `config.client.ts` -- P2 to consolidate)
- `ListingProvider` context injected at layout level (`src/app/[lang]/onboarding/[id]/layout.tsx`), not per-step
- Auth uses `getAuthContext()` from local `auth.ts`, NOT `getTenantContext()` -- school may not exist yet
- School creation is atomic via `$transaction` in `src/lib/school-access.ts` with idempotent responses
- Each step subdirectory has its own `form.tsx` (client) and optionally `action.ts`/`actions.ts` (server)
- After school creation, `createdByUserId` triggers immediate `schoolId` in JWT session

## Danger Zones

- `config.ts` step ordering -- changing the array order breaks all wizard navigation
- `actions.ts` (root) -- shared server actions with excessive `console.log` (P0 to fix)
- `use-listing.tsx` ListingProvider -- shared state for all steps; breaking this breaks everything
- Step names must match between route segments, config arrays, and step subdirectory names
- Do NOT add `schoolId` scoping here -- school does not exist yet during onboarding

## Related Blocks

- [Auth](../auth/CLAUDE.md) -- users authenticate before entering onboarding
- [School Dashboard](../school-dashboard/CLAUDE.md) -- onboarding creates the school that dashboard manages
- [School Marketing](../school-marketing/CLAUDE.md) -- onboarding configures the public school site

## After You Finish

1. Update `ISSUE.md` -- check off completed items, add new issues found
2. Update `README.md` -- if routes, files, or completion status changed
3. Run `pnpm tsc --noEmit` to verify no regressions
4. Test: `user@databayt.org` (pw: 1234) at `localhost:3000/en/onboarding`
