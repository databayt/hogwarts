---
epic: 04
sprint: Q3-2026
title: Attendance
file_type: claude
owner: Abdout
maturity: Built+Polish
completion: 85
tracker: https://github.com/databayt/hogwarts/issues/322
docs: https://ed.databayt.org/en/docs/attendance
last_audited: 2026-05-25
---

# Attendance Block

## Context

Attendance — Q3 2026 sprint epic 04, maturity `Built+Polish`, ~85% complete. See [README](README.md) for routes + file structure and [ISSUE](ISSUE.md) for the live work list. Tracker: [322](https://github.com/databayt/hogwarts/issues/322).

## Before You Start

1. Read `README.md` here for routes, props, and integration points
2. Read `ISSUE.md` here for the P0/P1/P2 priorities + MVP checklist
3. Skim the [Q3 Sprint Plan](https://kun.databayt.org/en/docs/sprint) for the epic's owner + bet
4. Check the [tracker](https://github.com/databayt/hogwarts/issues/322) for cross-feature dependencies

## Key Decisions

- **`guardAttendance(action)` is the auth gate.** `actions/helpers.ts` exports
  `guardAttendance(action)` (= `auth()` + `getTenantContext()` + RBAC matrix from
  `authorization.ts`) and `getOwnedStudentIds(schoolId, userId, role)` (resolves
  the Student rows a STUDENT/GUARDIAN owns). New server actions call one of these
  instead of re-implementing the check. Returns a discriminated union:
  `if (!g.ok) return g.error` then use `g.schoolId` / `g.userId` / `g.role`.
- **Section-based, but QR/manual flows are still class-based.** Attendance roster
  for marking comes from `Section.students`; QR sessions, `quickMarkAllPresent`
  and bulk upload still key on `classId` + the `StudentClass` join.
  `markPeriodAttendance` resolves and writes `sectionId` best-effort from the
  timetable slot.
- **Daily attendance has NO DB-unique dedupe for `periodId = null`.** Postgres
  treats NULL as distinct in the `(schoolId, studentId, classId, date, periodId)`
  unique index, so daily marks dedupe in application code (findMany → Map), not
  via the constraint. QR re-scan and `markAttendance` both rely on this.
- **`presentDays` is strict PRESENT; LATE is separate.** `calculateAttendancePercentage`
  reports them independently and folds LATE into the percentage numerator only —
  never add `presentDays + lateDays` for a count.
- **Soft-delete is two-sided.** `deleteAttendance` / `bulkDeleteAttendance` set
  `Attendance.deletedAt` (admin-reachable via `core/attendance-context.tsx`).
  Every read that **aggregates or displays** attendance MUST filter
  `deletedAt: null` — stats, analytics, dashboard counts, period stats, CSV /
  bulk-upload history, the excuse worklist, the mobile API and the
  teacher-reminder cron all do. Upsert **lookups** must NOT filter `deletedAt`:
  the `(schoolId, studentId, section|class, date, periodId)` unique tuple still
  reserves a soft-deleted row's key, so a filtered lookup falls through to a
  colliding `create`/`createMany({skipDuplicates})` that throws or silently
  drops the mark. Instead the update path writes `deletedAt: null` to **revive**
  the row on re-mark; the scan paths (geofence/barcode) branch on the found
  row's `deletedAt` to revive rather than crash on the constraint.
- **Error contract:** server actions return `actionError(ACTION_ERRORS.*)` codes,
  not English. `guardAttendance` already returns coded errors.

## Danger Zones

- **`getTenantContext()` does NOT require auth** — it resolves `schoolId` from the
  `x-subdomain` header. A `schoolId`-only guard on a `"use server"` action is an
  unauthenticated endpoint. Always add `auth()` + a role/ownership check (use
  `guardAttendance`).
- **Bare-PK writes leak across tenants.** Prisma `update({ where: { id } })` is not
  tenant-scoped; for writes that must assert `schoolId`, use
  `updateMany({ where: { id, schoolId } })` (Prisma `update` rejects a non-unique
  `where`). Mobile routes + `reviewExcuse` follow this.
- **Teacher scoping must INTERSECT, not overwrite.** When a teacher passes an
  explicit `classId`, intersect it with `getTeacherClassIds` — never assign
  `where.classId = classId` after setting `{ in: teacherClassIds }` (was a
  cross-class leak in `bulk.ts`).
- **CSV export** must run every cell through the formula-injection guard
  (`csvCell` in `bulk.ts`).
- **`markPeriodAttendance` / `bulkUpload` writes are batched + transactional** —
  don't reintroduce per-record `findFirst`+`create` loops (N+1 + non-atomic).
- **A soft-deleted row still occupies the unique key.** Never "fix" an upsert by
  adding `deletedAt: null` to its existing-record lookup — the colliding
  `createMany({ skipDuplicates })` then silently drops the re-mark (or a bare
  `create` throws). Revive in the update path instead. Conversely, never add a
  new aggregate/display read of `db.attendance` without `deletedAt: null`, or
  admin-removed records leak back into stats, exports and compliance CSVs.

## Related Blocks

- [Timetable](../timetable/CLAUDE.md) — period/section structure consumed by
  `markPeriodAttendance` + `getCurrentPeriod`.
- [Conference](../conference/CLAUDE.md) — `AttendanceMethod.VIRTUAL` (added
  2026-06-20) is written by conference `actions/attendance-sync.ts`
  (`syncConferenceAttendance`) when a live class ends: section students present
  in the room → PRESENT/LATE, roster non-joiners → ABSENT. System context
  (`markedBy: null`), section unique key, same revive-on-update upsert as
  `markPeriodAttendance`. Opt-in (`School.conferenceAttendanceSync`) + LiveKit-only.
- [Compliance](../compliance/README.md) — ADEK eSIS submission + 2h parent-contact
  SLA cron consume attendance ABSENT marks.
- [Students](../listings/CLAUDE.md) — `Student.sectionId` / `StudentClass` /
  `StudentGuardian` are the roster + ownership sources.

## After You Finish

1. Update `ISSUE.md` — check completed items, add new issues found
2. Update `README.md` — if routes, files, or completion% changed; bump frontmatter `completion` and `last_audited`
3. Run `NODE_OPTIONS='--max-old-space-size=8192' pnpm tsc --noEmit`
4. If you touched DB: write a migration test before merging
