## Manage -- Exam Lifecycle Management

### Overview

The Manage sub-block handles the entire lifecycle of examinations from creation to completion. It provides a multi-step creation form, scheduling with conflict detection, marks entry, calendar view, and analytics dashboard.

### Capabilities by Role

- **Admin**: Full CRUD on all exams, enter marks, view analytics, export data
- **Teacher**: Create/edit exams for assigned subjects, enter marks for own classes, view analytics

### Routes

| Route                                                              | Page                          | Status    |
| ------------------------------------------------------------------ | ----------------------------- | --------- |
| `/{lang}/s/{subdomain}/(school-dashboard)/exams/manage`            | Exam list (table view)        | Not wired |
| `/{lang}/s/{subdomain}/(school-dashboard)/exams/manage/new`        | Create exam (multi-step form) | Not wired |
| `/{lang}/s/{subdomain}/(school-dashboard)/exams/manage/[id]`       | Exam details                  | Not wired |
| `/{lang}/s/{subdomain}/(school-dashboard)/exams/manage/[id]/edit`  | Edit exam                     | Not wired |
| `/{lang}/s/{subdomain}/(school-dashboard)/exams/manage/[id]/marks` | Enter marks                   | Not wired |
| `/{lang}/s/{subdomain}/(school-dashboard)/exams/manage/calendar`   | Calendar view                 | Not wired |

### File Structure

```
manage/
├── content.tsx                # Server component - main page
├── table.tsx                  # Client component - data table
├── columns.tsx                # Table column definitions
├── form.tsx                   # Multi-step exam form
├── basic-information.tsx      # Form step 1
├── schedule-marks.tsx         # Form step 2
├── instructions-details.tsx   # Form step 3
├── calendar.tsx               # Calendar view component
├── marks-entry-form.tsx       # Grade entry interface
├── analytics-dashboard.tsx    # Statistics dashboard
├── results-list.tsx           # Results display
├── export-button.tsx          # Export functionality
├── conflict-display.tsx       # Scheduling conflict UI
├── standards-coverage.tsx     # Standards coverage view
├── quick-paper-button.tsx     # Quick paper generation
├── actions.ts                 # Server actions (CRUD, marks, analytics)
├── validation.ts              # Zod schemas
├── types.ts                   # TypeScript types
├── config.ts                  # Static configuration (exam types, statuses)
├── utils.ts                   # Duration calculation, conflict detection
└── list-params.ts             # URL state management
```

### Status

**Completion:** 75% | **Blockers:** Route pages not created

All 21 component and utility files exist. Server actions include CRUD, marks management, analytics, scheduling, and export. Missing route pages in the app directory.

### Integration Points

- **Question Bank**: Link questions when creating exam
- **Generate**: "Generate from Template" option in create form
- **Mark**: "Enter Marks" action redirects to marking interface
- **Results**: "View Results" for completed exams
- **Timetable**: Conflict detection with scheduled classes
