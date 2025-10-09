# Timetable MVP — Issue Tracker

Track the concrete tasks to ship the Timetable feature. Follow our multi-tenant and shadcn/ui rules. Use `pnpm` for all commands.

## Critical Issues from Code Review (Priority 0) 🔴

### TypeScript Violations - MUST FIX
- [ ] **utils.ts:125** - Remove `any` type in CSV parsing
- [ ] **utils.ts:283** - Fix `any` type for timetable data
- [ ] **utils.ts:299** - Replace `any` with proper types
- [ ] Add proper type guards for all external data
- [ ] Create TypeScript interfaces for CSV imports
- [ ] Fix unsafe type assertions

### Typography Violations
- [ ] Replace all hardcoded text-* classes with semantic HTML
- [ ] Use typography system from globals.css
- [ ] Ensure all text follows semantic HTML patterns

### Performance Issues
- [ ] Add React.memo to TimetableCell component
- [ ] Implement virtual scrolling for large timetables
- [ ] Optimize conflict detection algorithm
- [ ] Cache frequently accessed timetable data
- [ ] Add pagination for teacher/class lists

### Accessibility Requirements
- [ ] Implement ARIA grid pattern for timetable
- [ ] Add keyboard navigation (arrow keys)
- [ ] Add focus management for cells
- [ ] Create screen reader announcements
- [ ] Add skip navigation links

## Database & Migrations
- [x] Add `Timetable` model scoped by `schoolId` with uniqueness for teacher/room/class collisions
  - [x] Fields: `id, schoolId, termId, dayOfWeek, periodId, classId, teacherId, classroomId, weekOffset?`
  - [x] Constraints: unique triples for (teacher, period, day), (classroom, period, day), (class, period, day)
  - [x] Indexes on `schoolId, termId, dayOfWeek, periodId`
- [x] Add `SchoolWeekConfig` (per school/per term) to support flexible work days and lunch breaks
  - [x] Fields: `workingDays int[]`, `defaultLunchAfterPeriod? number`, `extraLunchRules? JSON`
  - [x] Unique `@@unique([schoolId, termId])`
- [ ] Optional: `GradeScheduleConfig` and `ClassScheduleConfig` (post-MVP)
- [x] Prisma migrate dev (applied)
- [x] Prisma generate (applied)
- [x] Seed slots and configs for local dev

## Server Actions
- [x] `getScheduleConfig({ termId })` resolves working days and lunch policy
- [x] `getWeeklyTimetable({ termId, weekOffset?, view?{ classId?, teacherId? } })` returns UI JSON (days + lunch row handling)
- [x] `upsertTimetableSlot(input)` with tenant/role checks (ADMIN/OWNER)
- [ ] Optional: `moveSlot`/`swapSlots` helpers (low priority)
- [x] Extend `detectTimetableConflicts` to read from `Timetable`
- [x] Ensure all actions include `schoolId` from `getTenantContext()`

## UI Store & Wiring
- [x] Replace fetches in `useTimetableStore.fetchTimetable`/`changeWeek` to call internal API backed by server actions
- [x] Load schedule config (days via `getWeeklyTimetable`) and feed into grid (removed hardcoded Mon–Fri)
- [x] Keep `config.json.useLocalJson` as fallback for demos; default to server
- [x] Add term and view selectors (class/teacher; grades with A/B/C/D classes)
- [x] Preserve teacher info overrides (cookies) in MVP
- [x] Wire selectors to refetch weekly timetable via `/api/timetable` with params
- [x] Insert lunch row based on server-provided `lunchAfterPeriod` (fallback to client config)

## Components
- [x] `TimetableHeader`: add term selector and view switch (Class vs Teacher)
- [x] Class selection supports grades with multiple classes (A/B/C/D)
- [x] Teacher selector for teacher timetable view
- [x] `TimetableGrid`: render dynamic days and lunch row position
- [x] Print view: A4 helpers (page breaks, prevent row splits)
- [ ] Print view: final tuning (fonts/margins for varied day counts)

## Admin Configuration & Conflicts
- [x] API: upsert schedule config (working days/lunch)
- [x] API: upsert timetable slot
- [x] Server action stub to save schedule config (revalidate)
- [x] Admin settings UI (dialog) to manage working days and lunch
- [x] Basic slot editor (dialog form) to create/update slots
- [x] Conflict count surfaced in header; endpoint at `/api/timetable/conflicts`
- [x] Suggestions endpoint `/api/timetable/suggest` and UI list in slot editor
- [x] Conflicts drawer with suggestions; “Apply” pre-fills slot editor
- [ ] Role checks: mutations only for `ADMIN`/`OWNER`

## Permissions & Multi-tenant
- [x] Scope all DB queries by `schoolId`
- [x] Add tests for tenant isolation (Vitest)

## Tests
- [x] Unit: schedule resolution (days/lunch), formatting, conflicts
- [ ] Integration: overlapping slots produce conflicts; different weekend patterns render correctly
- [ ] Update existing `actions.test.ts` to cover slot-based conflicts (extend)

## Docs
- [x] Keep `README.md` updated (flexible days/lunch, class/teacher views, A4 print)
- [x] Admin guide (configure working days/lunch; resolve conflicts)

## QA
- [ ] Validate Fri off; Fri+Sat off; Fri+Sun off; renders correct columns
- [ ] Validate lunch after 2/3/4 periods (and per-class override)
- [ ] Switch Class vs Teacher views
- [ ] Grades with multiple classes (A/B/C/D) selection works
- [ ] Conflict detection surfaces realistic conflicts
- [ ] RTL and A4 print correctness

## Commands
- `pnpm vitest run`
- `pnpm prisma migrate dev && pnpm prisma generate`
- `pnpm dev`
- `pnpm build`
