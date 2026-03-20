## Parents -- Guardian Account Management

### Overview

The Parents feature manages guardian accounts within the school dashboard. It handles guardian records (create, update, delete), links guardians to students via access codes, manages contact information, and provides RBAC-based access control. Built with a two-step wizard (information, contact) and full multi-tenant isolation.

### Capabilities by Role

- **Admin**: Full CRUD on all guardian records, link/unlink guardians to students, view all guardian data
- **Teacher**: View parents of students in their classes
- **Guardian**: View and edit own profile, view linked children
- **Staff**: Read-only access

### Routes

| Route                                                                              | Page          | Status |
| ---------------------------------------------------------------------------------- | ------------- | ------ |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/parents`                      | Parents List  | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/parents/[id]`                 | Parent Detail | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/parents/add/[id]/information` | Wizard Step 1 | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/parents/add/[id]/contact`     | Wizard Step 2 | Ready  |

### File Structure

```
parents/
  content.tsx           # Server component - renders parents table
  actions.ts            # Server actions for guardian CRUD
  validation.ts         # Zod schemas
  types.ts              # TypeScript type definitions
  config.ts             # Constants and configuration
  form.tsx              # Client form component
  information.tsx       # Basic info display section
  contact.tsx           # Contact info display section
  columns.tsx           # Table column definitions
  table.tsx             # DataTable component
  list-params.ts        # Search/filter URL parameters
  authorization.ts      # RBAC permission checks
  queries.ts            # Centralized query builders
  link-child-dialog.tsx # Dialog for linking child via access code
  link-child-actions.ts # Server actions for link/unlink operations
  wizard/
    config.ts                   # Wizard config (2 steps: information, contact)
    actions.ts                  # Wizard-level server actions
    use-parent-wizard.ts        # Wizard state hook
    information/                # Step 1: name, relationship
      content.tsx, form.tsx, validation.ts, actions.ts
    contact/                    # Step 2: email, phone
      content.tsx, form.tsx, validation.ts, actions.ts
  __tests__/
    actions.test.ts             # Server action tests
    validation.test.ts          # Zod schema tests
```

### Status

**Completion:** 85% | **Blockers:** Vitest import alias resolution (`@/lib/db` not resolving)

### Integration Points

- Student records via `link-child-actions.ts` (access code redemption)
- User accounts via optional `userId` field
- Teacher records via optional `teacherId` field
