## Core Data (Students, Teachers, Classes) — Readiness Checklist

Scope: Basic lists exist. CRUD forms and CSV import/export not yet implemented.

### Evidence

- Routes: `/(platform)/students`, `/(platform)/teachers`, `/(platform)/classes` with server-side pagination and `schoolId` filters.
- Tables: `src/components/platform/*/table.tsx` use generic DataTable.
- Prisma models: `students.prisma`, `staff.prisma`, `subjects.prisma`, `school.prisma` with relations.

### Gaps to MVP

- [ ] CRUD server actions with Zod schemas for Students/Teachers/Classes
- [ ] Forms (`form.tsx`) and validation per feature
- [ ] Enrollment mapping (student ↔ class) minimal UI
- [ ] CSV import pipeline (scaffold acceptable for MVP v0)
- [ ] CSV export of current filtered tables
- [ ] Role guards and tenant scoping in all actions
- [ ] Minimal tests for actions and list queries
- [ ] i18n strings

### Decision

- Status: PARTIAL — Lists OK, shipping blocked by CRUD/import
- Ship plan: keep routes enabled as read-only; prioritize Students CRUD + CSV import next.



