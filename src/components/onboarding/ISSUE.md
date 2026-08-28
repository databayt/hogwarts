---
epic: 02
sprint: Q3-2026
title: Admission (onboarding wizard)
file_type: issue
owner: Abdout
maturity: Built
completion: 75
tracker: https://github.com/databayt/hogwarts/issues/314
docs: https://ed.databayt.org/en/docs/admission
last_audited: 2026-08-08
---

## 2026-08-15 — import step: role gate + parity with /school/bulk (LOCAL, not pushed)

- [x] **SECURITY — `import/actions.ts` had no role gate.** `parseAndValidate`
      and `smartImport` accepted ANY signed-in user with a `schoolId`; server
      actions are public POST endpoints and `joinSchool` promotes USER → STAFF,
      so ordinary members could mass-create student accounts and mint their
      credentials. Now `requireOnboardingImporter()`: ADMIN/DEVELOPER only,
      **role read from the DB, not the JWT** — school creation promotes the
      User row to ADMIN but the session is only documented to refresh
      `schoolId`, so trusting `session.user.role` would lock the legitimate
      onboarding admin out of their own import. `requireSchoolRole` was NOT
      reused: it resolves the tenant via `getTenantContext()`, and onboarding
      runs on the main host with no subdomain.
- [x] Results panel shared with `/school/bulk`
      (`file/import/result-panel.tsx`) — credentials, warnings and parent
      access codes were returned by the action and dropped by this UI (its
      local `ImportResult` did not declare them).
- [x] `smartImport` revalidates the students listing + Applications tab
      (route patterns + `"page"`; it revalidated nothing before).
- [x] `onboarding.notifyFamilies` + `importWarnings|importAccessCodes|
importExpires|importDownloadLogins` dictionary keys (en + ar); the
      "Notify families by email" literal fallback is gone.
- [ ] `dictionary?: any` prop on `import/content.tsx` — should be the typed
      `Dictionary`.
- [ ] Verify the role gate against a real onboarding run
      (`user@balqalam.com` → create school → import) before deploy.

## 2026-08-14 — intake unification (LOCAL, not pushed)

- [x] `newcomers` lost its `student` role. It is a flow for the adults who join
      a school; the student branch wrote a stub `Student` (placeholder DOB
      `2010-01-01`, gender "Not Specified") outside `provisionStudent`, so the
      student had no Application, student code, fees or seat. A self-registering
      student now applies at `/{lang}/application`. The file came off
      `STUDENT_CREATE_ALLOWLIST` in `eslint.config.mjs`.
- [x] The `import` step gained a **"notify families" checkbox, default off**,
      threaded through `smartImport` into `importStudents`. When on, it passes
      `delivery: "queue"` so the email cron drains 50 per run.

Open / found while here:

- [ ] **`/newcomers` is a dead link.** `src/app/[lang]/my-school/page.tsx:32,43`
      redirects to it and `components/auth/user-button.tsx:230` links to it, but
      no route exists anywhere under `src/app`. The block is unreachable; only
      its server actions are live (they are public POST endpoints).
- [ ] The onboarding-import UI has **no dictionary wiring**: `dictionary.onboarding`
      contains only `newcomers`, so `dict.importData`, `dict.students`,
      `dict.importFailed` and the new `dict.notifyFamilies` all fall back to
      hardcoded English. Pre-existing; not papered over with an unreachable key.

# Onboarding -- Production Readiness Tracker

**Status:** 🟡 IN PROGRESS
**Completion:** 75%
**Last Updated:** 2026-08-08

---

## MVP Checklist

- [x] Dynamic routing with school ID (`/onboarding/[id]/...`)
- [x] ListingProvider context at layout level
- [x] Server actions with authentication (`getAuthContext`)
- [x] School ownership verification (`requireSchoolOwnership`)
- [x] Progress tracking and step navigation
- [x] Form validation with Zod schemas (all steps)
- [x] All 15 step UIs implemented
- [x] Database persistence for all editable steps
- [x] Error boundary and fallback handling
- [x] Atomic school-user linking with Prisma `$transaction`
- [x] Session refresh triggers for immediate `schoolId` access
- [x] Overview dashboard with school list
- [x] Newcomers onboarding modal
- [x] Schedule configuration step
- [x] Loading states for all step pages
- [ ] Maps API integration for location step
- [ ] Stripe integration for price step
- [ ] CSV/Excel parser for import step
- [ ] DNS provider integration for subdomain step
- [ ] Legal document templates

## Known Issues

### P0 -- Critical

- [ ] **Debug logging in actions.ts** -- Extensive `console.log` statements in server actions. Performance and security concern. Fix: wrap in `process.env.NODE_ENV === 'development'` check or remove.
- [ ] **Missing error boundaries on some steps** -- Some step components lack proper error handling for failed data fetches, risking white-screen failures.

### P1 -- High

- [ ] **Maps API not integrated** -- Location step has form UI but no geocoding, address autocomplete, or map picker. Requires Google Maps or Mapbox API key.
- [ ] **Stripe not integrated** -- Price and discount steps have UI but no payment processing backend. Requires Stripe Connect setup.
- [ ] **CSV import parser incomplete** -- Import step has UI but no file parsing logic. Needs CSV/Excel parser, column mapping, validation, and batch import.
- [ ] **DNS configuration missing** -- Subdomain step has form but no DNS provider integration. Needs Cloudflare/Route53 API, availability checking, and SSL provisioning.
- [ ] **Legal document templates missing** -- Legal step has consent UI but no actual terms of service or privacy policy documents.

### P2 -- Medium

- [ ] **HOSTING_STEPS defined in 3 locations** -- `host-footer.tsx`, `config.client.ts`, and `config.ts` all define step arrays. Should consolidate to single source of truth.
- [ ] **Action file naming inconsistency** -- Some steps use `action.ts` (singular), others use `actions.ts` (plural). Should standardize to `actions.ts`.
- [ ] **Invitation workflow for Join step** -- Join step lacks invitation code generation, role-based invitations, and approval workflows.
- [ ] **Legal document versioning** -- No version control for legal documents, no consent tracking with timestamps.

## Resolved Issues

- [x] **Wizard dropped the locale on every step (2026-08-08)** — Arabic users were silently switched to English mid-flow: clicking التالي on `/ar/onboarding/<id>/title` landed on `/en/onboarding/<id>/description`, and every step after stayed English. `FormFooter.handleNext` is locale-safe, but steps that override it via `setCustomNavigation({ onNext })` (so they can save before navigating) pushed bare `/onboarding/...` paths with no `[lang]` segment; `proxy.ts` then treats the path as locale-less and re-derives the locale from the `NEXT_LOCALE` cookie / `Accept-Language` header rather than the page the user was on — resolving to `en` for most Arabic users. Fixed by prefixing `params.lang` on every onboarding `router.push`, including the two shared hooks (`use-listing` `goToStep`/`goToOverview`, `use-onboarding` `goToStep`) so all steps are covered, plus the two `<Link href>` entry cards in `overview/new-school-options.tsx` which dropped it on the very first click. Verified end to end in Arabic on localhost. **When adding a step, never build an onboarding URL without the locale — prefer letting `FormFooter` navigate and use `onNext` only to save.**
- [x] **School-name step showed the wrong tenant domain (2026-08-08)** — the subdomain suffix was the hardcoded string `.databayt.org`, so a school signing up via balqalam.com was told the wrong URL for its own tenant. Now uses `rootDomainFromLocation()` from `src/lib/root-domain.ts` (which exists for exactly this and stays reachable on Vercel previews and localhost), resolved in an effect so SSR doesn't hydration-mismatch across the two roots.
- [x] School-level naming standardized to US terms (2026-07-12) -- English labels renamed Primary→Elementary, Secondary→High across the description/capacity steps, dictionaries, config fallbacks, and `formatSchoolType`/`formatSchoolLevel` (`util.ts`). Stored values (`primary`/`middle`/`secondary`/`both`) unchanged — display-only. Arabic labels already correct. Also fixed: `schoolLevel="middle"` previously provisioned ZERO year levels (catalog `setup.ts` now maps middle→Grades 7-9 + MIDDLE catalog level) and the configuration description form was missing the Middle option that onboarding offers.
- [x] Authentication fallback logic -- Implemented atomic transactions with Prisma `$transaction` in `school-access.ts`. Race conditions handled with idempotent responses.
- [x] Legacy code cleanup (Dec 2024) -- Removed `action.ts` (superseded), `use-optimized-listing.tsx` (unused), `enums.ts` (Airbnb legacy), `host-refactor-plan.md` (old planning doc).
- [x] External file consolidation -- Moved `onboarding-auth.ts` into block, deleted unused `onboarding-optimization.ts` and `onboarding.config.ts`.
- [x] Onboarding UX improvements -- Wizard create/update labels, tenant dialog, enrollment i18n.
- [x] Session refresh on school creation -- `createdByUserId` field, session sync triggers.

## Enhancements (Post-MVP)

- [ ] Customizable onboarding flows per school type
- [ ] A/B testing for step ordering
- [ ] Advanced analytics (conversion funnel, drop-off tracking)
- [ ] Multi-language onboarding content
- [ ] Bulk operations for admin (multi-school management)
- [ ] Step data caching and prefetching
- [ ] Unit tests for all validation schemas
- [ ] Integration tests for server actions
- [ ] E2E tests for critical onboarding paths
- [ ] Performance monitoring integration (Sentry)

---

**Last Review:** 2026-08-08
