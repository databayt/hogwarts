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

### Integration Points

- Departments (via `departmentId` relation)
- User accounts (optional `userId` linking for portal access)
- School model (multi-tenant via `schoolId`)
