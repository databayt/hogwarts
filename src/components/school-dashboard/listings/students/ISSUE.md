# Students — Production Readiness Tracker

**Status:** 🟡 IN PROGRESS
**Completion:** 93%
**Last Updated:** 2026-07-17

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

Browser-verified on `demo.localhost:3000/ar/students` (admin@databayt.org).

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
