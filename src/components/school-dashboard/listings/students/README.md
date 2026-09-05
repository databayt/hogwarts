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
  access-code-dialog.tsx # "Link Parent" access-code dialog (store-backed)
  access-code-store.ts # Module store for the access-code dialog — open-state +
                       #   codes live outside React so the dialog survives the table
                       #   remount the generate action triggers (issue #381)
  (placement)          # "Assign Section" uses admission/placement-store.ts +
                       #   admission/placement-dialog-host.tsx — ONE store-driven
                       #   dialog shared with the Enrollment tab
  wizard/authorize.ts  # The one auth+role guard every wizard action calls
  wizard/finish.ts     # The one wizard finisher (academic Next + footer Skip):
                       #   provision, toast warnings, open the credentials dialog
  list-params.ts       # nuqs URL state (page, perPage, name, status, sort)
  queries.ts           # Read-only database queries
  table.tsx            # Client DataTable with useDataTable
  types.ts             # Transport types (StudentDTO, StudentRow)
  validation.ts        # Zod schemas (shared client + server)
```

### Security (RBAC) — every action gates on the SESSION, not schoolId

`getTenantContext()` resolves `schoolId` from the `x-subdomain` header **before**
the session, so `schoolId` is resolvable without a login. An action that checks
only `if (!schoolId)` is therefore callable by an unauthenticated request to a
valid school subdomain. **Every** server action here — including the per-step
wizard sub-actions (`wizard/{personal,location,attachments}/actions.ts`) — must
call `auth()` + `assertStudentPermission(...)` (the `authorizeWizardAction` guard),
not just resolve the tenant. See `authorization.ts` for the permission matrix.

### The assembly point

Four intake channels (public application, this wizard, onboarding CSV,
`/school/bulk` CSV) all call `provisionStudent` (`src/lib/student-provisioning.ts`)
and `notifyProvisionedStudent`. From that point every student is handled by the
same steps regardless of channel: **Assign Section** (the admission
`PlacementDialog`, offered on the Enrollment tab for PORTAL rows and on this list
for everyone with a grade and no seat), fee assignment + invoices
(`ensureStudentFeeAssignments`), the fee-due / fee-overdue crons, and the
`Applications` tab that lists every channel. Guardians for every channel are
written by `createOrLinkGuardian` (phone + WhatsApp rows).

### Status

**Completion:** 95% | **Blockers:** None (see ISSUE.md 2026-09-05 for the
"graded but unbilled" gap)

### Integration Points

- **Classes**: StudentClass many-to-many enrollment
- **Guardians**: StudentGuardian linking (resolved)
- **Attendance**: Attendance records per student
- **Grades**: Results linked via studentId
- **Timetable**: Schedule inherited from class enrollment
