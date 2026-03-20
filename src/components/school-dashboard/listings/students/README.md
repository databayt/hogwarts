## Students — Student Information Management

### Overview

The Students block manages the complete student lifecycle from enrollment to graduation. Admins can create, search, filter, bulk-import, and export student records with full multi-tenant isolation. Students are linked to classes (many-to-many via StudentClass) and guardians (via StudentGuardian).

### Capabilities by Role

- **Admin**: CRUD students, bulk CSV import/export, class enrollment, guardian linking, status tracking
- **Teacher**: View students in assigned classes (read-only)
- **Student**: View own profile and class enrollment
- **Guardian**: View linked child's profile and class assignments

### Routes

| Route                                                                                      | Page              | Status      |
| ------------------------------------------------------------------------------------------ | ----------------- | ----------- |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/students`                             | Students List     | Ready       |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/students/[id]`                        | Student Detail    | Ready       |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/students/add/[id]/personal`           | Add - Personal    | Ready       |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/students/add/[id]/contact`            | Add - Contact     | Ready       |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/students/add/[id]/enrollment`         | Add - Enrollment  | Ready       |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/students/add/[id]/location`           | Add - Location    | Ready       |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/students/add/[id]/health`             | Add - Health      | Ready       |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/students/add/[id]/previous-education` | Add - Previous Ed | Ready       |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/students/add/[id]/attachments`        | Add - Attachments | Ready       |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/students/add/[id]/photo`              | Add - Photo       | Ready       |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/students/manage`                      | Manage            | Ready       |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/students/enroll`                      | Enroll            | Ready       |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/students/guardians`                   | Guardians         | Ready       |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/students/year-levels`                 | Year Levels       | Ready       |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/students/performance`                 | Performance       | In Progress |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/students/analysis`                    | Analysis          | In Progress |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/students/reports`                     | Reports           | In Progress |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/students/settings`                    | Settings          | In Progress |

### File Structure

```
src/components/school-dashboard/listings/students/
  actions.ts           # Server actions (CRUD, scoped by schoolId)
  authorization.ts     # RBAC permission checks
  columns.tsx          # Table column definitions with filter meta
  config.ts            # Constants and configuration
  content.tsx          # Server component (data fetching, passes to table)
  export-button.tsx    # CSV export functionality
  access-code-dialog.tsx # Student access code dialog
  list-params.ts       # nuqs URL state (page, perPage, name, status, sort)
  queries.ts           # Read-only database queries
  table.tsx            # Client DataTable with useDataTable
  types.ts             # Transport types (StudentDTO, StudentRow)
  validation.ts        # Zod schemas (shared client + server)
```

### Status

**Completion:** 90% | **Blockers:** None

### Integration Points

- **Classes**: StudentClass many-to-many enrollment
- **Guardians**: StudentGuardian linking (resolved)
- **Attendance**: Attendance records per student
- **Grades**: Results linked via studentId
- **Timetable**: Schedule inherited from class enrollment
