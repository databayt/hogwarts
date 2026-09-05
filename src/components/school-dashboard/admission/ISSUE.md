---
epic: 02
sprint: Q3-2026
title: Admission (school dashboard)
file_type: issue
owner: Abdout
maturity: Built
completion: 96
tracker: https://github.com/databayt/hogwarts/issues/314
docs: https://ed.databayt.org/en/docs/admission
last_audited: 2026-09-04
---

# Admission — Production Readiness Tracker

**Status:** 🟢 PRODUCTION-READY CORE — full admit→accept→pay→enroll→fee flow verified twice; ~96% complete
**Real Completion:** ~96% (2026-09-04 pass closed the money/expiry/notification/role P0s; the account model, interview scheduling and tour mail remain product work)
**Last Updated:** 2026-09-05 (intake pass — see the section below; 2026-09-04 production pass follows)
**Last Audited:** 2026-09-04 (four parallel traces: finance, notifications, roles + family surfaces, i18n/RTL/mobile; tsc 0; 428 admission-area tests passing)
**Ship Issue:** [#239](https://github.com/databayt/hogwarts/issues/239)

---

## 2026-09-05 — intake pass: four channels, one assembly point (LOCAL, not deployed)

Read with `listings/students/ISSUE.md` (same date). The ask was to trace adding
a student through every channel and make everything after `provisionStudent`
one shared path. Browser-verified (ADMIN + applicant) on the local demo:
wizard → credentials dialog → Applications tab → Assign Section; portal
SUBMITTED → SHORTLISTED → SELECTED → family accepts → Confirm Enrollment →
student created + graded + notified. Fixed here:

- [x] **P0 — crons did not run in production.** `vercel.json` is `crons: []`
      and only the conference jobs were bridged, so fee-due (reminders,
      offer-expiry flip, unplaced alerts), fee-overdue, the email drain and
      the document-AI queue were dead. `.github/workflows/admission-crons.yml`
      bridges the four; `processPendingEmailNotifications` carries an age gate
      (`EMAIL_QUEUE_MAX_AGE_DAYS = 3`) that retires the ~20k stale rows before
      the first send. Activates on the next push of `main`.
- [x] **P1 — guardian WhatsApp written as email.** The public wizard's
      guardian tab collects WhatsApp in the `*Email` columns; `confirmEnrollment`
      passed it as `email` → `Guardian.emailAddress = "+249…"`, enrollment mail
      to a phone number, and a father + mother sharing a household number
      collapsed into ONE guardian (upsert by address). `splitGuardianContact`
      classifies by shape; `createOrLinkGuardian` takes `whatsapp`; the detail
      page labels the value "WhatsApp".
- [x] **P1 — reminders never fired for unscheduled fees.** fee-due's invoice
      arm skipped every invoice whose assignment merely EXISTED (all of them);
      it now skips only assignments reminded in the same run. fee-overdue also
      reads invoice due dates. Both crons stop chasing archived students.
- [x] **P1 — `extractGradeNumber("الصف الثاني عشر") === 2`.** Arabic ordinals
      matched in insertion order; longest wins now. Grade 12 applicants
      written in Arabic resolved to Grade 2 at enrollment, fee preview and
      placement.
- [x] **Placement for every channel.** `placeStudentInSection({ studentId })`
      and `getAvailableSectionsForPlacement({ gradeId })` — an empty label used
      to match every section; the students list reuses `PlacementDialog`
      (controlled `sections` mode) for direct-admit / imported students.
- [x] `NO_CLASSES_FOR_GRADE` joined the enrollment warning codes (translated).
- [x] Platform tables adopt the server's rows after `router.refresh()`
      (`usePlatformData`) — a confirmed enrollment row kept offering "Confirm
      Enrollment" until a hard reload. With a client search/filter active the
      hook refetches instead (the server page is always unfiltered, and
      adopting it replaced a search result with the whole list).
- [x] **Guardian types matched by role.** `createOrLinkGuardian` (the writer
      behind `confirmEnrollment`, the student wizard and the CSV imports)
      upserted the type by its exact English name, so an Arabic-seeded school
      (`الأب`/`الأم`) grew a second `father`/`mother` row per role and every
      "has a parent" check keyed off the English one missed the seeded links.
      It now reuses any existing spelling (`guardianTypeNamesForRole`) —
      `src/lib/guardian-utils.ts`, `src/tests/lib/guardian-utils.test.ts`.

Found, not fixed:

- [ ] **Graded but unbilled students are invisible.** The demo campaign is
      2026-2027; all 16 active fee structures are 2025-2026, so the PORTAL
      enrollment above produced zero fee assignments with only a transient
      warning toast. Needs a fourth arm in fee-due part D + an "unbilled"
      chip (see students ISSUE.md).
- [ ] Registration fee: no 2026-2027 structure carries one on the demo, so the
      offer page correctly skipped the payment step — the paid path was
      verified on 2026-09-04, not re-run today.
- [x] ~~Row menus in the enrollment table were stale after an action~~ —
      `usePlatformData` adopts the server's rows (content signature; the
      identity version looped). The Enrollment tab's Assign Section dialog
      also closed on its own section fetch (row-cell `useState` wiped by the
      table remount) — it is now hosted once per table from
      `placement-store.ts` + `placement-dialog-host.tsx`, shared with the
      students list. Browser-verified: APP-2026-6ZH1DP placed in
      "الصف الأول - ب" with 4 class enrollments and a placement notice.

## 2026-09-04 — production pass (LOCAL, six commits, not deployed)

A second full trace after 08-15 — four parallel audits (finance, notifications,
roles + parent/student surfaces, i18n/RTL/mobile) reconciled against the code,
then fixed in slices, each committed on its own. The condensed table is in
`content/docs-en/admission.mdx` → "The production pass, 2026-09-04".

Shipped:

- [x] **P0 — accepted offers no longer expire** (`f8a16b718`). The fee-due cron
      flipped every SELECTED offer past `offerExpiryDate` to EXPIRED, accepted +
      paid ones included; `confirmEnrollment` then refused them and the family
      saw "offer expired". The deadline binds ACCEPTANCE: cron flip + reminders,
      `confirmEnrollment`, `getOfferDetails` and all four payment actions apply
      the same `offerAccepted` exemption. (The cron had been dead in prod until
      09-03 — its first live run would have swept every waiting family.)
- [x] **P0 — registration fee books as a deposit** (`ef1cee599`). The ledger
      step matched the ANNUAL assignment (auto-provisioned per-grade structures
      carry the registration component inside their total) and flipped it to
      PAID; now PARTIAL unless the payment covers `finalAmount`; `Payment.currency`
      snapshotted. The offer quote uses `offer/fee-structures.ts` — the same
      matching arms + one-variant-per-grade rule as `ensureStudentFeeAssignments`
      — so the amount on the offer page equals the invoices. Atomic status
      flips (`status: "SELECTED"` / `registrationFeePaid: false` in the where).
- [x] **P1 — notifications land where the family can act** (`b3ed3df0f`).
      Applicant notices linked `/admission` (staff-only → role gate), leads
      linked `/admission/inquiries|tours` (404). Applicant lang =
      `Application.lang` (status notices, fee paid, placement, offer email).
      `resolveActionUrl` is root-domain aware + locale-prefixed; Stripe/Tap
      return URLs via `tenantUrl`. Inline email sends re-check the user's
      per-channel preference (`shouldSendNotification` exported). Cash/bank/
      wallet confirmation goes through `settleRegistrationFee` (ADMIN +
      ACCOUNTANT told; method-aware copy; family in their language).
      `feesPending` counts `registrationFeePaid`.
- [x] **P1 — role gates match the server** (`efa309dd3`). ACCOUNTANT no longer
      sees the status menu / Assign Section; STAFF no longer sees Generate Merit
      List / Confirm Reg Payment. `registration-methods.ts` is the ONE manual-
      rail list (the row copy lacked bankak/cashi, so wallet intents had no
      confirm action). Sidebar admits ACCOUNTANT + DEVELOPER. Grid cards show
      translated status. CSV export wired for Applications + Enrollment.
- [x] **P1 — the family sees where they stand** (`55381b1d9`). Rejection /
      waitlist note (`StatusReasonDialog` → `reviewNotes` → notice + tracker).
      Tracker shows the offer link + registration-fee checklist. Offer page
      restores a manual intent after reload and takes a transfer receipt
      (`submitRegistrationFeeProof` → `registrationFeeProofUrl`, linked for the
      accountant). Applicant card fee line. Re-offer resets unpaid state +
      extends the token. OTP bound to email.
- [x] **P2 — i18n/RTL/mobile** (slice 6): `rtl:flex-row-reverse` double
      reversals removed (apply-header, error-boundary, application-card);
      campaign form `grid-cols-1 sm:grid-cols-3`; `ar-SA` → `ar`; dialogs get
      `max-h-[85vh] overflow-y-auto`; review panel `border-s` + sr-only close;
      tour confirmation date in the school's language; dead `FORM_STEPS` and
      the Hogwarts fallback copy deleted; two missing dict keys added.

- [x] **P1 — found in the browser check, not by the audits**: `/application`
      hid a family's submitted application behind "Enrollment is closed" the
      moment the campaign's end date passed (the demo campaigns end 08-31 —
      exactly the case). Their applications now render first; the closed
      page is only for a family with nothing on file. And the sidebar's
      Admission entry was a dead end for STAFF/ACCOUNTANT (`/admission` was
      admin-only in `routes.ts`); the index now lands them on Applications.

Verified wrong from the audits (not changed): the cash-confirm action DID have
a UI caller; `submitApplication` already maps the sibling P2002 to
`APPLICATION_DUPLICATE`; the `INQUIRY_SOURCES`/`DEFAULT_GRADES`/status-banner
i18n items were already localized.

Open — product decisions and follow-ups (details in the docs table):

- [ ] **Account model** — the applicant account becomes the STUDENT
      (`provisionStudent` promotes `Application.userId`); one parent, two
      children is blocked by `@@unique([schoolId, campaignId, userId])`.
- [ ] **Interview / entrance date, time, venue** — no schema columns; needs DDL
      (`interviewAt`, `interviewLocation`) + a scheduling dialog + a dated notice.
- [ ] **EXPIRED notice** on the cron flip (family + admin roll-up).
- [ ] **Tour confirmation email + day-before reminder** (only cancel/reschedule
      templates exist).
- [ ] **Out-of-request links** (crons/webhooks) fall back to `databayt.org`;
      needs the school's root recorded on `School`.
- [ ] **Notification copy** inline in five modules instead of the dictionary /
      `NotificationTemplate`.
- [ ] **Registration fee materializes only at enrollment**; a withdrawn family's
      confirmed cash is never on the books. `createJournalEntry` posts outside
      the enrollment transaction.
- [ ] **Stripe session not expired** when the family switches to a manual rail.
- [ ] **An accepted-but-unpaid offer now never lapses** — a consequence of the
      expiry fix (the cron exempts `offerAccepted`). A family that accepts and
      then never pays holds the seat until an admin acts (WITHDRAWN via the
      status menu). Needs a payment deadline distinct from the acceptance
      deadline (e.g. `offerExpiryDays` for acceptance + a settings-driven
      payment window), with its own reminder and lapse.
- [ ] Issue #269, WhatsApp breadth (BUG-10), tour-config settings — unchanged.

---

## 2026-08-15 — four intake channels, one trackable journey (LOCAL, not pushed)

The ask: every way a student can be added (public application, `/students`
wizard, onboarding CSV, `/school/bulk`) must arrive at an application id the
school can track through shortlist → reply → payment → enrollment → invoices →
reminders. The data layer already did this (`provisionStudent` + system
campaign, `b26eea3bd`); the dashboard could not SEE three of the four channels.
Both explorer traces (PORTAL journey; post-enrollment finance chain) are
condensed in `content/docs-en/admission.mdx` → "The journey, audited end to end".

Shipped (this block):

- [x] Applications tab lists every `AdmissionChannel` by default; **Channel**
      column + multi-select facet, server-side (`?channel=…`, deep-linkable,
      garbage-safe via `normalizeChannelFilter`). Column carries an explicit
      `id: "channel"` — REQUIRED for `useDataTable` to write the nuqs param;
      the pre-existing `status` facet has no `id` and is client-only (giving it
      one would start writing comma-joined arrays into a single-enum server
      param — left alone, noted).
- [x] Detail page: channel badge, **View student profile** link, campaign name
      localized (`getLabels`), offer/registration-fee rows hidden for
      non-PORTAL channels (replaced by "Billed through Finance → Fees").
- [x] Enrollment tab: `registrationFeeMethod` added to `getEnrollmentList`'s
      select + the SSR mapping — the "Confirm registration payment" action
      never showed on first paint before; the per-page workaround query in
      `getEnrollmentData` removed.
- [x] `getOfferDetails` returns `offerState: "expired"` for status `EXPIRED`
      (cron-flipped) — was a bare 404 after the cron ran.
- [x] Confirm Enrollment gated on `canPerformAdmissionAction(role,
"confirmEnrollment")` in BOTH the detail sidebar and the enrollment row
      (STAFF saw a button the server always rejected). `role` threaded
      content → table → columns → cell.
- [x] `confirmEnrollment` dedupes warnings by code and passes
      `lang: application.lang` to `notifyProvisionedStudent`.
- [x] Offer email URL via `tenantUrl()` — hand-assembled `…databayt.org` was
      wrong for balqalam.com schools. `tenantUrl` now tolerates no request
      scope (crons/webhooks/tests).
- [x] Public status tracker (`actions/status.ts`) takes `lang`; timeline +
      checklist labels from the dictionary; `EXPIRED` rendered as a special
      status. Status banner query is `channel: "PORTAL"` only.
- [x] Registration-fee webhooks (Stripe + Tap): guests reached by
      `directEmail`; ADMIN + ACCOUNTANT alerted (the one funding event the
      dashboard never proactively learned of).
- [x] Dictionary: `admission.channel.*`, `columns.channel`,
      `applicationDetail.viewStudent|billing|billedViaFinance`,
      `warnings.feesSkippedNoGrade`, `statusDisplay.check*` (en + ar).
- [x] `src/tests/school-dashboard/admission/intake-channels.test.ts` (16) pins
      the filter semantics, the derived wizard footer config, and warning copy.

Open — flagged in the docs table, not fixed here:

- [x] ~~Rejection reason~~ — fixed 2026-09-04 (`StatusReasonDialog`).
- [x] ~~`WAITLISTED → SELECTED` promotion and EXPIRED re-offer do not reset
      `offerAccepted` / `registrationFeeMethod`~~ — fixed 2026-09-04: reset
      unless the fee was paid; the token is extended past the new deadline.
- [ ] Sibling hazard: `provisionStudent` reuses a Student by `userId`; one
      parent account applying for two children in different campaigns would
      reuse child A's Student. `@@unique([schoolId,campaignId,userId])` also
      blocks a legitimate second application regardless of
      `allowMultipleApplications`. Product decision on the account model.
- [ ] `ENTRANCE_SCHEDULED` / `INTERVIEW_SCHEDULED` carry no date/slot and
      fall through to the generic status notice.
- [ ] Bulk placement is dictionary-only (`school.admission.bulkPlacement`).
- [ ] `waitlistNumber`: schema field nothing writes. (`registrationFeeProofUrl`
      is written since 2026-09-04 — the offer page's receipt upload.)

> The 2026-05-21 audit found 3 live P0-class breaks. The 2026-05-22 pass fixed offer flow, PII/enumeration, and
> error-code UX. The 2026-06-13 production-readiness pass fixed the remaining core blockers: merit ranking (P0-3),
> AI pipeline (P1-1), placement UI (P1-7), ACCOUNTANT RBAC (P1-9), tour TOCTOU (P1-10), plus a full
> security/webhook/fee/invoice sweep. The admit→accept→pay→enroll→fee pipeline is now end-to-end verified.
> **PRODUCT DECISION (2026-06-12): applying is always free — no application fee at the wizard; payment only at the
> fee stage (registration fee on acceptance + tuition invoices).**
> See **Fixed** sections and **Open Issues** below.

---

## Fixed (2026-07-12) ✅ — application-detail page polish (uncommitted)

Focused UI pass on `application-detail-content.tsx` + the shared print chrome:

- **Print now produces a clean sheet.** Added a global `@media print` block (`globals.css`) that hides the platform sidebar (`[data-slot="sidebar"]`), resets `.dashboard-container` inset, and sets `@page` margins; `print:hidden` added to the platform header, report-issue footer, both `ApplicationDetailActions` placements, and the score **Edit** button. GOTCHA: an `@page` at-rule nested **inside** `@media print` is silently dropped by Lightning CSS (Tailwind v4) — `@page` must sit at top level or the whole print block vanishes.
- **Academic section enum translation.** `preferredStream` / `secondLanguage` / `thirdLanguage` are stored as enum codes (`science`, `arabic`, `french`) but were rendered via raw `d()` translation, surfacing lowercase codes on `/en`. Now resolved through `enumLabel("stream"|"language", …)` (mirrors the Personal section), with `d()` fallback.
- **Merit & Scores hides when empty.** The whole section is now gated on `hasMeritData` (any of entrance/interview/merit score, merit rank, waitlist). Score entry is unaffected — the Merit tab's `ScoreEntryDialog`/`EditableScoreCell` remain the entry point.
- **Documents thumbnails.** Photo circle enlarged (`h-24 w-24` → `h-28 w-28`); signature/document/empty boxes aligned to the same height (`h-36` → `h-28`) for a concise, circle-consistent row.

Verified on `demo.localhost` (admin) against an enriched-then-reverted demo application: PDF print (print media) shows no chrome; Academic renders Science/Arabic/French; Merit shows with data and is absent when null; document boxes match the circle height.

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
- [x] ~~`Application.lang` field~~ — exists, written on submit, read everywhere applicant-facing (2026-09-04 extended it to every notice)
- [ ] Onboarding price-step re-provision on tuition change — deferred
- [x] ~~`application-status-banner-client.tsx` + `INQUIRY_SOURCES`/`DEFAULT_GRADES` i18n migration~~ — verified already localized (2026-09-04 audit)
- [x] ~~`payment/content.tsx` dead-file cleanup~~ — deleted 2026-07-18

---

## Open Issues (updated 2026-06-13)

> Scope tags: **[safe]** = component/action edit, fixable under `.claude/rules/qa-scope.md`.
> **[flag]** = touches schema / auth-layout / `vercel.json` → needs Abdout's sign-off.

### P1 — High (remaining)

_None. P1-6 (`Application.lang`) is RESOLVED: the column exists (migration
`20260522000000_add_lang_to_application`), `submitApplication` writes it, and
since 2026-07-18 the detail page reads it directly (`applicationDetailSelect`
selects `lang`; the Arabic-regex sniffing is gone)._

### P2 — Medium

- **Issue #269** — fee-structure creation as modal (not a blocking flow issue).
- Settings page manages ~15 of ~25 `AdmissionSettings` fields. Still unmanaged: tour/interview config (`tourDuration`/`interviewDuration`/`maxToursPerDay`/`tourDaysOfWeek`/`tourTimeSlots`), `smsNotifications`, `stripeAccountId`, `documentRequirements`, `gradeMapping`. (Portal toggles ARE managed + enforced; `applicationFee` input removed 2026-07-18 — applying is always free.)
- `application-status-banner-client.tsx` + `INQUIRY_SOURCES`/`DEFAULT_GRADES` i18n migration — deferred.
- Dead code: `tour-booking-content.tsx` was deleted in the 2026-07-11 pass; `payment/` + `success/` routes and the success page's `mailto:…@${subdomain}.edu` deleted 2026-07-18.
- 13 prod `as any` (mostly `documents` JSON casts with no runtime validation).
- **WhatsApp breadth (BUG-10)** — WhatsApp channel not wired for more admission events beyond current scope.

### Resolved in the 2026-07-18 audit pass (was listed above)

- ~~Server-side search~~ — full round-trip existed since 2026-07-11, but `merit-content.tsx`/`enrollment-content.tsx` dropped `sp.search` before the query (search boxes silently dead) — wired 2026-07-18.
- ~~Portal toggles not enforced~~ — all four enforced since the 2026-07-11 portal leg (`inquiry.ts`, `tour.ts`, `status.ts`, admissions page).
- ~~fee-auto-assign duplication~~ — `confirmEnrollment` delegates to `ensureStudentFeeAssignments(tx)` via `provisionStudent`.
- ~~ENTRANCE/INTERVIEW_SCHEDULED not wired~~ — `status-machine.ts` has been the single source since 2026-07-11; the stale hand-copied map in `applications-columns.tsx` (which still hid them from the LIST dropdown) replaced with `getAllowedTransitions` 2026-07-18.
- ~~Missing dict keys~~ — `admission.ai.*`/`admission.documentTypes.*` exist bilingual; `toolbar.delete` added 2026-07-18; `columns.applicationFee` obsolete (column removed).
- ~~India-centric merit categories~~ — removed from `merit-columns.tsx`; `category` renders as a school-defined free-text badge.

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
- **Coverage gaps (remaining):** none of the previously-listed ones — server-side search is wired end-to-end (2026-07-18) and `Application.lang` exists, is written on submit, and is read on the detail page. New suites 2026-07-18: `status-machine.test.ts` (EXPIRED semantics + invariants), `settings/validation.test.ts` (weights-defaults regression), upload tenant-scoping (`src/tests/file/upload/actions.test.ts`).

## Recent progress (2026-05-22 → 2026-06-13)

Full production-readiness pass. Core: merit score entry + weighted ranking; AI cron + RBAC + budget gate; PlacementDialog wired; ACCOUNTANT RBAC aligned; tour TOCTOU + OTP hardening; all public writes rate-limited; callbackUrl token preservation; **PRODUCT DECISION: applying is always free** (fees step is informational; payment only at registration-fee + tuition stages). New: Leads tab (inquiries + tour bookings, status/follow-up/convert, ADMIN+STAFF notifications, ACCOUNTANT read-only). Webhooks: stripe/tap retry-on-catch, multi-installment `amountPaid`/PARTIAL allocation oldest-first, `checkout.session.expired` clears stuck state, Tap registration_fee, collision-safe receiptNumber. Schema: `InvoiceStatus +PARTIAL`, `UserInvoice +amountPaid +sentAt`, new indexes; migration-of-record at `prisma/migrations/20260612200000_invoice_partial_payment_and_indexes`.

---

**Last Review:** 2026-06-13
