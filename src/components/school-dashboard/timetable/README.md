---
epic: 05
sprint: Q3-2026
title: Timetable (LMS scheduling)
file_type: readme
owner: Abdout
maturity: Production-Ready
completion: 95
tracker: https://github.com/databayt/hogwarts/issues/323
docs: https://ed.databayt.org/en/docs/timetable
last_audited: 2026-10-04
---

## Timetable -- Weekly Schedule Management

### Overview

The Timetable block provides school-wide weekly schedule building, conflict detection, and multi-view display. Schedules are **section-based** — each section (Grade 1-A, Grade 7-B) gets a complete weekly timetable with subjects distributed across periods. Teachers and classrooms are assigned per slot, with unassigned slots shown as "Unassigned" for later teacher assignment.

**Who teaches what (2026-10-04):** `SubjectTeacher` (section × subject → teacher, per term) is the one stored fact about teaching; a row exists only once someone is assigned. A subject with no row in a section is "waiting for a teacher" — derived, never stored — and its periods show «بانتظار معلم» to admins. Classes are being retired: nothing here creates or reads a `Class`.

**Data Model:** `Timetable` has `sectionId` (which section), `subjectId` (what subject), `classroomId` (where), `teacherId` (who, nullable). Legacy `classId` survives on old rows only — as of 2026-06-12 the **manual slot lifecycle is section-first too**: `upsertTimetableSlot` requires `sectionId` + `subjectId` (editing a legacy row backfills its section fields in place), `deleteTimetableSlot` is id-based, and student/guardian reads OR `Student.sectionId` with legacy `StudentClass` classIds so section-generated schedules are visible immediately after placement. Default terms are calendar-aware via `calendars.ts` (`ACADEMIC_CALENDARS` — country/structure → N terms with date-correct active term; see /docs/provision).

### Capabilities by Role

- **Admin**: Build/edit weekly schedules, configure working days and lunch breaks, detect and resolve conflicts (teacher/room/class double-booking), manage term-based schedules, print A4 timetables, switch between class/teacher/room views. Assign a teacher to subjects and sections in three places — the Add Teacher wizard step, the /teachers row menu dialog, and the school-wide board at `/timetable/teachers` — and the timetable follows (periods swap inside the section when the teacher is busy).
- **Teacher**: View personal teaching schedule, see assigned classes and periods, print weekly timetable
- **Student**: One view — the week grid for their own section (same `SimpleGrid` the admin builds in, read-only), with the current/next-class card above it. No Today/Full tab split: a student has a single schedule, so the tabs only ever showed the same data twice. Reaching `/timetable` at all requires the route to list STUDENT in `src/routes.ts` — it did not until 2026-09-01, and the edge gate sent every student to `/unauthorized`
- **Guardian**: View child's class schedule via parent portal (keeps the Today/Full tabs)
- **All roles**: The "Full Week" grid shows a lightweight live-class indicator (pulsing dot for `live`, outline dot for `scheduled`) on any slot with a Conference session today — see `live-class-join.ts` → `getLiveClassIndicators`. Join stays on the Today cards; the grid indicator is awareness-only.

### Routes

The class / teacher / room views are not separate routes — they are tabs/view
switches inside the role-routed builder (`views/role-router.tsx`). The actual
route segments are:

| Route                                                          | Page                                          | Status |
| -------------------------------------------------------------- | --------------------------------------------- | ------ |
| `/{lang}/s/{subdomain}/(school-dashboard)/timetable`           | Schedule Builder (role-routed)                | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/timetable/full`      | Full-week view (teacher/guardian only)        | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/timetable/conflicts` | Conflict Resolution                           | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/timetable/settings`  | Schedule Config (days, lunch, periods, terms) | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/timetable/generate`  | Auto-Generate                                 | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/timetable/analytics` | Analytics                                     | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/timetable/teachers`  | Teacher assignments board (admin)             | Ready  |

(`layout.tsx` provides the sub-nav; each route has `loading.tsx`, and the root
has `error.tsx`.)

Role access is gated at the EDGE, in `src/routes.ts` — not by these pages, which
carry no guard of their own. `/timetable` and `/timetable/full` list
ADMIN/TEACHER/STUDENT/GUARDIAN/DEVELOPER as exact entries; the `/timetable/*`
wildcard stays ADMIN/TEACHER/DEVELOPER so `generate`, `settings`, `conflicts` and
`analytics` remain closed. `isRouteAllowedForRole` matches exact before wildcard,
which is the only reason that split works — widening the wildcard would silently
open all four admin pages. `/my-timetable` also appears in the matrix and has no
page behind it; nothing routes there.

### File Structure

```
src/components/school-dashboard/timetable/
  actions.ts            # All server actions ("use server"): reads, mutations,
                        #   conflict detection, substitutions, templates, periods
  content.tsx           # Client entry — wraps RoleRouter in a SessionProvider
  types.ts              # TypeScript interfaces (Conflict, ConstraintViolation, …)
  validation.ts         # Zod schemas + validation helpers
  structures.ts         # Timetable structure presets (by country/curriculum)
  calendars.ts          # ACADEMIC_CALENDARS — country/structure → terms
  config.ts             # Runtime config (DRAFT_TERM_ID, day labels, colours)
  util.ts               # Pure helpers (detectConflicts cohort identity, etc.)
  permissions.ts        # Server-side guards (requireAdminAccess/…), audit log
  permissions-config.ts # Client-safe permission matrix + role→view mapping
  live-class-join.ts    # attachLiveClasses (Today-card Join target) +
                        #   getLiveClassIndicators (weekly-grid live/scheduled dots)
  slot-editor-dialog.tsx# Slot add/edit dialog (section + subject pickers)
  print.css             # A4 print styles
  analytics/content.tsx     # Analytics page
  conflicts/content.tsx     # Conflict-resolution page
  generate/content.tsx      # Auto-generate page
  generate/algorithm.ts     # Scheduling algorithm (generateSectionTimetable)
  generate/inputs.ts        # buildGenerationInputs — the ONE generator loader
  generate/teacher-plan.ts  # Placeholder teachers keep parallel sections apart
  assignments/              # Who teaches which subject in which section
    plan.ts                 #   pure planner: assign, swap inside the section, residuals
    apply.ts                #   locked writes (advisory lock + parked rows), release
    queries.ts, keys.ts     #   board + teacher-editor data; cellKey (client-safe)
    actions.ts              #   assignTeacher, unassignTeacher, saveTeacherSubjects,
                            #   suggestTeacherAssignments, getAssignmentBoard
    suggest.ts              #   pure: qualified teachers for waiting pairs
    carry.ts                #   prepareTerm — a new term inherits teachers + slots
    derive.ts               #   backfill for schools that predate assignments
    board.tsx, content.tsx  #   the /timetable/teachers board
  settings/content.tsx      # Days / lunch / periods / terms config
  substitutions/            # Absence + substitute-finder + records list
    content.tsx, absence-form.tsx, substitute-finder.tsx, substitution-list.tsx
  export/                   # PDF export
    timetable-pdf.tsx, use-timetable-export.ts, index.ts
  views/                    # Role-based rendering
    role-router.tsx         #   loads active term + personalized data, routes by role
    admin-view.tsx, teacher-view.tsx, student-view.tsx, guardian-view.tsx
    simple-grid.tsx         #   the weekly grid primitive
    grid-skeleton.tsx       #   TimetableGridSkeleton — mirrors simple-grid's DOM
    preview.tsx, live-join-button.tsx, start-live-class-button.tsx, index.ts
```

Tests live under `src/tests/school-dashboard/timetable/` and
`src/tests/lib/timetable-calendars.test.ts` (NOT a local `__tests__/` dir).

### Status

**Completion:** 95% | **Maturity:** Production-Ready | **Blockers:** None

### Architecture: Section-Based Scheduling

```
Student → Section (Grade 1-A) → Timetable slots per period/day
  Section.classroomId = homeroom (main classroom)
  Timetable slot = section + period + day → subject + classroom + teacher

  Regular subjects → homeroom classroom
  Lab subjects → lab/gym/common classroom
  Teacher nullable → "Unassigned" until assigned
```

**Generation flow:** `buildGenerationInputs()` (`generate/inputs.ts`) → `generateSectionTimetable()` (`generate/algorithm.ts`)

1. Loads sections (ordered by grade, then letter) with their grade's subjects (`SubjectSelection.weeklyPeriods`)
2. Pins each subject to the teacher ASSIGNED to it in that section (`SubjectTeacher`); an unassigned subject gets a placeholder teacher shared by the grade's sections, so parallel sections are never scheduled as copies
3. Places each subject at most once a day, best first: the real teacher, then the placeholder, then a teacher-less period
4. Assigns homeroom for regular subjects, finds lab rooms for lab subjects
5. Prevents section double-booking; placeholders are stripped to `teacherId: null` before anything is saved

**Assignment flow:** `assignTeacher` / `saveTeacherSubjects` (`assignments/actions.ts`) → `planAssignment` (pure) → `applyAssignment` (one transaction under `pg_advisory_xact_lock`). Fixed slots (a live or upcoming conference, a pending substitution) never move; no teacher, room or section is double-booked; daily and weekly caps hold. What can't be placed comes back as residuals with a reason.

### Integration Points

- **Sections**: Timetable slots reference sections (Grade 1-A, Grade 7-B); each section has a homeroom classroom
- **CatalogSubjects**: Subjects come from the catalog, linked via `SchoolSubjectSelection` per grade
- **Teachers**: `SubjectTeacher` decides who teaches each subject in each section; the teacher wizard's "Subjects & sections" step and the /teachers row dialog share one editor (`listings/teachers/subjects/`). Deactivating or deleting a teacher returns their subjects to waiting. Teacher dashboards, attendance and the mobile `/teacher/classes` read assignments.
- **Exams / grades**: exams are set for a grade or section + subject (`teaching-scope/`), and a teacher may open the exams of the subjects they're assigned
- **Classrooms**: Homeroom for regular subjects, common rooms (lab, gym) for specialized subjects
- **Attendance**: Attendance module uses sections for roster (Section.students) instead of StudentClass
- **Academic Settings**: Term selector depends on academic year/term configuration

### Agents & Skills

- `agent:nextjs` — App Router + streaming
- `agent:react` — lesson + chapter UI
- `agent:performance` — CDN asset migration + Core Web Vitals
- `skill:/performance` — perf audit
- `skill:/skeleton` — loading-state sweep
