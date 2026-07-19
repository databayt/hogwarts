# Settings -- Production Readiness Tracker

> **2026-07-19 correction:** this record predates a reorganization. `role-management.tsx`, `permissions-panel.tsx`, `role-switcher.tsx`, `role-preview-actions.ts`, `actions.ts`, `content.tsx`, and the whole `academic/` folder listed in README **no longer exist here** — academic CRUD lives at `school/academic/*` (route `/school/configuration/academic`), role changes at `school/membership/*`. `/settings` today is Appearance / Notifications / Password / Language (`content-enhanced.tsx`). `domain-request/` and `ai-settings-actions.ts` are role-gated but orphaned (no route imports them). README needs a full rewrite.

**Status:** IN PROGRESS
**Completion:** 85%
**Last Updated:** 2026-03-19

---

## MVP Checklist

- [x] School profile management (name, logo, contact)
- [x] Locale selection (ar/en)
- [x] Timezone configuration
- [x] Subdomain management
- [x] Branding/logo configuration
- [x] Role management UI (assign roles to users)
- [x] Permissions panel (configure role permissions)
- [x] Role preview/switcher
- [x] Password change (dedicated sub-module with validation)
- [x] Appearance settings (theme customization)
- [x] Notification settings
- [x] Domain request workflow
- [x] Error boundary for graceful failures
- [x] Academic year CRUD (create, update, delete, list)
- [x] Term CRUD (create, update, delete per year)
- [x] Period CRUD (create, update, delete, bulk create)
- [x] Set active term
- [x] Multi-tenant isolation in all actions
- [x] Zod validation on all inputs
- [x] Unit tests for actions and tenant isolation
- [ ] Grading scale configuration
- [ ] Email template management
- [ ] Backup and restore

## Known Issues

### P1 -- High

- None currently identified

### P2 -- Medium

- [ ] No confirmation dialog on destructive operations (delete year/term)
- [ ] Role management does not show audit trail of changes
- [ ] Domain request lacks status tracking after submission

## Enhancements (Post-MVP)

- [ ] Grading scale configuration (grade boundaries, GPA weights)
- [ ] Email template management (customizable notification emails)
- [ ] Backup and restore (school data export/import)
- [ ] API access management (API keys for integrations)
- [ ] Audit log for settings changes
- [ ] Bulk user role assignment

---

**Last Review:** 2026-03-19
