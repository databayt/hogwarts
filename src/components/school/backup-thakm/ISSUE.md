## School Dashboard — Backlog and Acceptance Criteria

This backlog tracks the school‑scoped dashboard (in‑tenant) to MVP completion. Follow shadcn/ui, mirror pattern, Zod validation, and tenant scoping (`schoolId`) in every query/mutation.

Status legend: [x] done, [~] in progress, [ ] todo

### 1) Shell & Navigation

- [x] Dashboard layout (header/sidebar) with school context
  - Acceptance: routes render in shell; context includes `schoolId`
 - [x] Breadcrumbs and quick search (optional)
   - Breadcrumbs implemented in layout; quick search added with URL sync

### 2) Attendance — Marking & Reports

 - [x] Mark attendance per class and period
  - UI: table with present/absent/late toggles; bulk mark with overrides
   - Server: parse with Zod; ensure `schoolId` scoping; audit optional
   - Controls: class selector, date picker, bulk actions (all present/absent/late)
   - Acceptance: saves reliably; p95 < 2s; reflects in reports
 - [x] Attendance reports
   - [x] Views scaffolded; URL filters for student/class/date; CSV export implemented
  - [x] Filters: URL‑synced params (studentId, classId, status, from/to)
   - Acceptance: CSV export works; tenant‑safe

### 3) Announcements — Create/List/Publish

 - [~] Create announcement (title, body, scope)
  - Scopes: school‑wide, class, role; publish/unpublish
  - Acceptance: Zod validation; typed server action; `revalidatePath` on success
  - Validation tightened: require `classId` when scope is class; `role` when scope is role
 - [~] List with filters
   - [x] Filters: scope, published, search; URL‑synced (`nuqs`); server pagination wired (awaiting model)
  - Acceptance: p95 < 2s; tenant‑safe
  - [~] Prisma model `Announcement` added; wire typed client when migration applied

### 4) Timetable — Weekly Grid

- [x] Weekly grid per class/teacher (placeholder grid)
  - Acceptance: responsive grid; keyboard accessible
 - [x] Conflict detection (basic)
  - Acceptance: detect overlapping slots by teacher/room (basic)
  - Implemented server action `detectTimetableConflicts`; UI with term filter and results list

### 5) Core Data Overviews

- [x] Students table
  - Columns: name, class, status, createdAt
  - Acceptance: server pagination/sort/filter; URL‑synced; tenant‑safe
- [x] Teachers table
  - Columns: name, department/subject, createdAt
  - Acceptance: server pagination/sort/filter; URL‑synced; tenant‑safe
- [x] Classes table
  - Columns: name, year/term, size, createdAt
  - Acceptance: server pagination/sort/filter; URL‑synced; tenant‑safe

### 6) Settings & Profile

 - [x] School settings
  - Fields: name, logo, timezone (Africa/Khartoum), locale (ar/en)
  - Acceptance: Zod validation; typed server action; `revalidatePath`
- [x] User profile
  - Fields: display name, avatar, locale
  - Acceptance: Zod validation; typed server action

<!-- ### 7) i18n & RTL

- [ ] Extract visible strings; Arabic (RTL) and English (LTR)
  - Acceptance: switchable; layouts respect RTL -->

### 8) Testing

- [x] Unit tests for utilities and server actions (Vitest)
- [x] Integration tests for Prisma queries with tenant scoping (mocked Prisma)
- [-] E2E smoke replaced by integration tests
  - Acceptance: green CI; no cross‑tenant leakage in tests

### 9) Documentation

- [x] Keep `README.md` updated with progress, commands, and envs
  - Acceptance: checklist reflects current state



Dependencies and references:
- Requirements: `src/app/docs/requeriments/page.mdx`
- Roadmap: `src/app/docs/roadmap/page.mdx`
- Arrangements: `src/app/docs/arrangements/page.mdx`
- UI patterns: shadcn/ui; place primitives in `src/components/ui/*`
- Mirror pattern: route `src/app/(school)/dashboard/<segment>` mirrors `src/components/school/dashboard/<segment>` and exports `<FolderName>Content`
- CSV export: server action `getAttendanceReportCsv` in `src/components/school/dashboard/attendance/actions.ts` accepts `{ classId, studentId, status, from, to, limit }`



