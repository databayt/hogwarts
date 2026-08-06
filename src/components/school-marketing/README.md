---
epic: 14
sprint: Q3-2026
title: School Marketing
file_type: readme
owner: Samia
maturity: Built+Polish
completion: 93
tracker: https://github.com/databayt/hogwarts/issues/327
docs: https://databayt.org
last_audited: 2026-08-03
---

## School Marketing — Public-facing school website and admission portal

### Overview

The school-marketing block powers the public website that each school gets on its subdomain (e.g., `demo.databayt.org`). It includes the marketing homepage, the admission landing page with campaign-based enrollment, a multi-step application form (apply), school visit booking, academic program pages, and an about page. All content is i18n-aware and renders within the `(school-marketing)` route group.

The homepage was rebranded on 2026-08-03 away from its Harry Potter theming to a
template a real school can actually publish. See "Homepage rebrand" below.

### Homepage is a zenda.com clone (2026-08-03)

The tenant homepage no longer renders `content.tsx`. It renders
`zenda-home/content.tsx` — a verbatim copy of zenda.com's homepage: Hero,
PhoneMockup, Rewards, Schools, HowItWorks, Testimonials, Benefits, CTA, plus
`hero-intro` and the four `*-scroll` files that drive their GSAP timelines. The
nav and footer (`template/zenda-nav`, `template/zenda-footer`) replace
`SiteHeader` across the entire block. Copy and imagery are zenda's, verbatim and
in English.

The Webflow CSS was already vendored and scoped before this work:
`src/styles/zenda-clone.css` (25,580 lines, generated from
`scripts/zenda-webflow-shared.css` + zenda's `globals.css` by
`scripts/scope-zenda.mjs`, imported in `src/app/layout.tsx`). Every selector in
it is prefixed `.zenda-clone`.

**Where `.zenda-clone` may go.** On the nav wrapper, the footer slot, and the
homepage body — never on an ancestor of `<main>`. The generated sheet contains
unlayered bare-tag rules (`.zenda-clone a`, `h1`, `p`, `button`, `img`,
`label`), and unlayered CSS wins against Tailwind's `@layer utilities`
regardless of specificity, so a sibling page rendered underneath that class gets
restyled with no way to opt out. The page-shell rules that would have forced
that (`zenda-clone.css:24193-24238`) are hand-ported **unscoped** into
`src/styles/zenda-shell.css` instead, which also owns `.nav_utility-wrap` (the
search/language/theme/account cluster zenda has no equivalent for). Regenerating
`zenda-clone.css` will not regenerate that file.

Because the clone's chrome runs edge to edge and gutters itself with
`.padding-global-v2`, `.marketing-container` came off the block layout and moved
onto the sibling pages' own `.school-content` divs.

`content.tsx` and the 16 sections below are **not deleted** — sibling pages
import them, and the Arabic homepage will need them when RTL lands. Their
history follows.

### Homepage rebrand (2026-08-03)

The homepage used to be Harry Potter fan fiction: Gryffindor/Ravenclaw/Hufflepuff/
Slytherin "houses" with a sorting quiz, Dumbledore and Snape as faculty portraits,
and a trust strip citing the Ministry of Magic and Gringotts Bank. Because this
block renders for **every tenant**, that copy shipped verbatim on real schools'
public websites. Replacing it was a correctness fix, not a taste one.

Sections now borrow their mechanics from four reference sites:

| Section          | Mechanic                                    | From     |
| ---------------- | ------------------------------------------- | -------- |
| `hero`           | full-bleed opening tile, capsule bottom     | apple    |
| `trust`          | edge-faded marquee                          | topmate  |
| `stats`          | scroll-triggered count-up                   | zenda    |
| `stages`         | 2-up promo tile grid, first tile spans both | apple    |
| `why`            | horizontal snap card rail                   | apple    |
| `life`           | irregular bento via column-span math        | topmate  |
| `academics`      | auto-advancing accordion + synced preview   | topmate  |
| `testimonials`   | translucent cards on a colored band         | topmate  |
| `admissions-cta` | colored capsule panel                       | almersal |

**Design system**: `src/styles/school-marketing.css` defines the display type ramp
(`.display-1..3`, `.display-intro`, `.eyebrow`), the section rhythm (`.section-y`),
the color bands (`.band-ink/warm/cool/sand` + `.band-muted`), `.capsule-t/b`, and
`.tile`. Use these instead of raw `text-*`/`font-*`/hex colors. The ramp carries an
`[dir="rtl"]` step-down because Arabic sets ~1.3x wider than Latin at equal px, and
zeroes letter-spacing (spacing breaks Arabic letter joins).

**No stock photography.** A shared template cannot ship photographs of a campus it
has never seen, so a school without an uploaded `branding.heroImageUrl` gets a
typographic ink panel, and tiles carry color rather than art. Faculty shows
departments and figures, never invented named individuals with portraits.

**The Harry Potter version is preserved on the `hogwarts` branch** (also tagged
`harry-potter-homepage-2026-08-02`), with the hogwarts site name and logo intact.

### File Structure

```
school-marketing/
├── zenda-home/                  # WHAT THE HOMEPAGE ACTUALLY RENDERS -- verbatim
│   │                            #   zenda.com clone, runs under `.zenda-clone`
│   ├── content.tsx              # Section order (Hero → … → CTA)
│   ├── hero.tsx                 # Only edited section: two CTA pills, not one
│   ├── hero-intro.tsx           # GSAP intro; also animates the nav's logo/links
│   ├── phone-mockup.tsx         # "You juggle life -- we handle fees"
│   ├── rewards.tsx              # + rewards-scroll.tsx
│   ├── schools.tsx              # + schools-scroll.tsx, schools-lottie.tsx
│   ├── how-it-works.tsx         # + hiw-scroll.tsx (marquee)
│   ├── testimonials.tsx         # Swiper slider
│   ├── benefits.tsx             # + benefits-scroll.tsx
│   ├── features-scroll.tsx      # Drives the phone-mockup assembly
│   └── cta.tsx                  # Closing card
│
│   # Everything below is the previous real-school template. Still live on the
│   # sibling pages (/about, /academic, /admissions) and needed for the Arabic
│   # homepage -- do not delete.
├── content.tsx                  # Root marketing page (assembles all homepage sections)
├── hero.tsx                     # Full-bleed opening tile (school photo or ink panel)
├── trust.tsx                    # Marquee of subjects taught
├── stats.tsx                    # Scroll-triggered count-up figures
├── stages.tsx                   # 2-up promo tile grid (Primary/Middle/Secondary)
├── why.tsx                      # Horizontal card rail of value propositions
├── life.tsx                     # Bento grid -- what a week looks like
├── academics.tsx                # Auto-advancing accordion + synced preview panel
├── faculty.tsx                  # Department cards + staff figures
├── testimonials.tsx             # Parent quotes on a colored band
├── admissions-cta.tsx           # Ink capsule CTA + 4 numbered steps
├── faqs.tsx                     # FAQ accordion (5/7 split, sticky heading)
├── newsletter.tsx               # Newsletter signup
├── format.ts                    # Locale-aware numerals (client-safe)
├── footer.tsx                   # Shared footer
├── houses.tsx                   # School houses display
├── core.tsx                     # Core values section
├── offer.tsx                    # Special offers
├── event.tsx                    # Event card
├── new-comers.tsx               # Newcomer welcome section
├── ready.tsx                    # CTA with gradient animation
├── lets-work-together.tsx       # Collaboration CTA
├── logo-cloud.tsx               # Partner logos
├── admission-process.tsx        # Admission process CTA
├── metadata.ts                  # Page metadata generation
├── types.ts                     # Shared School type
├── utils.ts                     # Shared utilities
│
├── admission/                   # Admission landing + portal
│   ├── content.tsx              # Admission page (hero, values, process, requirements)
│   ├── types.ts                 # ApplicationFormData, PublicCampaign, etc.
│   ├── validation.ts            # Zod schemas for all application steps
│   ├── application-status-banner.tsx
│   ├── actions/
│   │   ├── index.ts             # Re-exports all admission actions
│   │   ├── application.ts       # Campaign fetch, save/resume session, submit
│   │   ├── status.ts            # OTP-based status tracking
│   │   ├── inquiry.ts           # Inquiry form actions
│   │   └── tour.ts              # Tour booking actions
│   ├── sections/                # Admission landing page sections
│   │   ├── hero.tsx, hero-illustration.tsx
│   │   ├── stats.tsx
│   │   ├── journey.tsx                  # process + requirements, merged
│   │   ├── journey-switch.tsx           # IntersectionObserver for the switcher
│   │   ├── values.tsx, dates.tsx, cta.tsx
│   │   ├── faq.tsx, faq-accordion.tsx   # reads marketing.site.faqs
│   │   ├── dates-reveal.tsx             # IntersectionObserver for the timeline
│   ├── portal/                  # Application portal views
│   │   ├── campaign-selector-content.tsx
│   │   ├── application-form-content.tsx
│   │   ├── continue-application-content.tsx
│   │   └── enrollment-closed.tsx
│   ├── steps/                   # Multi-step form components
│   │   ├── step-personal.tsx, step-contact.tsx
│   │   ├── step-academic.tsx, step-guardian.tsx
│   │   ├── step-documents.tsx, step-review.tsx
│   ├── status/                  # Application status tracker
│   │   ├── status-display.tsx
│   │   └── status-tracker-content.tsx
│   ├── inquiry/                 # Inquiry form
│   │   └── inquiry-form-content.tsx
│   ├── tour/                    # Tour booking
│   │   ├── tour-wizard.tsx
│   │   └── tour-booking-content.tsx
│   └── shared/
│       ├── section-container.tsx
│       └── zenda-button.tsx     # zenda's EXPLORE pill, bilingual (.zenda-btn*)
│
├── apply/                       # Multi-step application form (new flow)
│   ├── index.ts                 # Barrel exports
│   ├── types.ts                 # ApplyStepProps, per-step data types
│   ├── application-context.tsx  # React context for application state
│   ├── validation-context.tsx   # Validation context provider
│   ├── validation-helpers.ts    # Cross-step validation utilities
│   ├── config.client.ts         # Step configuration (client-side)
│   ├── submit-action.ts         # Final submission server action
│   ├── apply-header.tsx         # Step header/progress bar
│   ├── error-boundary.tsx       # Error boundary wrapper
│   ├── personal/                # Step: personal info (form, config, types, validation, actions)
│   ├── contact/                 # Step: contact info
│   ├── location/                # Step: location/address
│   ├── academic/                # Step: academic history
│   ├── guardian/                # Step: guardian details
│   ├── attachments/             # Step: document uploads
│   ├── payment/                 # Step: payment (content, actions, tests)
│   ├── success/                 # Step: success confirmation
│   └── overview/                # Application dashboard/draft management
│       ├── application-dashboard.tsx
│       ├── draft-applications.tsx
│       ├── application-card.tsx
│       ├── apply-dashboard-client.tsx
│       ├── apply-overview-client.tsx
│       └── new-application-options.tsx
│
├── visit/                       # School visit booking
│   ├── visit-modal.tsx          # Booking modal
│   ├── actions.ts               # Available dates/slots, create booking
│   ├── validation.ts            # Visit form schema
│   ├── config.ts                # Slot duration, defaults
│   ├── index.ts
│   ├── hooks/
│   │   └── use-availability.ts  # Client hook for slot availability
│   └── steps/                   # Multi-step booking wizard
│       ├── date-step.tsx, time-step.tsx
│       ├── info-step.tsx, confirm-step.tsx
│
├── academic/                    # Academic programs page (zenda /for-schools)
│   ├── content.tsx              # hero → marquee → intro → programs → …
│   └── sections/
│       ├── hero.tsx             # Section shell + [data-zenda-tuck] marker
│       ├── hero-kinetic.tsx     # Splash + per-word converge entrance
│       ├── hero-art.tsx         # Building/stars Lottie + scroll-merge flyer
│       ├── marquee.tsx          # Three-row infinite word ticker
│       ├── intro.tsx            # White card — the building's landing slot
│       ├── programs.tsx, curriculum.tsx
│       ├── stage-accordion.tsx  # Curriculum's one-open-at-a-time stages
│       ├── stats.tsx, cta.tsx
│
├── about/                       # About page
│   ├── content.tsx
│   └── config.ts
│
└── shared/
    └── feature-card.tsx         # Reusable feature card
```

### Key Patterns

- **Applying is always free**: The wizard fees step is an informational preview only. No payment at application time. Payment happens post-acceptance (registration fee + tuition invoices).
- **Campaign-based admission**: Applications are tied to AdmissionCampaign records with date windows and grade eligibility.
- **Session-based drafts**: Applications can be saved and resumed via `saveApplicationSession` / `resumeApplicationSession`.
- **OTP status tracking**: sha256-hashed OTP with atomic attempt counter and oracle-closed design. Applicants check status via email OTP (no login required).
- **Single application flow**: `application/` (context-based per-step form). Old `admission/steps/` was removed.
- **Portal security**: All public writes rate-limited; tour TOCTOU-safe; new-lead notifications to ADMIN+STAFF.
- **Multi-tenant scoped**: All actions resolve schoolId from subdomain via `getTenantContext()`.

### Tests

- `admission/__tests__/validation.test.ts` -- validation schema tests
- `admission/actions/__tests__/application.test.ts` -- application action tests
- `apply/__tests__/validation-helpers.test.ts` -- cross-step validation tests
- `apply/payment/__tests__/actions.test.ts` -- payment action tests

### Status

**Completion:** 93% | **Open:** application-status-banner-client.tsx i18n migration; INQUIRY_SOURCES/DEFAULT_GRADES i18n migration; payment/content.tsx dead-file cleanup (see ISSUE.md)

### Agents & Skills

- `agent:growth` — content + SEO + community
- `skill:/content-calendar` — plan + review the calendar
