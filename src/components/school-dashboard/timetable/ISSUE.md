# Timetable -- Production Readiness Tracker

**Status:** PRODUCTION-READY (pending browser smoke)
**Completion:** ~97%
**Last Updated:** 2026-05-30

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
- [x] Multi-tenant isolation (schoolId scoping) — 169 db calls audited, no cross-tenant leak
- [x] Slot editor with suggestions for free periods
- [x] Server actions with proper validation (error-code returns, not hardcoded English)
- [x] Auto-generate scheduling algorithm (now unit-tested)
- [x] Schedule templates (create and apply)
- [x] Analytics and reporting
- [x] Substitution management (substitute teacher can confirm/decline own assignment)
- [x] PDF export
- [x] Role-based views (admin, teacher, student, guardian)
- [x] Persisted audit trail (db.auditLog) for all mutations
- [x] Lang-aware (AR/EN) server notifications
- [ ] Drag-and-drop slot editor (currently click-based) — post-MVP
- [ ] Mobile-optimized view polish (component exists) — post-MVP
- [ ] ARIA grid pattern for accessibility — post-MVP

## Resolved in the 2026-05-30 hardening pass

### P1 blockers (all fixed)

- [x] **Audit trail was a no-op in production** — `logTimetableAction` only logged when
      `NODE_ENV==='development'`. Now wired to the shared `logAudit()` (`src/lib/audit-log.ts`),
      persisting namespaced `timetable.*` rows to `db.auditLog` with previous/new values.
- [x] **`respondToSubstitution` was admin-only** — the action a substitute teacher calls to
      confirm/decline their own assignment required `requireAdminAccess()`. Now allows an admin
      **or** the assigned substitute teacher (ownership verified via `teacher.userId`), and
      rejects any other teacher with `FORBIDDEN`.
- [x] **`findAvailableSubstitutes` tenant/weekOffset bug** — nested `constraints`/`timetables`
      includes now carry `schoolId` (defense-in-depth) and the busy-check honours `weekOffset`,
      so a substitute free in the queried week is no longer wrongly excluded for another week.
- [x] **Template-apply / bulk-import swallowed errors** — bare `catch {}` counted every failure
      as a "conflict". Now P2002 (unique constraint) is counted as a conflict/skip while any other
      DB error is surfaced (`applyTemplateToTerm` rethrows; `importTimetableSlots` records it).

### P2 / cleanup

- [x] Lang-aware notification copy — 5 hardcoded-Arabic notification sites replaced with the
      AR/EN `notification-templates.ts` helper keyed off `School.preferredLanguage`.
- [x] Wired `deleteTimetableSlotSchema` into `deleteTimetableSlot` (was defined but unused).
- [x] Deleted 6 orphan Zod schemas with no action (bulkUpsert/export/import/resolveConflict/
      autoResolveConflicts/getTimetableStats) and their unused type exports.
- [x] Removed dead code: unused `teacherName`/`name` computation (+ a wasted teacher lookup)
      in `upsertTimetableSlot`; removed 3 unused HOFs (`withPermission`/`withAdminAccess`/
      `withAudit`) from `permissions.ts`.
- [x] Test suite rebuilt to exercise real source: `validation.test.ts` now imports the actual
      schemas (previously redefined them locally); deleted `production-readiness.test.ts` (tested
      no production code + asserted a stale message); added `permissions.test.ts`,
      `algorithm.test.ts`, `utils.test.ts`. **176 tests passing across 6 files (was ~99 real).**

## Deferred (post-MVP — no correctness/security risk)

### P1 -- High

- [ ] Print view final tuning for varied day counts (fonts/margins)

### P2 -- Medium

- [ ] React.memo on TimetableCell (performance at scale) / virtual scrolling for large grids
- [ ] Keyboard navigation (arrow keys) + screen-reader announcements (a11y workstream)
- [ ] Pre-existing block-wide eslint debt (`any` in view components, unused vars) — untouched
      view/builder files; the hardening-pass files are lint-neutral
- [ ] UI `t?.key ?? "English"` fallbacks across visual-builder / substitutions components —
      degrade gracefully today; a separate i18n sweep
- [ ] `importTimetableSlots` partial-import atomicity (currently one `$transaction` — a real
      error rolls back the whole batch) is a deliberate redesign, not a bug

## Enhancements (Post-MVP)

- [ ] Drag-and-drop timetable editing with auto-suggestions
- [ ] Teacher preference tracking for auto-scheduling
- [ ] Zustand store migration (from multiple useState)
- [ ] Copy schedule from previous term
- [ ] Grade-level and class-level schedule config overrides

---

**Last Review:** 2026-05-30
