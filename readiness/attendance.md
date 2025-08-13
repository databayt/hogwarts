## Attendance — Readiness Checklist

Scope: Daily/period attendance per class with CSV export and basic reports.

### Evidence

- Prisma: `prisma/models/attendance.prisma` with composite unique `[schoolId, studentId, classId, date]`.
- Server actions: `src/components/platform/attendance/actions.ts` (`markAttendance`, `getAttendanceList`, `getAttendanceReportCsv`, `getClassesForSelection`).
- UI: `src/components/platform/attendance/content.tsx`; routes under `/(platform)/attendance` and `/(platform)/attendance/reports`.
- Tenant scoping: enforced via `getTenantContext()`.

### Ship checklist

- [x] Zod validation and server parse
- [x] Idempotent upsert for marks
- [x] Class roster + marks list
- [x] CSV export for reports
- [x] Toasts and error handling
- [ ] Role guard: restrict marking to Teacher/Admin/Owner
- [ ] Date backfill policy (allow marking past N days)
- [ ] Minimal unit test for action and CSV builder
- [ ] i18n strings

### Decision

- Status: READY TO SHIP
- Pre-prod QA: two classes across tenants; CSV export size and headers; timezone/date handling.



