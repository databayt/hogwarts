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
last_audited: 2026-08-03
---

# School Marketing — Production Readiness Tracker

**Status:** IN PROGRESS
**Completion:** 93%
**Last Updated:** 2026-06-13

---

## MVP Checklist

### Homepage

- [x] Hero section
- [x] Testimonials
- [x] FAQ accordion
- [x] Newsletter signup
- [x] Footer
- [x] Metadata generation
- [x] **Replaced by a verbatim zenda.com clone (2026-08-03)** — the homepage now
      renders `zenda-home/` (8 sections + 5 GSAP scroll drivers) under the
      `.zenda-clone` CSS scope, with `template/zenda-nav` + `template/zenda-footer`
      as the chrome for the whole block in place of `SiteHeader`. `content.tsx`
      and its 16 sections stay on disk — sibling pages and the eventual Arabic
      homepage still need them.
- [x] **De-Pottered for real tenants (2026-08-03)** — Houses/core values/special
      offers/events sections deleted along with the Harry Potter copy that shipped
      on every tenant's public site. Replaced by `trust`, `stats`, `stages`, `why`,
      `life`, `academics`, `admissions-cta`. Old version preserved on the
      `hogwarts` branch. Superseded on the homepage by the zenda clone above, but
      still what every sibling page renders.
- [ ] Hero photography — schools with no `branding.heroImageUrl` fall back to a
      typographic ink panel. Fine as a default, but prompting admins to upload a
      hero image during onboarding would lift every tenant's homepage.
- [ ] Demo tenant figures are placeholders (18 per class, 94% placement, 62 staff).
      Real tenants must edit these; consider sourcing them from the DB where the
      numbers already exist (student/teacher counts are computable).

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
- [x] Minor: success-modal email sourced from auth session; post-submit localStorage cleanup uses the per-user `clearLocalDraft()`; `STEP_METADATA.contact` mislabel ("Payment" → "Contact") fixed. _(2026-07-18: the dead `contact`/`guardian` `ApplyStep` union members and their `STEP_NAVIGATION`/`STEP_METADATA` entries were removed outright — the `formData.contact`/`formData.guardian` DATA buckets are separate types and remain live.)_

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

### Zenda homepage clone (2026-08-03)

Verbatim port of zenda.com's homepage. The CSS was already vendored
(`src/styles/zenda-clone.css`, 25,580 lines, generated by
`scripts/scope-zenda.mjs`, loaded in `src/app/layout.tsx`), so this was a
component port, not a CSS port. Verified against a live dev server: all 8
sections render, 0 broken images, the video and Lottie play, the sticky footer
reveal drives `--reveal-corner`, the mobile hamburger works, and
`school-marketing/entry-points` sits at exactly its pre-existing 17 failed / 45
passed.

**Fidelity pass (2026-08-03, same day).** Ran zenda locally as a reference and
diffed computed styles and section geometry rather than eyeballing screenshots —
which is the only reason these were found, since the page looked right while
being wrong in three separate ways:

- [x] **The clone was rendering in system Helvetica.** `zenda-clone.css` carried
      an `@import` for DM Sans, but Next concatenates that file after
      globals.css and a non-leading `@import` is invalid, so it was always
      dropped. `"DM Sans"` measured identical to bare `sans-serif`. DM Sans and
      Poppins now come from `next/font` via `template/zenda-fonts.ts`.
- [x] **Zenda's fluid type scale was inert.** The scope script rewrites `html` →
      `.zenda-clone`, and `rem` resolves against the document root, so the
      viewport-derived root font size never applied. At 1200px every rem-based
      size was ~20% oversized (hero 70.4px against zenda's 58.7px). Restored on
      `html` by `zenda-home/root-scale.tsx`, homepage-scoped.
- [x] **The stylesheet cascade was inverted.** `scope-zenda.mjs` put the Webflow
      sheet before globals.css; zenda loads them the other way round, so the CDN
      wins ties there. Order flipped and the sheet regenerated. This also fixed
      `/features/[id]`, where `.section_services` had been 7225px against
      zenda's 3595px.

Verified after: every measured section matches zenda exactly at 1440px and
390px, total page height included, apart from the hero — taller by design,
because it carries two CTA pills where zenda has one.

**First-screen pass (2026-08-03, same day).** The settled hero already matched;
the _entrance_ did not. Both faults were invisible under `prefers-reduced-motion`,
which the test browser sets — the intro has to be measured with
`page.emulateMedia({ reducedMotion: 'no-preference' })` or it never runs.

- [x] **A preloader was eating the entrance.** `LoadingWrapper` hid the page
      behind a "0%…100%" counter for ~2s while the hero's GSAP timeline played
      out its 1.8s centred hold unseen, then faded the page in from
      `scale(0.98)` — arriving mid-split, 2% undersized and ~98px low. Removed
      from this block's layout.
- [x] **The logo never reached centre during the hold.** The reference's
      `x: "318%"` is a percentage of the element's own width and only centres
      its 173px wordmark; our smaller logo stopped ~300px short. Now measured
      against viewport centre.
- [x] **The hamburger sat alone in an otherwise empty bar** through the splash.
      Given a `hero-link` attribute so it joins the staggered nav fade-in.

Verified after: the intro matches zenda frame for frame — video hold
`62,44,1290` and heading `336` are exact, and the settled first screen is
box-for-box identical (nav, hero section, heading, paragraph, buttons, video).
Only the nav-link width differs, because "About" is a shorter word than "For
schools".

Known and left alone: the chatbot bubble sits over the bottom-right of the
first screen; zenda has nothing there. It is a product feature, not clone drift.

Open, deliberately deferred:

- [ ] **Arabic + RTL** — the whole clone is forced `dir="ltr"` and `/ar` serves
      the English page. Real RTL means either mirroring the Webflow CSS or
      rebuilding the sections; neither is worth doing while the copy is zenda's.
      Until then the homepage has no dictionary wiring, which is why
      `BASELINE_STATIC_GAP` in `src/tests/i18n/hardcoded-ratchet.test.ts` was
      raised 0 → 1. Put it back when this lands.
- [ ] **The copy is zenda's product, not a school's** — "The app parents love",
      "Download App" linking to zenda's App Store listing, testimonials from
      zenda's parents, "Trusted by 450+ institutions". Every tenant publishes
      this today.
- [ ] **Footer links point at zenda's routes** — `/for-schools`, `/parents`,
      `/blogs`, `/contact`, `/about-us`, `/privacy-policy` and the socials all
      404 or leave the site. Kept verbatim on request; needs remapping before
      any tenant sees it.
- [ ] **Imagery is hotlinked from zenda's Webflow CDN** — everything except the
      four files copied into `public/` (`images/hero/hero-poster.webp`,
      `videos/hero-3d.mp4`, `images/parents/img_1087.png`,
      `lottie/institutes.json`). A CDN change breaks the page.
- [ ] **lottie-web logs 4 `<rect> transform: matrix(NaN…)` console errors** from
      `institutes.json`. The animation renders correctly; inherited from the
      source asset, not introduced here.
- [x] **The school logo crowded the mobile menu** — zenda's logo is a wide
      wordmark, so the overlay was laid out around one and a tall school crest
      overlapped the first nav link. Fixed by the nav rework below.

Nav rework (2026-08-03, same day): the logo is now a 1.75rem mark with the
school name in a `.nav_logo-text` span beside it; links and hamburger group at
the end of the bar via `.nav_right`; the hamburger shows at every width (the
reference hid it above 991px) and opens `.nav_utility-wrap` as a dropdown
holding search / language / theme / account, so the bar keeps zenda's
logo-and-links proportions. All of it is CSS in `zenda-shell.css` under a
`.zenda-clone` prefix, plus the bars-to-X transition lifted out of the
component's inline `@media (max-width: 991px)`.

### Mobile edge-to-edge — hero + sticky header (2026-08-02)

- [x] **Hero photo left an 8px strip on both sides on mobile** — `hero.tsx` negated `--marketing-px` only, but a marketing page stacks two gutters (root `.layout-container` `--container-px` + `.marketing-container` `--marketing-px`), so the image landed at x=8 instead of x=0. Now `.bleed-page` (negates the new `--page-px` sum) with `lg:mx-0` unchanged; the mobile copy block moved `px-container` → `px-page` so the heading stays on the same rail as the rest of the page.
- [x] **Sticky header background stopped 16px short of both edges** — the full-bleed hero scrolled through the gap. `site-header/content.tsx` gained `.bleed-bg`, which paints the header's own background across the viewport from an absolutely positioned `::before`. Header markup and nav alignment are untouched, and because the bleed is out of flow it adds no scrollable width. Fixes desktop too (background now reaches both edges at every width). Verified 390px and 1440px, `/ar` + `/en`: `document.scrollWidth === innerWidth` in all four.

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
