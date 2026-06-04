# Timetable Block

## Context

School-wide weekly schedule management — **section-based** (the operational unit is a Section
like "Grade 1-A", not a class). A 6,000-line `actions.ts` holds all 70+ server actions AND the
read queries (there is **no** `queries.ts`); permissions live in `permissions.ts` (server
guards + audit) + `permissions-config.ts` (client-safe RBAC matrix). The block deviates from the
standard table/columns/form mirror pattern: it's a grid scheduler with role-routed views
(`views/role-router.tsx` → admin/teacher/student/guardian).

~97% complete, no blockers. See `README.md` for routes/capabilities and `ISSUE.md` for the
verified gap register + the 2026-05-30 hardening record.

## Before You Start

1. Read `ISSUE.md` here — it records the 4 P1 fixes already shipped and what's deferred.
2. `actions.ts` is the single source for both reads and writes. Every action: permission guard
   (`requireReadAccess`/`requireAdminAccess`/`requirePermission`) → `getTenantContext()` →
   (Zod parse where a schema exists) → schoolId-scoped query → `logTimetableAction()`.

## Key Decisions

- **Section-based**: `Timetable` slots key on `sectionId` + `subjectId`; `classId` is legacy
  back-compat (nullable for generated section slots). Attendance shares the same Section roster.
- **Audit trail is real**: `logTimetableAction(action, details)` → `logAudit()` writes
  `db.auditLog` (namespaced `timetable.*`). It is `await`ed but self-contains its errors —
  never make it fire-and-forget (ordering semantics the tests assert).
- **Notifications are recipient-language**: server-side notifications target the _recipient
  school's_ `preferredLanguage`, not the actor's request locale. Use `notification-templates.ts`
  (AR/EN pure functions), NOT the dictionary system (no request `dictionary` in a "use server"
  action). Normalize with `toNotifLang(school.preferredLanguage)`.
- **Substitution auth**: `respondToSubstitution` allows an admin **or** the assigned substitute
  teacher (ownership via `teacher.userId === session.user.id` matching `substituteTeacherId`).
- **Scheduling algorithm**: `generate/algorithm.ts` is pure and unit-tested via its top-level
  exports + `__testing`. Keep it side-effect free (no `db`) so it stays testable.

## Danger Zones

- Missing `schoolId` on ANY query (including nested `include` filters) = cross-tenant leak.
  `findAvailableSubstitutes` was the one offender; every nested where is now scoped.
- Bulk writes (`applyTemplateToTerm`, `importTimetableSlots`) must distinguish a Prisma **P2002**
  (expected unique-constraint conflict → count & continue) from a real DB error (→ surface).
  Never `catch {}` a write loop.
- Server actions throw/return **error codes** (`SLOT_NOT_FOUND`, `TEACHER_NOT_QUALIFIED`, …),
  not English strings — the client maps them. Don't reintroduce hardcoded English in throws.
- `weekOffset` (0 = current week, 1 = next) is part of the `Timetable` unique key. Slot
  lookups/busy-checks must include it or they collide across weeks.

## Tests

`pnpm vitest run src/components/school-dashboard/timetable` — 176 tests, 6 files. Mocking:
`@/lib/db` (only the models the action touches), `@/auth`, `@/lib/tenant-context` (real shape
`{ schoolId, requestId, role, isPlatformAdmin }`), `next/cache`. RBAC matrix tests are pure
(no db mock). `validation.test.ts` imports the REAL schemas — keep it that way.

## Related Blocks

- [Attendance](../attendance/) — shares the Section roster model
- [School Dashboard](../CLAUDE.md) — parent (RBAC + tenant context conventions)

## After You Finish

1. `pnpm tsc --noEmit` (0 errors) and run the vitest suite above.
2. Update `ISSUE.md`/`README.md` if scope/status changed.
3. Smoke as `admin@databayt.org` (pw `1234`) on `demo.localhost:3000/en/timetable`; for the
   substitution flow, also log in as the assigned substitute TEACHER to confirm/decline.
