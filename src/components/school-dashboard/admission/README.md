## Admission (Dashboard) — School-side admission management pipeline

### Overview

Administrative dashboard for managing the full admission lifecycle: campaign creation, application review, merit list generation, student placement, and enrollment confirmation. Provides tabbed views for each stage of the admission funnel with DataTable-driven UIs, bulk operations, and RBAC-protected server actions.

### Capabilities by Role

- **DEVELOPER / ADMIN**: Full access -- create/edit campaigns, review applications, generate merit lists, confirm enrollment, manage settings
- **STAFF**: Review applications, update status, place students into classes
- **ACCOUNTANT**: View applications, record admission payments
- **TEACHER / STUDENT / GUARDIAN**: No admission access

### Routes

| Route                                                                  | Page               | Status |
| ---------------------------------------------------------------------- | ------------------ | ------ |
| `/{lang}/s/{subdomain}/(school-dashboard)/admission`                   | Campaigns list     | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/admission/applications`      | Applications list  | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/admission/applications/[id]` | Application detail | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/admission/merit`             | Merit list         | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/admission/enrollment`        | Enrollment list    | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/admission/settings`          | Admission settings | Ready  |

### File Structure

```
src/components/school-dashboard/admission/
├── actions.ts                      # Server actions (campaigns, applications, merit, enrollment)
├── authorization.ts                # RBAC permission checks
├── queries.ts                      # Read-only DB queries with filters/pagination
├── validation.ts                   # Zod schemas (campaign, application)
├── list-params.ts                  # Shared list parameter types
├── campaigns-content.tsx           # Campaigns tab (server component)
├── campaigns-columns.tsx           # Campaign DataTable column definitions
├── campaigns-table.tsx             # Campaign DataTable (client)
├── campaign-form.tsx               # Campaign create/edit form (client)
├── applications-content.tsx        # Applications tab (server component)
├── applications-columns.tsx        # Application DataTable column definitions
├── applications-table.tsx          # Application DataTable (client)
├── application-detail-content.tsx  # Single application detail view (server)
├── application-detail-actions.tsx  # Application detail action buttons (client)
├── merit-content.tsx               # Merit list tab (server component)
├── merit-columns.tsx               # Merit DataTable column definitions
├── merit-table.tsx                 # Merit DataTable (client)
├── enrollment-content.tsx          # Enrollment tab (server component)
├── enrollment-columns.tsx          # Enrollment DataTable column definitions
├── enrollment-table.tsx            # Enrollment DataTable (client)
├── placement-dialog.tsx            # Student placement dialog (client)
├── bulk-placement.tsx              # Bulk placement operations (client)
├── settings-content.tsx            # Admission settings (server component)
├── settings/
│   ├── actions.ts                  # Settings server actions
│   ├── validation.ts               # Settings validation schemas
│   └── __tests__/actions.test.ts   # Settings action tests
└── __tests__/
    ├── actions.test.ts             # Main action tests
    └── validation.test.ts          # Validation tests
```

### Status

**Completion:** 90% | **Blockers:** None

### Integration Points

- `src/components/school-marketing/admission/` -- public-facing admission pages and application form
- `src/components/school-marketing/application/` -- multi-step student application wizard
- `src/lib/enrollment-sync.ts` -- auto-enroll placed students into grade classes
- `src/lib/dispatch-notification.ts` -- notification dispatch on status changes
- `prisma/models/admission.prisma` -- AdmissionCampaign, AdmissionApplication models
