# Admission — Production Readiness Tracker

**Status:** 🟠 NOT READY — offer flow + key security/UX holes fixed (2026-05-22); merit ranking + AI pipeline still broken
**Real Completion:** ~78% (offer-acceptance restored; merit ranking + AI pipeline remain)
**Last Updated:** 2026-05-22
**Last Audited:** 2026-05-21 (full code + docs audit, 5-agent fan-out + manual verification)
**Ship Issue:** [#239](https://github.com/databayt/hogwarts/issues/239) — closed prematurely; its checklist is still all-unchecked and says 95%

> ⚠️ This tracker was previously marked "🟢 READY / 100%" (2026-04-11). That was inaccurate.
> The 2026-05-21 audit found 3 live P0-class breaks. A 2026-05-22 fix pass closed the offer-flow
> break (P0-1), the public-PII + enumeration holes (P1-2, P1-3a), and the raw-error-code UX (P1-5),
> all verified with `tsc` clean + no new test failures. Remaining blocker: merit ranking (P0-3).
> See **Fixed (2026-05-22)** and **Open Issues** below.

---

## Fixed (2026-05-22) ✅

- **P0-1 Offer flow restored** — `offer/page.tsx` now forwards the `?token=` accessToken into `OfferContent`, which threads it into all 5 mutations (was hardcoded `""`). Accept / decline / registration-pay validate again. _(Combined with P0-2 being reclassified as by-design — the wizard is intentionally login-gated — the admit→accept→pay flow now works end-to-end for a logged-in applicant arriving via the emailed token link.)_
- **P1-2 Tour PII leak closed** — `getBookingDetails` no longer returns booker name/email/student, and the public `/tour/[bookingId]` page no longer renders a Contact section. `createTourBooking`'s own post-booking confirmation is unchanged.
- **P1-3a Enumeration endpoints removed** — deleted `getApplicationByNumber` and `getDraftApplications` (+ exports + stale test block), with tombstone comments. _(P1-3b OTP-oracle/rate-limit hardening still open — see below.)_
- **P1-5 Raw error codes** — flipped toast precedence at 9 sites so the localized message wins over the raw `CODE`; added `campaignSaveFailed`/`campaignDeleteFailed` to both dictionaries. _(Follow-up: code-specific translation via `resolveActionError` + `common.errors` threading — deferred; needs dictionary + plumbing work.)_

---

## Scope of the feature (3 sides, ~146 files)

| Side               | Path                                                       | What it does                                                                        |
| ------------------ | ---------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Dashboard          | `src/components/school-dashboard/admission/` (48 files)    | Admin: campaigns, application review, merit, enrollment, settings, AI doc subsystem |
| Marketing portal   | `src/components/school-marketing/admission/` (30 files)    | Public: landing, inquiry, tour booking, status tracker (OTP)                        |
| Application wizard | `src/components/school-marketing/application/` (~68 files) | Public multi-step application form + payment + offer acceptance                     |

Shared model: `prisma/models/admission.prisma` (9 models). Cross-block rule: `.claude/rules/blocks/admission.md`.

---

## What actually works ✅

- [x] Campaign CRUD (create, read, update, delete) with default-fee fallback
- [x] Application list with search/filter/pagination (dashboard)
- [x] Application detail view + free status switching (submit/review/shortlist/select/reject/waitlist/withdraw)
- [x] Enrollment list with offer/fee/document status filters
- [x] `confirmEnrollment` transaction — creates Student + StudentYearLevel + fee assignments + invoices + guardians + documents atomically, with graceful-degradation warnings (`actions.ts:755-1488`)
- [x] Auto-suggest single matching section on enrollment; auto-fee-assign + invoice generation
- [x] Public application wizard (5 active steps: attachments → personal → location → academic → fees) with save-and-exit drafts
- [x] Application-fee payment (Stripe + cash + bank transfer) — the **pre-decision** fee path works (`application/payment/`)
- [x] Public inquiry form + tour booking + OTP-gated status tracker (read path is secure)
- [x] RBAC server-side authorization (`authorization.ts`)
- [x] i18n of notification/email templates + warning codes (bilingual `NOTIF` objects; error-code migration landed 2026-04-20)
- [x] Cross-account draft-leak fix — drafts now scoped by `userId` + `schoolId` (commit `d8961833`)

## What's broken or missing ❌

- [ ] **Offer acceptance flow** (admit → accept → pay registration fee) — broken, see P0-1/P0-2
- [ ] **Merit ranking** — ranks by a score that's never computed, see P0-3
- [ ] **AI document processing** (classification / extraction / completeness / merit scoring / bank-receipt) — built but never executes, see P1-1
- [ ] **Student → section placement UI** — placement components exist but are unreachable, see P1-7
- [ ] `Application.lang` field — absent; violates Single-Language Storage, see P1-6
- [ ] Dashboard error messages — show raw error CODES to users, see P1-5
- [ ] Rate-limiting / abuse protection on public writes, see P1-4

---

## Open Issues (audited 2026-05-21)

> Scope tags: **[safe]** = component/action edit, fixable under `.claude/rules/qa-scope.md`.
> **[flag]** = touches schema / auth-layout / `vercel.json` → needs Abdout's sign-off.

### P0 — Critical (break a core flow; LIVE)

- **P0-1 — ✅ FIXED (2026-05-22) — Offer accept/decline/pay always failed. [safe]**
  `offer/content.tsx` called all 5 mutations with an empty-string accessToken; the page read `?token=` but never forwarded it to `OfferContent`, so `validateAccessToken` rejected empty → every accept/decline/registration-payment failed 100% of the time.
  _Fixed:_ threaded `accessToken` from `offer/page.tsx` → `OfferContent` prop → into all 5 mutation calls. `tsc` clean.

- **P0-2 — Offer page is behind the login wall. → BY DESIGN (reclassified 2026-05-22).**
  Route `application/(auth)/[id]/offer/page.tsx` inherits `(auth)/layout.tsx:21`, which redirects unauthenticated users to `/login`. The wizard (incl. offer) is now **intentionally login-gated** (see `school-marketing/application/CLAUDE.md`); the OTP status tracker stays account-less. A guardian clicking the emailed offer link logs in once, then lands on the token-validated offer page — which now works after P0-1. Remaining nit (**P2**): that redirect's `callbackUrl` embeds `/s/${subdomain}/` (subdomain-URL anti-pattern) — should be `/${lang}/application`.

- **P0-3 — Merit list ranks by a column that's never populated. [safe, but feature work]**
  `Application.meritScore` is written **only** by `ai/merit-engine.ts:129,278`, which has **zero callers**. `entranceScore`/`interviewScore` have **no reachable writer and no data-entry UI**. The dashboard `generateMeritList` (`actions.ts:632`) only assigns `meritRank` ordered by `[meritScore, entranceScore, interviewScore]` — all null in practice. So the Merit tab shows `-` for every score and stamps a meaningless rank.
  _Fix:_ wire `computeCampaignMeritRanks` into `generateMeritList` (or a "Compute scores" action) **and** add UI to enter entrance/interview scores. Decide whether merit is AI-driven, manual, or both.

### P1 — High

- **P1-1 — AI document pipeline never runs end-to-end. [flag for cron + safe for UI]**
  (a) No `document-processing` cron in `vercel.json` (11 crons, none for the queue) → `processApplicationDocument`/`processApplicationBankReceipt` enqueue jobs that sit `pending` forever. (b) The only UI that triggers processing, `ai/document-card.tsx`, is **never rendered**. So classification/extraction/receipt-matching/merit-scoring never happen in normal operation. The whole `ai/` subsystem (~2,371 lines) is built but disconnected. ISSUE.md previously claimed this as ✅ done.
  _Fix:_ add the cron (or run inline), and render the document-card actions in `application-detail-content.tsx`.

- **P1-2 — ✅ FIXED (2026-05-22) — Tour booking detail leaked PII on a public route. [safe] 🔒**
  `getBookingDetails` + `tour/[bookingId]/page.tsx` rendered booker full name, email, and student name for a guessable `TOUR-YYMM-xxxxxx` booking number with no token/OTP/rate-limit.
  _Fixed:_ `getBookingDetails` no longer returns name/email/student; the public page's Contact section was removed. `createTourBooking`'s own post-booking confirmation is unchanged.

- **P1-3 — ✅ FIXED (a) / ⬜ OPEN (b) — Unauthenticated enumeration endpoints. [safe] 🔒**
  `getApplicationByNumber` returned `{hasApplication, maskedEmail}` (enumeration + partial-email oracle); `getDraftApplications(subdomain, email)` returned full draft `formData` scoped only by `schoolId+email`. Both dead but exported `"use server"` endpoints.
  _Fixed (a):_ deleted both (+ exports + stale test block), tombstone comments left. _Still open (b):_ harden `requestStatusOTP` (not-found oracle; rate-limit is email-only, checked after lookup; `attempts` guard is read-before-increment / racy).

- **P1-4 — No rate-limit / captcha on public writes. [safe] 🔒**
  `submitInquiry`, `saveApplicationSession`, `requestStatusOTP`, `createTourBooking` are all unthrottled by IP. `src/lib/rate-limit.ts` exists but isn't used by any admission action. Email-bomb + DB-flood vectors (each `saveApplicationSession` also sends a resume email).

- **P1-5 — ✅ FIXED (2026-05-22) — Dashboard showed raw error CODES to users (i18n/UX). [safe]**
  Server actions return `actionError(CODE)`; clients did `ErrorToast(result.error || fallback)`, so the raw code always won the `||` and users saw `OFFER_EXPIRED` etc. in all locales.
  _Fixed:_ flipped toast precedence at 9 sites (localized fallback now wins over the raw code) + added `campaignSaveFailed`/`campaignDeleteFailed` to both dictionaries for the two campaign sites that had no localized fallback. _Follow-up:_ code-specific translation via `resolveActionError` + `common.errors` threading (deferred — needs dictionary + component plumbing; most admission codes aren't in `common.errors` yet).

- **P1-6 — `Application` model has no `lang` field. [flag — schema]**
  Violates Single-Language Storage. `submitApplication` never sets `lang`; downstream `getDisplayText()` can't translate applicant content; the Student record derives lang via fragile Arabic-character regex sniffing (`actions.ts:968`, `application-detail-content.tsx:134`).

- **P1-7 — Student→section placement UI is unreachable. [safe]**
  `PlacementDialog` (`placement-dialog.tsx`) and `BulkPlacement` (`bulk-placement.tsx`) are never imported anywhere. The enrollment table shows a "needs placement" banner (`enrollment-table.tsx:180`) but exposes no placement action. Admins can confirm enrollment but can't manually place students into sections from the UI (only the single-section auto-suggest in `confirmEnrollment` works).

- **P1-8 — AI cost is effectively unbounded + an under-gated billable call. [safe] 🔒**
  AI budget tracking is a no-op: handlers never return `costUsd`/tokens → `AIUsageLog` never written → `getMonthlySpend` always 0 → `canUseAI` never blocks (and fails open on error). `classifyDocument` (`ai/actions.ts:34`) is a billable Claude call with **no role check** — any authenticated user can burn credits. `getDocumentProcessingStatus` (`ai/actions.ts:194`) does an in-tenant write with no role check.

- **P1-9 — RBAC inconsistency for ACCOUNTANT. [safe]**
  `authorization.ts` grants ACCOUNTANT `viewApplications` + `recordPayment`, but `permissions.ts` `getTabsForRole` (VIEW_ROLES excludes ACCOUNTANT) and `getUIConfigForRole` (NO_UI for ACCOUNTANT) give them no tabs and no UI. A granted server permission with no UI path. Decide the intended behavior and align both.

- **P1-10 — Tour slot oversell race (TOCTOU). [safe]**
  `createTourBooking` (`.../actions/tour.ts:165-189`) checks capacity _outside_ the transaction, then increments inside it. Two concurrent bookings can both pass the check and oversell a slot. Same in `rescheduleTourBooking`.
  _Fix:_ conditional `updateMany` (`where currentBookings + n <= maxCapacity`, assert `count===1`) or row lock.

### P2 — Medium

- Merit & Enrollment search boxes don't query the server — `deferredSearch` is computed but never sent to the fetcher (`merit-table.tsx:85`, `enrollment-table.tsx:84`); only client-side filters the current page.
- Settings page exposes only ~12 of ~30 `AdmissionSettings` fields. Unmanaged: portal toggles (`enablePublicPortal`/`enableInquiryForm`/`enableTourBooking`/`enableStatusTracker`), tour/interview config, `smsNotifications`, `stripeAccountId`, `documentRequirements`, `gradeMapping`.
- Settings portal toggles are not enforced anyway — only `enableInquiryForm` is checked (action-only, not page render); `enableStatusTracker`/`enableTourBooking`/`enablePublicPortal` are read nowhere.
- `confirmEnrollment` duplicates the fee-auto-assign matching logic from `src/lib/fee-auto-assign.ts` (acknowledged in `actions.ts:1109-1115`) — extend the helper to accept a `tx` client and call it once.
- `generateMeritList` does N individual `Promise.all` updates — batch into fewer writes for large campaigns.
- Bank-receipt Zod marks `transferDate`/`amount` required while the prompt says "omit if not visible" → spurious `generateObject` failures (`ai/bank-receipt-schema.ts:43-52` vs `:123`).
- Status enum has `ENTRANCE_SCHEDULED` / `INTERVIEW_SCHEDULED` that are not wired into the status dropdown (`VALID_STATUSES`, `actions.ts:445`).
- Missing dictionary keys → English always shown: `columns.applicationFee`, `toolbar.delete`, and the entire `admission.ai.*` / `admission.documentTypes.*` namespaces (AI doc UI is English-only regardless of locale).
- India-centric merit categories hardcoded (`General/OBC/SC/ST`, `merit-columns.tsx:190`) — irrelevant for the Sudan/Saudi market; make school-configurable.
- Hardcoded bilingual `NOTIF` objects in `actions.ts:39` and `offer/actions.ts:71` instead of dictionary.
- Dead code: `tour-booking-content.tsx` (duplicate of `TourWizard`), `cancelTourBooking`/`rescheduleTourBooking`/`getSlotsByMonth`/`isInquiryFormEnabled` (orphaned), dead `getStatusBadge`/`getOfferBadge` helpers in tables, dead `contact` step route, `mailto:…@${subdomain}.edu` broken links.
- Hardcoded hex color `#0969da` on the Update-Status button (`application-detail-actions.tsx:123`, no dark mode); raw `<img>` for applicant photo.
- 13 prod `as any` (mostly `documents` JSON casts with no runtime validation).

---

## Tests & coverage (2026-05-21)

- **TypeScript:** clean for admission paths.
- **Unit tests:** 168 pass / 46 fail / 214 total (15 files). Failures are **mostly test-rot, not product bugs**:
  - 4 dashboard files (`actions`, `enrollment-notifications`, `enrollment-pipeline`, `offer-expiry`) **fail to load** because `notifications/email-service.ts:10` does `new Resend(env.RESEND_API_KEY)` at module top-level and the test env has no key → `confirmEnrollment` / offer-expiry have **zero executing coverage**.
  - Payment + settings + submitApplication tests assert old English strings (broken by the 2026-04-20 error-code migration) and/or lack Stripe/Resend/`db.school` mocks.
  - ⚠️ One **possible real regression**: `validateContactStep` now returns `true` with missing email/country/motherName (`validation-helpers.test.ts`) — confirm if intended (draft-friendly) or a bug.
- **Coverage gaps (no tests):** AI subsystem (dashboard), tour booking, payment webhook; `confirmEnrollment` transaction effectively untested at runtime (file won't load).

## Recent progress since last doc update (2026-04-11 → 2026-05-21)

25 commits. Highlights not previously reflected: full i18n of notification/email templates + **error-code migration** (`d850ebe8`, `d51ca44d`); fee-structure & payment warnings surfaced in enrollment (`a84282d1`); offer-token link fix + classroom sync + **fee auto-provisioning** (`1cacd32a`); **fee-preview step** added to the wizard (`1d2e00b8`); **Bankak** payment provider + webhook models (`fbda2d3a`); role-aware **RBAC sweep** (`83cf3d93`); **cross-account draft-leak security fix** (`d8961833`); schema `previousMarks`/`previousPercentage` Decimal→String (`c64752fa`); parallelized submission + async emails (`ab80cce9`); save-and-exit / session restore (`7ada15f7`).

## Suggested remediation order

1. **P0-1** (offer empty-token) — highest value, safest fix; restores the entire admit→pay conversion. **[safe]**
2. **P1-5** (error-code → `resolveActionError`) — one repeated pattern, fixes the error UX in every locale. **[safe]**
3. **P1-2 + P1-3** (tour PII + enumeration endpoints) — security; delete/gate the offending actions. **[safe]**
4. **P0-2** (offer out of `(auth)`) + **P1-1 cron** + **P1-6 `lang`** — batch the structural/schema/config items for Abdout. **[flag]**
5. **P0-3** (merit) + **P1-7** (placement UI) — decide product intent, then wire. **[safe, feature work]**
6. Test hygiene: lazy-init Resend so the 4 dashboard files load; refresh assertions to error codes.
7. P2 sweep: search wiring, settings coverage, dead-code removal, missing dict keys.

---

**Last Review:** 2026-05-21
