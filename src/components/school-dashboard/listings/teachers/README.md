## Teachers — Faculty Management

### Overview

The Teachers block manages teaching staff records including hiring, department assignments, class/subject assignments, and schedule tracking. Supports multi-step wizard creation with personal info, contact, employment, qualifications, expertise, location, attachments, and photo steps.

### Capabilities by Role

- **Admin**: CRUD teachers, bulk CSV import/export, department assignments, class/subject assignments, status tracking
- **Teacher**: View own profile, update contact details, view assigned classes and schedule
- **Student**: View teacher names and subjects
- **Guardian**: View child's teachers and contact info

### Routes

| Route                                                                                  | Page                 | Status      |
| -------------------------------------------------------------------------------------- | -------------------- | ----------- |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/teachers`                         | Teacher List         | Ready       |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/teachers/[id]`                    | Teacher Detail       | Ready       |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/teachers/add`                     | Add Teacher (start)  | Ready       |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/teachers/add/[id]/information`    | Add - Information    | Ready       |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/teachers/add/[id]/contact`        | Add - Contact        | Ready       |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/teachers/add/[id]/employment`     | Add - Employment     | Ready       |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/teachers/add/[id]/qualifications` | Add - Qualifications | Ready       |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/teachers/add/[id]/expertise`      | Add - Expertise      | Ready       |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/teachers/add/[id]/experience`     | Add - Experience     | Ready       |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/teachers/add/[id]/location`       | Add - Location       | Ready       |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/teachers/add/[id]/attachments`    | Add - Attachments    | Ready       |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/teachers/add/[id]/photo`          | Add - Photo          | Ready       |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/teachers/departments`             | Departments          | Ready       |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/teachers/schedule`                | Schedule             | Ready       |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/teachers/performance`             | Performance          | In Progress |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/teachers/settings`                | Settings             | In Progress |

### File Structure

```
src/components/school-dashboard/listings/teachers/
  actions.ts           # Server actions (CRUD, scoped by schoolId)
  authorization.ts     # RBAC permission checks
  columns.tsx          # Table column definitions with filter meta
  config.ts            # Constants and configuration
  content.tsx          # Server component (data fetching)
  export-button.tsx    # CSV export functionality
  list-params.ts       # nuqs URL state
  profile.tsx          # Teacher profile component
  queries.ts           # Read-only database queries
  table.tsx            # Client DataTable with useDataTable
  types.ts             # Transport types
  validation.ts        # Zod schemas
```

### Status

**Completion:** 85% | **Blockers:** None

### Integration Points

- **Classes**: Teacher assigned as homeroom or subject teacher
- **Departments**: TeacherDepartment many-to-many
- **Subjects**: Subject specialization tracking
- **Timetable**: Teaching schedule generated from assignments
- **Attendance**: Teacher attendance and leave management (planned)

### Assign subjects (row menu → dialog)

Every row's ⋯ menu has **Assign subjects**, incomplete profiles included. It opens
`subjects/dialog.tsx` titled "Teacher {name}" (`subjectsEditor.teacherTitle`). The
shared `subjects/editor.tsx` (also the wizard's step) shows G1…G12 chips
(`subjectsEditor.gradeShort`); you pick one grade at a time, and a dot marks grades that
already have work. The grade's subjects show as one swipeable row of thumbnail cards
(`no-scrollbar`), with the catalog thumbnail first and `subjects/image-map` as the fallback.
Tapping a card takes every free section; the أ/ب chips hand over single sections. A dashed
chip means another teacher holds that section.
