# Onboarding -- Production Readiness Tracker

**Status:** 🟡 IN PROGRESS
**Completion:** 75%
**Last Updated:** 2026-03-19

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

**Last Review:** 2026-03-19
