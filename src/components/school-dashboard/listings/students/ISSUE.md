# Students — Production Readiness Tracker

## 2026-08-14 — intake unification finished: the invariant is now unconditional (LOCAL, not pushed)

The 08-12 pass left two flows exempt from the "every student is born from an
Application" rule because their `AdmissionChannel` was undecided. It was the
wrong question: `internal-onboarding` and `newcomers` are flows for the ADULTS
who join a school, and their `student` option was a leftover that wrote a stub
`Student` (placeholder DOB `2010-01-01`, gender "Not Specified") with no
Application, no student code, no fees and no seat.

Shipped:

- [x] `student` branch deleted from both flows; a self-registering student is
      sent to `/{lang}/application` and enters the reviewed `PORTAL` pipeline.
      No new `AdmissionChannel` value. **Both entries removed from
      `STUDENT_CREATE_ALLOWLIST`** — the allowlist is now only the core, seeds,
      snapshot restore, ops scripts and `createDraftStudent`.
- [x] `src/lib/student-provisioning-notify.ts` — the post-commit dispatch,
      extracted out of `confirmEnrollment` (**replaced**, not duplicated; a
      regression test pins exactly one `account_created` per enrollment) and
      wired into all five channels. Before this, only PORTAL students were ever
      told anything.
- [x] Bulk import gained a **"notify families" checkbox, default off**. When on
      it uses `delivery: "queue"`, so the email cron drains 50 per run instead
      of bursting.
- [x] `POST /api/mobile/students` gained an opt-in `notify` body param
      (**default false**) rather than silently starting to mail on behalf of
      existing clients.
- [x] **Unplaced filter** (`?unplaced=seat|grade|any`) + toolbar chip, plus a
      weekly admin alert folded into the `fee-due` cron. A gradeless student is
      assigned no fees and raises no invoices, so they were invisible to every
      money screen.
- [x] Invoice + receipt delivery: the fee notice states the instalment schedule
      and stamps `UserInvoice.sentAt`; a cleared payment links the payer to
      `/api/payment/[id]/receipt`.

Gotchas worth keeping:

- **`dispatchAdmissionNotification` sends email INLINE**, not via the cron
  ("Send email immediately instead of waiting for daily cron"). Any bulk path
  routed through it would burst Resend — hence the immediate/queue split.
- **A placeholder `@student.local` address must lose the `email` channel on the
  row itself.** `processPendingEmailNotifications` skips recipients with NO
  address; a placeholder is an address, so the cron would try to deliver.
- **`after()`, not bare `void`** for the post-commit dispatch. The tests then
  need a multi-tick flush, because the chain awaits a dynamic `import()`.
- **The `fee-due` cron discovers schools by unioning groupBy queries.** Adding a
  check for gradeless students required a FOURTH discovery query — a school
  whose only problem is gradeless students has no pending fees, so it appeared
  in none of the existing three and would never have been visited.
- **`enrollment-notifications.test.ts` shares one module-level `db` mock**, so a
  test asserting on a newly-mocked model must run first or it sees accumulated
  state.

Still open:

- [ ] Run `scripts/backfill-legacy-applications.ts` against prod (~970 rows;
      needs explicit approval). Note it only links an Application — it does NOT
      heal the stub students the deleted branches left behind; the unplaced
      filter is what catches those.
- [ ] `/newcomers` is a **dead link**: `my-school/page.tsx:32,43` redirects to it
      and `auth/user-button.tsx:230` links to it, but no route exists.
- [ ] `internal-onboarding` has NO dictionary wiring at all — every label falls
      back to hardcoded English (pre-existing).
- [ ] `importGuardians` still hand-rolls guardian creation instead of
      `createOrLinkGuardian`, missing the parent-conflict guard.

---

**Status:** 🟡 IN PROGRESS
**Completion:** 93%
**Last Updated:** 2026-08-12

---

## 2026-08-15 — every channel trackable + wizard/import parity (LOCAL, not pushed)

Read with `admission/ISSUE.md` (same date) — that entry holds the journey audit.
Student-block half:

- [x] **Profile → application link** in the UNIFIED profile sidebar
      (`school-dashboard/profile/sidebar.tsx`, gated ADMIN/STAFF via
      `getPermissionLevel`; null-safe — 971 of 972 demo students have no
      application until the backfill runs). NOTE: `listings/students/profile/
student-profile.tsx` is DEAD CODE — nothing renders it; the route
      redirects to `/profile/[userId]`. Left in place, flagged.
- [x] `completeStudentWizard` returns provisioning `warnings`; the academic
      step toasts them via `translateEnrollmentWarning`. `provisionStudent`
      now EMITS `NO_FEE_STRUCTURE_MATCH` / `FEES_SKIPPED_NO_GRADE` (it used to
      discard `ensureStudentFeeAssignments`'s return — a school with no fee
      structure for the grade produced a student with no fees and no signal).
      CSV import aggregates the former into one summary line.
- [x] Wizard revalidate fixed: bare `revalidatePath("/students")` matched no
      cache tag; now the route pattern + `"page"`, plus
      `/admission/applications` (the tab lists ADMIN_DIRECT rows now).
- [x] Attachments schema hoisted to `@/components/form/attachments-schema`
      (byte-identical copies in the students wizard and the public application
      wizard); both `validation.ts` re-export. NOT the teachers copy — different
      document set.
- [x] `DocumentCard` rejection/aria copy dictionary-driven (`students.
attachments.tooLarge|invalidType|invalidFile|remove|pdf`, en+ar) — was
      hardcoded English on the Arabic wizard; the applicant-side card already
      took them as props.
- [ ] `STUDENTS_PATH = "/students"` in `listings/students/actions.ts` — 7
      bare `revalidatePath` sites are still no-ops (route pattern + "page"
      needed). Not touched here.
- [ ] Sorting/`groupLabels`: every wizard config's `i18nGroupLabels` renders
      no text — `FormFooter` uses `groupLabels` only for its length.

## 2026-08-12 — intake unification: closing the leaks (LOCAL, not pushed)

The four documented channels already funnelled through `provisionStudent`; what
was false was the invariant around them. Demo school had **972 students and 1
`applicationId`** because `prisma/seeds/people.ts` wrote rows directly, while
`deriveIsSelfOnboarded` (actions.ts) already reads `student.application.channel`
as if every student had one.

Shipped:

- [x] Lint + vitest guard so `db.student.create` outside the core cannot land
      (`eslint.config.mjs` `STUDENT_CREATE_ALLOWLIST`, shared with
      `src/tests/school-dashboard/listings/student-intake-invariant.test.ts`).
- [x] `school/membership` `changeRole` and `POST /api/mobile/students` routed
      through `provisionStudent` (`ADMIN_DIRECT`); the mobile route also stopped
      defaulting `dateOfBirth` to `new Date()` ("born today").
- [x] `seedStudents` mints a deterministic shadow Application per student
      (system campaign, channel spread over the three direct-admit values).
      **PORTAL is deliberately excluded** — `buildApplicationWhere` filters on
      channel alone, so tagging enrolled students PORTAL would bury the review
      queue. **Written but NOT yet run — the seed run was declined.**
- [x] `scripts/backfill-legacy-applications.ts` (dry-run default). Local dry run
      reports 970 orphans, correctly skipping the 1 wizard draft.
- [x] Seams: `warnings`/`accessCodes` now reach the import UI — **corrected
      2026-08-15: only the SERVER half had landed.** Both `actions.ts` files
      returned them and neither `content.tsx` rendered them (onboarding's
      local `ImportResult` did not even declare `credentials`). Now rendered by
      the shared `file/import/result-panel.tsx` in both flows; student `phone`
      added to `studentCsvSchema` + header map + template (imported students
      showed a blank phone once the list column moved from email to phone);
      inert `notify: true` in `completeStudentWizard` corrected to `false`.

Open:

- [ ] Run the backfill against prod (needs approval — ~971 rows on the demo).
- [ ] `internal-onboarding` / `newcomers` still create students outside the
      pipeline. They are now auth-gated (see below) but their `AdmissionChannel`
      is undecided; they sit in the allowlist until that is settled.
- [ ] `importGuardians` (standalone guardians CSV) hand-rolls guardian creation
      instead of `createOrLinkGuardian`, so it misses the parent-conflict guard.
- [x] FIXED — sorting the students list by a DERIVED column (`name`,
      `gradeName`, `classroom`, `phone`) spread the sort id straight into a
      Prisma `orderBy` key. All four throw ("Unknown argument `name`"), and
      `StudentsContent` has no try/catch, so any URL carrying one took the page
      down — a shared link, a reload after clicking the header, the back
      button. Invisible while clicking because nuqs runs `shallow: true`, so
      the header rewrites the URL without asking the server. Now mapped by
      `buildStudentOrderBy` in `list-params.ts` (shared by `content.tsx` and
      `actions.ts` so they cannot disagree), with an allowlist so an arbitrary
      `?sort=` id is dropped rather than passed to Prisma. Pinned by
      `src/tests/school-dashboard/listings/student-sort-order.test.ts`; every
      emitted clause verified against the real database.
- [ ] Sorting still does not re-query: `shallow: true` means the header click
      never reaches the server, and `manualSorting: true` means TanStack will
      not sort client-side either. The control is inert until either
      `enableClientSorting` or a non-shallow query state is chosen — a
      behaviour decision, not a bug fix.

### Security (found while mapping the pipeline)

`submitInternalOnboarding` had **no `auth()` call**, took `schoolId` as a
caller-supplied argument, and passed a caller-chosen `role: "admin"` through
`mapRole()` to the ADMIN User role with `emailVerified` stamped — i.e. a caller
could mint themselves an admin account at any school they could name. Server
actions are public POST endpoints, so the page being unlinked protected nothing.
Now: session required, school taken from the request's tenant context, and
`admin`/`staff` never self-assignable. `submitNewcomerApplication` trusted the
client to have called `verifyEmailCode` (which consumed the token); the code is
now re-checked and consumed inside the account-creating transaction.

---

## MVP Checklist

- [x] CRUD operations with Zod validation
- [x] Class enrollment management (many-to-many via StudentClass)
- [x] Guardian relationships (StudentGuardian linking) -- RESOLVED 2026-03-13
- [x] Search and filtering (name, status, class) -- className now server-side (2026-07-13)
- [x] Export student data to CSV
- [x] Multi-tenant isolation (schoolId scoping)
- [x] Server-side pagination and sorting (Load-More)
- [x] Multi-step wizard add form (attachments, personal, location, academic — older steps retired/redirected)
- [x] Photo upload + document attachments (S3 via FileUploadField/useUpload) -- wired
- [x] Row actions (View, Edit, Delete with confirmation dialog)
- [x] Breadcrumb with student name on detail page
- [x] RBAC authorization checks
- [x] DOB + gender collected in the wizard personal step (2026-07-13)
- [ ] Loading skeletons and empty states (C2)

## Known Issues

### P2 — Medium

- [ ] Performance/analysis/reports pages are stub routes
- [ ] No loading skeletons for table (C2)
- [ ] Load-More only — no total count / numbered pagination (C3)
- [ ] Classroom **facet UI** not yet in the toolbar (the `className` param IS
      now wired server-side; only the toolbar chip is missing)

## 2026-07-17 — optimize pass: P0 RBAC + 2 reported bugs + i18n (local main, NOT committed)

Browser-verified on `demo.localhost:3000/ar/students` (admin@balqalam.com).

### P0 — auth holes closed (unauthenticated PII read/write)

`getTenantContext()` resolves `schoolId` from the `x-subdomain` header **before**
the session, so wizard sub-actions that checked only `if (!schoolId)` and never
called `auth()` were reachable by an unauthenticated POST to a valid school
subdomain. Added `auth()` + `assertStudentPermission(...)` (shared
`authorizeWizardAction` guard) to every one:

- [x] `wizard/personal/actions.ts` — `updateStudentPersonal`,
      `getStudentPersonalGuardians`, `saveStudentPersonalGuardians`,
      `getStudentPersonal` (read/update/link_guardian). Were unauth read/write of
      student name/DOB/gender/phone + guardian name/phone/**WhatsApp**.
- [x] `wizard/location/actions.ts` — `getStudentLocation`,
      `updateStudentLocation` (unauth read/write of home address).
- [x] `wizard/attachments/actions.ts` — `getStudentAttachments`,
      `updateStudentAttachments` (unauth read of photo + document URLs; unauth
      delete+recreate of all `StudentDocument` rows).
- [x] `wizard/attachments/extract-action.ts` — `extractStudentAutoFill` had
      `auth()` but **no role check** → any authenticated STUDENT/GUARDIAN could
      burn the school's **paid AI** budget on arbitrary allowed-host URLs. Now
      gated to update-capable roles.
- [x] `actions.ts` — `generateStudentAccessCodes`, `getStudentAccessCodes`
      (link_guardian) and `bulkSyncStudentGrades` (update) authenticated but
      skipped the permission assert every other action performs. Gated.

### Reported bugs fixed (issues #380, #381 — were "low-confidence")

- [x] **#380** — wizard final step "إنشاء" silently did nothing when the
      required Personal step was incomplete (no name / no linked parent).
      `completeStudentWizard` returns `{success:false}` (never throws) and
      `wizard/academic/content.tsx` acted only on success → zero feedback.
      Now surfaces a translated `students.academic.completeRequirements` toast;
      raw `VALIDATION_ERROR` code mapped to the friendly message. Verified.
- [x] **#381** — "Link Parent" (`ربط ولي أمر`) did nothing. Root cause: the
      `AccessCodeDialog` open-state was local `useState`, wiped by the
      listings-table remount that fires when the generate Server Action
      completes (same failure the credentials dialog fixed). Moved open-state +
      generated codes into a module store (`access-code-store.ts`,
      `useSyncExternalStore`), mirroring `../credentials/store.ts`. Dialog now
      opens, generates, and stays open. Verified (code shown, RTL correct).

### i18n

- [x] `enrollment.academicStreamId` was undefined in both dictionaries → the
      wizard rendered a hardcoded English "Stream". Added `المسار` / `Stream` to
      `school-{ar,en}.json` (parity test green).
- [x] Added `students.academic.completeRequirements` (both langs).

### Still open (from the sub-dir audit — NOT addressed this pass)

- [ ] Dead `profile/` chain: `student-profile.tsx` + 8 `tabs/*` +
      `fee-adjustments-*` have zero live importers (the `[id]` route redirects to
      `/profile/[userId]`). `fee-adjustments-actions.ts` carries its own
      ungated-read P0s but is **unreachable** — delete the chain or wire+gate it.
- [ ] Dead `id-card/` chain (`id-card-generator.tsx` renders blank cards —
      empty `document.createElement` divs; `matchesClass = ... || true` no-op),
      dead `enrollment/` chain (`enrollment-form.tsx`, `batch-transfer.tsx`),
      dead `academic-records.tsx` — all zero importers.
- [ ] `columns/index.ts` barrel is unreachable (shadowed by `columns.tsx`).
- [ ] `students/manage` + `students/analysis` are fat inline pages (no
      `content.tsx`), not in the section nav — reachable only by direct URL.
- [ ] `guardians`/`settings`/`performance`/`reports` route contents are still
      placeholder "coming soon" cards.
- [ ] #382 ("not all students appear" in enroll dropdown): by design the enroll
      picker lists only `academicGradeId: null` students, capped at 200 — for a
      fully-graded school it is empty. Needs an empty-state + a decision on
      whether re-enrollment/grade-change belongs here (deferred — behavior
      change, not a pure bug).

## 2026-07-13 — /en/students review pass (batch 1 SHIPPED, local main)

Shipped (commits `fe87de9e7`, `9b8944f2d`):

- [x] B1/E1/E2: wizard + public application now collect DOB + gender (were
      never asked; `createDraftStudent` stamped every student "born today,
      male"). Stub DOB is now a neutral 2000-01-01 sentinel.
- [x] B2: wizard phone label no longer shows a false required `*`.
- [x] A4: bare `/students/add` mints a draft + redirects (was a dead-end).
- [x] A3: service-worker registration guards undefined registration.
- [x] A2: WebSocket connect error logs once, not per reconnect attempt.
- [x] C1: `className` filter mapped into the Prisma where clause.
- [x] D1/D2: deleted dead `queries.ts` + stale `types.ts`.

Remaining from the review (see plan `read-https-demo-databayt-org-en-students-luminous-bird`):

- [ ] E6 (guardian `fatherEmail`/`motherEmail` → `*Whatsapp`): approved as a
      **full column rename + migration**, but it also needs `provisionStudent`
      extended to persist a guardian WhatsApp `GuardianPhoneNumber` (the core
      has no whatsapp field today) and a deploy-coordinated `ALTER TABLE
RENAME`. Deferred to a dedicated, runtime-verified unit.
- [ ] B3: collect email in the wizard (feeds the login; currently "No email").
- [ ] B4: tighten wizard `requiredSteps` (grade/section) for SIS completeness.
- [ ] E3/E4/E5: guardian occupation + generic guardian in the wizard; align
      name/phone validation across the two flows; drop dead application
      nationality/religion/category schema fields.
- [ ] A1: re-enable error reporting in `s/[subdomain]/error.tsx` (Sentry
      capture is commented out) — the demo intermittently hits this boundary.

### Enhancements (Post-MVP)

- [ ] Bulk class assignment (select multiple students)
- [ ] Status change history log with timestamps
- [ ] Attendance summary per student
- [ ] Grade progression tracking
- [ ] Transfer between schools

---

**Last Review:** 2026-07-13
