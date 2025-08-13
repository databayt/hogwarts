## MVP Readiness — Feature-by-Feature

This report summarizes current progress against the MVP and provides ship checklists per feature. See `readiness/*.md` for detailed lists.

### Status at a glance

- Auth & RBAC: Ready (requires final guard passes) — see `readiness/auth.md`
- Announcements: Ready to ship — see `readiness/announcements.md`
- Attendance (daily/period): Ready to ship — see `readiness/attendance.md`
- Timetable (basic + conflicts): Ship as beta — see `readiness/timetable.md`
- Core Data (Students/Teachers/Classes): Lists OK, CRUD/import missing — see `readiness/core-data.md`
- Settings (school profile, locale, timezone): Basic present, needs polish — see `readiness/settings.md`
- Billing (manual + Stripe-ready): Partial; keep manual/admin-only for MVP — see `readiness/billing.md`
- Provisioning & Domains: Operator flows present; self-serve later — see `readiness/provisioning-and-domains.md`
- Internationalization (ar/en, RTL): Docs only; not wired — see `readiness/i18n.md`
- Parent/Student portal (read-only): Not implemented — see `readiness/parent-portal.md`
- Observability/Backups: Docs; minimal hooks in code — see `readiness/observability.md`

### Recommended shipping order (incremental to production)

1) Announcements (school/role/class scopes; low risk)
2) Attendance (daily/period; CSV export included)
3) Timetable (beta: weekly grid + conflict detection)
4) Settings (school basic profile, domain request entry)
5) Core Data CRUD + CSV import (students/teachers/classes)
6) Operator manual billing (receipts review) → later Stripe self-serve
7) Provisioning (operator-provisioned schools) → later self-serve
8) i18n wiring (ar/en) → roll after first 1–2 tenants
9) Parent/Student portal (read-only)

Each detailed checklist calls out the minimal tasks to productionize safely (tenant scoping, role guards, toasts, tests).


