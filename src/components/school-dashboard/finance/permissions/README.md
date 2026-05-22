## Permissions -- Finance Access Control Management

### Overview

Admin UI for managing the hybrid permission system across all 12 finance modules. Supports granular grant/revoke of 7 actions per module, bulk operations, permission copying between users, and two view modes (by user, by module).

### Capabilities by Role

- **Admin**: Full permission management -- grant, revoke, bulk operations, copy between users
- **Accountant**: View permissions (management requires Admin or custom approve permission)
- **Other roles**: No access to this UI

### Routes

No dedicated route -- accessed via the finance settings or admin panel.

### File Structure

```
permissions/
├── actions.ts   # Server actions (grant, revoke, bulk grant/revoke, copy)
└── content.tsx  # Permission management UI (user view, module view, edit dialog, copy dialog)
```

### Status

**Completion:** 75% | **Blockers:** No dedicated route page (reached via finance settings / admin panel); no audit log of permission changes; permission templates and time-based / expiring grants not implemented

### Integration Points

- `FinancePermission` Prisma model stores granular permissions
- `finance/lib/permissions.ts` provides `checkCurrentUserPermission()` used by all sub-blocks
- Every server action in every finance sub-block checks permissions before executing
- See [finance master README](../README.md) for architecture details
