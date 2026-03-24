# Architecture: Section-Based Timetable and Attendance

## Status: PROPOSED

---

## 1. System Overview

### Current Data Flow

```
Class (Math Grade 1)
  -> Timetable.classId  (schedules a subject offering)
  -> StudentClass        (empty -- no enrollments)
  -> Attendance.classId  (finds students via StudentClass)
```

### Target Data Flow

```
Section (Grade 1-A)
  -> Timetable.sectionId + subjectId  (section has Science in Period 2)
  -> Student.sectionId                 (30 students belong to this section)
  -> Attendance.sectionId              (take attendance for section roster)
```

### Conceptual Model

```
Section "Grade 1-A"  (30 students enrolled via Student.sectionId)
  |
  +-- Timetable Slot: Sunday Period 1 = Arabic, Room 101, Teacher Ahmed
  +-- Timetable Slot: Sunday Period 2 = Science, Lab A, Teacher Sara
  +-- Timetable Slot: Sunday Period 3 = Math, Room 101, Teacher Khalid
  +-- Timetable Slot: Monday Period 1 = English, Room 101, Teacher Fatima
  ...

  Attendance for Sunday:
    - Query: Student WHERE sectionId = "Grade 1-A"
    - Returns: 30 students
    - Teacher marks each present/absent/late
```

---

## 2. Schema Changes (Phase 1)

### 2.1 Timetable Model -- Add sectionId and subjectId

**File:** `prisma/models/timetable.prisma`

```prisma
model Timetable {
  id          String @id @default(cuid())
  schoolId    String
  termId      String
  dayOfWeek   Int
  periodId    String

  // NEW: Section-based scheduling (primary key for new slots)
  sectionId   String?           // The section being scheduled (Grade 1-A)
  subjectId   String?           // CatalogSubject being taught

  // EXISTING: Kept optional for backward compatibility
  classId     String?           // Legacy: links to Class (subject offering)

  teacherId   String?
  classroomId String
  weekOffset  Int    @default(0)

  // Constraint validation metadata (unchanged)
  rotationWeek         Int       @default(0)
  constraintViolations Json      @default("[]")
  lastValidatedAt      DateTime?
  templateSlotId       String?

  // Relations
  school    School          @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  term      Term            @relation(fields: [termId], references: [id])
  period    Period          @relation(fields: [periodId], references: [id])
  section   Section?        @relation(fields: [sectionId], references: [id])
  subject   CatalogSubject? @relation(fields: [subjectId], references: [id])
  class     Class?          @relation(fields: [classId], references: [id])
  teacher   Teacher?        @relation(fields: [teacherId], references: [id])
  classroom Classroom       @relation(fields: [classroomId], references: [id])

  substitutionRecords SubstitutionRecord[] @relation("OriginalSlot")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // UPDATED unique constraint: section-based (new slots)
  // Keep old constraint for legacy data
  @@unique([schoolId, termId, dayOfWeek, periodId, classId, weekOffset])
  @@unique([schoolId, termId, dayOfWeek, periodId, sectionId, weekOffset])
  @@unique([schoolId, termId, dayOfWeek, periodId, classroomId, weekOffset])

  // NEW indexes
  @@index([schoolId, termId, sectionId])
  @@index([schoolId, termId, sectionId, dayOfWeek])
  @@index([schoolId, termId, subjectId])

  // EXISTING indexes (unchanged)
  @@index([schoolId, termId, dayOfWeek, periodId, teacherId])
  @@index([schoolId, termId, dayOfWeek])
  @@index([schoolId, termId, periodId])
  @@index([schoolId, termId, weekOffset])
  @@index([schoolId, termId, teacherId])
  @@index([schoolId, termId, classId])
  @@index([schoolId, termId, classroomId])
  @@index([schoolId, termId, dayOfWeek, periodId])
  @@index([schoolId, termId, teacherId, dayOfWeek])
  @@index([schoolId, termId, classId, dayOfWeek])
  @@map("timetables")
}
```

### 2.2 Section Model -- Add timetables relation

**File:** `prisma/models/classrooms.prisma`

Add reverse relation to Section:

```prisma
model Section {
  // ... existing fields ...
  timetables  Timetable[]   // NEW: reverse relation
}
```

### 2.3 CatalogSubject Model -- Add timetables relation

**File:** `prisma/models/catalog.prisma`

Add reverse relation to CatalogSubject:

```prisma
model CatalogSubject {
  // ... existing fields ...
  timetableSlots  Timetable[]  // NEW: reverse relation for section-based scheduling
}
```

### 2.4 Attendance Model -- Add optional sectionId

**File:** `prisma/models/attendance.prisma`

```prisma
model Attendance {
  // ... existing fields ...
  classId      String?           // Make optional (was required)
  sectionId    String?           // NEW: section-based attendance

  // Update relation to optional
  class   Class?   @relation(fields: [classId], references: [id], onDelete: Cascade)
  section Section? @relation(fields: [sectionId], references: [id], onDelete: Cascade)

  // UPDATED unique: support both class-based and section-based
  @@unique([schoolId, studentId, classId, date, periodId])
  @@unique([schoolId, studentId, sectionId, date, periodId])

  // NEW index
  @@index([schoolId, sectionId, date])
  @@index([sectionId])
}
```

### 2.5 Section Model -- Add attendance relation

**File:** `prisma/models/classrooms.prisma`

```prisma
model Section {
  // ... existing fields ...
  attendances Attendance[]  // NEW
}
```

### 2.6 Migration Strategy

**Critical rule: Additive only.**

1. Add `sectionId String?` and `subjectId String?` to Timetable (nullable)
2. Make `classId` optional on Timetable (was required)
3. Add `sectionId String?` to Attendance (nullable)
4. Make `classId` optional on Attendance (was required)
5. Add new unique constraints and indexes
6. Run `prisma db push` and review warnings
7. Existing 750 slots keep their `classId` -- `sectionId` is null on old data

**Data backfill (deferred, not blocking):**

- After migration, a one-time script can populate `sectionId` on existing timetable slots by matching `Class.gradeId` to `Section.gradeId`
- Not required for launch; old slots render with classId, new slots use sectionId

---

## 3. Timetable Generation Algorithm (Phase 2)

### 3.1 Current Algorithm Concept

**File:** `src/components/school-dashboard/timetable/generate/algorithm.ts`

Currently:

- Input: `ClassRequirement[]` where each requirement is a subject-class with `classId`
- Output: `GeneratedSlot[]` with `classId`
- Process: For each class (subject offering), find teacher + room + time slot

### 3.2 New Algorithm Concept: Section-First Scheduling

The algorithm inverts: instead of "schedule each subject class," it becomes "for each section, fill its weekly timetable with subjects."

**New input type:**

```typescript
export interface SectionRequirement {
  sectionId: string
  sectionName: string // "Grade 1-A"
  gradeId: string
  studentCount: number
  defaultClassroomId?: string // Section's homeroom
  subjects: SubjectAllocation[]
}

export interface SubjectAllocation {
  subjectId: string
  subjectName: string
  periodsPerWeek: number // From SchoolSubjectSelection.weeklyPeriods
  requiresLab: boolean
  preferredTeacherIds: string[] // Teachers with expertise in this subject
}
```

**New output type:**

```typescript
export interface GeneratedSlot {
  dayOfWeek: number
  periodId: string
  sectionId: string // NEW: which section
  subjectId: string // NEW: which subject
  classId: string // KEPT: for backward compat, derived from section+subject
  teacherId: string | null
  classroomId: string
  score: number
  violations: string[]
}
```

**Algorithm change summary:**

1. Fetch all sections with enrolled student count
2. For each section, get its grade's subject allocations (from SchoolSubjectSelection)
3. Build `SectionRequirement[]` -- one per section, containing all subjects for that grade
4. For each section, iterate through its subject allocations:
   - For each subject needing N periods/week, find N valid (day, period) slots
   - Assign teacher from qualified pool
   - Assign classroom: use section's homeroom for regular subjects, use lab/gym for specialized
5. Run conflict detection and optimization (existing phases 2-3 remain largely unchanged)

### 3.3 Specific Changes to algorithm.ts

**Replace `ClassRequirement` with `SectionRequirement`:**

| Old field             | New field                        | Notes                         |
| --------------------- | -------------------------------- | ----------------------------- |
| `classId`             | `sectionId`                      | Primary scheduling unit       |
| `subjectId`           | nested in `subjects[]`           | Multiple subjects per section |
| `hoursPerWeek`        | `subjects[].periodsPerWeek`      | Per-subject within section    |
| `preferredTeacherIds` | `subjects[].preferredTeacherIds` | Per-subject                   |
| `studentCount`        | `studentCount`                   | Section enrollment count      |

**Replace `AlgorithmState` key:**

- Old: `"day:period:class"`
- New: `"day:period:section"` (a section can only be in one place at a time)

**New scheduling loop:**

```typescript
for (const section of sortedSections) {
  for (const subject of section.subjects) {
    const placed = placeSubjectForSection(
      section,
      subject,
      state,
      config,
      teacherMap,
      roomMap
    )
    if (placed < subject.periodsPerWeek) {
      warnings.push(
        `Could not fully schedule ${subject.subjectName} for ${section.sectionName}`
      )
    }
  }
}
```

**Section conflict rule (new):**

- A section cannot be in two places at the same time
- `sectionSchedule` map: `sectionId -> day -> [periodIds]`
- Before placing: check `isSectionScheduled(sectionId, day, periodId, state)`

---

## 4. Timetable Actions and UI (Phase 3)

### 4.1 Server Actions Changes

**File:** `src/components/school-dashboard/timetable/actions.ts`

#### 4.1.1 `generateTimetablePreview` (line 3606)

**Current:** Queries `db.class.findMany()` to build `ClassRequirement[]`
**New:** Queries `db.section.findMany()` to build `SectionRequirement[]`

Specific changes:

- Replace `db.class.findMany({where: {schoolId, termId}})` with `db.section.findMany({where: {schoolId}, include: {students: {select: {id: true}}, grade: true}})`
- For each section, look up grade's subject allocations via `db.schoolSubjectSelection.findMany({where: {schoolId, gradeId, isActive: true}})`
- Build `SectionRequirement` with nested `SubjectAllocation[]`
- Pass to updated algorithm
- Map results back: `GeneratedSlot` now includes `sectionId` + `subjectId`

#### 4.1.2 `applyGeneratedTimetable` (line 3894)

**Current:** Creates Timetable rows with `classId`
**New:** Creates Timetable rows with `sectionId` + `subjectId`, optionally resolving `classId` for backward compat

```typescript
const slotData = input.slots.map((slot) => ({
  schoolId,
  termId: input.termId,
  dayOfWeek: slot.dayOfWeek,
  periodId: slot.periodId,
  sectionId: slot.sectionId, // NEW
  subjectId: slot.subjectId, // NEW
  classId: slot.classId ?? undefined, // Optional backward compat
  teacherId: slot.teacherId ?? undefined,
  classroomId: slot.classroomId,
  weekOffset: 0,
  constraintViolations: slot.violations,
}))
```

#### 4.1.3 `getWeeklyTimetable`

**Current:** Returns slots with class info
**New:** Returns slots with section info + subject info, falling back to class info for legacy slots

The select clause needs to add:

```typescript
section: { select: { id: true, name: true, letter: true, gradeId: true } },
subject: { select: { id: true, name: true } },
```

#### 4.1.4 `getClassesForSelection` (timetable context)

**Current:** Returns Class list for dropdown
**New:** Returns Section list for dropdown (rename to `getSectionsForSelection`)

#### 4.1.5 `getTimetableByClass`

**Current:** Filters by `classId`
**New:** Add parallel `getTimetableBySection` that filters by `sectionId`. Keep old function for backward compat.

#### 4.1.6 `upsertTimetableSlot`

**Current:** Requires `classId`
**New:** Accepts either `classId` OR `sectionId` + `subjectId`

#### 4.1.7 `suggestFreeSlots`

**Current:** Finds free slots by class
**New:** Add section-based free slot suggestion

#### 4.1.8 `detectTimetableConflicts`

**Current:** Detects teacher and room double-booking
**New:** Also detect section double-booking (section in two places same period)

### 4.2 Type Changes

**File:** `src/components/school-dashboard/timetable/types.ts`

```typescript
export interface TimetableSlot {
  id: string
  schoolId: string
  termId: string
  dayOfWeek: number
  periodId: string
  sectionId?: string // NEW
  subjectId?: string // NEW (CatalogSubject ID)
  classId?: string // Now optional
  teacherId?: string
  classroomId?: string
  weekOffset: number
  // ... rest unchanged
}

// NEW type for section info in UI
export interface SectionInfo {
  id: string
  name: string // "Grade 1-A"
  letter: string // "A"
  gradeId: string
  gradeName: string
  studentCount: number
  homeroomTeacherId?: string
  classroomId?: string
}
```

### 4.3 Validation Changes

**File:** `src/components/school-dashboard/timetable/validation.ts`

Update `upsertTimetableSlotSchema`:

- Make `classId` optional
- Add `sectionId: cuidSchema.optional()`
- Add `subjectId: cuidSchema.optional()`
- Add refinement: at least one of `classId` or `sectionId` must be present

### 4.4 UI Component Changes

#### Files that reference `classId` (29 files -- not all need changes):

**Must change (core logic):**

| File                          | Change                                                             |
| ----------------------------- | ------------------------------------------------------------------ |
| `by-class/content.tsx`        | Rename/duplicate to `by-section/content.tsx`; add section dropdown |
| `slot-editor.tsx`             | Add section + subject fields to slot editor form                   |
| `slot-editor-dialog.tsx`      | Pass section/subject to editor                                     |
| `timetable-grid-enhanced.tsx` | Display section name + subject instead of class name               |
| `views/admin-view.tsx`        | Add "By Section" tab alongside "By Class"                          |
| `views/student-view.tsx`      | Query by student's sectionId                                       |
| `views/teacher-view.tsx`      | Group by section in teacher view                                   |
| `generate/content.tsx`        | Preview table: show section + subject columns                      |
| `import-export.tsx`           | Support section-based import format                                |
| `visual-builder.tsx`          | Section-based drag-and-drop                                        |
| `analytics-reports.tsx`       | Section utilization metrics                                        |

**Minor changes (display only):**

| File                     | Change                                                                  |
| ------------------------ | ----------------------------------------------------------------------- |
| `timetable-cell.tsx`     | Show `sectionName + subjectName` if available, fall back to `className` |
| `timetable-header.tsx`   | Support section name in header                                          |
| `subject-selector.tsx`   | No change (already subject-based)                                       |
| `by-teacher/content.tsx` | Show section name in teacher view slots                                 |
| `by-room/content.tsx`    | Show section name in room view slots                                    |
| `conflicts/content.tsx`  | Show section info in conflict display                                   |

**No changes needed:**

| File                           | Reason                     |
| ------------------------------ | -------------------------- |
| `print.css`                    | CSS only                   |
| `use-mobile.tsx`               | Hook, no data dependency   |
| `use-toast.ts`                 | Hook                       |
| `use-media-query.ts`           | Hook                       |
| `use-timetable-permissions.ts` | Permission logic unchanged |
| `theme-provider.tsx`           | UI utility                 |
| `constants.ts`                 | Static constants           |
| `config.ts`                    | Navigation config          |
| `about-hover-card.tsx`         | Static content             |

### 4.5 Seed Utilities

**File:** `src/components/school-dashboard/timetable/seed-utils.ts`

Update `TimetableSlot` interface and generation functions to produce `sectionId`-based slots.

### 4.6 Test Changes

**Files:**

- `__tests__/actions.test.ts` -- Add section-based test cases alongside class-based
- `__tests__/validation.test.ts` -- Test new schema rules (sectionId/classId union)
- `__tests__/structures.test.ts` -- If structures reference classId
- `__tests__/production-readiness.test.ts` -- Verify backward compat

---

## 5. Attendance System (Phase 4)

### 5.1 Core Actions

**File:** `src/components/school-dashboard/attendance/actions/core.ts`

#### 5.1.1 `getClassesForSelection` -> `getSectionsForSelection`

**Current (line 555):** Queries `db.class.findMany()` returning classes with teacher names

**New:** Queries `db.section.findMany()` returning sections with homeroom teacher and student count

```typescript
export async function getSectionsForSelection(input?: {
  gradeId?: string
}): Promise<ActionResponse<{
  sections: Array<{
    id: string
    name: string           // "Grade 1-A"
    studentCount: number
    homeroomTeacher: string | null
    gradeId: string
    gradeName: string | null
  }>
}>> {
  const { schoolId } = await getTenantContext()
  // Teacher scoping: homeroom teachers see their sections
  // Admin sees all
  const sections = await db.section.findMany({
    where: { schoolId, ...(input?.gradeId ? { gradeId: input.gradeId } : {}) },
    orderBy: { name: "asc" },
    include: {
      grade: { select: { name: true } },
      homeroomTeacher: { select: { givenName: true, surname: true } },
      _count: { select: { students: true } },
    },
  })
  // For TEACHER role: filter to sections where teacher is homeroom
  // or where teacher has timetable slots
  return { success: true, data: { sections: sections.map(...) } }
}
```

**Keep `getClassesForSelection`** for backward compat, but mark as `@deprecated`.

#### 5.1.2 `getAttendanceList`

**Current (line 438):** Takes `classId`, queries `StudentClass` for roster

**New:** Takes `sectionId` OR `classId`, queries `Student` by sectionId for roster

```typescript
export async function getAttendanceList(input: {
  sectionId?: string // NEW: preferred
  classId?: string // LEGACY: backward compat
  date: string
  lang?: string
}): Promise<ActionResponse<{ rows: AttendanceRow[] }>> {
  // If sectionId provided, query by section
  if (input.sectionId) {
    const students = await db.student.findMany({
      where: { schoolId, sectionId: input.sectionId, status: "ACTIVE" },
      select: { id: true, givenName: true, surname: true, userId: true },
    })
    const marks = await db.attendance.findMany({
      where: { schoolId, sectionId: input.sectionId, date, deletedAt: null },
    })
    // ... merge students with marks
  }
  // Else fall back to classId (legacy path)
  // ... existing StudentClass logic
}
```

#### 5.1.3 `markAttendance`

**Current:** Takes `classId`, creates `Attendance` with `classId`

**New:** Takes `sectionId` OR `classId`

```typescript
export async function markAttendance(input: {
  sectionId?: string // NEW
  classId?: string // LEGACY
  date: string
  records: Array<{ studentId: string; status: string }>
}): Promise<ActionResponse<{ markedCount: number }>>
```

When creating attendance records:

```typescript
{
  schoolId,
  studentId,
  sectionId: input.sectionId,     // NEW
  classId: input.classId,         // LEGACY
  date: parsedDate,
  status: record.status,
}
```

#### 5.1.4 `quickMarkAllPresent`

Same pattern: accept `sectionId` OR `classId`.

### 5.2 Attendance Content Component

**File:** `src/components/school-dashboard/attendance/content.tsx`

**Current:** Dropdown shows classes, selected classId drives roster loading

**Changes:**

- Dropdown shows sections instead of classes (call `getSectionsForSelection`)
- State: `sectionId` instead of `classId`
- Load call: `getAttendanceList({ sectionId, date })`
- Submit call: `markAttendance({ sectionId, date, records })`
- Smart auto-select: use current period's section (from timetable) instead of class

### 5.3 Other Attendance Files Needing Updates

| File                        | What references classId / StudentClass                                | Change needed                             |
| --------------------------- | --------------------------------------------------------------------- | ----------------------------------------- |
| `actions/analytics.ts`      | `getClassComparisonStats`, `getStudentsAtRisk` query `studentClasses` | Query by `sectionId`                      |
| `actions/dashboard.ts`      | `getTodaysDashboard` uses `studentClasses` for class names            | Use `section.name`                        |
| `actions/master.ts`         | `syncMasterToClassAttendance` queries `studentClass`                  | Query `Student.sectionId`                 |
| `actions/periods.ts`        | `getPeriodsForClass` uses classId                                     | Add `getPeriodsForSection`                |
| `actions/records.ts`        | `getStudentAttendanceRecords` includes `studentClasses`               | Include `section`                         |
| `actions/compliance.ts`     | `studentClass.groupBy` for compliance reporting                       | Group by `sectionId`                      |
| `actions/bulk.ts`           | Bulk upload references classId                                        | Accept sectionId                          |
| `actions/excuses.ts`        | Links to attendance records (no class reference in excuses)           | No change                                 |
| `actions/interventions.ts`  | Displays `studentClasses[0]?.class.name`                              | Display `student.section?.name`           |
| `attendance-stats.ts`       | `studentClass.findMany` for enrollment counts                         | Use `student.count({where: {sectionId}})` |
| `gamification/actions.ts`   | `studentClass.count` for class competition                            | Section competition                       |
| `geofencee/geo-service.ts`  | `studentClass.findFirst` for auto-attendance                          | Use `Student.sectionId`                   |
| `kiosk/actions.ts`          | `studentClasses[0]?.classId` for kiosk check-in                       | Use `student.sectionId`                   |
| `letters/actions.ts`        | `studentClasses[0]?.class?.name` for letter generation                | Use `student.section?.name`               |
| `content.tsx`               | Main component: class dropdown, classId state                         | Section dropdown, sectionId state         |
| `recent/content.tsx`        | Uses `getClassesForSelection`                                         | Use `getSectionsForSelection`             |
| `reports/content.tsx`       | Uses `getClassesForSelection`                                         | Use `getSectionsForSelection`             |
| `early-warning/content.tsx` | Uses `getClassesForSelection`                                         | Use `getSectionsForSelection`             |
| `analytics/content.tsx`     | Uses `getClassesForSelection`                                         | Use `getSectionsForSelection`             |
| `bulk-upload/content.tsx`   | Uses `getClassesForSelection`                                         | Use `getSectionsForSelection`             |
| `overview/content.tsx`      | May reference classes                                                 | Check and update                          |

### 5.4 QR Code and Hall Pass Models

**Files:** `prisma/models/attendance.prisma`

- `QRCodeSession.classId` -- add optional `sectionId` field
- `HallPass.classId` -- add optional `sectionId` field
- Both: make `classId` optional, add `sectionId` optional

---

## 6. ADR: Why Section-Based, Not Class-Based

### ADR-001: Section as Scheduling Unit

**Status:** Proposed

**Context:**
K-12 schools operate by sections (homerooms). Grade 1 may have sections A, B, C. Each section of ~30 students follows the same daily schedule. The current model treats subject offerings (Class = "Math Grade 1") as the scheduling unit, which:

1. Requires a separate `StudentClass` enrollment per subject per student (240 records per student if 20 subjects)
2. Does not model the reality that the same 30 students move together
3. Makes attendance cumbersome -- teacher must select a subject class, not their section

**Decision:**
Make `Section` the primary scheduling and attendance unit. Timetable slots describe "what this section does at this time." Shared spaces (lab, gym) are just `classroomId` on the slot -- not separate scheduling entities.

**Consequences:**

- StudentClass join table becomes irrelevant for attendance (but stays for grade tracking in higher ed scenarios)
- Each section has N timetable slots per day (one per period), making the total slot count = sections x periods x days
- Teacher assignment is per-slot, not per-class, enabling flexible teacher rotation
- Backward-compatible: old classId-based slots still render

---

## 7. Security Considerations

- All new queries MUST include `schoolId` from `getTenantContext()`
- Section queries: `db.section.findMany({ where: { schoolId, ... } })`
- Attendance with sectionId: `@@index([schoolId, sectionId, date])` ensures tenant-scoped queries are fast
- Teacher scoping: teachers only see sections where they are homeroom teacher or have timetable slots
- Student scoping: students only see their own section's timetable

---

## 8. Performance Considerations

### New Indexes

All added in Phase 1 schema migration:

```
@@index([schoolId, termId, sectionId])           -- Timetable by section
@@index([schoolId, termId, sectionId, dayOfWeek]) -- Section's daily schedule
@@index([schoolId, termId, subjectId])            -- Subject usage across timetable
@@index([schoolId, sectionId, date])              -- Attendance by section+date
@@index([sectionId])                              -- Attendance section lookup
```

### Query Performance

- Section roster: `Student WHERE sectionId = X AND schoolId = Y` -- single index scan, O(1) for ~30 students
- Daily timetable for section: `Timetable WHERE sectionId = X AND dayOfWeek = D` -- index scan, ~7 rows
- Attendance for section+date: `Attendance WHERE sectionId = X AND date = D` -- index scan, ~30 rows

All dramatically simpler than the current StudentClass join table approach.

---

## 9. Testing Strategy

### Unit Tests

- Algorithm: `SectionRequirement` input produces valid `GeneratedSlot[]` with sectionId
- Validation: sectionId/classId union validation works correctly
- Type guards: slots with sectionId vs classId are handled

### Integration Tests

- Generation: full cycle from sections -> algorithm -> database
- Attendance: section-based roster loading
- Backward compat: old classId slots still render and function

### Manual Testing

- Admin: generate section-based timetable, verify grid display
- Teacher: open attendance for homeroom section, mark students
- Student: view own section's timetable
- Production data: verify 750 existing slots still display correctly

---

## 10. Migration Path

### Step 1: Schema Migration (Zero downtime)

```sql
-- All additive, no drops
ALTER TABLE timetables ADD COLUMN "sectionId" TEXT;
ALTER TABLE timetables ADD COLUMN "subjectId" TEXT;
ALTER TABLE timetables ALTER COLUMN "classId" DROP NOT NULL;
ALTER TABLE attendances ADD COLUMN "sectionId" TEXT;
ALTER TABLE attendances ALTER COLUMN "classId" DROP NOT NULL;
-- Add FK constraints, indexes, unique constraints
```

### Step 2: Code Deployment

Deploy new code that handles both classId and sectionId paths. All existing functionality works because:

- Existing slots have classId (not null) and sectionId (null) -- old code path used
- New slots will have sectionId (not null) -- new code path used
- UI components check: `slot.sectionId ? showSection : showClass`

### Step 3: Data Backfill (Optional, can be deferred)

Script to populate sectionId on existing timetable slots by matching Class.gradeId to Section.gradeId + inferring section letter. Not blocking -- production works without it.

### Step 4: Deprecation (Future)

After all schools have section-based timetables:

- Mark classId-based paths as deprecated
- Deprecation warnings in admin UI
- Eventually remove in major version

---

## 11. Deployment Plan

1. Create Neon branch for testing
2. Apply schema migration on branch
3. Test with existing data (750 slots render correctly)
4. Test new section-based generation
5. Apply to production
6. Monitor for errors
7. Backfill existing data (optional)
