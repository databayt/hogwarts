---
epic: 02
sprint: Q3-2026
title: Admission (school dashboard)
file_type: issue
owner: Abdout
maturity: Built
completion: 90
tracker: https://github.com/databayt/hogwarts/issues/314
docs: https://ed.databayt.org/en/docs/admission
last_audited: 2026-06-13
---

# Admission — Production Readiness Tracker

**Status:** 🟢 PRODUCTION-READY CORE — full admit→accept→pay→enroll→fee flow verified; ~90% complete
**Real Completion:** ~90% (core pipeline end-to-end; Leads tab added; server-side search + #269 + WhatsApp breadth remain)
**Last Updated:** 2026-06-13
**Last Audited:** 2026-06-13 (production-readiness pass; tsc 0, ~1010 tests passing)
**Ship Issue:** [#239](https://github.com/databayt/hogwarts/issues/239)

> The 2026-05-21 audit found 3 live P0-class breaks. The 2026-05-22 pass fixed offer flow, PII/enumeration, and
> error-code UX. The 2026-06-13 production-readiness pass fixed the remaining core blockers: merit ranking (P0-3),
> AI pipeline (P1-1), placement UI (P1-7), ACCOUNTANT RBAC (P1-9), tour TOCTOU (P1-10), plus a full
> security/webhook/fee/invoice sweep. The admit→accept→pay→enroll→fee pipeline is now end-to-end verified.
> **PRODUCT DECISION (2026-06-12): applying is always free — no application fee at the wizard; payment only at the
> fee stage (registration fee on acceptance + tuition invoices).**
> See **Fixed** sections and **Open Issues** below.

---

## Fixed (2026-07-11) ✅ — production-readiness security pass (commit `f680ca7ed`, local)

Full 6-leg trace (portal · wizard · dashboard · offer+payment · enrollment · settings/AI/crons). Security + correctness subset landed; **remaining items tracked in [#376](https://github.com/databayt/hogwarts/issues/376)**.

- **P0 — dashboard SSR had NO RBAC.** The tab content components import `queries.ts` directly (no role param), so any authenticated tenant user (STUDENT/GUARDIAN/TEACHER) could open `/admission/*` and SSR-read applicant PII, uploaded ID/bank docs, merit ranks, and enrollment data. Fixed with a `/admission*` role matrix (`routes.ts`) **and** a hard role gate in `admission/layout.tsx` (`ADMISSION_VIEW_ROLES`).
- **P0 — `getAdmissionSettings` leaked bank name/account/IBAN/SWIFT** to any tenant user (read had no perm check). Added a `manageSettings` permission; gated read + write.
- **P0 — a withdrawn (declined) offer was still payable and enrollable.** Registration-fee actions now require a live `SELECTED`, non-expired offer; `declineOffer` clears `offerAccepted` and refuses once paid; `confirmEnrollment` requires `SELECTED`.
- **P0 — cross-tenant User annexation.** `confirmEnrollment`'s guest-User email lookup is now `schoolId`-scoped (`User` is unique per `(email, schoolId)`).
- **P1 — permission-denied → generic error.** New `FORBIDDEN` code + `isPermissionDenied()`, wired through all admission catch sites (was swallowed into "update failed").
- **P1 — status menu dead items.** New `status-machine.ts` single source; `VALID_STATUSES` now includes `ENTRANCE_SCHEDULED`/`INTERVIEW_SCHEDULED`; the detail dropdown offers only server-allowed transitions.
- `fetchCampaignOptions` missing `viewApplications` assertion → added.

> Note: several previously-listed "open" items were already resolved before this pass — the `confirmEnrollment` fee-matcher duplication (now calls `ensureStudentFeeAssignments(tx)`), and the `admission.ai.*`/`documentTypes.*` dict namespaces (present + bilingual). `bulk-placement.tsx` never existed. See #376 for the verified remaining ledger.

---

## Fixed (2026-06-22) ✅

- **`getCampaign` RBAC gap** — `getCampaign` was the only exported admission action without an `assertAdmissionPermission` check (it had `auth()` + `schoolId` scoping only), so any authenticated tenant user (STUDENT/GUARDIAN/etc.) could read campaign detail. Now gated at `manageCampaigns` to match its sole caller (the campaign edit form) and the sibling `create`/`update`/`deleteCampaign` actions. (`111c06ff8`)
- **`getApplications` type lie** — the client-refetch row map omitted `applicationFeePaid` even though `ApplicationRow` requires it and the SSR path supplies it, so client-side sort/paginate/filter returned the boolean as `undefined`. The query (`applicationListSelect`) already selects the field — added the missing map entry. (`111c06ff8`)

> Surfaced by a `/qa admission` audit (multi-agent adversarial QA trial). Both verified — tsc 0, 155 admission tests green. The audit run hit the Claude session limit mid-flight (its adversarial-verify phase collapsed), so these two were the hand-confirmed high-confidence findings; the broader 52-check matrix was not a clean signal. Other plausible-but-unverified finds from that run (WelcomeDialog illustrations 403; `assertAdmissionPermission` throwing inside try/catch → generic error code instead of forbidden; `getApplications` table clipped by `overflow-x-clip` at mobile) are NOT yet triaged.

## Fixed (2026-06-13) ✅

- **P0-3 Merit ranking** — new `updateApplicationScores` server action + inline score-entry UI (entrance/interview, 0-100). `generateMeritList` now computes a weighted `meritScore` (entrance 60% / interview 40%) and ranks by it (nulls last); batched writes. Merit tab is fully functional.
- **P1-1 AI document pipeline** — new cron `/api/cron/process-document-jobs` (every 10 min) drains the document-extraction queue. `classify.ts` is now budget-gated (`canUseAI`) and tracks usage. `classifyDocument` / `getDocumentProcessingStatus` are RBAC-gated. `bank-receipt-schema.ts` Zod fields made optional (eliminates spurious `generateObject` failures).
- **P1-7 Placement UI** — `PlacementDialog` wired into the enrollment table (section picker with seat counts). Admins can now manually place students into sections from the UI.
- **P1-9 ACCOUNTANT RBAC** — `permissions.ts` `VIEW_ROLES` and `getUIConfigForRole` updated to include ACCOUNTANT (read-only tabs). Server-side grant and UI config are now aligned.
- **P1-10 Tour slot TOCTOU** — `createTourBooking` / `rescheduleTourBooking` rewritten with conditional `updateMany` (assert `count === 1`) to prevent oversell under concurrent bookings. Cancel / reschedule now decrement by attendee count; `enableTourBooking` setting honored.
- **OTP security** — OTP values sha256-hashed before storage; enumeration oracle closed; attempt counter is atomic (no read-before-increment race).
- **Webhooks** — stripe/tap `catch` blocks now `releaseDedupeAndFail` (retry instead of silent 200 loss); `checkout.session.expired` clears stuck admission state; duplicate handlers removed; Tap `registration_fee` handled; collision-safe `receiptNumber`.
- **Public writes rate-limited** — `submitInquiry`, `createTourBooking`, `requestStatusOTP`, `saveApplicationSession` all rate-limited by IP. Offer-acceptance path rate-limited; abandoned-checkout retry unblocked.
- **callbackUrl** — now preserves the full token'd offer path through login (P0-2 nit resolved).

## Fixed (2026-05-22) ✅

- **P0-1 Offer flow restored** — `offer/page.tsx` now forwards the `?token=` accessToken into `OfferContent`, which threads it into all 5 mutations (was hardcoded `""`). Accept / decline / registration-pay validate again. _(The wizard is intentionally login-gated — the admit→accept→pay flow works end-to-end for a logged-in applicant arriving via the emailed token link.)_
- **P1-2 Tour PII leak closed** — `getBookingDetails` no longer returns booker name/email/student, and the public `/tour/[bookingId]` page no longer renders a Contact section.
- **P1-3a Enumeration endpoints removed** — deleted `getApplicationByNumber` and `getDraftApplications` (+ exports + stale test block), with tombstone comments.
- **P1-5 Raw error codes** — flipped toast precedence at 9 sites so the localized message wins over the raw `CODE`; added `campaignSaveFailed`/`campaignDeleteFailed` to both dictionaries.

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
- [x] Enrollment list with offer/fee/document status filters + section placement via `PlacementDialog`
- [x] `confirmEnrollment` transaction — creates Student + StudentYearLevel + fee assignments + invoices + guardians + documents atomically; registration-fee materialized on acceptance
- [x] Auto-suggest single matching section on enrollment; auto-fee-assign + invoice generation
- [x] Public application wizard (informational free-application preview; payment only at fee stage — registration fee on acceptance + tuition invoices)
- [x] Offer acceptance flow (admit → accept → pay registration fee) — end-to-end verified; callbackUrl preserves token'd path through login; rate-limited; abandoned-checkout retry unblocked
- [x] Merit ranking — `updateApplicationScores` UI (entrance/interview 0-100) + `generateMeritList` weighted score (60/40) with nulls-last ranking
- [x] AI document pipeline — queue drained by `/api/cron/process-document-jobs` (\*/10); budget-gated + RBAC-gated; bank-receipt optional-field Zod
- [x] Leads tab — dashboard surfaces `AdmissionInquiry` + tour bookings with status/follow-up/convert actions; new-lead notifications to ADMIN+STAFF
- [x] Public inquiry form + tour booking (oversell-safe) + OTP-gated status tracker (hashed, enumeration-oracle closed, atomic counter)
- [x] All public writes rate-limited by IP
- [x] RBAC server-side authorization (`authorization.ts`); ACCOUNTANT sees read-only tabs
- [x] i18n of notification/email templates + warning codes; email action-button URLs absolutified; per-channel preference enforced; directEmail for guest applicants
- [x] Admission CTA + AdmissionDates rendered on `/admissions` public portal
- [x] Cross-account draft-leak fix — drafts scoped by `userId` + `schoolId`

## What's broken or missing ❌

- [ ] **Server-side search on merit/enrollment tables** — `deferredSearch` computed but never sent to the fetcher; only client-side filters the current page (`merit-table.tsx`, `enrollment-table.tsx`)
- [ ] **WhatsApp channel coverage** — BUG-10: WhatsApp not wired for more admission events beyond current scope
- [ ] **Issue #269** — fee-structure creation as modal (not a blocking flow issue)
- [ ] `Application.lang` field — absent; violates Single-Language Storage, see P1-6 (schema flag)
- [ ] Onboarding price-step re-provision on tuition change — deferred
- [ ] `application-status-banner-client.tsx` + `INQUIRY_SOURCES`/`DEFAULT_GRADES` i18n migration — deferred
- [ ] `payment/content.tsx` dead-file cleanup — deferred

---

## Open Issues (updated 2026-06-13)

> Scope tags: **[safe]** = component/action edit, fixable under `.claude/rules/qa-scope.md`.
> **[flag]** = touches schema / auth-layout / `vercel.json` → needs Abdout's sign-off.

### P1 — High (remaining)

- **P1-6 — `Application` model has no `lang` field. [flag — schema]**
  Violates Single-Language Storage. `submitApplication` never sets `lang`; downstream `getText()` can't translate applicant content; the Student record derives lang via fragile Arabic-character regex sniffing (`actions.ts:968`, `application-detail-content.tsx:134`).

### P2 — Medium

- **Server-side search** — Merit & Enrollment search boxes don't query the server; `deferredSearch` is computed but never sent to the fetcher (`merit-table.tsx`, `enrollment-table.tsx`); only client-side filters the current page.
- **Issue #269** — fee-structure creation as modal (not a blocking flow issue).
- Settings page exposes only ~12 of ~30 `AdmissionSettings` fields. Unmanaged: portal toggles (`enablePublicPortal`/`enableInquiryForm`/`enableTourBooking`/`enableStatusTracker`), tour/interview config, `smsNotifications`, `stripeAccountId`, `documentRequirements`, `gradeMapping`.
- Settings portal toggles are not enforced (only `enableInquiryForm` checked action-side; others read nowhere).
- `confirmEnrollment` duplicates the fee-auto-assign matching logic from `src/lib/fee-auto-assign.ts` — extend the helper to accept a `tx` client and call it once.
- Status enum has `ENTRANCE_SCHEDULED` / `INTERVIEW_SCHEDULED` not wired into the status dropdown (`VALID_STATUSES`).
- Missing dictionary keys: `columns.applicationFee`, `toolbar.delete`, and the entire `admission.ai.*` / `admission.documentTypes.*` namespaces (AI doc UI is English-only regardless of locale).
- India-centric merit categories hardcoded (`General/OBC/SC/ST`, `merit-columns.tsx`) — irrelevant for the Sudan/Saudi market; make school-configurable.
- `application-status-banner-client.tsx` + `INQUIRY_SOURCES`/`DEFAULT_GRADES` i18n migration — deferred.
- Dead code: `tour-booking-content.tsx` (duplicate of `TourWizard`), `payment/content.tsx`, dead `contact` step route, `mailto:…@${subdomain}.edu` broken links.
- 13 prod `as any` (mostly `documents` JSON casts with no runtime validation).
- **WhatsApp breadth (BUG-10)** — WhatsApp channel not wired for more admission events beyond current scope.

### Previously Fixed (for reference)

- ✅ P0-1 Offer empty-token (2026-05-22)
- ✅ P0-3 Merit ranking + score entry UI (2026-06-13)
- ✅ P1-1 AI pipeline cron + RBAC + budget gate (2026-06-13)
- ✅ P1-2 Tour PII leak (2026-05-22)
- ✅ P1-3a Enumeration endpoints (2026-05-22); P1-3b OTP oracle + atomic counter (2026-06-13)
- ✅ P1-4 Public write rate-limiting (2026-06-13)
- ✅ P1-5 Raw error codes (2026-05-22)
- ✅ P1-7 Placement UI wired (2026-06-13)
- ✅ P1-8 AI budget gate + RBAC (2026-06-13)
- ✅ P1-9 ACCOUNTANT RBAC aligned (2026-06-13)
- ✅ P1-10 Tour TOCTOU oversell (2026-06-13)

---

## Tests & coverage (2026-06-13)

- **TypeScript:** tsc 0 errors.
- **Unit tests:** ~1010 passing across all new suites (admission + finance + webhook). New tests cover merit scoring, placement, AI pipeline gating, webhook dedup/retry, fee-inheritance cascade, OTP hashing, rate-limiting.
- **Coverage gaps (remaining):** server-side search wiring; `Application.lang` field tests.

## Recent progress (2026-05-22 → 2026-06-13)

Full production-readiness pass. Core: merit score entry + weighted ranking; AI cron + RBAC + budget gate; PlacementDialog wired; ACCOUNTANT RBAC aligned; tour TOCTOU + OTP hardening; all public writes rate-limited; callbackUrl token preservation; **PRODUCT DECISION: applying is always free** (fees step is informational; payment only at registration-fee + tuition stages). New: Leads tab (inquiries + tour bookings, status/follow-up/convert, ADMIN+STAFF notifications, ACCOUNTANT read-only). Webhooks: stripe/tap retry-on-catch, multi-installment `amountPaid`/PARTIAL allocation oldest-first, `checkout.session.expired` clears stuck state, Tap registration_fee, collision-safe receiptNumber. Schema: `InvoiceStatus +PARTIAL`, `UserInvoice +amountPaid +sentAt`, new indexes; migration-of-record at `prisma/migrations/20260612200000_invoice_partial_payment_and_indexes`.

---

**Last Review:** 2026-06-13
