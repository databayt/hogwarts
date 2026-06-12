---
epic: 05
sprint: Q3-2026
title: Timetable (LMS scheduling)
file_type: readme
owner: Abdout
maturity: Built+Polish
completion: 80
tracker: https://github.com/databayt/hogwarts/issues/323
docs: https://ed.databayt.org/en/docs/us-curriculum
last_audited: 2026-05-25
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

| Route                                                           | Page                | Status |
| --------------------------------------------------------------- | ------------------- | ------ |
| `/{lang}/s/{subdomain}/(school-dashboard)/timetable`            | Schedule Builder    | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/timetable/by-class`   | Class View          | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/timetable/by-teacher` | Teacher View        | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/timetable/by-room`    | Room View           | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/timetable/conflicts`  | Conflict Resolution | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/timetable/settings`   | Schedule Config     | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/timetable/generate`   | Auto-Generate       | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/timetable/templates`  | Templates           | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/timetable/analytics`  | Analytics           | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/timetable/full`       | Full View           | Ready  |

### File Structure

```
src/components/school-dashboard/timetable/
  actions.ts                  # Server actions (CRUD, conflict detection)
  content.tsx                 # Main server component
  content-production.tsx      # Production data loader
  types.ts                    # TypeScript interfaces
  validation.ts               # Zod schemas
  structures.ts               # Data structure helpers
  constants.ts                # Day/period constants
  config.ts                   # Runtime configuration
  config.json                 # Static configuration
  permissions.ts              # Role-based access control
  permissions-config.ts       # Permission definitions
  use-timetable-permissions.ts # Permission hook
  timetable.ts                # Store / state management
  timetable-grid.tsx          # Grid display component
  timetable-grid-enhanced.tsx # Enhanced grid with DnD
  timetable-cell.tsx          # Individual cell component
  timetable-header.tsx        # Header with term/view selectors
  timetable-mobile.tsx        # Mobile-optimized view
  slot-editor.tsx             # Slot assignment editor
  slot-editor-dialog.tsx      # Dialog wrapper for editor
  subject-selector.tsx        # Subject picker
  conflicts-drawer.tsx        # Conflicts panel
  schedule-settings-dialog.tsx # Working days / lunch config
  config-dialog.tsx           # General config dialog
  import-export.tsx           # CSV/JSON import/export
  visual-builder.tsx          # Visual schedule builder
  analytics-reports.tsx       # Usage analytics
  teacher-info-popup.tsx      # Teacher detail hover card
  about-hover-card.tsx        # Info hover card
  nav.tsx                     # Timetable sub-navigation
  print.css                   # A4 print styles
  fallback-data.ts            # Demo/fallback data
  seed-utils.ts               # Seed data utilities
  utils.ts                    # General utilities
  use-mobile.tsx              # Mobile detection hook
  use-media-query.ts          # Media query hook
  use-toast.ts                # Toast notification hook
  theme-provider.tsx          # Theme context
  by-class/content.tsx        # Class view page
  by-teacher/content.tsx      # Teacher view page
  by-room/content.tsx         # Room view page
  conflicts/content.tsx       # Conflicts page
  settings/content.tsx        # Settings page
  generate/content.tsx        # Auto-generate page
  generate/algorithm.ts       # Scheduling algorithm
  templates/content.tsx       # Templates page
  templates/create-template-dialog.tsx
  templates/apply-template-dialog.tsx
  analytics/content.tsx       # Analytics page
  substitutions/content.tsx   # Substitution management
  substitutions/absence-form.tsx
  substitutions/substitute-finder.tsx
  substitutions/substitution-list.tsx
  export/timetable-pdf.tsx    # PDF export
  export/use-timetable-export.ts
  views/admin-view.tsx        # Admin role view
  views/teacher-view.tsx      # Teacher role view
  views/student-view.tsx      # Student role view
  views/guardian-view.tsx     # Guardian role view
  views/role-router.tsx       # Routes to correct view by role
  views/preview.tsx           # Preview mode
  views/simple-grid.tsx       # Simplified grid
  __tests__/actions.test.ts
  __tests__/structures.test.ts
  __tests__/validation.test.ts
  __tests__/production-readiness.test.ts
```

### Status

**Completion:** 90% | **Blockers:** None

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
