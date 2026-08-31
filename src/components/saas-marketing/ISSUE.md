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
last_audited: 2026-08-31
---

# SaaS Marketing — Production Readiness Tracker

**Status:** IN PROGRESS
**Completion:** 75%
**Last Updated:** 2026-08-31

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
- [x] Per-feature showcase decks with real product screenshots (2026-08-05: 24 features, zenda Services pattern)
- [x] Why-Databayt value-props band on every detail page (apple why-Mac pattern)
- [x] Homepage repositioned to "المنظومة الشاملة" and the hero paragraph rendered (2026-08-30)
- [x] Dead homepage controls removed: DownloadApp store buttons, the `/about` mission card (2026-08-30)
- [x] Homepage replaced by the font.thmanyah.com clone, verbatim (2026-08-31)
- [ ] Typography compliance (semantic HTML, no hardcoded text classes)
- [ ] Remove/archive legacy backup-SDG folder
- [ ] Consistent file naming (kebab-case)
- [ ] Full i18n string extraction

## Known Issues

### P0 -- Critical

None

### P1 -- High

- **The homepage no longer sells the product.** It is a 1:1 clone of
  font.thmanyah.com — an Arabic type-specimen page — reproduced verbatim at the
  user's explicit request ("copy the exact homepage 100%, no tuning or
  tweaking"). Every string, link and asset is thmanyah's: the CTA downloads a
  woff2 bundle, the FAQ points at `ask.thmanyah.com`, the footer credits
  "شركة ثمانية للنشر والتوزيع" and links to `company.thmanyah.com`, and
  `/licenses` grants a licence to thmanyah's fonts. Nothing on it mentions
  balqalam, schools, pricing or sign-up, and none of it is databayt's to
  publish. Treat this as a staging/demo state: before it goes to production,
  either substitute databayt's own copy, assets and links, or move the clone to
  a non-root route and restore a selling homepage. The previous homepage is
  intact and one import away (`saas-marketing/content.tsx`).
- **Two P1 items only matter again once the old homepage returns:** the
  typography and `any`-type notes below describe components that are currently
  unwired.

- Typography violations in `time.tsx`, `features/content.tsx`, and hero section using hardcoded `text-*` classes instead of semantic HTML
- Some `any` types and unsafe assertions remain

### P2 -- Medium

- **Stale tracker link.** The `tracker:` frontmatter in this block's three
  records points at hogwarts#316, which is closed and is the PMF-pilots epic —
  not this block. No open issue tracks saas-marketing; the block-protocol
  "comment on the related issue" step has nothing to comment on. Open one and
  repoint the frontmatter, or drop the field.

- Feature detail body copy (page-data + showcase decks) is English-only; the `student` entry was rewritten in the honest/time-saved voice (2026-08-05) but the other 30 page-data entries still carry OpenEduCat-style copy with unshipped claims (RFID, GPS, hostel) — rewrite them the same way
- No showcase decks yet for: conference trio (google-meet/zoom/teams, demo has no meetings), whatsapp-integration (demo disconnected), sales, discussion, assignment, mobile-application — capture screens once demo data exists
- Large static data in client components could move to server components
- Missing lazy loading for images in some sections
- Blog system needs MDX support, categories, tags, and author profiles
- No code splitting for pricing module
- `DownloadApp` is built but unrendered — re-add it to `content.tsx` and fill
  `APP_STORE_URL` / `PLAY_STORE_URL` once the mobile listings go live

## Enhancements (Post-MVP)

- [ ] A/B testing framework for conversion optimization
- [ ] Interactive feature demos
- [ ] Exit-intent popups
- [ ] Social proof widgets
- [ ] CRM integration
- [ ] Structured data markup for SEO
- [ ] Analytics funnel tracking

---

**Last Review:** 2026-08-30
