---
epic: 14
sprint: Q3-2026
title: School Marketing
file_type: issue
owner: Samia
maturity: Built+Polish
completion: 93
tracker: https://github.com/databayt/hogwarts/issues/327
docs: https://databayt.org
last_audited: 2026-06-13
---

# School Marketing — Production Readiness Tracker

**Status:** IN PROGRESS
**Completion:** 93%
**Last Updated:** 2026-06-13

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
- [x] AdmissionCTA + AdmissionDates rendered on /admissions
- [x] New-lead notifications to ADMIN+STAFF on inquiry/tour booking

### Admission Actions

- [x] Fetch active campaigns
- [x] Save/resume application session
- [x] Submit application
- [x] OTP-based status tracking (request OTP, verify, get status) — OTP now sha256-hashed; enumeration-oracle closed; atomic attempt counter
- [x] Inquiry form submission — new-lead notification dispatched to ADMIN+STAFF
- [x] Tour booking actions — TOCTOU oversell fixed; cancel/reschedule decrements by attendee count; enableTourBooking flag honored; rate-limited

### Apply (Multi-Step Flow — 5 steps, auth-gated)

Active step order: **attachments → personal → location → academic → fees**. Guardian is folded into Personal as Student/Father/Mother tabs; the standalone Contact step was removed (email back-filled at submit). Submission fires from the Fees step.

**PRODUCT DECISION (2026-06-13):** Applying is ALWAYS FREE. The fees step is now an informational free-application preview only — no payment method selection, no Bankak/Kashi icons. Payment happens post-acceptance only: registration fee on offer acceptance + tuition invoices.

**FEES STEP REDESIGN (2026-07-12):** The step shows the grade's term/year tuition (auto-generated per-grade FeeStructure, inheriting School.tuitionFee until customized via PricingRule). The "applying is free" banner was removed (free is the baseline, not advertised). Fee-preview matching now mirrors `fee-auto-assign` three-source matching + variant collapse (previously `{classId: null}` summed every grade's auto-generated structure); when no structures exist, the action fires `selfHealFeeProvisioning` and retries. A "discounts and scholarships may apply" line opens a dialog listing scholarships, early-payment hint, and the estimate disclaimer.

- [x] Application context provider (per-user draft scoping)
- [x] Validation context provider
- [x] Step header / progress bar (3 phases)
- [x] Error boundary
- [x] Attachments step (form, config, types, validation, actions)
- [x] Personal step incl. Guardian tabs (form, config, types, validation, actions)
- [x] Location step (form, config, types, validation, actions)
- [x] Academic step (form, config, types, validation, actions)
- [x] Fees step (informational free-application preview + submit — no payment collection at this stage)
- [x] Payment step (content, actions)
- [x] Offer step (accept/decline + registration fee)
- [x] Success step — 'password' relabeled 'Application Tracking Code'
- [x] Application overview / draft management
- [x] Submit action
- [x] Cross-step validation helpers
- [x] callbackUrl preserves full token'd offer path through login
- [x] Registration-fee success/fail banners; rate-limited; abandoned-checkout retry unblocked

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
- [x] **Rate limiting** added to `saveApplicationSession` (new-token + email vector) and `submitApplication` (per user/email + school, 5/hour) mirroring the `status.ts` OTP pattern; surfaced via `errors.rateLimited`. All public portal writes (inquiry, tour, OTP, submit) are now rate-limited.
- [x] **Auth callback bug**: `(auth)/layout.tsx` now redirects to the clean `/${lang}/application` (was the internal `/s/{subdomain}/` path).
- [x] Minor: success-modal email sourced from auth session; post-submit localStorage cleanup uses the per-user `clearLocalDraft()`; `STEP_METADATA.contact` mislabel ("Payment" → "Contact") fixed. _(Dead contact/guardian nav branches kept intentionally — `STEP_NAVIGATION` is typed `Record<ApplyStep, …>`, so every union key is required.)_

### Portal Hardening Pass (2026-06-13)

- [x] **OTP security**: sha256-hashed; enumeration-oracle closed; atomic attempt counter prevents brute-force
- [x] **Tour booking correctness**: TOCTOU oversell fixed; cancel/reschedule decrements by attendee count (not always 1); `enableTourBooking` flag honored on all entry points
- [x] **Rate limiting**: all public writes rate-limited (inquiry, tour, OTP, submit, save-session)
- [x] **New-lead notifications**: inquiry + tour booking fire in_app + email to ADMIN and STAFF roles
- [x] **AdmissionCTA + AdmissionDates**: now rendered on /admissions landing page
- [x] **Offer flow**: callbackUrl preserves full token'd offer path through login; registration-fee success/fail banners; abandoned-checkout retry unblocked

### P1 — High

- ~~Hardcoded validation messages~~ (RESOLVED — old application schemas removed, new flow uses ValidationHelper)
- ~~Two parallel application flows~~ (RESOLVED — `admission/steps/` deleted, single flow via `application/`)

### P2 — Medium

- **No loading states on admission sections**: Landing page sections fetch data server-side but lack skeleton/suspense boundaries for streaming.
- **Tour booking email template**: `visit/actions.ts` calls `sendEmail()` but the email template content is not visible in this block -- verify template exists in `@/lib/email`.

### Open — Deferred (2026-06-13)

- [ ] **application-status-banner-client.tsx i18n migration** — status banner still has hardcoded English strings; needs dictionary key migration
- [ ] **INQUIRY_SOURCES / DEFAULT_GRADES i18n migration** — constants still hardcoded in English; needs config factory pattern (see translation rules)
- [ ] **payment/content.tsx dead-file cleanup** — payment step file can be removed now that application is always free
- [ ] **Leads tab i18n sweep** — `src/components/school-dashboard/admission/leads/` was added without full i18n coverage (tracked in dashboard-admission block)

### Arabic (/ar) QA pass — apply wizard (2026-07-16)

First full **browser E2E of the apply wizard in `/ar`** (the gap the 2026-05-22 remediation left open). Verdict: the Arabic happy path **works end-to-end** — submitted a real `Application` (`lang=ar`, `channel=PORTAL`, Arabic name + `الصف الأول`, S3 document, correctly `schoolId`-scoped). RTL mirrors on every step; grade options are proper Arabic ordinals; Mapbox geocoding returns Arabic (`&language=ar`); "always free" holds (no payment UI).

Fixed in this pass:

- [x] **English error prose leaked to `/ar`** — `admission/actions/application.ts` returned hardcoded English in 3 places; now returns error CODES (`SUBMIT_FAILED`, `APPLICATION_DUPLICATE`, `APPLICATION_EMAIL_DUPLICATE`). `fees/content.tsx` resolved errors as `result.error || dict.failedToSubmit`, so the raw server string always won (truthy) and the dictionary never fired — replaced with an explicit code map + `MISSING_FIELD:` parser. New keys `applicationDuplicate` / `applicationEmailDuplicate` / `missingField` (en+ar).
- [x] **Silent dead Next button on Personal** — a guardian name (`fatherName || motherName`) is required to advance, but only the student fields carry `*`, so applicants filled every starred field and got no feedback. Added a `nameRequiredHint` shown exactly when personal is valid but guardian is missing. (Deliberately did NOT asterisk both parents — only one is required.)
- [x] Arabic copy: "المعلومات الشخصية للطالب ولي الامر" → "…للطالب وولي الأمر" (missing conjunction + hamza), all 5 occurrences.
- [x] Personal tab labels were hardcoded `isRTL ? "الطالب" : "Student"` → dict keys `tabStudent`/`tabFather`/`tabMother`.
- [x] `atom/modal.tsx` announced sr-only "Dialog"/"Dialog content" to screen readers in every locale → optional `title`/`description` props (defaults unchanged); success modal passes the translated string.

Still open from this pass:

- [ ] **Attachments requirement is late-binding** — the step allows zero uploads, but with `AdmissionSettings.requireDocuments = true` submission is blocked at the END with `DOCUMENTS_REQUIRED`, after 4 more steps. Deliberate per the comment at `admission/actions/application.ts:603-610`, but it dead-ends the applicant. Surface the requirement on the attachments step itself.
- [ ] **`validation-helpers.ts:19` docstring** claims dateOfBirth+gender are required; the code only checks `firstName && lastName && phone`.
- [ ] **Demo school currency** — fees rendered `١٠٢٬٣٠٠٫٠٠ US$` to a Sudanese parent. Data, not code: `prisma/seeds/constants.ts:66` already says `SDG` but the `schools` row was stale (local fixed by hand; **prod demo not verified**). Number formatting itself is correct (U+066C/U+066B) — do not "fix" it.
- [ ] **Mapbox `/ar`** (`src/components/atom/mapbox-location-picker.tsx`, SHARED atom) — map labels stay English (no language option set; style font is DIN Pro), opens on a world globe (`DEFAULT_CENTER=[0,20] DEFAULT_ZOOM=1.2`) rather than Sudan, and the lazily-loaded RTL-text plugin throws `TypeError: mo is not a function` ×2 (map still renders).
- [ ] **`documents[]` names stored in English** ("Degree"/"Transcript"/"ID") → Arabic admins see English document labels.
- [ ] Login "نسيت كلمة المرور؟" → bare `/reset`, missing the `/${lang}` prefix.

---

## Enhancements (Post-MVP)

- Add analytics tracking for funnel conversion (campaign view -> application start -> submission)
- Add Suspense boundaries to admission landing sections for streaming SSR
- Add rich preview cards (Open Graph) per school via `metadata.ts`

---

**Last Review:** 2026-06-13
