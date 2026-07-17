## Events -- School Calendar and Activity Management

### Overview

The Events feature enables schools to create, schedule, and manage school-wide activities. It supports event categorization by type (academic, sports, cultural, etc.), a three-step wizard for creation, calendar and attendance sub-pages, and recurring event configuration. Built with full multi-tenant isolation and RBAC.

### Capabilities by Role

- **Admin**: Full CRUD on all events, manage categories, configure recurring events, view attendance, manage settings
- **Teacher**: Create class events, view school calendar, RSVP to events
- **Student**: View upcoming events, RSVP, view event details
- **Guardian**: View school events, RSVP on behalf of child

### Routes

| Route                                                                             | Page             | Status |
| --------------------------------------------------------------------------------- | ---------------- | ------ |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/events`                      | Events List      | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/events/[id]`                 | Event Detail     | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/events/create`               | Quick Create     | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/events/calendar`             | Calendar View    | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/events/attendance`           | Attendance       | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/events/categories`           | Categories       | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/events/recurring`            | Recurring Events | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/events/settings`             | Settings         | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/events/add/[id]/information` | Wizard Step 1    | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/events/add/[id]/schedule`    | Wizard Step 2    | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/events/add/[id]/settings`    | Wizard Step 3    | Ready  |

### File Structure

```
events/
  content.tsx              # Server component - renders events table
  actions.ts               # Server actions for event CRUD
  validation.ts            # Zod schemas
  types.ts                 # TypeScript type definitions
  config.ts                # Constants, event type options
  form.tsx                 # Client form component
  columns.tsx              # Table column definitions
  table.tsx                # DataTable component
  list-params.ts           # Search/filter URL parameters
  authorization.ts         # RBAC permission checks
  queries.ts               # getEventsForMonth (calendar) — see note below
  detail.tsx               # Event detail view
  autocomplete.tsx         # Autocomplete for event search
  basic-information.tsx    # Info display section
  schedule-location.tsx    # Schedule and location display
  details-attendees.tsx    # Attendee details section
  calendar/
    content.tsx            # Calendar page server component
    calendar-client.tsx    # Client-side calendar component
  attendance/content.tsx   # Attendance tracking page
  categories/content.tsx   # Event categories management
  recurring/content.tsx    # Recurring events configuration
  settings/content.tsx     # Event settings page
  create/content.tsx       # Quick create page
  wizard/
    config.ts                   # Wizard config (3 steps)
    actions.ts                  # Wizard-level server actions
    use-event-wizard.ts         # Wizard state hook
    information/                # Step 1: title, description, type
      content.tsx, form.tsx, validation.ts, actions.ts
    schedule/                   # Step 2: date, time, location
      content.tsx, form.tsx, validation.ts, actions.ts
    settings/                   # Step 3: visibility, RSVP settings
      content.tsx, form.tsx, validation.ts, actions.ts
  __tests__/
    actions.test.ts             # Server action tests
    validation.test.ts          # Zod schema tests
```

### Conventions

- **Status enum**: `PLANNED | ONGOING | COMPLETED | CANCELLED | POSTPONED` — mirror the
  Prisma `EventStatus` enum exactly. Never hand-duplicate it in a TS union (that is how
  the UI previously drifted to a nonexistent `IN_PROGRESS`); derive from `$Enums`.
- **Wizard drafts**: in-flight events carry a non-null `wizardStep` and a blank title.
  Every list/count/export query must filter `wizardStep: null` or drafts leak into the UI.
- **Locale**: `getEvents`/`getEventsCSV` take `displayLang`; without it the load-more and
  export paths silently fall back to Arabic storage language and English placeholders.
- **`queries.ts`**: deliberately holds only `getEventsForMonth`. A large speculative
  query-builder library was removed (never imported, and drifted out of sync with the
  schema). The live list/detail queries are in `actions.ts` and `content.tsx`.

### Status

**Completion:** 90% | **Blockers:** None

### Integration Points

- Announcements (event-related announcements)
- Dashboard widgets (upcoming events)
- Parent portal (`/{lang}/parent/events`)
