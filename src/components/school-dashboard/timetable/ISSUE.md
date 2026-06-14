---
epic: 05
sprint: Q3-2026
title: Timetable (LMS scheduling)
file_type: issue
owner: Abdout
maturity: Production-Ready
completion: 95
tracker: https://github.com/databayt/hogwarts/issues/323
docs: https://ed.databayt.org/en/docs/us-curriculum
last_audited: 2026-06-13
---

# Timetable -- Production Readiness Tracker

**Status:** PRODUCTION-READY
**Completion:** 95%
**Last Updated:** 2026-06-13

---

## MVP Checklist

- [x] Weekly schedule builder with visual grid
- [x] Flexible working days configuration (Sun-Thu, Mon-Fri, custom)
- [x] Lunch break positioning (configurable per school/term)
- [x] Conflict detection engine (teacher/room/class double-booking)
- [x] Class view and teacher view switching
- [x] Room view
- [x] A4 print-ready output with proper styling
- [x] Term-based schedules (different schedule per term)
- [x] Multi-tenant isolation (schoolId scoping)
- [x] Slot editor with suggestions for free periods
- [x] Server actions with proper validation
- [x] TypeScript strict mode compliance (no `any` violations)
- [x] Typography system compliance (semantic HTML)
- [x] Auto-generate scheduling algorithm
- [x] Schedule templates (create and apply)
- [x] Analytics and reporting
- [x] Substitution management
- [x] PDF export
- [x] Role-based views (admin, teacher, student, guardian)
- [ ] Drag-and-drop slot editor (currently click-based)
- [ ] Mobile-optimized view (component exists, needs polish)
- [ ] ARIA grid pattern for accessibility

## Known Issues

### Recently Fixed (2026-06-13 -- production-readiness pass: security, correctness, validation, perf, a11y)

Driven by a 9-dimension adversarial audit (tenant / authz / validation /
correctness / perf / i18n / types / a11y / structure). 180 timetable tests
green, tsc 0.

**Security / tenant (P1):**

1. `validateTeacherConstraints` / `validateRoomConstraints` /
   `validateSlotConstraints` were exported in a `"use server"` file → directly
   HTTP-callable with a **caller-supplied `schoolId`**, leaking another tenant's
   teacher/room/constraint data. They are now **un-exported internal helpers**
   (only `upsertTimetableSlot` / `moveTimetableSlot` call them, passing the
   context schoolId). The HTTP surface is gone.
2. `upsertTeacherConstraints` and `addTeacherUnavailableBlock` now verify the
   teacher / parent-constraint belongs to the caller's school before writing
   (global-CUID FKs don't enforce tenancy → was cross-tenant corruption).
3. `filterTimetableByRole` now **throws** on a null schoolId instead of silently
   dropping the tenant filter (was a cross-family guardian leak risk), and is
   generically typed (`TimetableRowMinimal`) instead of `any`.
4. Permission guards (`requirePermission`/`requireAdminAccess`/
   `requireReadAccess`) now distinguish unauthenticated (`NOT_AUTHENTICATED`)
   from unauthorized.

**Correctness (P1):**

5. `detectTimetableConflicts` no longer crashes on **section-based slots**
   (`classId`/`class` null) — it dereferenced `a.class.id`. Cohort identity now
   falls back section → class, and the per-conflict detail fetch was collapsed
   from **N+M serial queries to 2 batched queries**.
6. `moveTimetableSlot` now detects a **section double-book**
   (`SECTION_DOUBLE_BOOKED`) on the target cell, passes `sectionId` to capacity
   validation, and builds the conflict `OR` conditionally (a null
   teacher/room/section no longer matches every unassigned slot).
7. `applyTemplateToTerm` clear+insert is now a single `$transaction`
   (`deleteMany` + `createMany({ skipDuplicates })`) — a partial failure can no
   longer destroy a term's slots while leaving an incomplete replacement.
8. `setActiveTerm` verifies the term belongs to the school, then flips
   active/inactive atomically in one `$transaction` (a crash mid-flip could
   leave every term inactive).

**Validation / perf / a11y:**

9. Zod parsing added to ~12 previously-unvalidated mutations (move, delete,
   applyGenerated, applyTemplate, createTemplate, createPeriod, addUnavailable
   Block, setActiveTerm, upsertTeacherConstraints, getSubstitutionRecords,
   importTimetableSlots) with bounds on numbers/arrays/strings.
10. `getTimetableAnalytics` room utilization is O(slots) (Map) instead of
    O(rooms × slots); removed dead `withPermission/withAdminAccess/withAudit`
    wrappers and the unsafe `any` casts they carried; `logTimetableAction`
    now emits in all environments (production trail).
11. Server-side notifications (move/delete/assign/respond) were **hardcoded
    Arabic** regardless of the school's language — now localized by
    `School.preferredLanguage`.
12. a11y: removed invalid heading nesting in the slot-editor dialog
    (`h4` inside `DialogTitle`, `h5` inside `AlertTitle`); decorative settings
    timeline `aria-hidden`; fixed duplicate `htmlFor` on the preview Switch
    (now an `aria-label`); conflict indicator no longer colour-only (icon +
    `sr-only` text); guardian avatar `alt`; decorative combobox chevrons
    `aria-hidden`.

### Deferred (tracked follow-ups, not blockers)

- [ ] **`actions.ts` split** — 6.5k-line file mixing read queries + write
      actions + helpers; split into `queries.ts` / `actions.ts` (constants must
      stay out of the `"use server"` file). Mechanical but large.
- [ ] **Full ARIA grid pattern + keyboard nav** in `views/simple-grid.tsx`
      (`role=grid/row/gridcell`, roving tabindex, arrow keys, editable cells as
      buttons). The conflict-indicator + heading fixes landed; the grid
      interaction model is the remaining chunk.
- [ ] **Content-file i18n long-tail** (~80 strings in `generate/`,
      `settings/`, `conflicts/`, `slot-editor-dialog`, and the
      `getActiveTerm`/`getTodaySchedule`/`getTimetableAnalytics` returned
      labels) — should go through the dictionary workflow (en+ar parity). The
      objectively-broken notifications are already fixed.
- [ ] **Consolidate `permissions.ts` + `permissions-config.ts`** into
      `authorization.ts` per the school-dashboard convention.
- [ ] **`logTimetableAction` → dedicated audit table** (currently a structured
      console sink; fine for now, but no queryable history).
- [ ] **`respondToSubstitution` is admin-only** — if a teacher-facing
      substitution-response UI is added, relax the guard to allow the assigned
      substitute teacher to confirm/decline their own record.
- [ ] **Remaining perf** (lower priority): `getTimetableByClass` `include`→
      `select`; dedupe redundant `getTenantContext` in `getTodaySchedule`/
      `getWeeklyTimetable`; `importTimetableSlots` upsert-loop→`createMany`
      (loses per-row error attribution — needs a pre-validation pass);
      `algorithm.optimizeSchedule` O(slots²) delta-scoring.

### Recently Fixed (2026-06-12 -- section-first lifecycle + terms-aware calendars)

1. **Manual slot lifecycle migrated to sections** -- `upsertTimetableSlot`
   now requires `sectionId` + `subjectId` (slot editor has section/subject
   pickers); editing a legacy `classId` row backfills its section fields in
   place; `deleteTimetableSlot` is id-based (section slots were previously
   undeletable via the legacy composite key). New slots carry NO `classId`.
2. **Student/guardian visibility** -- `getWeeklyTimetable`, `getTodaySchedule`
   (STUDENT), `getChildTimetable`, `getTimetableByStudentGrade`,
   `getTimetableByGradeLevel` now OR `Student.sectionId` with legacy
   `StudentClass` classIds; section-generated schedules render the moment a
   student is placed (previously invisible).
3. **Security: `getChildTimetable` access hole closed** -- a caller with no
   guardian record in the school skipped the relationship check entirely;
   now denied.
4. **Edit self-conflict** -- `upsertTimetableSlot` passes `excludeSlotId` so
   a teacher at max periods can re-save their own slot.
5. **Client conflict false-positive** -- `detectConflicts` coalesced cohort
   identity (`sectionId ?? classId`); two section slots no longer "conflict"
   via `undefined === undefined`.
6. **Terms-aware calendars** -- new `calendars.ts` (`ACADEMIC_CALENDARS`,
   `resolveAcademicCalendar`, `computeTermDates`): country/structure + date →
   N terms with correct boundaries + exactly-one-active; wired into
   `applyTimetableStructureForNewSchool` and `resolveActiveTerm` fallback.
   Structure `calendar` override (sd-british → GB). 30+ new tests.
7. Error strings in actions.ts converted to snake-free CAPS codes
   (`SLOT_NOT_FOUND`, `SECTION_NOT_FOUND`, …) per the i18n error-code rule.

Deferred (documented legacy paths, commented in code): `importTimetableSlots`
and `applyTemplateToTerm` still replay `classId` — section migration pending.

### P1 -- High

- [x] Role checks on mutations enforced (every mutation calls
      `requireAdminAccess`/`requirePermission`; the unauthenticated `validate*`
      HTTP surface was removed) — 2026-06-13
- [ ] Print view needs final tuning for varied day counts (fonts/margins)
- [ ] Integration tests for overlapping slots and weekend pattern rendering
- [ ] `importTimetableSlots` + `applyTemplateToTerm` are classId-only (legacy
      replay) — need a resolve step (classId → sectionId/subjectId) before
      legacy rows can be fully retired

### P2 -- Medium

- [ ] React.memo not applied to grid cells (performance at scale)
- [ ] No virtual scrolling for large timetables
- [x] Conflict detection N+M serial queries → 2 batched queries — 2026-06-13
- [ ] No keyboard navigation (arrow keys) in grid cells (part of the full ARIA
      grid follow-up above)
- [x] Conflict indicator no longer colour-only; decorative elements hidden from
      AT; invalid heading nesting removed — 2026-06-13 (full grid SR pattern
      still pending)

## Enhancements (Post-MVP)

- [ ] Drag-and-drop timetable editing with auto-suggestions
- [ ] Recurring event exceptions (holidays, special schedules)
- [ ] Teacher preference tracking for auto-scheduling
- [ ] Zustand store migration (from multiple useState)
- [ ] Virtual scrolling for large timetables
- [ ] Progressive loading strategy
- [ ] Copy schedule from previous term
- [ ] Grade-level and class-level schedule config overrides

---

> **Tracker note:** the frontmatter `tracker: #323` is stale — #323 is the
> "[Epic] LMS / Stream — asset-download wave" epic, unrelated to timetable.
> There is no open timetable issue (the timetable reports #364/#365 are closed;
> the i18n one #365 is addressed by the notification + deferred content-i18n
> work here). No GitHub comment was posted for this pass.

**Last Review:** 2026-06-13 (production-readiness pass: security/correctness/validation/perf/a11y from a 9-dimension adversarial audit; 180 timetable tests green, tsc 0)
