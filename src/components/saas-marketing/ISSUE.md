---
epic: 12
sprint: Q3-2026
title: SaaS Marketing (sales surface)
file_type: issue
owner: Mutaz
maturity: Built+Polish
completion: 85
tracker: https://github.com/databayt/hogwarts/issues/316
docs: https://ed.databayt.org/en/docs/sales
last_audited: 2026-05-25
---

# SaaS Marketing — Production Readiness Tracker

**Status:** IN PROGRESS
**Completion:** 75%
**Last Updated:** 2026-03-19

---

## MVP Checklist

- [x] Hero section with CTA
- [x] Feature showcase grid and detail pages
- [x] FAQ accordion
- [x] Logo cloud / partner logos
- [x] Story and mission sections
- [x] Blog content system (basic)
- [x] Server/client component separation
- [x] Feature page data for 10 categories
- [x] Section renderer system (9 section types)
- [ ] Typography compliance (semantic HTML, no hardcoded text classes)
- [ ] Remove/archive legacy backup-SDG folder
- [ ] Consistent file naming (kebab-case)
- [ ] Full i18n string extraction

## Known Issues

### P0 -- Critical

None

### P1 -- High

- Typography violations in `time.tsx`, `features/content.tsx`, and hero section using hardcoded `text-*` classes instead of semantic HTML
- Some `any` types and unsafe assertions remain

### P2 -- Medium

- Large static data in client components could move to server components
- Missing lazy loading for images in some sections
- Blog system needs MDX support, categories, tags, and author profiles
- No code splitting for pricing module

## Enhancements (Post-MVP)

- [ ] A/B testing framework for conversion optimization
- [ ] Interactive feature demos
- [ ] Exit-intent popups
- [ ] Social proof widgets
- [ ] CRM integration
- [ ] Structured data markup for SEO
- [ ] Analytics funnel tracking

---

**Last Review:** 2026-03-19
