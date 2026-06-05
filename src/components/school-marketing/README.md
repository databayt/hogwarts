---
epic: 14
sprint: Q3-2026
title: School Marketing
file_type: readme
owner: Samia
maturity: Built+Polish
completion: 85
tracker: https://github.com/databayt/hogwarts/issues/327
docs: https://databayt.org
last_audited: 2026-05-25
---

## School Marketing — Public-facing school website and admission portal

### Overview

The school-marketing block powers the public website that each school gets on its subdomain (e.g., `demo.databayt.org`). It includes the marketing homepage (hero, features, faculty, testimonials, FAQs, newsletter), the admission landing page with campaign-based enrollment, a multi-step application form (apply), school visit booking, academic program pages, and an about page. All content is i18n-aware and renders within the `(school-marketing)` route group.

### File Structure

```
school-marketing/
├── content.tsx                  # Root marketing page (assembles all homepage sections)
├── hero.tsx                     # Hero section
├── features.tsx                 # School features grid
├── faculty.tsx                  # Faculty showcase
├── testimonials.tsx             # Testimonial cards
├── faqs.tsx                     # FAQ accordion
├── newsletter.tsx               # Newsletter signup
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
│   │   ├── process.tsx, requirements.tsx
│   │   ├── values.tsx, dates.tsx, cta.tsx
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
│       └── section-container.tsx
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
├── academic/                    # Academic programs page
│   ├── content.tsx
│   └── sections/
│       ├── hero.tsx, hero-illustration.tsx
│       ├── programs.tsx, curriculum.tsx
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

- **Campaign-based admission**: Applications are tied to AdmissionCampaign records with date windows and grade eligibility.
- **Session-based drafts**: Applications can be saved and resumed via `saveApplicationSession` / `resumeApplicationSession`.
- **OTP status tracking**: Applicants check status via email OTP verification (no login required).
- **Two application flows**: `admission/` (older portal flow with steps) and `apply/` (newer per-step form with context providers).
- **Multi-tenant scoped**: All actions resolve schoolId from subdomain via `getTenantContext()`.

### Tests

- `admission/__tests__/validation.test.ts` -- validation schema tests
- `admission/actions/__tests__/application.test.ts` -- application action tests
- `apply/__tests__/validation-helpers.test.ts` -- cross-step validation tests
- `apply/payment/__tests__/actions.test.ts` -- payment action tests

### Status

**Completion:** 85% | **Blockers:** i18n dictionary keys for admission validation messages are placeholders (hardcoded English defaults in `validation.ts`)

### Agents & Skills

- `agent:growth` — content + SEO + community
- `skill:/content-calendar` — plan + review the calendar
