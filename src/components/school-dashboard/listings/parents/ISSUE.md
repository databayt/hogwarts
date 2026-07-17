# Parents -- Production Readiness Tracker

**Status:** IN PROGRESS
**Completion:** 85%
**Last Updated:** 2026-07-17

---

## MVP Checklist

- [x] Guardian CRUD operations (create, read, update, delete)
- [x] Two-step wizard (information, contact)
- [x] Contact information management (email, phone)
- [x] Multi-tenant isolation (schoolId scoping)
- [x] Link guardian to student via access code (`linkGuardian`)
- [x] Unlink guardian from student (`unlinkGuardian`)
- [x] RBAC authorization (Admin, Teacher, Guardian, Staff)
- [x] Table with search, sort, filter, pagination
- [x] Centralized queries (`queries.ts`)
- [x] Unit tests written (actions + validation)
- [ ] Fix Vitest import alias resolution for test execution

## Known Issues

### P0 -- Critical

_None_

### Recently Fixed

- [x] **#378 — facade nav 404s.** The parents `PageNav` linked `Link`, `Communication`,
      and `Settings` tabs whose routes were never built; they fell through to
      `parents/[id]` → `notFound()` → 404. Removed the dead tabs from `layout.tsx`
      and `permissions.ts::getTabsForRole` (only `/parents` links now; re-add each
      tab as its route ships). `2026-07-17`.

### P1 -- High

- [ ] Vitest import alias `@/lib/db` resolution fails, blocking test execution
- [ ] `db as any` type casts in actions (part of codebase-wide 181 bypasses)

### P2 -- Medium

- [ ] Multiple children linking UX (currently one-at-a-time via access code)
- [ ] Emergency contact designation

## Enhancements (Post-MVP)

- [ ] Communication logs (messages sent to guardian)
- [ ] Access analytics (guardian portal usage)
- [ ] Guardian permission management (fine-grained data access)
- [ ] Notification preferences (email/SMS opt-in)
- [ ] Bulk import guardians from CSV

---

**Last Review:** 2026-03-19
