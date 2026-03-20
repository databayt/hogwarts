## Timetable -- Weekly Schedule Management

### Overview

The Timetable block provides school-wide weekly schedule building, conflict detection, and multi-view display. Administrators create and manage schedules per term, while teachers and students view their personalized timetables. Supports flexible working days, configurable lunch breaks, and A4-ready printing.

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

### Integration Points

- **Classes**: Timetable slots reference Class entities; class selection by grade with sections (A/B/C/D)
- **Teachers**: Teacher view shows full teaching load; free period identification for meetings
- **Attendance**: Attendance module uses timetable for period-by-period roster
- **Lessons**: Lesson plans link to timetable slots for preparation context
- **Academic Settings**: Term selector depends on academic year/term configuration
