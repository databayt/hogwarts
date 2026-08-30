---
epic: 12
sprint: Q3-2026
title: SaaS Marketing (sales surface)
file_type: readme
owner: Mutaz
maturity: Built+Polish
completion: 85
tracker: https://github.com/databayt/hogwarts/issues/316
docs: https://ed.databayt.org/en/docs/sales
last_audited: 2026-08-30
---

## SaaS Marketing — Public-Facing Landing and Conversion Pages

### Overview

Public-facing marketing components for the Hogwarts SaaS platform. Includes the main landing page (hero, features, testimonials, FAQs, logo cloud), feature showcase pages with detailed section renderers, the community resource hub (catalog-backed textbooks/exams/qbank/videos/materials/books), and content management. Handles the conversion funnel from visitor to registered school.

### File Structure

```
src/components/saas-marketing/
├── hero.tsx                        # Hero section with CTA
├── hero-illustration.tsx           # Hero visual — the balqalam quill (/feather.png), dark:invert
├── faqs.tsx                        # FAQ accordion
├── logo-cloud.tsx                  # Partner logos
├── story-section.tsx               # Story/about section
├── mission-cards.tsx               # Mission value cards
├── boost.tsx                       # Donations/patron section (NOT rendered on the homepage)
├── open-source.tsx                 # Open-source section (NOT rendered on the homepage)
├── lets-work-together.tsx          # Contact CTA
├── time.tsx                        # Time/clock component
├── clock.tsx                       # Clock display
├── access-check.tsx                # Access validation
├── actions.ts                      # Server actions
├── validation.ts                   # Zod schemas
├── types.ts                        # TypeScript types
├── config.ts                       # Static content config
├── util.ts                         # Utility functions
├── features/                       # Feature showcase system
│   ├── content.tsx                 # Feature page renderer
│   ├── hero.tsx                    # Feature hero
│   ├── details.tsx                 # Feature details
│   ├── constants.tsx               # FEATURES (85) + PLANNED_FEATURE_IDS + SHOWN_FEATURES (built+partial)
│   ├── feature-tabs.tsx            # Category-tabbed grid: SHOWN_FEATURES + FEATURE_IMAGES (local public/feature/*.png) → category fallback
│   ├── types.ts                    # Feature types
│   ├── util.ts                     # Feature utilities
│   ├── feature-icons.tsx           # Category fallback icon set (getCategoryIcon)
│   ├── icon-map.tsx                # Lucide name→component map (getIconComponent) — Glyph's fallback resolver
│   ├── sections/                   # Reusable section renderers + detail-page UI kit (clean, static, glyph-based)
│   │   ├── section-renderer.tsx
│   │   ├── hero-section.tsx
│   │   ├── feature-cards-section.tsx
│   │   ├── alternating-blocks-section.tsx
│   │   ├── benefits-grid-section.tsx
│   │   ├── checklist-section.tsx
│   │   ├── role-cards-section.tsx
│   │   ├── stats-bar-section.tsx
│   │   ├── cta-banner-section.tsx
│   │   ├── section-heading.tsx
│   │   ├── related-features.tsx    # Related-feature cards (reuses the `Card` atom + Glyph)
│   │   ├── feature-showcase.tsx    # zenda Services deck per feature (GSAP sticky cards; composes pastel panel + browser window + cropped shot + chips; bg-muted band)
│   │   ├── why-databayt.tsx        # apple why-Mac gallery (battle-card deck, paddle nav) on every detail page
│   │   ├── bottom-cta.tsx          # Clean centered closing CTA (border-top, dual buttons)
│   │   ├── info-card.tsx           # Clean content card mirroring the `Card` atom (Glyph + title + desc)
│   │   ├── glyph.tsx               # 'use client' bare glyph: real /feature PNG (dark:invert) else Lucide
│   │   ├── card-art.ts             # title→real-PNG keyword map (artForTitle), server-safe
│   │   └── card-icons.ts           # title→Lucide-name keyword map (iconNameForTitle) — Glyph fallback
│   ├── imported/                   # zenda/apple demo sections — UNREFERENCED since 2026-08-05 (superseded by feature-showcase + why-databayt)
│   │   ├── index.tsx               # <ImportedSections /> — stacks the six
│   │   ├── how-it-works.tsx        # zenda "Transform the way you pay fees" + $2Bn/150k/4.8
│   │   ├── parents-voice.tsx       # zenda testimonials (static grid)
│   │   ├── smarter-transactions.tsx# zenda services deck + 61/75/71 research stats
│   │   ├── more-ease.tsx           # zenda "Less Stress. More Ease." category cards
│   │   ├── apple-store.tsx         # apple Store hero + product rail (public/store/nav/*.png)
│   │   └── why-apple-mac.tsx       # apple "Why Apple is the best place to buy Mac" value props
│   └── page-data/                  # Per-feature page content
│       ├── showcase/               # Showcase decks (24 features) + WHY_CARDS — screenshots in public/features/shots/
│       ├── index.ts
│       ├── core.ts
│       ├── essential.ts
│       ├── management.ts
│       ├── lms.ts
│       ├── communication.ts
│       ├── erp.ts
│       ├── ai.ts
│       ├── advance.ts
│       ├── integration.ts
│       └── technical.ts
├── community/                      # Public learning-resource hub (see community/CLAUDE.md)
│   ├── queries.ts                   # Server-only catalog queries (six per-type)
│   ├── types.ts                     # Card view models + filter shape
│   ├── config.ts                    # RESOURCE_TYPES registry
│   ├── search-params.ts             # nuqs/server cache for ?curriculum&grade
│   ├── util.ts                      # gradesFromGradeRange, formatVideoDuration
│   ├── hero.tsx                     # full + compact variants
│   ├── filter-bar.tsx               # CLIENT — curriculum + grade selects (nuqs)
│   ├── hub-grid.tsx                 # 6 category cards on /community
│   ├── resource-grid.tsx            # generic grid switching by type
│   ├── empty-state.tsx
│   └── cards/                       # one per resource type
│       ├── textbook-card.tsx
│       ├── exam-card.tsx
│       ├── question-card.tsx
│       ├── video-card.tsx
│       ├── material-card.tsx
│       └── book-card.tsx
└── pricing/                        # Pricing (see pricing/README.md)
```

### Status

**Completion:** 75% | **Blockers:** Typography violations in several files, legacy backup-SDG code needs cleanup

### Positioning (2026-08-30)

The homepage sells "المنظومة الشاملة لإدارة المدارس والعملية التعليمية" — the
complete platform for schools and teaching. It replaced the older "أتمتة الأعمال
المملة / Automate the boring" line, which framed the product as busywork removal
rather than as one system. The change lands in `marketing.hero.title`,
`marketing.hero.subtitle` (now actually rendered by `hero.tsx` — it was dead
dictionary weight before), `marketing.features.title`/`subtitle`,
`marketing.storySection.quote` and `metadata.description`, in both languages.

The hero visual is the balqalam quill rather than the CDN Lottie: the homepage
leads with the system's own mark. `lottie-react` is still used elsewhere in the
repo — do not drop the dependency.

Two dead controls were removed from the homepage at the same time: the
`DownloadApp` section (both store buttons are permanently `disabled` until the
iOS/Android listings exist) and the mission card pointing at `/about`, a route
that only exists under the school-marketing subtree — on this site it fell
through to the auth matcher and bounced visitors to `/login`. Mission-card and
FAQ hrefs now carry `/${lang}`; bare ones silently flipped Arabic visitors to
English.

### Integration Points

- **Routes**: `src/app/[lang]/(saas-marketing)/` pages
- **Dictionary**: `src/components/internationalization/{en,ar}.json`
- **Pricing**: `src/components/saas-marketing/pricing/` (separate README)
- **Auth**: Login/signup flows for conversion

### Agents & Skills

- `agent:growth` — funnel, outreach, content
- `agent:revenue` — proposals, contracts, pricing
- `skill:/proposal` — client proposal generator
- `skill:/pricing` — tier + comparison
