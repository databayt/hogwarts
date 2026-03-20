## Grades — Gradebook and Academic Performance

### Overview

The Grades block provides a comprehensive gradebook where teachers enter scores, percentages auto-calculate, letter grades are assigned, and feedback is recorded. Supports multi-step grade entry (student/assignment selection then scoring), detail views, bulk entry, report generation, promotion tracking, and transcripts.

### Capabilities by Role

- **Admin**: View school-wide gradebook, generate reports, configure grade boundaries, manage promotions and transcripts
- **Teacher**: Enter grades for assigned classes, view class gradebook, provide feedback
- **Student**: View own grades, GPA, and teacher feedback
- **Guardian**: View child's grades, download report cards

### Routes

| Route                                                                           | Page            | Status      |
| ------------------------------------------------------------------------------- | --------------- | ----------- |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/grades`                    | Gradebook       | Ready       |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/grades/[id]`               | Grade Detail    | Ready       |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/grades/add/[id]/selection` | Add - Selection | Ready       |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/grades/add/[id]/scoring`   | Add - Scoring   | Ready       |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/grades/reports`            | Reports         | In Progress |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/grades/promotion`          | Promotion       | In Progress |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/grades/transcripts`        | Transcripts     | In Progress |

### File Structure

```
src/components/school-dashboard/listings/grades/
  actions.ts             # Server actions (CRUD, scoped by schoolId)
  authorization.ts       # RBAC permission checks
  bulk-entry.tsx         # Bulk grade entry component
  columns.tsx            # Table column definitions
  config.ts              # Constants and configuration
  content.tsx            # Server component (data fetching)
  data-fetchers.ts       # Data fetching utilities
  detail-content.tsx     # Grade detail view
  form.tsx               # Multi-step grade entry form
  grading.tsx            # Scoring/grading step
  list-params.ts         # nuqs URL state
  queries.ts             # Read-only database queries
  student-assignment.tsx # Student/assignment selection step
  table.tsx              # Client DataTable
  types.ts               # Transport types
  validation.ts          # Zod schemas
```

### Status

**Completion:** 75% | **Blockers:** None

### Integration Points

- **Students**: Grades linked via studentId
- **Classes**: Class-level gradebook and averages
- **Assignments**: Grades tied to assignment submissions
- **Subjects**: Subject-wise performance tracking
- **Teachers**: Grade entry by assigned teachers
- **Reports**: Report card generation (in progress)
