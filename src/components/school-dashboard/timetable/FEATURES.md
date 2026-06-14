# Timetable Features

> Rewritten 2026-06-13. The previous version documented a cookie-based
> "Show All Subjects" / "Display Fallback Data" settings dialog and local
> teacher-info overrides — all of that was removed in the route-consolidation
> and section-first refactors. This file now reflects what actually ships.

## Scheduling model

Schedules are **section-based**: each section (e.g. Grade 1-A) gets a complete
weekly timetable. A slot is `(section, dayOfWeek, period)` → `subject`,
`classroom`, and an optional `teacher` (unassigned slots show as "Unassigned").
Legacy `classId` survives only on old rows; see `CLAUDE.md` → Key Decisions.

## What an admin can do

- **Build / edit** the weekly grid; the slot editor (`slot-editor-dialog.tsx`)
  has section + subject pickers and validates teacher/room/section constraints
  before saving.
- **Move** slots (drag/replace) with conflict detection — teacher double-book,
  room double-book, and **section double-book** are all blocked at the target.
- **Auto-generate** a term's timetable from the school's structure +
  subject allocations (`generate/`), then review and apply it.
- **Detect & resolve conflicts** (`conflicts/`) across the whole term.
- **Configure** working days, lunch position, periods, and term dates
  (`settings/`), with calendar-aware term defaults (`calendars.ts`).
- **Templates** — capture a term's pattern and replay it onto another term
  (atomic clear + insert).
- **Substitutions** — record teacher absences, find available substitutes, and
  assign/track them (`substitutions/`); the assigned teacher is notified in the
  school's language.
- **Analytics** (`analytics/`) and **A4 PDF export** (`export/`).

## Role views

`views/role-router.tsx` loads the active term + personalized data and routes to
the right view: **admin** (full edit), **teacher** (own schedule + live-class
join), **student** (own section), **guardian** (each child's section). When a
school has no real term yet, a read-only draft grid renders with a "Set up
timetable" CTA for admins.

## Notes

- All mutations are admin-gated (`requireAdminAccess`) and `schoolId`-scoped.
- Mutation inputs are Zod-validated; server-side notifications are localized by
  `School.preferredLanguage`.
- Conflicts are signalled with an icon + screen-reader text, not colour alone.
