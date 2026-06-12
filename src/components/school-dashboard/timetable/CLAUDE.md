---
epic: 05
sprint: Q3-2026
title: Timetable (LMS scheduling)
file_type: claude
owner: Abdout
maturity: Built+Polish
completion: 80
tracker: https://github.com/databayt/hogwarts/issues/323
docs: https://ed.databayt.org/en/docs/us-curriculum
last_audited: 2026-05-25
---

# Timetable (LMS scheduling) Block

## Context

Timetable (LMS scheduling) — Q3 2026 sprint epic 05, maturity `Built+Polish`, ~80% complete. See [README](README.md) for routes + file structure and [ISSUE](ISSUE.md) for the live work list. Tracker: [323](https://github.com/databayt/hogwarts/issues/323).

## Before You Start

1. Read `README.md` here for routes, props, and integration points
2. Read `ISSUE.md` here for the P0/P1/P2 priorities + MVP checklist
3. Skim the [Q3 Sprint Plan](https://kun.databayt.org/en/docs/sprint) for the epic's owner + bet
4. Check the [tracker](https://github.com/databayt/hogwarts/issues/323) for cross-feature dependencies

## Key Decisions

- **Section is the slot axis** (2026-06-12): `Timetable.sectionId` + `subjectId`
  are the operational identity of a slot; `classId` survives only on legacy
  rows for exams/results history. `upsertTimetableSlot` requires
  sectionId+subjectId and BACKFILLS section fields when editing a legacy row
  (in-place migration on touch). `deleteTimetableSlot` is id-based — never
  reintroduce composite-key deletes (they can't match section slots).
- **Reads OR both axes**: every student/guardian read resolves
  `Student.sectionId` ALONGSIDE `StudentClass` classIds
  (`OR: [{ classId: { in } }, { sectionId }]`). Dropping either arm makes one
  generation of data invisible.
- **Timetable before people**: auto-generation emits teacher-less slots
  (`teacherId: null`); the slot editor is where teachers get attached. Don't
  make teacherId required anywhere in the generation path.
- **Terms come from calendars**: `calendars.ts` (`ACADEMIC_CALENDARS` +
  `resolveAcademicCalendar` + `computeTermDates`) derives N terms from
  country/structure/date — `computeTermDates` guarantees exactly one
  `isActive` term. Structures may carry a `calendar` override (sd-british →
  GB). Consumed by `catalog/provision.ts` and `lib/term-resolver.ts`.
- **Errors are CAPS codes** (`SLOT_NOT_FOUND`, `SECTION_NOT_FOUND`,
  `TEACHER_NOT_QUALIFIED`) — translated client-side, never literal English.

## Danger Zones

- **`upsertTimetableSlot` ordering**: the existing-row lookup MUST precede
  `validateSlotConstraints` so `excludeSlotId` excludes self — otherwise a
  teacher at max periods can never re-save their own slot.
- **`getChildTimetable` access check**: a guardian-less caller must be DENIED
  (`!guardian → ACCESS_DENIED`); skipping when no guardian record exists is a
  cross-family data leak (was a real hole, fixed 2026-06-12).
- **`detectConflicts` cohort identity** (util.ts): `sectionId ?? classId` —
  bare `classId` comparison makes any two section slots "conflict" because
  `undefined === undefined`.
- **Legacy replay paths**: `importTimetableSlots` + `applyTemplateToTerm`
  still write `classId` (commented at each head). Don't copy their patterns
  into new code.
- **Dictionaries**: slot editor labels live in `school-en.json`/`school-ar.json`
  under `school.timetable.slotEditor` — keep parity when adding keys.

## Related Blocks

- [Catalog](../../catalog/CLAUDE.md) — `provision.ts` consumes
  `calendars.ts` + `structures.ts` for the schedule stage; SubjectSelection
  feeds the generator and the slot editor's subject picker
- [Attendance](../attendance/CLAUDE.md) — consumes slots for teacher
  scoping, period-mode, and current-period auto-selection;
  `markPeriodAttendance` resolves sectionId from `timetableId`
- [Conference](../conference/CLAUDE.md) — `Conference.timetableId` starts a
  live class from a slot
- Admission — `placeStudentInSection` sets `Student.sectionId`, which is what
  makes the section-based timetable visible to a student

## After You Finish

1. Update `ISSUE.md` — check completed items, add new issues found
2. Update `README.md` — if routes, files, or completion% changed; bump frontmatter `completion` and `last_audited`
3. Run `NODE_OPTIONS='--max-old-space-size=8192' pnpm tsc --noEmit`
4. If you touched DB: write a migration test before merging
