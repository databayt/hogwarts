## Timetable — Implementation Plan (MVP → Production)

This document outlines how to finish and ship the Timetable feature following our multi‑tenant rules, shadcn/ui conventions, and server actions patterns.

### Current State (as of this branch)
- UI (client):
  - `content.tsx` renders header, grid, config dialog, print styles.
  - `timetable.ts` uses a Zustand store, cookies for user overrides and selected class config.
  - `config.json` toggles dev/prod API and `useLocalJson`; grid renders from a JSON shape `{ day_time, timetable, update_date }`.
  - Teacher info overrides are stored in cookies per subject and masked to 4 chars in cells.
  - Print styles ready in `print.css`.
- Server actions:
  - `detectTimetableConflicts` (teacher/room) using `Class`, `Period`, `Teacher`, `Classroom`.
  - `getTermsForSelection` to list terms for the current tenant.
- Prisma (relevant models):
  - `School`, `SchoolYear`, `Term`, `Period` (time-of-day only), `Department`, `Subject`, `Teacher`, `Classroom`, `Class`, and enrollments.
- Gaps:
  - No weekly day-of-week placement in DB; `Class` holds subject/teacher/period ranges but not day-of-week or per-slot rows.
  - UI fetches JSON (local or external API); no internal API/server action that produces the UI JSON shape.
  - Teacher info overrides are client-only (OK for MVP) but not persisted server-side.

### Goal
- Deliver a weekly timetable per class and teacher with conflict detection and basic admin management, fully tenant-scoped by `schoolId`.
- Support flexible school schedules (custom work days/weekends and lunch break positions per school/grade/class).
- Provide high-quality A4 printouts.

---

## Data Model

To represent weekly placements, introduce a dedicated slot model that maps a class to a specific day and period. Add schedule configuration to support variable work days and lunch breaks.

- Add `Timetable` (weekly slot):
  - Fields: `id`, `schoolId`, `termId`, `dayOfWeek` (0=Sun..6=Sat), `periodId`, `classId`, `teacherId`, `classroomId`, `weekOffset?` (0|1)
  - Multi-tenant constraints and conflict guards:
    - `@@unique([schoolId, termId, dayOfWeek, periodId, classId])`
    - `@@unique([schoolId, termId, dayOfWeek, periodId, teacherId])`
    - `@@unique([schoolId, termId, dayOfWeek, periodId, classroomId])`
  - Indexes for fast lookups by `schoolId`, `termId`, `dayOfWeek`, `periodId`.

- Add `SchoolWeekConfig` (per school; optional per term override):
  - Fields: `id`, `schoolId`, `termId?`, `workingDays` (int[] e.g., [0,1,2,3,4] or bitmask), `defaultLunchAfterPeriod?` (number), `extraLunchRules?` (JSON for day-specific lunch or multiple breaks)
  - Uniqueness: `@@unique([schoolId, termId])` so each term can override school default.

- Optional overrides (future-friendly, can be added after MVP):
  - `GradeScheduleConfig` with `yearLevelId` for grade-level overrides
  - `ClassScheduleConfig` with `classId` for per-class overrides (e.g., lunch after 2 periods for Class 1A)

Notes:
- We already have `Period` (time-of-day) and `YearLevel`; `Timetable` adds day-of-week. Lunch breaks will be rendered from config rather than stored as slots.
- If grouping timetables by grade is required, consider adding `yearLevelId` to `Class` (optional enhancement) or infer by naming in MVP.

## Server Actions (typed, tenant-scoped)
- `getScheduleConfig({ termId })`
  - Returns working days and lunch policy resolved in priority: Class → Grade → Term/School → Default.
- `getWeeklyTimetable(params)`
  - Input: `{ termId: string, weekOffset?: 0|1, view?: { classId?: string; teacherId?: string } }`
  - Output: shape matching current UI expectations:
    ```ts
    type TimetableCell = {
      period: number
      subject: string
      teacher: string
      replaced: boolean
      original: { period: number; subject: string; teacher: string } | null
    }
    type TimetableData = {
      days: number[] // e.g., [0,1,2,3,4] (Sun..Thu) from config
      day_time: string[] // ['1(08:00~08:45)', '2(08:50~09:35)', ...]
      timetable: TimetableCell[][] // [dayIdx][periodIdx]
      update_date: string
    }
    ```
  - Behavior: query `Period`, `Timetable`, joins to `Class`→`Subject`, `Teacher`, apply resolved `days` from schedule config; insert a synthetic “Lunch” row after the configured period for rendering.
- `upsertTimetableSlot(input)` and optional helpers (`moveSlot`, `swapSlots`)
  - Enforce tenant and conflict guards. Only `ADMIN`/`OWNER` can mutate.
- `detectTimetableConflicts(input)`
  - Extend to check `Timetable` (teacher/room collisions) per `termId` and selected days.
- `getTermsForSelection()`
  - Already present.

All actions:
- Start with "use server".
- Include `schoolId` from `getTenantContext()` in every query.
- Return typed results; no `any`.

## UI Integration
- Dynamic days: Use `getScheduleConfig` to derive which days to render (Fri off; Fri+Sat off; Fri+Sun off; etc.). Remove hardcoded Mon–Fri.
- Lunch insertion: Insert lunch row after the configured period; allow per-class override via store state the same way today’s `lunchAfter` works, but source it from server config.
- Teacher timetables: add a teacher view that calls `getWeeklyTimetable({ view: { teacherId } })` and renders the same grid (teacher’s assigned classes per slot). Consider a route like `/timetable/teacher/[id]` and a selector.
- Grades with multiple classes: support selecting a grade then one of its classes (A/B/C/D). Use server to list classes for a grade if `yearLevelId` is added; otherwise, list classes by naming convention in MVP.
- Keep `teacherInfo` overrides in cookies for MVP.
- Keep `print.css`; provide A4 tuning (see Print section).
- Optional: sync state to URL via `nuqs`.

## Admin Configuration & Conflict Resolution
- Admin UI (settings):
  - Configure working days for a term/school.
  - Configure default lunch position and day-specific breaks.
  - Manage slots (assign class/teacher/room per day/period).
  - Run conflict checker; suggest fixes (e.g., free periods for swap).
- Role gating: only `ADMIN`/`OWNER` access mutations.

## Print (A4)
- Ensure layout fits A4 (portrait by default; optional landscape toggle).
- Print header includes school year, school name, grade/class or teacher name.
- Hide interactive elements; ensure high contrast and readable fonts.
- Page margins and page-break rules for multi-page timetables.

## Seeding (dev/staging)
- Extend `prisma/generator/seed.ts`:
  - 1–2 `SchoolYear` + `Term`, 6–8 `Period`s.
  - Teachers, subjects, classrooms, classes (grades with A/B/C/D sections).
  - `SchoolWeekConfig` with working days like `[0,1,2,3,4]` (Sun–Thu) and lunch after 3rd period.
  - `Timetable` rows covering Sun–Thu; a few overlapping entries for conflict tests.

## Migration Plan
1. Add `Timetable` and `SchoolWeekConfig` models and run Prisma migration.
2. Seed data; validate `detectTimetableConflicts` with slots.
3. Implement `getScheduleConfig` and `getWeeklyTimetable`; wire store to use them.
4. Add teacher view routing and selector.
5. Maintain `useLocalJson` as fallback for demo; default to server once stable.

## Observability & Safety
- Log `requestId` and `schoolId` on server actions.
- Handle errors with toasts; keep UI resilient.
- Enforce tenant scoping in every read/write.

## Testing
- Unit: schedule resolution (days + lunch), formatting, conflict logic.
- Integration: Prisma queries with tenant scoping; overlapping slots create conflicts; different weekend patterns render correct columns.
- Visual: RTL and A4 print snapshots.

## i18n & RTL
- Day labels via i18n; map 0–6 to locale-specific names.
- RTL-friendly layout and print.

## Acceptance Criteria
- Flexible schedule: different schools can configure their working days (e.g., Fri off; Fri+Sat off; Fri+Sun off) and lunch after 2/3/4 periods; class-level overrides supported.
- Timetable views for classes and teachers; grades can have multiple classes (A/B/C/D) selectable.
- Admins configure schedule and slots; conflicts are detected and reported.
- A4 print outputs are clean, readable, and fit the page without clipping.
- All data access is tenant-scoped by `schoolId`.

## Runbook (dev)
- Install deps and generate client:
  - `pnpm install`
  - `pnpm prisma migrate dev`
  - `pnpm prisma generate`
  - `pnpm dev`
- Build:
  - `pnpm build`

## Future Work (post-MVP)
- Drag-and-drop timetable editor with auto-suggestions.
- Persist teacher display name overrides to user profile preferences.
- Exception engine for temporary changes/holidays.
- Attach `yearLevelId` to `Class` for robust grade grouping.
