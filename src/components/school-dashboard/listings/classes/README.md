## Classes — Academic Class Management

### Overview

The Classes block organizes students into grade sections, assigns homeroom and subject teachers, manages class schedules, and tracks enrollment capacity. Supports a multi-step wizard for class creation with information, schedule, and management steps. Includes detail views with roster, subject-teacher assignments, and course management.

### Capabilities by Role

- **Admin**: CRUD classes, assign teachers, enroll students, manage schedules, set capacity limits
- **Teacher**: View assigned classes, access student rosters, view schedule
- **Student**: View own class assignment and timetable
- **Guardian**: View child's class, teachers, and schedule

### Routes

| Route                                                                              | Page              | Status |
| ---------------------------------------------------------------------------------- | ----------------- | ------ |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/classes/add/[id]/information` | Add - Information | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/classes/add/[id]/schedule`    | Add - Schedule    | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/classes/add/[id]/management`  | Add - Management  | Ready  |

Note: The classes list page uses the classrooms route group. Detail pages are rendered via the component `detail.tsx`.

### File Structure

```
src/components/school-dashboard/listings/classes/
  actions.ts                  # Server actions (CRUD, scoped by schoolId)
  authorization.ts            # RBAC permission checks
  columns.tsx                 # Table column definitions
  config.ts                   # Constants and configuration
  content.tsx                 # Server component (data fetching)
  course-management.tsx       # Course/curriculum management UI
  detail.tsx                  # Class detail view
  evaluation-type-selector.tsx # Evaluation type selection
  export-button.tsx           # CSV export
  form.tsx                    # Multi-step form (create/edit)
  grade-actions.ts            # Grade-related server actions
  information.tsx             # Wizard step 1: basic info
  list-params.ts              # nuqs URL state
  prerequisite-selector.tsx   # Class prerequisite selection
  queries.ts                  # Read-only database queries
  schedule.tsx                # Wizard step 2: schedule/location
  subject-teachers.tsx        # Subject teacher assignment UI
  table.tsx                   # Client DataTable
  types.ts                    # Transport types
  validation.ts               # Zod schemas
```

### Status

**Completion:** 85% | **Blockers:** Subject teacher assignment partially implemented

### Integration Points

- **Students**: StudentClass many-to-many enrollment
- **Teachers**: Homeroom teacher + subject teacher assignments
- **Subjects**: Each class linked to subject
- **Timetable**: Schedule slots (term, periods, classroom)
- **Attendance**: Per-class, per-period attendance
- **Grades**: Class-level gradebook and analytics
