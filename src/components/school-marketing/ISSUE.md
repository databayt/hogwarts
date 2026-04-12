# School Marketing — Production Readiness Tracker

**Status:** IN PROGRESS
**Completion:** 85%
**Last Updated:** 2026-03-19

---

## MVP Checklist

### Homepage

- [x] Hero section
- [x] Features grid
- [x] Faculty showcase
- [x] Testimonials
- [x] FAQ accordion
- [x] Newsletter signup
- [x] Footer
- [x] Houses, core values, special offers, events
- [x] Metadata generation

### Admission Landing

- [x] Hero with illustration
- [x] Values, process, requirements sections
- [x] CTA and dates sections
- [x] Shared section container

### Admission Portal

- [x] Campaign selector
- [x] Application form (multi-step: personal, contact, academic, guardian, documents, review)
- [x] Save/resume draft applications
- [x] Submit application action
- [x] Enrollment closed fallback
- [x] Continue application flow
- [x] Application status banner

### Admission Actions

- [x] Fetch active campaigns
- [x] Save/resume application session
- [x] Submit application
- [x] OTP-based status tracking (request OTP, verify, get status)
- [x] Inquiry form submission
- [x] Tour booking actions

### Apply (New Multi-Step Flow)

- [x] Application context provider
- [x] Validation context provider
- [x] Step header / progress bar
- [x] Error boundary
- [x] Personal step (form, config, types, validation, actions)
- [x] Contact step (form, config, types, validation, actions)
- [x] Location step (form, config, types, validation, actions)
- [x] Academic step (form, config, types, validation, actions)
- [x] Guardian step (form, config, types, validation, actions)
- [x] Attachments step (form, config, types, validation, actions)
- [x] Payment step (content, actions)
- [x] Success step
- [x] Application dashboard / draft management
- [x] Submit action
- [x] Cross-step validation helpers

### Visit Booking

- [x] Visit modal
- [x] Multi-step wizard (date, time, info, confirm)
- [x] Available dates/slots server actions
- [x] Booking creation with email notification
- [x] Availability hook
- [x] Validation schema
- [x] Config (slot duration, defaults)

### Academic Page

- [x] Hero with illustration
- [x] Programs, curriculum, stats sections
- [x] CTA section

### About Page

- [x] Content page
- [x] Config

### Testing

- [x] Admission validation tests
- [x] Application action tests
- [x] Validation helpers tests
- [x] Payment action tests

### i18n

- [x] Dictionary-driven labels across components
- [ ] Admission validation messages use dictionary (currently hardcoded English)

---

## Known Issues

### P1 — High

- ~~Hardcoded validation messages~~ (RESOLVED — old application schemas removed, new flow uses ValidationHelper)
- ~~Two parallel application flows~~ (RESOLVED — `admission/steps/` deleted, single flow via `application/`)

### P2 — Medium

- **No loading states on admission sections**: Landing page sections fetch data server-side but lack skeleton/suspense boundaries for streaming.
- **Tour booking email template**: `visit/actions.ts` calls `sendEmail()` but the email template content is not visible in this block -- verify template exists in `@/lib/email`.

---

## Enhancements (Post-MVP)

- Localize all admission validation messages via dictionary
- Consolidate `admission/steps/` and `apply/` into a single application flow
- Add analytics tracking for funnel conversion (campaign view -> application start -> submission)
- Add Suspense boundaries to admission landing sections for streaming SSR
- Add rich preview cards (Open Graph) per school via `metadata.ts`

---

**Last Review:** 2026-03-19
