---
epic: 05
sprint: Q3-2026
title: Timetable (LMS scheduling)
file_type: issue
owner: Abdout
maturity: Built+Polish
completion: 80
tracker: https://github.com/databayt/hogwarts/issues/323
docs: https://ed.databayt.org/en/docs/us-curriculum
last_audited: 2026-06-12
---

# Timetable -- Production Readiness Tracker

**Status:** IN PROGRESS
**Completion:** 90%
**Last Updated:** 2026-06-12

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

- [ ] Role checks on mutations not fully enforced (ADMIN/OWNER only)
- [ ] Print view needs final tuning for varied day counts (fonts/margins)
- [ ] Integration tests for overlapping slots and weekend pattern rendering
- [ ] `importTimetableSlots` + `applyTemplateToTerm` are classId-only (legacy
      replay) — need a resolve step (classId → sectionId/subjectId) before
      legacy rows can be fully retired

### P2 -- Medium

- [ ] React.memo not applied to TimetableCell (performance at scale)
- [ ] No virtual scrolling for large timetables
- [ ] Conflict detection algorithm could be optimized for bulk operations
- [ ] No keyboard navigation (arrow keys) in grid cells
- [ ] Screen reader announcements missing

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

**Last Review:** 2026-06-12 (section-first lifecycle + calendars; 139 timetable tests green, tsc 0)
