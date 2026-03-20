## Announcements -- School-Wide Communication

### Overview

The Announcements feature enables administrators to broadcast messages to the school, specific classes, or role-based groups. It supports a two-step wizard (content, targeting), read receipt tracking, scheduled publishing, bulk operations, CSV export, and on-demand translation between Arabic and English. Built with full multi-tenant isolation and RBAC.

### Capabilities by Role

- **Admin**: Full CRUD, publish/unpublish, target by scope (school/class/role), schedule, bulk operations, export, view read receipts
- **Teacher**: Create class-level announcements, view school announcements
- **Student**: View school and class announcements, mark as read
- **Guardian**: View school and class announcements (for enrolled children)

### Routes

| Route                                                                                  | Page                | Status |
| -------------------------------------------------------------------------------------- | ------------------- | ------ |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/announcements`                    | Announcements List  | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/announcements/[id]`               | Announcement Detail | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/announcements/add/[id]/content`   | Wizard Step 1       | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/announcements/add/[id]/targeting` | Wizard Step 2       | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/announcements/config`             | Settings/Config     | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/announcements/archived`           | Archived            | Ready  |

### File Structure

```
announcements/
  content.tsx              # Server component - renders announcements table
  actions.ts               # Server actions for CRUD + publish
  validation.ts            # Zod schemas
  types.ts                 # TypeScript type definitions
  config.ts                # Constants and configuration
  form.tsx                 # Client form component
  columns.tsx              # Table column definitions
  table.tsx                # DataTable component
  list-params.ts           # Search/filter URL parameters
  authorization.ts         # RBAC permission checks
  queries.ts               # Centralized query builders
  detail.tsx               # Announcement detail view
  autocomplete.tsx         # Autocomplete for announcement search
  information.tsx          # Info display section
  scope.tsx                # Scope/targeting display section
  read-tracking.ts         # Read receipt tracking server actions
  read-status-badge.tsx    # Badge showing read/unread status
  read-count-indicator.tsx # Indicator showing read count
  unread-count-badge.tsx   # Badge for unread count
  scheduled-status-badge.tsx # Badge for scheduled status
  scheduling-section.tsx   # Scheduling UI section
  bulk-actions.ts          # Bulk publish/delete/archive operations
  export.ts                # CSV export server action
  translate.ts             # On-demand translation (Arabic/English)
  template-actions.ts      # Announcement template management
  templates-step.tsx       # Template selection UI
  config-form.tsx          # Configuration form
  wizard/
    config.ts                   # Wizard config (2 steps: content, targeting)
    actions.ts                  # Wizard-level server actions
    use-announcement-wizard.ts  # Wizard state hook
    content/                    # Step 1: title, body
      content.tsx, form.tsx, validation.ts, actions.ts
    targeting/                  # Step 2: scope, class/role, publish settings
      content.tsx, form.tsx, validation.ts, actions.ts
  __tests__/
    actions.test.ts             # Server action tests
    validation.test.ts          # Zod schema tests
```

### Status

**Completion:** 90% | **Blockers:** None

### Integration Points

- Classes (class-specific targeting)
- Dashboard widgets (recent announcements, unread count)
- Parent portal (`/{lang}/parent/announcements`)
- Translation system (`@/lib/translate`)
- Notification dispatch (`@/lib/dispatch-notification`)
