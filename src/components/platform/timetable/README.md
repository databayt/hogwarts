## Timetable — Admin School Schedule Management

**Admin Control Center for Weekly Schedule Building**

The Timetable feature empowers school administrators to create, manage, and print weekly schedules for classes and teachers with intelligent conflict detection and flexible configuration.

> **📌 Status Update (2025-10-21):** Timetable fixed and production-ready! Server actions implementation complete. See [TIMETABLE_REVIEW.md](../../../TIMETABLE_REVIEW.md) for comprehensive analysis and optimization plan.

### What Admins Can Do

**Core Capabilities:**
- 📅 Build weekly schedules with drag-and-drop or click-to-assign
- 🔧 Configure flexible working days (Sun-Thu, Mon-Fri, custom weekends)
- 🍽️ Set lunch break positions (after period 2, 3, or 4)
- ⚠️ Detect scheduling conflicts (teacher double-booking, room conflicts, class overlaps)
- 👁️ View schedules by class OR by teacher
- 🖨️ Print A4-ready schedules for distribution
- 📊 Manage multiple terms with independent schedules
- 🔄 Swap slots and resolve conflicts with suggestions

### What Teachers Can Do
- ✅ View their personal teaching schedule
- ✅ See which classes they teach and when
- ✅ Print their weekly timetable
- ❌ Cannot modify the timetable (admin-only)

### What Students Can View
- ✅ See their class timetable
- ✅ Know when and where each subject takes place
- ❌ Cannot modify or view other classes

### Current Implementation Status
**Production-Ready MVP ✅** (Fixed 2025-10-21)

**Completed:**
- ✅ Weekly schedule builder UI with visual grid
- ✅ Flexible working days configuration (supports Sun-Thu, Mon-Fri, custom)
- ✅ Lunch break positioning (configurable per school/term)
- ✅ Conflict detection engine (teacher/room/class double-booking)
- ✅ Class view and teacher view switching
- ✅ A4 print-ready output with proper styling
- ✅ Term-based schedules (different schedule per term)
- ✅ Multi-tenant isolation (schoolId scoping)
- ✅ Slot editor with suggestions for free periods
- ✅ Server actions with proper validation
- ✅ **Fixed server action data loading** (replaced API routes)
- ✅ **Typography system compliance** (semantic HTML)
- ✅ **TypeScript strict mode** (no any violations)

**Optimization Opportunities:**
- 🔄 Migrate to Zustand store (from multiple useState)
- 🔄 Add component memoization for performance
- 🔄 Implement virtual scrolling for large timetables
- 🔄 Add progressive loading strategy
- 🚧 Drag-and-drop slot editor (currently click-based)
- 🚧 Mobile-optimized view
- 🚧 Accessibility improvements (ARIA grid pattern)

**Planned:**
- ⏸️ Recurring event exceptions (holidays, special schedules)
- ⏸️ Teacher preference tracking
- ⏸️ Automated scheduling AI suggestions

---

## Admin Workflows

### 1. Initial Timetable Setup
**Prerequisites:** Classes, teachers, subjects, and periods already configured

1. Navigate to `/timetable`
2. Select academic term (e.g., Fall 2024)
3. Click "Schedule Settings"
   - Set working days (e.g., Sunday-Thursday for Arabic schools, Monday-Friday for others)
   - Set lunch break position (after period 2, 3, or 4)
   - Save configuration
4. Select grade/class to schedule (e.g., Grade 1A)
5. View empty timetable grid with configured days and periods

### 2. Assign Classes to Time Slots
**Two Methods:**

**Method A: Click-Based (Current)**
1. Click on an empty cell in the timetable grid
2. Slot editor dialog opens
3. Select:
   - Subject (e.g., Mathematics)
   - Teacher (e.g., Ahmed Hassan)
   - Classroom (e.g., Room 101)
4. Click "Save"
5. System validates and checks for conflicts
6. Slot appears in grid with subject and teacher name

**Method B: Drag-and-Drop (Planned)**
1. Drag subject card from sidebar
2. Drop onto time slot
3. Auto-assigns default teacher and room
4. Edit details if needed

### 3. Resolve Scheduling Conflicts
1. System detects conflicts automatically:
   - **Teacher Conflict:** Same teacher in two classes at once
   - **Room Conflict:** Same room booked twice
   - **Class Conflict:** Class scheduled in multiple places
2. Conflicts badge appears in header (e.g., "3 Conflicts")
3. Click "View Conflicts" button
4. Conflicts drawer shows:
   - Type (Teacher/Room/Class)
   - Affected classes
   - Suggested solutions
5. Click "Resolve" on a conflict:
   - Shows free time slots for teacher/room
   - Click suggestion to auto-swap
6. Re-check conflicts until zero

### 4. Switch Between Views
**Class View (Default):**
- Shows what one class has throughout the week
- Select class from dropdown (Grade 1A, 1B, 2A, etc.)
- See all subjects this class takes

**Teacher View:**
- Shows what one teacher teaches throughout the week
- Select teacher from dropdown
- See all classes they teach

### 5. Print Timetables
1. Ensure timetable is complete and conflict-free
2. Click "Print" button
3. Browser print dialog opens
4. Select:
   - Portrait or Landscape
   - A4 paper size
5. Print preview shows:
   - School name and logo
   - Term and class/teacher name
   - Clean grid with subjects and times
6. Print or save as PDF

### 6. Manage Multiple Terms
Each term can have a different timetable:
1. Term 1 (Fall): Full schedule with all subjects
2. Term 2 (Spring): Adjusted for exam periods
3. Term 3 (Summer): Short schedule

Switch terms using term selector dropdown.

### 7. Copy Schedule from Previous Term
**Planned Feature:**
1. Click "Copy from Term"
2. Select source term
3. System duplicates all slots
4. Review and adjust as needed
5. Save new term's schedule

---

## Integration with Other Features

### Links to Classes
- Timetable slots reference Class entities
- Clicking a slot can navigate to class details
- Shows enrolled students and teacher assignment

### Links to Teachers
- Teacher view shows their full teaching load
- Helps balance workload across staff
- Identifies free periods for meetings

### Links to Attendance
- Attendance module uses timetable to show period-by-period roster
- Knows which class is active at current time
- Auto-suggests class for attendance marking

### Links to Lessons
- Lesson plans can be linked to timetable slots
- Teachers see what to prepare for each period
- Students see lesson materials for upcoming classes

---

## Technical Implementation

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

---

## Technology Stack & Dependencies

This feature is built with the following technologies (see [Platform README](../README.md) for complete stack details):

### Core Framework
- **Next.js 15.4+** - App Router with Server Components ([Docs](https://nextjs.org/docs))
- **React 19+** - Server Actions, new hooks (`useActionState`, `useFormStatus`) ([Docs](https://react.dev))
- **TypeScript** - Strict mode for type safety

### Database & ORM
- **Neon PostgreSQL** - Serverless database with autoscaling ([Docs](https://neon.tech/docs/introduction))
- **Prisma ORM 6.14+** - Type-safe queries and migrations ([Docs](https://www.prisma.io/docs))

### Forms & Validation
- **React Hook Form 7.61+** - Performant form state management ([Docs](https://react-hook-form.com))
- **Zod 4.0+** - Runtime schema validation (client + server) ([Docs](https://zod.dev))

### UI Components
- **shadcn/ui** - Accessible components built on Radix UI ([Docs](https://ui.shadcn.com/docs))
- **TanStack Table 8.21+** - Headless table with sorting/filtering ([Docs](https://tanstack.com/table))
- **Tailwind CSS 4** - Utility-first styling ([Docs](https://tailwindcss.com/docs))

### Server Actions Pattern
All mutations follow the standard server action pattern:
```typescript
"use server"
export async function performAction(input: FormData) {
  const { schoolId } = await getTenantContext()
  const validated = schema.parse(input)
  await db.model.create({ data: { ...validated, schoolId } })
  revalidatePath('/feature-path')
  return { success: true }
}
```

### Key Features
- **Multi-Tenant Isolation**: All queries scoped by `schoolId`
- **Type Safety**: End-to-end TypeScript with Prisma + Zod inference
- **Server-Side Operations**: Mutations via Next.js Server Actions
- **URL State Management**: Filters and pagination synced to URL (where applicable)
- **Accessibility**: ARIA labels, keyboard navigation, semantic HTML

For complete technology documentation, see [Platform Technology Stack](../README.md#technology-stack--documentation).

---
