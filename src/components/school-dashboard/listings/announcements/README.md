## Announcements -- School-Wide Communication

### Overview

The Announcements feature enables administrators to broadcast messages to the school, specific classes, or role-based groups. It supports scheduled publishing, CSV export, and on-demand translation between Arabic and English. Built with full multi-tenant isolation and RBAC.

Create and edit run in a **modal** (`wizard/modal.tsx`) opened from the table,
not a route. It renders the same component stack the `/add` route renders, but
in place: opening costs no server round-trip and submitting costs exactly one
(`submitAnnouncementWizard`, which creates-or-updates and completes together).
The wizard is a single step — the content form absorbed the scope/class/role
fields, so `wizard/targeting/` is unreachable legacy. See `ISSUE.md` (2026-07-20).

> Read-receipt tracking, unread badges, and bulk operations are **not built** —
> earlier revisions of this file and `ISSUE.md` claimed otherwise. See `ISSUE.md`.

### Capabilities by Role

Enforced by `authorization.ts` + `guard.ts`, not by which buttons the UI renders.

- **Admin**: Full CRUD, publish/unpublish, target by any scope (school/class/role), schedule, export, config
- **Teacher**: Create/publish **class-scoped announcements only**, and only ones they authored (`createdBy`)
- **Student / Guardian / Accountant / Staff**: Read only — no create, update, publish, or delete
- **Developer**: Full access across schools

`getAllowedScopes(role)` is the single source of truth for which scopes a role may
address; a role with no allowed scopes may not author announcements or manage
templates at all.

### Routes

| Route                                                                                  | Page                                                                                                       | Status |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------ |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/announcements`                    | Announcements List                                                                                         | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/announcements/[id]`               | Announcement Detail                                                                                        | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/announcements/add/[id]/content`   | Wizard (legacy route — create/edit now uses the modal; kept for deep links + existing `wizardStep` drafts) | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/announcements/add/[id]/targeting` | Unreachable — not in `config.steps`                                                                        | Legacy |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/announcements/config`             | Settings/Config                                                                                            | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/announcements/archived`           | Archived                                                                                                   | Ready  |

### File Structure

```
announcements/
  content.tsx              # Server component - renders announcements table
  actions.ts               # Server actions for CRUD + publish + config
  guard.ts                 # Auth + RBAC guard shared by actions and wizard
  validation.ts            # Zod schema factory (createAnnouncementSchema)
  types.ts                 # TypeScript type definitions
  config.ts                # Constants and configuration
  form.tsx                 # DEAD - legacy modal form, zero importers
  columns.tsx              # Table column definitions (Edit -> onEdit callback)
  table.tsx                # DataTable component + toolbar CSV export
  list-params.ts           # Search/filter URL parameters
  authorization.ts         # RBAC permission matrix (pure, no I/O)
  permissions.ts           # Permission helpers
  queries.ts               # Centralized query builders
  detail.tsx               # Announcement detail view
  autocomplete.tsx         # Autocomplete for announcement search
  information.tsx          # DEAD - only form.tsx imported it
  scope.tsx                # DEAD - only form.tsx imported it
  template-actions.ts      # Announcement template management
  config-form.tsx          # Configuration form
  wizard/
    modal.tsx                   # Create/edit modal - the live entry point
    config.ts                   # Wizard config (1 step: content)
    actions.ts                  # submitAnnouncementWizard (single round-trip) + draft helpers
    use-announcement-wizard.ts  # Wizard state hook (legacy route only)
    content/                    # title, body, priority, scope, class/role
      content.tsx, form.tsx, validation.ts, actions.ts
    targeting/                  # LEGACY - unreachable; only getClassesForAnnouncement is still used
      content.tsx, form.tsx, validation.ts, actions.ts
```

Tests live at `src/tests/school-dashboard/listings/announcements/`
(`actions.test.ts`, `validation.test.ts`, `wizard-authorization.test.ts`) —
the repo mirrors the URL structure and has retired block-local `__tests__/`.

### Authorization

`authorization.ts` is the pure permission matrix (`checkAnnouncementPermission`,
`getAllowedScopes`). `guard.ts` is the server-side entry point every action must
go through:

- `resolveContext()` — resolves session + tenant concurrently, returns
  `{ authContext, schoolId }` or a denial. Use for create/list actions.
- `guardAnnouncement(id, action)` — loads the row's ownership fields and asserts
  permission. Use for anything addressing an existing announcement.

Server Actions are independently invokable POST endpoints, and
`getTenantContext()` resolves `schoolId` from the `x-subdomain` header before it
consults the session — so a tenant context is **not** proof of identity. Never
gate a mutation on `getTenantContext()` alone.

### Status

**Completion:** 90% | **Blockers:** None

### Internationalization

Static UI reads `dictionary.school.announcements.*`. Two rules this block has
tripped over before:

- **Never rebuild labels with `lang === "ar" ? … : …`.** The dictionary is
  complete; a ternary is a silent fork that drifts from the translators' copy.
- **Server actions return `ACTION_ERRORS` codes, never English.** Clients must
  resolve them with `resolveActionError(result.error, dictionary)` — otherwise
  the raw code (`"UNAUTHORIZED"`) is what the user sees in the toast.

`AnnouncementConfigForm` resolves every label off the announcements dictionary
section itself. Pass it `dictionary.school.announcements` — do **not** hand-map
labels in the page; two routes render this form and per-page maps drift.

### Integration Points

- Classes (class-specific targeting)
- Dashboard widgets (recent announcements)
- Parent portal (`/{lang}/parent/announcements`)
- Translation system (`@/components/translation` — `localize`/`localizeOne`/`prewarm`)
- Notification dispatch (`@/lib/dispatch-notification`)
