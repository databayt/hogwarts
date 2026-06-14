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
last_audited: 2026-06-13
---

## Timetable -- Weekly Schedule Management

### Overview

The Timetable block provides school-wide weekly schedule building, conflict detection, and multi-view display. Schedules are **section-based** — each section (Grade 1-A, Grade 7-B) gets a complete weekly timetable with subjects distributed across periods. Teachers and classrooms are assigned per slot, with unassigned slots shown as "Unassigned" for later teacher assignment.

**Data Model:** `Timetable` has `sectionId` (which section), `subjectId` (what subject), `classroomId` (where), `teacherId` (who, nullable). Legacy `classId` survives on old rows only — as of 2026-06-12 the **manual slot lifecycle is section-first too**: `upsertTimetableSlot` requires `sectionId` + `subjectId` (editing a legacy row backfills its section fields in place), `deleteTimetableSlot` is id-based, and student/guardian reads OR `Student.sectionId` with legacy `StudentClass` classIds so section-generated schedules are visible immediately after placement. Default terms are calendar-aware via `calendars.ts` (`ACADEMIC_CALENDARS` — country/structure → N terms with date-correct active term; see /docs/provision).

### Capabilities by Role

- **Admin**: Build/edit weekly schedules, configure working days and lunch breaks, detect and resolve conflicts (teacher/room/class double-booking), manage term-based schedules, print A4 timetables, switch between class/teacher/room views
- **Teacher**: View personal teaching schedule, see assigned classes and periods, print weekly timetable
- **Student**: View class timetable, see subject and period details
- **Guardian**: View child's class schedule via parent portal

### Routes

The class / teacher / room views are not separate routes — they are tabs/view
switches inside the role-routed builder (`views/role-router.tsx`). The actual
route segments are:

| Route                                                          | Page                                          | Status |
| -------------------------------------------------------------- | --------------------------------------------- | ------ |
| `/{lang}/s/{subdomain}/(school-dashboard)/timetable`           | Schedule Builder (role-routed)                | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/timetable/full`      | Full-week view                                | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/timetable/conflicts` | Conflict Resolution                           | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/timetable/settings`  | Schedule Config (days, lunch, periods, terms) | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/timetable/generate`  | Auto-Generate                                 | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/timetable/analytics` | Analytics                                     | Ready  |

(`layout.tsx` provides the sub-nav; each route has `loading.tsx`, and the root
has `error.tsx`.)

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
  live-class-join.ts    # attachLiveClasses resolver (timetable ↔ conference)
  slot-editor-dialog.tsx# Slot add/edit dialog (section + subject pickers)
  print.css             # A4 print styles
  analytics/content.tsx     # Analytics page
  conflicts/content.tsx     # Conflict-resolution page
  generate/content.tsx      # Auto-generate page
  generate/algorithm.ts     # Scheduling algorithm (generateSectionTimetable)
  settings/content.tsx      # Days / lunch / periods / terms config
  substitutions/            # Absence + substitute-finder + records list
    content.tsx, absence-form.tsx, substitute-finder.tsx, substitution-list.tsx
  export/                   # PDF export
    timetable-pdf.tsx, use-timetable-export.ts, index.ts
  views/                    # Role-based rendering
    role-router.tsx         #   loads active term + personalized data, routes by role
    admin-view.tsx, teacher-view.tsx, student-view.tsx, guardian-view.tsx
    simple-grid.tsx         #   the weekly grid primitive
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

**Generation flow:** `generateSectionTimetable()` in `generate/algorithm.ts`

1. Queries sections with their grade's subject allocations (`SchoolSubjectSelection.hoursPerWeek`)
2. For each section, fills the week with all subjects
3. Assigns teachers from `TeacherSubjectExpertise` (nullable if none available)
4. Assigns homeroom for regular subjects, finds lab rooms for lab subjects
5. Prevents section double-booking (Grade 1-A can't have two subjects same period)

### Integration Points

- **Sections**: Timetable slots reference sections (Grade 1-A, Grade 7-B); each section has a homeroom classroom
- **CatalogSubjects**: Subjects come from the catalog, linked via `SchoolSubjectSelection` per grade
- **Teachers**: Teacher assignment is optional; unassigned slots show "Unassigned"
- **Classrooms**: Homeroom for regular subjects, common rooms (lab, gym) for specialized subjects
- **Attendance**: Attendance module uses sections for roster (Section.students) instead of StudentClass
- **Academic Settings**: Term selector depends on academic year/term configuration

### Agents & Skills

- `agent:nextjs` — App Router + streaming
- `agent:react` — lesson + chapter UI
- `agent:performance` — CDN asset migration + Core Web Vitals
- `skill:/performance` — perf audit
- `skill:/skeleton` — loading-state sweep
