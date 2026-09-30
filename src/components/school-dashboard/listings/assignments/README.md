## Assignments -- Homework and Task Management

### Overview

The Assignments feature enables teachers and administrators to create homework, quizzes, projects, and other assessments. It supports a two-step wizard (information, details/grading), nine assignment types, due date management, points/weight configuration, class targeting, student submission forms, teacher review interface, and CSV export. Built with full multi-tenant isolation, notification dispatch, and RBAC.

### Capabilities by Role

- **Admin**: Full CRUD on all assignments across school, publish/unpublish, export to CSV, view all submissions
- **Teacher**: Create assignments for their classes, set type/points/weight/due date, grade submissions, export grades
- **Student**: View assigned work, submit assignments, view grades and feedback
- **Guardian**: View child's assignments, due dates, and grades

### Routes

| Route                                                                                  | Page                     | Status |
| -------------------------------------------------------------------------------------- | ------------------------ | ------ |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/assignments`                      | Assignments List         | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/assignments/[id]`                 | Assignment Detail        | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/assignments/add/[id]/information` | Wizard Step 1            | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/assignments/add/[id]/details`     | Wizard Step 2            | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/my-assignments`                              | My Assignments (student) | Ready  |

### Student page (`/my-assignments`, واجباتي)

`my-assignments-content.tsx` follows the shared phone-pattern kit used by /library, /live, /lumos and the student /exams (`school-dashboard/shared/README.md`): the saas-marketing green `BrandBanner` naming the next assignment due (or "all caught up" / the overdue count), one `StatPanel` (to do · overdue · handed in · graded), then three `SectionHeader` sections — To do (overdue first, then by due date), Handed in, Graded — of `ListRow`s with a `DateTile` for the due date. Each row is a native `<details>` that opens the brief and the `StudentSubmissionCard` in place, so the page stays a server component. Empty sections are not rendered. All layout is logical (`ms-`/`ps-`/`text-start`), so /ar (RTL) and /en (LTR) share one tree. Copy lives in `school.myAssignments` (`stats`, `sections`, `when`, `nextDue`, `allCaughtUp`, …).

### File Structure

```
assignments/
  content.tsx              # Server component - renders assignments table
  actions.ts               # Server actions for CRUD + export
  validation.ts            # Zod schemas
  types.ts                 # TypeScript type definitions
  config.ts                # Constants, assessment type options
  form.tsx                 # Client form component
  columns.tsx              # Table column definitions (legacy)
  columns/
    index.ts               # Column definitions module
    export.ts              # Export column config
  table.tsx                # DataTable component
  list-params.ts           # Search/filter URL parameters
  authorization.ts         # RBAC permission checks
  queries.ts               # Centralized query builders
  detail.tsx               # Assignment detail view
  information.tsx          # Info display section
  details.tsx              # Details/settings display section
  student-view.tsx         # Student-facing assignment view
  submission-form.tsx      # Student submission form (file/text upload)
  teacher-review.tsx       # Teacher grading/review interface
  export-button.tsx        # CSV export button component
  wizard/
    config.ts                   # Wizard config (2 steps: information, details)
    actions.ts                  # Wizard-level server actions
    use-assignment-wizard.ts    # Wizard state hook
    information/                # Step 1: title, description, class
      content.tsx, form.tsx, validation.ts, actions.ts
    details/                    # Step 2: type, points, weight, due date
      content.tsx, form.tsx, validation.ts, actions.ts
  __tests__/
    actions.test.ts             # Server action tests
    validation.test.ts          # Zod schema tests
```

### Status

**Completion:** 80% | **Blockers:** None

### Integration Points

- Classes (assignment targeting)
- Students (submission tracking)
- Notification dispatch (`@/lib/dispatch-notification`)
- File system (`@/components/file` for CSV export)
- Results/gradebook (grade contribution)
- Calendar (due dates as events)
