## Staff -- Administrative Personnel Management

### Overview

The Staff feature manages non-teaching school employees including administrative personnel, support staff, and contract workers. It handles employee records with position, department, employment status/type tracking, optional user account linking, and full search/filter capabilities. Built with a single-step form, multi-tenant isolation, and RBAC.

### Capabilities by Role

- **Admin**: Full CRUD on all staff records, link to user accounts, filter by status/type/department, search by name/position

### Routes

| Route                                                            | Page         | Status |
| ---------------------------------------------------------------- | ------------ | ------ |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/staff`      | Staff List   | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/staff/[id]` | Staff Detail | Ready  |

### File Structure

```
staff/
  content.tsx        # Server component - renders staff table
  actions.ts         # Server actions for CRUD
  validation.ts      # Zod schemas
  types.ts           # TypeScript type definitions
  config.ts          # Constants and configuration
  form.tsx           # Client form component (single-step)
  columns.tsx        # Table column definitions
  table.tsx          # DataTable component
  list-params.ts     # Search/filter URL parameters
  authorization.ts   # RBAC permission checks
  queries.ts         # Centralized query builders
```

### Status

**Completion:** 80% | **Blockers:** None

### Contact under the name (school setting)

The Name cell's second line is the staff member's **email** (default) or **phone**
(`phoneNumber`, else `alternatePhone`), picked per school at School → Configuration → "Contact under
name" (`/school/configuration/name-contact`, `School.staffNameContact`). `content.tsx` reads it with
`schoolNameContact(schoolId, "staff")`; the column renders the shared `NameContactLine`, which falls
back to the other value when the picked one is empty. `transformStaffToRow` lives in `queries.ts`
because the server content calls it (it sat in the client `table.tsx`, and `/staff` errored).

### Integration Points

- Departments (via `departmentId` relation)
- User accounts (optional `userId` linking for portal access)
- School model (multi-tenant via `schoolId`)
