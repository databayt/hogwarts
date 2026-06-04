---
epic: 14
sprint: Q3-2026
title: School Marketing
file_type: issue
owner: Samia
maturity: Built+Polish
completion: 85
tracker: https://github.com/databayt/hogwarts/issues/327
docs: https://databayt.org
last_audited: 2026-05-25
---

# School Marketing — Production Readiness Tracker

**Status:** IN PROGRESS
**Completion:** 90%
**Last Updated:** 2026-05-21

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
- [x] Application form (multi-step: attachments, personal, location, academic, fees — guardian in personal tabs, contact removed)
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

### Apply (Multi-Step Flow — 5 steps, auth-gated)

Active step order: **attachments → personal → location → academic → fees**. Guardian is folded into Personal as Student/Father/Mother tabs; the standalone Contact step was removed (email back-filled at submit). Submission fires from the Fees step.

- [x] Application context provider (per-user draft scoping)
- [x] Validation context provider
- [x] Step header / progress bar (3 phases)
- [x] Error boundary
- [x] Attachments step (form, config, types, validation, actions)
- [x] Personal step incl. Guardian tabs (form, config, types, validation, actions)
- [x] Location step (form, config, types, validation, actions)
- [x] Academic step (form, config, types, validation, actions)
- [x] Fees step (fee preview + submit)
- [x] Payment step (content, actions)
- [x] Offer step (accept/decline + registration fee)
- [x] Success step
- [x] Application overview / draft management
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

### Application Wizard — Gap Remediation (2026-05-22)

- [x] **i18n**: attachment rejection messages + aria-label now use `school.admission.apply.form.attachments.*` keys (en+ar); fixed success-modal dict path (was reading `admission` instead of `school.admission`, so the modal was always English); added `errors.rateLimited`. _Deferred: Stripe checkout line-item localization — payment path, low value/risk (brief Stripe-hosted redirect)._
- [x] **`lang` field**: added `lang String @default("ar")` to `Application` + `ApplicationSession`; applied to DB via `ADD COLUMN IF NOT EXISTS` + migration `20260522000000_add_lang_to_application`; applicant locale threaded `fees → submitApplicationAction → submitApplication` create.
- [ ] **Admin doc config not wired** — **DEFERRED (needs prerequisite).** `AdmissionCampaign.requiredDocuments` / `AdmissionSettings.documentRequirements` are read by `ai/completeness.ts` (`parseRequiredDocuments`) but **never written** — there is no admin UI to set them, so they are always null. Wiring the applicant attachments step to read them yields zero effect until the admin write-path exists, and the attachments form is a danger zone (S3 uploads). Prereq: build the settings/campaign UI to define required documents; then make the attachments slots config-driven (reuse `parseRequiredDocuments`) and enforce `requireDocuments`.
- [x] **Rate limiting** added to `saveApplicationSession` (new-token + email vector) and `submitApplication` (per user/email + school, 5/hour) mirroring the `status.ts` OTP pattern; surfaced via `errors.rateLimited`.
- [x] **Auth callback bug**: `(auth)/layout.tsx` now redirects to the clean `/${lang}/application` (was the internal `/s/{subdomain}/` path).
- [x] Minor: success-modal email sourced from auth session; post-submit localStorage cleanup uses the per-user `clearLocalDraft()`; `STEP_METADATA.contact` mislabel ("Payment" → "Contact") fixed. _(Dead contact/guardian nav branches kept intentionally — `STEP_NAVIGATION` is typed `Record<ApplyStep, …>`, so every union key is required.)_

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
