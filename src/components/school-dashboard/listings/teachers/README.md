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
shared `subjects/editor.tsx` (also the wizard's step) is one filter row, one card row
and a light counter:

- **Filter row** — ★ Specialty / All subjects, then All grades / G1…G12 (a dot marks
  grades with work; in the specialty view grades with nothing in it fade). A teacher
  with specialties opens on Specialty × All grades; one without opens on All subjects
  × their first grade.
- **Cards** — small thumbnail cards (`w-28`, catalog thumbnail, `subjects/image-map`
  fallback) in one swipeable `no-scrollbar` row, ordered by what the teacher teaches,
  then specialty, then subjects with free sections (on the saved state, so cards don't
  jump while clicked). Tapping a card takes every free section; the أ/ب chips hand over
  single sections; a dashed chip means another teacher holds it. Non-specialty cards
  are dimmed in the All view.
- **Counter** — "{subjects} subjects · {sections} sections · {load}/{cap} periods" over
  a 1px progress bar, red past the cap.

**Specialty = subject family.** Catalog subjects are per grade (`sd-g4-math`), so the ★
on a card marks the subject *name* across every grade (`subjects/families.ts`) and saves
one `TeacherSubjectExpertise` row per grade's subject (`saveTeacherSubjects` →
`specialtyIds`). Catalog `concept` is not used — it lumps Arabic with French and Islamic
with Christian studies. A subject the teacher teaches stays a specialty. The profile and
the detail page count/show specialties by family.

**Subjects column** (list + mobile card): the subjects the teacher teaches in the active
term, one chip per subject name (most sections first, two shown then `+N`), the full list
and section count in the tooltip; "No subjects yet" when unassigned. Built by
`subjects/taught.ts` from `SubjectTeacher` for both the first render (`content.tsx`) and
search/load-more (`getTeachers`).
