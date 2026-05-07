# SaaS Marketing Block

## Context

Public-facing landing pages for the Hogwarts SaaS platform: hero, features showcase, pricing, community resource hub, testimonials, FAQs (75% complete). Blocker: typography violations, legacy code cleanup.

## Before You Start

1. Read `README.md` here for file structure and integration points
2. Feature pages use a section renderer pattern in `features/sections/` -- understand it before adding new sections
3. Check `features/page-data/` for per-feature content definitions

## Key Decisions

- Feature showcase uses a generic `section-renderer.tsx` that renders different section types from data
- Page data is static TypeScript objects in `features/page-data/` (not database-driven)
- Pricing component has its own README at `pricing/README.md`
- Dictionary-driven i18n via `src/components/internationalization/{en,ar}.json`
- Community is catalog-backed (textbooks/exams/qbank/videos/materials/books with curriculum + grade filters), public + anonymous — see `community/CLAUDE.md`

## Danger Zones

- Typography: several files have hardcoded `text-*` classes instead of semantic HTML (P2)
- `features/constants.tsx` -- feature list used across landing page; changes affect multiple sections
- `config.ts` -- static content config; mistranslations here affect the entire landing page

## Related Blocks

- [Auth](../auth/CLAUDE.md) -- conversion funnel leads to registration
- [Onboarding](../onboarding/CLAUDE.md) -- registered users enter onboarding to create a school
- [SaaS Dashboard](../saas-dashboard/CLAUDE.md) -- operator admin for the platform

## After You Finish

1. Update `README.md` if file structure changed
2. Run `pnpm tsc --noEmit` to verify no regressions
3. Test: visit `localhost:3000` as anonymous user
