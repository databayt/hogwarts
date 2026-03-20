## Settings -- School Configuration and Administration

### Overview

The Settings block provides school-wide configuration including role management, permissions, academic year/term/period setup, appearance customization, domain requests, password management, and notification preferences. This is the central admin control panel for school operations.

### Capabilities by Role

- **Admin**: Manage roles and permissions, configure academic years/terms/periods, set active term, customize appearance, request custom domain, manage notification settings
- **Teacher/Staff**: Change password, adjust personal notification preferences

### Routes

| Route                                                           | Page                      | Status |
| --------------------------------------------------------------- | ------------------------- | ------ |
| `/{lang}/s/{subdomain}/(school-dashboard)/settings`             | Main Settings             | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/school/academic`      | Academic Year/Term/Period | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/school/configuration` | School Configuration      | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/school/security`      | Security Settings         | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/school/billing`       | Billing                   | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/school/communication` | Communication Settings    | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/school/membership`    | Membership                | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/school/reports`       | Reports                   | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/school/analysis`      | Analysis                  | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/school/bulk`          | Bulk Operations           | Ready  |

### File Structure

```
src/components/school-dashboard/settings/
  actions.ts                  # Server actions (role updates, permissions, user status)
  content.tsx                 # Main settings server component
  content-enhanced.tsx        # Enhanced settings layout
  validation.ts               # Zod schemas
  error-boundary.tsx          # Error boundary component
  role-management.tsx         # Role assignment UI
  role-switcher.tsx           # Role preview switcher
  role-preview-actions.ts     # Role preview server actions
  permissions-panel.tsx       # Permissions configuration UI
  appearance-settings.tsx     # Theme and appearance config
  notification-settings.tsx   # Notification preferences
  password/
    actions.ts                # Password change server action
    content.tsx               # Password settings page
    form.tsx                  # Password change form
    validation.ts             # Password validation schema
  academic/
    actions.ts                # Full CRUD for years, terms, periods (934 lines)
    content.tsx               # Academic settings page
    types.ts                  # TypeScript interfaces
    validation.ts             # Academic validation schemas
    year-form.tsx             # School year form
    year-list.tsx             # School year list
    term-form.tsx             # Term form
    term-list.tsx             # Term list
    period-form.tsx           # Period form
    period-list.tsx           # Period list
    __tests__/actions.test.ts
  domain-request/
    actions.ts                # Domain request server action
    content.tsx               # Domain request page
    form.tsx                  # Domain request form
  __tests__/
    settings-tenant.test.ts   # Multi-tenant isolation tests
    actions.test.ts           # Server action tests
```

### Status

**Completion:** 85% | **Blockers:** None

Academic year CRUD (years, terms, periods) is fully implemented with 14 server actions. Remaining work is polish items: grading scale configuration, email templates, and backup/restore.

### Integration Points

- **Timetable**: Academic year and term configuration drives term selectors in timetable
- **Exams**: Active term determines exam scheduling context
- **Attendance**: Period definitions used for period-by-period attendance
- **All Features**: Locale, timezone, and branding affect the entire school dashboard
