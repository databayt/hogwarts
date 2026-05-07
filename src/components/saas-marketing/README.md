## SaaS Marketing — Public-Facing Landing and Conversion Pages

### Overview

Public-facing marketing components for the Hogwarts SaaS platform. Includes the main landing page (hero, features, testimonials, FAQs, logo cloud), feature showcase pages with detailed section renderers, the community resource hub (catalog-backed textbooks/exams/qbank/videos/materials/books), and content management. Handles the conversion funnel from visitor to registered school.

### File Structure

```
src/components/saas-marketing/
├── hero.tsx                        # Hero section with CTA
├── hero-illustration.tsx           # Hero visual
├── faqs.tsx                        # FAQ accordion
├── logo-cloud.tsx                  # Partner logos
├── story-section.tsx               # Story/about section
├── mission-cards.tsx               # Mission value cards
├── boost.tsx                       # Boost/benefits section
├── open-source.tsx                 # Open-source section
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
│   ├── constants.tsx               # Feature constants
│   ├── types.ts                    # Feature types
│   ├── util.ts                     # Feature utilities
│   ├── feature-icons.tsx           # Feature icon set
│   ├── icon-map.tsx                # Icon mapping
│   ├── sections/                   # Reusable section renderers
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
│   │   └── image-placeholder.tsx
│   └── page-data/                  # Per-feature page content
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

### Integration Points

- **Routes**: `src/app/[lang]/(saas-marketing)/` pages
- **Dictionary**: `src/components/internationalization/{en,ar}.json`
- **Pricing**: `src/components/saas-marketing/pricing/` (separate README)
- **Auth**: Login/signup flows for conversion
